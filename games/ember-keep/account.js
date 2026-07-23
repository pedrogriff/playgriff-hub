// ================================================================
// EMBER KEEP — Account & Multi-Character Engine (account.js)
// Native ES Module with Supabase Integration
// ================================================================

import { getCharacters, createCharacter as createSupabaseChar, saveCharacter as saveSupabaseChar, deleteCharacter as deleteSupabaseChar, getAccountProfile, getUser } from "./db.js";

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
    mana: className === "Mage" ? 100 : className === "Paladin" ? 70 : 50,
    maxMana: className === "Mage" ? 100 : className === "Paladin" ? 70 : 50,
    hp: className === "Warrior" ? 120 : className === "Paladin" ? 140 : 100,
    maxHp: className === "Warrior" ? 120 : className === "Paladin" ? 140 : 100,
    gold: 50,
    gems: 0,
    power: className === "Mage" ? 15 : className === "Ranger" ? 12 : 10,
    defense: className === "Warrior" ? 8 : className === "Paladin" ? 10 : 5,
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
    activePerks: [],
    house: { tier: 0, name: "No Housing", slots: [], decorations: [] },
    createdAt: Date.now()
  };
}

function createDefaultAccount() {
  return {
    version: 2,
    lastLoginTime: Date.now(),
    ascensionPoints: 0,
    lastApAccrualTime: Date.now(),
    maxAp: 10,
    activeSlotId: 1,
    characterSlots: {
      1: null,
      2: null,
      3: null,
      4: null
    },
    activeTasks: {
      1: null,
      2: null,
      3: null
    }
  };
}

