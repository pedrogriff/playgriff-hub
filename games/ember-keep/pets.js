// ================================================================
// PET SYSTEM CONSTANTS & DATA
// ================================================================

const PET_XP_TABLE = [0,50,100,175,275,400,550,750,1000,1300,1700,2200,2800,3500,4400,5500,7000,9000,11500,14500,18000];

function getPetStatMultiplier(petLevel) {
  if (petLevel <= 5)  return 1.0;
  if (petLevel <= 10) return 1.2;
  if (petLevel <= 15) return 1.5;
  return 2.0;
}

const PET_EGGS = {
  egg_common:   { id:"egg_common",   name:"Ovo Comum",       cost:200,   icon:"🥚", type:"material", desc:"Choca em um pet.",
                  chances: { common:0.80, rare:0.18, epic:0.02, legendary:0 }, hatchTimeMs: 60000 },
  egg_rare:     { id:"egg_rare",     name:"Ovo Raro",        cost:800,   icon:"🥚", type:"material", desc:"Choca em um pet.",
                  chances: { common:0.40, rare:0.45, epic:0.14, legendary:0.01 }, hatchTimeMs: 180000 },
  egg_epic:     { id:"egg_epic",     name:"Ovo Épico",       cost:3000,  icon:"🥚", type:"material", desc:"Choca em um pet.",
                  chances: { common:0,    rare:0.30, epic:0.60, legendary:0.10 }, hatchTimeMs: 300000 },
  egg_legendary:{ id:"egg_legendary",name:"Ovo Lendário",    cost:100,   icon:"🥚", type:"material", desc:"Choca em um pet lendário.",
                  chances: { common:0,    rare:0,    epic:0.50, legendary:0.50 }, premium:true, premiumCost:100, hatchTimeMs: 600000 },
};

