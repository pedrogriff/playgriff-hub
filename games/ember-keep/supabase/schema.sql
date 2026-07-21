-- ================================================================
-- EMBER KEEP — PostgreSQL Database Schema & RLS Policies
-- Execute this script in the Supabase SQL Editor
-- ================================================================

-- 1. Create accounts_profile table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.accounts_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_tier VARCHAR(20) DEFAULT 'standard' CHECK (account_tier IN ('standard', 'premium', 'admin')),
  ascension_points INT DEFAULT 0 CHECK (ascension_points >= 0),
  last_ap_accrual TIMESTAMPTZ DEFAULT NOW(),
  max_ap INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create characters table
CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts_profile(id) ON DELETE CASCADE,
  slot_index INT NOT NULL CHECK (slot_index BETWEEN 1 AND 5),
  name VARCHAR(50) NOT NULL,
  class_id VARCHAR(50) NOT NULL,
  level INT DEFAULT 1 CHECK (level >= 1),
  exp INT DEFAULT 0 CHECK (exp >= 0),
  max_exp INT DEFAULT 100,
  stamina INT DEFAULT 100,
  max_stamina INT DEFAULT 100,
  mana INT DEFAULT 50,
  max_mana INT DEFAULT 50,
  hp INT DEFAULT 100,
  max_hp INT DEFAULT 100,
  power INT DEFAULT 10,
  defense INT DEFAULT 5,
  crit_chance NUMERIC(4,3) DEFAULT 0.050,
  crit_damage NUMERIC(4,2) DEFAULT 1.50,
  dodge_chance NUMERIC(4,3) DEFAULT 0.050,
  gold INT DEFAULT 50 CHECK (gold >= 0),
  gems INT DEFAULT 0 CHECK (gems >= 0),
  skill_points INT DEFAULT 0,
  allocated_stats JSONB DEFAULT '{"hp": 0, "power": 0, "defense": 0}'::jsonb,
  equipped JSONB DEFAULT '{"weapon": null, "armor": null, "ring": null}'::jsonb,
  inventory JSONB DEFAULT '[{"id": "potion_hp_small", "name": "Small HP Potion", "type": "consumable", "qty": 3, "icon": "🧪", "value": 30}]'::jsonb,
  professions JSONB DEFAULT '{"mining": {"level": 1, "xp": 0}, "woodcutting": {"level": 1, "xp": 0}, "fishing": {"level": 1, "xp": 0}, "smelting": {"level": 1, "xp": 0}, "cooking": {"level": 1, "xp": 0}, "alchemy": {"level": 1, "xp": 0}, "forge": {"level": 1, "xp": 0}}'::jsonb,
  active_pet JSONB DEFAULT NULL,
  active_perks JSONB DEFAULT '[]'::jsonb,
  location_node VARCHAR(50) DEFAULT 'greenhollow',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_account_slot UNIQUE (account_id, slot_index)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_characters_account ON public.characters(account_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.accounts_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for accounts_profile
DROP POLICY IF EXISTS "Users can view own account profile" ON public.accounts_profile;
CREATE POLICY "Users can view own account profile"
  ON public.accounts_profile FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own account profile" ON public.accounts_profile;
CREATE POLICY "Users can update own account profile"
  ON public.accounts_profile FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own account profile" ON public.accounts_profile;
CREATE POLICY "Users can insert own account profile"
  ON public.accounts_profile FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 5. RLS Policies for characters
DROP POLICY IF EXISTS "Users can view own characters" ON public.characters;
CREATE POLICY "Users can view own characters"
  ON public.characters FOR SELECT
  USING (auth.uid() = account_id);

DROP POLICY IF EXISTS "Users can insert own characters" ON public.characters;
CREATE POLICY "Users can insert own characters"
  ON public.characters FOR INSERT
  WITH CHECK (auth.uid() = account_id);

DROP POLICY IF EXISTS "Users can update own characters" ON public.characters;
CREATE POLICY "Users can update own characters"
  ON public.characters FOR UPDATE
  USING (auth.uid() = account_id);

DROP POLICY IF EXISTS "Users can delete own characters" ON public.characters;
CREATE POLICY "Users can delete own characters"
  ON public.characters FOR DELETE
  USING (auth.uid() = account_id);

-- 6. Automatic Account Profile Trigger on auth.users registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.accounts_profile (id, account_tier, ascension_points)
  VALUES (new.id, 'standard', 0)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
