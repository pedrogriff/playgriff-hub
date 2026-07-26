-- ================================================================
-- EMBER KEEP — PHASE 14: DISCORD WEBHOOKS, COMMUNITY API & HOUSING VISITS
-- Execute this script in the Supabase SQL Editor
-- ================================================================

-- 1. Add Discord Webhook Storage to accounts_profile (Account-Level Scope - Q2)
ALTER TABLE public.accounts_profile
  ADD COLUMN IF NOT EXISTS discord_webhook_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS webhook_events JSONB DEFAULT '["rebirth", "rift_kill", "market_sale", "pet_hatch", "bounty_completed"]'::jsonb,
  ADD COLUMN IF NOT EXISTS hearth_buff_until TIMESTAMPTZ DEFAULT NULL;

-- Immutable UTC date helper for index expressions
CREATE OR REPLACE FUNCTION public.immutable_utc_date(p_ts TIMESTAMPTZ)
RETURNS DATE
LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$
  SELECT (p_ts AT TIME ZONE 'UTC')::date;
$$;

CREATE TABLE IF NOT EXISTS public.housing_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_account_id UUID NOT NULL REFERENCES public.accounts_profile(id) ON DELETE CASCADE,
  visitor_account_id UUID NOT NULL REFERENCES public.accounts_profile(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  buff_granted BOOLEAN DEFAULT true
);

-- Unique index for max 1 visit per host/visitor pair per UTC day
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_daily_hearth_visit 
  ON public.housing_visits(host_account_id, visitor_account_id, (public.immutable_utc_date(visited_at)));

ALTER TABLE public.housing_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select on housing visits" ON public.housing_visits;
CREATE POLICY "Public select on housing visits"
  ON public.housing_visits FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert housing visits" ON public.housing_visits;
CREATE POLICY "Users can insert housing visits"
  ON public.housing_visits FOR INSERT
  WITH CHECK (visitor_account_id = auth.uid());

-- 3. RPC: Visit Housing Hearth
-- Grants both host and visitor a 2-hour +15% production speed buff
CREATE OR REPLACE FUNCTION public.visit_housing_hearth(p_host_account_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_visitor_account_id UUID;
  v_buff_expiry TIMESTAMPTZ;
BEGIN
  v_visitor_account_id := auth.uid();
  IF v_visitor_account_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated.';
  END IF;

  IF v_visitor_account_id = p_host_account_id THEN
    RAISE EXCEPTION 'Cannot visit your own hearth for visitor rewards.';
  END IF;

  v_buff_expiry := NOW() + INTERVAL '2 hours';

  -- Log visit (enforces max 1 visit per host per day)
  INSERT INTO public.housing_visits (
    host_account_id, visitor_account_id, visited_at, buff_granted
  ) VALUES (
    p_host_account_id, v_visitor_account_id, NOW(), true
  );

  -- Grant buff to visitor
  UPDATE public.accounts_profile
  SET hearth_buff_until = v_buff_expiry, updated_at = NOW()
  WHERE id = v_visitor_account_id;

  -- Grant buff to host
  UPDATE public.accounts_profile
  SET hearth_buff_until = v_buff_expiry, updated_at = NOW()
  WHERE id = p_host_account_id;

  RETURN jsonb_build_object(
    'success', true,
    'host_account_id', p_host_account_id,
    'visitor_account_id', v_visitor_account_id,
    'buff_expiry', v_buff_expiry
  );
END;
$$;

-- 4. RPC: Update Webhook Settings
CREATE OR REPLACE FUNCTION public.update_webhook_settings(
    p_webhook_url TEXT,
    p_events JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_account_id UUID;
BEGIN
  v_account_id := auth.uid();
  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated.';
  END IF;

  UPDATE public.accounts_profile
  SET discord_webhook_url = p_webhook_url,
      webhook_events = p_events,
      updated_at = NOW()
  WHERE id = v_account_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.visit_housing_hearth(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_webhook_settings(TEXT, JSONB) TO authenticated;
