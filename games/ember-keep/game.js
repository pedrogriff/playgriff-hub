// Core Game Logic for Hero's Quest

// Levels configuration
const LEVELS = [
  { id: 1, name: "Dark Forest", hp: 30, power: 8, defense: 2, goldReward: 20, xpReward: 30, avatar: "👾", suggestedPower: 15 },
  { id: 2, name: "Goblin Caves", hp: 60, power: 15, defense: 5, goldReward: 40, xpReward: 50, avatar: "👺", suggestedPower: 35 },
  { id: 3, name: "Orc Outpost", hp: 120, power: 25, defense: 10, goldReward: 80, xpReward: 80, avatar: "👹", suggestedPower: 70 },
  { id: 4, name: "Spider Nest", hp: 180, power: 35, defense: 15, goldReward: 120, xpReward: 110, avatar: "🕷️", suggestedPower: 100 },
  { id: 5, name: "Dragon's Lair", hp: 260, power: 50, defense: 22, goldReward: 200, xpReward: 150, avatar: "🐉", suggestedPower: 150 },
  { id: 6, name: "Ancient Temple", hp: 380, power: 70, defense: 30, goldReward: 300, xpReward: 200, avatar: "🗿", suggestedPower: 210 },
  { id: 7, name: "Frozen Tundra", hp: 550, power: 95, defense: 40, goldReward: 450, xpReward: 260, avatar: "🥶", suggestedPower: 290 },
  { id: 8, name: "Volcanic Pit", hp: 800, power: 130, defense: 55, goldReward: 700, xpReward: 350, avatar: "🌋", suggestedPower: 400 },
  { id: 9, name: "Shadow Citadel", hp: 1200, power: 180, defense: 75, goldReward: 1000, xpReward: 500, avatar: "🏰", suggestedPower: 570 },
  { id: 10, name: "Chaos Rift", hp: 2000, power: 250, defense: 100, goldReward: 2000, xpReward: 800, avatar: "🌀", suggestedPower: 820 }
];

// Class Presets
const CLASS_PRESETS = {
  Warrior: {
    avatar: "🛡️",
    stats: { maxHp: 120, power: 10, defense: 8 }
  },
  Ranger: {
    avatar: "🏹",
    stats: { maxHp: 100, power: 12, defense: 5 }
  },
  Mage: {
    avatar: "🔮",
    stats: { maxHp: 80, power: 15, defense: 3 }
  }
};

// Shop items configuration
const SHOP_ITEMS = {
  // Warrior
  warrior_w1: { id: "warrior_w1", class: "Warrior", type: "weapon", name: "Bronze Sword", stat: "power", value: 5, cost: 50, icon: "🗡️", tier: 1 },
  warrior_w2: { id: "warrior_w2", class: "Warrior", type: "weapon", name: "Iron Sword", stat: "power", value: 15, cost: 150, icon: "⚔️", tier: 2 },
  warrior_w3: { id: "warrior_w3", class: "Warrior", type: "weapon", name: "Mythril Sword", stat: "power", value: 35, cost: 400, icon: "🔱", tier: 3 },
  warrior_a1: { id: "warrior_a1", class: "Warrior", type: "armor", name: "Chainmail", stat: "defense", value: 5, cost: 50, icon: "⛓️", tier: 1 },
  warrior_a2: { id: "warrior_a2", class: "Warrior", type: "armor", name: "Steel Plate", stat: "defense", value: 15, cost: 150, icon: "🛡️", tier: 2 },
  warrior_a3: { id: "warrior_a3", class: "Warrior", type: "armor", name: "Dragon Plate", stat: "defense", value: 35, cost: 400, icon: "🥇", tier: 3 },
  // Ranger
  ranger_w1: { id: "ranger_w1", class: "Ranger", type: "weapon", name: "Shortbow", stat: "power", value: 6, cost: 50, icon: "🏹", tier: 1 },
  ranger_w2: { id: "ranger_w2", class: "Ranger", type: "weapon", name: "Recurve Bow", stat: "power", value: 18, cost: 150, icon: "🏹", tier: 2 },
  ranger_w3: { id: "ranger_w3", class: "Ranger", type: "weapon", name: "Elven Bow", stat: "power", value: 40, cost: 400, icon: "🏹", tier: 3 },
  ranger_a1: { id: "ranger_a1", class: "Ranger", type: "armor", name: "Leather Armor", stat: "defense", value: 4, cost: 50, icon: "🎽", tier: 1 },
  ranger_a2: { id: "ranger_a2", class: "Ranger", type: "armor", name: "Reinforced Leather", stat: "defense", value: 12, cost: 150, icon: "🥋", tier: 2 },
  ranger_a3: { id: "ranger_a3", class: "Ranger", type: "armor", name: "Dragonscale Armor", stat: "defense", value: 30, cost: 400, icon: "🐊", tier: 3 },
  // Mage
  mage_w1: { id: "mage_w1", class: "Mage", type: "weapon", name: "Apprentice Staff", stat: "power", value: 8, cost: 50, icon: "🪄", tier: 1 },
  mage_w2: { id: "mage_w2", class: "Mage", type: "weapon", name: "Sorcerer Wand", stat: "power", value: 20, cost: 150, icon: "🔮", tier: 2 },
  mage_w3: { id: "mage_w3", class: "Mage", type: "weapon", name: "Archmage Staff", stat: "power", value: 45, cost: 400, icon: "🧹", tier: 3 },
  mage_a1: { id: "mage_a1", class: "Mage", type: "armor", name: "Scholar Robes", stat: "defense", value: 3, cost: 50, icon: "🥻", tier: 1 },
  mage_a2: { id: "mage_a2", class: "Mage", type: "armor", name: "Mage Robes", stat: "defense", value: 10, cost: 150, icon: "👘", tier: 2 },
  mage_a3: { id: "mage_a3", class: "Mage", type: "armor", name: "Archmage Robes", stat: "defense", value: 25, cost: 400, icon: "🦹", tier: 3 }
};

