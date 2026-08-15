-- ================================================================
-- EMBER KEEP — PHASE 11: THE FORGE (REFORGING, ENHANCEMENT, TRANSMUTATION)
-- Execute this script in the Supabase SQL Editor
-- ================================================================

-- 1. Add enhancement and reforge tracking to character_inventories
ALTER TABLE public.character_inventories
  ADD COLUMN IF NOT EXISTS enhancement_level INT DEFAULT 0 CHECK (enhancement_level >= 0),
  ADD COLUMN IF NOT EXISTS reforged_stats JSONB DEFAULT NULL;

-- 2. Atomic Reforge Item RPC
-- Re-rolls bonus stat variance of an equipment item using Refining Flux / Gold
CREATE OR REPLACE FUNCTION public.reforge_item(
    p_character_id UUID,
    p_inventory_item_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_account_id UUID;
    v_char RECORD;
    v_item RECORD;
    v_gold_cost INT := 100;
    v_flux_item RECORD;
    v_power_mult FLOAT;
    v_def_mult FLOAT;
    v_hp_mult FLOAT;
    v_new_reforged JSONB;
BEGIN
    -- Ownership Verification
    SELECT account_id INTO v_account_id FROM public.characters WHERE id = p_character_id;
    IF v_account_id IS NULL OR v_account_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized character ownership.';
    END IF;

    -- Row Lock Character & Inventory Item
    SELECT * INTO v_char FROM public.characters WHERE id = p_character_id FOR UPDATE;
    SELECT * INTO v_item FROM public.character_inventories WHERE id = p_inventory_item_id AND character_id = p_character_id FOR UPDATE;

    IF v_item.id IS NULL THEN
        RAISE EXCEPTION 'Item not found in character inventory.';
    END IF;

    IF v_item.item_type != 'equipment' AND v_item.item_type != 'weapon' AND v_item.item_type != 'armor' THEN
        RAISE EXCEPTION 'Only equipment items can be reforged.';
    END IF;

    IF v_char.gold < v_gold_cost THEN
        RAISE EXCEPTION 'Insufficient gold for reforging. Required: %g', v_gold_cost;
    END IF;

    -- Generate randomized stat multiplier (0.85x to 1.30x)
    v_power_mult := 0.85 + (random() * 0.45);
    v_def_mult   := 0.85 + (random() * 0.45);
    v_hp_mult    := 0.85 + (random() * 0.45);

    v_new_reforged := jsonb_build_object(
      'power_mult', round(v_power_mult::numeric, 2),
      'def_mult',   round(v_def_mult::numeric, 2),
      'hp_mult',    round(v_hp_mult::numeric, 2),
      'reforged_at', NOW()
    );

    -- Deduct Gold & Update Item Reforged Stats
    UPDATE public.characters SET gold = gold - v_gold_cost, updated_at = NOW() WHERE id = p_character_id;

    UPDATE public.character_inventories
    SET reforged_stats = v_new_reforged, updated_at = NOW()
    WHERE id = p_inventory_item_id;

    RETURN jsonb_build_object(
        'success', true,
        'item_id', v_item.item_id,
        'gold_spent', v_gold_cost,
        'reforged_stats', v_new_reforged
    );
END;
$$;

-- 3. Atomic Enhance Item RPC
-- Enhances equipment stats by +10% per level up to +5 max.
-- Success rate: +1 (95%), +2 (85%), +3 (70%), +4 (50%), +5 (30%).
CREATE OR REPLACE FUNCTION public.enhance_item(
    p_character_id UUID,
    p_inventory_item_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_account_id UUID;
    v_char RECORD;
    v_item RECORD;
    v_curr_level INT;
    v_gold_cost INT;
    v_success_rate FLOAT;
    v_roll FLOAT;
    v_success BOOLEAN;
BEGIN
    -- Ownership Verification
    SELECT account_id INTO v_account_id FROM public.characters WHERE id = p_character_id;
    IF v_account_id IS NULL OR v_account_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized character ownership.';
    END IF;

    SELECT * INTO v_char FROM public.characters WHERE id = p_character_id FOR UPDATE;
    SELECT * INTO v_item FROM public.character_inventories WHERE id = p_inventory_item_id AND character_id = p_character_id FOR UPDATE;

    IF v_item.id IS NULL THEN
        RAISE EXCEPTION 'Item not found in character inventory.';
    END IF;

    v_curr_level := COALESCE(v_item.enhancement_level, 0);

    IF v_curr_level >= 5 THEN
        RAISE EXCEPTION 'Item is already at max enhancement level (+5).';
    END IF;

    -- Progressive gold cost & success rate
    v_gold_cost := 150 * (v_curr_level + 1);
    IF v_curr_level = 0 THEN v_success_rate := 0.95;
    ELSIF v_curr_level = 1 THEN v_success_rate := 0.85;
    ELSIF v_curr_level = 2 THEN v_success_rate := 0.70;
    ELSIF v_curr_level = 3 THEN v_success_rate := 0.50;
    ELSIF v_curr_level = 4 THEN v_success_rate := 0.30;
    END IF;

    IF v_char.gold < v_gold_cost THEN
        RAISE EXCEPTION 'Insufficient gold for enhancement. Required: %g', v_gold_cost;
    END IF;

    -- Roll success
    v_roll := random();
    v_success := (v_roll <= v_success_rate);

    -- Deduct gold
    UPDATE public.characters SET gold = gold - v_gold_cost, updated_at = NOW() WHERE id = p_character_id;

    IF v_success THEN
        UPDATE public.character_inventories
        SET enhancement_level = v_curr_level + 1, updated_at = NOW()
        WHERE id = p_inventory_item_id;
    END IF;

    RETURN jsonb_build_object(
        'success', v_success,
        'item_id', v_item.item_id,
        'new_enhancement_level', CASE WHEN v_success THEN v_curr_level + 1 ELSE v_curr_level END,
        'gold_spent', v_gold_cost,
        'success_rate', v_success_rate
    );
END;
$$;

-- 4. Atomic Transmute Items RPC
-- Consumes 3 items of the same rarity to produce 1 item of the next rarity
CREATE OR REPLACE FUNCTION public.transmute_items(
    p_character_id UUID,
    p_item_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_account_id UUID;
    v_char RECORD;
    v_count INT;
    v_rarities TEXT[];
    v_target_rarity TEXT;
    v_sample_item RECORD;
    v_output_item RECORD;
BEGIN
    IF array_length(p_item_ids, 1) != 3 THEN
        RAISE EXCEPTION 'Transmutation requires exactly 3 items.';
    END IF;

    SELECT account_id INTO v_account_id FROM public.characters WHERE id = p_character_id;
    IF v_account_id IS NULL OR v_account_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized character ownership.';
    END IF;

    SELECT * INTO v_char FROM public.characters WHERE id = p_character_id FOR UPDATE;

    -- Verify all 3 items exist in inventory
    SELECT count(*), array_agg(COALESCE(metadata->>'rarity', 'common')) INTO v_count, v_rarities
    FROM public.character_inventories
    WHERE character_id = p_character_id AND id = ANY(p_item_ids);

    IF v_count < 3 THEN
        RAISE EXCEPTION 'One or more transmutation target items missing from inventory.';
    END IF;

    -- Verify all 3 items share the exact same rarity
    IF v_rarities[1] != v_rarities[2] OR v_rarities[2] != v_rarities[3] THEN
        RAISE EXCEPTION 'All 3 items must be of the exact same rarity for transmutation.';
    END IF;

    -- Determine upgraded rarity
    IF v_rarities[1] = 'common' THEN v_target_rarity := 'uncommon';
    ELSIF v_rarities[1] = 'uncommon' THEN v_target_rarity := 'rare';
    ELSIF v_rarities[1] = 'rare' THEN v_target_rarity := 'epic';
    ELSIF v_rarities[1] = 'epic' THEN v_target_rarity := 'legendary';
    ELSIF v_rarities[1] = 'legendary' THEN v_target_rarity := 'mythic';
    ELSE
        RAISE EXCEPTION 'Cannot transmute items of rarity: %', v_rarities[1];
    END IF;

    -- Delete the 3 source items
    DELETE FROM public.character_inventories
    WHERE character_id = p_character_id AND id = ANY(p_item_ids);

    -- Select a random item template of the target rarity
    SELECT * INTO v_output_item
    FROM public.item_templates
    WHERE rarity = v_target_rarity
    ORDER BY random()
    LIMIT 1;

    IF v_output_item.item_id IS NULL THEN
        RAISE EXCEPTION 'No item templates found for target rarity: %', v_target_rarity;
    END IF;

    -- Insert new transmuted item
    INSERT INTO public.character_inventories (
        character_id, item_id, item_name, item_type, quantity, icon, metadata, updated_at
    ) VALUES (
        p_character_id,
        v_output_item.item_id,
        v_output_item.name,
        'equipment',
        1,
        v_output_item.icon,
        jsonb_build_object(
            'name', v_output_item.name,
            'slot_type', v_output_item.slot_type,
            'rarity', v_target_rarity,
            'min_level', v_output_item.min_level,
            'icon', v_output_item.icon
        ),
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'target_rarity', v_target_rarity,
        'output_item_id', v_output_item.item_id,
        'output_item_name', v_output_item.name,
        'output_icon', v_output_item.icon
    );
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.reforge_item(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enhance_item(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transmute_items(UUID, UUID[]) TO authenticated;
