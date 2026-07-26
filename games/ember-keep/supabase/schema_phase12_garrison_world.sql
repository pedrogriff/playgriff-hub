-- ================================================================
-- EMBER KEEP — PHASE 12: GARRISON NETWORK, WORLD RIFTS, BOUNTIES & CLAN MIGRATION
-- Execute this script in the Supabase SQL Editor
-- ================================================================

-- 1. Garrison Assignments Table
CREATE TABLE IF NOT EXISTS public.garrison_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts_profile(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  station_id VARCHAR(50) NOT NULL CHECK (station_id IN (
    'alchemy_lab', 'scout_tower', 'training_grounds', 'forge_station'
  )),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_char_garrison UNIQUE (character_id),
  CONSTRAINT unique_station_account UNIQUE (account_id, station_id)
);

ALTER TABLE public.garrison_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own garrison assignments" ON public.garrison_assignments;
CREATE POLICY "Users can manage own garrison assignments"
  ON public.garrison_assignments FOR ALL
  USING (account_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_garrison_account ON public.garrison_assignments(account_id);

-- 2. World Rifts (Global Bosses)
CREATE TABLE IF NOT EXISTS public.world_rifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  boss_icon VARCHAR(10) DEFAULT '👹',
  total_hp BIGINT NOT NULL DEFAULT 10000000000,
  current_hp BIGINT NOT NULL DEFAULT 10000000000,
  reward_tier INT DEFAULT 1,
  active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

ALTER TABLE public.world_rifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select on active world rifts" ON public.world_rifts;
CREATE POLICY "Public select on active world rifts"
  ON public.world_rifts FOR SELECT
  USING (true);

-- 3. Player Rift Contributions
CREATE TABLE IF NOT EXISTS public.rift_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rift_id UUID NOT NULL REFERENCES public.world_rifts(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts_profile(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  character_name VARCHAR(50),
  damage_dealt BIGINT NOT NULL DEFAULT 0,
  contributed_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_rift_char UNIQUE (rift_id, character_id)
);

ALTER TABLE public.rift_contributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select on rift contributions" ON public.rift_contributions;
CREATE POLICY "Public select on rift contributions"
  ON public.rift_contributions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own rift contributions" ON public.rift_contributions;
CREATE POLICY "Users can insert own rift contributions"
  ON public.rift_contributions FOR INSERT
  WITH CHECK (account_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own rift contributions" ON public.rift_contributions;
CREATE POLICY "Users can update own rift contributions"
  ON public.rift_contributions FOR UPDATE
  USING (account_id = auth.uid());

-- 4. Community Bounties ("The King's Bounty")
CREATE TABLE IF NOT EXISTS public.community_bounties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  resource_target VARCHAR(100) NOT NULL,
  resource_name TEXT NOT NULL,
  resource_icon VARCHAR(10) DEFAULT '📦',
  target_quantity BIGINT NOT NULL,
  current_quantity BIGINT NOT NULL DEFAULT 0,
  reward_description TEXT,
  active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

ALTER TABLE public.community_bounties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select on community bounties" ON public.community_bounties;
CREATE POLICY "Public select on community bounties"
  ON public.community_bounties FOR SELECT
  USING (true);

-- 5. Bounty Donations
CREATE TABLE IF NOT EXISTS public.bounty_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID NOT NULL REFERENCES public.community_bounties(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts_profile(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  item_id VARCHAR(100) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  donated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bounty_donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select on bounty donations" ON public.bounty_donations;
CREATE POLICY "Public select on bounty donations"
  ON public.bounty_donations FOR SELECT
  USING (true);

-- 6. Clans Table (Supabase Migration from localStorage)
CREATE TABLE IF NOT EXISTS public.clans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  tag VARCHAR(10) NOT NULL UNIQUE,
  icon VARCHAR(10) DEFAULT '⚔️',
  leader_account_id UUID NOT NULL REFERENCES public.accounts_profile(id) ON DELETE CASCADE,
  max_members INT DEFAULT 20,
  siege_points INT DEFAULT 0,
  total_power INT DEFAULT 0,
  fortresses JSONB DEFAULT '[]'::jsonb,
  members JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select on clans" ON public.clans;
CREATE POLICY "Public select on clans"
  ON public.clans FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert clans" ON public.clans;
CREATE POLICY "Users can insert clans"
  ON public.clans FOR INSERT
  WITH CHECK (leader_account_id = auth.uid());

DROP POLICY IF EXISTS "Leaders/officers can update clans" ON public.clans;
CREATE POLICY "Leaders/officers can update clans"
  ON public.clans FOR UPDATE
  USING (true);

-- 7. Add Hearth Visit Tracking to accounts_profile
ALTER TABLE public.accounts_profile
  ADD COLUMN IF NOT EXISTS last_hearth_visit TIMESTAMPTZ DEFAULT NULL;

-- ================================================================
-- RPC PROCEDURES
-- ================================================================

-- Atomic Rift Damage RPC
CREATE OR REPLACE FUNCTION public.submit_rift_damage(
    p_character_id UUID,
    p_rift_id UUID,
    p_damage BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_account_id UUID;
  v_char RECORD;
  v_rift RECORD;
  v_actual_dmg BIGINT;
BEGIN
  -- Ownership Check
  SELECT account_id INTO v_account_id FROM public.characters WHERE id = p_character_id;
  IF v_account_id IS NULL OR v_account_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized character ownership.';
  END IF;

  SELECT * INTO v_char FROM public.characters WHERE id = p_character_id FOR UPDATE;
  SELECT * INTO v_rift FROM public.world_rifts WHERE id = p_rift_id AND active = true FOR UPDATE;

  IF v_rift.id IS NULL THEN
    RAISE EXCEPTION 'No active World Rift found for ID %', p_rift_id;
  END IF;

  v_actual_dmg := LEAST(p_damage, v_rift.current_hp);

  -- Atomic HP Reduction
  UPDATE public.world_rifts
  SET current_hp = GREATEST(0, current_hp - v_actual_dmg),
      active = (current_hp - v_actual_dmg > 0)
  WHERE id = p_rift_id;

  -- Upsert Player Contribution
  INSERT INTO public.rift_contributions (
    rift_id, account_id, character_id, character_name, damage_dealt, contributed_at
  ) VALUES (
    p_rift_id, v_account_id, p_character_id, v_char.name, v_actual_dmg, NOW()
  )
  ON CONFLICT (rift_id, character_id) DO UPDATE SET
    damage_dealt = public.rift_contributions.damage_dealt + EXCLUDED.damage_dealt,
    contributed_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'rift_id', p_rift_id,
    'damage_dealt', v_actual_dmg,
    'remaining_hp', GREATEST(0, v_rift.current_hp - v_actual_dmg),
    'boss_defeated', (v_rift.current_hp - v_actual_dmg <= 0)
  );
END;
$$;

-- Atomic Bounty Donation RPC
CREATE OR REPLACE FUNCTION public.donate_to_bounty(
    p_character_id UUID,
    p_bounty_id UUID,
    p_item_id VARCHAR,
    p_quantity INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_account_id UUID;
  v_char RECORD;
  v_bounty RECORD;
  v_held_qty INT;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Donation quantity must be greater than zero.';
  END IF;

  SELECT account_id INTO v_account_id FROM public.characters WHERE id = p_character_id;
  IF v_account_id IS NULL OR v_account_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized character ownership.';
  END IF;

  SELECT * INTO v_char FROM public.characters WHERE id = p_character_id FOR UPDATE;
  SELECT * INTO v_bounty FROM public.community_bounties WHERE id = p_bounty_id AND active = true FOR UPDATE;

  IF v_bounty.id IS NULL THEN
    RAISE EXCEPTION 'No active community bounty found.';
  END IF;

  IF v_bounty.resource_target != p_item_id THEN
    RAISE EXCEPTION 'Item % does not match bounty target %', p_item_id, v_bounty.resource_target;
  END IF;

  -- Check inventory quantity
  SELECT COALESCE(SUM(quantity), 0) INTO v_held_qty
  FROM public.character_inventories
  WHERE character_id = p_character_id AND item_id = p_item_id;

  IF v_held_qty < p_quantity THEN
    RAISE EXCEPTION 'Insufficient inventory items. Held: %, Required: %', v_held_qty, p_quantity;
  END IF;

  -- Deduct inventory item
  UPDATE public.character_inventories
  SET quantity = quantity - p_quantity, updated_at = NOW()
  WHERE character_id = p_character_id AND item_id = p_item_id;

  DELETE FROM public.character_inventories
  WHERE character_id = p_character_id AND item_id = p_item_id AND quantity <= 0;

  -- Update bounty progress
  UPDATE public.community_bounties
  SET current_quantity = current_quantity + p_quantity
  WHERE id = p_bounty_id;

  -- Log donation
  INSERT INTO public.bounty_donations (
    bounty_id, account_id, character_id, item_id, quantity, donated_at
  ) VALUES (
    p_bounty_id, v_account_id, p_character_id, p_item_id, p_quantity, NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'bounty_id', p_bounty_id,
    'quantity_donated', p_quantity,
    'new_current_quantity', v_bounty.current_quantity + p_quantity,
    'target_quantity', v_bounty.target_quantity,
    'bounty_completed', (v_bounty.current_quantity + p_quantity >= v_bounty.target_quantity)
  );
END;
$$;

-- Seed initial World Rift & Community Bounty if empty
INSERT INTO public.world_rifts (name, description, boss_icon, total_hp, current_hp, active)
SELECT 'Malakor the Ember Tyrant', 'A primordial dragon spawned from the volcano core. Submit damage bursts to defeat him!', '🐲', 10000000000, 10000000000, true
WHERE NOT EXISTS (SELECT 1 FROM public.world_rifts WHERE active = true);

INSERT INTO public.community_bounties (title, resource_target, resource_name, resource_icon, target_quantity, current_quantity, reward_description, active)
SELECT 'The King''s Iron Supply', 'item_ore_iron', 'Iron Ore', '🪨', 500000, 125000, 'Unlocks +15% Gold & Drop Rate for 24 Hours!', true
WHERE NOT EXISTS (SELECT 1 FROM public.community_bounties WHERE active = true);

-- Grants
GRANT EXECUTE ON FUNCTION public.submit_rift_damage(UUID, UUID, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.donate_to_bounty(UUID, UUID, VARCHAR, INT) TO authenticated;