// Default Player State
const DEFAULT_PLAYER_STATE = {
  class: null,
  level: 1,
  xp: 0,
  xpNeeded: 100,
  gold: 50,
  unlockedLevel: 1,
  stats: {
    maxHp: 100,
    power: 10,
    defense: 5
  },
  upgrades: {
    hpLevel: 0,
    powerLevel: 0,
    defenseLevel: 0
  },
  equipment: {
    weapon: null,
    armor: null
  },
  inventory: []
};

let playerState = {};
let activeBattleInterval = null;
let pendingLoot = null; // Global to store loot waiting for comparison

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  loadPlayerState();
  renderMap();
  renderStats();
  renderShop();
  renderInventory();
  initUpgradeButtons();
  initShopButtons();
  initBattleModalControls();
  initClassSelectionControls();
  initInventoryControls();
  initCompareModalControls();
});

// Tab Navigation logic
function initTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      tab.classList.add("active");
      const targetContent = document.getElementById(tab.dataset.tab);
      if (targetContent) {
        targetContent.classList.add("active");
      }
    });
  });
}

function initClassSelectionControls() {
  document.querySelectorAll(".select-class-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const className = e.currentTarget.dataset.class;
      selectClass(className);
    });
  });
}

function initInventoryControls() {
  const inventoryList = document.getElementById("inventory-list");
  if (inventoryList) {
    inventoryList.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-equip")) {
        const itemId = e.target.dataset.item;
        const itemIndex = parseInt(e.target.dataset.index);
        equipItemFromInventory(itemId, itemIndex);
      } else if (e.target.classList.contains("btn-sell")) {
        const itemId = e.target.dataset.item;
        const itemIndex = parseInt(e.target.dataset.index);
        sellItemFromInventory(itemId, itemIndex);
      }
    });
  }
}

function initCompareModalControls() {
  const closeBtn = document.getElementById("close-compare-modal-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeCompareModal);
  }
  
  const discardBtn = document.getElementById("discard-loot-btn");
  if (discardBtn) {
    discardBtn.addEventListener("click", () => {
      if (pendingLoot) {
        addLootToInventory(pendingLoot);
        pendingLoot = null;
      }
      closeCompareModal();
    });
  }
  
  const equipBtn = document.getElementById("equip-loot-btn");
  if (equipBtn) {
    equipBtn.addEventListener("click", () => {
      if (pendingLoot) {
        equipLootImmediately(pendingLoot);
        pendingLoot = null;
      }
      closeCompareModal();
    });
  }
}

function closeCompareModal() {
  const modal = document.getElementById("compare-modal");
  if (modal) {
    modal.classList.remove("active");
  }
}

