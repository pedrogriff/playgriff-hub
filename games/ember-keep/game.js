// ================================================================
// EMBER KEEP — Core Game Logic (Phase 1)
// ================================================================

// ================================================================
// DATA: LEVELS (30 levels, 3 acts)
// ================================================================
const ACTS = [
  { id: 1, name: "Act I: The Cursed Valley",  theme: "Forest & Caves",    color: "#4ade80" },
  { id: 2, name: "Act II: The Shattered Peaks",theme: "Mountains & Ice",   color: "#60a5fa" },
  { id: 3, name: "Act III: The Ember Citadel", theme: "Demonic Fortress",  color: "#ff6b35" },
];

const LEVELS = [
  // ── ACT I ──
  { id:1,  name:"Mossy Grotto",   hp:35,     power:8,    defense:2,   gold:20,    xp:30,   avatar:"🐸", suggested:15,   act:1 },
  { id:2,  name:"Dark Forest",    hp:70,     power:16,   defense:5,   gold:40,    xp:50,   avatar:"👾", suggested:35,   act:1 },
  { id:3,  name:"Goblin Warren",  hp:125,    power:26,   defense:9,   gold:70,    xp:75,   avatar:"👺", suggested:65,   act:1 },
  { id:4,  name:"Orc Outpost",    hp:200,    power:38,   defense:14,  gold:105,   xp:105,  avatar:"👹", suggested:100,  act:1 },
  { id:5,  name:"Spider Nest",    hp:300,    power:52,   defense:21,  gold:150,   xp:140,  avatar:"🕷️", suggested:145,  act:1, isMidBoss:true },
  { id:6,  name:"Bandit Camp",    hp:430,    power:70,   defense:29,  gold:210,   xp:180,  avatar:"🗡️", suggested:200,  act:1 },
  { id:7,  name:"Ancient Ruins",  hp:610,    power:91,   defense:38,  gold:285,   xp:225,  avatar:"🗿", suggested:265,  act:1 },
  { id:8,  name:"Cursed Swamp",   hp:860,    power:117,  defense:49,  gold:380,   xp:275,  avatar:"🧙", suggested:345,  act:1 },
  { id:9,  name:"Dragon's Den",   hp:1200,   power:149,  defense:62,  gold:500,   xp:335,  avatar:"🐉", suggested:440,  act:1 },
  { id:10, name:"Chaos Knight",   hp:1700,   power:188,  defense:78,  gold:750,   xp:420,  avatar:"🏰", suggested:560,  act:1, isBoss:true },
  // ── ACT II ──
  { id:11, name:"Mountain Pass",  hp:2200,   power:200,  defense:85,  gold:950,   xp:540,  avatar:"🐺", suggested:680,  act:2 },
  { id:12, name:"Dwarven Ruins",  hp:3000,   power:225,  defense:95,  gold:1200,  xp:680,  avatar:"⚙️", suggested:820,  act:2 },
  { id:13, name:"Lava Fields",    hp:4000,   power:252,  defense:107, gold:1500,  xp:840,  avatar:"🌋", suggested:980,  act:2 },
  { id:14, name:"Crystal Caverns",hp:5200,   power:282,  defense:120, gold:1850,  xp:1020, avatar:"💎", suggested:1160, act:2 },
  { id:15, name:"Storm Lord",     hp:6800,   power:315,  defense:134, gold:2400,  xp:1240, avatar:"⚡", suggested:1380, act:2, isBoss:true },
  { id:16, name:"Ancient Library",hp:8700,   power:352,  defense:150, gold:3000,  xp:1500, avatar:"📚", suggested:1640, act:2 },
  { id:17, name:"Frost Citadel",  hp:11000,  power:393,  defense:167, gold:3700,  xp:1800, avatar:"🧊", suggested:1940, act:2 },
  { id:18, name:"Volcanic Forge", hp:14000,  power:439,  defense:187, gold:4600,  xp:2150, avatar:"🔥", suggested:2290, act:2 },
  { id:19, name:"Shadow Keep",    hp:17500,  power:491,  defense:208, gold:5700,  xp:2560, avatar:"🌑", suggested:2700, act:2 },
  { id:20, name:"The Eternal Storm",hp:22000, power:549, defense:232, gold:7500,  xp:3200, avatar:"🌪️", suggested:3190, act:2, isBoss:true },
  // ── ACT III ──
  { id:21, name:"Ember Gate",     hp:27000,  power:614,  defense:258, gold:9000,  xp:4000, avatar:"🔥", suggested:3770, act:3 },
  { id:22, name:"Infernal Bridge",hp:33000,  power:686,  defense:287, gold:11000, xp:4900, avatar:"😈", suggested:4440, act:3 },
  { id:23, name:"Obsidian Tower", hp:40000,  power:767,  defense:319, gold:13500, xp:5900, avatar:"🗼", suggested:5230, act:3 },
  { id:24, name:"The Ash Fields", hp:49000,  power:858,  defense:354, gold:16500, xp:7100, avatar:"💀", suggested:6160, act:3 },
  { id:25, name:"Fire Lord",      hp:59000,  power:959,  defense:393, gold:21000, xp:8600, avatar:"👑", suggested:7260, act:3, isBoss:true },
  { id:26, name:"Void Corridor",  hp:71000,  power:1072, defense:436, gold:25500, xp:10300,avatar:"🌀", suggested:8550, act:3 },
  { id:27, name:"Soul Chamber",   hp:86000,  power:1198, defense:483, gold:31000, xp:12300,avatar:"🔮", suggested:10070,act:3 },
  { id:28, name:"Dark Sanctuary", hp:104000, power:1338, defense:535, gold:38000, xp:14700,avatar:"😇", suggested:11860,act:3 },
  { id:29, name:"Citadel Apex",   hp:125000, power:1494, defense:592, gold:47000, xp:17600,avatar:"🦂", suggested:13960,act:3 },
  { id:30, name:"The Ember King", hp:150000, power:1669, defense:655, gold:120000,xp:30000, avatar:"🔥", suggested:16440,act:3, isBoss:true, isFinalBoss:true },
];

// Optional side zones (not required for main progression)
const SIDE_ZONES = [
  { id:"sz_5a",  name:"Haunted Mines",  hp:420,   power:58,  defense:24, gold:280,  xp:200,  avatar:"💀", suggested:170, afterLevel:5,  staminaCost:15, label:"Challenge", zoneType:"challenge" },
  { id:"sz_5b",  name:"Merchant Road",  hp:310,   power:42,  defense:16, gold:380,  xp:150,  avatar:"🏪", suggested:120, afterLevel:5,  staminaCost:12, label:"Treasure",  zoneType:"treasure" },
  { id:"sz_15a", name:"Dragon Roost",   hp:9500,  power:360, defense:155,gold:4800, xp:2100, avatar:"🐲", suggested:1550,afterLevel:15, staminaCost:55, label:"Challenge", zoneType:"challenge" },
  { id:"sz_15b", name:"Giant's Hall",   hp:7200,  power:300, defense:130,gold:5800, xp:1600, avatar:"🧌", suggested:1380,afterLevel:15, staminaCost:50, label:"Treasure",  zoneType:"treasure" },
];

// ================================================================
// DATA: CLASSES
// ================================================================
const CLASS_PRESETS = {
  Warrior: { avatar:"🛡️", image:"./images/warrior.png", mana:50, manaRegen:8,
    stats:{ maxHp:120, power:10, defense:8, critChance:0.05, critDamage:1.5, dodgeChance:0.05 } },
  Ranger:  { avatar:"🏹", image:"./images/ranger.png",  mana:60, manaRegen:10,
    stats:{ maxHp:100, power:12, defense:5, critChance:0.20, critDamage:1.75,dodgeChance:0.15 } },
  Mage:    { avatar:"🔮", image:"./images/mage.png",    mana:100,manaRegen:15,
    stats:{ maxHp:80,  power:15, defense:3, critChance:0.15, critDamage:2.0, dodgeChance:0.08 } },
  Paladin: { avatar:"⚜️", image:"./images/paladin.png", mana:70, manaRegen:10,
    stats:{ maxHp:140, power:8,  defense:10,critChance:0.05, critDamage:1.5, dodgeChance:0.05 } },
};

// ================================================================
// DATA: ACTIVE SKILLS
// ================================================================
const SKILLS = {
  warrior_1: { id:"warrior_1", class:"Warrior", name:"Shield Wall",   icon:"🛡️", desc:"Block the next enemy attack completely",    manaCost:15, cooldown:3, unlockLevel:5,  effect:"shieldWall" },
  warrior_2: { id:"warrior_2", class:"Warrior", name:"Battle Cry",    icon:"⚔️", desc:"Power +60% for 3 rounds",                  manaCost:20, cooldown:5, unlockLevel:10, effect:"powerBoost" },
  warrior_3: { id:"warrior_3", class:"Warrior", name:"Whirlwind",     icon:"🌀", desc:"Deal 3× Power damage ignoring defense",     manaCost:35, cooldown:6, unlockLevel:15, effect:"whirlwind" },
  ranger_1:  { id:"ranger_1",  class:"Ranger",  name:"Poison Arrow",  icon:"🏹", desc:"Poison: ~25% Power/round for 4 rounds",    manaCost:12, cooldown:4, unlockLevel:5,  effect:"poison" },
  ranger_2:  { id:"ranger_2",  class:"Ranger",  name:"Eagle Eye",     icon:"🦅", desc:"Guarantee critical hits for 2 attacks",    manaCost:20, cooldown:5, unlockLevel:10, effect:"eagleEye" },
  ranger_3:  { id:"ranger_3",  class:"Ranger",  name:"Rain of Arrows",icon:"🌧️", desc:"Strike 4 times at 70% Power each",        manaCost:30, cooldown:6, unlockLevel:15, effect:"rainOfArrows" },
  mage_1:    { id:"mage_1",    class:"Mage",    name:"Frost Nova",    icon:"❄️", desc:"Freeze enemy 1 round + 40% Power burst",  manaCost:15, cooldown:3, unlockLevel:5,  effect:"frostNova" },
  mage_2:    { id:"mage_2",    class:"Mage",    name:"Arcane Surge",  icon:"✨", desc:"Deal 2.5× Power as pure magic damage",    manaCost:25, cooldown:5, unlockLevel:10, effect:"arcaneSurge" },
  mage_3:    { id:"mage_3",    class:"Mage",    name:"Mana Shield",   icon:"💜", desc:"Absorb up to 60% Max HP over 3 rounds",   manaCost:35, cooldown:8, unlockLevel:15, effect:"manaShield" },
  paladin_1: { id:"paladin_1", class:"Paladin", name:"Holy Light",    icon:"✝️", desc:"Heal yourself for 25% of Max HP",         manaCost:20, cooldown:4, unlockLevel:5,  effect:"holyLight" },
  paladin_2: { id:"paladin_2", class:"Paladin", name:"Divine Shield", icon:"🛡️", desc:"Block ALL damage for 2 rounds",           manaCost:30, cooldown:6, unlockLevel:10, effect:"divineShield" },
  paladin_3: { id:"paladin_3", class:"Paladin", name:"Consecration",  icon:"☀️", desc:"Deal 2× Power holy damage for 2 rounds", manaCost:25, cooldown:5, unlockLevel:15, effect:"consecration" },
};

