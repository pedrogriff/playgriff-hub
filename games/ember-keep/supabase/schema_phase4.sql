-- ================================================================
-- EMBER KEEP — Phase 4: Equipment, Gear Slots, & Stat Modifiers
-- Execute this script in the Supabase SQL Editor
-- ================================================================

-- 1. SCHEMA UPDATES
-- Ensure characters has equipped JSONB initialized with all 6 slots
ALTER TABLE public.characters 
  ADD COLUMN IF NOT EXISTS equipped JSONB DEFAULT '{
    "head": null, 
    "chest": null, 
    "legs": null, 
    "main_hand": null, 
    "off_hand": null, 
    "accessory": null
  }'::jsonb;

-- 2. ATOMIC EQUIP ITEM RPC
CREATE OR REPLACE FUNCTION public.equip_item(
    p_character_id UUID, 
    p_inventory_item_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account_id UUID;
    v_char RECORD;
    v_item RECORD;
    v_slot_name TEXT;
    v_req_level INT;
    v_currently_equipped JSONB;
    v_equipped_slot_item JSONB;
    v_used_slots INT;
    v_equipped_payload JSONB;
BEGIN
    -- Step 1: Verify Ownership
    SELECT account_id INTO v_account_id FROM public.characters WHERE id = p_character_id;
    IF v_account_id IS NULL OR v_account_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized character ownership.';
    END IF;

    -- Step 2: Lock Character & Inventory Row
    SELECT * INTO v_char FROM public.characters WHERE id = p_character_id FOR UPDATE;
    SELECT * INTO v_item FROM public.character_inventories WHERE id = p_inventory_item_id AND character_id = p_character_id FOR UPDATE;

    IF v_item.id IS NULL THEN
        RAISE EXCEPTION 'Item not found in character inventory.';
    END IF;

    v_slot_name := v_item.metadata->>'slot_type';
    v_req_level := COALESCE((v_item.metadata->>'required_level')::INT, 1);

    IF v_slot_name IS NULL OR NOT (v_slot_name = ANY(ARRAY['head', 'chest', 'legs', 'main_hand', 'off_hand', 'accessory'])) THEN
        RAISE EXCEPTION 'Item cannot be equipped: invalid or missing slot_type.';
    END IF;

    -- Step 3: Check Required Level
    IF v_char.level < v_req_level THEN
        RAISE EXCEPTION 'Character level % is below required level % for this item.', v_char.level, v_req_level;
    END IF;

    -- Step 4: Check Currently Equipped Item in Slot
    v_currently_equipped := COALESCE(v_char.equipped, '{
      "head": null, "chest": null, "legs": null, "main_hand": null, "off_hand": null, "accessory": null
    }'::jsonb);
    v_equipped_slot_item := v_currently_equipped->v_slot_name;

    -- Step 5: Capacity check if swapping gear and item quantity == 1
    IF v_equipped_slot_item IS NOT NULL AND v_equipped_slot_item != 'null'::jsonb THEN
        SELECT COUNT(*) INTO v_used_slots FROM public.character_inventories WHERE character_id = p_character_id AND quantity > 0;
        
        IF v_used_slots >= v_char.max_inventory_slots AND v_item.quantity = 1 THEN
            IF NOT EXISTS (
                SELECT 1 FROM public.character_inventories 
                WHERE character_id = p_character_id AND item_id = (v_equipped_slot_item->>'item_id')
            ) THEN
                RAISE EXCEPTION 'Inventory is full. Cannot swap equipped item.';
            END IF;
        END IF;

        -- Return old equipped item to inventory (upsert with fallback names)
        INSERT INTO public.character_inventories (
            character_id, item_id, item_name, item_type, quantity, icon, metadata, updated_at
        )
        VALUES (
            p_character_id, 
            v_equipped_slot_item->>'item_id', 
            COALESCE(v_equipped_slot_item->'metadata'->>'name', v_equipped_slot_item->>'item_id'),
            COALESCE(v_equipped_slot_item->'metadata'->>'item_type', 'equipment'),
            1, 
            COALESCE(v_equipped_slot_item->'metadata'->>'icon', '🛡️'),
            COALESCE(v_equipped_slot_item->'metadata', '{}'::jsonb),
            NOW()
        )
        ON CONFLICT (character_id, item_id) 
        DO UPDATE SET quantity = public.character_inventories.quantity + 1, updated_at = NOW();
    END IF;

    -- Step 6: Decrement or Remove Item from Inventory
    IF v_item.quantity > 1 THEN
        UPDATE public.character_inventories SET quantity = quantity - 1, updated_at = NOW() WHERE id = p_inventory_item_id;
    ELSE
        DELETE FROM public.character_inventories WHERE id = p_inventory_item_id;
    END IF;

    -- Step 7: Update Character Equipped Slot
    v_equipped_payload := jsonb_build_object(
        'item_id', v_item.item_id,
        'name', v_item.item_name,
        'metadata', v_item.metadata
    );
    v_currently_equipped := jsonb_set(v_currently_equipped, ARRAY[v_slot_name], v_equipped_payload);

    UPDATE public.characters 
    SET equipped = v_currently_equipped, updated_at = NOW() 
    WHERE id = p_character_id;

    RETURN jsonb_build_object(
        'success', true,
        'slot_name', v_slot_name,
        'equipped_item', v_equipped_payload,
        'unequipped_item', v_equipped_slot_item,
        'new_equipment', v_currently_equipped
    );
END;
$$;

-- 3. ATOMIC UNEQUIP ITEM RPC
CREATE OR REPLACE FUNCTION public.unequip_item(
    p_character_id UUID, 
    p_slot_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account_id UUID;
    v_char RECORD;
    v_currently_equipped JSONB;
    v_equipped_slot_item JSONB;
    v_used_slots INT;
    v_item_id TEXT;
BEGIN
    -- Ownership verification
    SELECT account_id INTO v_account_id FROM public.characters WHERE id = p_character_id;
    IF v_account_id IS NULL OR v_account_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized character ownership.';
    END IF;

    -- Lock character row
    SELECT * INTO v_char FROM public.characters WHERE id = p_character_id FOR UPDATE;
    v_currently_equipped := COALESCE(v_char.equipped, '{
      "head": null, "chest": null, "legs": null, "main_hand": null, "off_hand": null, "accessory": null
    }'::jsonb);
    v_equipped_slot_item := v_currently_equipped->p_slot_name;

    IF v_equipped_slot_item IS NULL OR v_equipped_slot_item = 'null'::jsonb THEN
        RAISE EXCEPTION 'No item equipped in slot: %', p_slot_name;
    END IF;

    v_item_id := v_equipped_slot_item->>'item_id';

    -- Capacity check (only if item does not already exist as a stack in inventory)
    IF NOT EXISTS (
        SELECT 1 FROM public.character_inventories 
        WHERE character_id = p_character_id AND item_id = v_item_id
    ) THEN
        SELECT COUNT(*) INTO v_used_slots FROM public.character_inventories WHERE character_id = p_character_id AND quantity > 0;
        IF v_used_slots >= v_char.max_inventory_slots THEN
            RAISE EXCEPTION 'Inventory full. Cannot unequip item.';
        END IF;
    END IF;

    -- Return item to inventory
    INSERT INTO public.character_inventories (
        character_id, item_id, item_name, item_type, quantity, icon, metadata, updated_at
    )
    VALUES (
        p_character_id, 
        v_item_id, 
        COALESCE(v_equipped_slot_item->'metadata'->>'name', v_equipped_slot_item->>'name', v_item_id),
        COALESCE(v_equipped_slot_item->'metadata'->>'item_type', 'equipment'),
        1, 
        COALESCE(v_equipped_slot_item->'metadata'->>'icon', '🛡️'),
        COALESCE(v_equipped_slot_item->'metadata', '{}'::jsonb),
        NOW()
    )
    ON CONFLICT (character_id, item_id) 
    DO UPDATE SET quantity = public.character_inventories.quantity + 1, updated_at = NOW();

    -- Clear character equipment slot
    v_currently_equipped := jsonb_set(v_currently_equipped, ARRAY[p_slot_name], 'null'::jsonb);

    UPDATE public.characters 
    SET equipped = v_currently_equipped, updated_at = NOW() 
    WHERE id = p_character_id;

    RETURN jsonb_build_object(
        'success', true,
        'slot_name', p_slot_name,
        'unequipped_item', v_equipped_slot_item,
        'new_equipment', v_currently_equipped
    );
END;
$$;
