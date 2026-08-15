-- ========================================================
-- EQUIPMENT EXPANSION, SHOP & SCALED LOOT DROP SCHEMA
-- Execute this script in the Supabase SQL Editor
-- ========================================================

-- 1. Create Item Reference Table (public.item_templates)
CREATE TABLE IF NOT EXISTS public.item_templates (
    item_id VARCHAR(100) PRIMARY KEY,
    name TEXT NOT NULL,
    slot_type VARCHAR(50) NOT NULL, -- head, chest, legs, main_hand, off_hand, accessory
    rarity VARCHAR(50) NOT NULL,    -- common, uncommon, rare, epic, legendary
    min_level INT NOT NULL DEFAULT 1,
    base_stats JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_shop_item BOOLEAN DEFAULT false,
    base_shop_price INT DEFAULT 0,
    icon VARCHAR(10) DEFAULT '📦',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for item_templates (Read-only for authenticated users)
ALTER TABLE public.item_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public item templates are readable by all authenticated users" ON public.item_templates;
CREATE POLICY "Public item templates are readable by all authenticated users"
    ON public.item_templates FOR SELECT
    USING (true);

-- 2. Seed 30 Diverse Equipment Templates
INSERT INTO public.item_templates (item_id, name, slot_type, rarity, min_level, base_stats, is_shop_item, base_shop_price, icon)
VALUES
  -- ── TIER 1 (Lv 1–10) ──
  ('head_leather_cap', 'Novice Leather Cap', 'head', 'common', 1, '{"defense": 2, "max_hp": 10}', true, 15, '🪖'),
  ('chest_cloth_tunic', 'Apprentice Cloth Tunic', 'chest', 'common', 1, '{"defense": 3, "max_hp": 15}', true, 20, '🥋'),
  ('legs_leather_pants', 'Rough Leather Pants', 'legs', 'common', 1, '{"defense": 2, "max_hp": 10}', true, 15, '👖'),
  ('main_iron_dagger', 'Iron Dagger', 'main_hand', 'common', 1, '{"attack_power": 6, "crit_chance": 0.02}', true, 25, '🗡️'),
  ('off_wooden_shield', 'Wooden Buckler', 'off_hand', 'common', 1, '{"defense": 4, "dodge_chance": 0.01}', true, 20, '🛡️'),
  ('acc_copper_ring', 'Copper Band', 'accessory', 'common', 1, '{"max_hp": 15, "crit_chance": 0.01}', true, 30, '💍'),

  ('head_iron_helm', 'Iron Vanguard Helm', 'head', 'uncommon', 5, '{"defense": 6, "max_hp": 25}', true, 45, '🪖'),
  ('chest_iron_cuirass', 'Reinforced Iron Cuirass', 'chest', 'uncommon', 5, '{"defense": 8, "max_hp": 35}', true, 60, '🥋'),
  ('main_steel_sword', 'Forged Steel Blade', 'main_hand', 'uncommon', 5, '{"attack_power": 14, "crit_chance": 0.03}', true, 75, '⚔️'),
  ('acc_silver_amulet', 'Silver Wolf Amulet', 'accessory', 'uncommon', 8, '{"attack_power": 4, "crit_chance": 0.03}', true, 90, '📿'),

  -- ── TIER 2 (Lv 11–25) ──
  ('head_drakescale_cowl', 'Drakescale Cowl', 'head', 'rare', 12, '{"defense": 12, "max_hp": 55, "crit_chance": 0.03}', true, 150, '👺'),
  ('chest_drakescale_hauberk', 'Drakescale Hauberk', 'chest', 'rare', 15, '{"defense": 18, "max_hp": 80, "dodge_chance": 0.02}', true, 220, '🥋'),
  ('legs_drakescale_greaves', 'Drakescale Greaves', 'legs', 'rare', 15, '{"defense": 14, "max_hp": 60}', true, 180, '👖'),
  ('main_frost_blade', 'Frostbite Claymore', 'main_hand', 'rare', 18, '{"attack_power": 28, "crit_chance": 0.05}', true, 300, '⚔️'),
  ('off_tower_shield', 'Aegis Tower Shield', 'off_hand', 'rare', 18, '{"defense": 22, "max_hp": 50}', true, 260, '🛡️'),
  ('acc_ruby_signet', 'Ruby Warlord Ring', 'accessory', 'rare', 20, '{"attack_power": 10, "crit_chance": 0.04}', true, 350, '💍'),

  ('head_shadow_hood', 'Shadowwalker Hood', 'head', 'epic', 22, '{"defense": 20, "crit_chance": 0.06, "dodge_chance": 0.04}', false, 0, '🥷'),
  ('main_shadow_blade', 'Shadowfang Dagger', 'main_hand', 'epic', 25, '{"attack_power": 42, "crit_chance": 0.08}', false, 0, '🗡️'),
  ('chest_shadow_harness', 'Shadowfang Cuirass', 'chest', 'epic', 25, '{"defense": 28, "max_hp": 120, "dodge_chance": 0.05}', false, 0, '🎽'),

  -- ── TIER 3 (Lv 26–40) ──
  ('head_titan_visor', 'Titan Iron Visor', 'head', 'rare', 28, '{"defense": 26, "max_hp": 110}', true, 450, '🪖'),
  ('chest_titan_plate', 'Titanium Greatplate', 'chest', 'rare', 30, '{"defense": 38, "max_hp": 160}', true, 650, '🛡️'),
  ('main_ember_scimitar', 'Emberflame Scimitar', 'main_hand', 'rare', 32, '{"attack_power": 52, "crit_chance": 0.06}', true, 800, '🗡️'),
  ('acc_dragon_eye', 'Dragon Eye Pendant', 'accessory', 'rare', 35, '{"attack_power": 18, "crit_chance": 0.05, "max_hp": 90}', true, 950, '📿'),

  ('main_phoenix_blade', 'Phoenix Heart Greatsword', 'main_hand', 'epic', 38, '{"attack_power": 75, "crit_chance": 0.09, "max_hp": 140}', false, 0, '🔥'),
  ('off_phoenix_crest', 'Phoenix Wall Aegis', 'off_hand', 'epic', 38, '{"defense": 45, "max_hp": 180, "dodge_chance": 0.04}', false, 0, '🛡️'),
  ('acc_phoenix_band', 'Phoenixfire Ring', 'accessory', 'epic', 40, '{"attack_power": 25, "crit_chance": 0.07, "max_hp": 120}', false, 0, '💍'),

  -- ── TIER 4 (Lv 41+) ──
  ('head_celestial_crown', 'Crown of the Sun God', 'head', 'epic', 42, '{"defense": 48, "max_hp": 220, "crit_chance": 0.06}', false, 0, '👑'),
  ('chest_celestial_harness', 'Celestial Star Plate', 'chest', 'epic', 45, '{"defense": 65, "max_hp": 300, "dodge_chance": 0.06}', false, 0, '✨'),
  ('main_excalibur', 'Excalibur the Holy Relic', 'main_hand', 'legendary', 45, '{"attack_power": 120, "crit_chance": 0.12, "max_hp": 250}', false, 0, '⚔️'),
  ('acc_sovereign_ring', 'Sovereign Ring of Eternity', 'accessory', 'legendary', 50, '{"attack_power": 45, "defense": 30, "crit_chance": 0.10, "max_hp": 350}', false, 0, '🌟')
ON CONFLICT (item_id) DO UPDATE SET
  name = EXCLUDED.name,
  slot_type = EXCLUDED.slot_type,
  rarity = EXCLUDED.rarity,
  min_level = EXCLUDED.min_level,
  base_stats = EXCLUDED.base_stats,
  is_shop_item = EXCLUDED.is_shop_item,
  base_shop_price = EXCLUDED.base_shop_price,
  icon = EXCLUDED.icon;

-- 3. PL/pgSQL Weighted Loot Roll Helper Procedure
CREATE OR REPLACE FUNCTION public.roll_loot_drop(
    p_level INT,
    p_is_boss BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_roll FLOAT := random();
    v_target_rarity VARCHAR(50);
    v_template RECORD;
    v_rarity_mult FLOAT := 1.0;
    v_scaled_stats JSONB := '{}'::jsonb;
    v_key TEXT;
    v_val NUMERIC;
    v_scaled_val INT;
BEGIN
    -- Determine target rarity based on kill type & level
    IF NOT p_is_boss THEN
        IF v_roll < 0.85 THEN v_target_rarity := 'common';
        ELSIF v_roll < 0.99 THEN v_target_rarity := 'uncommon';
        ELSE v_target_rarity := 'rare';
        END IF;
    ELSE
        IF p_level < 20 THEN
            IF v_roll < 0.40 THEN v_target_rarity := 'common';
            ELSIF v_roll < 0.85 THEN v_target_rarity := 'uncommon';
            ELSE v_target_rarity := 'rare';
            END IF;
        ELSIF p_level >= 20 AND p_level < 40 THEN
            IF v_roll < 0.30 THEN v_target_rarity := 'common';
            ELSIF v_roll < 0.75 THEN v_target_rarity := 'uncommon';
            ELSIF v_roll < 0.97 THEN v_target_rarity := 'rare';
            ELSE v_target_rarity := 'epic';
            END IF;
        ELSE
            IF v_roll < 0.20 THEN v_target_rarity := 'common';
            ELSIF v_roll < 0.60 THEN v_target_rarity := 'uncommon';
            ELSIF v_roll < 0.90 THEN v_target_rarity := 'rare';
            ELSIF v_roll < 0.998 THEN v_target_rarity := 'epic';
            ELSE v_target_rarity := 'legendary';
            END IF;
        END IF;
    END IF;

    -- Pick random template matching rarity & min_level <= p_level
    SELECT * INTO v_template
    FROM public.item_templates
    WHERE rarity = v_target_rarity AND min_level <= GREATEST(1, p_level)
    ORDER BY random()
    LIMIT 1;

    -- Fallback to common if no template found
    IF v_template IS NULL THEN
        SELECT * INTO v_template
        FROM public.item_templates
        WHERE min_level <= GREATEST(1, p_level)
        ORDER BY random()
        LIMIT 1;
    END IF;

    IF v_template IS NULL THEN
        RETURN NULL;
    END IF;

    -- Rarity Multipliers
    IF v_template.rarity = 'uncommon' THEN v_rarity_mult := 1.3;
    ELSIF v_template.rarity = 'rare' THEN v_rarity_mult := 1.8;
    ELSIF v_template.rarity = 'epic' THEN v_rarity_mult := 2.5;
    ELSIF v_template.rarity = 'legendary' THEN v_rarity_mult := 4.0;
    ELSE v_rarity_mult := 1.0;
    END IF;

    -- Stat Exponential Scaling: Floor(BaseStat * (1 + p_level * 0.12)^1.15 * RarityMult)
    FOR v_key, v_val IN SELECT * FROM jsonb_each_text(v_template.base_stats) LOOP
        IF v_key IN ('attack_power', 'defense', 'max_hp') THEN
            v_scaled_val := FLOOR((v_val::NUMERIC) * POWER(1.0 + p_level * 0.12, 1.15) * v_rarity_mult);
            v_scaled_stats := jsonb_set(v_scaled_stats, ARRAY[v_key], to_jsonb(v_scaled_val));
        ELSE
            -- Percentages (crit_chance, dodge_chance) scale moderately
            v_scaled_stats := jsonb_set(v_scaled_stats, ARRAY[v_key], to_jsonb(ROUND((v_val::NUMERIC * v_rarity_mult)::numeric, 3)));
        END IF;
    END LOOP;

    v_scaled_stats := jsonb_set(v_scaled_stats, '{name}', to_jsonb(v_template.name));
    v_scaled_stats := jsonb_set(v_scaled_stats, '{slot_type}', to_jsonb(v_template.slot_type));
    v_scaled_stats := jsonb_set(v_scaled_stats, '{rarity}', to_jsonb(v_template.rarity));
    v_scaled_stats := jsonb_set(v_scaled_stats, '{icon}', to_jsonb(v_template.icon));

    RETURN jsonb_build_object(
        'item_id', v_template.item_id,
        'name', v_template.name,
        'slot_type', v_template.slot_type,
        'rarity', v_template.rarity,
        'icon', v_template.icon,
        'metadata', v_scaled_stats
    );
END;
$$;

-- 4. Shop Inventory Procedure (get_shop_inventory)
CREATE OR REPLACE FUNCTION public.get_shop_inventory(p_character_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_account_id UUID;
    v_char RECORD;
    v_item RECORD;
    v_rarity_mult FLOAT;
    v_final_cost INT;
    v_shop_items JSONB := '[]'::jsonb;
BEGIN
    SELECT account_id INTO v_account_id FROM public.characters WHERE id = p_character_id;
    IF v_account_id IS NULL OR v_account_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT * INTO v_char FROM public.characters WHERE id = p_character_id;

    FOR v_item IN 
        SELECT * FROM public.item_templates 
        WHERE is_shop_item = true 
          AND min_level <= GREATEST(1, v_char.level)
          AND rarity IN ('common', 'uncommon', 'rare')
        ORDER BY min_level ASC, base_shop_price ASC
    LOOP
        IF v_item.rarity = 'uncommon' THEN v_rarity_mult := 1.3;
        ELSIF v_item.rarity = 'rare' THEN v_rarity_mult := 1.8;
        ELSE v_rarity_mult := 1.0;
        END IF;

        -- Dynamically compute cost: Cost = base_shop_price * (1 + level * 0.15) * RarityMult
        v_final_cost := FLOOR(v_item.base_shop_price * (1.0 + v_char.level * 0.15) * v_rarity_mult);

        v_shop_items := v_shop_items || jsonb_build_object(
            'item_id', v_item.item_id,
            'name', v_item.name,
            'slot_type', v_item.slot_type,
            'rarity', v_item.rarity,
            'min_level', v_item.min_level,
            'price', v_final_cost,
            'icon', v_item.icon,
            'stats', v_item.base_stats
        );
    END LOOP;

    RETURN v_shop_items;
END;
$$;

-- 5. Atomic Shop Purchase Procedure (buy_shop_item)
CREATE OR REPLACE FUNCTION public.buy_shop_item(
    p_character_id UUID,
    p_item_id VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_account_id UUID;
    v_char RECORD;
    v_template RECORD;
    v_rarity_mult FLOAT := 1.0;
    v_final_cost INT;
    v_used_slots INT;
BEGIN
    -- Ownership Check
    SELECT account_id INTO v_account_id FROM public.characters WHERE id = p_character_id;
    IF v_account_id IS NULL OR v_account_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Row Lock Character
    SELECT * INTO v_char FROM public.characters WHERE id = p_character_id FOR UPDATE;

    -- Fetch Item Template
    SELECT * INTO v_template FROM public.item_templates WHERE item_id = p_item_id AND is_shop_item = true;
    IF v_template IS NULL THEN
        RAISE EXCEPTION 'Item not available in shop.';
    END IF;

    IF v_template.rarity IN ('epic', 'legendary') THEN
        RAISE EXCEPTION 'Epic and Legendary gear cannot be purchased in shop.';
    END IF;

    IF v_template.min_level > v_char.level THEN
        RAISE EXCEPTION 'Character level % required to buy this item.', v_template.min_level;
    END IF;

    IF v_template.rarity = 'uncommon' THEN v_rarity_mult := 1.3;
    ELSIF v_template.rarity = 'rare' THEN v_rarity_mult := 1.8;
    ELSE v_rarity_mult := 1.0;
    END IF;

    v_final_cost := FLOOR(v_template.base_shop_price * (1.0 + v_char.level * 0.15) * v_rarity_mult);

    IF v_char.gold < v_final_cost THEN
        RAISE EXCEPTION 'Insufficient gold. Cost: %, Gold: %', v_final_cost, v_char.gold;
    END IF;

    -- Check Inventory Capacity if new stack
    IF NOT EXISTS (
        SELECT 1 FROM public.character_inventories WHERE character_id = p_character_id AND item_id = p_item_id
    ) THEN
        SELECT COUNT(*) INTO v_used_slots FROM public.character_inventories WHERE character_id = p_character_id AND quantity > 0;
        IF v_used_slots >= v_char.max_inventory_slots THEN
            RAISE EXCEPTION 'Inventory full. Clear space before purchasing.';
        END IF;
    END IF;

    -- Deduct Gold
    UPDATE public.characters
    SET gold = gold - v_final_cost, updated_at = NOW()
    WHERE id = p_character_id;

    -- Insert Item into Inventory
    INSERT INTO public.character_inventories (
        character_id, item_id, item_name, item_type, quantity, icon, metadata, updated_at
    )
    VALUES (
        p_character_id,
        v_template.item_id,
        v_template.name,
        'equipment',
        1,
        v_template.icon,
        jsonb_build_object(
            'name', v_template.name,
            'slot_type', v_template.slot_type,
            'rarity', v_template.rarity,
            'icon', v_template.icon,
            'attack_power', COALESCE((v_template.base_stats->>'attack_power')::INT, 0),
            'defense', COALESCE((v_template.base_stats->>'defense')::INT, 0),
            'max_hp', COALESCE((v_template.base_stats->>'max_hp')::INT, 0),
            'crit_chance', COALESCE((v_template.base_stats->>'crit_chance')::FLOAT, 0.0),
            'dodge_chance', COALESCE((v_template.base_stats->>'dodge_chance')::FLOAT, 0.0)
        ),
        NOW()
    )
    ON CONFLICT (character_id, item_id)
    DO UPDATE SET quantity = public.character_inventories.quantity + 1, updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'item_id', v_template.item_id,
        'item_name', v_template.name,
        'gold_spent', v_final_cost
    );
END;
$$;