// ================================================================
// DATA: EQUIPMENT (CLASS + UNIVERSAL RINGS)
// ================================================================
const CLASS_ITEMS = {
  // === WARRIOR ===
  warrior_w1:{ id:"warrior_w1",  class:"Warrior", type:"weapon", name:"Bronze Sword",     stat:"power",   value:5,   cost:50,   icon:"🗡️", tier:1 },
  warrior_w2:{ id:"warrior_w2",  class:"Warrior", type:"weapon", name:"Iron Sword",        stat:"power",   value:15,  cost:150,  icon:"⚔️", tier:2 },
  warrior_w3:{ id:"warrior_w3",  class:"Warrior", type:"weapon", name:"Mythril Sword",     stat:"power",   value:35,  cost:400,  icon:"🔱", tier:3 },
  warrior_w4:{ id:"warrior_w4",  class:"Warrior", type:"weapon", name:"Masterwork Blade",  stat:"power",   value:70,  cost:1200, icon:"🗡️", tier:4 },
  warrior_w5:{ id:"warrior_w5",  class:"Warrior", type:"weapon", name:"Dragonslayer",      stat:"power",   value:130, cost:4000, icon:"⚔️", tier:5 },
  warrior_a1:{ id:"warrior_a1",  class:"Warrior", type:"armor",  name:"Chainmail",         stat:"defense", value:5,   cost:50,   icon:"⛓️", tier:1 },
  warrior_a2:{ id:"warrior_a2",  class:"Warrior", type:"armor",  name:"Steel Plate",       stat:"defense", value:15,  cost:150,  icon:"🛡️", tier:2 },
  warrior_a3:{ id:"warrior_a3",  class:"Warrior", type:"armor",  name:"Dragon Plate",      stat:"defense", value:35,  cost:400,  icon:"🥇", tier:3 },
  warrior_a4:{ id:"warrior_a4",  class:"Warrior", type:"armor",  name:"Warlord's Plate",   stat:"defense", value:55,  cost:1200, icon:"🛡️", tier:4 },
  warrior_a5:{ id:"warrior_a5",  class:"Warrior", type:"armor",  name:"Titan Armor",       stat:"defense", value:100, cost:4000, icon:"🏅", tier:5 },
  // === RANGER ===
  ranger_w1: { id:"ranger_w1",   class:"Ranger",  type:"weapon", name:"Shortbow",          stat:"power",   value:6,   cost:50,   icon:"🏹", tier:1 },
  ranger_w2: { id:"ranger_w2",   class:"Ranger",  type:"weapon", name:"Recurve Bow",       stat:"power",   value:18,  cost:150,  icon:"🏹", tier:2 },
  ranger_w3: { id:"ranger_w3",   class:"Ranger",  type:"weapon", name:"Elven Bow",         stat:"power",   value:40,  cost:400,  icon:"🏹", tier:3 },
  ranger_w4: { id:"ranger_w4",   class:"Ranger",  type:"weapon", name:"Eagle's Bow",       stat:"power",   value:75,  cost:1200, icon:"🏹", tier:4 },
  ranger_w5: { id:"ranger_w5",   class:"Ranger",  type:"weapon", name:"Phoenix Bow",       stat:"power",   value:140, cost:4000, icon:"🏹", tier:5 },
  ranger_a1: { id:"ranger_a1",   class:"Ranger",  type:"armor",  name:"Leather Armor",     stat:"defense", value:4,   cost:50,   icon:"🎽", tier:1 },
  ranger_a2: { id:"ranger_a2",   class:"Ranger",  type:"armor",  name:"Reinforced Leather",stat:"defense", value:12,  cost:150,  icon:"🥋", tier:2 },
  ranger_a3: { id:"ranger_a3",   class:"Ranger",  type:"armor",  name:"Dragonscale Armor", stat:"defense", value:30,  cost:400,  icon:"🐊", tier:3 },
  ranger_a4: { id:"ranger_a4",   class:"Ranger",  type:"armor",  name:"Stalker's Vest",    stat:"defense", value:50,  cost:1200, icon:"🦺", tier:4 },
  ranger_a5: { id:"ranger_a5",   class:"Ranger",  type:"armor",  name:"Shadow Leather",    stat:"defense", value:90,  cost:4000, icon:"🎽", tier:5 },
  // === MAGE ===
  mage_w1:   { id:"mage_w1",     class:"Mage",    type:"weapon", name:"Apprentice Staff",  stat:"power",   value:8,   cost:50,   icon:"🪄", tier:1 },
  mage_w2:   { id:"mage_w2",     class:"Mage",    type:"weapon", name:"Sorcerer Wand",     stat:"power",   value:20,  cost:150,  icon:"🔮", tier:2 },
  mage_w3:   { id:"mage_w3",     class:"Mage",    type:"weapon", name:"Archmage Staff",    stat:"power",   value:45,  cost:400,  icon:"🧹", tier:3 },
  mage_w4:   { id:"mage_w4",     class:"Mage",    type:"weapon", name:"Void Scepter",      stat:"power",   value:80,  cost:1200, icon:"🪄", tier:4 },
  mage_w5:   { id:"mage_w5",     class:"Mage",    type:"weapon", name:"Infinity Staff",    stat:"power",   value:150, cost:4000, icon:"🔮", tier:5 },
  mage_a1:   { id:"mage_a1",     class:"Mage",    type:"armor",  name:"Scholar Robes",     stat:"defense", value:3,   cost:50,   icon:"🥻", tier:1 },
  mage_a2:   { id:"mage_a2",     class:"Mage",    type:"armor",  name:"Mage Robes",        stat:"defense", value:10,  cost:150,  icon:"👘", tier:2 },
  mage_a3:   { id:"mage_a3",     class:"Mage",    type:"armor",  name:"Archmage Robes",    stat:"defense", value:25,  cost:400,  icon:"🦹", tier:3 },
  mage_a4:   { id:"mage_a4",     class:"Mage",    type:"armor",  name:"Arcane Mantle",     stat:"defense", value:42,  cost:1200, icon:"🥻", tier:4 },
  mage_a5:   { id:"mage_a5",     class:"Mage",    type:"armor",  name:"Ethereal Robes",    stat:"defense", value:75,  cost:4000, icon:"🥷", tier:5 },
  // === PALADIN ===
  paladin_w1:{ id:"paladin_w1",  class:"Paladin", type:"weapon", name:"Holy Mace",         stat:"power",   value:5,   cost:50,   icon:"🔨", tier:1 },
  paladin_w2:{ id:"paladin_w2",  class:"Paladin", type:"weapon", name:"Sacred Hammer",     stat:"power",   value:14,  cost:150,  icon:"⚒️", tier:2 },
  paladin_w3:{ id:"paladin_w3",  class:"Paladin", type:"weapon", name:"Divine Maul",       stat:"power",   value:32,  cost:400,  icon:"🔱", tier:3 },
  paladin_w4:{ id:"paladin_w4",  class:"Paladin", type:"weapon", name:"Holy Avenger",      stat:"power",   value:65,  cost:1200, icon:"⚜️", tier:4 },
  paladin_w5:{ id:"paladin_w5",  class:"Paladin", type:"weapon", name:"Excalibur",         stat:"power",   value:120, cost:4000, icon:"⚔️", tier:5 },
  paladin_a1:{ id:"paladin_a1",  class:"Paladin", type:"armor",  name:"Battle Vestments",  stat:"defense", value:6,   cost:50,   icon:"🛡️", tier:1 },
  paladin_a2:{ id:"paladin_a2",  class:"Paladin", type:"armor",  name:"Holy Plate",        stat:"defense", value:16,  cost:150,  icon:"⚜️", tier:2 },
  paladin_a3:{ id:"paladin_a3",  class:"Paladin", type:"armor",  name:"Paladin's Aegis",   stat:"defense", value:38,  cost:400,  icon:"🛡️", tier:3 },
  paladin_a4:{ id:"paladin_a4",  class:"Paladin", type:"armor",  name:"Celestial Mail",    stat:"defense", value:60,  cost:1200, icon:"✨", tier:4 },
  paladin_a5:{ id:"paladin_a5",  class:"Paladin", type:"armor",  name:"Inquisitor's Plate",stat:"defense", value:110, cost:4000, icon:"🏅", tier:5 },
};

const RING_ITEMS = {
  ring_1: { id:"ring_1", class:null, type:"ring", name:"Iron Ring",          stat:"power",       value:5,    cost:80,   icon:"💍", tier:1 },
  ring_2: { id:"ring_2", class:null, type:"ring", name:"Guard Amulet",       stat:"defense",     value:4,    cost:80,   icon:"🔴", tier:1 },
  ring_3: { id:"ring_3", class:null, type:"ring", name:"Lucky Charm",        stat:"critChance",  value:0.05, cost:200,  icon:"🍀", tier:2 },
  ring_4: { id:"ring_4", class:null, type:"ring", name:"Shadow Ring",        stat:"dodgeChance", value:0.06, cost:200,  icon:"🖤", tier:2 },
  ring_5: { id:"ring_5", class:null, type:"ring", name:"Enchanted Band",     stat:"power",       value:18,   cost:600,  icon:"💎", tier:3 },
  ring_6: { id:"ring_6", class:null, type:"ring", name:"Bulwark Ring",       stat:"defense",     value:15,   cost:600,  icon:"🔷", tier:3 },
  ring_7: { id:"ring_7", class:null, type:"ring", name:"Thunderstruck Ring", stat:"critChance",  value:0.10, cost:1500, icon:"⚡", tier:4 },
  ring_8: { id:"ring_8", class:null, type:"ring", name:"Specter's Ring",     stat:"dodgeChance", value:0.12, cost:1500, icon:"👻", tier:4 },
  ring_9: { id:"ring_9", class:null, type:"ring", name:"Void Ring",          stat:"power",       value:35,   cost:5000, icon:"🌀", tier:5 },
  ring_10:{ id:"ring_10",class:null, type:"ring", name:"Aegis Pendant",      stat:"defense",     value:30,   cost:5000, icon:"🏺", tier:5 },
};

