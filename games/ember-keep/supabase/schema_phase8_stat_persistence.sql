-- ================================================================
-- EMBER KEEP — PHASE 8: STAT PERSISTENCE, HOUSE & EXPANDED LOOT
-- Execute this script in the Supabase SQL Editor
-- ================================================================

-- 1. Ensure public.characters has skill_points, allocated_stats, and house columns
ALTER TABLE public.characters 
  ADD COLUMN IF NOT EXISTS skill_points INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS allocated_stats JSONB DEFAULT '{"hp": 0, "power": 0, "defense": 0}'::jsonb,
  ADD COLUMN IF NOT EXISTS house JSONB DEFAULT '{"tier": 0, "name": "No Housing", "slots": [], "decorations": []}'::jsonb;

-- 2. Seed / Expand Comprehensive Equipment Templates (Levels 1–50)
INSERT INTO public.item_templates (item_id, name, slot_type, rarity, min_level, base_stats, is_shop_item, base_shop_price, icon)
VALUES
  -- Level 1–5 (Novice / Tier 1)
  ('head_leather_cap',       'Novice Leather Cap',     'head',      'common', 1, '{"defense": 2, "max_hp": 10}', true, 15, '🪖'),
  ('chest_cloth_tunic',      'Apprentice Cloth Tunic', 'chest',     'common', 1, '{"defense": 3, "max_hp": 15}', true, 20, '🥋'),
  ('legs_leather_pants',     'Rough Leather Pants',    'legs',      'common', 1, '{"defense": 2, "max_hp": 10}', true, 15, '👖'),
  ('main_iron_dagger',       'Iron Dagger',            'main_hand', 'common', 1, '{"attack_power": 6, "crit_chance": 0.02}', true, 25, '🗡️'),
  ('off_wooden_shield',      'Wooden Buckler',         'off_hand',  'common', 1, '{"defense": 4, "dodge_chance": 0.01}', true, 20, '🛡️'),
  ('acc_copper_ring',        'Copper Band',            'accessory', 'common', 1, '{"max_hp": 15, "crit_chance": 0.01}', true, 30, '💍'),

  -- Level 5–10 (Iron Vanguard)
  ('head_iron_helm',         'Iron Vanguard Helm',     'head',      'uncommon', 5, '{"defense": 6, "max_hp": 25}', true, 45, '🪖'),
  ('chest_iron_cuirass',      'Reinforced Iron Cuirass','chest',     'uncommon', 5, '{"defense": 8, "max_hp": 35}', true, 60, '🥋'),
  ('legs_iron_greaves',      'Iron Plate Greaves',     'legs',      'uncommon', 5, '{"defense": 6, "max_hp": 25}', true, 50, '👖'),
  ('main_steel_sword',       'Forged Steel Blade',     'main_hand', 'uncommon', 5, '{"attack_power": 14, "crit_chance": 0.03}', true, 75, '⚔️'),
  ('off_iron_shield',        'Iron Wall Shield',       'off_hand',  'uncommon', 5, '{"defense": 9, "max_hp": 20}', true, 65, '🛡️'),
  ('acc_silver_amulet',      'Silver Wolf Amulet',     'accessory', 'uncommon', 8, '{"attack_power": 4, "crit_chance": 0.03}', true, 90, '📿'),

  -- Level 10–15 (Adept)
  ('head_scout_hood',        'Hunter Scout Hood',      'head',      'uncommon', 10, '{"defense": 9, "max_hp": 35, "dodge_chance": 0.02}', true, 110, '🧢'),
  ('chest_scout_vest',       'Hunter Scout Vest',      'chest',     'uncommon', 10, '{"defense": 12, "max_hp": 50}', true, 130, '🎽'),
  ('legs_scout_breeches',    'Hunter Scout Breeches',  'legs',      'uncommon', 10, '{"defense": 10, "max_hp": 40}', true, 120, '👖'),
  ('main_recurve_bow',       'Composite Recurve Bow',  'main_hand', 'uncommon', 10, '{"attack_power": 22, "crit_chance": 0.04}', true, 150, '🏹'),
  ('off_scout_quiver',       'Precision Quiver',       'off_hand',  'uncommon', 10, '{"attack_power": 6, "crit_chance": 0.03}', true, 120, '🎒'),
  ('acc_ruby_ring',          'Ruby Flame Ring',        'accessory', 'uncommon', 12, '{"attack_power": 8, "max_hp": 30}', true, 140, '💍'),

  -- Level 15–25 (Drakescale / Rare)
  ('head_drakescale_cowl',   'Drakescale Cowl',        'head',      'rare', 15, '{"defense": 15, "max_hp": 65, "crit_chance": 0.03}', true, 220, '👺'),
  ('chest_drakescale_hauberk','Drakescale Hauberk',    'chest',     'rare', 15, '{"defense": 22, "max_hp": 90, "dodge_chance": 0.02}', true, 280, '🥋'),
  ('legs_drakescale_greaves', 'Drakescale Greaves',    'legs',      'rare', 15, '{"defense": 17, "max_hp": 70}', true, 240, '👖'),
  ('main_frost_blade',       'Frostbite Claymore',     'main_hand', 'rare', 18, '{"attack_power": 32, "crit_chance": 0.05}', true, 350, '⚔️'),
  ('off_tower_shield',       'Aegis Tower Shield',     'off_hand',  'rare', 18, '{"defense": 24, "max_hp": 60}', true, 300, '🛡️'),
  ('acc_ruby_signet',        'Ruby Warlord Ring',      'accessory', 'rare', 20, '{"attack_power": 12, "crit_chance": 0.04}', true, 380, '💍'),

  -- Level 25–35 (Shadow & Titan)
  ('head_shadow_hood',       'Shadowwalker Hood',      'head',      'epic', 25, '{"defense": 24, "crit_chance": 0.06, "dodge_chance": 0.04}', false, 0, '🥷'),
  ('chest_shadow_harness',    'Shadowfang Cuirass',     'chest',     'epic', 25, '{"defense": 32, "max_hp": 140, "dodge_chance": 0.05}', false, 0, '🎽'),
  ('legs_shadow_leggings',   'Shadowfang Leggings',    'legs',      'epic', 25, '{"defense": 26, "max_hp": 110, "dodge_chance": 0.03}', false, 0, '👖'),
  ('main_shadow_blade',      'Shadowfang Dagger',      'main_hand', 'epic', 25, '{"attack_power": 48, "crit_chance": 0.08}', false, 0, '🗡️'),
  ('off_shadow_orb',         'Shadow Orb of Power',    'off_hand',  'epic', 25, '{"attack_power": 18, "crit_chance": 0.05}', false, 0, '🔮'),
  ('head_titan_visor',       'Titan Iron Visor',       'head',      'rare', 30, '{"defense": 30, "max_hp": 130}', true, 500, '🪖'),
  ('chest_titan_plate',      'Titanium Greatplate',    'chest',     'rare', 30, '{"defense": 42, "max_hp": 180}', true, 700, '🛡️'),
  ('legs_titan_greaves',     'Titanium Legguards',     'legs',      'rare', 30, '{"defense": 34, "max_hp": 140}', true, 600, '👖'),
  ('main_ember_scimitar',    'Emberflame Scimitar',    'main_hand', 'rare', 32, '{"attack_power": 58, "crit_chance": 0.06}', true, 850, '🗡️'),
  ('acc_dragon_eye',         'Dragon Eye Pendant',     'accessory', 'rare', 35, '{"attack_power": 22, "crit_chance": 0.05, "max_hp": 110}', true, 1000, '📿'),

  -- Level 35–50 (Phoenix & Celestial)
  ('head_phoenix_crown',     'Phoenix Crown of Light', 'head',      'epic', 40, '{"defense": 40, "max_hp": 180, "crit_chance": 0.05}', false, 0, '👑'),
  ('chest_phoenix_robes',    'Phoenixfire Robes',      'chest',     'epic', 40, '{"defense": 50, "max_hp": 240, "crit_chance": 0.06}', false, 0, '🥋'),
  ('legs_phoenix_greaves',   'Phoenixfire Greaves',    'legs',      'epic', 40, '{"defense": 42, "max_hp": 200}', false, 0, '👖'),
  ('main_phoenix_blade',     'Phoenix Heart Greatsword','main_hand','epic', 40, '{"attack_power": 85, "crit_chance": 0.09, "max_hp": 160}', false, 0, '🔥'),
  ('off_phoenix_crest',      'Phoenix Wall Aegis',     'off_hand',  'epic', 40, '{"defense": 50, "max_hp": 200, "dodge_chance": 0.04}', false, 0, '🛡️'),
  ('acc_phoenix_band',       'Phoenixfire Ring',       'accessory', 'epic', 40, '{"attack_power": 28, "crit_chance": 0.07, "max_hp": 140}', false, 0, '💍'),
  ('head_celestial_crown',   'Crown of the Sun God',   'head',      'legendary', 48, '{"defense": 55, "max_hp": 260, "crit_chance": 0.07}', false, 0, '👑'),
  ('chest_celestial_harness','Celestial Star Plate',   'chest',     'legendary', 48, '{"defense": 75, "max_hp": 350, "dodge_chance": 0.07}', false, 0, '✨'),
  ('legs_celestial_greaves', 'Celestial Legguards',    'legs',      'legendary', 48, '{"defense": 60, "max_hp": 280}', false, 0, '👖'),
  ('main_excalibur',         'Excalibur Holy Relic',   'main_hand', 'legendary', 50, '{"attack_power": 135, "crit_chance": 0.12, "max_hp": 300}', false, 0, '⚔️'),
  ('off_celestial_shield',   'Aegis of Eternity',      'off_hand',  'legendary', 50, '{"defense": 65, "max_hp": 280, "dodge_chance": 0.06}', false, 0, '🛡️'),
  ('acc_sovereign_ring',     'Sovereign Ring',         'accessory', 'legendary', 50, '{"attack_power": 50, "defense": 35, "crit_chance": 0.10, "max_hp": 400}', false, 0, '🌟')
ON CONFLICT (item_id) DO UPDATE SET
  name = EXCLUDED.name,
  slot_type = EXCLUDED.slot_type,
  rarity = EXCLUDED.rarity,
  min_level = EXCLUDED.min_level,
  base_stats = EXCLUDED.base_stats,
  is_shop_item = EXCLUDED.is_shop_item,
  base_shop_price = EXCLUDED.base_shop_price,
  icon = EXCLUDED.icon;
