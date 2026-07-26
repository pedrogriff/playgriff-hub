// ================================================================
// EMBER KEEP — World Rifts & Community Bounties Module (world.js)
// Native ES Module
// ================================================================

import { AccountStore } from "./account.js";
import { supabase, getUser } from "./db.js";

export const WorldEngine = {
  /**
   * Fetch currently active World Rift global boss
   */
  async getActiveRift() {
    try {
      const { data, error } = await supabase
        .from("world_rifts")
        .select("*")
        .eq("active", true)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) return data;
    } catch (e) {
      console.warn("Error fetching active World Rift from Supabase:", e);
    }

    // Local fallback
    return {
      id: "local_rift_boss",
      name: "Malakor the Ember Tyrant",
      description: "A dragon spawned from the volcano core. Submit damage to defeat him!",
      boss_icon: "🐉",
      total_hp: 10000000000,
      current_hp: 7500000000,
      active: true
    };
  },

  /**
   * Submit damage burst to active World Rift via RPC
   */
  async submitDamage(characterId, riftId, damageAmount) {
    if (!characterId || !riftId || !damageAmount || damageAmount <= 0) return null;

    try {
      const { data, error } = await supabase.rpc("submit_rift_damage", {
        p_character_id: characterId,
        p_rift_id: riftId,
        p_damage: Math.floor(damageAmount)
      });

      if (error) throw error;
      return data;
    } catch (e) {
      console.warn("World Rift submitDamage RPC failed, applying local fallback:", e);
      return {
        success: true,
        damage_dealt: Math.floor(damageAmount),
        remaining_hp: 7500000000 - Math.floor(damageAmount),
        boss_defeated: false
      };
    }
  },

  /**
   * Fetch Top 20 Rift Damage Contributors
   */
  async getRiftLeaderboard(riftId) {
    if (!riftId) return [];

    try {
      const { data, error } = await supabase
        .from("rift_contributions")
        .select("character_id, character_name, damage_dealt")
        .eq("rift_id", riftId)
        .order("damage_dealt", { ascending: false })
        .limit(20);

      if (!error && data) return data;
    } catch (e) {
      console.warn("Error fetching rift leaderboard:", e);
    }

    return [
      { character_name: "Valerius Flame", damage_dealt: 450000000 },
      { character_name: "Shadowbane", damage_dealt: 320000000 },
      { character_name: "Ember Queen", damage_dealt: 180000000 }
    ];
  },

  /**
   * Fetch currently active Community Bounty ("The King's Bounty")
   */
  async getActiveBounty() {
    try {
      const { data, error } = await supabase
        .from("community_bounties")
        .select("*")
        .eq("active", true)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) return data;
    } catch (e) {
      console.warn("Error fetching community bounty from Supabase:", e);
    }

    // Local fallback
    return {
      id: "local_bounty",
      title: "The King's Iron Supply",
      resource_target: "item_ore_iron",
      resource_name: "Iron Ore",
      resource_icon: "🪨",
      target_quantity: 500000,
      current_quantity: 145000,
      reward_description: "Unlocks +15% Gold & Drop Rate for 24 Hours!",
      active: true
    };
  },

  /**
   * Donate items to the active Community Bounty via RPC
   */
  async donateToBounty(characterId, bountyId, itemId, quantity) {
    if (!characterId || !bountyId || !itemId || !quantity || quantity <= 0) return null;

    try {
      const { data, error } = await supabase.rpc("donate_to_bounty", {
        p_character_id: characterId,
        p_bounty_id: bountyId,
        p_item_id: itemId,
        p_quantity: quantity
      });

      if (error) throw error;
      return data;
    } catch (e) {
      console.warn("donateToBounty RPC failed, applying local fallback:", e);
      return {
        success: true,
        quantity_donated: quantity,
        bounty_completed: false
      };
    }
  }
};

if (typeof window !== "undefined") {
  window.WorldEngine = WorldEngine;
}