const ALL_ITEMS = { ...CLASS_ITEMS, ...RING_ITEMS };

// Skill point upgrade options
const SP_OPTIONS = [
  { id:"hp",     label:"❤️ Max HP",      desc:"+10 HP",        stat:"maxHp",       amount:10,   statKey:"stats" },
  { id:"power",  label:"⚔️ Power",       desc:"+2 Power",      stat:"power",       amount:2,    statKey:"stats" },
  { id:"defense",label:"🛡️ Defense",     desc:"+1 Defense",    stat:"defense",     amount:1,    statKey:"stats" },
  { id:"crit",   label:"💥 Crit Chance", desc:"+1% Crit",      stat:"critChance",  amount:0.01, statKey:"stats" },
  { id:"dodge",  label:"💨 Dodge Chance",desc:"+1% Dodge",     stat:"dodgeChance", amount:0.01, statKey:"stats" },
  { id:"mana",   label:"🔮 Max Mana",    desc:"+10 Mana",      stat:"maxMana",     amount:10,   statKey:"top" },
];

// ================================================================
// DEFAULT PLAYER STATE
// ================================================================
const DEFAULT_PLAYER_STATE = {
  name: "Hero",
  class: null,
  level: 1,
  xp: 0,
  xpNeeded: 100,
  gold: 50,
  unlockedLevel: 1,
  stamina: 100,
  lastStaminaUpdate: Date.now(),
  maxMana: 50,
  skillPoints: 0,
  stats: { maxHp:100, power:10, defense:5, critChance:0.05, critDamage:1.5, dodgeChance:0.05 },
  upgrades: { hpLevel:0, powerLevel:0, defenseLevel:0 },
  equipment: { weapon:null, armor:null, ring:null },
  inventory: [],
  completedSideZones: [],
};

// ================================================================
// MODULE-LEVEL STATE
// ================================================================
let playerState = {};
let activeBattleInterval = null;
let pendingLoot = null;
let staminaInterval = null;

// Battle state (reset per fight)
let battleEffects = {};
let skillCooldowns = {};
let currentBattleMana = 0;
let battleMaxMana = 0;
let battleRound = 0;
let battlePlayerHp = 0;
let battlePlayerMaxHp = 0;
let battleEnemyHp = 0;
let battleEnemyMaxHp = 0;
let currentBattleLevel = null;

// Settings
let gameSettings = { sound: true, autoEquip: false };

// ================================================================
// INIT
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  initTabs();
  initShopTabs();
  loadPlayerState();
  renderMap();
  renderStats();
  renderShop();
  renderInventory();
  renderSkills();
  initUpgradeButtons();
  initShopButtons();
  initBattleModalControls();
  initClassSelectionControls();
  initInventoryControls();
  initCompareModalControls();
  initSettingsModal();
  initSkillPointModal();
  document.getElementById("open-sp-btn").addEventListener("click", openSkillPointModal);
});

// ── TAB NAVIGATION ──
function initTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => { b.classList.remove("active"); b.setAttribute("aria-selected","false"); });
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      btn.setAttribute("aria-selected","true");
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add("active");
      if (typeof playSound === "function") playSound("button");
    });
  });
}

// ── INNER SHOP TABS ──
function initShopTabs() {
  document.querySelectorAll(".shop-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".shop-tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".shop-tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      const panel = document.getElementById(`shop-${btn.dataset.shopTab}-panel`);
      if (panel) panel.classList.add("active");
    });
  });
}

// ── CLASS SELECTION ──
function initClassSelectionControls() {
  document.querySelectorAll(".select-class-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const className = e.currentTarget.dataset.class;
      const nameInput = document.getElementById("hero-name-input");
      const heroName = nameInput ? nameInput.value.trim() : "";
      selectClass(className, heroName);
    });
  });
}

// ── INVENTORY CONTROLS ──
function initInventoryControls() {
  const list = document.getElementById("inventory-list");
  if (!list) return;
  list.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-equip")) {
      equipItemFromInventory(e.target.dataset.item, parseInt(e.target.dataset.index));
    } else if (e.target.classList.contains("btn-sell")) {
      sellItemFromInventory(e.target.dataset.item, parseInt(e.target.dataset.index));
    }
  });
}

// ── COMPARE MODAL ──
function initCompareModalControls() {
  const closeBtn = document.getElementById("close-compare-modal-btn");
  if (closeBtn) closeBtn.addEventListener("click", closeCompareModal);

  const discardBtn = document.getElementById("discard-loot-btn");
  if (discardBtn) discardBtn.addEventListener("click", () => {
    if (pendingLoot) { addLootToInventory(pendingLoot); pendingLoot = null; }
    closeCompareModal();
  });

  const equipBtn = document.getElementById("equip-loot-btn");
  if (equipBtn) equipBtn.addEventListener("click", () => {
    if (pendingLoot) { equipLootImmediately(pendingLoot); pendingLoot = null; }
    closeCompareModal();
  });
}

function closeCompareModal() {
  document.getElementById("compare-modal").classList.remove("active");
}

// ── SETTINGS ──
function initSettingsModal() {
  const settingsBtn = document.getElementById("settings-btn");
  const closeBtn1   = document.getElementById("close-settings-btn");
  const closeBtn2   = document.getElementById("close-settings-footer-btn");
  const resetBtn    = document.getElementById("reset-game-btn");
  const newCharBtn  = document.getElementById("new-char-btn");
  const soundToggle = document.getElementById("sound-toggle");
  const autoToggle  = document.getElementById("auto-equip-toggle");
  const modal       = document.getElementById("settings-modal");

  if (settingsBtn) settingsBtn.addEventListener("click", () => modal.classList.add("active"));
  if (closeBtn1)   closeBtn1.addEventListener("click", () => modal.classList.remove("active"));
  if (closeBtn2)   closeBtn2.addEventListener("click", () => modal.classList.remove("active"));
  if (resetBtn)    resetBtn.addEventListener("click", () => {
    if (confirm("Reset all progress? This cannot be undone.")) {
      window.resetGame();
      modal.classList.remove("active");
    }
  });
  if (newCharBtn) newCharBtn.addEventListener("click", () => {
    if (confirm("Start a new character? Your current hero will be lost.")) {
      window.newCharacter();
      modal.classList.remove("active");
    }
  });
  if (soundToggle) {
    soundToggle.checked = gameSettings.sound;
    soundToggle.addEventListener("change", () => {
      gameSettings.sound = soundToggle.checked;
      if (typeof window.setSoundEnabled === "function") window.setSoundEnabled(gameSettings.sound);
      saveSettings();
    });
  }
  if (autoToggle) {
    autoToggle.checked = gameSettings.autoEquip;
    autoToggle.addEventListener("change", () => {
      gameSettings.autoEquip = autoToggle.checked;
      saveSettings();
    });
  }
}

function loadSettings() {
  const saved = localStorage.getItem("ember_keep_settings");
  if (saved) {
    try { gameSettings = { ...gameSettings, ...JSON.parse(saved) }; } catch(e) {}
  }
  if (typeof window.setSoundEnabled === "function") window.setSoundEnabled(gameSettings.sound);
}
function saveSettings() {
  localStorage.setItem("ember_keep_settings", JSON.stringify(gameSettings));
}

// ================================================================
// STATE MANAGEMENT
// ================================================================
function getMaxStamina(level) { return 100 + (level - 1) * 10; }

const STAMINA_REGEN_MS = 10000; // 1 stamina per 10s

function loadPlayerState() {
  const saved = localStorage.getItem("rpg_player_state");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Deep merge — preserve nested objects
      playerState = {
        ...DEFAULT_PLAYER_STATE,
        ...parsed,
        stats:     { ...DEFAULT_PLAYER_STATE.stats,     ...(parsed.stats || {}) },
        upgrades:  { ...DEFAULT_PLAYER_STATE.upgrades,  ...(parsed.upgrades || {}) },
        equipment: { ...DEFAULT_PLAYER_STATE.equipment, ...(parsed.equipment || {}) },
      };
    } catch(e) {
      playerState = JSON.parse(JSON.stringify(DEFAULT_PLAYER_STATE));
    }
  } else {
    playerState = JSON.parse(JSON.stringify(DEFAULT_PLAYER_STATE));
  }
  if (!playerState.completedSideZones) playerState.completedSideZones = [];
  if (!playerState.maxMana) playerState.maxMana = CLASS_PRESETS[playerState.class]?.mana || 50;

  if (playerState.class) {
    recoverOfflineStamina();
    startStaminaTicker();
  }
  checkClassSelection();
}

function savePlayerState() {
  localStorage.setItem("rpg_player_state", JSON.stringify(playerState));
  window.dispatchEvent(new CustomEvent("playerStateUpdated", { detail: playerState }));
}

function recoverOfflineStamina() {
  const now = Date.now();
  const elapsed = now - (playerState.lastStaminaUpdate || now);
  const maxStam = getMaxStamina(playerState.level);
  if (playerState.stamina < maxStam && elapsed > 0) {
    const recovered = Math.floor(elapsed / STAMINA_REGEN_MS);
    if (recovered > 0) {
      playerState.stamina = Math.min(maxStam, playerState.stamina + recovered);
      playerState.lastStaminaUpdate += recovered * STAMINA_REGEN_MS;
      savePlayerState();
    }
  }
}

function startStaminaTicker() {
  if (staminaInterval) clearInterval(staminaInterval);
  staminaInterval = setInterval(() => {
    if (!playerState.class) return;
    const maxStam = getMaxStamina(playerState.level);
    if (playerState.stamina < maxStam) {
      playerState.stamina++;
      playerState.lastStaminaUpdate = Date.now();
      savePlayerState();
      renderStats();
    }
  }, STAMINA_REGEN_MS);
}

// ── Effective stats (base + upgrades + equipment) ──
function getEffectiveStats() {
  let extraPower = 0, extraDefense = 0, extraCrit = 0, extraDodge = 0;

  const w = ALL_ITEMS[playerState.equipment.weapon];
  const a = ALL_ITEMS[playerState.equipment.armor];
  const r = ALL_ITEMS[playerState.equipment.ring];

  if (w) extraPower   += w.value;
  if (a) extraDefense += a.value;
  if (r) {
    if (r.stat === "power")       extraPower   += r.value;
    if (r.stat === "defense")     extraDefense += r.value;
    if (r.stat === "critChance")  extraCrit    += r.value;
    if (r.stat === "dodgeChance") extraDodge   += r.value;
  }
  return {
    maxHp:      playerState.stats.maxHp,
    power:      playerState.stats.power   + extraPower,
    defense:    playerState.stats.defense + extraDefense,
    critChance: (playerState.stats.critChance  || 0.05) + extraCrit,
    critDamage: playerState.stats.critDamage  || 1.5,
    dodgeChance:(playerState.stats.dodgeChance || 0.05) + extraDodge,
  };
}

