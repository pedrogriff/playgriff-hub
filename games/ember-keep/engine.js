// ================================================================
// EMBER KEEP — Asynchronous Task & Server-Authoritative Idle Engine (engine.js)
// Native ES Module — Service / Repository Pattern (GameAPI)
// ================================================================

import { AccountStore } from "./account.js";
import { getServerTime, startTask as dbStartTask, getActiveTasks as dbGetActiveTasks, claimTaskRewards as dbClaimTaskRewards } from "./db.js";

const BASE_MAX_IDLE_MS = 6 * 3600 * 1000; // 6 hours base
const PREMIUM_MAX_IDLE_MS = 8 * 3600 * 1000; // 8 hours Ember Pass
const MAX_INVENTORY_SLOTS = 30;

/**
 * SERVER TIME OFFSET STATE & HELPERS (Server Time Offset Pattern)
 */
let clockOffset = 0;
let isClockSynced = false;

export async function syncServerClockOffset() {
  try {
    const serverNow = await getServerTime();
    clockOffset = serverNow - Date.now();
    isClockSynced = true;
  } catch (err) {
    console.warn("Clock sync failed, keeping current offset:", err);
  }
  return clockOffset;
}

export function getEstimatedServerTime() {
  return Date.now() + clockOffset;
}

// Re-sync clock offset when tab returns from sleep or background
if (typeof document !== "undefined" && document.addEventListener) {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      syncServerClockOffset();
    }
  });
}

