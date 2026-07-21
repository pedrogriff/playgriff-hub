import { AccountStore } from "./account.js";
import { getServerTime, startTask as dbStartTask, getActiveTasks as dbGetActiveTasks, claimTaskRewards as dbClaimTaskRewards, claimTaskRewardsRPC, getCharacterInventory } from "./db.js";

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
   * Stop an active task (Phase 3 Atomic Transaction RPC)
   */
  async stopTask(slotId) {
    const account = AccountStore.getAccount();
    if (!account || !account.activeTasks || !account.activeTasks[slotId]) {
      return { success: false, reason: "No active task found" };
    }

    await syncServerClockOffset();
    const char = AccountStore.getCharacter(slotId);
    let summary = null;

    if (char && typeof char.id === "string" && char.id.includes("-")) {
      try {
        const rpcRes = await claimTaskRewardsRPC(char.id);
        if (rpcRes && rpcRes.success) {
          char.level = rpcRes.new_level;
          char.xp = rpcRes.new_exp;
          char.gold = (char.gold || 0) + (rpcRes.gold_gained || 0);

          const dbInv = await getCharacterInventory(char.id);
          if (dbInv && dbInv.length > 0) {
            char.inventory = dbInv.map(i => ({
              id: i.item_id,
              name: i.item_name,
              type: i.item_type,
              qty: i.quantity,
              icon: i.icon
            }));
          }

          summary = {
            slotId,
            charName: char.name,
            cyclesProcessed: rpcRes.processed_cycles,
            elapsedMs: (rpcRes.duration_seconds || 0) * 1000,
            expGained: rpcRes.exp_gained,
            goldGained: rpcRes.gold_gained,
            lootItems: rpcRes.items_added || [],
            inventoryFullPaused: rpcRes.inventory_full,
            foodExhausted: rpcRes.food_exhausted,
            newLevel: rpcRes.new_level
          };
        }
      } catch (e) {
        console.warn("Atomic RPC claim failed during stopTask, falling back:", e);
      }
    }

    if (!summary) {
      const task = account.activeTasks[slotId];
      task.status = "STOPPED";
      summary = this.processTaskProgress(slotId, getEstimatedServerTime());
    }

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
        task.foodQuantity -= 1;
        if (task.foodQuantity <= 0) {
          foodExhausted = true;
          task.status = "STOPPED_FOOD_EXHAUSTED";
          char.locationNode = "greenhollow";
          break;
        }
      }

      cyclesProcessed++;
      task.cyclesCompleted++;

      const cycleExp = 25;
      const cycleGold = 10;

      expGained += cycleExp;
      goldGained += cycleGold;

      if (Math.random() < 0.3) {
        lootItems.push({ id: "item_ore_iron", name: "Iron Ore", type: "material", qty: 1, icon: "🪨" });
      }
    }

    char.xp = (char.xp || 0) + expGained;
    char.gold = (char.gold || 0) + goldGained;

    if (task.stance && task.stance !== "balanced") {
      if (task.stance === "offensive") char.power = (char.power || 10) + Math.floor(expGained * 0.05);
      if (task.stance === "defensive") char.defense = (char.defense || 5) + Math.floor(expGained * 0.05);
    }

    lootItems.forEach(item => {
      const existing = (char.inventory || []).find(inv => inv.id === item.id);
      if (existing) {
        existing.qty = (existing.qty || 1) + item.qty;
      } else {
        char.inventory = char.inventory || [];
        char.inventory.push({ ...item });
      }
    });

    while (char.xp >= char.maxXp) {
      char.xp -= char.maxXp;
      char.level = (char.level || 1) + 1;
      char.maxXp = Math.floor(char.maxXp * 1.25);
      char.skillPoints = (char.skillPoints || 0) + 1;
      char.hp = char.maxHp;
    }

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
   * Aggregated Offline Simulation using Atomic RPC (claim_task_rewards)
   */
  async simulateOfflineProgressAll() {
    const account = AccountStore.getAccount();
    if (!account) return null;

    await syncServerClockOffset();
    const estimatedServerNow = getEstimatedServerTime();
    const reports = [];

    const slots = [1, 2, 3, 4, 5];
    for (const slotId of slots) {
      const char = AccountStore.getCharacter(slotId);
      if (char && typeof char.id === "string" && char.id.includes("-")) {
        try {
          const rpcRes = await claimTaskRewardsRPC(char.id);
          if (rpcRes && rpcRes.success && rpcRes.processed_cycles > 0) {
            char.level = rpcRes.new_level;
            char.xp = rpcRes.new_exp;
            char.gold = (char.gold || 0) + (rpcRes.gold_gained || 0);

            const dbInv = await getCharacterInventory(char.id);
            if (dbInv && dbInv.length > 0) {
              char.inventory = dbInv.map(i => ({
                id: i.item_id,
                name: i.item_name,
                type: i.item_type,
                qty: i.quantity,
                icon: i.icon
              }));
            }

            reports.push({
              slotId,
              charName: char.name,
              cyclesProcessed: rpcRes.processed_cycles,
              elapsedMs: (rpcRes.duration_seconds || 0) * 1000,
              expGained: rpcRes.exp_gained,
              goldGained: rpcRes.gold_gained,
              lootItems: rpcRes.items_added || [],
              inventoryFullPaused: rpcRes.inventory_full,
              foodExhausted: rpcRes.food_exhausted,
              newLevel: rpcRes.new_level
            });

            if (account.activeTasks) account.activeTasks[slotId] = null;
          }
        } catch (e) {
          console.warn(`Atomic RPC offline claim failed for slot ${slotId}:`, e);
          const report = this.processTaskProgress(slotId, estimatedServerNow);
          if (report && report.cyclesProcessed > 0) reports.push(report);
        }
      } else {
        const report = this.processTaskProgress(slotId, estimatedServerNow);
        if (report && report.cyclesProcessed > 0) reports.push(report);
      }
    }

    if (reports.length === 0) return null;

    AccountStore.save();

    return {
      timestamp: estimatedServerNow,
      totalCharactersProcessed: reports.length,
      reports
    };
  }
};