function getPlayerPowerRating(state) {
  if (!state?.stats) return 0;
  let pwr = state.stats.power, def = state.stats.defense, hp = state.stats.maxHp;
  const w = ALL_ITEMS[state.equipment?.weapon];
  const a = ALL_ITEMS[state.equipment?.armor];
  const r = ALL_ITEMS[state.equipment?.ring];
  if (w) pwr += w.value;
  if (a) def += a.value;
  if (r) {
    if (r.stat === "power")   pwr += r.value;
    if (r.stat === "defense") def += r.value;
  }
  return Math.round(pwr * 2 + def * 1.5 + hp * 0.1);
}

// ================================================================
// CLASS SELECTION
// ================================================================
function checkClassSelection() {
  const modal = document.getElementById("class-selection-modal");
  if (!modal) return;
  if (!playerState.class) {
    modal.classList.add("active");
  } else {
    modal.classList.remove("active");
  }
}

function selectClass(className, heroName) {
  const preset = CLASS_PRESETS[className];
  if (!preset) return;

  playerState.class    = className;
  playerState.name     = heroName || className + " Hero";
  playerState.stats    = { ...preset.stats };
  playerState.maxMana  = preset.mana;
  playerState.stamina  = 100;
  playerState.lastStaminaUpdate = Date.now();
  playerState.equipment = { weapon:null, armor:null, ring:null };
  playerState.inventory = [];

  savePlayerState();
  startStaminaTicker();
  checkClassSelection();
  renderMap();
  renderStats();
  renderShop();
  renderInventory();
  renderSkills();
  showToast(`⚜️ Welcome, ${playerState.name} the ${className}!`, "success");
  if (typeof playSound === "function") playSound("level_up");
}

// ================================================================
// RENDERING
// ================================================================

// ── MAP ──
function renderMap() {
  const wrapper = document.getElementById("map-wrapper");
  if (!wrapper) return;
  wrapper.innerHTML = "";

  // Group levels by act
  ACTS.forEach(act => {
    const actLevels = LEVELS.filter(l => l.act === act.id);

    const section = document.createElement("div");
    section.className = "act-section";
    section.dataset.act = act.id;

    // Act header
    const header = document.createElement("div");
    header.className = "act-header";
    header.innerHTML = `<span>${act.id === 1 ? "🌲" : act.id === 2 ? "❄️" : "🔥"}</span>
                        <span>${act.name}</span>
                        <span style="font-family:Inter;font-size:0.65rem;opacity:0.7;">${act.theme}</span>`;
    section.appendChild(header);

    // Horizontal levels row
    const row = document.createElement("div");
    row.className = "act-levels-row";

    actLevels.forEach((level, idx) => {
      const node = createLevelNode(level);
      row.appendChild(node);

      // Add connector between nodes (except last)
      if (idx < actLevels.length - 1) {
        const conn = document.createElement("div");
        const isCompleted = level.id < playerState.unlockedLevel;
        conn.className = "level-connector" + (isCompleted ? " done" : "");
        row.appendChild(conn);
      }
    });

    section.appendChild(row);

    // Optional side zones after certain levels (insert between acts)
    const forkZones = SIDE_ZONES.filter(sz => sz.afterLevel === actLevels[actLevels.length - 1].id);
    if (forkZones.length > 0) {
      const fork = createSideFork(forkZones);
      section.appendChild(fork);
    }

    wrapper.appendChild(section);
  });
}

function createLevelNode(level) {
  const node = document.createElement("div");
  node.className = "level-node";
  if (level.isBoss || level.isMidBoss) node.classList.add("boss-node");
  node.id = `level-node-${level.id}`;

  // Determine state
  const isCompleted = level.id < playerState.unlockedLevel;
  const isUnlocked  = level.id === playerState.unlockedLevel;
  const isLocked    = level.id > playerState.unlockedLevel;

  if (isCompleted) node.classList.add("completed");
  else if (isUnlocked) node.classList.add("unlocked");
  else node.classList.add("locked");

  const staminaCost = getStaminaCost(level);

  node.innerHTML = `
    <span class="level-num">${isCompleted ? "⭐" : level.id}</span>
    <span class="level-icon">${level.isBoss ? "👑" : level.isMidBoss ? "⚠️" : ""}</span>
    <span class="level-name">${level.name}</span>
    <span class="level-cost">⚡${staminaCost}</span>
  `;

  node.addEventListener("click", () => {
    if (!isLocked) {
      openBattleModal(level);
    } else {
      showToast("🔒 Complete the previous level to unlock this one.", "error");
    }
  });

  return node;
}

function createSideFork(zones) {
  const fork = document.createElement("div");
  fork.className = "side-fork-section";

  const label = document.createElement("div");
  label.className = "side-fork-label";
  label.textContent = "⚡ Optional Side Challenges";
  fork.appendChild(label);

  const nodesDiv = document.createElement("div");
  nodesDiv.className = "side-fork-nodes";

  zones.forEach(zone => {
    const isCompleted = playerState.completedSideZones.includes(zone.id);
    const isAvailable = playerState.unlockedLevel > zone.afterLevel;

    const node = document.createElement("div");
    node.className = `side-zone-node ${zone.zoneType}-type`;
    if (isCompleted) node.classList.add("completed");
    if (!isAvailable) node.classList.add("locked");

    node.innerHTML = `
      <span class="side-zone-avatar">${zone.avatar}</span>
      <div class="side-zone-info">
        <div class="side-zone-name">${zone.name} ${isCompleted ? "✅" : ""}</div>
        <span class="side-zone-tag ${zone.zoneType}">${zone.label}</span>
        <div class="side-zone-cost">⚡${zone.staminaCost} · Suggested: ${formatNumber(zone.suggested)} PR</div>
      </div>
    `;

    node.addEventListener("click", () => {
      if (isAvailable) {
        openBattleModal(zone);
      } else {
        showToast(`🔒 Complete Level ${zone.afterLevel} to unlock this.`, "error");
      }
    });

    nodesDiv.appendChild(node);
  });

  fork.appendChild(nodesDiv);
  return fork;
}

// ── STATS ──
function renderStats() {
  if (!playerState.class) return;
  const effStats = getEffectiveStats();
  const maxStam  = getMaxStamina(playerState.level);
  const pr       = getPlayerPowerRating(playerState);

  // Header
  _setText("header-level", playerState.level);
  _setText("header-gold",  playerState.gold);
  _setText("header-stamina", `${playerState.stamina}/${maxStam}`);

  // Character panel
  _setText("char-name",           playerState.name || "Hero");
  _setText("char-class-display",  playerState.class);
  _setText("char-level",          playerState.level);
  _setText("char-xp-text",        `${playerState.xp}/${playerState.xpNeeded}`);
  _setText("char-stamina-text",   `${playerState.stamina}/${maxStam}`);
  _setText("char-mana-text",      `${playerState.maxMana}/${playerState.maxMana}`);
  _setText("char-power-rating",   pr);

  // Progress bars
  _setWidth("char-xp-fill",      (playerState.xp / playerState.xpNeeded) * 100);
  _setWidth("char-stamina-fill", (playerState.stamina / maxStam) * 100);
  _setWidth("char-mana-fill",    100);

  // Avatar
  const preset = CLASS_PRESETS[playerState.class];
  if (preset) renderAvatar("char-avatar-container", preset.image, preset.avatar);

  // Stats
  _setText("stat-hp",      `${effStats.maxHp}/${effStats.maxHp}`);
  _setText("stat-power",   `${effStats.power} (+${effStats.power - playerState.stats.power})`);
  _setText("stat-defense", `${effStats.defense} (+${effStats.defense - playerState.stats.defense})`);
  _setText("stat-crit",    `${Math.round(effStats.critChance * 100)}%`);
  _setText("stat-dodge",   `${Math.round(effStats.dodgeChance * 100)}%`);

  // Upgrade costs
  const hpCost  = 10 + playerState.upgrades.hpLevel * 15;
  const pwrCost = 10 + playerState.upgrades.powerLevel * 15;
  const defCost = 10 + playerState.upgrades.defenseLevel * 15;
  _setText("cost-hp",      `${hpCost}g`);
  _setText("cost-power",   `${pwrCost}g`);
  _setText("cost-defense", `${defCost}g`);
  _setDisabled("upgrade-hp-btn",      playerState.gold < hpCost);
  _setDisabled("upgrade-power-btn",   playerState.gold < pwrCost);
  _setDisabled("upgrade-defense-btn", playerState.gold < defCost);

  // Equipped gear display
  const wItem = ALL_ITEMS[playerState.equipment.weapon];
  const aItem = ALL_ITEMS[playerState.equipment.armor];
  const rItem = ALL_ITEMS[playerState.equipment.ring];
  _setText("equipped-weapon-name", wItem ? wItem.name : "None");
  _setText("equipped-armor-name",  aItem ? aItem.name : "None");
  _setText("equipped-ring-name",   rItem ? rItem.name : "None");

  // Skill point badge
  const spBadge = document.getElementById("sp-count-badge");
  const spBtn   = document.getElementById("open-sp-btn");
  if (spBadge) spBadge.textContent = playerState.skillPoints || 0;
  if (spBtn)   spBtn.style.display = playerState.skillPoints > 0 ? "inline-flex" : "none";
}

// ── SHOP ──
function renderShop() {
  if (!playerState.class) return;

  const weaponsCont = document.getElementById("shop-weapons-container");
  const armorCont   = document.getElementById("shop-armor-container");
  const ringsCont   = document.getElementById("shop-rings-container");
  if (!weaponsCont || !armorCont || !ringsCont) return;

  weaponsCont.innerHTML = "";
  armorCont.innerHTML   = "";
  ringsCont.innerHTML   = "";

  // Class-specific weapons and armor
  Object.values(CLASS_ITEMS).forEach(item => {
    if (item.class !== playerState.class) return;
    const el = createShopItemEl(item);
    if (item.type === "weapon") weaponsCont.appendChild(el);
    else armorCont.appendChild(el);
  });

  // Universal rings
  Object.values(RING_ITEMS).forEach(item => {
    ringsCont.appendChild(createShopItemEl(item));
  });
}