const PET_SPECIES = {
  // 🐺 Caninos — DPS Sustentado
  wolf_grey:   { id:"wolf_grey",   family:"canine", name:"Lobo Cinzento",   rarity:"common", icon:"🐺",
                 archetype:"dps", passiveDesc:"+5% Power",
                 passive:{ stat:"power", valuePct:0.05 },
                 active:{ name:"Mordida", dmgPct:0.30, cooldown:3, effect:null, desc:"30% power dano" } },
  wolf_frost:  { id:"wolf_frost",  family:"canine", name:"Lobo Glacial",    rarity:"rare", icon:"🐺",
                 archetype:"dps", passiveDesc:"+8% Power, +3% Crit",
                 passive:{ stats:[{stat:"power",valuePct:0.08},{stat:"critChance",value:0.03}] },
                 active:{ name:"Mordida Gélida", dmgPct:0.40, cooldown:3, effect:"slow", effectRounds:1, desc:"40% power + slow" } },
  wolf_shadow: { id:"wolf_shadow", family:"canine", name:"Lobo das Sombras",rarity:"epic", icon:"🐺",
                 archetype:"dps", passiveDesc:"+12% Power, +5% Crit",
                 passive:{ stats:[{stat:"power",valuePct:0.12},{stat:"critChance",value:0.05}] },
                 active:{ name:"Fúria Sombria", dmgPct:0.60, cooldown:3, effect:"pierce", desc:"60% power + ignora defesa" } },
  fenrir:      { id:"fenrir",      family:"canine", name:"Fenrir",          rarity:"legendary", icon:"🐺",
                 archetype:"dps", passiveDesc:"+18% Power, +8% Crit, +3% Dodge",
                 passive:{ stats:[{stat:"power",valuePct:0.18},{stat:"critChance",value:0.08},{stat:"dodgeChance",value:0.03}] },
                 active:{ name:"Rugido Cósmico", dmgPct:1.00, cooldown:3, effect:"stun", stunRounds:1, desc:"100% power + stun" } },

  // 🐱 Felinos — Assassino / Crit
  cat_wild:    { id:"cat_wild",    family:"feline", name:"Gato Selvagem",   rarity:"common", icon:"🐱",
                 archetype:"crit", passiveDesc:"+5% Crit Chance",
                 passive:{ stat:"critChance", value:0.05 },
                 active:{ name:"Arranhão", dmgPct:0.25, cooldown:4, effect:"double_crit_chance", desc:"25% power, alta chance de crit" } },
  panther_night:{id:"panther_night",family:"feline",name:"Pantera Noturna", rarity:"rare", icon:"🐆",
                 archetype:"crit", passiveDesc:"+8% Crit, +10% Crit Dmg",
                 passive:{ stats:[{stat:"critChance",value:0.08},{stat:"critDamage",value:0.10}] },
                 active:{ name:"Emboscada", dmgPct:0.50, cooldown:4, effect:"guaranteed_crit", desc:"50% power, crit garantido" } },
  tiger_spect: { id:"tiger_spect", family:"feline", name:"Tigre Espectral", rarity:"epic", icon:"🐅",
                 archetype:"crit", passiveDesc:"+12% Crit, +20% Crit Dmg",
                 passive:{ stats:[{stat:"critChance",value:0.12},{stat:"critDamage",value:0.20}] },
                 active:{ name:"Fúria Felina", dmgPct:0.75, cooldown:4, effect:"guaranteed_crit", desc:"75% power, crit garantido" } }, 
  sphinx:      { id:"sphinx",      family:"feline", name:"Sphinx Ancestral",rarity:"legendary", icon:"🐈",
                 archetype:"crit", passiveDesc:"+15% Crit, +30% Crit Dmg, +5% Dodge",
                 passive:{ stats:[{stat:"critChance",value:0.15},{stat:"critDamage",value:0.30},{stat:"dodgeChance",value:0.05}] },
                 active:{ name:"Maldição do Sphinx", dmgPct:0.80, cooldown:4, effect:"armor_break", effectRounds:3, desc:"80% power + quebra defesa" } },

  // 🦅 Aves — Evasão / Debuff
  hawk:        { id:"hawk",        family:"bird",   name:"Falcão",          rarity:"common", icon:"🦅",
                 archetype:"dodge", passiveDesc:"+5% Dodge",
                 passive:{ stat:"dodgeChance", value:0.05 },
                 active:{ name:"Rasante", dmgPct:0.20, cooldown:3, effect:"weaken", effectRounds:2, weakenAmt:0.05, desc:"20% power + weaken 5%" } },
  eagle_storm: { id:"eagle_storm", family:"bird",   name:"Águia Tempestal", rarity:"rare", icon:"🦅",
                 archetype:"dodge", passiveDesc:"+8% Dodge, Inimigo -3% Crit",
                 passive:{ stat:"dodgeChance", value:0.08 }, 
                 active:{ name:"Tempestade de Penas", dmgPct:0.30, cooldown:3, effect:"weaken", effectRounds:2, weakenAmt:0.10, desc:"30% power + weaken 10%" } },
  phoenix_min: { id:"phoenix_min", family:"bird",   name:"Fênix Menor",     rarity:"epic", icon:"🦚",
                 archetype:"dodge", passiveDesc:"+12% Dodge, +2% HP Regen/round",
                 passive:{ stat:"dodgeChance", value:0.12 },
                 active:{ name:"Chama Purificadora", dmgPct:0.50, cooldown:3, effect:"cleanse", desc:"50% power + cleanse" } },
  roc:         { id:"roc",         family:"bird",   name:"Roc Celestial",   rarity:"legendary", icon:"🦅",
                 archetype:"dodge", passiveDesc:"+15% Dodge, +3% HP Regen/round",
                 passive:{ stat:"dodgeChance", value:0.15 },
                 active:{ name:"Vendaval Divino", dmgPct:0.70, cooldown:3, effect:"stun+weaken", stunRounds:1, effectRounds:3, weakenAmt:0.15, desc:"70% power + stun + weaken 15%" } },

  // 🐉 Répteis — Tank / Absorção
  turtle:      { id:"turtle",      family:"reptile",name:"Tartaruga Rochosa", rarity:"common", icon:"🐢",
                 archetype:"tank", passiveDesc:"Absorve 8% Dano",
                 passive:{ stat:"damageAbsorb", value:0.08 },
                 active:{ name:"Carapaça", dmgPct:0, cooldown:4, effect:"block", blockHits:1, desc:"Bloqueia 1 ataque" } },
  lizard_armor:{ id:"lizard_armor",family:"reptile",name:"Lagarto Blindado", rarity:"rare", icon:"🦎",
                 archetype:"tank", passiveDesc:"Absorve 12% Dano, +5% Def",
                 passive:{ stats:[{stat:"damageAbsorb",value:0.12},{stat:"defense",valuePct:0.05}] },
                 active:{ name:"Muralha Viva", dmgPct:0, cooldown:4, effect:"block", blockHits:2, desc:"Bloqueia 2 ataques" } },
  basilisk:    { id:"basilisk",    family:"reptile",name:"Basilisco",       rarity:"epic", icon:"🦎",
                 archetype:"tank", passiveDesc:"Absorve 18% Dano, +8% Def",
                 passive:{ stats:[{stat:"damageAbsorb",value:0.18},{stat:"defense",valuePct:0.08}] },
                 active:{ name:"Olhar Petrificante", dmgPct:0, cooldown:4, effect:"stun+block", stunRounds:1, blockHits:1, desc:"Stun 1 round + bloqueia 1 hit" } },
  hydra:       { id:"hydra",       family:"reptile",name:"Hidra Anciã",     rarity:"legendary", icon:"🐉",
                 archetype:"tank", passiveDesc:"Absorve 25% Dano, +12% Def, +1% Regen",
                 passive:{ stats:[{stat:"damageAbsorb",value:0.25},{stat:"defense",valuePct:0.12}] },
                 active:{ name:"Regeneração Ancestral", dmgPct:0, cooldown:4, effect:"block+heal", blockHits:2, healPct:0.15, desc:"Bloqueia 2 hits + cura 15%" } },

  // 👻 Espíritos — Suporte / Cura
  wisp:        { id:"wisp",        family:"spirit", name:"Wisp",            rarity:"common", icon:"👻",
                 archetype:"support", passiveDesc:"+3% HP Regen/round",
                 passive:{ stat:"hpRegenBattle", value:0.03 },
                 active:{ name:"Faísca Vital", dmgPct:0, cooldown:4, effect:"heal", healPct:0.10, desc:"Cura 10% HP" } },
  fairy_lum:   { id:"fairy_lum",   family:"spirit", name:"Fada Luminosa",   rarity:"rare", icon:"🧚",
                 archetype:"support", passiveDesc:"+5% HP Regen/round, +3% Dodge",
                 passive:{ stats:[{stat:"hpRegenBattle",value:0.05},{stat:"dodgeChance",value:0.03}] },
                 active:{ name:"Bênção Fae", dmgPct:0, cooldown:4, effect:"heal+buff", healPct:0.15, buffStat:"power", buffAmt:0.10, buffRounds:2, desc:"Cura 15% HP + buff 10% power" } },
  guardian_sp: { id:"guardian_sp", family:"spirit", name:"Espírito Guardião",rarity:"epic", icon:"👼",
                 archetype:"support", passiveDesc:"+7% HP Regen/round, +5% Def",
                 passive:{ stats:[{stat:"hpRegenBattle",value:0.07},{stat:"defense",valuePct:0.05}] },
                 active:{ name:"Escudo Espiritual", dmgPct:0, cooldown:4, effect:"heal+shield", healPct:0.20, shieldPct:0.30, desc:"Cura 20% + Escudo 30%" } },
  angel_fallen:{ id:"angel_fallen",family:"spirit", name:"Anjo Caído",      rarity:"legendary", icon:"🪽",
                 archetype:"support", passiveDesc:"+10% HP Regen, +5% All Stats",
                 passive:{ stats:[{stat:"hpRegenBattle",value:0.10},{stat:"power",valuePct:0.05},{stat:"defense",valuePct:0.05}] },
                 active:{ name:"Ressurreição", dmgPct:0, cooldown:99, effect:"revive", revivePct:0.30, desc:"Revive com 30% HP (1x/batalha)" } },

  // 🔥 Dragões — Híbrido / Power Puro
  dragon_whelp:{ id:"dragon_whelp",family:"dragon", name:"Dragonete",       rarity:"common", icon:"🐲",
                 archetype:"hybrid", passiveDesc:"+3% Power, +3% Def",
                 passive:{ stats:[{stat:"power",valuePct:0.03},{stat:"defense",valuePct:0.03}] },
                 active:{ name:"Cuspe de Fogo", dmgPct:0.40, cooldown:5, effect:null, desc:"40% power dano" } },
  drake_ice:   { id:"drake_ice",   family:"dragon", name:"Drake de Gelo",   rarity:"rare", icon:"🐉",
                 archetype:"hybrid", passiveDesc:"+6% Power, +6% Def, +3% Crit",
                 passive:{ stats:[{stat:"power",valuePct:0.06},{stat:"defense",valuePct:0.06},{stat:"critChance",value:0.03}] },
                 active:{ name:"Sopro Gélido", dmgPct:0.60, cooldown:5, effect:"slow", effectRounds:1, desc:"60% power + slow" } },
  dragon_lava: { id:"dragon_lava", family:"dragon", name:"Dragão de Lava",  rarity:"epic", icon:"🐉",
                 archetype:"hybrid", passiveDesc:"+10% Power, +8% Def, +5% Crit",
                 passive:{ stats:[{stat:"power",valuePct:0.10},{stat:"defense",valuePct:0.08},{stat:"critChance",value:0.05}] },
                 active:{ name:"Chuva de Fogo", dmgPct:0.80, cooldown:5, effect:"burn", burnPct:0.20, burnRounds:2, desc:"80% power + burn 20%" } },
  dragon_elder:{ id:"dragon_elder",family:"dragon", name:"Dragão Ancião",   rarity:"legendary", icon:"🐉",
                 archetype:"hybrid", passiveDesc:"+15% Power, +12% Def, +8% Crit, +5% Dodge",
                 passive:{ stats:[{stat:"power",valuePct:0.15},{stat:"defense",valuePct:0.12},{stat:"critChance",value:0.08},{stat:"dodgeChance",value:0.05}] },
                 active:{ name:"Fúria Ancestral", dmgPct:1.20, cooldown:5, effect:"stun+burn", stunRounds:1, burnPct:0.30, burnRounds:3, desc:"120% power + stun + burn" } },
};

