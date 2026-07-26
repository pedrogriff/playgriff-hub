-- ================================================================
-- EMBER KEEP — PHASE 10: PRESTIGE (REBIRTH), DIFFICULTY TIERS & LOOT FILTERS
-- Execute this script in the Supabase SQL Editor
-- ================================================================

-- 1. Add Rebirth & Difficulty columns to accounts_profile
ALTER TABLE public.accounts_profile
  ADD COLUMN IF NOT EXISTS rebirth_count INT DEFAULT 0 CHECK (rebirth_count >= 0),
  ADD COLUMN IF NOT EXISTS ember_shards INT DEFAULT 0 CHECK (ember_shards >= 0),
  ADD COLUMN IF NOT EXISTS active_difficulty VARCHAR(20) DEFAULT 'normal'
    CHECK (active_difficulty IN ('normal', 'hardened', 'infernal', 'mythic'));

-- 2. Add loot filter config per-character
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS loot_filter JSONB DEFAULT '{"auto_salvage_below": null, "keep_materials": true}'::jsonb;

-- 3. Rebirth History Log
CREATE TABLE IF NOT EXISTS public.rebirth_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts_profile(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  rebirth_number INT NOT NULL,
  shards_earned INT NOT NULL DEFAULT 1,
  difficulty_unlocked VARCHAR(20),
  character_snapshot JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for rebirth_log
ALTER TABLE public.rebirth_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own rebirth log" ON public.rebirth_log;
CREATE POLICY "Users can view own rebirth log"
  ON public.rebirth_log FOR SELECT
  USING (auth.uid() = account_id);

DROP POLICY IF EXISTS "Users can insert own rebirth log" ON public.rebirth_log;
CREATE POLICY "Users can insert own rebirth log"
  ON public.rebirth_log FOR INSERT
  WITH CHECK (auth.uid() = account_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_rebirth_log_account ON public.rebirth_log(account_id);

-- 4. Atomic Rebirth RPC
-- Resets: level, gold, equipment, stage progress, xp, skill_points, allocated_stats
-- Keeps: production skills (professions), pets, housing, clan, inventory materials (optional)
-- Awards: ember_shards +1, increments rebirth_count
-- Unlocks: next difficulty tier at rebirth 1/3/6
CREATE OR REPLACE FUNCTION public.perform_rebirth(p_character_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_account_id UUID;
  v_char RECORD;
  v_profile RECORD;
  v_new_rebirth_count INT;
  v_shards_earned INT := 1;
  v_difficulty_unlocked VARCHAR(20) := NULL;
  v_snapshot JSONB;
  v_class_hp INT;
  v_class_power INT;
  v_class_defense INT;
  v_class_mana INT;
BEGIN
  -- Guard: Ownership Verification
  SELECT account_id INTO v_account_id
  FROM public.characters WHERE id = p_character_id;

  IF v_account_id IS NULL OR v_account_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized character access.';
  END IF;

  -- Lock character and account
  SELECT * INTO v_char FROM public.characters WHERE id = p_character_id FOR UPDATE;
  SELECT * INTO v_profile FROM public.accounts_profile WHERE id = v_account_id FOR UPDATE;

  -- Guard: Must have defeated The Ember King (unlocked_level >= 30)
  IF COALESCE(v_char.unlocked_level, 1) < 30 THEN
    RAISE EXCEPTION 'Must clear Level 30 (The Ember King) before Rebirth.';
  END IF;

  -- Snapshot character state before reset
  v_snapshot := jsonb_build_object(
    'level', v_char.level,
    'gold', v_char.gold,
    'power', v_char.power,
    'defense', v_char.defense,
    'max_hp', v_char.max_hp,
    'professions', v_char.professions,
    'unlocked_level', v_char.unlocked_level
  );

  -- Calculate class-specific base stats for reset
  IF v_char.class_id = 'Warrior' THEN
    v_class_hp := 120; v_class_power := 10; v_class_defense := 8; v_class_mana := 50;
  ELSIF v_char.class_id = 'Ranger' THEN
    v_class_hp := 100; v_class_power := 12; v_class_defense := 5; v_class_mana := 60;
  ELSIF v_char.class_id = 'Mage' THEN
    v_class_hp := 80; v_class_power := 15; v_class_defense := 3; v_class_mana := 100;
  ELSIF v_char.class_id = 'Paladin' THEN
    v_class_hp := 140; v_class_power := 8; v_class_defense := 10; v_class_mana := 70;
  ELSE
    v_class_hp := 100; v_class_power := 10; v_class_defense := 5; v_class_mana := 50;
  END IF;

  -- Reset character (keeping professions, house, location)
  UPDATE public.characters SET
    level = 1,
    exp = 0,
    max_exp = 100,
    hp = v_class_hp,
    max_hp = v_class_hp,
    power = v_class_power,
    defense = v_class_defense,
    mana = v_class_mana,
    max_mana = v_class_mana,
    stamina = 100,
    max_stamina = 100,
    gold = 50,
    skill_points = 0,
    allocated_stats = '{"hp": 0, "power": 0, "defense": 0}'::jsonb,
    equipped = '{"head": null, "chest": null, "legs": null, "main_hand": null, "off_hand": null, "accessory": null}'::jsonb,
    unlocked_level = 1,
    completed_side_zones = '[]'::jsonb,
    crit_chance = 0.050,
    crit_damage = 1.50,
    dodge_chance = 0.050,
    updated_at = NOW()
  WHERE id = p_character_id;

  -- Clear equipment from inventory (keep materials and consumables)
  DELETE FROM public.character_inventories
  WHERE character_id = p_character_id
    AND (item_type = 'equipment' OR item_type = 'weapon' OR item_type = 'armor');

  -- Reset dungeon progress
  UPDATE public.dungeon_progress
  SET highest_floor_cleared = 0, updated_at = NOW()
  WHERE character_id = p_character_id;

  -- Cancel any running tasks
  UPDATE public.active_tasks
  SET status = 'cancelled', updated_at = NOW()
  WHERE character_id = p_character_id AND status = 'running';

  -- Update account rebirth state
  v_new_rebirth_count := COALESCE(v_profile.rebirth_count, 0) + 1;

  -- Determine difficulty unlock
  IF v_new_rebirth_count >= 6 AND COALESCE(v_profile.active_difficulty, 'normal') != 'mythic' THEN
    v_difficulty_unlocked := 'mythic';
  ELSIF v_new_rebirth_count >= 3 AND COALESCE(v_profile.active_difficulty, 'normal') NOT IN ('infernal', 'mythic') THEN
    v_difficulty_unlocked := 'infernal';
  ELSIF v_new_rebirth_count >= 1 AND COALESCE(v_profile.active_difficulty, 'normal') = 'normal' THEN
    v_difficulty_unlocked := 'hardened';
  END IF;

  -- Bonus shards for milestone rebirths
  IF v_new_rebirth_count = 3 THEN v_shards_earned := 2;
  ELSIF v_new_rebirth_count = 6 THEN v_shards_earned := 3;
  ELSIF v_new_rebirth_count >= 10 AND v_new_rebirth_count % 5 = 0 THEN v_shards_earned := 5;
  END IF;

  UPDATE public.accounts_profile SET
    rebirth_count = v_new_rebirth_count,
    ember_shards = COALESCE(ember_shards, 0) + v_shards_earned,
    active_difficulty = COALESCE(v_difficulty_unlocked, active_difficulty, 'normal'),
    updated_at = NOW()
  WHERE id = v_account_id;

  -- Log the rebirth
  INSERT INTO public.rebirth_log (
    account_id, character_id, rebirth_number, shards_earned,
    difficulty_unlocked, character_snapshot
  ) VALUES (
    v_account_id, p_character_id, v_new_rebirth_count, v_shards_earned,
    v_difficulty_unlocked, v_snapshot
  );

  RETURN jsonb_build_object(
    'success', true,
    'rebirth_number', v_new_rebirth_count,
    'shards_earned', v_shards_earned,
    'total_shards', COALESCE(v_profile.ember_shards, 0) + v_shards_earned,
    'difficulty_unlocked', v_difficulty_unlocked,
    'character_snapshot', v_snapshot
  );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.perform_rebirth(UUID) TO authenticated;