// Load player state from localStorage
function loadPlayerState() {
  const savedState = localStorage.getItem("rpg_player_state");
  if (savedState) {
    try {
      playerState = JSON.parse(savedState);
      // Migrate missing properties if any
      playerState = { ...DEFAULT_PLAYER_STATE, ...playerState };
    } catch (e) {
      console.error("Error parsing player state, resetting.", e);
      playerState = JSON.parse(JSON.stringify(DEFAULT_PLAYER_STATE));
    }
  } else {
    playerState = JSON.parse(JSON.stringify(DEFAULT_PLAYER_STATE));
  }
  checkClassSelection();
}

function checkClassSelection() {
  const modal = document.getElementById("class-selection-modal");
  if (!modal) return;
  if (!playerState.class) {
    modal.classList.add("active");
  } else {
    modal.classList.remove("active");
  }
}

function selectClass(className) {
  const preset = CLASS_PRESETS[className];
  if (!preset) return;

  playerState.class = className;
  playerState.stats.maxHp = preset.stats.maxHp;
  playerState.stats.power = preset.stats.power;
  playerState.stats.defense = preset.stats.defense;
  
  playerState.equipment.weapon = null;
  playerState.equipment.armor = null;
  playerState.inventory = [];

  savePlayerState();
  checkClassSelection();
  
  renderMap();
  renderStats();
  renderShop();
  renderInventory();
  
  showToast(`You have selected the ${className} class!`, "success");
}

// Save player state to localStorage
function savePlayerState() {
  localStorage.setItem("rpg_player_state", JSON.stringify(playerState));
  // Dispatch custom event to notify social system of progression change
  const event = new CustomEvent("playerStateUpdated", { detail: playerState });
  window.dispatchEvent(event);
}

// Calculate effective stats (including gear upgrades)
function getEffectiveStats() {
  let extraPower = 0;
  let extraDefense = 0;

  if (playerState.equipment.weapon) {
    const weapon = SHOP_ITEMS[playerState.equipment.weapon];
    if (weapon) extraPower += weapon.value;
  }

  if (playerState.equipment.armor) {
    const armor = SHOP_ITEMS[playerState.equipment.armor];
    if (armor) extraDefense += armor.value;
  }

  return {
    maxHp: playerState.stats.maxHp,
    power: playerState.stats.power + extraPower,
    defense: playerState.stats.defense + extraDefense
  };
}

// Calculate player's power rating based on state
function getPlayerPowerRating(state) {
  if (!state || !state.stats) return 0;
  let power = state.stats.power;
  let defense = state.stats.defense;
  let hp = state.stats.maxHp;

  if (state.equipment.weapon) {
    const weapon = SHOP_ITEMS[state.equipment.weapon];
    if (weapon) power += weapon.value;
  }

  if (state.equipment.armor) {
    const armor = SHOP_ITEMS[state.equipment.armor];
    if (armor) defense += armor.value;
  }

  return Math.round(power * 2 + defense * 1.5 + hp * 0.1);
}

// Render adventure map level nodes
function renderMap() {
  const mapPath = document.getElementById("map-path");
  if (!mapPath) return;

  mapPath.innerHTML = "";

  LEVELS.forEach(level => {
    const node = document.createElement("div");
    node.className = "level-node";
    
    let stateClass = "locked";
    if (level.id < playerState.unlockedLevel) {
      stateClass = "completed";
    } else if (level.id === playerState.unlockedLevel) {
      stateClass = "unlocked";
    }

    node.classList.add(stateClass);
    node.id = `level-node-${level.id}`;

    // Inside content
    const numSpan = document.createElement("span");
    numSpan.className = "level-num";
    numSpan.innerText = level.id < playerState.unlockedLevel ? "⭐" : level.id;
    node.appendChild(numSpan);

    const nameSpan = document.createElement("span");
    nameSpan.className = "level-name";
    nameSpan.innerText = level.name;
    node.appendChild(nameSpan);

    // Event listener
    node.addEventListener("click", () => {
      if (stateClass !== "locked") {
        openBattleModal(level);
      } else {
        showToast("This level is locked! Complete previous levels first.", "error");
      }
    });

    mapPath.appendChild(node);
  });
}