function createShopItemEl(item) {
  const isWeaponEquipped = playerState.equipment.weapon === item.id;
  const isArmorEquipped  = playerState.equipment.armor  === item.id;
  const isRingEquipped   = playerState.equipment.ring   === item.id;
  const isEquipped = isWeaponEquipped || isArmorEquipped || isRingEquipped;
  const isOwned    = isEquipped || playerState.inventory.some(i => i.id === item.id);

  const tierLabels = ["","★","★★","★★★","★★★★","★★★★★"];
  const statLabel = item.stat === "power" ? "Power" : item.stat === "defense" ? "Defense" :
                    item.stat === "critChance" ? "Crit" : "Dodge";
  const statValue = item.stat.includes("Chance") ? `+${Math.round(item.value * 100)}%` : `+${item.value}`;

  const el = document.createElement("div");
  el.className = "shop-item";
  el.id = `item-${item.id}`;
  el.innerHTML = `
    <div class="item-icon">${item.icon}</div>
    <div class="item-details">
      <h5>${item.name}</h5>
      <p>${statLabel} ${statValue}</p>
      <span class="item-tier" style="color:var(--gold);font-size:0.65rem;">${tierLabels[item.tier] || ""} Tier ${item.tier}</span>
    </div>
    <button class="btn-buy ${isEquipped ? "equipped" : ""}"
            data-item="${item.id}"
            ${isEquipped ? "disabled" : ""}
            ${(!isEquipped && isOwned) ? "disabled" : ""}
            ${(!isOwned && playerState.gold < item.cost) ? "disabled" : ""}>
      ${isEquipped ? "Equipped" : isOwned ? "Owned" : `Buy <span class="cost">${formatNumber(item.cost)}g</span>`}
    </button>
  `;
  return el;
}

// ── SKILLS ──
function renderSkills() {
  const list = document.getElementById("char-skills-list");
  if (!list || !playerState.class) {
    if (list) list.innerHTML = `<p class="empty-message">Select a class to see skills.</p>`;
    return;
  }
  list.innerHTML = "";
  const classSkills = Object.values(SKILLS).filter(s => s.class === playerState.class);

  classSkills.forEach(skill => {
    const unlocked = playerState.level >= skill.unlockLevel;
    const el = document.createElement("div");
    el.className = "skill-item" + (unlocked ? "" : " locked-skill");
    el.innerHTML = `
      <span class="skill-item-icon">${skill.icon}</span>
      <div class="skill-item-info">
        <div class="skill-item-name">${skill.name}</div>
        <div class="skill-item-desc">${skill.desc}</div>
      </div>
      ${unlocked
        ? `<span class="skill-item-cost">${skill.manaCost}🔮</span>`
        : `<span class="skill-item-lock">🔒 Level ${skill.unlockLevel}</span>`}
    `;
    list.appendChild(el);
  });
}

// ── INVENTORY ──
function renderInventory() {
  const list = document.getElementById("inventory-list");
  if (!list) return;
  list.innerHTML = "";

  if (!playerState.inventory?.length) {
    list.innerHTML = `<p class="empty-message">Your inventory is empty.</p>`;
    return;
  }

  playerState.inventory.forEach((inv, idx) => {
    const item = ALL_ITEMS[inv.id];
    if (!item) return;
    const statLabel = item.stat === "power" ? "Power" : item.stat === "defense" ? "Defense" :
                      item.stat === "critChance" ? "Crit Chance" : "Dodge Chance";
    const statValue = item.stat.includes("Chance") ? `+${Math.round(item.value * 100)}%` : `+${item.value}`;
    const el = document.createElement("div");
    el.className = "inventory-item";
    el.innerHTML = `
      <div class="item-icon">${item.icon}</div>
      <div class="item-details"><h5>${item.name}</h5><p>${statLabel} ${statValue}</p></div>
      <div class="inventory-item-actions">
        <button class="btn-upgrade btn-equip" data-item="${item.id}" data-index="${idx}">Equip</button>
        <button class="btn-sell" data-item="${item.id}" data-index="${idx}">Sell ${Math.round(item.cost * 0.5)}g</button>
      </div>
    `;
    list.appendChild(el);
  });
}

// ── AVATAR ──
function renderAvatar(containerId, imageSrc, emojiAlt) {
  const c = document.getElementById(containerId);
  if (!c) return;
  if (imageSrc) {
    c.innerHTML = `
      <img src="${imageSrc}" alt="${emojiAlt}"
           style="width:1.5em;height:1.5em;object-fit:contain;vertical-align:middle;"
           onload="this.style.display='inline-block';this.nextElementSibling.style.display='none';"
           onerror="this.style.display='none';this.nextElementSibling.style.display='inline';">
      <span>${emojiAlt}</span>`;
  } else {
    c.innerHTML = `<span>${emojiAlt}</span>`;
  }
}

// ================================================================
// UPGRADES
// ================================================================
function initUpgradeButtons() {
  document.getElementById("upgrade-hp-btn").addEventListener("click", () => {
    const cost = 10 + playerState.upgrades.hpLevel * 15;
    if (playerState.gold >= cost) {
      playerState.gold -= cost;
      playerState.stats.maxHp += 10;
      playerState.upgrades.hpLevel++;
      savePlayerState(); renderStats(); renderShop();
      showToast("❤️ HP upgraded!", "success");
      if (typeof playSound === "function") playSound("purchase");
    }
  });
  document.getElementById("upgrade-power-btn").addEventListener("click", () => {
    const cost = 10 + playerState.upgrades.powerLevel * 15;
    if (playerState.gold >= cost) {
      playerState.gold -= cost;
      playerState.stats.power += 2;
      playerState.upgrades.powerLevel++;
      savePlayerState(); renderStats(); renderShop();
      showToast("⚔️ Power upgraded!", "success");
      if (typeof playSound === "function") playSound("purchase");
    }
  });
  document.getElementById("upgrade-defense-btn").addEventListener("click", () => {
    const cost = 10 + playerState.upgrades.defenseLevel * 15;
    if (playerState.gold >= cost) {
      playerState.gold -= cost;
      playerState.stats.defense += 1;
      playerState.upgrades.defenseLevel++;
      savePlayerState(); renderStats(); renderShop();
      showToast("🛡️ Defense upgraded!", "success");
      if (typeof playSound === "function") playSound("purchase");
    }
  });
}

// ================================================================
// SHOP
// ================================================================
function initShopButtons() {
  const handleBuy = (e) => {
    const btn = e.target.closest(".btn-buy");
    if (btn && !btn.disabled) buyItem(btn.dataset.item);
  };
  ["shop-weapons-container","shop-armor-container","shop-rings-container"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", handleBuy);
  });
}

function buyItem(itemId) {
  const item = ALL_ITEMS[itemId];
  if (!item) return;
  const isOwned = playerState.equipment.weapon === itemId ||
                  playerState.equipment.armor   === itemId ||
                  playerState.equipment.ring    === itemId ||
                  playerState.inventory.some(i => i.id === itemId);
  if (isOwned) { showToast("You already own this item!", "error"); return; }
  if (playerState.gold < item.cost) { showToast("Not enough gold!", "error"); return; }

  playerState.gold -= item.cost;
  equipItem(itemId);
  showToast(`✅ Purchased & equipped ${item.name}!`, "success");
  if (typeof playSound === "function") playSound("purchase");
}

function equipItem(itemId) {
  const item = ALL_ITEMS[itemId];
  if (!item) return;
  let oldId = null;
  if (item.type === "weapon") { oldId = playerState.equipment.weapon; playerState.equipment.weapon = itemId; }
  else if (item.type === "armor")  { oldId = playerState.equipment.armor;  playerState.equipment.armor  = itemId; }
  else if (item.type === "ring")   { oldId = playerState.equipment.ring;   playerState.equipment.ring   = itemId; }

  if (oldId) playerState.inventory.push({ id: oldId });
  const invIdx = playerState.inventory.findIndex(i => i.id === itemId);
  if (invIdx > -1) playerState.inventory.splice(invIdx, 1);

  savePlayerState(); renderStats(); renderShop(); renderInventory();
}

function equipItemFromInventory(itemId) {
  equipItem(itemId);
  showToast(`✅ Equipped ${ALL_ITEMS[itemId]?.name}!`, "success");
}

function sellItemFromInventory(itemId, index) {
  const item = ALL_ITEMS[itemId];
  if (!item) return;
  const price = Math.round(item.cost * 0.5);
  playerState.gold += price;
  playerState.inventory.splice(index, 1);
  savePlayerState(); renderStats(); renderShop(); renderInventory();
  showToast(`💰 Sold ${item.name} for ${price}g!`, "success");
}

// ================================================================
// SKILL POINT ALLOCATION
// ================================================================
function initSkillPointModal() {
  const cancelBtn = document.getElementById("cancel-sp-btn");
  if (cancelBtn) cancelBtn.addEventListener("click", () => {
    document.getElementById("skill-point-modal").classList.remove("active");
  });
}

