-- ========================================================
-- EMBER KEEP — PHASE 5: DUNGEON PROGRESSION & COMBAT SCHEMA
-- Execute this script in the Supabase SQL Editor
-- ========================================================

-- 1. Create Dungeon Progress Table
CREATE TABLE IF NOT EXISTS public.dungeon_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
    dungeon_id VARCHAR(100) NOT NULL,
    highest_floor_cleared INT NOT NULL DEFAULT 0,
    unlocked BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_char_dungeon UNIQUE (character_id, dungeon_id)
);

-- Enable RLS
ALTER TABLE public.dungeon_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and manage their own character dungeon progress" ON public.dungeon_progress;
CREATE POLICY "Users can view and manage their own character dungeon progress"
    ON public.dungeon_progress FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.characters
            WHERE public.characters.id = dungeon_progress.character_id
            AND public.characters.account_id = auth.uid()
        )
    );

-- 2. Atomic Dungeon Combat Procedure
CREATE OR REPLACE FUNCTION public.run_dungeon_encounter(
    p_character_id UUID,
    p_dungeon_id VARCHAR,
    p_floor INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account_id UUID;
    v_char RECORD;
    v_progress RECORD;
    v_food_item RECORD;
    
    -- Character Computed Stats
    v_player_max_hp INT;
    v_player_hp INT;
    v_player_attack INT;
    v_player_defense INT;
    v_player_crit FLOAT := 0.05;
    
    -- Enemy Stats (Scaled by floor)
    v_enemy_name TEXT;
    v_enemy_max_hp INT;
    v_enemy_hp INT;
    v_enemy_attack INT;
    v_enemy_defense INT;
    
    -- Combat State & Log
    v_turn INT := 0;
    v_max_turns INT := 100;
    v_is_player_turn BOOLEAN := true;
    v_raw_dmg INT;
    v_final_dmg INT;
    v_is_crit BOOLEAN;
    v_turns_log JSONB := '[]'::jsonb;
    v_combat_result TEXT := 'defeat';
    v_total_damage_dealt INT := 0;
    v_total_damage_taken INT := 0;
    v_food_consumed_count INT := 0;
    
    -- Rewards
    v_exp_reward INT := 0;
    v_gold_reward INT := 0;
    v_new_exp INT;
    v_new_level INT;
    
    v_slot_item JSONB;
    v_meta JSONB;
BEGIN
    -- Ownership Guard
    SELECT account_id INTO v_account_id FROM public.characters WHERE id = p_character_id;
    IF v_account_id IS NULL OR v_account_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Character does not belong to active user.';
    END IF;

    -- Row Locking
    SELECT * INTO v_char FROM public.characters WHERE id = p_character_id FOR UPDATE;

    -- Upsert Dungeon Progress Row if missing
    INSERT INTO public.dungeon_progress (character_id, dungeon_id, highest_floor_cleared, unlocked)
    VALUES (p_character_id, p_dungeon_id, 0, true)
    ON CONFLICT (character_id, dungeon_id) DO NOTHING;

    SELECT * INTO v_progress FROM public.dungeon_progress 
    WHERE character_id = p_character_id AND dungeon_id = p_dungeon_id FOR UPDATE;

    -- Validate Floor Eligibility
    IF p_floor > (v_progress.highest_floor_cleared + 1) THEN
        RAISE EXCEPTION 'Floor % is locked. Clear floor % first.', p_floor, (p_floor - 1);
    END IF;

    -- Compute Player Effective Stats
    v_player_max_hp := 100 + (v_char.level - 1) * 15;
    v_player_attack := 10 + (v_char.level - 1) * 2;
    v_player_defense := 5 + (v_char.level - 1) * 1;

    FOR v_slot_item IN SELECT jsonb_each_text.value::jsonb FROM jsonb_each_text(COALESCE(v_char.equipped, '{}'::jsonb)) LOOP
        IF v_slot_item IS NOT NULL AND v_slot_item != 'null'::jsonb THEN
            v_meta := v_slot_item->'metadata';
            IF v_meta IS NOT NULL THEN
                v_player_max_hp := v_player_max_hp + COALESCE((v_meta->>'max_hp')::INT, 0);
                v_player_attack := v_player_attack + COALESCE((v_meta->>'attack_power')::INT, (v_meta->>'power')::INT, 0);
                v_player_defense := v_player_defense + COALESCE((v_meta->>'defense')::INT, 0);
                v_player_crit := v_player_crit + COALESCE((v_meta->>'crit_chance')::FLOAT, 0.0);
            END IF;
        END IF;
    END LOOP;

    v_player_hp := v_player_max_hp;

    -- Scale Enemy Stats
    v_enemy_name := 'Floor ' || p_floor || ' Guardian';
    v_enemy_max_hp := 60 + (p_floor * 25);
    v_enemy_attack := 8 + (p_floor * 3);
    v_enemy_defense := 2 + (p_floor * 1);
    v_enemy_hp := v_enemy_max_hp;

    -- Combat Loop
    WHILE v_player_hp > 0 AND v_enemy_hp > 0 AND v_turn < v_max_turns LOOP
        v_turn := v_turn + 1;

        IF v_is_player_turn THEN
            -- Player Turn
            v_is_crit := (random() < v_player_crit);
            v_raw_dmg := FLOOR(v_player_attack * (CASE WHEN v_is_crit THEN 1.5 ELSE 1.0 END))::INT;
            v_final_dmg := GREATEST(1, v_raw_dmg - v_enemy_defense);
            v_enemy_hp := GREATEST(0, v_enemy_hp - v_final_dmg);
            v_total_damage_dealt := v_total_damage_dealt + v_final_dmg;

            v_turns_log := v_turns_log || jsonb_build_object(
                'turn', v_turn,
                'attacker', 'player',
                'action', 'attack',
                'damage', v_final_dmg,
                'is_crit', v_is_crit,
                'player_hp', v_player_hp,
                'enemy_hp', v_enemy_hp
            );
        ELSE
            -- Enemy Turn
            v_raw_dmg := v_enemy_attack;
            v_final_dmg := GREATEST(1, v_raw_dmg - v_player_defense);
            v_player_hp := GREATEST(0, v_player_hp - v_final_dmg);
            v_total_damage_taken := v_total_damage_taken + v_final_dmg;

            -- Auto-consume food if HP < 50%
            IF v_player_hp < (v_player_max_hp * 0.5) THEN
                SELECT * INTO v_food_item FROM public.character_inventories 
                WHERE character_id = p_character_id AND quantity > 0 AND (metadata->>'hp_heal') IS NOT NULL
                LIMIT 1 FOR UPDATE;

                IF v_food_item.id IS NOT NULL THEN
                    v_player_hp := LEAST(v_player_max_hp, v_player_hp + (v_food_item.metadata->>'hp_heal')::INT);
                    v_food_consumed_count := v_food_consumed_count + 1;
                    
                    IF v_food_item.quantity > 1 THEN
                        UPDATE public.character_inventories SET quantity = quantity - 1 WHERE id = v_food_item.id;
                    ELSE
                        DELETE FROM public.character_inventories WHERE id = v_food_item.id;
                    END IF;
                END IF;
            END IF;

            v_turns_log := v_turns_log || jsonb_build_object(
                'turn', v_turn,
                'attacker', 'enemy',
                'action', 'attack',
                'damage', v_final_dmg,
                'player_hp', v_player_hp,
                'enemy_hp', v_enemy_hp
            );
        END IF;

        v_is_player_turn := NOT v_is_player_turn;
    END LOOP;

    -- Process Outcome
    IF v_enemy_hp <= 0 THEN
        v_combat_result := 'victory';
        v_exp_reward := 50 + (p_floor * 20);
        v_gold_reward := 25 + (p_floor * 10);

        -- Level Ups
        v_new_exp := v_char.exp + v_exp_reward;
        v_new_level := v_char.level;
        WHILE v_new_exp >= (v_new_level * 100) LOOP
            v_new_exp := v_new_exp - (v_new_level * 100);
            v_new_level := v_new_level + 1;
        END LOOP;

        UPDATE public.characters 
        SET exp = v_new_exp, level = v_new_level, gold = gold + v_gold_reward, updated_at = NOW()
        WHERE id = p_character_id;

        -- Update Dungeon Progress
        UPDATE public.dungeon_progress
        SET highest_floor_cleared = GREATEST(highest_floor_cleared, p_floor), updated_at = NOW()
        WHERE character_id = p_character_id AND dungeon_id = p_dungeon_id;
    END IF;

    RETURN jsonb_build_object(
        'result', v_combat_result,
        'dungeon_id', p_dungeon_id,
        'floor', p_floor,
        'enemy_name', v_enemy_name,
        'total_turns', v_turn,
        'damage_dealt', v_total_damage_dealt,
        'damage_taken', v_total_damage_taken,
        'food_consumed', v_food_consumed_count,
        'exp_gained', COALESCE(v_exp_reward, 0),
        'gold_gained', COALESCE(v_gold_reward, 0),
        'turns', v_turns_log
    );
END;
$$;