// Render character status and attributes panel
function renderStats() {
  if (!playerState.class) return;

  // Header display
  document.getElementById("header-level").innerText = playerState.level;
  document.getElementById("header-gold").innerText = playerState.gold;

  // Character Profile display
  document.getElementById("char-level").innerText = playerState.level;
  document.getElementById("char-xp-text").innerText = `${playerState.xp}/${playerState.xpNeeded}`;
  
  const xpPercent = Math.min(100, (playerState.xp / playerState.xpNeeded) * 100);
  document.getElementById("char-xp-fill").style.width = `${xpPercent}%`;

  // Update Avatar and Name with Class
  const preset = CLASS_PRESETS[playerState.class];
  if (preset) {
    document.querySelector(".player-avatar").innerText = preset.avatar;
    document.getElementById("char-name").innerText = `Hero (${playerState.class})`;
  }

  const effStats = getEffectiveStats();
  document.getElementById("stat-hp").innerText = `${effStats.maxHp}/${effStats.maxHp}`;
  
  // Update Power Rating
  const powerRating = getPlayerPowerRating(playerState);
  const powerRatingEl = document.getElementById("char-power-rating");
  if (powerRatingEl) {
    powerRatingEl.innerText = powerRating;
  }
  document.getElementById("stat-power").innerText = `${effStats.power} (${playerState.stats.power} + ${effStats.power - playerState.stats.power})`;
  document.getElementById("stat-defense").innerText = `${effStats.defense} (${playerState.stats.defense} + ${effStats.defense - playerState.stats.defense})`;

  // Upgrade costs (scaling cost: 10 + level * 15)
  const hpCost = 10 + playerState.upgrades.hpLevel * 15;
  const powerCost = 10 + playerState.upgrades.powerLevel * 15;
  const defenseCost = 10 + playerState.upgrades.defenseLevel * 15;

  document.getElementById("cost-hp").innerText = `${hpCost}g`;
  document.getElementById("cost-power").innerText = `${powerCost}g`;
  document.getElementById("cost-defense").innerText = `${defenseCost}g`;

  // Enable/disable buttons based on gold
  document.getElementById("upgrade-hp-btn").disabled = playerState.gold < hpCost;
  document.getElementById("upgrade-power-btn").disabled = playerState.gold < powerCost;
  document.getElementById("upgrade-defense-btn").disabled = playerState.gold < defenseCost;
}

// Render shop and weapon/armor buy status
function renderShop() {
  if (!playerState.class) return;

  const weaponsContainer = document.getElementById("shop-weapons-container");
  const armorContainer = document.getElementById("shop-armor-container");
  
  if (!weaponsContainer || !armorContainer) return;

  weaponsContainer.innerHTML = "";
  armorContainer.innerHTML = "";

  for (const itemId in SHOP_ITEMS) {
    const item = SHOP_ITEMS[itemId];
    
    // Only show items for player's class
    if (item.class !== playerState.class) continue;

    const isWeaponEquipped = playerState.equipment.weapon === itemId;
    const isArmorEquipped = playerState.equipment.armor === itemId;
    const isEquipped = isWeaponEquipped || isArmorEquipped;
    const isOwned = isEquipped || playerState.inventory.some(i => i.id === itemId);

    const itemEl = document.createElement("div");
    itemEl.className = "shop-item";
    itemEl.id = `item-${itemId.replace(/_/g, '-')}`;
    itemEl.innerHTML = `
      <div class="item-icon">${item.icon}</div>
      <div class="item-details">
        <h5>${item.name}</h5>
        <p>${item.stat === "power" ? "Power" : "Defense"} +${item.value}</p>
      </div>
      <button class="btn-buy ${isEquipped ? 'equipped' : ''}" 
              data-item="${itemId}" 
              ${isEquipped ? 'disabled' : ''}
              ${(!isEquipped && isOwned) ? 'disabled' : ''}
              ${(!isOwned && playerState.gold < item.cost) ? 'disabled' : ''}>
        ${isEquipped ? 'Equipped' : (isOwned ? 'Owned' : `Buy <span class="cost">${item.cost}g</span>`)}
      </button>
    `;

    if (item.type === "weapon") {
      weaponsContainer.appendChild(itemEl);
    } else if (item.type === "armor") {
      armorContainer.appendChild(itemEl);
    }
  }
}

