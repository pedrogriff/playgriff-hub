-- Schema Migration: Add unlocked_level and completed_side_zones to public.characters
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS unlocked_level INT DEFAULT 1 CHECK (unlocked_level >= 1),
  ADD COLUMN IF NOT EXISTS completed_side_zones JSONB DEFAULT '[]'::jsonb;
