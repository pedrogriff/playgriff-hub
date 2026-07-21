-- ================================================================
-- EMBER KEEP — Phase 2: Active Tasks Schema & Server Time RPC
-- Execute this script in the Supabase SQL Editor
-- ================================================================

-- 1. Create RPC function for server-authoritative timestamp
CREATE OR REPLACE FUNCTION public.get_server_time()
RETURNS TIMESTAMPTZ AS $$
  SELECT NOW();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Create active_tasks table
CREATE TABLE IF NOT EXISTS public.active_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('mining', 'woodcutting', 'combat', 'fishing')),
  target_id VARCHAR(100) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_seconds INT NOT NULL DEFAULT 0,
  allocated_food INT NOT NULL DEFAULT 0 CHECK (allocated_food >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Unique Index: A character can only execute one active idle task at a time (status = 'running')
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_tasks_character_running 
  ON public.active_tasks (character_id) 
  WHERE status = 'running';

-- Performance Index on character_id & status
CREATE INDEX IF NOT EXISTS idx_active_tasks_character_status 
  ON public.active_tasks (character_id, status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.active_tasks ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for active_tasks
DROP POLICY IF EXISTS "Users can view active tasks for their characters" ON public.active_tasks;
CREATE POLICY "Users can view active tasks for their characters"
  ON public.active_tasks FOR SELECT
  USING (
    character_id IN (
      SELECT id FROM public.characters WHERE account_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert active tasks for their characters" ON public.active_tasks;
CREATE POLICY "Users can insert active tasks for their characters"
  ON public.active_tasks FOR INSERT
  WITH CHECK (
    character_id IN (
      SELECT id FROM public.characters WHERE account_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update active tasks for their characters" ON public.active_tasks;
CREATE POLICY "Users can update active tasks for their characters"
  ON public.active_tasks FOR UPDATE
  USING (
    character_id IN (
      SELECT id FROM public.characters WHERE account_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete active tasks for their characters" ON public.active_tasks;
CREATE POLICY "Users can delete active tasks for their characters"
  ON public.active_tasks FOR DELETE
  USING (
    character_id IN (
      SELECT id FROM public.characters WHERE account_id = auth.uid()
    )
  );
