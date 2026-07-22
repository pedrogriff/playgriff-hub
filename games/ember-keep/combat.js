// ================================================================
// EMBER KEEP — Combat Engine (combat.js)
// Native ES Module
// ================================================================

import { AccountStore } from "./account.js";
import { GameAPI } from "./engine.js";

export const COMBAT_STANCES = {
  balanced:  { id: "balanced",  name: "Balanced Stance",  desc: "Equal EXP distribution across all stats", expMultiplier: 1.0 },
  offensive: { id: "offensive", name: "Offensive Stance", desc: "100% stat EXP focused into Power",       expMultiplier: 1.15 },
  defensive: { id: "defensive", name: "Defensive Stance", desc: "100% stat EXP focused into Defense",     expMultiplier: 1.15 },
  agile:     { id: "agile",     name: "Agile Stance",     desc: "100% stat EXP focused into Dodge",       expMultiplier: 1.15 },
  dexterous: { id: "dexterous", name: "Dexterous Stance", desc: "100% stat EXP focused into Criticals",   expMultiplier: 1.15 }
};

export const CombatEngine = {
  /**
   * Calculate Effective HP for a character given a food reserve
   * Effective HP = Base HP + (Food Quantity * Food Heal Value)
   */
  calculateEffectiveHP(char, foodItem, foodQuantity) {
    const baseHp = char.maxHp || 100;
    const foodHeal = foodItem ? (foodItem.value || 25) : 0;
    return baseHp + (foodQuantity * foodHeal);
  },

  /**
   * Scale mob stats and reward multipliers based on chosen target level (up to Level 150)
   */
  getScaledMob(baseMob, targetLevel) {
    const levelDiff = Math.max(0, targetLevel - (baseMob.level || 1));
    const scaleFactor = 1 + (levelDiff * 0.08);

    const magicFindBonusPct = Math.min(2.5, levelDiff * 0.02); // Up to +250% Magic Find

    return {
      ...baseMob,
      scaledLevel: targetLevel,
      hp: Math.floor(baseMob.hp * scaleFactor),
      power: Math.floor(baseMob.power * scaleFactor),
      defense: Math.floor(baseMob.defense * scaleFactor),
      xpReward: Math.floor(baseMob.xp * scaleFactor),
      goldReward: Math.floor(baseMob.gold * scaleFactor),
      magicFindMultiplier: 1 + magicFindBonusPct
    };
  },

  /**
   * Initiate a Batch Combat Task
   */
  startBatchCombat(slotId, mob, options = {}) {
    const char = AccountStore.getCharacter(slotId);
    if (!char) return { success: false, reason: "Character not found" };

    const stance = options.stance || "balanced";
    const stackSize = options.stackSize || 6;
    const foodItem = options.foodItem || null;
    const foodQuantity = options.foodQuantity || 0;
    const targetLevel = options.targetLevel || mob.level || 1;

    const scaledMob = this.getScaledMob(mob, targetLevel);

    const taskSpec = {
      type: "combat",
      targetId: mob.id,
      targetName: scaledMob.name,
      icon: mob.avatar || "⚔️",
      cycleMs: 4000, // 4 seconds per mob defeat cycle
      totalStack: stackSize,
      stance: stance,
      foodItemId: foodItem ? foodItem.id : null,
      foodQuantity: foodQuantity,
      locationNode: mob.regionId || "greenhollow",
      mobDetails: scaledMob
    };

    return GameAPI.startTask(slotId, taskSpec);
  },

  /**
   * Process a single combat round tick
   */
  simulateRound(char, mob, stance = "balanced") {
    let charPower = char.power || 10;
    let charDef = char.defense || 5;

    // Apply Stance Stat Modifiers
    if (stance === "offensive") charPower = Math.floor(charPower * 1.2);
    if (stance === "defensive") charDef = Math.floor(charDef * 1.3);

    const damageToMob = Math.max(1, charPower - (mob.defense * 0.5));
    const damageToChar = Math.max(1, mob.power - (charDef * 0.5));

    const isCrit = Math.random() < (char.critChance || 0.05);
    const finalDamageToMob = isCrit ? Math.floor(damageToMob * (char.critDamage || 1.5)) : damageToMob;

    return {
      damageToMob: finalDamageToMob,
      damageToChar,
      isCrit
    };
  },

  async playServerCombatLog(combatLog, onTurnCallback, options = {}) {
    if (!combatLog || !Array.isArray(combatLog.turns)) return combatLog;

    for (let i = 0; i < combatLog.turns.length; i++) {
      if (options.cancelled) break;
      const turnEvent = combatLog.turns[i];
      if (typeof onTurnCallback === "function") {
        onTurnCallback(turnEvent, i + 1, combatLog.turns.length);
      }
      
      if (!options.skip && i < combatLog.turns.length - 1) {
        const speed = Number(options.speed) || 1;
        const delayMs = Math.max(20, Math.floor(500 / speed));
        await new Promise(res => setTimeout(res, delayMs));
      }
    }

    return combatLog;
  }
};
