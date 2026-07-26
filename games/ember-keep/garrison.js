// ================================================================
// EMBER KEEP — Account Garrison Network Module (garrison.js)
// Native ES Module
// ================================================================

import { AccountStore } from "./account.js";
import { supabase, getUser } from "./db.js";

export const GARRISON_STATIONS = {
  alchemy_lab: {
    id: "alchemy_lab",
    name: "Alchemy Lab",
    icon: "🧪",
    desc: "Passively brews potions and transmutes materials while offline (1 item per 2h).",
    statBuffDesc: "Generates Potion/Material drops"
  },
  scout_tower: {
    id: "scout_tower",
    name: "Scout Tower",
    icon: "🏰",
    desc: "Grants +10% task execution speed globally for all other characters on the account.",
    statBuffDesc: "+10% Global Task Speed",
    taskSpeedMult: 1.10
  },
  training_grounds: {
    id: "training_grounds",
    name: "Training Grounds",
    icon: "🎯",
    desc: "Passively trains the assigned alt hero, gaining 25% base XP while offline.",
    statBuffDesc: "+25% Base XP for Alt",
    altXpPct: 0.25
  },
  forge_station: {
    id: "forge_station",
    name: "Forge Station",
    icon: "🔨",
    desc: "Empowers all heroes with +5% bonus to equipment stats account-wide.",
    statBuffDesc: "+5% Equipment Stats",
    gearStatMult: 1.05
  }
};

export const GarrisonEngine = {
  /**
   * Fetch current garrison assignments for the active account
   */
  async getAssignments() {
    try {
      const user = await getUser();
      if (user) {
        const { data, error } = await supabase
          .from("garrison_assignments")
          .select("*")
          .eq("account_id", user.id);

        if (!error && data) {
          return data;
        }
      }
    } catch (e) {
      console.warn("Error loading garrison assignments from Supabase, using local fallback:", e);
    }

    // Local Storage Fallback
    const saved = localStorage.getItem("ember_garrison_assignments");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  },

  /**
   * Assign an inactive alt character to a garrison station
   */
  async assignToStation(characterId, stationId) {
    const activeChar = AccountStore.getActiveCharacter();
    if (activeChar && activeChar.id === characterId) {
      throw new Error("Active character cannot be assigned to a Garrison station!");
    }

    if (!GARRISON_STATIONS[stationId]) {
      throw new Error("Invalid Garrison station ID.");
    }

    const user = await getUser();
    if (user) {
      // Remove existing assignment for this station or character if any
      await supabase
        .from("garrison_assignments")
        .delete()
        .or(`character_id.eq.${characterId},station_id.eq.${stationId}`);

      const { data, error } = await supabase
        .from("garrison_assignments")
        .insert({
          account_id: user.id,
          character_id: characterId,
          station_id: stationId,
          assigned_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Local Storage Fallback
    let assignments = await this.getAssignments();
    assignments = assignments.filter(a => a.character_id !== characterId && a.station_id !== stationId);
    assignments.push({ character_id: characterId, station_id: stationId, assigned_at: new Date().toISOString() });
    localStorage.setItem("ember_garrison_assignments", JSON.stringify(assignments));
    return assignments;
  },

  /**
   * Unassign a character from the garrison
   */
  async removeFromStation(characterId) {
    const user = await getUser();
    if (user) {
      const { error } = await supabase
        .from("garrison_assignments")
        .delete()
        .eq("character_id", characterId);

      if (error) throw error;
      return true;
    }

    let assignments = await this.getAssignments();
    assignments = assignments.filter(a => a.character_id !== characterId);
    localStorage.setItem("ember_garrison_assignments", JSON.stringify(assignments));
    return true;
  },

  /**
   * Compute aggregate account-wide buffs from all current garrison assignments
   */
  computeAccountBuffs(assignments = []) {
    let taskSpeedMultiplier = 1.0;
    let gearStatMultiplier = 1.0;
    let hasAlchemyLab = false;
    let hasTrainingGrounds = false;

    (assignments || []).forEach(a => {
      const st = GARRISON_STATIONS[a.station_id];
      if (st) {
        if (st.taskSpeedMult) taskSpeedMultiplier *= st.taskSpeedMult;
        if (st.gearStatMult) gearStatMultiplier *= st.gearStatMult;
        if (a.station_id === "alchemy_lab") hasAlchemyLab = true;
        if (a.station_id === "training_grounds") hasTrainingGrounds = true;
      }
    });

    return {
      taskSpeedMultiplier,
      gearStatMultiplier,
      hasAlchemyLab,
      hasTrainingGrounds
    };
  },

  /**
   * Process offline progress for garrisoned alts
   * (Scout Tower task speed buff is evaluated BEFORE main character task progress)
   */
  processGarrisonOffline(elapsedMs, assignments = []) {
    const totalHours = elapsedMs / (3600 * 1000);
    const reports = [];

    (assignments || []).forEach(a => {
      const char = Object.values(AccountStore.getAccount().characterSlots).find(c => c && c.id === a.character_id);
      if (!char) return;

      if (a.station_id === "training_grounds") {
        // 25% of fixed base XP for alt level tier
        const baseCycleExp = 25;
        const cycles = Math.floor(elapsedMs / 4000);
        const altExpGained = Math.floor(cycles * baseCycleExp * 0.25);

        char.xp = (char.xp || 0) + altExpGained;
        char.exp = char.xp;

        // Level Up check
        while (char.xp >= (char.maxXp || 100)) {
          char.xp -= (char.maxXp || 100);
          char.level = (char.level || 1) + 1;
          char.maxXp = Math.floor((char.maxXp || 100) * 1.25);
        }

        reports.push({
          characterName: char.name,
          stationName: "Training Grounds",
          expGained: altExpGained,
          newLevel: char.level
        });
      } else if (a.station_id === "alchemy_lab") {
        // 1 potion per 2 hours
        const potionsGenerated = Math.floor(totalHours / 2);
        if (potionsGenerated > 0) {
          const potionItem = { id: "potion_hp_medium", name: "Medium HP Potion", type: "consumable", qty: potionsGenerated, icon: "🧪" };
          char.inventory = char.inventory || [];
          const existing = char.inventory.find(i => i.id === potionItem.id);
          if (existing) existing.qty = (existing.qty || 1) + potionsGenerated;
          else char.inventory.push(potionItem);

          reports.push({
            characterName: char.name,
            stationName: "Alchemy Lab",
            itemsGenerated: potionsGenerated,
            itemName: "Medium HP Potion"
          });
        }
      }
    });

    AccountStore.save();
    return reports;
  }
};

if (typeof window !== "undefined") {
  window.GarrisonEngine = GarrisonEngine;
  window.GARRISON_STATIONS = GARRISON_STATIONS;
}
