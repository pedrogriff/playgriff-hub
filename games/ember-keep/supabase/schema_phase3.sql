-- ================================================================
-- EMBER KEEP — Phase 3: Inventory Schema & Atomic Claim RPC
-- Execute this script in the Supabase SQL Editor
-- ================================================================

-- 1. Ensure characters table has max_inventory_slots column
ALTER TABLE public.characters 
  ADD COLUMN IF NOT EXISTS max_inventory_slots INT DEFAULT 20 CHECK (max_inventory_slots >= 5);

-- 2. Create character_inventories table
CREATE TABLE IF NOT EXISTS public.character_inventories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  item_id VARCHAR(100) NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  item_type VARCHAR(50) NOT NULL DEFAULT 'material',
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  icon VARCHAR(20) DEFAULT '📦',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_char_item UNIQUE (character_id, item_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_character_inventories_char 
  ON public.character_inventories(character_id);

-- 3. Enable Row Level Security (RLS) on character_inventories
ALTER TABLE public.character_inventories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view inventory for their characters" ON public.character_inventories;
CREATE POLICY "Users can view inventory for their characters"
  ON public.character_inventories FOR SELECT
  USING (
    character_id IN (
      SELECT id FROM public.characters WHERE account_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert inventory for their characters" ON public.character_inventories;
CREATE POLICY "Users can insert inventory for their characters"
  ON public.character_inventories FOR INSERT
  WITH CHECK (
    character_id IN (
      SELECT id FROM public.characters WHERE account_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update inventory for their characters" ON public.character_inventories;
CREATE POLICY "Users can update inventory for their characters"
  ON public.character_inventories FOR UPDATE
  USING (
    character_id IN (
      SELECT id FROM public.characters WHERE account_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete inventory for their characters" ON public.character_inventories;
CREATE POLICY "Users can delete inventory for their characters"
  ON public.character_inventories FOR DELETE
  USING (
    character_id IN (
      SELECT id FROM public.characters WHERE account_id = auth.uid()
    )
  );

-- ================================================================
-- 4. ATOMIC STORED PROCEDURE: claim_task_rewards
-- ================================================================
CREATE OR REPLACE FUNCTION public.claim_task_rewards(p_character_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_account_id UUID;
  v_char RECORD;
  v_task RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_raw_elapsed INT;
  v_max_idle INT := 21600; -- 6 hours default (21600 seconds)
  v_effective_elapsed INT;
  v_total_possible_cycles INT;
  v_cycles_processed INT := 0;
  v_exp_gained INT := 0;
  v_gold_gained INT := 0;
  v_base_exp_per_cycle INT := 25;
  v_base_gold_per_cycle INT := 10;
  
  -- Food variables
  v_food_exhausted BOOLEAN := FALSE;
  v_food_remaining INT;
  
  -- Inventory variables
  v_inventory_full BOOLEAN := FALSE;
  v_used_slots INT;
  v_max_slots INT;
  
  -- Loot item simulation
  v_loot_item_id VARCHAR(100);
  v_loot_item_name VARCHAR(100);
  v_loot_icon VARCHAR(20);
  v_loot_qty INT := 0;
  v_item_exists BOOLEAN;
  v_items_added JSONB := '[]'::jsonb;
  
  -- Level up calculations
  v_curr_exp INT;
  v_curr_level INT;
  v_curr_max_exp INT;
  v_skill_points INT;
BEGIN
  -- GUARD 1: Explicit Owner Verification
  SELECT account_id INTO v_account_id
  FROM public.characters
  WHERE id = p_character_id;

  IF v_account_id IS NULL OR v_account_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized character access for ID %', p_character_id;
  END IF;

  -- GUARD 2: Dual Row-Locking (FOR UPDATE)
  SELECT * INTO v_char
  FROM public.characters
  WHERE id = p_character_id
  FOR UPDATE;

  SELECT * INTO v_task
  FROM public.active_tasks
  WHERE character_id = p_character_id AND status = 'running'
  FOR UPDATE;

  IF v_task.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'reason', 'No active running task found'
    );
  END IF;

  -- Idle Cap Determination (6h standard / 8h Ember Pass check)
  v_raw_elapsed := EXTRACT(EPOCH FROM (v_now - v_task.started_at))::INT;
  v_effective_elapsed := LEAST(v_raw_elapsed, v_max_idle);
  v_total_possible_cycles := v_effective_elapsed / 4; -- 4 seconds per cycle

  IF v_total_possible_cycles <= 0 THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'duration_seconds', v_raw_elapsed,
      'processed_cycles', 0,
      'exp_gained', 0,
      'gold_gained', 0,
      'new_level', v_char.level,
      'new_exp', v_char.exp,
      'items_added', '[]'::jsonb,
      'inventory_full', FALSE,
      'food_exhausted', FALSE
    );
  END IF;

  -- Inventory Capacity Check Preparation
  v_max_slots := COALESCE(v_char.max_inventory_slots, 20);
  SELECT COUNT(DISTINCT item_id) INTO v_used_slots
  FROM public.character_inventories
  WHERE character_id = p_character_id;

  -- Task Specific Item Loot Mapping
  IF v_task.task_type = 'mining' THEN
    v_loot_item_id := 'item_ore_iron'; v_loot_item_name := 'Iron Ore'; v_loot_icon := '🪨';
  ELSIF v_task.task_type = 'woodcutting' THEN
    v_loot_item_id := 'item_wood_oak'; v_loot_item_name := 'Oak Wood'; v_loot_icon := '🪵';
  ELSIF v_task.task_type = 'fishing' THEN
    v_loot_item_id := 'item_fish_trout'; v_loot_item_name := 'Raw Trout'; v_loot_icon := '🐟';
  ELSE
    v_loot_item_id := 'item_monster_hide'; v_loot_item_name := 'Monster Hide'; v_loot_icon := '🥩';
  END IF;

  -- Food Consumption Math for Combat Tasks
  v_food_remaining := v_task.allocated_food;
  
  -- Cycle Processing Loop
  FOR i IN 1..v_total_possible_cycles LOOP
    -- Food Exhaustion Check
    IF v_task.task_type = 'combat' AND v_task.allocated_food > 0 THEN
      IF v_food_remaining <= 0 THEN
        v_food_exhausted := TRUE;
        EXIT;
      END IF;
      v_food_remaining := v_food_remaining - 1;
    END IF;

    -- Smart Inventory Capacity Check (Checks if new distinct slot is required when at capacity)
    SELECT EXISTS (
      SELECT 1 FROM public.character_inventories 
      WHERE character_id = p_character_id AND item_id = v_loot_item_id
    ) INTO v_item_exists;

    IF v_used_slots >= v_max_slots AND NOT v_item_exists THEN
      v_inventory_full := TRUE;
      EXIT;
    END IF;

    v_cycles_processed := v_cycles_processed + 1;
    v_exp_gained := v_exp_gained + v_base_exp_per_cycle;
    v_gold_gained := v_gold_gained + v_base_gold_per_cycle;
    v_loot_qty := v_loot_qty + 1;
  END LOOP;

  -- Update Character Rewards & Level-Ups
  v_curr_exp := v_char.exp + v_exp_gained;
  v_curr_level := v_char.level;
  v_curr_max_exp := COALESCE(v_char.max_exp, 100);
  v_skill_points := COALESCE(v_char.skill_points, 0);

  WHILE v_curr_exp >= v_curr_max_exp LOOP
    v_curr_exp := v_curr_exp - v_curr_max_exp;
    v_curr_level := v_curr_level + 1;
    v_curr_max_exp := FLOOR(v_curr_max_exp * 1.25);
    v_skill_points := v_skill_points + 1;
  END LOOP;

  UPDATE public.characters
  SET 
    exp = v_curr_exp,
    level = v_curr_level,
    max_exp = v_curr_max_exp,
    skill_points = v_skill_points,
    gold = v_char.gold + v_gold_gained,
    updated_at = v_now
  WHERE id = p_character_id;

  -- Upsert Loot Item into character_inventories
  IF v_loot_qty > 0 THEN
    INSERT INTO public.character_inventories (
      character_id, item_id, item_name, item_type, quantity, icon, updated_at
    ) VALUES (
      p_character_id, v_loot_item_id, v_loot_item_name, 'material', v_loot_qty, v_loot_icon, v_now
    )
    ON CONFLICT (character_id, item_id) 
    DO UPDATE SET 
      quantity = character_inventories.quantity + EXCLUDED.quantity,
      updated_at = v_now;

    v_items_added := jsonb_build_array(
      jsonb_build_object(
        'id', v_loot_item_id,
        'name', v_loot_item_name,
        'icon', v_loot_icon,
        'qty', v_loot_qty
      )
    );
  END IF;

  -- Mark active task completed
  UPDATE public.active_tasks
  SET 
    status = 'completed',
    allocated_food = GREATEST(0, v_food_remaining),
    updated_at = v_now
  WHERE id = v_task.id;

  -- Return Detailed Summary Payload
  RETURN jsonb_build_object(
    'success', TRUE,
    'task_id', v_task.id,
    'duration_seconds', v_effective_elapsed,
    'processed_cycles', v_cycles_processed,
    'exp_gained', v_exp_gained,
    'gold_gained', v_gold_gained,
    'new_level', v_curr_level,
    'new_exp', v_curr_exp,
    'items_added', v_items_added,
    'inventory_full', v_inventory_full,
    'food_exhausted', v_food_exhausted
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
