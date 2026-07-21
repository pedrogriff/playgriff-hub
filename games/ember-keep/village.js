// ================================================================
// EMBER KEEP — Village Mastery & Economy Engine (village.js)
// Native ES Module
// ================================================================

import { AccountStore } from "./account.js";

export const VILLAGE_BUILDINGS = {
  dwelling: {
    id: "dwelling",
    name: "Citizens Dwellings",
    icon: "🛖",
    baseCostVR: 100,
    baseCostWood: 50,
    baseCostOre: 20,
    desc: "Increases maximum citizen population cap by +5 per level."
  },
  farm: {
    id: "farm",
    name: "Community Farm",
    icon: "🌾",
    baseCostVR: 150,
    baseCostWood: 30,
    baseCostOre: 10,
    desc: "Produces food resources to maintain citizen Happiness score."
  },
  gathering_hut: {
    id: "gathering_hut",
    name: "Gatherer's Lodge",
    icon: "🪵",
    baseCostVR: 200,
    baseCostWood: 80,
    baseCostOre: 60,
    desc: "Allows citizen assignment to generate Village Resources (VR)."
  }
};

export const VillageEngine = {
  getVillageState() {
    const account = AccountStore.getAccount();
    if (!account) return null;

    if (!account.villageData) {
      account.villageData = {
        level: 1,
        population: 5,
        maxPopulation: 10,
        happiness: 100, // 0 to 100%
        villageResources: 50,
        buildings: {
          dwelling: 1,
          farm: 1,
          gathering_hut: 1
        },
        assignedCitizens: {
          vr_gathering: 2,
          food_farming: 3
        }
      };
      AccountStore.save();
    }
    return account.villageData;
  },

  /**
   * Calculate VR production yield based on happiness and citizen assignments
   */
  calculateProductionYield() {
    const v = this.getVillageState();
    if (!v) return 0;

    const baseYield = (v.assignedCitizens.vr_gathering || 0) * 5;
    const happinessMultiplier = v.happiness >= 80 ? 1.2 : v.happiness >= 50 ? 1.0 : 0.5;

    return Math.floor(baseYield * happinessMultiplier);
  },

  /**
   * Upgrade a village building using VR + raw material sinks (Wood & Ore)
   */
  upgradeBuilding(buildingId) {
    const v = this.getVillageState();
    const char = AccountStore.getActiveCharacter();
    if (!v || !char) return { success: false, reason: "State not loaded" };

    const building = VILLAGE_BUILDINGS[buildingId];
    if (!building) return { success: false, reason: "Invalid building ID" };

    const currentLvl = v.buildings[buildingId] || 0;
    const costVR = Math.floor(building.baseCostVR * Math.pow(1.5, currentLvl));
    const costWood = Math.floor(building.baseCostWood * Math.pow(1.4, currentLvl));
    const costOre = Math.floor(building.baseCostOre * Math.pow(1.4, currentLvl));

    if (v.villageResources < costVR) {
      return { success: false, reason: `Requires ${costVR} VR` };
    }

    // Material check in inventory
    const woodItem = (char.inventory || []).find(i => i.id === "item_wood_log" || i.name.includes("Wood"));
    const oreItem = (char.inventory || []).find(i => i.id === "item_ore_iron" || i.name.includes("Ore"));

    const availableWood = woodItem ? woodItem.qty : 0;
    const availableOre = oreItem ? oreItem.qty : 0;

    if (availableWood < costWood || availableOre < costOre) {
      return { success: false, reason: `Material Sink Requirement: ${costWood} Wood & ${costOre} Ore needed.` };
    }

    // Deduct VR and Materials
    v.villageResources -= costVR;
    if (woodItem) woodItem.qty -= costWood;
    if (oreItem) oreItem.qty -= costOre;

    v.buildings[buildingId] = currentLvl + 1;

    // Recalculate caps
    if (buildingId === "dwelling") {
      v.maxPopulation += 5;
    }

    AccountStore.save();
    return { success: true, newLevel: v.buildings[buildingId] };
  }
};