// Initialize Upgrade Buttons
function initUpgradeButtons() {
  document.getElementById("upgrade-hp-btn").addEventListener("click", () => {
    const cost = 10 + playerState.upgrades.hpLevel * 15;
    if (playerState.gold >= cost) {
      playerState.gold -= cost;
      playerState.stats.maxHp += 10;
      playerState.upgrades.hpLevel += 1;
      savePlayerState();
      renderStats();
      renderShop();
      showToast("HP upgraded successfully!", "success");
    }
  });

  document.getElementById("upgrade-power-btn").addEventListener("click", () => {
    const cost = 10 + playerState.upgrades.powerLevel * 15;
    if (playerState.gold >= cost) {
      playerState.gold -= cost;
      playerState.stats.power += 2;
      playerState.upgrades.powerLevel += 1;
      savePlayerState();
      renderStats();
      renderShop();
      showToast("Power upgraded successfully!", "success");
    }
  });

  document.getElementById("upgrade-defense-btn").addEventListener("click", () => {
    const cost = 10 + playerState.upgrades.defenseLevel * 15;
    if (playerState.gold >= cost) {
      playerState.gold -= cost;
      playerState.stats.defense += 1;
      playerState.upgrades.defenseLevel += 1;
      savePlayerState();
      renderStats();
      renderShop();
      showToast("Defense upgraded successfully!", "success");
    }
  });
}

// Initialize Shop Equipment Buttons
function initShopButtons() {
  const handleBuy = (e) => {
    const btn = e.target.closest(".btn-buy");
    if (btn) {
      const itemId = btn.dataset.item;
      buyItem(itemId);
    }
  };
  
  const weaponsContainer = document.getElementById("shop-weapons-container");
  const armorContainer = document.getElementById("shop-armor-container");
  
  if (weaponsContainer) weaponsContainer.addEventListener("click", handleBuy);
  if (armorContainer) armorContainer.addEventListener("click", handleBuy);
}

function buyItem(itemId) {
  const item = SHOP_ITEMS[itemId];
  if (!item) return;

  // Double check if already owned to prevent duplicate buying
  const isOwned = playerState.equipment.weapon === itemId || 
                  playerState.equipment.armor === itemId || 
                  playerState.inventory.some(i => i.id === itemId);
  if (isOwned) {
    showToast("You already own this item!", "error");
    return;
  }

  if (playerState.gold >= item.cost) {
    playerState.gold -= item.cost;
    equipItem(itemId);
    showToast(`Purchased and equipped ${item.name}!`, "success");
  } else {
    showToast("Not enough gold!", "error");
  }
}

function equipItem(itemId) {
  const item = SHOP_ITEMS[itemId];
  if (!item) return;

  let oldItemId = null;
  if (item.type === "weapon") {
    oldItemId = playerState.equipment.weapon;
    playerState.equipment.weapon = itemId;
  } else if (item.type === "armor") {
    oldItemId = playerState.equipment.armor;
    playerState.equipment.armor = itemId;
  }

  // Move old item to inventory
  if (oldItemId) {
    playerState.inventory.push({ id: oldItemId });
  }

  // Remove new item from inventory if it was there
  const itemIndex = playerState.inventory.findIndex(i => i.id === itemId);
  if (itemIndex > -1) {
    playerState.inventory.splice(itemIndex, 1);
  }

  savePlayerState();
  renderStats();
  renderShop();
  renderInventory();
}

