import { AccountStore } from "./account.js";
import { getServerTime, startTask as dbStartTask, getActiveTasks as dbGetActiveTasks, claimTaskRewards as dbClaimTaskRewards, claimTaskRewardsRPC, getCharacterInventory } from "./db.js";

const BASE_MAX_IDLE_MS = 24 * 3600 * 1000; // 24 hours max execution limit
const PREMIUM_MAX_IDLE_MS = 24 * 3600 * 1000; // 24 hours max execution limit
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
    let autoSalvagedGold = 0;

    // Loot Filter Configuration (Phase 10: Auto-Salvage)
    const RARITY_RANK = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6, celestial: 7 };
    const lootFilter = char.lootFilter || {};
    const salvageThreshold = lootFilter.auto_salvage_below ? RARITY_RANK[lootFilter.auto_salvage_below] || 0 : 0;
    const keepMaterials = lootFilter.keep_materials !== false;

    // Ember Shard Bonuses (Phase 10: Rebirth permanent buffs)
    const emberShards = account ? (account.emberShards || 0) : 0;
    const shardXpMult = 1 + (emberShards * 0.02);   // +2% XP per shard
    const shardGoldMult = 1 + (emberShards * 0.01);  // +1% Gold per shard

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

      const cycleExp = Math.floor(25 * shardXpMult);
      const cycleGold = Math.floor(10 * shardGoldMult);

      expGained += cycleExp;
      goldGained += cycleGold;

      if (Math.random() < 0.3) {
        const droppedItem = { id: "item_ore_iron", name: "Iron Ore", type: "material", qty: 1, icon: "🪨", rarity: "common" };

        // Auto-Salvage Filter: convert to gold if below threshold (skip materials if keepMaterials is true)
        const itemRank = RARITY_RANK[droppedItem.rarity] || 1;
        if (salvageThreshold > 0 && itemRank < salvageThreshold && !(keepMaterials && droppedItem.type === "material")) {
          autoSalvagedGold += (droppedItem.qty || 1) * 5; // 5g per salvaged item
        } else {
          lootItems.push(droppedItem);
        }
      }
    }

    // Add auto-salvage gold to total
    goldGained += autoSalvagedGold;

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

    // Technical Guard C: Fallback Safety Guard
    // When a task pauses/fails (e.g. inventory full or food exhausted), check if inventory is full BEFORE initiating a fallback task
    const isInventoryFull = (char.inventory || []).reduce((acc, item) => acc + (item.qty || 1), 0) >= MAX_INVENTORY_SLOTS;

    if ((inventoryFullPaused || foodExhausted) && isInventoryFull) {
      // Do NOT trigger fallback task if inventory is completely full to avoid infinite loops
      console.warn(`[TaskQueue Guard C] Inventory is full (${char.inventory.length}/${MAX_INVENTORY_SLOTS}). Skipping fallback task.`);
    }

    AccountStore.save();

    return {
      cyclesProcessed,
      expGained,
      goldGained,
      lootItems,
      inventoryFullPaused,
      foodExhausted,
      newLevel: char.level
    };
  },

  /**
   * Return Queue capacity based on housing tier
   */
  getQueueCapacity(housingTier = 0) {
    return Math.min(5, Math.max(1, housingTier));
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

    // Technical Guard B: Compute Scout Tower task speed buff BEFORE evaluating active character's task cycles
    let garrisonAssignments = [];
    let garrisonBuffs = { taskSpeedMultiplier: 1.0 };
    if (typeof window !== "undefined" && window.GarrisonEngine) {
      garrisonAssignments = await window.GarrisonEngine.getAssignments().catch(() => []);
      garrisonBuffs = window.GarrisonEngine.computeAccountBuffs(garrisonAssignments);
    }

    const slots = [1, 2, 3, 4];
    for (const slotId of slots) {
      const char = AccountStore.getCharacter(slotId);
      const existingTask = account.activeTasks ? account.activeTasks[slotId] : null;

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
              newLevel: rpcRes.new_level,
              activeTaskSpec: existingTask ? { ...existingTask } : null
            });

            if (account.activeTasks) account.activeTasks[slotId] = null;
          }
        } catch (e) {
          console.warn(`Atomic RPC offline claim failed for slot ${slotId}:`, e);
          const report = this.processTaskProgress(slotId, estimatedServerNow);
          if (report && report.cyclesProcessed > 0) {
            report.activeTaskSpec = existingTask ? { ...existingTask } : null;
            reports.push(report);
          }
        }
      } else {
        const report = this.processTaskProgress(slotId, estimatedServerNow);
        if (report && report.cyclesProcessed > 0) {
          report.activeTaskSpec = existingTask ? { ...existingTask } : null;
          reports.push(report);
        }
      }
    }

    if (reports.length === 0) return null;

    AccountStore.save();

    return {
      timestamp: estimatedServerNow,
      totalCharactersProcessed: reports.length,
      reports
    };
  },

  /**
   * Continue running tasks from offline report starting new 24h cycle
   */
  async continueTasksFromReport(reports) {
    if (!reports || !Array.isArray(reports)) return;
    for (const r of reports) {
      if (r.activeTaskSpec && !r.inventoryFullPaused && !r.foodExhausted) {
        const spec = r.activeTaskSpec;
        await this.startTask(r.slotId, {
          type: spec.type,
          category: spec.category,
          targetId: spec.targetId || spec.type || "default_target",
          targetName: spec.targetName || spec.name || "Action",
          name: spec.name,
          icon: spec.icon,
          totalStack: spec.totalStack || 9999,
          cycleMs: spec.cycleMs || 4000,
          foodQuantity: spec.foodQuantity || 0
        });
      }
    }
  }
};