function rollPetRarity(chances) {
  const roll = Math.random();
  let cumulative = 0;
  if (roll < (cumulative += chances.common)) return "common";
  if (roll < (cumulative += chances.rare)) return "rare";
  if (roll < (cumulative += chances.epic)) return "epic";
  return "legendary";
}

function rollPetFromRarity(rarity) {
  const possible = Object.values(PET_SPECIES).filter(p => p.rarity === rarity);
  return possible[Math.floor(Math.random() * possible.length)];
}

// ================================================================
// PET BATTLE LOGIC
// ================================================================

function executePetAction(pet, currentEffStats, enemyLevel) {
  if (typeof PET_SPECIES === 'undefined') return;
  const species = PET_SPECIES[pet.speciesId];
  if (!species) return;

  const scaleMult = getPetStatMultiplier(pet.level);
  const happinessMult = pet.happiness >= 50 ? 1.0 : 0.5;

  if (petCooldown > 0) {
    // Basic attack while on cooldown
    let basicDmg = Math.round(currentEffStats.power * 0.10 * scaleMult * happinessMult);
    // Apply defense if not piercing
    basicDmg = Math.max(1, basicDmg - (enemyLevel.defense || 0) * 0.1); 
    battleEnemyHp = Math.max(0, battleEnemyHp - basicDmg);
    if (typeof appendBattleLog === 'function') appendBattleLog(`${species.icon} ${pet.name} ataca! ${basicDmg} dano.`, "combat-player-hit");
    petCooldown--;
    if (typeof updateEnemyHpUI === 'function') updateEnemyHpUI();
    return;
  }

  // Active ability
  const active = species.active;
  
  // Calculate damage
  let dmg = 0;
  if (active.dmgPct > 0) {
    dmg = Math.round(currentEffStats.power * active.dmgPct * scaleMult * happinessMult);
    if (active.effect !== "pierce") {
      dmg = Math.max(1, dmg - (enemyLevel.defense || 0) * 0.5);
    }
  }

  // Handle special guaranteed/high crits
  let isCrit = false;
  if (active.effect === "guaranteed_crit") {
    isCrit = true;
    dmg = Math.floor(dmg * currentEffStats.critDamage);
  } else if (active.effect === "double_crit_chance") {
    if (Math.random() < currentEffStats.critChance * 2) {
      isCrit = true;
      dmg = Math.floor(dmg * currentEffStats.critDamage);
    }
  } else if (dmg > 0 && Math.random() < currentEffStats.critChance) {
    isCrit = true;
    dmg = Math.floor(dmg * currentEffStats.critDamage);
  }

  if (dmg > 0) {
    battleEnemyHp = Math.max(0, battleEnemyHp - dmg);
    if (typeof appendBattleLog === 'function') appendBattleLog(`${species.icon} ${pet.name} usa ${active.name}! ${dmg} dano${isCrit ? ' (CRÍTICO)!' : '!'}`, isCrit ? "combat-player-crit" : "combat-player-hit");
  } else {
    if (typeof appendBattleLog === 'function') appendBattleLog(`${species.icon} ${pet.name} usa ${active.name}!`, "combat-player-hit");
  }

  // Apply effects
  if (active.effect) {
    const effects = active.effect.split('+');
    for (const eff of effects) {
      if (eff === "stun") {
        battleEffects.stunRounds = (battleEffects.stunRounds || 0) + (active.stunRounds || 1);
      } else if (eff === "slow") {
        battleEffects.enemySlowRounds = (battleEffects.enemySlowRounds || 0) + (active.effectRounds || 1);
      } else if (eff === "armor_break") {
        battleEffects.enemyArmorBreak = (battleEffects.enemyArmorBreak || 0) + (active.effectRounds || 3);
      } else if (eff === "weaken") {
        battleEffects.enemyWeakenRounds = (battleEffects.enemyWeakenRounds || 0) + (active.effectRounds || 2);
        battleEffects.enemyWeakenAmt = active.weakenAmt || 0.10;
      } else if (eff === "cleanse") {
        battleEffects.poisonDamage = 0;
        battleEffects.poisonRounds = 0;
      } else if (eff === "block") {
        battleEffects.petAbsorbNextHits = (battleEffects.petAbsorbNextHits || 0) + (active.blockHits || 1);
      } else if (eff === "heal") {
        const heal = Math.round(battlePlayerMaxHp * (active.healPct || 0.10) * happinessMult);
        battlePlayerHp = Math.min(battlePlayerMaxHp, battlePlayerHp + heal);
        if (typeof appendBattleLog === 'function') appendBattleLog(`${species.icon} ${pet.name} curou você em ${heal} HP!`, "combat-player-hit");
        if (typeof updatePlayerHpUI === 'function') updatePlayerHpUI();
      } else if (eff === "shield") {
        const shieldAmt = Math.round(battlePlayerMaxHp * (active.shieldPct || 0.30) * happinessMult);
        battleEffects.manaShieldAbsorb = (battleEffects.manaShieldAbsorb || 0) + shieldAmt;
        battleEffects.manaShieldRounds = 3;
      } else if (eff === "buff") {
        if (active.buffStat === "power") {
          battleEffects.powerBoostMult = 1 + (active.buffAmt || 0.10);
          battleEffects.powerBoostRounds = (active.buffRounds || 2);
        }
      } else if (eff === "burn") {
        battleEffects.enemyBurnDamage = Math.round(currentEffStats.power * (active.burnPct || 0.20) * scaleMult);
        battleEffects.enemyBurnRounds = (active.burnRounds || 2);
      }
    }
  }

  petCooldown = active.cooldown;
  if (typeof updateEnemyHpUI === 'function') updateEnemyHpUI();
}