// Modal controls
function openBattleModal(level) {
  const modal = document.getElementById("battle-modal");
  modal.classList.add("active");

  document.getElementById("battle-title").innerText = `Level ${level.id}: ${level.name}`;
  document.getElementById("enemy-name").innerText = level.name;
  document.getElementById("enemy-avatar").innerText = level.avatar;
  
  // Set enemy HP
  document.getElementById("enemy-hp-bar").style.width = "100%";
  document.getElementById("enemy-hp-text").innerText = `${level.hp}/${level.hp}`;

  // Set player HP
  const effStats = getEffectiveStats();
  document.getElementById("player-hp-bar").style.width = "100%";
  document.getElementById("player-hp-text").innerText = `${effStats.maxHp}/${effStats.maxHp}`;

  // Set Power Rating Comparison
  const playerPower = getPlayerPowerRating(playerState);
  const suggestedPower = level.suggestedPower || 0;
  
  const playerPowerValEl = document.getElementById("player-power-val");
  const suggestedPowerValEl = document.getElementById("suggested-power-val");
  const matchupStatusEl = document.getElementById("power-matchup-status");
  
  if (playerPowerValEl) playerPowerValEl.innerText = playerPower;
  if (suggestedPowerValEl) suggestedPowerValEl.innerText = suggestedPower;
  
  if (matchupStatusEl) {
    matchupStatusEl.className = ""; // Reset classes
    if (playerPower >= suggestedPower) {
      matchupStatusEl.innerText = "Strong Matchup";
      matchupStatusEl.classList.add("power-matchup-good");
    } else {
      matchupStatusEl.innerText = "Underpowered";
      matchupStatusEl.classList.add("power-matchup-bad");
    }
  }

  // Ensure Rematch button is hidden initially
  const rematchBtn = document.getElementById("rematch-battle-btn");
  if (rematchBtn) rematchBtn.style.display = "none";

  // Reset Battle Log
  const logEl = document.getElementById("battle-log");
  logEl.innerHTML = `<p class="system-message">Press "Start Battle" to challenge ${level.name}!</p>`;

  // Adjust modal buttons
  document.getElementById("start-battle-btn").style.display = "inline-block";
  document.getElementById("close-battle-btn").style.display = "none";
  document.getElementById("close-battle-modal-btn").style.display = "inline-block";

  // Cache level on the button
  document.getElementById("start-battle-btn").onclick = () => {
    startBattleSimulation(level);
  };

  // Cache level and reset logic on Rematch button
  const rematchBtnEl = document.getElementById("rematch-battle-btn");
  if (rematchBtnEl) {
    rematchBtnEl.onclick = () => {
      // Reset player HP UI
      const effStats = getEffectiveStats();
      document.getElementById("player-hp-bar").style.width = "100%";
      document.getElementById("player-hp-text").innerText = `${effStats.maxHp}/${effStats.maxHp}`;

      // Reset enemy HP UI
      document.getElementById("enemy-hp-bar").style.width = "100%";
      document.getElementById("enemy-hp-text").innerText = `${level.hp}/${level.hp}`;

      // Reset Battle Log
      const logEl = document.getElementById("battle-log");
      logEl.innerHTML = `<p class="system-message">Rematch started!</p>`;

      startBattleSimulation(level);
    };
  }
}

function closeBattleModal() {
  if (activeBattleInterval) {
    clearInterval(activeBattleInterval);
    activeBattleInterval = null;
  }
  document.getElementById("battle-modal").classList.remove("active");
}

function initBattleModalControls() {
  document.getElementById("close-battle-modal-btn").addEventListener("click", closeBattleModal);
  document.getElementById("close-battle-btn").addEventListener("click", closeBattleModal);
}

// Battle Simulation Logic
function startBattleSimulation(level) {
  // Disable close buttons and fight button during battle
  document.getElementById("start-battle-btn").style.display = "none";
  document.getElementById("close-battle-modal-btn").style.display = "none";
  document.getElementById("close-battle-btn").style.display = "none";
  const rematchBtn = document.getElementById("rematch-battle-btn");
  if (rematchBtn) rematchBtn.style.display = "none";

  const logEl = document.getElementById("battle-log");
  logEl.innerHTML = `<p class="system-message">The battle has begun!</p>`;

  const effStats = getEffectiveStats();
  let playerHp = effStats.maxHp;
  let enemyHp = level.hp;

  const playerFighterEl = document.querySelector(".player-fighter");
  const enemyFighterEl = document.querySelector(".enemy-fighter");

  activeBattleInterval = setInterval(() => {
    // 1. Player attacks enemy
    const playerDamage = Math.max(1, effStats.power - level.defense);
    enemyHp = Math.max(0, enemyHp - playerDamage);
    
    // Update enemy HP UI
    const enemyHpPercent = (enemyHp / level.hp) * 100;
    document.getElementById("enemy-hp-bar").style.width = `${enemyHpPercent}%`;
    document.getElementById("enemy-hp-text").innerText = `${enemyHp}/${level.hp}`;
    
    // Log player hit
    appendBattleLog(`You deal ${playerDamage} damage to ${level.name}!`, "combat-player-hit");
    enemyFighterEl.classList.add("shake");
    setTimeout(() => enemyFighterEl.classList.remove("shake"), 200);

    if (enemyHp <= 0) {
      handleBattleVictory(level);
      return;
    }

    // 2. Enemy attacks player (with minor delay simulation, here we do it together)
    const enemyDamage = Math.max(1, level.power - effStats.defense);
    playerHp = Math.max(0, playerHp - enemyDamage);

    // Update player HP UI
    const playerHpPercent = (playerHp / effStats.maxHp) * 100;
    document.getElementById("player-hp-bar").style.width = `${playerHpPercent}%`;
    document.getElementById("player-hp-text").innerText = `${playerHp}/${effStats.maxHp}`;

    // Log enemy hit
    appendBattleLog(`${level.name} strikes you for ${enemyDamage} damage!`, "combat-enemy-hit");
    playerFighterEl.classList.add("shake");
    setTimeout(() => playerFighterEl.classList.remove("shake"), 200);

    if (playerHp <= 0) {
      handleBattleDefeat();
      return;
    }
  }, 350); // Speed of round: 350ms
}

