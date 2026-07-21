// ================================================================
// EMBER KEEP — Account & Multi-Character Engine (account.js)
// Native ES Module
// ================================================================

const STORAGE_KEY = "ember_account_v2";
const LEGACY_STORAGE_KEY = "rpg_player_state";
const SYNC_CHANNEL_NAME = "ember_keep_tab_sync";

// Broadcaster for multi-tab state updates
let syncChannel = null;
if (typeof BroadcastChannel !== "undefined") {
  try {
    syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  } catch (e) {
    console.warn("BroadcastChannel not supported in this environment.", e);
  }
}

// Global Account State Container
let accountData = null;

// Initial Default Character Schema
export function createDefaultCharacter(id = 1, name = "Hero", className = "Warrior") {
  return {
    id: id,
    name: name || `Hero ${id}`,
    class: className,
    level: 1,
    xp: 0,
    maxXp: 100,
    stamina: 100,
    maxStamina: 100,
    mana: 50,
    maxMana: 50,
    hp: 100,
    maxHp: 100,
    gold: 50,
    gems: 0,
    power: 10,
    defense: 5,
    critChance: 0.05,
    critDamage: 1.5,
    dodgeChance: 0.05,
    skillPoints: 0,
    allocatedStats: { hp: 0, power: 0, defense: 0 },
    equipped: { weapon: null, armor: null, ring: null },
    unlockedSkills: [className.toLowerCase() + "_1"],
    inventory: [
      { id: "potion_hp_small", name: "Small HP Potion", type: "consumable", qty: 3, icon: "🧪", value: 30 }
    ],
    professions: {
      mining: { level: 1, xp: 0 },
      woodcutting: { level: 1, xp: 0 },
      fishing: { level: 1, xp: 0 },
      smelting: { level: 1, xp: 0 },
      cooking: { level: 1, xp: 0 },
      alchemy: { level: 1, xp: 0 },
      forge: { level: 1, xp: 0 },
    },
    activePet: null,
    equippedPets: [],
    activePerks: [], // [{ id, name, expiresAt }]
    createdAt: Date.now()
  };
}

// Initial Default Account Schema
function createDefaultAccount() {
  const defaultChar = createDefaultCharacter(1, "Ember Hero", "Warrior");
  return {
    version: 2,
    lastLoginTime: Date.now(),
    ascensionPoints: 0,
    lastApAccrualTime: Date.now(),
    maxAp: 10,
    activeSlotId: 1,
    characterSlots: {
      1: defaultChar,
      2: null,
      3: null,
      4: null,
      5: null
    },
    activeTasks: {
      1: null,
      2: null,
      3: null
    }
  };
}

/**
 * Migration helper: Converts legacy rpg_player_state into ember_account_v2 Slot 1
 */
function migrateLegacySave(legacyObj) {
  const account = createDefaultAccount();
  const char = account.characterSlots[1];
  
  if (legacyObj) {
    char.name = legacyObj.name || "Hero";
    char.class = legacyObj.class || "Warrior";
    char.level = legacyObj.level || 1;
    char.xp = legacyObj.xp || 0;
    char.gold = legacyObj.gold || 50;
    char.gems = legacyObj.gems || 0;
    char.stamina = legacyObj.stamina !== undefined ? legacyObj.stamina : 100;
    char.maxStamina = legacyObj.maxStamina || 100;
    char.hp = legacyObj.hp || 100;
    char.maxHp = legacyObj.maxHp || 100;
    char.power = legacyObj.power || 10;
    char.defense = legacyObj.defense || 5;
    char.skillPoints = legacyObj.skillPoints || 0;
    
    if (legacyObj.inventory && Array.isArray(legacyObj.inventory)) {
      char.inventory = legacyObj.inventory;
    }
    if (legacyObj.equipped) {
      char.equipped = legacyObj.equipped;
    }
    if (legacyObj.professions) {
      char.professions = { ...char.professions, ...legacyObj.professions };
    }
  }
  
  return account;
}

/**
 * AccountStore Engine API
 */
