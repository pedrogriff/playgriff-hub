-- ========================================================
-- PHASE 6: PROFESSIONS & CRAFTING SCHEMA
-- Execute this script in the Supabase SQL Editor
-- ========================================================

-- 1. Initialize Professions JSONB Column
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS professions JSONB DEFAULT '{
    "blacksmithing": {"level": 1, "exp": 0},
    "alchemy": {"level": 1, "exp": 0},
    "cooking": {"level": 1, "exp": 0}
}'::jsonb;

-- 2. Atomic Craft Item RPC
CREATE OR REPLACE FUNCTION public.craft_item(
    p_character_id UUID,
    p_recipe_id VARCHAR,
    p_amount INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account_id UUID;
    v_char RECORD;
    
    -- Hardcoded Recipe Data Map
    v_recipes JSONB := '{
        "iron_sword": {
            "profession": "blacksmithing",
            "required_level": 1,
            "gold_cost": 10,
            "exp_reward": 25,
            "ingredients": [{"item_id": "item_ore_iron", "quantity": 3}],
            "output": {"item_id": "weapon_iron_sword", "quantity": 1, "metadata": {"name": "Iron Sword", "slot_type": "main_hand", "attack_power": 8, "rarity": "common", "icon": "⚔️"}}
        },
        "health_potion": {
            "profession": "alchemy",
            "required_level": 1,
            "gold_cost": 5,
            "exp_reward": 15,
            "ingredients": [{"item_id": "item_herb_red", "quantity": 2}],
            "output": {"item_id": "item_health_potion", "quantity": 1, "metadata": {"name": "Health Potion", "hp_heal": 50, "rarity": "common", "icon": "🧪", "item_type": "consumable"}}
        },
        "cooked_fish": {
            "profession": "cooking",
            "required_level": 1,
            "gold_cost": 2,
            "exp_reward": 10,
            "ingredients": [{"item_id": "item_fish_trout", "quantity": 1}],
            "output": {"item_id": "item_cooked_trout", "quantity": 1, "metadata": {"name": "Cooked Trout", "hp_heal": 25, "rarity": "common", "icon": "🐟", "item_type": "food"}}
        }
    }'::jsonb;

    v_recipe JSONB;
    v_prof_name TEXT;
    v_req_level INT;
    v_total_gold_cost INT;
    v_exp_per_craft INT;
    
    v_ing RECORD;
    v_req_item_id TEXT;
    v_req_qty INT;
    v_held_qty INT;
    
    v_output_item_id TEXT;
    v_output_qty INT;
    v_output_meta JSONB;
    
    v_used_slots INT;
    v_professions JSONB;
    v_current_prof JSONB;
    v_prof_level INT;
    v_prof_exp INT;
    v_added_exp INT;
    v_next_exp INT;
    v_leveled_up BOOLEAN := false;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Craft amount must be greater than zero.';
    END IF;

    -- Ownership Check
    SELECT account_id INTO v_account_id FROM public.characters WHERE id = p_character_id;
    IF v_account_id IS NULL OR v_account_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Character does not belong to active user.';
    END IF;

    -- Row Lock Character
    SELECT * INTO v_char FROM public.characters WHERE id = p_character_id FOR UPDATE;

    -- Fetch Recipe
    v_recipe := v_recipes->p_recipe_id;
    IF v_recipe IS NULL THEN
        RAISE EXCEPTION 'Unknown recipe: %', p_recipe_id;
    END IF;

    v_prof_name := v_recipe->>'profession';
    v_req_level := (v_recipe->>'required_level')::INT;
    v_total_gold_cost := (v_recipe->>'gold_cost')::INT * p_amount;
    v_exp_per_craft := (v_recipe->>'exp_reward')::INT;

    -- Verify Profession Level & Gold
    v_professions := COALESCE(v_char.professions, '{
        "blacksmithing": {"level": 1, "exp": 0},
        "alchemy": {"level": 1, "exp": 0},
        "cooking": {"level": 1, "exp": 0}
    }'::jsonb);
    v_current_prof := COALESCE(v_professions->v_prof_name, '{"level": 1, "exp": 0}'::jsonb);
    v_prof_level := (v_current_prof->>'level')::INT;
    v_prof_exp := (v_current_prof->>'exp')::INT;

    IF v_prof_level < v_req_level THEN
        RAISE EXCEPTION '% level % required to craft this item (current: %).', v_prof_name, v_req_level, v_prof_level;
    END IF;

    IF v_char.gold < v_total_gold_cost THEN
        RAISE EXCEPTION 'Insufficient gold. Required: %, Held: %', v_total_gold_cost, v_char.gold;
    END IF;

    -- Pre-validate ALL Ingredients Availability
    FOR v_ing IN SELECT * FROM jsonb_to_recordset(v_recipe->'ingredients') AS x(item_id TEXT, quantity INT) LOOP
        v_req_item_id := v_ing.item_id;
        v_req_qty := v_ing.quantity * p_amount;

        SELECT COALESCE(SUM(quantity), 0) INTO v_held_qty
        FROM public.character_inventories
        WHERE character_id = p_character_id AND item_id = v_req_item_id;

        IF v_held_qty < v_req_qty THEN
            RAISE EXCEPTION 'Insufficient ingredient: % (Required: %, Held: %)', v_req_item_id, v_req_qty, v_held_qty;
        END IF;
    END LOOP;

    -- Check Output Inventory Capacity
    v_output_item_id := v_recipe->'output'->>'item_id';
    v_output_qty := (v_recipe->'output'->>'quantity')::INT * p_amount;
    v_output_meta := v_recipe->'output'->'metadata';

    IF NOT EXISTS (
        SELECT 1 FROM public.character_inventories 
        WHERE character_id = p_character_id AND item_id = v_output_item_id
    ) THEN
        SELECT COUNT(*) INTO v_used_slots FROM public.character_inventories WHERE character_id = p_character_id AND quantity > 0;
        IF v_used_slots >= v_char.max_inventory_slots THEN
            RAISE EXCEPTION 'Inventory is full. Clear a slot before crafting.';
        END IF;
    END IF;

    -- Deduct Ingredients
    FOR v_ing IN SELECT * FROM jsonb_to_recordset(v_recipe->'ingredients') AS x(item_id TEXT, quantity INT) LOOP
        v_req_item_id := v_ing.item_id;
        v_req_qty := v_ing.quantity * p_amount;

        UPDATE public.character_inventories
        SET quantity = quantity - v_req_qty, updated_at = NOW()
        WHERE character_id = p_character_id AND item_id = v_req_item_id;

        -- Clean up empty stacks
        DELETE FROM public.character_inventories
        WHERE character_id = p_character_id AND item_id = v_req_item_id AND quantity <= 0;
    END LOOP;

    -- Upsert Output Item with fallback column values
    INSERT INTO public.character_inventories (
        character_id, item_id, item_name, item_type, quantity, icon, metadata, updated_at
    )
    VALUES (
        p_character_id, 
        v_output_item_id, 
        COALESCE(v_output_meta->>'name', v_output_item_id),
        COALESCE(v_output_meta->>'item_type', 'material'),
        v_output_qty, 
        COALESCE(v_output_meta->>'icon', '📦'),
        v_output_meta, 
        NOW()
    )
    ON CONFLICT (character_id, item_id)
    DO UPDATE SET quantity = public.character_inventories.quantity + v_output_qty, updated_at = NOW();

    -- Process Profession EXP & Level-Up
    v_added_exp := v_exp_per_craft * p_amount;
    v_prof_exp := v_prof_exp + v_added_exp;
    v_next_exp := v_prof_level * 50;

    WHILE v_prof_exp >= v_next_exp LOOP
        v_prof_exp := v_prof_exp - v_next_exp;
        v_prof_level := v_prof_level + 1;
        v_next_exp := v_prof_level * 50;
        v_leveled_up := true;
    END LOOP;

    v_professions := jsonb_set(
        v_professions, 
        ARRAY[v_prof_name], 
        jsonb_build_object('level', v_prof_level, 'exp', v_prof_exp)
    );

    -- Deduct Gold & Save Profession Progress
    UPDATE public.characters
    SET gold = gold - v_total_gold_cost,
        professions = v_professions,
        updated_at = NOW()
    WHERE id = p_character_id;

    RETURN jsonb_build_object(
        'success', true,
        'recipe_id', p_recipe_id,
        'crafted_item', v_output_item_id,
        'quantity_crafted', v_output_qty,
        'gold_spent', v_total_gold_cost,
        'profession', v_prof_name,
        'exp_gained', v_added_exp,
        'new_profession_level', v_prof_level,
        'leveled_up', v_leveled_up
    );
END;
$$;