function openSkillPointModal() {
  const available = playerState.skillPoints || 0;
  if (available <= 0) return;

  const modal       = document.getElementById("skill-point-modal");
  const availableEl = document.getElementById("sp-available");
  const optionsEl   = document.getElementById("sp-options");
  const confirmBtn  = document.getElementById("confirm-sp-btn");

  if (!modal) return;
  if (availableEl) availableEl.textContent = available;

  // Allocation state
  const allocations = {};
  SP_OPTIONS.forEach(o => allocations[o.id] = 0);
  let remaining = available;

  // Render options
  optionsEl.innerHTML = "";
  SP_OPTIONS.forEach(opt => {
    const card = document.createElement("div");
    card.className = "sp-option-card";
    card.innerHTML = `
      <div class="sp-option-info">
        <div class="sp-option-label">${opt.label}</div>
        <div class="sp-option-desc">${opt.desc}</div>
      </div>
      <div class="sp-option-controls">
        <button class="sp-btn sp-minus" data-opt="${opt.id}" disabled>−</button>
        <span class="sp-count" id="sp-count-${opt.id}">0</span>
        <button class="sp-btn sp-plus" data-opt="${opt.id}">+</button>
      </div>`;
    optionsEl.appendChild(card);
  });

  function refresh() {
    if (availableEl) availableEl.textContent = remaining;
    SP_OPTIONS.forEach(opt => {
      const countEl = document.getElementById(`sp-count-${opt.id}`);
      if (countEl) countEl.textContent = allocations[opt.id];
      const minus = optionsEl.querySelector(`.sp-minus[data-opt="${opt.id}"]`);
      const plus  = optionsEl.querySelector(`.sp-plus[data-opt="${opt.id}"]`);
      if (minus) minus.disabled = allocations[opt.id] === 0;
      if (plus)  plus.disabled  = remaining === 0;
    });
    if (confirmBtn) confirmBtn.disabled = remaining === available; // must spend at least 1
  }

  optionsEl.addEventListener("click", (e) => {
    const plus  = e.target.closest(".sp-plus");
    const minus = e.target.closest(".sp-minus");
    if (plus && remaining > 0) { allocations[plus.dataset.opt]++; remaining--; refresh(); }
    if (minus && allocations[minus.dataset.opt] > 0) { allocations[minus.dataset.opt]--; remaining++; refresh(); }
  });

  if (confirmBtn) {
    confirmBtn.onclick = () => {
      SP_OPTIONS.forEach(opt => {
        if (allocations[opt.id] <= 0) return;
        if (opt.statKey === "top") {
          playerState[opt.stat] = (playerState[opt.stat] || 0) + opt.amount * allocations[opt.id];
        } else {
          playerState.stats[opt.stat] = (playerState.stats[opt.stat] || 0) + opt.amount * allocations[opt.id];
        }
      });
      playerState.skillPoints -= (available - remaining);
      savePlayerState(); renderStats(); renderSkills();
      modal.classList.remove("active");
      showToast("✨ Skill points allocated!", "success");
    };
  }

  refresh();
  modal.classList.add("active");
}

// ================================================================
// BATTLE SYSTEM
// ================================================================
function getStaminaCost(level) {
  if (level.staminaCost !== undefined) return level.staminaCost;
  return 5 + (level.id - 1) * 2;
}

function openBattleModal(level) {
  currentBattleLevel = level;
  const modal = document.getElementById("battle-modal");
  modal.classList.add("active");

  const staminaCost = getStaminaCost(level);
  const effStats    = getEffectiveStats();
  const playerPR    = getPlayerPowerRating(playerState);

  _setText("battle-title",      `${typeof level.id === "number" ? "Level " + level.id + ": " : ""}${level.name}`);
  _setText("enemy-name",        level.name);
  _setText("suggested-power-val",formatNumber(level.suggested || 0));
  _setText("player-power-val",  playerPR);
  _setText("battle-stamina-cost",staminaCost);
  _setText("battle-player-name",playerState.name || "Hero");

  // Matchup status
  const matchEl = document.getElementById("power-matchup-status");
  if (matchEl) {
    matchEl.className = "matchup-badge " + (playerPR >= (level.suggested || 0) ? "good" : "bad");
    matchEl.textContent = playerPR >= (level.suggested || 0) ? "✅ Ready" : "⚠️ Underpowered";
  }

  // Player HP bar
  _setWidth("player-hp-bar", 100);
  _setText("player-hp-text", `${effStats.maxHp}/${effStats.maxHp}`);

  // Battle mana
  const preset = CLASS_PRESETS[playerState.class];
  const manaMax = playerState.maxMana || preset?.mana || 50;
  _setWidth("battle-mana-bar", 100);
  _setText("battle-mana-text", `${manaMax}/${manaMax}`);

  // Enemy HP
  _setWidth("enemy-hp-bar", 100);
  _setText("enemy-hp-text", `${formatNumber(level.hp)}/${formatNumber(level.hp)}`);

  // Avatars
  if (preset) renderAvatar("battle-player-avatar", preset.image, preset.avatar);
  renderAvatar("enemy-avatar", null, level.avatar || "👾");

  // Render skill bar
  renderSkillBar();

  // Reset log
  document.getElementById("battle-log").innerHTML = `<p class="system-message">Press "Start Battle" to challenge ${level.name}!</p>`;

  // Buttons
  _show("start-battle-btn");
  _hide("rematch-battle-btn");
  _hide("close-battle-btn");
  _show("close-battle-modal-btn");

  document.getElementById("start-battle-btn").onclick = () => startBattleSimulation(level);

  const rematchBtn = document.getElementById("rematch-battle-btn");
  if (rematchBtn) rematchBtn.onclick = () => {
    const eff = getEffectiveStats();
    const pMax = playerState.maxMana || preset?.mana || 50;
    _setWidth("player-hp-bar", 100);
    _setText("player-hp-text", `${eff.maxHp}/${eff.maxHp}`);
    _setWidth("enemy-hp-bar", 100);
    _setText("enemy-hp-text", `${formatNumber(level.hp)}/${formatNumber(level.hp)}`);
    _setWidth("battle-mana-bar", 100);
    _setText("battle-mana-text", `${pMax}/${pMax}`);
    document.getElementById("battle-log").innerHTML = `<p class="system-message">Rematch starting!</p>`;
    startBattleSimulation(level);
  };
}

function closeBattleModal() {
  if (activeBattleInterval) { clearInterval(activeBattleInterval); activeBattleInterval = null; }
  document.getElementById("battle-modal").classList.remove("active");
}

function initBattleModalControls() {
  document.getElementById("close-battle-modal-btn").addEventListener("click", closeBattleModal);
  document.getElementById("close-battle-btn").addEventListener("click", closeBattleModal);
}

// ── SKILL BAR RENDERING ──
function renderSkillBar() {
  const bar = document.getElementById("skill-bar");
  if (!bar || !playerState.class) return;
  bar.innerHTML = "";

  const classSkills = Object.values(SKILLS).filter(s => s.class === playerState.class);
  if (classSkills.length === 0) {
    bar.innerHTML = `<span style="font-size:0.75rem;color:var(--text-muted);">No skills yet — level up to unlock!</span>`;
    return;
  }

  classSkills.forEach((skill, i) => {
    const unlocked = playerState.level >= skill.unlockLevel;
    const btn = document.createElement("button");
    btn.className = "skill-btn" + (unlocked ? "" : " skill-btn--locked");
    btn.id = `skill-btn-${i}`;
    btn.disabled = !unlocked;
    btn.title = skill.desc;
    btn.innerHTML = `
      <span class="skill-btn-icon">${skill.icon}</span>
      <span class="skill-btn-name">${skill.name}</span>
      <span class="skill-cooldown" id="skill-cd-${i}">${unlocked ? skill.manaCost + "🔮" : "Lv " + skill.unlockLevel}</span>`;
    btn.addEventListener("click", () => handleSkillActivation(skill.id, i));
    bar.appendChild(btn);
  });
}

function updateSkillBar() {
  const classSkills = Object.values(SKILLS).filter(s => s.class === playerState.class);
  classSkills.forEach((skill, i) => {
    const btn = document.getElementById(`skill-btn-${i}`);
    const cdEl = document.getElementById(`skill-cd-${i}`);
    if (!btn) return;
    const unlocked    = playerState.level >= skill.unlockLevel;
    const onCooldown  = (skillCooldowns[skill.id] || 0) > 0;
    const hasMana     = currentBattleMana >= skill.manaCost;
    const inBattle    = !!activeBattleInterval;
    btn.disabled = !unlocked || onCooldown || !hasMana || !inBattle;
    if (cdEl) {
      if (!unlocked)   cdEl.textContent = `Lv ${skill.unlockLevel}`;
      else if (onCooldown) cdEl.textContent = `${skillCooldowns[skill.id]}⏱`;
      else             cdEl.textContent = `${skill.manaCost}🔮`;
    }
  });
}

function handleSkillActivation(skillId, btnIndex) {
  const skill = SKILLS[skillId];
  if (!skill || !activeBattleInterval) return;
  if ((skillCooldowns[skillId] || 0) > 0) {
    showToast(`${skill.name} is on cooldown! (${skillCooldowns[skillId]} rounds)`, "error"); return;
  }
  if (currentBattleMana < skill.manaCost) {
    showToast(`Not enough mana for ${skill.name}!`, "error"); return;
  }

  currentBattleMana -= skill.manaCost;
  skillCooldowns[skillId] = skill.cooldown;
  const effStats = getEffectiveStats();

  switch(skill.effect) {
    case "shieldWall":
      battleEffects.blockNextHit = true;
      appendBattleLog(`🛡️ [${skill.name}] Shield Wall raised! Next hit blocked!`, "skill-activation"); break;
    case "powerBoost":
      battleEffects.powerBoostMult = 1.6;
      battleEffects.powerBoostRounds = 3;
      appendBattleLog(`⚔️ [${skill.name}] Power boosted by 60% for 3 rounds!`, "skill-activation"); break;
    case "whirlwind": {
      const dmg = Math.round(effStats.power * 3);
      battleEnemyHp = Math.max(0, battleEnemyHp - dmg);
      updateEnemyHpUI();
      appendBattleLog(`🌀 [${skill.name}] ${dmg} damage ignoring defense!`, "combat-player-crit");
      if (battleEnemyHp <= 0) { handleBattleVictory(currentBattleLevel); return; }
      break;
    }
    case "poison":
      battleEffects.poisonDamage = Math.round(effStats.power * 0.25);
      battleEffects.poisonRounds = 4;
      appendBattleLog(`🏹 [${skill.name}] Poisoned! ${battleEffects.poisonDamage}/round for 4 rounds!`, "skill-activation"); break;
    case "eagleEye":
      battleEffects.eagleEyeHits = 2;
      appendBattleLog(`🦅 [${skill.name}] Eagle Eye! Next 2 attacks guaranteed crits!`, "skill-activation"); break;
    case "rainOfArrows":
      battleEffects.rainOfArrowsHits = 4;
      appendBattleLog(`🌧️ [${skill.name}] Rain of Arrows! 4 hits incoming!`, "skill-activation"); break;
    case "frostNova": {
      const burstDmg = Math.round(effStats.power * 0.4);
      battleEffects.stunRounds = 1;
      battleEnemyHp = Math.max(0, battleEnemyHp - burstDmg);
      updateEnemyHpUI();
      appendBattleLog(`❄️ [${skill.name}] ${burstDmg} burst damage + enemy frozen 1 round!`, "combat-player-crit");
      if (battleEnemyHp <= 0) { handleBattleVictory(currentBattleLevel); return; }
      break;
    }
    case "arcaneSurge": {
      const surgeDmg = Math.round(effStats.power * 2.5);
      battleEnemyHp = Math.max(0, battleEnemyHp - surgeDmg);
      updateEnemyHpUI();
      appendBattleLog(`✨ [${skill.name}] ${surgeDmg} pure magic damage!`, "combat-player-crit");
      if (battleEnemyHp <= 0) { handleBattleVictory(currentBattleLevel); return; }
      break;
    }
    case "manaShield":
      battleEffects.manaShieldAbsorb = Math.round(effStats.maxHp * 0.6);
      battleEffects.manaShieldRounds = 3;
      appendBattleLog(`💜 [${skill.name}] Absorbing up to ${battleEffects.manaShieldAbsorb} damage for 3 rounds!`, "skill-activation"); break;
    case "holyLight": {
      const healAmt = Math.round(effStats.maxHp * 0.25);
      battlePlayerHp = Math.min(battlePlayerMaxHp, battlePlayerHp + healAmt);
      updatePlayerHpUI();
      appendBattleLog(`✝️ [${skill.name}] Healed for ${healAmt} HP!`, "combat-victory"); break;
    }
    case "divineShield":
      battleEffects.divineShieldRounds = 2;
      appendBattleLog(`🛡️ [${skill.name}] Divine Shield! All damage blocked for 2 rounds!`, "skill-activation"); break;
    case "consecration":
      battleEffects.consecrationDamage = Math.round(effStats.power * 2);
      battleEffects.consecrationRounds = 2;
      appendBattleLog(`☀️ [${skill.name}] ${battleEffects.consecrationDamage} holy damage for 2 rounds!`, "skill-activation"); break;
  }

  if (typeof playSound === "function") playSound("skill");
  updateBattleManaUI();
  updateSkillBar();
}

