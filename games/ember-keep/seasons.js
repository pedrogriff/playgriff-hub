// ================================================================
// EMBER KEEP — Seasonal Echo Leagues Module (seasons.js)
// Native ES Module
// ================================================================

import { AccountStore } from "./account.js";
import { supabase, getUser, createCharacter } from "./db.js";

export const SeasonsEngine = {
  /**
   * Fetch currently active seasonal realm
   */
  async getActiveRealm() {
    try {
      const { data, error } = await supabase
        .from("seasonal_realms")
        .select("*")
        .eq("is_active", true)
        .order("starts_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) return data;
    } catch (e) {
      console.warn("Error fetching active seasonal realm from Supabase:", e);
    }

    // Local fallback
    return {
      id: "local_speed_realm",
      name: "Speed Realm Season I",
      description: "3x game execution speed, but monsters deal 50% more damage! Compete for seasonal glory in Slot 5!",
      mutator_config: { speed_multiplier: 3, mob_damage_bonus: 0.5 },
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 28 * 86400 * 1000).toISOString(),
      is_active: true,
      rewards: [
        { type: "title", name: "Speed Demon" },
        { type: "gems", amount: 250 }
      ]
    };
  },

  /**
   * Create an Echo Character in dedicated Seasonal Slot 5 (Q1 Recommendation)
   */
  async createEchoCharacter(name, classId) {
    const realm = await this.getActiveRealm();
    if (!realm) throw new Error("No active seasonal realm available.");

    const user = await getUser();
    if (user) {
      // Validate realm_id UUID
      const isUuid = realm.id && typeof realm.id === "string" && realm.id.includes("-");
      const validRealmId = isUuid ? realm.id : null;

      // Check if slot 5 character already exists to prevent HTTP 409 Conflict
      const { data: existingChar } = await supabase
        .from("characters")
        .select("id")
        .eq("account_id", user.id)
        .eq("slot_index", 5)
        .maybeSingle();

      const charPayload = {
        account_id: user.id,
        slot_index: 5,
        name: name || "Echo Hero",
        class_id: classId || "Warrior",
        realm_id: validRealmId,
        level: 1,
        exp: 0,
        max_exp: 100,
        hp: classId === "Warrior" ? 120 : classId === "Paladin" ? 140 : 100,
        max_hp: classId === "Warrior" ? 120 : classId === "Paladin" ? 140 : 100,
        power: classId === "Mage" ? 15 : classId === "Ranger" ? 12 : 10,
        defense: classId === "Warrior" ? 8 : classId === "Paladin" ? 10 : 5,
        gold: 50
      };

      let result;
      if (existingChar) {
        // Update existing slot 5 character
        const { data, error } = await supabase
          .from("characters")
          .update(charPayload)
          .eq("id", existingChar.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        // Insert new slot 5 character
        const { data, error } = await supabase
          .from("characters")
          .insert(charPayload)
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      await AccountStore.loadFromSupabase().catch(() => {});
      return result;
    }

    // Local Fallback
    const account = AccountStore.getAccount();
    const echoChar = {
      id: "echo_char_5",
      slotIndex: 5,
      name: name || "Echo Hero",
      class: classId || "Warrior",
      level: 1,
      xp: 0,
      maxXp: 100,
      hp: 100,
      maxHp: 100,
      power: 10,
      defense: 5,
      gold: 50,
      realm_id: realm.id
    };

    account.characterSlots[5] = echoChar;
    AccountStore.save();
    return echoChar;
  },

  /**
   * Fetch Top 20 Seasonal Realm Leaderboard
   */
  async getSeasonalLeaderboard(realmId) {
    if (!realmId) return [];

    try {
      const { data, error } = await supabase
        .from("characters")
        .select("id, name, class_id, level, power")
        .eq("realm_id", realmId)
        .order("level", { ascending: false })
        .order("power", { ascending: false })
        .limit(20);

      if (!error && data) return data;
    } catch (e) {
      console.warn("Error fetching seasonal leaderboard:", e);
    }

    return [
      { name: "SwiftBlade", class_id: "Ranger", level: 28, power: 4200 },
      { name: "PyroEcho", class_id: "Mage", level: 25, power: 3800 },
      { name: "IronTempest", class_id: "Warrior", level: 22, power: 3100 }
    ];
  }
};

if (typeof window !== "undefined") {
  window.SeasonsEngine = SeasonsEngine;
}