export const AccountStore = {
  async init() {
    accountData = createDefaultAccount();
    
    // Check if user is authenticated via Supabase
    try {
      const user = await getUser();
      if (user) {
        // Load local storage cache first to retain campaign progress & local state
        this.loadFromLocalStorage();
        await this.loadFromSupabase();
        const hasAnyChar = Object.values(accountData.characterSlots).some(c => c !== null);
        if (!hasAnyChar) {
          await this.createCharacter(1, "Ember Hero", "Warrior");
        }
      } else {
        this.loadFromLocalStorage();
      }
    } catch (e) {
      console.warn("Could not fetch Supabase user, falling back to local storage.", e);
      this.loadFromLocalStorage();
    }

    this.updateAscensionPoints();
    this.setupTabSynchronization();
  },

  async loadFromSupabase() {
    try {
      const profile = await getAccountProfile();
      if (profile) {
        accountData.ascensionPoints = profile.ascension_points || 0;
        accountData.maxAp = profile.max_ap || 10;
      }

      const dbChars = await getCharacters();
      const previousSlots = { ...accountData.characterSlots };
      accountData.characterSlots = { 1: null, 2: null, 3: null, 4: null };

      dbChars.forEach(row => {
        const slot = row.slot_index;
        if (slot >= 1 && slot <= 4) {
          const localChar = previousSlots[slot];
          const remoteUnlocked = row.unlocked_level || row.unlockedLevel;
          const localUnlocked = localChar ? (localChar.unlockedLevel || localChar.unlocked_level) : 1;
          const finalUnlocked = Math.max(remoteUnlocked || 1, localUnlocked || 1);

          const remoteSide = Array.isArray(row.completed_side_zones) ? row.completed_side_zones : (Array.isArray(row.completedSideZones) ? row.completedSideZones : []);
          const localSide = localChar && Array.isArray(localChar.completedSideZones) ? localChar.completedSideZones : [];
          const finalSideZones = Array.from(new Set([...localSide, ...remoteSide]));

          accountData.characterSlots[slot] = {
            id: row.id,
            slotIndex: slot,
            name: row.name,
            class: row.class_id,
            level: row.level,
            xp: row.exp,
            maxXp: row.max_exp || 100,
            stamina: row.stamina,
            maxStamina: row.max_stamina || 100,
            mana: row.mana,
            maxMana: row.max_mana || 50,
            hp: row.hp,
            maxHp: row.max_hp || 100,
            power: row.power,
            defense: row.defense,
            skillPoints: row.skill_points !== undefined ? row.skill_points : (localChar ? localChar.skillPoints : 0),
            allocatedStats: row.allocated_stats || (localChar ? localChar.allocatedStats : { hp: 0, power: 0, defense: 0 }),
            critChance: Number(row.crit_chance || 0.05),
            critDamage: Number(row.crit_damage || 1.5),
            dodgeChance: Number(row.dodge_chance || 0.05),
            gold: row.gold,
            gems: row.gems,
            house: row.house || (localChar ? localChar.house : { tier: 0, name: "No Housing", slots: [], decorations: [] }),
            unlockedLevel: finalUnlocked,
            completedSideZones: finalSideZones,
            inventory: row.inventory || [],
            equipped: row.equipped || { weapon: null, armor: null, ring: null },
            professions: row.professions || {},
            locationNode: row.location_node || "greenhollow"
          };
        }
      });

      // Set activeSlotId to first available character
      const firstActive = Object.keys(accountData.characterSlots).find(k => accountData.characterSlots[k] !== null);
      if (firstActive) {
        accountData.activeSlotId = parseInt(firstActive, 10);
      }

      this.saveLocalCache();
    } catch (err) {
      console.error("Error loading characters from Supabase:", err);
      this.loadFromLocalStorage();
    }
  },

  loadFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        accountData = JSON.parse(saved);
      } catch (e) {
        accountData = createDefaultAccount();
      }
    } else {
      const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacySaved) {
        try {
          const legacyObj = JSON.parse(legacySaved);
          accountData = createDefaultAccount();
          const defaultChar = createDefaultCharacter(1, legacyObj.name || "Hero", legacyObj.class || "Warrior");
          defaultChar.level = legacyObj.level || 1;
          defaultChar.xp = legacyObj.xp || 0;
          defaultChar.gold = legacyObj.gold || 50;
          defaultChar.gems = legacyObj.gems || 0;
          accountData.characterSlots[1] = defaultChar;
        } catch (e) {
          accountData = createDefaultAccount();
        }
      } else {
        accountData = createDefaultAccount();
        accountData.characterSlots[1] = createDefaultCharacter(1, "Ember Hero", "Warrior");
      }
      this.saveLocalCache();
    }
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
      } catch (e) {}
    }
  },

  saveLocalCache() {
    if (!accountData) return;
    accountData.lastLoginTime = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accountData));
    
    if (syncChannel) {
      try {
        syncChannel.postMessage({ type: "STATE_UPDATED", timestamp: Date.now() });
      } catch (e) {}
    }
  },

  async save() {
    this.saveLocalCache();

    // If active character is remote (has UUID), save to Supabase asynchronously
    const activeChar = this.getActiveCharacter();
    if (activeChar && typeof activeChar.id === "string" && activeChar.id.includes("-")) {
      try {
        await saveSupabaseChar(activeChar);
      } catch (err) {
        console.warn("Failed async sync to Supabase:", err);
      }
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
    if (!accountData || slotId < 1 || slotId > 4) return false;
    if (!accountData.characterSlots[slotId]) return false;
    accountData.activeSlotId = slotId;
    this.saveLocalCache();
    return true;
  },

  async createCharacter(slotId, name, className) {
    if (!accountData || slotId < 1 || slotId > 4) return null;

    try {
      const user = await getUser();
      if (user) {
        const row = await createSupabaseChar(slotId, name, className);
        const newChar = {
          id: row.id,
          slotIndex: slotId,
          name: row.name,
          class: row.class_id,
          level: row.level,
          xp: row.exp,
          maxXp: row.max_exp || 100,
          stamina: row.stamina,
          maxStamina: row.max_stamina || 100,
          mana: row.mana,
          maxMana: row.max_mana || 50,
          hp: row.hp,
          maxHp: row.max_hp || 100,
          power: row.power,
          defense: row.defense,
          skillPoints: row.skill_points || 0,
          allocatedStats: row.allocated_stats || { hp: 0, power: 0, defense: 0 },
          gold: row.gold,
          gems: row.gems,
          house: row.house || { tier: 0, name: "No Housing", slots: [], decorations: [] },
          inventory: row.inventory || [],
          equipped: row.equipped || { weapon: null, armor: null, ring: null },
          professions: row.professions || {},
          locationNode: row.location_node || "greenhollow"
        };
        accountData.characterSlots[slotId] = newChar;
        accountData.activeSlotId = slotId;
        this.saveLocalCache();
        return newChar;
      }
    } catch (err) {
      console.warn("Creating character locally due to Supabase error/offline:", err);
    }

    const newLocalChar = createDefaultCharacter(slotId, name, className);
    accountData.characterSlots[slotId] = newLocalChar;
    accountData.activeSlotId = slotId;
    this.saveLocalCache();
    return newLocalChar;
  },

  async deleteCharacter(slotId) {
    if (!accountData || slotId < 1 || slotId > 4) return false;
    const char = accountData.characterSlots[slotId];
    if (!char) return false;

    if (typeof char.id === "string" && char.id.includes("-")) {
      try {
        await deleteSupabaseChar(char.id);
      } catch (e) {
        console.error("Failed to delete character from Supabase:", e);
      }
    }

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
    this.saveLocalCache();
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
      this.saveLocalCache();
    }
  }
};