// ── BATTLE SIMULATION ──
function startBattleSimulation(level) {
  const staminaCost = getStaminaCost(level);
  if (playerState.stamina < staminaCost) {
    showToast("Not enough stamina! Wait for it to regenerate.", "error");
    _show("close-battle-modal-btn");
    return;
  }

  // Deduct stamina
  playerState.stamina -= staminaCost;
  playerState.lastStaminaUpdate = Date.now();
  savePlayerState(); renderStats();

  // Reset battle state
  battleEffects = {
    blockNextHit: false, powerBoostMult: 1, powerBoostRounds: 0,
    poisonDamage: 0, poisonRounds: 0, eagleEyeHits: 0,
    stunRounds: 0, manaShieldAbsorb: 0, manaShieldRounds: 0,
    rainOfArrowsHits: 0, divineShieldRounds: 0,
    consecrationDamage: 0, consecrationRounds: 0,
  };
  skillCooldowns = {};
  battleRound = 0;

  const effStats = getEffectiveStats();
  const preset   = CLASS_PRESETS[playerState.class];
  battleMaxMana     = playerState.maxMana || preset?.mana || 50;
  currentBattleMana = battleMaxMana;
  battlePlayerHp    = effStats.maxHp;
  battlePlayerMaxHp = effStats.maxHp;
  battleEnemyHp     = level.hp;
  battleEnemyMaxHp  = level.hp;

  updateBattleManaUI();
  updatePlayerHpUI();
  updateEnemyHpUI();

  // UI lock
  _hide("start-battle-btn");
  _hide("close-battle-modal-btn");
  _hide("close-battle-btn");
  _hide("rematch-battle-btn");

  const playerEl = document.getElementById("player-fighter-el");
  const enemyEl  = document.getElementById("enemy-fighter-el");

  const numericId = typeof level.id === "number" ? level.id : (level.botLevel || 1);
  const enemyDodgeChance = 0.02 + numericId * 0.01;
  const enemyCritChance  = 0.05 + numericId * 0.005;
  const enemyCritDamage  = 1.5;

  document.getElementById("battle-log").innerHTML = `<p class="system-message">⚔️ Battle began!</p>`;
  updateSkillBar();

  activeBattleInterval = setInterval(() => {
    battleRound++;
    const currentEffStats = getEffectiveStats();

    // ── Mana regen ──
    currentBattleMana = Math.min(battleMaxMana, currentBattleMana + (preset?.manaRegen || 8));

    // ── Cooldown tick ──
    Object.keys(skillCooldowns).forEach(sid => { if (skillCooldowns[sid] > 0) skillCooldowns[sid]--; });

    // ── Consecration damage ──
    if (battleEffects.consecrationRounds > 0) {
      const cDmg = battleEffects.consecrationDamage;
      battleEnemyHp = Math.max(0, battleEnemyHp - cDmg);
      appendBattleLog(`☀️ Consecration burns for ${cDmg} holy damage!`, "combat-player-crit");
      battleEffects.consecrationRounds--;
      updateEnemyHpUI();
      if (battleEnemyHp <= 0) { handleBattleVictory(level); return; }
    }

    // ── Poison tick ──
    if (battleEffects.poisonRounds > 0) {
      battleEnemyHp = Math.max(0, battleEnemyHp - battleEffects.poisonDamage);
      appendBattleLog(`🏹 Poison: ${battleEffects.poisonDamage} damage! (${battleEffects.poisonRounds - 1} rounds left)`, "combat-player-hit");
      battleEffects.poisonRounds--;
      updateEnemyHpUI();
      if (battleEnemyHp <= 0) { handleBattleVictory(level); return; }
    }

    // ── PLAYER ATTACKS ──
    let playerDamage = 0, attackLog = "", isPlayerCrit = false;
    let hitCount = 1, hitMult = 1;
    if (battleEffects.rainOfArrowsHits > 0) { hitCount = battleEffects.rainOfArrowsHits; hitMult = 0.7; battleEffects.rainOfArrowsHits = 0; }

    if (Math.random() < enemyDodgeChance) {
      attackLog = `🛡️ ${level.name} dodged your attack!`;
    } else {
      let baseDmg = Math.max(1, currentEffStats.power - level.defense) * hitMult;
      if (battleEffects.powerBoostRounds > 0) { baseDmg *= battleEffects.powerBoostMult; battleEffects.powerBoostRounds--; }
      const isCrit = battleEffects.eagleEyeHits > 0 || Math.random() < currentEffStats.critChance;
      if (battleEffects.eagleEyeHits > 0) battleEffects.eagleEyeHits--;
      if (isCrit) {
        isPlayerCrit = true;
        playerDamage = Math.round(baseDmg * currentEffStats.critDamage) * hitCount;
        attackLog = hitCount > 1
          ? `🌧️ Rain CRITS! ${hitCount} hits for ${playerDamage} total!`
          : `💥 CRITICAL! You deal ${playerDamage} damage to ${level.name}!`;
      } else {
        playerDamage = Math.round(baseDmg) * hitCount;
        attackLog = hitCount > 1
          ? `🌧️ Rain of Arrows! ${hitCount}× for ${playerDamage} total!`
          : `You deal ${playerDamage} damage to ${level.name}!`;
      }
    }

    battleEnemyHp = Math.max(0, battleEnemyHp - playerDamage);
    updateEnemyHpUI();
    appendBattleLog(attackLog, playerDamage > 0 ? (isPlayerCrit ? "combat-player-crit" : "combat-player-hit") : "system-message");
    if (playerDamage > 0 && enemyEl) { enemyEl.classList.add("shake"); setTimeout(() => enemyEl.classList.remove("shake"), 250); }
    if (typeof playSound === "function" && playerDamage > 0) playSound(isPlayerCrit ? "critical" : "hit");
    if (battleEnemyHp <= 0) { handleBattleVictory(level); return; }

    // ── ENEMY ATTACKS ──
    if (battleEffects.stunRounds > 0) {
      appendBattleLog(`❄️ ${level.name} is frozen and cannot act!`, "system-message");
      battleEffects.stunRounds--;
    } else if (battleEffects.divineShieldRounds > 0) {
      appendBattleLog(`🛡️ Divine Shield blocks ${level.name}'s attack!`, "system-message");
      battleEffects.divineShieldRounds--;
    } else if (battleEffects.blockNextHit) {
      appendBattleLog(`🛡️ Shield Wall blocks ${level.name}'s attack!`, "system-message");
      battleEffects.blockNextHit = false;
    } else {
      let enemyDamage = 0, enemyLog = "", isEnemyCrit = false;
      if (Math.random() < currentEffStats.dodgeChance) {
        enemyLog = `💨 You dodged ${level.name}'s attack!`;
      } else {
        let rawDmg = Math.max(1, level.power - currentEffStats.defense);
        if (Math.random() < enemyCritChance) {
          isEnemyCrit = true;
          rawDmg = Math.round(rawDmg * enemyCritDamage);
          enemyLog = `💥 CRIT! ${level.name} strikes for ${rawDmg} damage!`;
        } else {
          enemyLog = `${level.name} strikes you for ${rawDmg} damage!`;
        }
        // Mana shield absorption
        if (battleEffects.manaShieldRounds > 0 && battleEffects.manaShieldAbsorb > 0) {
          const absorbed = Math.min(rawDmg, battleEffects.manaShieldAbsorb);
          rawDmg -= absorbed;
          battleEffects.manaShieldAbsorb -= absorbed;
          enemyLog += ` (${absorbed} absorbed!)`;
          if (battleEffects.manaShieldAbsorb <= 0) battleEffects.manaShieldRounds = 0;
          else battleEffects.manaShieldRounds--;
        } else if (battleEffects.manaShieldRounds > 0) {
          battleEffects.manaShieldRounds--;
        }
        enemyDamage = rawDmg;
      }

      battlePlayerHp = Math.max(0, battlePlayerHp - enemyDamage);
      updatePlayerHpUI();
      appendBattleLog(enemyLog, enemyDamage > 0 ? (isEnemyCrit ? "combat-enemy-crit" : "combat-enemy-hit") : "system-message");
      if (enemyDamage > 0 && playerEl) { playerEl.classList.add("shake"); setTimeout(() => playerEl.classList.remove("shake"), 250); }
      if (typeof playSound === "function" && enemyDamage > 0) playSound("enemy_hit");
      if (battlePlayerHp <= 0) { handleBattleDefeat(); return; }
    }

    updateBattleManaUI();
    updateSkillBar();
  }, 480);
}

// ── HP / MANA UI HELPERS ──
function updatePlayerHpUI() {
  _setWidth("player-hp-bar", (battlePlayerHp / battlePlayerMaxHp) * 100);
  _setText("player-hp-text", `${formatNumber(battlePlayerHp)}/${formatNumber(battlePlayerMaxHp)}`);
}
function updateEnemyHpUI() {
  _setWidth("enemy-hp-bar", (battleEnemyHp / battleEnemyMaxHp) * 100);
  _setText("enemy-hp-text", `${formatNumber(battleEnemyHp)}/${formatNumber(battleEnemyMaxHp)}`);
}
function updateBattleManaUI() {
  _setWidth("battle-mana-bar", (currentBattleMana / battleMaxMana) * 100);
  _setText("battle-mana-text", `${currentBattleMana}/${battleMaxMana}`);
}