// ================================================================
// INCUBATION
// ================================================================

function hatchEgg(eggId) {
  const egg = PET_EGGS[eggId];
  if (!egg) return;
  
  if (playerState.hatchingEgg) {
    if (typeof showToast === 'function') showToast("Você já está chocando um ovo!", "error");
    return;
  }
  
  if (playerState.pets.length >= playerState.petStable) {
    if (typeof showToast === 'function') showToast("Seu estábulo de pets está cheio!", "error");
    return;
  }

  // Remove ovo do inventário
  const invIndex = playerState.inventory.findIndex(i => i.id === eggId);
  if (invIndex === -1) return;
  
  playerState.inventory[invIndex].qty--;
  if (playerState.inventory[invIndex].qty <= 0) {
    playerState.inventory.splice(invIndex, 1);
  }

  // Iniciar timer
  const now = Date.now();
  playerState.hatchingEgg = {
    eggId,
    startTime: now,
    endTime: now + egg.hatchTimeMs
  };
  
  if (typeof savePlayerState === 'function') savePlayerState();
  if (typeof renderPetSection === 'function') renderPetSection();
  if (typeof showToast === 'function') showToast(`Ovo colocado na incubadora! Tempo: ${Math.round(egg.hatchTimeMs/60000)}m`, "success");
}