export const AccountStore = {
  init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        accountData = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved account state, initializing new account.", e);
        accountData = createDefaultAccount();
      }
    } else {
      // Check for legacy single-character save
      const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacySaved) {
        try {
          const legacyObj = JSON.parse(legacySaved);
          accountData = migrateLegacySave(legacyObj);
          console.log("Migrated legacy save file to ember_account_v2 format.");
        } catch (e) {
          accountData = createDefaultAccount();
        }
      } else {
        accountData = createDefaultAccount();
      }
      this.save();
    }

    this.updateAscensionPoints();
    this.setupTabSynchronization();
  },

  setupTabSynchronization() {
    if (syncChannel) {
      syncChannel.onmessage = (event) => {
        if (event.data && event.data.type === "STATE_UPDATED") {
          this.reloadFromStorage();
        }
      };
    }
    
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY) {
        this.reloadFromStorage();
      }
    });
  },

  reloadFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        accountData = JSON.parse(saved);
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent("ember_account_synced", { detail: accountData }));
        }
      } catch (e) {
        console.error("Error reloading storage in sync listener", e);
      }
    }
  },

  save() {
    if (!accountData) return;
    accountData.lastLoginTime = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accountData));
    
    if (syncChannel) {
      try {
        syncChannel.postMessage({ type: "STATE_UPDATED", timestamp: Date.now() });
      } catch (e) {}
    }
  },

  getAccount() {
    return accountData;
  },

  getActiveCharacter() {
    if (!accountData) return null;
    return accountData.characterSlots[accountData.activeSlotId] || accountData.characterSlots[1];
  },

  getCharacter(slotId) {
    if (!accountData || !accountData.characterSlots) return null;
    return accountData.characterSlots[slotId];
  },

  setActiveSlot(slotId) {
    if (!accountData || slotId < 1 || slotId > 5) return false;
    if (!accountData.characterSlots[slotId]) return false;
    accountData.activeSlotId = slotId;
    this.save();
    return true;
  },

  createCharacter(slotId, name, className) {
    if (!accountData || slotId < 1 || slotId > 5) return null;
    const newChar = createDefaultCharacter(slotId, name, className);
    accountData.characterSlots[slotId] = newChar;
    this.save();
    return newChar;
  },

  deleteCharacter(slotId) {
    if (!accountData || slotId < 1 || slotId > 5) return false;
    if (slotId === accountData.activeSlotId) {
      const remainingSlot = Object.keys(accountData.characterSlots).find(k => k != slotId && accountData.characterSlots[k] !== null);
      if (remainingSlot) {
        accountData.activeSlotId = parseInt(remainingSlot, 10);
      }
    }
    accountData.characterSlots[slotId] = null;
    if (accountData.activeTasks[slotId]) {
      accountData.activeTasks[slotId] = null;
    }
    this.save();
    return true;
  },

  updateAscensionPoints() {
    if (!accountData) return;
    const now = Date.now();
    const SIX_HOURS_MS = 6 * 3600 * 1000;
    const elapsed = now - (accountData.lastApAccrualTime || now);
    
    if (elapsed >= SIX_HOURS_MS) {
      const apEarned = Math.floor(elapsed / SIX_HOURS_MS);
      accountData.ascensionPoints = Math.min(accountData.maxAp || 10, (accountData.ascensionPoints || 0) + apEarned);
      accountData.lastApAccrualTime = now - (elapsed % SIX_HOURS_MS);
      this.save();
    }
  },

  spendAscensionPoint(perkId, charSlotId) {
    if (!accountData || (accountData.ascensionPoints || 0) < 1) return false;
    const char = this.getCharacter(charSlotId);
    if (!char) return false;

    const DURATION_2_HOURS = 2 * 3600 * 1000;
    const perk = {
      id: perkId,
      appliedAt: Date.now(),
      expiresAt: Date.now() + DURATION_2_HOURS
    };

    char.activePerks = (char.activePerks || []).filter(p => p.expiresAt > Date.now());
    if (char.activePerks.length >= 5) return false;

    char.activePerks.push(perk);
    accountData.ascensionPoints -= 1;
    this.save();
    return true;
  }
};
