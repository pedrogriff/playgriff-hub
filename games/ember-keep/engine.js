// ================================================================
// EMBER KEEP — Asynchronous Task & Offline Simulation Engine (engine.js)
// Native ES Module — Service / Repository Pattern (GameAPI)
// ================================================================

import { AccountStore } from "./account.js";

const BASE_MAX_IDLE_MS = 6 * 3600 * 1000; // 6 hours base
const PREMIUM_MAX_IDLE_MS = 8 * 3600 * 1000; // 8 hours Ember Pass
const MAX_INVENTORY_SLOTS = 30;

export const GameAPI = {
  /**
   * Start an asynchronous background task for a character slot
   */
  startTask(slotId, taskSpec) {
    const account = AccountStore.getAccount();
    if (!account) return { success: false, reason: "Account not loaded" };

    const char = AccountStore.getCharacter(slotId);
    if (!char) return { success: false, reason: "Character not found" };

    // Task specification schema
    const task = {
      id: `task_${slotId}_${Date.now()}`,
      type: taskSpec.type, // 'combat', 'gathering', 'crafting'
      targetId: taskSpec.targetId,
      targetName: taskSpec.targetName || "Action",
      icon: taskSpec.icon || "⏳",
      startTime: Date.now(),
      cycleMs: Math.max(3000, taskSpec.cycleMs || 4000), // Min 3 sec tick limit
      cyclesCompleted: 0,
      totalStack: taskSpec.totalStack || Infinity,
      stance: taskSpec.stance || "balanced",
      foodItemId: taskSpec.foodItemId || null,
      foodQuantity: taskSpec.foodQuantity || 0,
      status: "ACTIVE", // 'ACTIVE', 'PAUSED_INVENTORY_FULL', 'STOPPED_FOOD_EXHAUSTED', 'COMPLETED'
      locationNode: taskSpec.locationNode || "greenhollow"
    };

    account.activeTasks = account.activeTasks || {};
    account.activeTasks[slotId] = task;
    AccountStore.save();

    return { success: true, task };
  },

  /**
   * Stop an active task
   */
  stopTask(slotId) {
    const account = AccountStore.getAccount();
    if (!account || !account.activeTasks || !account.activeTasks[slotId]) {
      return { success: false, reason: "No active task found" };
    }

    const task = account.activeTasks[slotId];
    task.status = "STOPPED";
    
    // Process current pending cycles
    const summary = this.processTaskProgress(slotId, Date.now());
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
   * Process progress cycles for a character slot's task
   */
  processTaskProgress(slotId, currentTimestamp = Date.now()) {
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
    char.xp += expGained;
    char.gold += goldGained;

    // Apply Stance EXP Multipliers
    if (task.stance && task.stance !== "balanced") {
      // Stance EXP distribution applied to specific stat attributes
      if (task.stance === "offensive") char.power += Math.floor(expGained * 0.05);
      if (task.stance === "defensive") char.defense += Math.floor(expGained * 0.05);
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
      char.level += 1;
      char.maxXp = Math.floor(char.maxXp * 1.25);
      char.skillPoints += 1;
      char.hp = char.maxHp;
    }

    AccountStore.save();

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
   */
  simulateOfflineProgressAll() {
    const account = AccountStore.getAccount();
    if (!account) return null;

    const now = Date.now();
    const reports = [];

    [1, 2, 3].forEach(slotId => {
      const report = this.processTaskProgress(slotId, now);
      if (report && report.cyclesProcessed > 0) {
        reports.push(report);
      }
    });

    if (reports.length === 0) return null;

    return {
      timestamp: now,
      totalCharactersProcessed: reports.length,
      reports
    };
  }
};