function completeHatching() {
  if (!playerState.hatchingEgg) return;
  
  const egg = PET_EGGS[playerState.hatchingEgg.eggId];
  const rarity = rollPetRarity(egg.chances);
  const pet = rollPetFromRarity(rarity);
  
  playerState.pets.push({
    id: `pet_${Date.now()}_${Math.floor(Math.random()*1000)}`,
    speciesId: pet.id,
    name: pet.name,
    level: 1,
    xp: 0,
    stage: 1,
    happiness: 100,
    lastFed: Date.now()
  });
  
  playerState.hatchingEgg = null;
  
  if (typeof savePlayerState === 'function') savePlayerState();
  if (typeof renderPetSection === 'function') renderPetSection();
  if (typeof showToast === 'function') showToast(`🐣 Um ${pet.name} (${pet.rarity}) nasceu!`, "success");
}

function checkHatchingTimer() {
  if (!playerState.hatchingEgg) return;
  
  if (Date.now() >= playerState.hatchingEgg.endTime) {
    completeHatching();
  } else {
    if (typeof updateHatchTimerUI === 'function') updateHatchTimerUI();
  }
}

// ================================================================
// HAPPINESS AND FEEDING
// ================================================================

function updatePetHappiness() {
  if (!playerState.pets || playerState.pets.length === 0) return;
  const now = Date.now();
  let changed = false;
  
  playerState.pets.forEach(pet => {
    // Diminui 1 de felicidade a cada hora real passada desde a última alimentação
    const hoursPassed = Math.floor((now - (pet.lastFed || now)) / 3600000);
    
    // Atualiza progressivamente (se passaram 2 horas, perde 2, mas só registramos a perda)
    // Para simplificar, a cada tick, verificamos se passaram N horas.
    // Vamos registrar o tempo exato para não perder horas fracionadas.
    // Mas para isso precisamos armazenar lastHappinessUpdate, ou apenas usar lastFed como âncora.
    const expectedHappinessLost = hoursPassed; 
    
    // Como a felicidade cai com o tempo, a fórmula exata seria:
    // Felicidade Atual = FelicidadeBase - HorasPassadas + FelicidadeRecuperada
    // É mais fácil deduzir 1 a cada hora usando um ticker menor:
    
    if (!pet.lastHappinessTick) pet.lastHappinessTick = now;
    
    const elapsedSinceTick = now - pet.lastHappinessTick;
    if (elapsedSinceTick > 3600000) { // 1 hora
      const drops = Math.floor(elapsedSinceTick / 3600000);
      pet.happiness = Math.max(0, (pet.happiness || 100) - drops);
      pet.lastHappinessTick += drops * 3600000;
      changed = true;
    }
  });

  if (changed) {
    if (typeof savePlayerState === 'function') savePlayerState();
    if (typeof renderPetSection === 'function') renderPetSection();
  }
}