export const GameAPI = {
  /**
   * Sync Server Clock Offset on demand
   */
  async syncClock() {
    return await syncServerClockOffset();
  },

  /**
   * Start an asynchronous background task for a character slot
   */
  async startTask(slotId, taskSpec) {
    const account = AccountStore.getAccount();
    if (!account) return { success: false, reason: "Account not loaded" };

    const char = AccountStore.getCharacter(slotId);
    if (!char) return { success: false, reason: "Character not found" };

    // 1. Fetch DB server time and update local clock offset
    await syncServerClockOffset();
    const startTime = getEstimatedServerTime();

    // 2. Task specification schema
    const task = {
      id: `task_${slotId}_${Date.now()}`,
      dbTaskId: null,
      type: taskSpec.type, // 'mining', 'woodcutting', 'combat', 'fishing'
      targetId: taskSpec.targetId,
      targetName: taskSpec.targetName || "Action",
      icon: taskSpec.icon || "⏳",
      startTime: startTime,
      cycleMs: Math.max(3000, taskSpec.cycleMs || 4000), // Min 3 sec tick limit
      cyclesCompleted: 0,
      totalStack: taskSpec.totalStack || Infinity,
      stance: taskSpec.stance || "balanced",
      foodItemId: taskSpec.foodItemId || null,
      foodQuantity: taskSpec.foodQuantity || 0,
      status: "ACTIVE", // 'ACTIVE', 'PAUSED_INVENTORY_FULL', 'STOPPED_FOOD_EXHAUSTED', 'COMPLETED'
      locationNode: taskSpec.locationNode || "greenhollow"
    };

    // 3. Persist to Supabase if character is cloud-synced
    if (typeof char.id === "string" && char.id.includes("-")) {
      try {
        const durationSecs = taskSpec.totalStack && taskSpec.totalStack !== Infinity
          ? Math.floor((taskSpec.totalStack * task.cycleMs) / 1000)
          : 0;

        const dbTaskRow = await dbStartTask(
          char.id,
          taskSpec.type,
          taskSpec.targetId,
          durationSecs,
          taskSpec.foodQuantity || 0
        );

        if (dbTaskRow) {
          task.dbTaskId = dbTaskRow.id;
          if (dbTaskRow.started_at) {
            task.startTime = new Date(dbTaskRow.started_at).getTime();
          }
        }
      } catch (err) {
        console.warn("Failed writing running task to Supabase active_tasks table:", err);
      }
    }

    account.activeTasks = account.activeTasks || {};
    account.activeTasks[slotId] = task;
    AccountStore.saveLocalCache();

    return { success: true, task };
  },

  /**
   * Stop an active task
   */
  async stopTask(slotId) {
    const account = AccountStore.getAccount();
    if (!account || !account.activeTasks || !account.activeTasks[slotId]) {
      return { success: false, reason: "No active task found" };
    }

    await syncServerClockOffset();
    const task = account.activeTasks[slotId];
    task.status = "STOPPED";
    
    // Claim in database if cloud task
    if (task.dbTaskId) {
      await dbClaimTaskRewards(task.dbTaskId);
    }

    // Process current pending cycles using estimated server time
    const summary = this.processTaskProgress(slotId, getEstimatedServerTime());
    account.activeTasks[slotId] = null;
    AccountStore.save();

    return { success: true, summary };
  },

  /**
   * Get active task for a character slot
   */
  getActiveTask(slotId) {
    const account = AccountStore.getAccount();
    if (!account || !account.activeTasks) return null;
    return account.activeTasks[slotId] || null;
  },

  /**
   * Process progress cycles for a character slot's task using server time estimation
   */
  processTaskProgress(slotId, currentTimestamp = getEstimatedServerTime()) {
    const account = AccountStore.getAccount();
    if (!account) return null;

    const char = AccountStore.getCharacter(slotId);
    const task = account.activeTasks ? account.activeTasks[slotId] : null;
    if (!char || !task || task.status !== "ACTIVE") return null;

    const hasEmberPass = char.hasEmberPass || false;
    const maxIdleMs = hasEmberPass ? PREMIUM_MAX_IDLE_MS : BASE_MAX_IDLE_MS;

    const rawElapsed = currentTimestamp - task.startTime;
    const effectiveElapsed = Math.min(rawElapsed, maxIdleMs);

    const totalPossibleCycles = Math.floor(effectiveElapsed / task.cycleMs);
    const newCyclesToProcess = totalPossibleCycles - (task.cyclesCompleted || 0);

    if (newCyclesToProcess <= 0) {
      return { cyclesProcessed: 0, rewards: [], expGained: 0 };
    }

    let cyclesProcessed = 0;
    let expGained = 0;
    let goldGained = 0;
    let lootItems = [];
    let inventoryFullPaused = false;
    let foodExhausted = false;

    // Check inventory capacity
    const currentInventoryCount = (char.inventory || []).reduce((acc, item) => acc + (item.qty || 1), 0);

    for (let i = 0; i < newCyclesToProcess; i++) {
      if (task.cyclesCompleted >= task.totalStack) {
        task.status = "COMPLETED";
        break;
      }

      // Check Inventory Full Policy
      if (currentInventoryCount + lootItems.length >= MAX_INVENTORY_SLOTS) {
        inventoryFullPaused = true;
        task.status = "PAUSED_INVENTORY_FULL";
        break;
      }

      // Combat Food Exhaustion Policy
      if (task.type === "combat" && task.foodQuantity > 0) {
        // Simulate food usage per cycle
        task.foodQuantity -= 1;
        if (task.foodQuantity <= 0) {
          foodExhausted = true;
          task.status = "STOPPED_FOOD_EXHAUSTED";
          // Auto-teleport character to nearest safe town node
          char.locationNode = "greenhollow";
          break;
        }
      }

      cyclesProcessed++;
      task.cyclesCompleted++;

      // Baseline rewards computation
      const cycleExp = 25;
      const cycleGold = 10;

      expGained += cycleExp;
      goldGained += cycleGold;

      // Sample drop chance
      if (Math.random() < 0.3) {
        lootItems.push({ id: "item_ore_iron", name: "Iron Ore", type: "material", qty: 1, icon: "🪨" });
      }
    }

    // Apply Rewards to Character State
    char.xp = (char.xp || 0) + expGained;
    char.gold = (char.gold || 0) + goldGained;

    // Apply Stance EXP Multipliers
    if (task.stance && task.stance !== "balanced") {
      if (task.stance === "offensive") char.power = (char.power || 10) + Math.floor(expGained * 0.05);
      if (task.stance === "defensive") char.defense = (char.defense || 5) + Math.floor(expGained * 0.05);
    }

    // Add loot to inventory
    lootItems.forEach(item => {
      const existing = (char.inventory || []).find(inv => inv.id === item.id);
      if (existing) {
        existing.qty = (existing.qty || 1) + item.qty;
      } else {
        char.inventory = char.inventory || [];
        char.inventory.push({ ...item });
      }
    });

    // Check Level Up
    while (char.xp >= char.maxXp) {
      char.xp -= char.maxXp;
      char.level = (char.level || 1) + 1;
      char.maxXp = Math.floor(char.maxXp * 1.25);
      char.skillPoints = (char.skillPoints || 0) + 1;
      char.hp = char.maxHp;
    }

    // Claim completed status in database if finished
    if ((task.status === "COMPLETED" || task.status === "STOPPED_FOOD_EXHAUSTED" || task.status === "PAUSED_INVENTORY_FULL") && task.dbTaskId) {
      dbClaimTaskRewards(task.dbTaskId);
    }

    AccountStore.saveLocalCache();

    return {
      slotId,
      charName: char.name,
      cyclesProcessed,
      elapsedMs: effectiveElapsed,
      expGained,
      goldGained,
      lootItems,
      inventoryFullPaused,
      foodExhausted,
      newLevel: char.level
    };
  },

  /**
   * Aggregated Offline Simulation for all active character slots
   * Fetch DB tasks, calculate progress using server time offset & cap enforcement
   */
  async simulateOfflineProgressAll() {
    const account = AccountStore.getAccount();
    if (!account) return null;

    // 1. Sync clock offset from Supabase DB server
    await syncServerClockOffset();
    const estimatedServerNow = getEstimatedServerTime();

    // 2. Load running tasks from Supabase if authenticated
    try {
      const characterIds = Object.values(account.characterSlots || {})
        .filter(c => c && typeof c.id === "string" && c.id.includes("-"))
        .map(c => c.id);

      if (characterIds.length > 0) {
        const dbTasks = await dbGetActiveTasks(characterIds);
        if (dbTasks && dbTasks.length > 0) {
          account.activeTasks = account.activeTasks || {};
          dbTasks.forEach(row => {
            const slotEntry = Object.entries(account.characterSlots).find(([s, c]) => c && c.id === row.character_id);
            if (slotEntry) {
              const slotId = parseInt(slotEntry[0], 10);
              const startTs = new Date(row.started_at).getTime();
              account.activeTasks[slotId] = {
                id: `task_${slotId}_${row.id}`,
                dbTaskId: row.id,
                type: row.task_type,
                targetId: row.target_id,
                targetName: row.target_id.replace("_", " ").toUpperCase(),
                icon: row.task_type === "mining" ? "⛏️" : row.task_type === "woodcutting" ? "🪓" : row.task_type === "fishing" ? "🎣" : "⚔️",
                startTime: startTs,
                cycleMs: 4000,
                cyclesCompleted: 0,
                totalStack: row.duration_seconds ? Math.floor((row.duration_seconds * 1000) / 4000) : Infinity,
                foodQuantity: row.allocated_food || 0,
                status: "ACTIVE",
                locationNode: "greenhollow"
              };
            }
          });
        }
      }
    } catch (err) {
      console.warn("Could not sync remote active tasks from DB:", err);
    }

    // 3. Calculate offline progression for all character slots
    const reports = [];

    [1, 2, 3, 4, 5].forEach(slotId => {
      const report = this.processTaskProgress(slotId, estimatedServerNow);
      if (report && report.cyclesProcessed > 0) {
        reports.push(report);
      }
    });

    if (reports.length === 0) return null;

    // Save final updated account state
    AccountStore.save();

    return {
      timestamp: estimatedServerNow,
      totalCharactersProcessed: reports.length,
      reports
    };
  }
};
