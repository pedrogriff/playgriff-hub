-- ================================================================
-- PHASE 15 — CRAFTING RECIPES DATABASE EXPANSION
-- Registers all production recipes into public.craft_item RPC
-- ================================================================

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
    
    -- Dynamic Recipe Registry Map
    v_recipes JSONB := '{
        "prod_wheat": {
            "profession": "farming", "required_level": 1, "gold_cost": 0, "exp_reward": 5,
            "ingredients": [{"item_id": "mat_wheat_seed", "quantity": 1}],
            "output": {"item_id": "mat_wheat", "quantity": 3, "metadata": {"name": "Wheat", "type": "material", "icon": "🌾"}}
        },
        "prod_herb": {
            "profession": "farming", "required_level": 1, "gold_cost": 0, "exp_reward": 5,
            "ingredients": [{"item_id": "mat_herb_seed", "quantity": 1}],
            "output": {"item_id": "mat_herb", "quantity": 2, "metadata": {"name": "Healing Herb", "type": "material", "icon": "🌿"}}
        },
        "prod_spice": {
            "profession": "farming", "required_level": 2, "gold_cost": 0, "exp_reward": 12,
            "ingredients": [{"item_id": "mat_spice_seed", "quantity": 1}],
            "output": {"item_id": "mat_spice", "quantity": 2, "metadata": {"name": "Spice", "type": "material", "icon": "🧂"}}
        },
        "prod_chicken": {
            "profession": "ranching", "required_level": 1, "gold_cost": 0, "exp_reward": 5,
            "ingredients": [{"item_id": "mat_feed", "quantity": 2}],
            "output": {"item_id": "mat_egg", "quantity": 3, "metadata": {"name": "Raw Egg", "type": "material", "icon": "🥚"}}
        },
        "prod_pasture": {
            "profession": "ranching", "required_level": 1, "gold_cost": 0, "exp_reward": 5,
            "ingredients": [{"item_id": "mat_feed", "quantity": 3}],
            "output": {"item_id": "mat_meat", "quantity": 2, "metadata": {"name": "Raw Meat", "type": "material", "icon": "🥩"}}
        },
        "prod_minor_hp": {
            "profession": "alchemy", "required_level": 1, "gold_cost": 0, "exp_reward": 5,
            "ingredients": [{"item_id": "mat_herb", "quantity": 1}, {"item_id": "mat_vial", "quantity": 1}],
            "output": {"item_id": "potion_minor_hp", "quantity": 1, "metadata": {"name": "Minor Health Potion", "type": "consumable", "icon": "🧪"}}
        },
        "prod_major_hp": {
            "profession": "alchemy", "required_level": 2, "gold_cost": 0, "exp_reward": 12,
            "ingredients": [{"item_id": "mat_herb", "quantity": 3}, {"item_id": "mat_shard", "quantity": 1}, {"item_id": "mat_vial", "quantity": 1}],
            "output": {"item_id": "potion_major_hp", "quantity": 1, "metadata": {"name": "Major Health Potion", "type": "consumable", "icon": "🏺"}}
        },
        "prod_stale_bread": {
            "profession": "alchemy", "required_level": 1, "gold_cost": 0, "exp_reward": 5,
            "ingredients": [{"item_id": "mat_wheat", "quantity": 2}],
            "output": {"item_id": "food_bread", "quantity": 1, "metadata": {"name": "Stale Bread", "type": "consumable", "icon": "🍞"}}
        },
        "prod_herb_soup": {
            "profession": "alchemy", "required_level": 1, "gold_cost": 0, "exp_reward": 5,
            "ingredients": [{"item_id": "mat_herb", "quantity": 2}, {"item_id": "mat_vial", "quantity": 1}],
            "output": {"item_id": "food_soup", "quantity": 1, "metadata": {"name": "Herb Soup", "type": "consumable", "icon": "🍲"}}
        },
        "prod_iron_dagger": {
            "profession": "blacksmith", "required_level": 1, "gold_cost": 0, "exp_reward": 5,
            "ingredients": [{"item_id": "mat_iron_ore", "quantity": 3}, {"item_id": "mat_coal", "quantity": 2}],
            "output": {"item_id": "main_iron_dagger", "quantity": 1, "metadata": {"name": "Iron Dagger", "slot_type": "main_hand", "icon": "🗡️", "rarity": "common"}}
        },
        "prod_steel_sword": {
            "profession": "blacksmith", "required_level": 2, "gold_cost": 0, "exp_reward": 12,
            "ingredients": [{"item_id": "mat_steel_ingot", "quantity": 2}, {"item_id": "mat_l_strip", "quantity": 1}],
            "output": {"item_id": "main_steel_sword", "quantity": 1, "metadata": {"name": "Forged Steel Blade", "slot_type": "main_hand", "icon": "⚔️", "rarity": "uncommon"}}
        },
        "prod_tanning_leather": {
            "profession": "tanning", "required_level": 1, "gold_cost": 0, "exp_reward": 5,
            "ingredients": [{"item_id": "mat_hide", "quantity": 2}, {"item_id": "mat_tannin", "quantity": 1}],
            "output": {"item_id": "mat_leather", "quantity": 3, "metadata": {"name": "Leather", "type": "material", "icon": "📜"}}
        },
        "prod_tailor_vest": {
            "profession": "tailoring", "required_level": 1, "gold_cost": 0, "exp_reward": 5,
            "ingredients": [{"item_id": "mat_leather", "quantity": 2}, {"item_id": "mat_thread", "quantity": 2}],
            "output": {"item_id": "chest_cloth_tunic", "quantity": 1, "metadata": {"name": "Apprentice Cloth Tunic", "slot_type": "chest", "icon": "🥋", "rarity": "common"}}
        },
        "prod_smelt_iron": {
            "profession": "blacksmith", "required_level": 1, "gold_cost": 0, "exp_reward": 5,
            "ingredients": [{"item_id": "item_ore_iron", "quantity": 2}],
            "output": {"item_id": "mat_iron_ore", "quantity": 2, "metadata": {"name": "Iron Ore", "type": "material", "icon": "🪨"}}
        },
        "prod_process_oak": {
            "profession": "tanning", "required_level": 1, "gold_cost": 0, "exp_reward": 5,
            "ingredients": [{"item_id": "item_wood_oak", "quantity": 2}],
            "output": {"item_id": "mat_l_strip", "quantity": 2, "metadata": {"name": "Leather Strip", "type": "material", "icon": "🎗️"}}
        },
        "prod_cook_trout": {
            "profession": "alchemy", "required_level": 1, "gold_cost": 0, "exp_reward": 5,
            "ingredients": [{"item_id": "item_fish_trout", "quantity": 1}],
            "output": {"item_id": "food_soup", "quantity": 1, "metadata": {"name": "Herb Soup", "type": "consumable", "icon": "🍲"}}
        },
        "prod_tan_hide": {
            "profession": "tanning", "required_level": 1, "gold_cost": 0, "exp_reward": 5,
            "ingredients": [{"item_id": "item_monster_hide", "quantity": 2}],
            "output": {"item_id": "mat_leather", "quantity": 2, "metadata": {"name": "Leather", "type": "material", "icon": "📜"}}
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
    v_total_gold_cost := COALESCE((v_recipe->>'gold_cost')::INT, 0) * p_amount;
    v_exp_per_craft := (v_recipe->>'exp_reward')::INT;

    -- 1. Check Profession Level
    v_professions := COALESCE(v_char.professions, '{}'::jsonb);
    v_current_prof := COALESCE(v_professions->v_prof_name, '{"level": 1, "xp": 0}'::jsonb);
    v_prof_level := COALESCE((v_current_prof->>'level')::INT, 1);
    v_prof_exp := COALESCE((v_current_prof->>'xp')::INT, 0);

    IF v_prof_level < v_req_level THEN
        RAISE EXCEPTION 'Profession level too low. Requires level % of %', v_req_level, v_prof_name;
    END IF;

    -- 2. Check Gold
    IF v_char.gold < v_total_gold_cost THEN
        RAISE EXCEPTION 'Insufficient gold. Required: %, Available: %', v_total_gold_cost, v_char.gold;
    END IF;

    -- 3. Check & Deduct Ingredients
    FOR v_ing IN SELECT * FROM jsonb_to_recordset(v_recipe->'ingredients') AS x(item_id TEXT, quantity INT)
    LOOP
        v_req_item_id := v_ing.item_id;
        v_req_qty := v_ing.quantity * p_amount;

        SELECT COALESCE(SUM(quantity), 0) INTO v_held_qty
        FROM public.inventory
        WHERE character_id = p_character_id AND item_id = v_req_item_id;

        IF v_held_qty < v_req_qty THEN
            RAISE EXCEPTION 'Missing ingredient: % (Required: %, Held: %)', v_req_item_id, v_req_qty, v_held_qty;
        END IF;

        -- Deduct ingredient
        UPDATE public.inventory
        SET quantity = quantity - v_req_qty
        WHERE character_id = p_character_id AND item_id = v_req_item_id;

        -- Clean up empty stacks
        DELETE FROM public.inventory
        WHERE character_id = p_character_id AND item_id = v_req_item_id AND quantity <= 0;
    END LOOP;

    -- Deduct Gold Cost
    IF v_total_gold_cost > 0 THEN
        UPDATE public.characters
        SET gold = gold - v_total_gold_cost
        WHERE id = p_character_id;
    END IF;

    -- 4. Check Inventory Capacity & Award Output Item
    v_output_item_id := v_recipe->'output'->>'item_id';
    v_output_qty := (v_recipe->'output'->>'quantity')::INT * p_amount;
    v_output_meta := v_recipe->'output'->'metadata';

    -- Check if item already in inventory
    IF EXISTS (SELECT 1 FROM public.inventory WHERE character_id = p_character_id AND item_id = v_output_item_id) THEN
        UPDATE public.inventory
        SET quantity = quantity + v_output_qty
        WHERE character_id = p_character_id AND item_id = v_output_item_id;
    ELSE
        SELECT COUNT(DISTINCT item_id) INTO v_used_slots
        FROM public.inventory
        WHERE character_id = p_character_id;

        IF v_used_slots >= 20 THEN
            RAISE EXCEPTION 'Inventory is full. Cannot add crafted item.';
        END IF;

        INSERT INTO public.inventory (character_id, item_id, quantity, metadata)
        VALUES (p_character_id, v_output_item_id, v_output_qty, v_output_meta);
    END IF;

    -- 5. Add Profession XP & Handle Level Ups
    v_added_exp := v_exp_per_craft * p_amount;
    v_prof_exp := v_prof_exp + v_added_exp;

    v_next_exp := v_prof_level * 50;
    WHILE v_prof_exp >= v_next_exp LOOP
        v_prof_exp := v_prof_exp - v_next_exp;
        v_prof_level := v_prof_level + 1;
        v_leveled_up := true;
        v_next_exp := v_prof_level * 50;
    END LOOP;

    v_professions := jsonb_set(v_professions, ARRAY[v_prof_name], jsonb_build_object('level', v_prof_level, 'xp', v_prof_exp));

    UPDATE public.characters
    SET professions = v_professions
    WHERE id = p_character_id;

    RETURN jsonb_build_object(
        'success', true,
        'crafted_item', v_output_item_id,
        'quantity_crafted', v_output_qty,
        'exp_gained', v_added_exp,
        'profession', v_prof_name,
        'new_profession_level', v_prof_level,
        'new_profession_exp', v_prof_exp,
        'leveled_up', v_leveled_up
    );
END;
$$;