function feedPet(petId, foodItemId) {
  const pet = playerState.pets.find(p => p.id === petId);
  if (!pet) return;

  const invIndex = playerState.inventory.findIndex(i => i.id === foodItemId);
  if (invIndex === -1) {
    if (typeof showToast === 'function') showToast("Você não possui essa comida!", "error");
    return;
  }
  
  // Vamos assumir que CONSUMABLE_ITEMS contém a comida
  const food = typeof CONSUMABLE_ITEMS !== 'undefined' ? CONSUMABLE_ITEMS[foodItemId] : null;
  const feedAmount = food ? (food.feedAmount || 20) : 20;

  pet.happiness = Math.min(100, (pet.happiness || 0) + feedAmount);
  pet.lastFed = Date.now();
  pet.lastHappinessTick = Date.now(); // Reset
  
  playerState.inventory[invIndex].qty--;
  if (playerState.inventory[invIndex].qty <= 0) {
    playerState.inventory.splice(invIndex, 1);
  }

  if (typeof savePlayerState === 'function') savePlayerState();
  if (typeof renderPetSection === 'function') renderPetSection();
  if (typeof showToast === 'function') showToast(`❤️ ${pet.name} ficou mais feliz! (+${feedAmount})`, "success");
}

// ================================================================
// UI RENDERING
// ================================================================