function appendBattleLog(text, className) {
  const logEl = document.getElementById("battle-log");
  const p = document.createElement("p");
  p.className = className;
  p.innerText = text;
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
}

// Victory Handler
function handleBattleVictory(level) {
  clearInterval(activeBattleInterval);
  activeBattleInterval = null;

  appendBattleLog(`🏆 Victory! You have defeated ${level.name}!`, "combat-victory");
  showToast(`Level ${level.id} completed! Earned ${level.goldReward}g and ${level.xpReward} XP.`, "success");

  // Rewards
  playerState.gold += level.goldReward;
  playerState.xp += level.xpReward;

  // Level Up Check
  if (playerState.xp >= playerState.xpNeeded) {
    playerState.xp -= playerState.xpNeeded;
    playerState.level += 1;
    playerState.xpNeeded = Math.round(playerState.xpNeeded * 1.5);
    playerState.stats.maxHp += 15;
    playerState.stats.power += 3;
    playerState.stats.defense += 2;
    appendBattleLog(`⭐ LEVEL UP! You reached Level ${playerState.level}! Attributes increased.`, "combat-victory");
    showToast(`Level UP! Reached level ${playerState.level}!`, "info");
  }

  // Progress Unlocks
  if (level.id === playerState.unlockedLevel && playerState.unlockedLevel < LEVELS.length) {
    playerState.unlockedLevel += 1;
    showToast(`Level ${playerState.unlockedLevel} has been unlocked on the map!`, "info");
  }

  checkForLootDrop(level);

  savePlayerState();
  renderMap();
  renderStats();
  renderShop();

  // Enable close buttons
  document.getElementById("close-battle-modal-btn").style.display = "inline-block";
  document.getElementById("close-battle-btn").style.display = "inline-block";
  const rematchBtn = document.getElementById("rematch-battle-btn");
  if (rematchBtn) rematchBtn.style.display = "inline-block";
}

// Defeat Handler
function handleBattleDefeat() {
  clearInterval(activeBattleInterval);
  activeBattleInterval = null;

  appendBattleLog(`💀 Defeat! You were knocked out...`, "combat-defeat");
  showToast(`You died! Try upgrading your attributes or getting better gear.`, "error");

  // Enable close buttons
  document.getElementById("close-battle-modal-btn").style.display = "inline-block";
  document.getElementById("close-battle-btn").style.display = "inline-block";
  const rematchBtn = document.getElementById("rematch-battle-btn");
  if (rematchBtn) rematchBtn.style.display = "inline-block";
}

// Toast System
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  
  container.appendChild(toast);

  // Auto remove after 3.5 seconds
  setTimeout(() => {
    toast.style.animation = "slideInRight 0.3s ease reverse";
    setTimeout(() => {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
    }, 300);
  }, 3500);
}

function renderInventory() {
  const inventoryList = document.getElementById("inventory-list");
  if (!inventoryList) return;

  inventoryList.innerHTML = "";

  if (!playerState.inventory || playerState.inventory.length === 0) {
    inventoryList.innerHTML = '<p class="empty-message" style="color: var(--text-muted); text-align: center; padding: 20px;">Your inventory is empty.</p>';
    return;
  }

  playerState.inventory.forEach((invItem, index) => {
    const item = SHOP_ITEMS[invItem.id];
    if (!item) return;

    const itemEl = document.createElement("div");
    itemEl.className = "inventory-item";
    itemEl.innerHTML = `
      <div class="item-icon">${item.icon}</div>
      <div class="item-details">
        <h5>${item.name}</h5>
        <p>${item.stat === "power" ? "Power" : "Defense"} +${item.value}</p>
      </div>
      <div class="inventory-item-actions">
        <button class="btn-upgrade btn-equip" data-item="${invItem.id}" data-index="${index}">Equip</button>
        <button class="btn-sell" data-item="${invItem.id}" data-index="${index}">Sell (${Math.round(item.cost * 0.5)}g)</button>
      </div>
    `;
    inventoryList.appendChild(itemEl);
  });
}

