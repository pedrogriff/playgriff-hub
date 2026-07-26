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
   * Difficulty Tier Multipliers for NG+ scaling
   */
  DIFFICULTY_TIERS: {
    normal:   { label: "Normal",   mobHpMult: 1.0, mobPowerMult: 1.0, mobDefMult: 1.0, lootBonus: 1.0,  icon: "⚔️", color: "#a0a0a0", requiredRebirths: 0 },
    hardened: { label: "Hardened", mobHpMult: 1.8, mobPowerMult: 1.5, mobDefMult: 1.4, lootBonus: 1.2,  icon: "🔥", color: "#f59e0b", requiredRebirths: 1 },
    infernal: { label: "Infernal", mobHpMult: 3.0, mobPowerMult: 2.5, mobDefMult: 2.2, lootBonus: 1.5,  icon: "💀", color: "#ef4444", requiredRebirths: 3 },
    mythic:   { label: "Mythic",   mobHpMult: 5.0, mobPowerMult: 4.0, mobDefMult: 3.5, lootBonus: 2.0,  icon: "🌌", color: "#8b5cf6", requiredRebirths: 6 },
  },

  /**
   * Scale mob stats and reward multipliers based on chosen target level (up to Level 150)
   * Now accepts optional difficulty tier for NG+ scaling
   */
  getScaledMob(baseMob, targetLevel, difficulty = "normal") {
    const levelDiff = Math.max(0, targetLevel - (baseMob.level || 1));
    const scaleFactor = 1 + (levelDiff * 0.08);

    const magicFindBonusPct = Math.min(2.5, levelDiff * 0.02); // Up to +250% Magic Find

    // Apply difficulty tier multipliers
    const tier = this.DIFFICULTY_TIERS[difficulty] || this.DIFFICULTY_TIERS.normal;

    return {
      ...baseMob,
      scaledLevel: targetLevel,
      difficulty: difficulty,
      hp: Math.floor(baseMob.hp * scaleFactor * tier.mobHpMult),
      power: Math.floor(baseMob.power * scaleFactor * tier.mobPowerMult),
      defense: Math.floor(baseMob.defense * scaleFactor * tier.mobDefMult),
      xpReward: Math.floor(baseMob.xp * scaleFactor * tier.lootBonus),
      goldReward: Math.floor(baseMob.gold * scaleFactor * tier.lootBonus),
      magicFindMultiplier: (1 + magicFindBonusPct) * tier.lootBonus
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
   * Boss Mutators (Phase 11: Dynamic Dungeon Encounter Mutators)
   */
  BOSS_MUTATORS: {
    enraged:       { id: "enraged",       name: "Enraged",       icon: "🔥", desc: "+40% Power, -20% Defense",          powerMult: 1.4, defMult: 0.8 },
    frozen_aura:   { id: "frozen_aura",   name: "Frozen Aura",   icon: "🧊", desc: "Inflicts 5% HP decay per turn",       decayPct: 0.05 },
    fortified:     { id: "fortified",     name: "Fortified",     icon: "🛡️", desc: "+80% Defense, -30% Power",          defMult: 1.8, powerMult: 0.7 },
    accelerated:   { id: "accelerated",   name: "Accelerated",   icon: "⚡", desc: "Attacks twice per turn",             doubleAttack: true },
    vampiric:      { id: "vampiric",      name: "Vampiric",      icon: "🩸", desc: "Heals 10% of damage dealt",          lifestealPct: 0.10 },
    undying:       { id: "undying",       name: "Undying",       icon: "💀", desc: "Revives once at 30% HP upon death",  reviveHpPct: 0.30 }
  },

  /**
   * Roll 1-3 deterministic weekly mutators for a dungeon floor (> 5)
   */
  rollMutators(dungeonId, floor) {
    if (floor <= 5) return [];

    const keys = Object.keys(this.BOSS_MUTATORS);
    const count = floor >= 15 ? 3 : floor >= 10 ? 2 : 1;
    const seedStr = `${dungeonId}_floor_${floor}_w${Math.floor(Date.now() / (7 * 86400 * 1000))}`;
    
    // Simple deterministic hash
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }

    const selected = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.abs(hash + i * 7) % keys.length;
      const mutatorKey = keys[idx];
      if (!selected.includes(this.BOSS_MUTATORS[mutatorKey])) {
        selected.push(this.BOSS_MUTATORS[mutatorKey]);
      }
    }
    return selected;
  },

  /**
   * Process a single combat round tick with mutator support
   */
  simulateRound(char, mob, stance = "balanced", mutators = []) {
    let charPower = char.power || 10;
    let charDef = char.defense || 5;
    let mobPower = mob.power || 10;
    let mobDef = mob.defense || 5;

    // Apply Stance Stat Modifiers
    if (stance === "offensive") charPower = Math.floor(charPower * 1.2);
    if (stance === "defensive") charDef = Math.floor(charDef * 1.3);

    // Apply Mutator Stat Modifiers to Mob
    mutators.forEach(m => {
      if (m.powerMult) mobPower = Math.floor(mobPower * m.powerMult);
      if (m.defMult) mobDef = Math.floor(mobDef * m.defMult);
    });

    let damageToMob = Math.max(1, charPower - (mobDef * 0.5));
    let damageToChar = Math.max(1, mobPower - (charDef * 0.5));

    // Double attack mutator
    if (mutators.some(m => m.doubleAttack)) {
      damageToChar = Math.floor(damageToChar * 1.8);
    }

    // Frozen aura decay
    if (mutators.some(m => m.decayPct)) {
      damageToChar += Math.floor((char.maxHp || 100) * 0.05);
    }

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