function renderPetSection() {
  const activeDisplay = document.getElementById("active-pet-display");
  const hatchingDisplay = document.getElementById("pet-hatching-display");
  const collectionList = document.getElementById("pet-collection-list");

  if (!activeDisplay || !hatchingDisplay || !collectionList) return;

  // Render Active Pet
  if (playerState.activePet) {
    const pet = playerState.pets.find(p => p.id === playerState.activePet);
    if (pet) {
      const species = PET_SPECIES[pet.speciesId];
      const nextXp = PET_XP_TABLE[pet.level] || 'MAX';
      const xpText = typeof nextXp === 'number' ? `${pet.xp}/${nextXp}` : 'MAX';
      const xpPct = typeof nextXp === 'number' ? (pet.xp / nextXp) * 100 : 100;
      
      activeDisplay.innerHTML = `
        <div class="pet-card active-pet-card" style="border: 2px solid var(--ember); padding: 10px; border-radius: 8px; text-align: center;">
          <div class="pet-icon" style="font-size: 3rem;">${species.icon}</div>
          <div class="pet-details">
            <h4>${pet.name} (Lvl ${pet.level})</h4>
            <p style="font-size: 0.8rem; color: #aaa;">Raridade: ${species.rarity} | Estágio: ${pet.stage || 1}</p>
            <p style="font-size: 0.8rem;">Felicidade: ${pet.happiness}/100 
               <button class="btn-secondary" style="padding: 2px 5px; font-size: 0.7rem;" onclick="feedPetUI('${pet.id}')">🍖 Alimentar</button>
            </p>
            <div class="xp-bar-container" style="margin-top: 5px;">
              <div class="xp-bar-fill" style="width: ${xpPct}%;"></div>
            </div>
            <p style="font-size: 0.7rem; text-align: center;">${xpText} XP</p>
          </div>
          <div style="margin-top: 10px; display: flex; gap: 5px; justify-content: center;">
            <button class="btn-secondary" onclick="setPetActive(null)">Desequipar</button>
            ${(pet.stage || 1) < 3 && pet.level >= ((pet.stage || 1) * 10) ? `<button class="btn-primary" onclick="evolvePet('${pet.id}')">✨ Evoluir</button>` : ''}
          </div>
        </div>
      `;
    } else {
      activeDisplay.innerHTML = `<p class="empty-message">Pet não encontrado.</p>`;
    }
  } else {
    activeDisplay.innerHTML = `<p class="empty-message">Nenhum pet ativo.</p>`;
  }

  // Render Hatching
  if (playerState.hatchingEgg) {
    const egg = PET_EGGS[playerState.hatchingEgg.eggId];
    hatchingDisplay.innerHTML = `
      <div class="hatching-card" style="padding: 10px; background: rgba(255,255,255,0.05); margin-bottom: 10px; border-radius: 8px;">
        <h5>🥚 Incubadora: ${egg.name}</h5>
        <p id="hatching-timer-text">Calculando...</p>
      </div>
    `;
    updateHatchTimerUI();
  } else {
    hatchingDisplay.innerHTML = "";
  }

  // Render Collection
  if (playerState.pets.length > 0) {
    collectionList.innerHTML = `<h4>Estábulo (${playerState.pets.length}/${playerState.petStable})</h4>`;
    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "1fr 1fr";
    grid.style.gap = "10px";
    
    playerState.pets.forEach(pet => {
      const species = PET_SPECIES[pet.speciesId];
      const isEquipped = pet.id === playerState.activePet;
      
      const card = document.createElement("div");
      card.className = "pet-card";
      card.style.border = isEquipped ? "1px solid var(--ember)" : "1px solid #444";
      card.style.padding = "10px";
      card.style.background = "rgba(0,0,0,0.2)";
      card.style.textAlign = "center";
      card.style.borderRadius = "4px";
      
      card.innerHTML = `
        <div style="font-size: 2rem;">${species.icon}</div>
        <div style="font-weight: bold; margin: 5px 0;">${pet.name}</div>
        <div style="font-size: 0.8rem; color: #aaa;">Lvl ${pet.level} | ${species.rarity}</div>
        <div style="font-size: 0.8rem;">❤️ ${pet.happiness}/100</div>
        ${!isEquipped ? `<button class="btn-primary" style="margin-top: 5px; width: 100%;" onclick="setPetActive('${pet.id}')">Equipar</button>` : ''}
      `;
      grid.appendChild(card);
    });
    
    collectionList.appendChild(grid);
  } else {
    collectionList.innerHTML = `<p class="empty-message">Você não possui pets.</p>`;
  }
}