function equipItemFromInventory(itemId, index) {
  equipItem(itemId);
  showToast(`Equipped ${SHOP_ITEMS[itemId].name}!`, "success");
}

function sellItemFromInventory(itemId, index) {
  const item = SHOP_ITEMS[itemId];
  if (!item) return;

  const sellPrice = Math.round(item.cost * 0.5);
  playerState.gold += sellPrice;
  
  playerState.inventory.splice(index, 1);

  savePlayerState();
  renderStats();
  renderShop();
  renderInventory();
  
  showToast(`Sold ${item.name} for ${sellPrice}g!`, "success");
}

// Reset Game state (for testing use or debug console)
window.resetGame = () => {
  localStorage.removeItem("rpg_player_state");
  localStorage.removeItem("rpg_social_friends"); // clear friends too
  loadPlayerState();
  renderMap();
  renderStats();
  renderShop();
  renderInventory();
  showToast("Game state reset to default.", "info");
};

function checkForLootDrop(level) {
  if (Math.random() < 0.4) {
    let tier = 1;
    if (level.id >= 4 && level.id <= 7) {
      tier = 2;
    } else if (level.id >= 8) {
      tier = 3;
    }

    const possibleLoot = Object.values(SHOP_ITEMS).filter(item => 
      item.class === playerState.class && item.tier === tier
    );

    if (possibleLoot.length === 0) return;

    const lootItem = possibleLoot[Math.floor(Math.random() * possibleLoot.length)];
    
    const equippedItemId = lootItem.type === "weapon" ? playerState.equipment.weapon : playerState.equipment.armor;
    const equippedItem = equippedItemId ? SHOP_ITEMS[equippedItemId] : null;

    const equippedValue = equippedItem ? equippedItem.value : 0;
    
    if (lootItem.value > equippedValue) {
      pendingLoot = lootItem;
      showCompareModal(equippedItem, lootItem);
    } else {
      addLootToInventory(lootItem);
      showToast(`Found loot: ${lootItem.name}! (Sent to inventory)`, "info");
    }
  }
}

function showCompareModal(equippedItem, newLoot) {
  const modal = document.getElementById("compare-modal");
  if (!modal) return;

  const equippedDetails = document.getElementById("compare-equipped-details");
  const lootDetails = document.getElementById("compare-loot-details");
  const statDiff = document.getElementById("compare-stat-diff");

  if (equippedItem) {
    equippedDetails.innerHTML = `
      <div style="font-size: 2.5rem;">${equippedItem.icon}</div>
      <strong>${equippedItem.name}</strong>
      <p>${equippedItem.stat === "power" ? "Power" : "Defense"} +${equippedItem.value}</p>
    `;
  } else {
    equippedDetails.innerHTML = `
      <div style="font-size: 2.5rem; color: var(--text-muted);">❌</div>
      <strong>None</strong>
      <p>No item equipped</p>
    `;
  }

  lootDetails.innerHTML = `
    <div style="font-size: 2.5rem;">${newLoot.icon}</div>
    <strong>${newLoot.name}</strong>
    <p>${newLoot.stat === "power" ? "Power" : "Defense"} +${newLoot.value}</p>
  `;

  const equippedVal = equippedItem ? equippedItem.value : 0;
  const diff = newLoot.value - equippedVal;
  const statName = newLoot.stat === "power" ? "Power" : "Defense";

  statDiff.innerHTML = `${statName} difference: <span class="positive">+${diff}</span>`;

  modal.classList.add("active");
}

function equipLootImmediately(lootItem) {
  equipItem(lootItem.id);
  showToast(`Equipped ${lootItem.name}!`, "success");
}

function addLootToInventory(lootItem) {
  playerState.inventory.push({ id: lootItem.id });
  savePlayerState();
  renderInventory();
}
