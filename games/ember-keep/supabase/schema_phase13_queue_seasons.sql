-- ================================================================
-- EMBER KEEP — PHASE 13: TASK QUEUEING & SEASONAL ECHO LEAGUES
-- Execute this script in the Supabase SQL Editor
-- ================================================================

-- 1. Task Queue Table (Up to 5 sequential tasks per character)
CREATE TABLE IF NOT EXISTS public.task_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  queue_position INT NOT NULL CHECK (queue_position BETWEEN 1 AND 5),
  task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('mining', 'woodcutting', 'combat', 'fishing')),
  target_id VARCHAR(100) NOT NULL,
  target_name VARCHAR(100),
  total_cycles INT DEFAULT 50,
  allocated_food INT DEFAULT 0,
  fallback_task_type VARCHAR(50) DEFAULT 'woodcutting',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_char_queue_pos UNIQUE (character_id, queue_position)
);

ALTER TABLE public.task_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage task queue for their characters" ON public.task_queue;
CREATE POLICY "Users can manage task queue for their characters"
  ON public.task_queue FOR ALL
  USING (
    character_id IN (
      SELECT id FROM public.characters WHERE account_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_task_queue_char ON public.task_queue(character_id, queue_position);

-- 2. Seasonal Realms Table
CREATE TABLE IF NOT EXISTS public.seasonal_realms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  mutator_config JSONB NOT NULL DEFAULT '{"speed_multiplier": 3, "mob_damage_bonus": 0.5}'::jsonb,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '28 days'),
  is_active BOOLEAN DEFAULT true,
  rewards JSONB DEFAULT '[{"type": "title", "name": "Echo Conqueror"}, {"type": "gold", "amount": 10000}]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.seasonal_realms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select on seasonal realms" ON public.seasonal_realms;
CREATE POLICY "Public select on seasonal realms"
  ON public.seasonal_realms FOR SELECT
  USING (true);

-- 3. Add realm_id to characters table (NULL = standard realm, non-null = seasonal slot 5)
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS realm_id UUID DEFAULT NULL REFERENCES public.seasonal_realms(id) ON DELETE SET NULL;

-- 4. Seasonal Achievements Table
CREATE TABLE IF NOT EXISTS public.seasonal_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts_profile(id) ON DELETE CASCADE,
  realm_id UUID NOT NULL REFERENCES public.seasonal_realms(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  achievement_id VARCHAR(100) NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  reward_claimed BOOLEAN DEFAULT false,
  CONSTRAINT unique_acc_realm_ach UNIQUE (account_id, realm_id, achievement_id)
);

ALTER TABLE public.seasonal_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own seasonal achievements" ON public.seasonal_achievements;
CREATE POLICY "Users can view own seasonal achievements"
  ON public.seasonal_achievements FOR SELECT
  USING (account_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own seasonal achievements" ON public.seasonal_achievements;
CREATE POLICY "Users can insert own seasonal achievements"
  ON public.seasonal_achievements FOR INSERT
  WITH CHECK (account_id = auth.uid());

-- Seed initial Seasonal Realm if empty
INSERT INTO public.seasonal_realms (name, description, mutator_config, is_active)
SELECT 'Speed Realm Season I', '3x game execution speed, but monsters deal 50% more damage! Compete for seasonal glory in Slot 5!', '{"speed_multiplier": 3, "mob_damage_bonus": 0.5}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM public.seasonal_realms WHERE is_active = true);

-- RPC: Enqueue Task
CREATE OR REPLACE FUNCTION public.enqueue_task(
    p_character_id UUID,
    p_queue_position INT,
    p_task_type VARCHAR,
    p_target_id VARCHAR,
    p_target_name VARCHAR,
    p_total_cycles INT DEFAULT 50,
    p_allocated_food INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_account_id UUID;
BEGIN
  SELECT account_id INTO v_account_id FROM public.characters WHERE id = p_character_id;
  IF v_account_id IS NULL OR v_account_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized character ownership.';
  END IF;

  INSERT INTO public.task_queue (
    character_id, queue_position, task_type, target_id, target_name, total_cycles, allocated_food, status
  ) VALUES (
    p_character_id, p_queue_position, p_task_type, p_target_id, p_target_name, p_total_cycles, p_allocated_food, 'pending'
  )
  ON CONFLICT (character_id, queue_position) DO UPDATE SET
    task_type = EXCLUDED.task_type,
    target_id = EXCLUDED.target_id,
    target_name = EXCLUDED.target_name,
    total_cycles = EXCLUDED.total_cycles,
    allocated_food = EXCLUDED.allocated_food,
    status = 'pending',
    created_at = NOW();

  RETURN jsonb_build_object('success', true, 'queue_position', p_queue_position);
END;
$$;

-- RPC: Clear Task Queue
CREATE OR REPLACE FUNCTION public.clear_task_queue(p_character_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_account_id UUID;
BEGIN
  SELECT account_id INTO v_account_id FROM public.characters WHERE id = p_character_id;
  IF v_account_id IS NULL OR v_account_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized character ownership.';
  END IF;

  DELETE FROM public.task_queue WHERE character_id = p_character_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.enqueue_task(UUID, INT, VARCHAR, VARCHAR, VARCHAR, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_task_queue(UUID) TO authenticated;