function updateHatchTimerUI() {
  const el = document.getElementById("hatching-timer-text");
  if (!el || !playerState.hatchingEgg) return;
  
  const now = Date.now();
  const left = playerState.hatchingEgg.endTime - now;
  
  if (left <= 0) {
    el.textContent = "Pronto para nascer!";
  } else {
    const mins = Math.floor(left / 60000);
    const secs = Math.floor((left % 60000) / 1000);
    el.textContent = `Faltam ${mins}m ${secs}s`;
  }
}

function setPetActive(petId) {
  playerState.activePet = petId;
  if (typeof savePlayerState === 'function') savePlayerState();
  if (typeof renderPetSection === 'function') renderPetSection();
  if (typeof renderStats === 'function') renderStats(); // Atualiza atributos baseados no pet
  if (petId && typeof showToast === 'function') showToast("Pet equipado!", "success");
}

function feedPetUI(petId) {
  // Feed auto with Meat or Fish for now.
  const foodIds = ["mat_meat", "mat_bone", "mat_fish", "food_apple", "food_bread"];
  let hasFood = false;
  
  for (let id of foodIds) {
    const inv = playerState.inventory.find(i => i.id === id);
    if (inv && inv.qty > 0) {
      feedPet(petId, id);
      hasFood = true;
      break;
    }
  }
  
  if (!hasFood) {
    if (typeof showToast === 'function') showToast("Você não possui carne, peixe ou outras comidas!", "error");
  }
}

function renderBattlePet() {
  const container = document.getElementById("battle-pet-container");
  const avatar = document.getElementById("battle-pet-avatar");
  if (!container || !avatar) return;
  
  if (playerState.activePet) {
    const pet = playerState.pets.find(p => p.id === playerState.activePet);
    if (pet) {
      const species = PET_SPECIES[pet.speciesId];
      avatar.textContent = species.icon;
      container.style.display = "block";
    } else {
      container.style.display = "none";
    }
  } else {
    container.style.display = "none";
  }
}

// ================================================================
// EVOLUTION
// ================================================================

function evolvePet(petId) {
  const pet = playerState.pets.find(p => p.id === petId);
  if (!pet) return;
  
  if (!pet.stage) pet.stage = 1;
  
  if (pet.stage === 1) {
    if (pet.level < 10) {
      if (typeof showToast === 'function') showToast("O pet precisa estar no nível 10 para evoluir!", "error");
      return;
    }
    if (playerState.gold < 1000) {
      if (typeof showToast === 'function') showToast("Você precisa de 1000 de Ouro!", "error");
      return;
    }
    // Simplificando o custo de materiais por enquanto
    playerState.gold -= 1000;
    pet.stage = 2;
    pet.name = "Awakened " + pet.name;
    if (typeof showToast === 'function') showToast(`✨ O pet evoluiu para o Estágio 2!`, "success");
  } else if (pet.stage === 2) {
    if (pet.level < 20) {
      if (typeof showToast === 'function') showToast("O pet precisa estar no nível 20 para evoluir!", "error");
      return;
    }
    if (playerState.gold < 5000) {
      if (typeof showToast === 'function') showToast("Você precisa de 5000 de Ouro!", "error");
      return;
    }
    playerState.gold -= 5000;
    pet.stage = 3;
    pet.name = "Ascended " + pet.name.replace("Awakened ", "");
    if (typeof showToast === 'function') showToast(`🌟 O pet evoluiu para o Estágio Final!`, "success");
  } else {
    if (typeof showToast === 'function') showToast("Este pet já atingiu o nível máximo de evolução.", "info");
    return;
  }
  
  if (typeof savePlayerState === 'function') savePlayerState();
  if (typeof renderPetSection === 'function') renderPetSection();
  if (typeof renderStats === 'function') renderStats();
}