// ── BATTLE LOG ──
function appendBattleLog(text, cssClass) {
  const log = document.getElementById("battle-log");
  const p = document.createElement("p");
  p.className = cssClass || "";
  p.textContent = text;
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

// ── VICTORY ──
function handleBattleVictory(level) {
  clearInterval(activeBattleInterval);
  activeBattleInterval = null;

  const isSideZone = typeof level.id === "string" && !level.isBotDuel;

  appendBattleLog(`🏆 Victory! You defeated ${level.name}!`, "combat-victory");
  showToast(`⭐ Victory! +${level.gold}g and +${level.xp} XP!`, "success");
  if (typeof playSound === "function") playSound("victory");

  playerState.gold += level.gold;
  playerState.xp   += level.xp;

  if (level.isBotDuel) {
    if (typeof window.getFriendById === "function" && typeof window.updateFriendPower === "function") {
      const bot = window.getFriendById(level.id);
      if (bot) {
        const powerLoss = Math.round(bot.power * 0.05);
        const newPower = Math.max(10, bot.power - powerLoss);
        window.updateFriendPower(bot.id, newPower);
        appendBattleLog(`🏆 Duel Won! ${bot.name}'s power rating reduced by -5% (-${powerLoss} PR)!`, "combat-victory");
        showToast(`🏆 Duel Won! Reduced bot's power!`, "success");
      }
    }
  }

  // Level up check
  while (playerState.xp >= playerState.xpNeeded) {
    playerState.xp -= playerState.xpNeeded;
    playerState.level++;
    playerState.xpNeeded = Math.round(playerState.xpNeeded * 1.55);
    playerState.stats.maxHp   += 15;
    playerState.stats.power   += 3;
    playerState.stats.defense += 2;
    playerState.stamina = getMaxStamina(playerState.level);
    playerState.lastStaminaUpdate = Date.now();
    playerState.skillPoints = (playerState.skillPoints || 0) + 3;
    appendBattleLog(`⭐ LEVEL UP! Now Level ${playerState.level}! Stats increased. +3 Skill Points!`, "combat-victory");
    showToast(`⭐ Level ${playerState.level}! +3 Skill Points available!`, "info");
    if (typeof playSound === "function") playSound("level_up");
  }

  // Unlock next main level
  if (!isSideZone && level.id === playerState.unlockedLevel && playerState.unlockedLevel < LEVELS.length) {
    playerState.unlockedLevel++;
    showToast(`🗺️ Level ${playerState.unlockedLevel} unlocked on the map!`, "info");
  }

  // Track side zone completion
  if (isSideZone && !playerState.completedSideZones.includes(level.id)) {
    playerState.completedSideZones.push(level.id);
  }

  checkForLootDrop(level);
  savePlayerState();
  renderMap();
  renderStats();
  renderShop();
  renderSkills();

  _show("close-battle-modal-btn");
  _show("close-battle-btn");
  _show("rematch-battle-btn");
}

// ── DEFEAT ──
function handleBattleDefeat() {
  clearInterval(activeBattleInterval);
  activeBattleInterval = null;

  appendBattleLog(`💀 Defeat! You were knocked out...`, "combat-defeat");
  showToast("💀 Defeated! Upgrade your stats and try again.", "error");
  if (typeof playSound === "function") playSound("defeat");

  _show("close-battle-modal-btn");
  _show("close-battle-btn");
  _show("rematch-battle-btn");
}

// ================================================================
// LOOT SYSTEM
// ================================================================
function checkForLootDrop(level) {
  if (Math.random() > 0.45) return; // 45% drop chance

  const isRingDrop = Math.random() < 0.28; // 28% chance for ring
  if (isRingDrop) {
    let tier = 1;
    const refId = typeof level.id === "number" ? level.id : (level.botLevel || 1);
    if (refId >= 6 && refId < 16) tier = 2;
    if (refId >= 16) tier = 3;
    if (typeof level.id === "string" && level.id.includes("15")) tier = 3;

    const possibleRings = Object.values(RING_ITEMS).filter(r => r.tier === tier);
    if (!possibleRings.length) return;
    const loot = possibleRings[Math.floor(Math.random() * possibleRings.length)];
    const equippedRing = playerState.equipment.ring ? ALL_ITEMS[playerState.equipment.ring] : null;

    if (gameSettings.autoEquip && (!equippedRing || loot.value > equippedRing.value)) {
      equipLootImmediately(loot);
      showToast(`💍 Auto-equipped ${loot.name}!`, "success");
    } else {
      pendingLoot = loot;
      showCompareModal(equippedRing, loot);
    }
  } else {
    let tier = 1;
    const levelId = typeof level.id === "number" ? level.id : (level.botLevel || 6);
    if (levelId >= 4 && levelId <= 10) tier = 2;
    if (levelId >= 11 && levelId <= 20) tier = 3;
    if (levelId >= 21 && levelId <= 25) tier = 4;
    if (levelId >= 26) tier = 5;

    const possible = Object.values(CLASS_ITEMS).filter(i => i.class === playerState.class && i.tier === tier);
    if (!possible.length) return;
    const loot = possible[Math.floor(Math.random() * possible.length)];
    const equipped = loot.type === "weapon" ? playerState.equipment.weapon : playerState.equipment.armor;
    const equippedItem = equipped ? ALL_ITEMS[equipped] : null;

    if (gameSettings.autoEquip && (!equippedItem || loot.value > equippedItem.value)) {
      equipLootImmediately(loot);
      showToast(`🎁 Auto-equipped ${loot.name}!`, "success");
    } else {
      pendingLoot = loot;
      showCompareModal(equippedItem, loot);
    }
  }

  if (typeof playSound === "function") playSound("loot");
}

function showCompareModal(equippedItem, newLoot) {
  const modal = document.getElementById("compare-modal");
  if (!modal) return;

  const equippedDetails = document.getElementById("compare-equipped-details");
  const lootDetails     = document.getElementById("compare-loot-details");
  const statDiff        = document.getElementById("compare-stat-diff");

  const statFmt = (item) => {
    if (!item) return "";
    const s = item.stat.includes("Chance") ? `${Math.round(item.value * 100)}%` : `+${item.value}`;
    const label = item.stat === "power" ? "Power" : item.stat === "defense" ? "Defense" :
                  item.stat === "critChance" ? "Crit" : "Dodge";
    return `${label} ${s}`;
  };

  equippedDetails.innerHTML = equippedItem ? `
    <div style="font-size:2rem;">${equippedItem.icon}</div>
    <strong>${equippedItem.name}</strong>
    <p>${statFmt(equippedItem)}</p>` : `
    <div style="font-size:2rem;opacity:0.4;">❌</div>
    <strong style="color:var(--text-muted);">None</strong>
    <p>Empty slot</p>`;

  lootDetails.innerHTML = `
    <div style="font-size:2rem;">${newLoot.icon}</div>
    <strong style="color:var(--gold);">${newLoot.name}</strong>
    <p>${statFmt(newLoot)}</p>`;

  const eVal = equippedItem ? equippedItem.value : 0;
  const diff = newLoot.value - eVal;
  const label = newLoot.stat.includes("Chance") ? `${Math.round(diff * 100)}%` : diff;
  const sname = newLoot.stat === "power" ? "Power" : newLoot.stat === "defense" ? "Defense" :
                newLoot.stat === "critChance" ? "Crit" : "Dodge";
  statDiff.innerHTML = `${sname} change: <span class="${diff >= 0 ? "positive" : "negative"}">${diff >= 0 ? "+" : ""}${label}</span>`;

  modal.classList.add("active");
}

function equipLootImmediately(loot) {
  equipItem(loot.id);
  showToast(`✅ Equipped ${loot.name}!`, "success");
}

function addLootToInventory(loot) {
  playerState.inventory.push({ id: loot.id });
  savePlayerState();
  renderInventory();
}

// ================================================================
// UTILITY
// ================================================================
function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 10_000)    return (n / 1_000).toFixed(1) + "K";
  return Math.round(n).toString();
}

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "toastIn 0.3s ease reverse";
    setTimeout(() => { if (toast.parentNode === container) container.removeChild(toast); }, 300);
  }, 3500);
}

// DOM helpers
function _setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function _setWidth(id, pct) { const el = document.getElementById(id); if (el) el.style.width = `${Math.min(100, Math.max(0, pct))}%`; }
function _setDisabled(id, val) { const el = document.getElementById(id); if (el) el.disabled = val; }
function _show(id) { const el = document.getElementById(id); if (el) el.style.display = ""; }
function _hide(id) { const el = document.getElementById(id); if (el) el.style.display = "none"; }

// Reset
window.resetGame = () => {
  localStorage.removeItem("rpg_player_state");
  localStorage.removeItem("rpg_social_friends");
  window.location.reload();
};

// New character -- resets character state only, keeps settings & social
window.newCharacter = () => {
  localStorage.removeItem("rpg_player_state");
  window.location.reload();
};

window.startPvPDuel = (botId) => {
  if (typeof window.getFriendById !== "function") return;
  const bot = window.getFriendById(botId);
  if (!bot) return;

  const P = bot.power;
  const C = bot.class || "Warrior";

  // Calculate bot stats based on class and power rating
  let powerVal = 0, defVal = 0, hpVal = 0;
  if (C === "Warrior") {
    powerVal = P * 0.15;
    defVal = P * 0.133;
    hpVal = P * 5.0;
  } else if (C === "Mage") {
    powerVal = P * 0.25;
    defVal = P * 0.053;
    hpVal = P * 4.2;
  } else if (C === "Ranger") {
    powerVal = P * 0.20;
    defVal = P * 0.080;
    hpVal = P * 4.8;
  } else if (C === "Paladin") {
    powerVal = P * 0.13;
    defVal = P * 0.160;
    hpVal = P * 5.0;
  } else {
    // Default fallback
    powerVal = P * 0.18;
    defVal = P * 0.100;
    hpVal = P * 4.5;
  }

  const mockLevel = {
    id: bot.id,
    name: `${bot.name} (${C})`,
    avatar: CLASS_PRESETS[C]?.avatar || "🤖",
    hp: Math.round(hpVal),
    power: Math.round(powerVal),
    defense: Math.round(defVal),
    gold: Math.round(P * 0.15),
    xp: Math.round(P * 0.10),
    suggested: P,
    staminaCost: 10,
    isBotDuel: true,
    botLevel: bot.level,
  };

  openBattleModal(mockLevel);
};