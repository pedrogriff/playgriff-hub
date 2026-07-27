// ================================================================
// EMBER KEEP — Core Game Logic & ES Module Entry Point
// ================================================================

import { AccountStore } from "./account.js";
import { GameAPI } from "./engine.js";
import { CombatEngine } from "./combat.js";
import { VillageEngine } from "./village.js";
import { MarketEngine } from "./market.js";
import { UIManager } from "./ui.js";
import { createClan, joinClan, leaveClan, getAvailableClans, loadClan, saveClan, initializeBotClans } from "./clans.js";
import { equipItemRPC, unequipItemRPC, getCharacterInventory, runDungeonEncounterRPC, getDungeonProgress, craftItemRPC, getShopInventoryRPC, buyShopItemRPC, syncInventoryItemToDB } from "./db.js";
import { GarrisonEngine, GARRISON_STATIONS } from "./garrison.js";
import { WorldEngine } from "./world.js";
import { SeasonsEngine } from "./seasons.js";
import "./social.js";
import "./pets.js";
import "./siege.js";
import "./audio.js";

// Initialize ES Engine Systems
window.AccountStore = AccountStore;
window.GameAPI = GameAPI;
window.CombatEngine = CombatEngine;
window.VillageEngine = VillageEngine;
window.MarketEngine = MarketEngine;
window.GarrisonEngine = GarrisonEngine;
window.GARRISON_STATIONS = GARRISON_STATIONS;
window.WorldEngine = WorldEngine;
window.SeasonsEngine = SeasonsEngine;

export function getRequiredXpForLevel(level) {
  const lvl = Math.max(1, Number(level) || 1);
  return Math.floor(100 + (lvl - 1) * 75 + Math.pow(lvl - 1, 1.8) * 20);
}
window.getRequiredXpForLevel = getRequiredXpForLevel;

// Expose Core Global Helpers to Window Scope
window.showToast = showToast;
window.formatNumber = formatNumber;
window.savePlayerState = function() {
  if (typeof AccountStore !== "undefined" && typeof AccountStore.save === "function") {
    AccountStore.save();
  }
};
window.renderStats = function() {
  if (typeof window.renderActiveCharacterUI === "function") {
    window.renderActiveCharacterUI();
  }
};

// Dynamic Property for window.playerState mapping to AccountStore active character
let _localPlayerState = null;
if (!Object.getOwnPropertyDescriptor(window, "playerState")) {
  Object.defineProperty(window, "playerState", {
    get() {
      const char = typeof AccountStore !== "undefined" ? AccountStore.getActiveCharacter() : null;
      return char || _localPlayerState;
    },
    set(val) {
      _localPlayerState = val;
    },
    configurable: true
  });
}

// Expose Inline HTML Event Handlers to Global Window Scope
window.claimDailyReward = function(...args) { if (typeof claimDailyReward === "function") return claimDailyReward(...args); };
window.renderPremiumStore = function(...args) { if (typeof renderPremiumStore === "function") return renderPremiumStore(...args); };
window.buyEmberPass = function(...args) { if (typeof buyEmberPass === "function") return buyEmberPass(...args); };
window.buyPremiumConsumable = function(...args) { if (typeof buyPremiumConsumable === "function") return buyPremiumConsumable(...args); };
window.openVillageModal = function(...args) { if (typeof openVillageModal === "function") return openVillageModal(...args); };
window.upgradeHouse = function(...args) { if (typeof upgradeHouse === "function") return upgradeHouse(...args); };
window.upgradeStation = function(...args) { if (typeof upgradeStation === "function") return upgradeStation(...args); };
window.removeStation = function(...args) { if (typeof removeStation === "function") return removeStation(...args); };
window.openStationInstallModal = function(...args) { if (typeof openStationInstallModal === "function") return openStationInstallModal(...args); };
window.openDecorationShopModal = function(...args) { if (typeof openDecorationShopModal === "function") return openDecorationShopModal(...args); };
window.removeDecoration = function(...args) { if (typeof removeDecoration === "function") return removeDecoration(...args); };
window.installStation = function(...args) { if (typeof installStation === "function") return installStation(...args); };
window.placeDecoration = function(...args) { if (typeof placeDecoration === "function") return placeDecoration(...args); };
window.buyDecoration = function(...args) { if (typeof buyDecoration === "function") return buyDecoration(...args); };

document.addEventListener("DOMContentLoaded", async () => {
  await AccountStore.init();
  await UIManager.init();

  if (window.renderActiveCharacterUI) {
    window.renderActiveCharacterUI();
  }
  checkClassSelection();

  // Run Aggregated Offline Progress Check
  const aggregatedReport = await GameAPI.simulateOfflineProgressAll();
  if (aggregatedReport) {
    UIManager.showOfflineSummaryModal(aggregatedReport);
  }
  if (typeof UIManager !== "undefined" && UIManager.renderCommandCenter) {
    UIManager.renderCommandCenter();
  }
  if (window.renderActiveCharacterUI) {
    window.renderActiveCharacterUI();
  }
});

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

const REGIONS = [
  { id:"greenhollow", name:"Greenhollow",  icon:"🌿", theme:"forest",   color:"#22c55e",
    minLevel:1,  maxLevel:5,  fortressName:"Valley Fort",          fortressIcon:"🏰",
    desc:"An ancient forest protected by old walls." },
  { id:"frosthold",   name:"Frosthold",    icon:"❄️", theme:"ice",      color:"#60a5fa",
    minLevel:6,  maxLevel:10, fortressName:"Ice Citadel",          fortressIcon:"🏔️",
    desc:"Frozen peaks where only the strongest survive." },
  { id:"ashenvale",   name:"Ashenvale",    icon:"🌋", theme:"volcanic", color:"#f59e0b",
    minLevel:11, maxLevel:17, fortressName:"Ash Bastion",          fortressIcon:"🏯",
    desc:"Scorched lands by active volcanoes." },
  { id:"shadowmere",  name:"Shadowmere",   icon:"🌑", theme:"shadow",   color:"#8b5cf6",
    minLevel:18, maxLevel:24, fortressName:"Shadow Tower",         fortressIcon:"🗼",
    desc:"Poisoned swamps shrouded in eternal fog." },
  { id:"emberpeak",   name:"Emberpeak",    icon:"🔥", theme:"ember",    color:"#ff6b35",
    minLevel:25, maxLevel:30, fortressName:"Ember Fortress",       fortressIcon:"🔥",
    desc:"The fiery heart of the world. The ultimate prize." },
];

// ================================================================
// DATA: CLASSES
// ================================================================
const CLASS_PRESETS = {
  Warrior: { avatar:"🛡️", image:null, mana:50, manaRegen:8,
    stats:{ maxHp:120, power:10, defense:8, critChance:0.05, critDamage:1.5, dodgeChance:0.05 } },
  Ranger:  { avatar:"🏹", image:null,  mana:60, manaRegen:10,
    stats:{ maxHp:100, power:12, defense:5, critChance:0.20, critDamage:1.75,dodgeChance:0.15 } },
  Mage:    { avatar:"🔮", image:null,    mana:100,manaRegen:15,
    stats:{ maxHp:80,  power:15, defense:3, critChance:0.15, critDamage:2.0, dodgeChance:0.08 } },
  Paladin: { avatar:"⚜️", image:null, mana:70, manaRegen:10,
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

const CRAFTED_GEAR = {
  // Blacksmith Weapons
  weap_dagger_craft: { id:"weap_dagger_craft", class:null, type:"weapon", name:"Forged Dagger",  stat:"power", value:7,   cost:100, icon:"🗡️", tier:1, desc:"Crafted by Blacksmith" },
  weap_sword_craft:  { id:"weap_sword_craft",  class:null, type:"weapon", name:"Forged Sword",   stat:"power", value:20,  cost:300, icon:"⚔️", tier:2, desc:"Crafted by Blacksmith" },
  weap_blade_craft:  { id:"weap_blade_craft",  class:null, type:"weapon", name:"Forged Blade",   stat:"power", value:45,  cost:800, icon:"🔪", tier:3, desc:"Crafted by Blacksmith" },
  weap_epic_craft:   { id:"weap_epic_craft",   class:null, type:"weapon", name:"Epic Forged W.", stat:"power", value:85,  cost:2500,icon:"⚜️", tier:4, desc:"Crafted by Blacksmith" },
  weap_legend_craft: { id:"weap_legend_craft", class:null, type:"weapon", name:"Legend Forged W.",stat:"power", value:160, cost:8000,icon:"✨", tier:5, desc:"Crafted by Blacksmith" },
  // Tailor Armors
  arm_vest_craft:    { id:"arm_vest_craft",    class:null, type:"armor",  name:"Tailored Vest",  stat:"defense", value:6,   cost:100, icon:"🦺", tier:1, desc:"Crafted by Tailor" },
  arm_armor_craft:   { id:"arm_armor_craft",   class:null, type:"armor",  name:"Tailored Armor", stat:"defense", value:16,  cost:300, icon:"🥋", tier:2, desc:"Crafted by Tailor" },
  arm_mantle_craft:  { id:"arm_mantle_craft",  class:null, type:"armor",  name:"Tailored Mantle",stat:"defense", value:35,  cost:800, icon:"🥻", tier:3, desc:"Crafted by Tailor" },
  arm_epic_craft:    { id:"arm_epic_craft",    class:null, type:"armor",  name:"Epic Tailored A.",stat:"defense", value:65, cost:2500,icon:"🧥", tier:4, desc:"Crafted by Tailor" },
  arm_legend_craft:  { id:"arm_legend_craft",  class:null, type:"armor",  name:"Legend Tailored",stat:"defense", value:120,cost:8000,icon:"✨", tier:5, desc:"Crafted by Tailor" },
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
  ring_10:{ id:"ring_10",class:null, type:"ring", name:"Aegis Pendant",      stat:"defense",     value:30,   cost:5000, icon:"🏺", tier:5 }
};

const EXPANDED_ITEMS = {
  head_leather_cap:       { id:"head_leather_cap",       slot_type:"head",      name:"Novice Leather Cap",     defense:2,  max_hp:10, min_level:1,  cost:15,   icon:"🪖", rarity:"common",   is_shop_item:true },
  chest_cloth_tunic:      { id:"chest_cloth_tunic",      slot_type:"chest",     name:"Apprentice Cloth Tunic", defense:3,  max_hp:15, min_level:1,  cost:20,   icon:"🥋", rarity:"common",   is_shop_item:true },
  legs_leather_pants:     { id:"legs_leather_pants",     slot_type:"legs",      name:"Rough Leather Pants",    defense:2,  max_hp:10, min_level:1,  cost:15,   icon:"👖", rarity:"common",   is_shop_item:true },
  gloves_leather:         { id:"gloves_leather",         slot_type:"gloves",    name:"Novice Leather Gloves",  defense:2,  power:1,   min_level:1,  cost:15,   icon:"🧤", rarity:"common",   is_shop_item:true },
  boots_leather:          { id:"boots_leather",          slot_type:"boots",     name:"Rough Leather Boots",    defense:2,  dodge_chance:0.01, min_level:1, cost:15, icon:"👢", rarity:"common", is_shop_item:true },
  trinket_lucky_coin:     { id:"trinket_lucky_coin",     slot_type:"trinket",   name:"Lucky Coin Trinket",     crit_chance:0.02, min_level:1, cost:25, icon:"🔮", rarity:"common", is_shop_item:true },
  main_iron_dagger:       { id:"main_iron_dagger",       slot_type:"main_hand", name:"Iron Dagger",            power:6,   crit_chance:0.02, min_level:1, cost:25, icon:"🗡️", rarity:"common", is_shop_item:true },
  off_wooden_shield:      { id:"off_wooden_shield",      slot_type:"off_hand",  name:"Wooden Buckler",         defense:4,  dodge_chance:0.01, min_level:1, cost:20, icon:"🛡️", rarity:"common", is_shop_item:true },
  acc_copper_ring:        { id:"acc_copper_ring",        slot_type:"accessory", name:"Copper Band",            max_hp:15,  crit_chance:0.01, min_level:1, cost:30, icon:"💍", rarity:"common", is_shop_item:true },

  gloves_iron:            { id:"gloves_iron",            slot_type:"gloves",    name:"Iron Clad Gauntlets",    defense:5,  power:3,   min_level:5,  cost:45,   icon:"🥊", rarity:"uncommon", is_shop_item:true },
  boots_iron:             { id:"boots_iron",             slot_type:"boots",     name:"Heavy Iron Boots",       defense:6,  max_hp:15, min_level:5,  cost:45,   icon:"🥾", rarity:"uncommon", is_shop_item:true },
  trinket_war_banner:     { id:"trinket_war_banner",     slot_type:"trinket",   name:"War Banner Trinket",     power:5,   defense:3, min_level:5,  cost:60,   icon:"🚩", rarity:"uncommon", is_shop_item:true },

  head_iron_helm:         { id:"head_iron_helm",         slot_type:"head",      name:"Iron Vanguard Helm",     defense:6,  max_hp:25, min_level:5,  cost:45,   icon:"🪖", rarity:"uncommon", is_shop_item:true },
  chest_iron_cuirass:      { id:"chest_iron_cuirass",      slot_type:"chest",     name:"Reinforced Iron Cuirass",defense:8,  max_hp:35, min_level:5,  cost:60,   icon:"🥋", rarity:"uncommon", is_shop_item:true },
  legs_iron_greaves:      { id:"legs_iron_greaves",      slot_type:"legs",      name:"Iron Plate Greaves",     defense:6,  max_hp:25, min_level:5,  cost:50,   icon:"👖", rarity:"uncommon", is_shop_item:true },
  main_steel_sword:       { id:"main_steel_sword",       slot_type:"main_hand", name:"Forged Steel Blade",     power:14,  crit_chance:0.03, min_level:5, cost:75, icon:"⚔️", rarity:"uncommon", is_shop_item:true },
  off_iron_shield:        { id:"off_iron_shield",        slot_type:"off_hand",  name:"Iron Wall Shield",       defense:9,  max_hp:20, min_level:5,  cost:65,   icon:"🛡️", rarity:"uncommon", is_shop_item:true },
  acc_silver_amulet:      { id:"acc_silver_amulet",      slot_type:"accessory", name:"Silver Wolf Amulet",     power:4,   crit_chance:0.03, min_level:8, cost:90, icon:"📿", rarity:"uncommon", is_shop_item:true },

  head_scout_hood:        { id:"head_scout_hood",        slot_type:"head",      name:"Hunter Scout Hood",      defense:9,  max_hp:35, dodge_chance:0.02, min_level:10, cost:110, icon:"🧢", rarity:"uncommon", is_shop_item:true },
  chest_scout_vest:       { id:"chest_scout_vest",       slot_type:"chest",     name:"Hunter Scout Vest",      defense:12, max_hp:50, min_level:10, cost:130, icon:"🎽", rarity:"uncommon", is_shop_item:true },
  legs_scout_breeches:    { id:"legs_scout_breeches",    slot_type:"legs",      name:"Hunter Scout Breeches",  defense:10, max_hp:40, min_level:10, cost:120, icon:"👖", rarity:"uncommon", is_shop_item:true },
  main_recurve_bow:       { id:"main_recurve_bow",       slot_type:"main_hand", name:"Composite Recurve Bow",  power:22,  crit_chance:0.04, min_level:10, cost:150, icon:"🏹", rarity:"uncommon", is_shop_item:true },
  off_scout_quiver:       { id:"off_scout_quiver",       slot_type:"off_hand",  name:"Precision Quiver",       power:6,   crit_chance:0.03, min_level:10, cost:120, icon:"🎒", rarity:"uncommon", is_shop_item:true },
  acc_ruby_ring:          { id:"acc_ruby_ring",          slot_type:"accessory", name:"Ruby Flame Ring",        power:8,   max_hp:30, min_level:12, cost:140, icon:"💍", rarity:"uncommon", is_shop_item:true },

  head_drakescale_cowl:   { id:"head_drakescale_cowl",   slot_type:"head",      name:"Drakescale Cowl",        defense:15, max_hp:65, crit_chance:0.03, min_level:15, cost:220, icon:"👺", rarity:"rare", is_shop_item:true },
  chest_drakescale_hauberk:{ id:"chest_drakescale_hauberk",slot_type:"chest",   name:"Drakescale Hauberk",    defense:22, max_hp:90, dodge_chance:0.02, min_level:15, cost:280, icon:"🥋", rarity:"rare", is_shop_item:true },
  legs_drakescale_greaves:{ id:"legs_drakescale_greaves",slot_type:"legs",     name:"Drakescale Greaves",    defense:17, max_hp:70, min_level:15, cost:240, icon:"👖", rarity:"rare", is_shop_item:true },
  main_frost_blade:       { id:"main_frost_blade",       slot_type:"main_hand", name:"Frostbite Claymore",     power:32,  crit_chance:0.05, min_level:18, cost:350, icon:"⚔️", rarity:"rare", is_shop_item:true },
  off_tower_shield:       { id:"off_tower_shield",       slot_type:"off_hand",  name:"Aegis Tower Shield",     defense:24, max_hp:60, min_level:18, cost:300, icon:"🛡️", rarity:"rare", is_shop_item:true },
  acc_ruby_signet:        { id:"acc_ruby_signet",        slot_type:"accessory", name:"Ruby Warlord Ring",      power:12,  crit_chance:0.04, min_level:20, cost:380, icon:"💍", rarity:"rare", is_shop_item:true },

  head_shadow_hood:       { id:"head_shadow_hood",       slot_type:"head",      name:"Shadowwalker Hood",      defense:24, crit_chance:0.06, dodge_chance:0.04, min_level:25, cost:0, icon:"🥷", rarity:"epic", is_shop_item:false },
  chest_shadow_harness:   { id:"chest_shadow_harness",   slot_type:"chest",     name:"Shadowfang Cuirass",     defense:32, max_hp:140, dodge_chance:0.05, min_level:25, cost:0, icon:"🎽", rarity:"epic", is_shop_item:false },
  legs_shadow_leggings:  { id:"legs_shadow_leggings",  slot_type:"legs",      name:"Shadowfang Leggings",    defense:26, max_hp:110, dodge_chance:0.03, min_level:25, cost:0, icon:"👖", rarity:"epic", is_shop_item:false },
  main_shadow_blade:      { id:"main_shadow_blade",      slot_type:"main_hand", name:"Shadowfang Dagger",      power:48,  crit_chance:0.08, min_level:25, cost:0, icon:"🗡️", rarity:"epic", is_shop_item:false },
  off_shadow_orb:         { id:"off_shadow_orb",         slot_type:"off_hand",  name:"Shadow Orb of Power",    power:18,  crit_chance:0.05, min_level:25, cost:0, icon:"🔮", rarity:"epic", is_shop_item:false },
  head_titan_visor:       { id:"head_titan_visor",       slot_type:"head",      name:"Titan Iron Visor",       defense:30, max_hp:130, min_level:30, cost:500, icon:"🪖", rarity:"rare", is_shop_item:true },
  chest_titan_plate:      { id:"chest_titan_plate",      slot_type:"chest",     name:"Titanium Greatplate",    defense:42, max_hp:180, min_level:30, cost:700, icon:"🛡️", rarity:"rare", is_shop_item:true },
  legs_titan_greaves:     { id:"legs_titan_greaves",     slot_type:"legs",      name:"Titanium Legguards",     defense:34, max_hp:140, min_level:30, cost:600, icon:"👖", rarity:"rare", is_shop_item:true },
  main_ember_scimitar:    { id:"main_ember_scimitar",    slot_type:"main_hand", name:"Emberflame Scimitar",    power:58,  crit_chance:0.06, min_level:32, cost:850, icon:"🗡️", rarity:"rare", is_shop_item:true },
  acc_dragon_eye:         { id:"acc_dragon_eye",         slot_type:"accessory", name:"Dragon Eye Pendant",     power:22,  crit_chance:0.05, max_hp:110, min_level:35, cost:1000, icon:"📿", rarity:"rare", is_shop_item:true },

  head_phoenix_crown:     { id:"head_phoenix_crown",     slot_type:"head",      name:"Phoenix Crown of Light", defense:40, max_hp:180, crit_chance:0.05, min_level:40, cost:0, icon:"👑", rarity:"epic", is_shop_item:false },
  chest_phoenix_robes:    { id:"chest_phoenix_robes",    slot_type:"chest",     name:"Phoenixfire Robes",      defense:50, max_hp:240, crit_chance:0.06, min_level:40, cost:0, icon:"🥋", rarity:"epic", is_shop_item:false },
  legs_phoenix_greaves:   { id:"legs_phoenix_greaves",   slot_type:"legs",      name:"Phoenixfire Greaves",    defense:42, max_hp:200, min_level:40, cost:0, icon:"👖", rarity:"epic", is_shop_item:false },
  main_phoenix_blade:     { id:"main_phoenix_blade",     slot_type:"main_hand", name:"Phoenix Heart Greatsword",power:85, crit_chance:0.09, max_hp:160, min_level:40, cost:0, icon:"🔥", rarity:"epic", is_shop_item:false },
  off_phoenix_crest:      { id:"off_phoenix_crest",      slot_type:"off_hand",  name:"Phoenix Wall Aegis",     defense:50, max_hp:200, dodge_chance:0.04, min_level:40, cost:0, icon:"🛡️", rarity:"epic", is_shop_item:false },
  acc_phoenix_band:       { id:"acc_phoenix_band",       slot_type:"accessory", name:"Phoenixfire Ring",       power:28,  crit_chance:0.07, max_hp:140, min_level:40, cost:0, icon:"💍", rarity:"epic", is_shop_item:false },
  head_celestial_crown:   { id:"head_celestial_crown",   slot_type:"head",      name:"Crown of the Sun God",   defense:55, max_hp:260, crit_chance:0.07, min_level:48, cost:0, icon:"👑", rarity:"legendary", is_shop_item:false },
  chest_celestial_harness:{ id:"chest_celestial_harness",slot_type:"chest",     name:"Celestial Star Plate",   defense:75, max_hp:350, dodge_chance:0.07, min_level:48, cost:0, icon:"✨", rarity:"legendary", is_shop_item:false },
  legs_celestial_greaves: { id:"legs_celestial_greaves", slot_type:"legs",      name:"Celestial Legguards",    defense:60, max_hp:280, min_level:48, cost:0, icon:"👖", rarity:"legendary", is_shop_item:false },
  main_excalibur:         { id:"main_excalibur",         slot_type:"main_hand", name:"Excalibur Holy Relic",   power:135, crit_chance:0.12, max_hp:300, min_level:50, cost:0, icon:"⚔️", rarity:"legendary", is_shop_item:false },
  off_celestial_shield:   { id:"off_celestial_shield",   slot_type:"off_hand",  name:"Aegis of Eternity",      defense:65, max_hp:280, dodge_chance:0.06, min_level:50, cost:0, icon:"🛡️", rarity:"legendary", is_shop_item:false },
  acc_sovereign_ring:     { id:"acc_sovereign_ring",     slot_type:"accessory", name:"Sovereign Ring",         power:50,  defense:35, crit_chance:0.10, max_hp:400, min_level:50, cost:0, icon:"🌟", rarity:"legendary", is_shop_item:false },

  // Mythic Items (Tier 5 - Level 55+)
  main_abyssal_reaper:    { id:"main_abyssal_reaper",    slot_type:"main_hand", name:"Abyssal Soul Reaper",    power:180, crit_chance:0.15, max_hp:450, min_level:55, cost:0, icon:"🔱", rarity:"mythic", is_shop_item:false },
  chest_void_plate:       { id:"chest_void_plate",       slot_type:"chest",     name:"Voidforged Plate",       defense:100, max_hp:500, dodge_chance:0.08, min_level:55, cost:0, icon:"🌌", rarity:"mythic", is_shop_item:false },
  acc_eye_of_infinity:    { id:"acc_eye_of_infinity",    slot_type:"accessory", name:"Eye of Infinity",        power:75,  defense:50, crit_chance:0.12, max_hp:550, min_level:55, cost:0, icon:"👁️", rarity:"mythic", is_shop_item:false },

  // Celestial Items (Tier 6 - Level 60+)
  main_godslayer_blade:   { id:"main_godslayer_blade",   slot_type:"main_hand", name:"Godslayer Celestial Blade", power:250, crit_chance:0.20, max_hp:700, min_level:60, cost:0, icon:"⚡", rarity:"celestial", is_shop_item:false },
  chest_aether_cuirass:   { id:"chest_aether_cuirass",   slot_type:"chest",     name:"Aetherial Sun Cuirass",  defense:140, max_hp:800, dodge_chance:0.10, min_level:60, cost:0, icon:"☀️", rarity:"celestial", is_shop_item:false },
  acc_singularity_core:   { id:"acc_singularity_core",   slot_type:"accessory", name:"Core of Singularity",    power:110, defense:80, crit_chance:0.15, max_hp:900, min_level:60, cost:0, icon:"💫", rarity:"celestial", is_shop_item:false },

  // Amulets & Necklaces
  amulet_bronze_talisman: { id:"amulet_bronze_talisman", slot_type:"amulet", name:"Bronze Guardian Talisman", power:3, max_hp:20, min_level:2, cost:30, icon:"📿", rarity:"common", is_shop_item:true },
  amulet_ruby_pendant:    { id:"amulet_ruby_pendant",    slot_type:"amulet", name:"Ruby Flame Pendant",      power:12, max_hp:60, crit_chance:0.03, min_level:15, cost:200, icon:"📿", rarity:"rare", is_shop_item:true },
  amulet_celestial_star:  { id:"amulet_celestial_star",  slot_type:"amulet", name:"Celestial Star Amulet",   power:45, max_hp:250, crit_chance:0.08, min_level:45, cost:0, icon:"✨", rarity:"legendary", is_shop_item:false },

  // Gloves & Gauntlets
  gloves_leather_wraps:   { id:"gloves_leather_wraps",   slot_type:"gloves", name:"Novice Leather Wraps",    defense:2, power:2, min_level:2, cost:25, icon:"🧤", rarity:"common", is_shop_item:true },
  gloves_iron_gauntlets:  { id:"gloves_iron_gauntlets",  slot_type:"gloves", name:"Iron Brawler Gauntlets",  defense:6, power:5, min_level:10, cost:80, icon:"🧤", rarity:"uncommon", is_shop_item:true },
  gloves_titan_gauntlets: { id:"gloves_titan_gauntlets", slot_type:"gloves", name:"Titanium Great Gloves",   defense:18, power:14, min_level:28, cost:350, icon:"🧤", rarity:"rare", is_shop_item:true },

  // Boots & Sabatons
  boots_leather_boots:    { id:"boots_leather_boots",    slot_type:"boots",  name:"Novice Leather Boots",    defense:2, dodge_chance:0.02, min_level:2, cost:25, icon:"👢", rarity:"common", is_shop_item:true },
  boots_iron_sabatons:    { id:"boots_iron_sabatons",    slot_type:"boots",  name:"Iron Heavy Sabatons",     defense:7, dodge_chance:0.03, min_level:10, cost:85, icon:"👢", rarity:"uncommon", is_shop_item:true },
  boots_windrunner_striders:{ id:"boots_windrunner_striders", slot_type:"boots", name:"Windrunner Striders",  defense:16, dodge_chance:0.06, min_level:25, cost:320, icon:"👢", rarity:"rare", is_shop_item:true },

  // Trinkets & Relics
  trinket_minor_charm:    { id:"trinket_minor_charm",    slot_type:"trinket", name:"Lucky Rabbit Foot",      max_hp:25, power:2, min_level:3, cost:35, icon:"🔮", rarity:"common", is_shop_item:true },
  trinket_war_horn:       { id:"trinket_war_horn",       slot_type:"trinket", name:"Warlord Banner Relic",   power:10, max_hp:50, min_level:15, cost:220, icon:"🔮", rarity:"uncommon", is_shop_item:true },
  trinket_celestial_relic:{ id:"trinket_celestial_relic",slot_type:"trinket", name:"Ember Star Relic",        power:40, max_hp:200, crit_chance:0.06, min_level:45, cost:0, icon:"🌟", rarity:"legendary", is_shop_item:false }
};

const CONSUMABLE_ITEMS = {
  potion_minor_hp: { id:"potion_minor_hp", type:"consumable", name:"Minor Health Potion", stat:"restoreHp", value:50, cost:15, icon:"🧪", tier:1, desc:"Restores 50 HP", useContext: "any" },
  potion_major_hp: { id:"potion_major_hp", type:"consumable", name:"Major Health Potion", stat:"restoreHp", value:150, cost:40, icon:"🏺", tier:2, desc:"Restores 150 HP", useContext: "any" },
};

const FOOD_ITEMS = {
  food_bread: { id:"food_bread", type:"consumable", name:"Stale Bread", stat:"restoreHp", value:30, cost:8, icon:"🍞", tier:1, desc:"Restores 30 HP. Out of battle only.", useContext:"outOfBattle" },
  food_soup:  { id:"food_soup",  type:"consumable", name:"Herb Soup", stat:"restoreHp", value:80, cost:22, icon:"🍲", tier:1, desc:"Restores 80 HP. Out of battle only.", useContext:"outOfBattle" },
  food_meat:  { id:"food_meat",  type:"consumable", name:"Grilled Meat", stat:"restoreHp", value:200, cost:55, icon:"🥩", tier:2, desc:"Restores 200 HP. Out of battle only.", useContext:"outOfBattle" },
  food_feast: { id:"food_feast", type:"consumable", name:"Royal Feast", stat:"restoreHp", value:500, cost:140, icon:"🍖", tier:3, desc:"Restores 500 HP. Out of battle only.", useContext:"outOfBattle" },
  food_elixir:{ id:"food_elixir",type:"consumable", name:"Elixir Stew", stat:"restoreHp", value:9999, cost:400, icon:"🫕", tier:4, desc:"Restores 100% HP. Out of battle only.", useContext:"outOfBattle" },
};

const MATERIAL_ITEMS = {
  // Task drop unified items
  item_ore_iron:     { id:"item_ore_iron", type:"material", name:"Iron Ore", cost:10, icon:"🪨", tier:1, desc:"Gathered from mining. Used for smithing." },
  item_wood_oak:     { id:"item_wood_oak", type:"material", name:"Oak Wood", cost:10, icon:"🪵", tier:1, desc:"Gathered from woodcutting. Used for crafting." },
  item_fish_trout:   { id:"item_fish_trout", type:"material", name:"Raw Trout", cost:10, icon:"🐟", tier:1, desc:"Caught from fishing. Used for cooking." },
  item_monster_hide: { id:"item_monster_hide", type:"material", name:"Monster Hide", cost:12, icon:"🥩", tier:1, desc:"Obtained in combat. Used for tanning." },
  item_herb_red:     { id:"item_herb_red", type:"material", name:"Red Herb", cost:8, icon:"🌿", tier:1, desc:"Used for brewing potions." },

  mat_herb:  { id:"mat_herb", type:"material", name:"Healing Herb", cost:5, icon:"🌿", tier:1, desc:"Used for crafting." },
  mat_vial:  { id:"mat_vial", type:"material", name:"Empty Vial", cost:5, icon:"🫙", tier:1, desc:"Used for crafting." },
  mat_shard: { id:"mat_shard", type:"material", name:"Magic Shard", cost:15, icon:"🔮", tier:2, desc:"Used for crafting." },
  mat_wheat: { id:"mat_wheat", type:"material", name:"Wheat", cost:3, icon:"🌾", tier:1, desc:"Used for baking." },
  mat_meat:  { id:"mat_meat", type:"material", name:"Raw Meat", cost:12, icon:"🍗", tier:2, desc:"Used for cooking." },
  mat_coal:  { id:"mat_coal", type:"material", name:"Coal", cost:8, icon:"🌑", tier:1, desc:"Used for fuel." },
  mat_spice: { id:"mat_spice", type:"material", name:"Spice", cost:20, icon:"🧂", tier:2, desc:"Used for cooking." },
  // Seeds & Farming
  mat_wheat_seed: { id:"mat_wheat_seed", type:"material", name:"Wheat Seed", cost:2, icon:"🌱", tier:1, desc:"Plant to grow wheat." },
  mat_herb_seed:  { id:"mat_herb_seed",  type:"material", name:"Herb Seed", cost:3, icon:"🌱", tier:1, desc:"Plant to grow herbs." },
  mat_spice_seed: { id:"mat_spice_seed", type:"material", name:"Spice Seed", cost:10, icon:"🌱", tier:2, desc:"Plant to grow spice." },
  mat_magic_seed: { id:"mat_magic_seed", type:"material", name:"Magic Seed", cost:20, icon:"✨", tier:3, desc:"Plant to grow magic herbs." },
  mat_magic_herb: { id:"mat_magic_herb", type:"material", name:"Magic Herb", cost:40, icon:"🌿", tier:3, desc:"Used for alchemy." },
  mat_golden_seed:{ id:"mat_golden_seed",type:"material", name:"Golden Seed", cost:50, icon:"🌟", tier:4, desc:"Plant to grow golden wheat." },
  mat_gold_wheat: { id:"mat_gold_wheat", type:"material", name:"Golden Wheat",cost:80, icon:"🌾", tier:4, desc:"Used for alchemy." },
  mat_celest_seed:{ id:"mat_celest_seed",type:"material", name:"Celestial Seed", cost:100, icon:"🌌", tier:5, desc:"Plant to grow celestial herbs." },
  mat_celest_herb:{ id:"mat_celest_herb",type:"material", name:"Celestial Herb", cost:200, icon:"🌿", tier:5, desc:"Used for alchemy." },
  mat_ench_water: { id:"mat_ench_water", type:"material", name:"Enchanted Water",cost:25, icon:"💧", tier:4, desc:"Used for farming." },
  mat_starlight:  { id:"mat_starlight",  type:"material", name:"Starlight", cost:150, icon:"✨", tier:5, desc:"Rare celestial material." },
  // Ranching & Tanning
  mat_feed:       { id:"mat_feed", type:"material", name:"Animal Feed", cost:5, icon:"🌾", tier:1, desc:"Food for animals." },
  mat_egg:        { id:"mat_egg", type:"material", name:"Raw Egg", cost:6, icon:"🥚", tier:1, desc:"Food ingredient." },
  mat_feather:    { id:"mat_feather", type:"material", name:"Feather", cost:4, icon:"🪶", tier:1, desc:"Used for crafting." },
  mat_hide:       { id:"mat_hide", type:"material", name:"Animal Hide", cost:8, icon:"🐻", tier:1, desc:"Used for tanning." },
  mat_milk:       { id:"mat_milk", type:"material", name:"Fresh Milk", cost:10, icon:"🥛", tier:2, desc:"Food ingredient." },
  mat_bucket:     { id:"mat_bucket", type:"material", name:"Bucket", cost:15, icon:"🪣", tier:1, desc:"Tool for ranching." },
  mat_bait:       { id:"mat_bait", type:"material", name:"Bait", cost:15, icon:"🪱", tier:3, desc:"Used for hunting." },
  mat_trap:       { id:"mat_trap", type:"material", name:"Trap", cost:25, icon:"🪤", tier:3, desc:"Used for hunting." },
  mat_exo_meat:   { id:"mat_exo_meat", type:"material", name:"Exotic Meat", cost:40, icon:"🥩", tier:3, desc:"Food ingredient." },
  mat_exo_hide:   { id:"mat_exo_hide", type:"material", name:"Exotic Hide", cost:30, icon:"🐆", tier:3, desc:"Used for tanning." },
  mat_drag_feed:  { id:"mat_drag_feed",type:"material", name:"Dragon Feed", cost:60, icon:"🍖", tier:4, desc:"Food for dragons." },
  mat_drag_scale: { id:"mat_drag_scale",type:"material",name:"Dragon Scale", cost:100, icon:"🦎", tier:4, desc:"Rare crafting material." },
  mat_drag_meat:  { id:"mat_drag_meat",type:"material", name:"Dragon Meat", cost:80, icon:"🥩", tier:4, desc:"Rare food ingredient." },
  mat_fire_shard: { id:"mat_fire_shard",type:"material",name:"Fire Shard", cost:50, icon:"🔥", tier:4, desc:"Used for crafting." },
  mat_cel_feed:   { id:"mat_cel_feed", type:"material", name:"Celestial Feed", cost:120, icon:"✨", tier:5, desc:"Food for mythical creatures." },
  mat_ember_ess:  { id:"mat_ember_ess",type:"material", name:"Ember Essence", cost:200, icon:"🔥", tier:5, desc:"Pure magic essence." },
  mat_phoenix_f:  { id:"mat_phoenix_f",type:"material", name:"Phoenix Feather", cost:300, icon:"🪶", tier:5, desc:"Legendary material." },
  // Blacksmithing
  mat_iron_ore:   { id:"mat_iron_ore", type:"material", name:"Iron Ore", cost:10, icon:"🪨", tier:1, desc:"Used for smithing." },
  mat_steel_ingot:{ id:"mat_steel_ingot",type:"material",name:"Steel Ingot", cost:25, icon:"🧱", tier:2, desc:"Used for smithing." },
  mat_mithril_ore:{ id:"mat_mithril_ore",type:"material",name:"Mithril Ore", cost:50, icon:"💎", tier:3, desc:"Used for smithing." },
  mat_ench_ingot: { id:"mat_ench_ingot", type:"material",name:"Enchanted Ingot", cost:120, icon:"🧱", tier:4, desc:"Used for smithing." },
  mat_cel_ingot:  { id:"mat_cel_ingot",  type:"material",name:"Celestial Ingot", cost:250, icon:"✨", tier:5, desc:"Used for smithing." },
  // Tanning & Tailoring
  mat_tannin:     { id:"mat_tannin", type:"material", name:"Tannin", cost:5, icon:"🧪", tier:1, desc:"Used for tanning." },
  mat_leather:    { id:"mat_leather",type:"material", name:"Leather", cost:15, icon:"📜", tier:1, desc:"Used for crafting." },
  mat_l_strip:    { id:"mat_l_strip",type:"material", name:"Leather Strip", cost:5, icon:"🎗️", tier:1, desc:"Used for crafting." },
  mat_reinf_l:    { id:"mat_reinf_l",type:"material", name:"Reinforced Leather", cost:35, icon:"🛡️", tier:2, desc:"Used for crafting." },
  mat_exo_l:      { id:"mat_exo_l",  type:"material", name:"Exotic Leather", cost:70, icon:"🐆", tier:3, desc:"Used for crafting." },
  mat_drag_l:     { id:"mat_drag_l", type:"material", name:"Dragon Leather", cost:150, icon:"🐉", tier:4, desc:"Used for crafting." },
  mat_cel_l:      { id:"mat_cel_l",  type:"material", name:"Celestial Leather", cost:300, icon:"✨", tier:5, desc:"Used for crafting." },
  mat_thread:     { id:"mat_thread", type:"material", name:"Thread", cost:5, icon:"🧵", tier:1, desc:"Used for tailoring." },
  mat_silk:       { id:"mat_silk",   type:"material", name:"Silk", cost:20, icon:"🕸️", tier:3, desc:"Used for tailoring." },
  mat_ench_thread:{ id:"mat_ench_thread",type:"material",name:"Enchanted Thread", cost:60, icon:"✨", tier:4, desc:"Used for tailoring." },
  mat_star_thread:{ id:"mat_star_thread",type:"material",name:"Starlight Thread", cost:150, icon:"🌟", tier:5, desc:"Used for tailoring." },
};

const PRODUCTION_SKILLS = {
  farming:    { id:"farming",    name:"Farming",       icon:"🌾", desc:"Grow grains and herbs" },
  ranching:   { id:"ranching",   name:"Ranching",      icon:"🐄", desc:"Raise animals for meat and leather" },
  alchemy:    { id:"alchemy",    name:"Alchemy",       icon:"⚗️", desc:"Brew potions and elixirs" },
  blacksmith: { id:"blacksmith", name:"Blacksmith",    icon:"⚔️", desc:"Forge powerful weapons" },
  tanning:    { id:"tanning",    name:"Tanner",        icon:"🐂", desc:"Process leathers and hides" },
  tailoring:  { id:"tailoring",  name:"Tailor",        icon:"🧵", desc:"Craft armor and cloaks" },
};

const PROD_SKILL_XP_TABLE = [0, 50, 120, 250, 450, 750, 1200, 1900, 3000, 5000];

const PRODUCTION_RECIPES = [
  // Farming
  { id:"prod_wheat", skill:"farming", tier:1, name:"Plant Wheat", resultId:"mat_wheat", resultQty:3, ingredients:[{ id:"mat_wheat_seed", qty:1 }], timeMs:30000, xpGain:5 },
  { id:"prod_herb", skill:"farming", tier:1, name:"Harvest Herbs", resultId:"mat_herb", resultQty:2, ingredients:[{ id:"mat_herb_seed", qty:1 }], timeMs:30000, xpGain:5 },
  { id:"prod_spice", skill:"farming", tier:2, name:"Grow Spices", resultId:"mat_spice", resultQty:2, ingredients:[{ id:"mat_spice_seed", qty:1 }], timeMs:60000, xpGain:12 },
  { id:"prod_magicherb", skill:"farming", tier:3, name:"Magic Garden", resultId:"mat_magic_herb", resultQty:2, ingredients:[{ id:"mat_magic_seed", qty:1 }, { id:"mat_shard", qty:1 }], timeMs:90000, xpGain:25 },
  { id:"prod_goldwheat", skill:"farming", tier:4, name:"Golden Harvest", resultId:"mat_gold_wheat", resultQty:3, ingredients:[{ id:"mat_golden_seed", qty:1 }, { id:"mat_ench_water", qty:1 }], timeMs:120000, xpGain:45 },
  { id:"prod_celestherb", skill:"farming", tier:5, name:"Celestial Garden", resultId:"mat_celest_herb", resultQty:2, ingredients:[{ id:"mat_celest_seed", qty:1 }, { id:"mat_starlight", qty:1 }], timeMs:180000, xpGain:80 },
  // Ranching
  { id:"prod_chicken", skill:"ranching", tier:1, name:"Raise Chickens", resultId:"mat_egg", resultQty:3, extraId:"mat_feather", extraQty:1, ingredients:[{ id:"mat_feed", qty:2 }], timeMs:30000, xpGain:5 },
  { id:"prod_pasture", skill:"ranching", tier:1, name:"Grazing", resultId:"mat_meat", resultQty:2, extraId:"mat_hide", extraQty:1, ingredients:[{ id:"mat_feed", qty:3 }], timeMs:45000, xpGain:5 },
  { id:"prod_milk", skill:"ranching", tier:2, name:"Milking", resultId:"mat_milk", resultQty:3, ingredients:[{ id:"mat_feed", qty:2 }, { id:"mat_bucket", qty:1 }], timeMs:40000, xpGain:12 },
  { id:"prod_hunt", skill:"ranching", tier:3, name:"Exotic Hunting", resultId:"mat_exo_meat", resultQty:2, extraId:"mat_exo_hide", extraQty:1, ingredients:[{ id:"mat_bait", qty:1 }, { id:"mat_trap", qty:1 }], timeMs:90000, xpGain:25 },
  { id:"prod_dragon", skill:"ranching", tier:4, name:"Raise Dragons", resultId:"mat_drag_scale", resultQty:1, extraId:"mat_drag_meat", extraQty:1, ingredients:[{ id:"mat_drag_feed", qty:3 }, { id:"mat_fire_shard", qty:1 }], timeMs:150000, xpGain:45 },
  { id:"prod_phoenix", skill:"ranching", tier:5, name:"Phoenix Ranch", resultId:"mat_phoenix_f", resultQty:1, ingredients:[{ id:"mat_cel_feed", qty:2 }, { id:"mat_ember_ess", qty:1 }], timeMs:180000, xpGain:80 },
  // Alchemy & Cooking (Cooking was moved to Alchemy as well for simplicity, or we keep it as Alchemy)
  { id:"prod_minor_hp", skill:"alchemy", tier:1, name:"Minor Health Potion", resultId:"potion_minor_hp", resultQty:1, ingredients:[{ id:"mat_herb", qty:1 }, { id:"mat_vial", qty:1 }], timeMs:150000, xpGain:5 },
  { id:"prod_major_hp", skill:"alchemy", tier:2, name:"Major Health Potion", resultId:"potion_major_hp", resultQty:1, ingredients:[{ id:"mat_herb", qty:3 }, { id:"mat_shard", qty:1 }, { id:"mat_vial", qty:1 }], timeMs:30000, xpGain:12 },
  { id:"prod_stale_bread", skill:"alchemy", tier:1, name:"Bake Bread", resultId:"food_bread", resultQty:1, ingredients:[{ id:"mat_wheat", qty:2 }], timeMs:30000, xpGain:5 },
  { id:"prod_herb_soup", skill:"alchemy", tier:1, name:"Cook Soup", resultId:"food_soup", resultQty:1, ingredients:[{ id:"mat_herb", qty:2 }, { id:"mat_vial", qty:1 }], timeMs:45000, xpGain:5 },
  { id:"prod_grilled_meat", skill:"alchemy", tier:2, name:"Grill Meat", resultId:"food_meat", resultQty:1, ingredients:[{ id:"mat_meat", qty:1 }, { id:"mat_coal", qty:1 }], timeMs:60000, xpGain:12 },
  { id:"prod_royal_feast", skill:"alchemy", tier:3, name:"Prepare Feast", resultId:"food_feast", resultQty:1, ingredients:[{ id:"mat_meat", qty:2 }, { id:"mat_herb", qty:3 }, { id:"mat_spice", qty:1 }], timeMs:90000, xpGain:25 },
  { id:"prod_elixir_stew", skill:"alchemy", tier:4, name:"Elixir Stew", resultId:"food_elixir", resultQty:1, ingredients:[{ id:"mat_celest_herb", qty:1 }, { id:"mat_gold_wheat", qty:1 }, { id:"mat_vial", qty:1 }], timeMs:120000, xpGain:45 },
  // Blacksmithing
  { id:"prod_iron_dagger", skill:"blacksmith", tier:1, name:"Forge Dagger", resultId:"weap_dagger_craft", resultQty:1, ingredients:[{ id:"mat_iron_ore", qty:3 }, { id:"mat_coal", qty:2 }], timeMs:30000, xpGain:5 },
  { id:"prod_steel_sword", skill:"blacksmith", tier:2, name:"Forge Sword", resultId:"weap_sword_craft", resultQty:1, ingredients:[{ id:"mat_steel_ingot", qty:2 }, { id:"mat_l_strip", qty:1 }], timeMs:60000, xpGain:12 },
  { id:"prod_mithril_blade", skill:"blacksmith", tier:3, name:"Forge Blade", resultId:"weap_blade_craft", resultQty:1, ingredients:[{ id:"mat_mithril_ore", qty:2 }, { id:"mat_shard", qty:2 }], timeMs:90000, xpGain:25 },
  { id:"prod_epic_w", skill:"blacksmith", tier:4, name:"Epic Weapon", resultId:"weap_epic_craft", resultQty:1, ingredients:[{ id:"mat_drag_scale", qty:2 }, { id:"mat_ench_ingot", qty:1 }], timeMs:150000, xpGain:45 },
  { id:"prod_legend_w", skill:"blacksmith", tier:5, name:"Legendary Weapon", resultId:"weap_legend_craft", resultQty:1, ingredients:[{ id:"mat_phoenix_f", qty:1 }, { id:"mat_cel_ingot", qty:1 }, { id:"mat_starlight", qty:1 }], timeMs:240000, xpGain:80 },
  // Tanning
  { id:"prod_tanning_leather", skill:"tanning", tier:1, name:"Tan Leather", resultId:"mat_leather", resultQty:3, ingredients:[{ id:"mat_hide", qty:2 }, { id:"mat_tannin", qty:1 }], timeMs:25000, xpGain:5 },
  { id:"prod_tanning_strip", skill:"tanning", tier:1, name:"Cut Leather Strips", resultId:"mat_l_strip", resultQty:4, ingredients:[{ id:"mat_leather", qty:2 }], timeMs:15000, xpGain:5 },
  { id:"prod_tanning_reinf", skill:"tanning", tier:2, name:"Reinforced Leather", resultId:"mat_reinf_l", resultQty:2, ingredients:[{ id:"mat_leather", qty:3 }, { id:"mat_iron_ore", qty:1 }], timeMs:45000, xpGain:12 },
  { id:"prod_tanning_exo", skill:"tanning", tier:3, name:"Exotic Leather", resultId:"mat_exo_l", resultQty:2, ingredients:[{ id:"mat_exo_hide", qty:2 }, { id:"mat_spice", qty:1 }], timeMs:60000, xpGain:25 },
  { id:"prod_tanning_drag", skill:"tanning", tier:4, name:"Dragon Leather", resultId:"mat_drag_l", resultQty:1, ingredients:[{ id:"mat_drag_scale", qty:1 }, { id:"mat_exo_l", qty:1 }], timeMs:120000, xpGain:45 },
  { id:"prod_tanning_cel", skill:"tanning", tier:5, name:"Celestial Leather", resultId:"mat_cel_l", resultQty:1, ingredients:[{ id:"mat_phoenix_f", qty:1 }, { id:"mat_drag_l", qty:1 }, { id:"mat_starlight", qty:1 }], timeMs:180000, xpGain:80 },
  // Tailoring
  { id:"prod_tailor_vest", skill:"tailoring", tier:1, name:"Sew Vest", resultId:"arm_vest_craft", resultQty:1, ingredients:[{ id:"mat_leather", qty:2 }, { id:"mat_thread", qty:2 }], timeMs:30000, xpGain:5 },
  { id:"prod_tailor_armor", skill:"tailoring", tier:2, name:"Sew Armor", resultId:"arm_armor_craft", resultQty:1, ingredients:[{ id:"mat_reinf_l", qty:2 }, { id:"mat_thread", qty:3 }], timeMs:60000, xpGain:12 },
  { id:"prod_tailor_mantle", skill:"tailoring", tier:3, name:"Sew Cloak", resultId:"arm_mantle_craft", resultQty:1, ingredients:[{ id:"mat_exo_l", qty:2 }, { id:"mat_silk", qty:2 }], timeMs:90000, xpGain:25 },
  { id:"prod_tailor_epic", skill:"tailoring", tier:4, name:"Epic Armor", resultId:"arm_epic_craft", resultQty:1, ingredients:[{ id:"mat_drag_l", qty:1 }, { id:"mat_ench_thread", qty:2 }], timeMs:150000, xpGain:45 },
  // Task Drop Recipes (Smelting, Woodworking, Cooking, Tanning)
  { id:"prod_smelt_iron", skill:"blacksmith", tier:1, name:"Smelt Iron Ore", resultId:"mat_iron_ore", resultQty:2, ingredients:[{ id:"item_ore_iron", qty:2 }], timeMs:15000, xpGain:5 },
  { id:"prod_process_oak", skill:"tanning", tier:1, name:"Process Oak Wood", resultId:"mat_l_strip", resultQty:2, ingredients:[{ id:"item_wood_oak", qty:2 }], timeMs:15000, xpGain:5 },
  { id:"prod_cook_trout", skill:"alchemy", tier:1, name:"Cook Fresh Trout", resultId:"food_soup", resultQty:1, ingredients:[{ id:"item_fish_trout", qty:1 }], timeMs:20000, xpGain:5 },
  { id:"prod_tan_hide", skill:"tanning", tier:1, name:"Tan Monster Hide", resultId:"mat_leather", resultQty:2, ingredients:[{ id:"item_monster_hide", qty:2 }], timeMs:20000, xpGain:5 },
];

const ALL_ITEMS = { ...EXPANDED_ITEMS, ...CLASS_ITEMS, ...CRAFTED_GEAR, ...RING_ITEMS, ...CONSUMABLE_ITEMS, ...FOOD_ITEMS, ...MATERIAL_ITEMS };

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
// HOUSING SYSTEM CONSTANTS
// ================================================================
const HOUSE_TIERS = [
  { tier: 0, name: "No Housing",        slots: 0, maxDecorations: 0,  cost: 0,     icon: "🏕️",
    desc: "You sleep outdoors." },
  { tier: 1, name: "Simple Tent",       slots: 2, maxDecorations: 2,  cost: 100,   icon: "⛺",
    desc: "A modest tent. Room for the basics.", materials: [] },
  { tier: 2, name: "Wooden Cabin",      slots: 4, maxDecorations: 5,  cost: 500,   icon: "🛖",
    desc: "Wooden walls and a solid roof.",
    materials: [{ id:"mat_wood", qty:10 }] },
  { tier: 3, name: "Stone House",       slots: 6, maxDecorations: 8,  cost: 2000,  icon: "🏠",
    desc: "A sturdy house with multiple rooms.",
    materials: [{ id:"mat_stone", qty:15 }, { id:"mat_wood", qty:10 }] },
  { tier: 4, name: "Hero's Mansion",    slots: 8, maxDecorations: 12, cost: 8000,  icon: "🏰",
    desc: "A mansion worthy of legends.",
    materials: [{ id:"mat_stone", qty:25 }, { id:"mat_iron_ore", qty:10 }, { id:"mat_wood", qty:15 }] },
  { tier: 5, name: "Ember Fortress",    slots: 10, maxDecorations: 20, cost: 25000, icon: "🏯",
    desc: "An imposing fortress. The pinnacle of comfort and power.",
    materials: [{ id:"mat_celestial_ingot", qty:3 }, { id:"mat_dragon_scale", qty:5 },
               { id:"mat_stone", qty:30 }, { id:"mat_wood", qty:20 }] },
];

const HOUSE_STATIONS = {
  farm_plot:    { id:"farm_plot",    name:"Farm Plot",         icon:"🌾", skill:"farming",
                  cost:50,   materials:[{id:"mat_wood",qty:5}],     minHouseTier:1 },
  ranch:        { id:"ranch",        name:"Ranch",             icon:"🐄", skill:"ranching",
                  cost:80,   materials:[{id:"mat_wood",qty:8}],     minHouseTier:1 },
  alchemy_lab:  { id:"alchemy_lab",  name:"Alchemy Table",     icon:"⚗️", skill:"alchemy",
                  cost:60,   materials:[{id:"mat_vial",qty:3}],     minHouseTier:1 },
  forge:        { id:"forge",        name:"Forge",             icon:"🔨", skill:"blacksmith",
                  cost:100,  materials:[{id:"mat_iron_ore",qty:5},{id:"mat_coal",qty:3}], minHouseTier:2 },
  tannery:      { id:"tannery",      name:"Tannery",           icon:"🐂", skill:"tanning",
                  cost:70,   materials:[{id:"mat_wood",qty:5},{id:"mat_tannin",qty:3}],   minHouseTier:1 },
  loom:         { id:"loom",         name:"Loom",              icon:"🧵", skill:"tailoring",
                  cost:80,   materials:[{id:"mat_thread",qty:5}],   minHouseTier:2 },
  training_dummy:{ id:"training_dummy",name:"Training Dummy",  icon:"🎯", skill:null,
                  cost:150,  materials:[{id:"mat_wood",qty:10},{id:"mat_leather",qty:5}], minHouseTier:2 },
  kitchen:      { id:"kitchen",      name:"Kitchen",           icon:"🍳", skill:"cooking",
                  cost:60,   materials:[{id:"mat_wood",qty:5}],     minHouseTier:1 },
  rest_bed:     { id:"rest_bed",     name:"Rest Bed",          icon:"🛏️", skill:null,
                  cost:40,   materials:[{id:"mat_leather",qty:3}],  minHouseTier:1 },
  mystic_font:  { id:"mystic_font",  name:"Mystic Font",       icon:"✨", skill:null,
                  cost:200,  materials:[{id:"mat_shard",qty:5}],    minHouseTier:3 },
};

const DECORATIONS = {
  deco_flower_pot:  { id:"deco_flower_pot",  name:"Flower Pot",     icon:"🪴", category:"plants",
                      cost:30, premium:false, bonus:{ type:"hpRegen", value:0.01 } },
  deco_candle:      { id:"deco_candle",      name:"Candelabra",     icon:"🕯️", category:"lighting",
                      cost:50, premium:false, bonus:null },
  deco_dragon_head: { id:"deco_dragon_head", name:"Dragon Head",    icon:"🐉", category:"trophy",
                      cost:0,  premium:false, bonus:null,
                      unlock:"defeat_level_10" },
  deco_golden_throne:{ id:"deco_golden_throne",name:"Golden Throne",icon:"👑", category:"furniture",
                      premiumCost:50, premium:true, bonus:null },
  deco_fireplace:   { id:"deco_fireplace",   name:"Ember Fireplace",icon:"🔥", category:"furniture",
                      premiumCost:30, premium:true, bonus:null },
  deco_portal:      { id:"deco_portal",      name:"Dimensional Portal",icon:"🌀", category:"magic",
                      premiumCost:100, premium:true, bonus:null },
  deco_hero_statue: { id:"deco_hero_statue", name:"Hero Statue",    icon:"🗽", category:"trophy",
                      premiumCost:75, premium:true, bonus:null },
};

const DECO_UNLOCKS = {
  "defeat_level_10":  { decoId:"deco_dragon_head", desc:"Defeat the Chaos Knight (Level 10)" },
};

// ================================================================
// PREMIUM CONFIGURATION
// ================================================================
const PREMIUM_BONUSES = {
  hpRegenMult:       2.0,   // 2x regen (0.5% → 1.0%)
  staminaRegenMs:    7000,  // 7s instead of 10s
  extraProdSlots:    2,
  prodTimeMult:      0.80,  // 20% faster
  inventorySlots:    50,    // vs 30
  autoCollect:       true,
  goldMult:          1.15,  // +15%
  xpMult:            1.10,  // +10%
  lootDropChance:    0.52,  // vs 0.45
  materialDropChance:0.70,  // vs 0.60
  extraDecoSlots:    5,
  premiumBadge:      true,
  dailyGems:         1,
};

const PREMIUM_LIMITS = {
  stamina_refill: { maxPerDay: 3 },
  hp_restore:     { maxPerDay: 5 },
  prod_skip:      { maxPerDay: 10 },
  second_chance:  { maxPerBattle: 1 },
};

const ACHIEVEMENTS = [
  { id:"ach_boss_1",     name:"Chaos Knight Slayer", gems:10, condition:"defeat_level_10" },
  { id:"ach_boss_2",     name:"Storm Conqueror",     gems:15, condition:"defeat_level_20" },
  { id:"ach_boss_3",     name:"Ember King Vanquished",gems:20, condition:"defeat_level_30" },
  { id:"ach_level_5",    name:"Rising Hero",         gems:10, condition:"reach_level_5" },
  { id:"ach_level_10",   name:"Veteran",             gems:10, condition:"reach_level_10" },
  { id:"ach_level_20",   name:"Champion",            gems:10, condition:"reach_level_20" },
  { id:"ach_level_30",   name:"Legend",              gems:10, condition:"reach_level_30" },
  { id:"ach_craft_10",   name:"Apprentice Crafter",  gems:5,  condition:"craft_10_items" },
  { id:"ach_craft_100",  name:"Master Crafter",      gems:15, condition:"craft_100_items" },
  { id:"ach_siege_win",  name:"Fortress Breaker",    gems:5,  condition:"win_siege" },
  { id:"ach_clan_create",name:"Clan Founder",        gems:5,  condition:"create_clan" },
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
  gems: 0,
  isPremium: false,
  premiumExpiry: null,
  totalGemsSpent: 0,
  loginStreak: 0,
  lastLoginDate: null,
  achievements: [],
  premiumUsage: {}, // Tracks daily usages for limits
  unlockedLevel: 1,
  stamina: 100,
  lastStaminaUpdate: Date.now(),
  maxMana: 50,
  skillPoints: 0,
  stats: { maxHp:100, power:10, defense:5, critChance:0.05, critDamage:1.5, dodgeChance:0.05 },
  currentHp: 100,
  upgrades: { hp: 0, power: 0, defense: 0, crit: 0, dodge: 0, mana: 0, hpLevel: 0, powerLevel: 0, defenseLevel: 0 },
  equipment: { weapon:null, armor:null, ring:null },
  inventory: [],
  completedSideZones: [],
  dungeonProgress: {},
  productionSkills: {
    farming:    { level: 1, xp: 0 },
    ranching:   { level: 1, xp: 0 },
    alchemy:    { level: 1, xp: 0 },
    blacksmith: { level: 1, xp: 0 },
    tanning:    { level: 1, xp: 0 },
    tailoring:  { level: 1, xp: 0 },
  },
  productionTimers: [],
  house: {
    tier: 0,
    name: "No Housing",
    slots: [],              // [{ id:"farm_plot", stationTier:1, instanceId: "id1" }, ...]
    decorations: [],        // [{ id:"deco_flower_pot", instanceId: "id1" }, ...]
    unlockedDecorations: [],
    registeredRegion: null, // "greenhollow", "frosthold", etc.
  },
  clan: null, // { id, name, role } or null
  pets: [],           // Collection: [{ id, speciesId, name, level, xp, stage, happiness, lastFed }]
  activePet: null,    // Active pet ID in battle
  hatchingEgg: null,  // { eggId, startTime, endTime } or null
  petStable: 6,       // Maximum pets in the collection
};

// ================================================================
// MODULE-LEVEL STATE
// ================================================================
let playerState = {};
window.playerState = playerState;
let activeBattleInterval = null;
let pendingLoot = null;
let staminaInterval = null;

// ================================================================
// PREMIUM HELPER FUNCTIONS
// ================================================================
function isPremiumActive() {
  return playerState.isPremium && playerState.premiumExpiry > Date.now();
}

function getPremiumBonus(key) {
  if (!isPremiumActive()) return null;
  return PREMIUM_BONUSES[key];
}

function addGems(amount) {
  playerState.gems = (playerState.gems || 0) + amount;
  if (typeof renderStats === "function") renderStats();
}

function spendGems(amount) {
  if ((playerState.gems || 0) < amount) return false;
  playerState.gems -= amount;
  playerState.totalGemsSpent = (playerState.totalGemsSpent || 0) + amount;
  if (typeof renderStats === "function") renderStats();
  return true;
}

function canUsePremiumConsumable(itemId) {
  const limit = PREMIUM_LIMITS[itemId];
  if (!limit) return true;
  
  const today = new Date().toDateString();
  if (!playerState.premiumUsage) playerState.premiumUsage = {};
  if (!playerState.premiumUsage[today]) playerState.premiumUsage[today] = {};
  
  const usage = playerState.premiumUsage[today][itemId] || 0;
  return usage < (limit.maxPerDay || Infinity);
}

function recordPremiumConsumableUsage(itemId) {
  const today = new Date().toDateString();
  if (!playerState.premiumUsage) playerState.premiumUsage = {};
  if (!playerState.premiumUsage[today]) playerState.premiumUsage[today] = {};
  playerState.premiumUsage[today][itemId] = (playerState.premiumUsage[today][itemId] || 0) + 1;
}

function checkAchievements(triggerType, data) {
  if (!playerState.achievements) playerState.achievements = [];
  let changed = false;

  ACHIEVEMENTS.forEach(ach => {
    if (playerState.achievements.includes(ach.id)) return; // Already unlocked

    let unlocked = false;
    if (triggerType === "level_up") {
      if (ach.condition === "reach_level_5" && playerState.level >= 5) unlocked = true;
      if (ach.condition === "reach_level_10" && playerState.level >= 10) unlocked = true;
      if (ach.condition === "reach_level_20" && playerState.level >= 20) unlocked = true;
      if (ach.condition === "reach_level_30" && playerState.level >= 30) unlocked = true;
    }
    if (triggerType === "battle_win") {
      if (ach.condition === "defeat_level_10" && data.levelId === 10) unlocked = true;
      if (ach.condition === "defeat_level_20" && data.levelId === 20) unlocked = true;
      if (ach.condition === "defeat_level_30" && data.levelId === 30) unlocked = true;
    }
    if (triggerType === "craft") {
      if (!playerState.stats.itemsCrafted) playerState.stats.itemsCrafted = 0;
      if (ach.condition === "craft_10_items" && playerState.stats.itemsCrafted >= 10) unlocked = true;
      if (ach.condition === "craft_100_items" && playerState.stats.itemsCrafted >= 100) unlocked = true;
    }
    if (triggerType === "siege" && ach.condition === "win_siege") unlocked = true;
    if (triggerType === "clan" && ach.condition === "create_clan") unlocked = true;

    if (unlocked) {
      playerState.achievements.push(ach.id);
      addGems(ach.gems);
      showToast(`🏆 Achievement: ${ach.name}! +${ach.gems} 💎`, "success");
      changed = true;
    }
  });

  if (changed) savePlayerState();
}

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
let petCooldown = 0;
let activePetData = null;

// Settings
let gameSettings = { sound: true, autoEquip: false };

// ================================================================
// INIT
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  initTabs();
  initShopTabs();
  initMapTabs();
  initSocialTabs();
  
  if (typeof initializeBotClans === "function") initializeBotClans();
  if (typeof initializeFortresses === "function") initializeFortresses();
  if (typeof simulateWeeklySiege === "function") simulateWeeklySiege();
  loadPlayerState();
  renderMap();
  renderStats();
  renderShop();
  renderInventory();
  renderSkills();
  renderMaterials();
  renderProfessions();
  renderSkillRecipes(selectedProfession);
  renderProductionQueue();
  initUpgradeButtons();
  initShopButtons();
  initBattleModalControls();
  initClassSelectionControls();
  initInventoryControls();
  initSkillsTabControls();
  initCompareModalControls();
  initSettingsModal();
  initSkillPointModal();
  initHouseControls();
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

      if (btn.dataset.tab === "character-tab") {
        renderStats();
        renderInventory();
        if (typeof renderPaperdollGrid === "function") renderPaperdollGrid();
      } else if (btn.dataset.tab === "shop-tab") {
        renderShop();
      } else if (btn.dataset.tab === "forge-tab") {
        if (typeof renderProfessions === "function") renderProfessions();
      } else if (btn.dataset.tab === "garrison-tab") {
        if (typeof renderGarrisonPanel === "function") renderGarrisonPanel();
      } else if (btn.dataset.tab === "world-tab") {
        if (typeof renderWorldRiftPanel === "function") renderWorldRiftPanel();
      }
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

function initMapTabs() {
  const wBtn = document.getElementById("btn-world-map");
  const cBtn = document.getElementById("btn-campaign-map");
  const dBtn = document.getElementById("btn-dungeon-map");
  const wView = document.getElementById("world-map-view");
  const cView = document.getElementById("campaign-map-view");
  const dView = document.getElementById("dungeon-map-view");
  
  if (wBtn && cBtn) {
    wBtn.addEventListener("click", () => {
      wBtn.classList.add("active"); cBtn.classList.remove("active"); if (dBtn) dBtn.classList.remove("active");
      wView.classList.add("active"); wView.style.display = "";
      cView.classList.remove("active"); cView.style.display = "none";
      if (dView) { dView.classList.remove("active"); dView.style.display = "none"; }
    });
    cBtn.addEventListener("click", () => {
      cBtn.classList.add("active"); wBtn.classList.remove("active"); if (dBtn) dBtn.classList.remove("active");
      cView.classList.add("active"); cView.style.display = "";
      wView.classList.remove("active"); wView.style.display = "none";
      if (dView) { dView.classList.remove("active"); dView.style.display = "none"; }
    });
    if (dBtn) {
      dBtn.addEventListener("click", () => {
        dBtn.classList.add("active"); wBtn.classList.remove("active"); cBtn.classList.remove("active");
        if (dView) { dView.classList.add("active"); dView.style.display = ""; }
        wView.classList.remove("active"); wView.style.display = "none";
        cView.classList.remove("active"); cView.style.display = "none";
        if (typeof renderDungeonSelector === "function") renderDungeonSelector();
      });
    }
  }
}

function initSocialTabs() {
  document.querySelectorAll(".social-tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const container = e.currentTarget.closest(".modal-body, #social-tab");
      
      // Whether from the Village or Social modal
      const groupBtns = container.querySelectorAll(".social-tab-btn");
      groupBtns.forEach(b => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      
      if (e.currentTarget.dataset.stab) {
        container.querySelectorAll(".social-sub-tab").forEach(c => { c.classList.remove("active"); c.style.display = "none"; });
        const target = container.querySelector(`#stab-${e.currentTarget.dataset.stab}`);
        if(target) { target.classList.add("active"); target.style.display = ""; }
      }
      
      if (e.currentTarget.dataset.vtab) {
        container.querySelectorAll(".social-sub-tab").forEach(c => { c.classList.remove("active"); c.style.display = "none"; });
        const target = container.querySelector(`#vtab-${e.currentTarget.dataset.vtab}`);
        if(target) { target.classList.add("active"); target.style.display = ""; }
      }
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
  if (list) {
    list.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const itemId = btn.dataset.item;
      const idx = parseInt(btn.dataset.index, 10);
      if (btn.classList.contains("btn-equip")) {
        equipItemFromInventory(itemId, idx);
      } else if (btn.classList.contains("btn-sell-all")) {
        sellAllStackFromInventory(itemId, idx);
      } else if (btn.classList.contains("btn-sell")) {
        sellItemFromInventory(itemId, idx);
      } else if (btn.classList.contains("btn-use")) {
        useConsumableFromInventory(itemId, idx);
      }
    });
  }

  const bulkSellBtn = document.getElementById("btn-bulk-sell-modal");
  if (bulkSellBtn) {
    bulkSellBtn.addEventListener("click", () => {
      showBulkSellModal();
    });
  }
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
function initHouseControls() {
  const cHouse = document.getElementById("close-house-modal-btn");
  if (cHouse) cHouse.addEventListener("click", () => document.getElementById("house-modal").classList.remove("active"));
  
  const cInstall = document.getElementById("close-install-modal-btn");
  if (cInstall) cInstall.addEventListener("click", () => document.getElementById("station-install-modal").classList.remove("active"));
  
  const cDeco = document.getElementById("close-decoration-shop-btn");
  if (cDeco) cDeco.addEventListener("click", () => document.getElementById("decoration-shop-modal").classList.remove("active"));
  
  const tabSt = document.getElementById("deco-tab-standard");
  const tabPr = document.getElementById("deco-tab-premium");
  if (tabSt) tabSt.addEventListener("click", () => renderDecorationShop("standard"));
  if (tabPr) tabPr.addEventListener("click", () => renderDecorationShop("premium"));
}

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
  let resetConfirmTimeout = null;
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (resetBtn.dataset.confirming === "true") {
        clearTimeout(resetConfirmTimeout);
        resetBtn.dataset.confirming = "false";
        resetBtn.textContent = "🗑️ Reset All Progress";
        window.resetGame();
        modal.classList.remove("active");
      } else {
        resetBtn.dataset.confirming = "true";
        resetBtn.textContent = "⚠️ Confirm Reset?";
        resetConfirmTimeout = setTimeout(() => {
          resetBtn.dataset.confirming = "false";
          resetBtn.textContent = "🗑️ Reset All Progress";
        }, 3000);
      }
    });
  }

  let newCharConfirmTimeout = null;
  if (newCharBtn) {
    newCharBtn.addEventListener("click", () => {
      if (newCharBtn.dataset.confirming === "true") {
        clearTimeout(newCharConfirmTimeout);
        newCharBtn.dataset.confirming = "false";
        newCharBtn.textContent = "🧙 New Character";
        window.newCharacter();
        modal.classList.remove("active");
      } else {
        newCharBtn.dataset.confirming = "true";
        newCharBtn.textContent = "⚠️ Confirm New Hero?";
        newCharConfirmTimeout = setTimeout(() => {
          newCharBtn.dataset.confirming = "false";
          newCharBtn.textContent = "🧙 New Character";
        }, 3000);
      }
    });
  }
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
  playerState = JSON.parse(JSON.stringify(DEFAULT_PLAYER_STATE));
  if (typeof AccountStore !== "undefined") {
    const activeChar = AccountStore.getActiveCharacter();
    if (activeChar) {
      playerState.name = activeChar.name || "Hero";
      playerState.class = activeChar.class || null;
      playerState.level = activeChar.level || 1;
      playerState.xp = activeChar.xp || activeChar.exp || 0;
      playerState.xpNeeded = getRequiredXpForLevel(playerState.level);
      playerState.gold = activeChar.gold !== undefined ? activeChar.gold : 50;
      playerState.gems = activeChar.gems !== undefined ? activeChar.gems : 0;
      playerState.stamina = activeChar.stamina !== undefined ? activeChar.stamina : 100;
      playerState.unlockedLevel = activeChar.unlockedLevel || activeChar.unlocked_level || 1;
      playerState.completedSideZones = Array.isArray(activeChar.completedSideZones) ? activeChar.completedSideZones : [];
      playerState.dungeonProgress = activeChar.dungeonProgress || activeChar.dungeon_progress || {};
      playerState.inventory = Array.isArray(activeChar.inventory) ? JSON.parse(JSON.stringify(activeChar.inventory)) : [];
      playerState.equipment = activeChar.equipped ? JSON.parse(JSON.stringify(activeChar.equipped)) : { weapon: null, armor: null, ring: null };
    }
  }

  if (!playerState.completedSideZones) playerState.completedSideZones = [];
  if (!playerState.dungeonProgress) playerState.dungeonProgress = {};
  if (!playerState.maxMana) playerState.maxMana = CLASS_PRESETS[playerState.class]?.mana || 50;

  if (playerState.class) {
    recoverOfflineStamina();
    recoverOfflineProduction();
    if (typeof updatePetHappiness === 'function') updatePetHappiness();
    startStaminaTicker();
    startProductionTicker();
    checkDailyLogin();
  }
  checkClassSelection();
}

window.renderActiveCharacterUI = function() {
  if (typeof AccountStore === "undefined") return;
  const activeChar = AccountStore.getActiveCharacter();
  if (!activeChar) return;

  // Synchronize playerState strictly from active character slot
  playerState.name = activeChar.name || "Hero";
  playerState.class = activeChar.class || null;
  playerState.level = activeChar.level || 1;
  playerState.xp = activeChar.xp || activeChar.exp || 0;
  playerState.xpNeeded = getRequiredXpForLevel(playerState.level);
  const maxStam = getMaxStamina(playerState.level || 1);
  playerState.stamina = (typeof activeChar.stamina === "number" && !isNaN(activeChar.stamina) && activeChar.stamina !== null) ? activeChar.stamina : maxStam;
  playerState.gold = activeChar.gold !== undefined ? activeChar.gold : 50;
  playerState.gems = activeChar.gems !== undefined ? activeChar.gems : 0;
  playerState.skillPoints = activeChar.skillPoints !== undefined ? activeChar.skillPoints : (activeChar.skill_points || 0);
  const rawUpgrades = activeChar.allocatedStats || activeChar.allocated_stats || activeChar.upgrades || {};
  playerState.upgrades = {
    hp: Number(rawUpgrades.hp ?? rawUpgrades.hpLevel ?? 0),
    power: Number(rawUpgrades.power ?? rawUpgrades.powerLevel ?? 0),
    defense: Number(rawUpgrades.defense ?? rawUpgrades.defenseLevel ?? 0),
    crit: Number(rawUpgrades.crit ?? 0),
    dodge: Number(rawUpgrades.dodge ?? 0),
    mana: Number(rawUpgrades.mana ?? 0),
    hpLevel: Number(rawUpgrades.hpLevel ?? rawUpgrades.hp ?? 0),
    powerLevel: Number(rawUpgrades.powerLevel ?? rawUpgrades.power ?? 0),
    defenseLevel: Number(rawUpgrades.defenseLevel ?? rawUpgrades.defense ?? 0)
  };
  if (activeChar.house) {
    playerState.house = JSON.parse(JSON.stringify(activeChar.house));
  }
  const savedDungeon = activeChar.dungeonProgress || activeChar.dungeon_progress || {};
  const currentDungeon = playerState.dungeonProgress || {};
  playerState.dungeonProgress = { ...savedDungeon, ...currentDungeon };
  activeChar.dungeonProgress = playerState.dungeonProgress;
  activeChar.dungeon_progress = playerState.dungeonProgress;
  const savedUnlocked = activeChar.unlockedLevel || activeChar.unlocked_level || playerState.unlockedLevel || 1;
  playerState.unlockedLevel = Math.max(playerState.unlockedLevel || 1, savedUnlocked);
  const savedSide = Array.isArray(activeChar.completedSideZones) ? activeChar.completedSideZones : [];
  const currentSide = Array.isArray(playerState.completedSideZones) ? playerState.completedSideZones : [];
  playerState.completedSideZones = Array.from(new Set([...currentSide, ...savedSide]));
  playerState.maxMana = activeChar.maxMana || activeChar.mana || 50;
  playerState.inventory = Array.isArray(activeChar.inventory) ? JSON.parse(JSON.stringify(activeChar.inventory)) : [];
  playerState.equipment = activeChar.equipped ? JSON.parse(JSON.stringify(activeChar.equipped)) : { weapon: null, armor: null, ring: null };

  if (activeChar.power || activeChar.defense || activeChar.maxHp || playerState.upgrades) {
    const preset = CLASS_PRESETS[playerState.class] || CLASS_PRESETS["Warrior"];
    const hpLvl = playerState.upgrades.hp || 0;
    const pwrLvl = playerState.upgrades.power || 0;
    const defLvl = playerState.upgrades.defense || 0;
    const critLvl = playerState.upgrades.crit || 0;
    const dodgeLvl = playerState.upgrades.dodge || 0;
    const manaLvl = playerState.upgrades.mana || 0;

    const calculatedMaxHp = (preset ? preset.stats.maxHp : 100) + (hpLvl * 10);
    const calculatedPower = (preset ? preset.stats.power : 10) + (pwrLvl * 2);
    const calculatedDefense = (preset ? preset.stats.defense : 5) + (defLvl * 1);
    const calculatedCrit = 0.05 + (critLvl * 0.01);
    const calculatedDodge = 0.05 + (dodgeLvl * 0.01);
    const calculatedMana = (preset ? (preset.mana || preset.stats.maxMana || 50) : 50) + (manaLvl * 10);

    const baseMaxHp = Math.max(calculatedMaxHp, activeChar.maxHp || 0);
    const basePower = Math.max(calculatedPower, activeChar.power || 0);
    const baseDefense = Math.max(calculatedDefense, activeChar.defense || 0);

    playerState.stats = {
      maxHp: baseMaxHp,
      power: basePower,
      defense: baseDefense,
      critChance: Math.max(calculatedCrit, Number(activeChar.critChance || 0.05)),
      critDamage: Number(activeChar.critDamage || 1.5),
      dodgeChance: Math.max(calculatedDodge, Number(activeChar.dodgeChance || 0.05))
    };
    playerState.maxMana = Math.max(calculatedMana, activeChar.maxMana || activeChar.mana || 50);
    const effStats = getEffectiveStats();
    playerState.currentHp = Math.min(effStats.maxHp, typeof activeChar.hp === "number" && activeChar.hp > 0 ? activeChar.hp : effStats.maxHp);
  }

  // Update overlay display for class selection
  const classModal = document.getElementById("class-selection-modal");
  if (classModal) {
    if (playerState.class) {
      classModal.style.display = "none";
      classModal.classList.remove("active");
    } else {
      classModal.style.display = "flex";
      classModal.classList.add("active");
    }
  }

  if (typeof renderStats === "function") renderStats();
  if (typeof renderInventory === "function") renderInventory();
  if (typeof renderPaperdollGrid === "function") renderPaperdollGrid();
  if (typeof renderWorldMap === "function") renderWorldMap();
  if (typeof renderCampaignMap === "function") renderCampaignMap();
};

function savePlayerState() {
  localStorage.setItem("rpg_player_state", JSON.stringify(playerState));
  if (typeof AccountStore !== "undefined") {
    const activeChar = AccountStore.getActiveCharacter();
    if (activeChar) {
      activeChar.name = playerState.name;
      activeChar.class = playerState.class;
      activeChar.level = playerState.level;
      activeChar.xp = playerState.xp;
      activeChar.maxXp = playerState.xpNeeded;
      activeChar.gold = playerState.gold;
      activeChar.gems = playerState.gems;
      activeChar.stamina = playerState.stamina;
      activeChar.skillPoints = playerState.skillPoints || 0;
      activeChar.skill_points = playerState.skillPoints || 0;
      const upgObj = {
        hp: playerState.upgrades?.hp ?? playerState.upgrades?.hpLevel ?? 0,
        power: playerState.upgrades?.power ?? playerState.upgrades?.powerLevel ?? 0,
        defense: playerState.upgrades?.defense ?? playerState.upgrades?.defenseLevel ?? 0,
        crit: playerState.upgrades?.crit ?? 0,
        dodge: playerState.upgrades?.dodge ?? 0,
        mana: playerState.upgrades?.mana ?? 0,
        hpLevel: playerState.upgrades?.hpLevel ?? playerState.upgrades?.hp ?? 0,
        powerLevel: playerState.upgrades?.powerLevel ?? playerState.upgrades?.power ?? 0,
        defenseLevel: playerState.upgrades?.defenseLevel ?? playerState.upgrades?.defense ?? 0
      };
      activeChar.allocatedStats = upgObj;
      activeChar.allocated_stats = upgObj;
      activeChar.upgrades = upgObj;
      activeChar.maxMana = playerState.maxMana;
      activeChar.house = playerState.house || { tier: 0, name: "No Housing", slots: [], decorations: [] };
      activeChar.dungeonProgress = playerState.dungeonProgress || {};
      activeChar.dungeon_progress = playerState.dungeonProgress || {};
      activeChar.unlockedLevel = playerState.unlockedLevel || 1;
      activeChar.completedSideZones = playerState.completedSideZones || [];
      activeChar.inventory = playerState.inventory;
      activeChar.equipped = playerState.equipment || activeChar.equipped;
      if (playerState.stats) {
        activeChar.power = playerState.stats.power;
        activeChar.defense = playerState.stats.defense;
        activeChar.maxHp = playerState.stats.maxHp;
        activeChar.critChance = playerState.stats.critChance;
        activeChar.dodgeChance = playerState.stats.dodgeChance;
      }
      activeChar.hp = playerState.currentHp;
      AccountStore.save();
    }
  }

  if (typeof renderLootFilterSettings === "function") renderLootFilterSettings();
  if (typeof renderDifficultySelector === "function") renderDifficultySelector();
  if (typeof renderTaskQueuePanel === "function") renderTaskQueuePanel();
  if (typeof renderSeasonalPortal === "function") renderSeasonalPortal();
  if (typeof UIManager !== "undefined" && UIManager.renderCommandCenter) UIManager.renderCommandCenter();
}

function checkDailyLogin() {
  const today = new Date().toDateString();
  if (playerState.lastLoginDate !== today) {
    if (!playerState.loginStreak) playerState.loginStreak = 0;
    
    // Check if it's the next day, otherwise reset streak
    const lastDate = playerState.lastLoginDate ? new Date(playerState.lastLoginDate) : null;
    const isNextDay = lastDate && (new Date() - lastDate) < 2 * 24 * 60 * 60 * 1000;
    
    if (isNextDay || !lastDate) {
      playerState.loginStreak++;
    } else {
      playerState.loginStreak = 1; // Missed a day, back to 1
    }
    
    // Show modal
    setTimeout(() => {
      document.getElementById("daily-reward-streak").innerHTML = `Current Streak: <strong style="color:var(--ember);">${playerState.loginStreak} Days</strong>`;
      
      let amount = 1;
      if (playerState.loginStreak % 7 === 0) amount = 5;
      if (playerState.isPremium) amount += PREMIUM_BONUSES.dailyGems;
      
      document.getElementById("daily-reward-amount").innerHTML = `+${amount} Gem${amount > 1 ? 's' : ''} Today!`;
      
      // Store amount in a temporary global variable to be claimed
      window._pendingDailyGems = amount;
      
      document.getElementById("daily-reward-modal").classList.add("active");
    }, 1000);
  }
}

function claimDailyReward() {
  const amount = window._pendingDailyGems || 1;
  addGems(amount);
  playerState.lastLoginDate = new Date().toDateString();
  savePlayerState();
  document.getElementById("daily-reward-modal").classList.remove("active");
  showToast(`You received ${amount} Gems for daily login!`, "success");
}

function triggerStateUpdateEvent() {
  window.dispatchEvent(new CustomEvent("playerStateUpdated", { detail: playerState }));
}

function recoverOfflineStamina() {
  const now = Date.now();
  const elapsed = now - (playerState.lastStaminaUpdate || now);
  const maxStam = getMaxStamina(playerState.level);
  const effStats = getEffectiveStats();
  
  const regenMs = isPremiumActive() ? PREMIUM_BONUSES.staminaRegenMs : STAMINA_REGEN_MS;
  const hpRegMult = isPremiumActive() ? PREMIUM_BONUSES.hpRegenMult : 1.0;
  
  if (elapsed > 0) {
    const recovered = Math.floor(elapsed / regenMs);
    if (recovered > 0) {
      playerState.stamina = Math.min(maxStam, playerState.stamina + recovered);
      
      const hpRegenRate = Math.max(2, Math.round(effStats.maxHp * 0.02 * hpRegMult));
      if (playerState.currentHp < effStats.maxHp) {
        playerState.currentHp = Math.min(effStats.maxHp, (playerState.currentHp || effStats.maxHp) + (hpRegenRate * recovered));
      }
      
      playerState.lastStaminaUpdate += recovered * regenMs;
      savePlayerState();
    }
  }
}

function startStaminaTicker() {
  if (staminaInterval) clearInterval(staminaInterval);
  const regenMs = isPremiumActive() ? PREMIUM_BONUSES.staminaRegenMs : STAMINA_REGEN_MS;
  const hpRegMult = isPremiumActive() ? PREMIUM_BONUSES.hpRegenMult : 1.0;
  
  staminaInterval = setInterval(() => {
    if (!playerState.class) return;
    const maxStam = getMaxStamina(playerState.level);
    const effStats = getEffectiveStats();
    let changed = false;

    const currentStam = (typeof playerState.stamina === "number" && !isNaN(playerState.stamina) && playerState.stamina !== null) ? playerState.stamina : maxStam;
    if (currentStam < maxStam) {
      playerState.stamina = currentStam + 1;
      changed = true;
    } else if (playerState.stamina !== currentStam) {
      playerState.stamina = currentStam;
      changed = true;
    }
    if (playerState.currentHp < effStats.maxHp) {
      const houseInfo = getHouseInfo();
      const totalHpRegenMult = houseInfo.hpRegenBonus * hpRegMult;
      const hpRegenRate = Math.max(2, Math.round(effStats.maxHp * 0.02 * totalHpRegenMult));
      playerState.currentHp = Math.min(effStats.maxHp, (playerState.currentHp || effStats.maxHp) + hpRegenRate);
      changed = true;
    }
    
    if (typeof updatePetHappiness === 'function') updatePetHappiness();
    
    // Training Dummy XP
    if (playerState.house && playerState.house.slots) {
      const dummies = playerState.house.slots.filter(s => s.id === "training_dummy");
      if (dummies.length > 0) {
        let xpGained = 0;
        dummies.forEach(dummy => {
          xpGained += [0, 1, 3, 8][dummy.stationTier] || 1;
        });
        playerState.xp += xpGained;
        
        while (playerState.xp >= playerState.xpNeeded) {
          playerState.xp -= playerState.xpNeeded;
          playerState.level++;
          playerState.xpNeeded = Math.floor(100 * Math.pow(1.5, playerState.level - 1));
          playerState.skillPoints++;
          playerState.stamina = getMaxStamina(playerState.level);
          playerState.currentHp = getEffectiveStats().maxHp;
          if (typeof playSound === "function") playSound("level_up");
          if (typeof showToast === "function") showToast(`Level Up! You reached Level ${playerState.level}!`, "success");
          changed = true;
        }
      }
    }
    
    if (changed) {
      playerState.lastStaminaUpdate = Date.now();
      savePlayerState();
      renderStats();
    }
  }, regenMs);
}


// ── PRODUCTION ENGINE ──
let productionInterval = null;

function startProductionTicker() {
  if (productionInterval) clearInterval(productionInterval);
  productionInterval = setInterval(() => {
    if (!playerState.class) return;
    checkProductionTimers();
  }, 1000); // Check every second
}

function addToInventory(itemId, qty = 1) {
  if (!playerState.inventory) playerState.inventory = [];
  let itemObj = playerState.inventory.find(i => i.id === itemId || i.item_id === itemId);
  if (itemObj) {
    itemObj.qty = (itemObj.qty || 1) + qty;
  } else {
    const itemDef = ALL_ITEMS[itemId];
    itemObj = {
      id: itemId,
      item_id: itemId,
      name: itemDef?.name || itemId,
      type: itemDef?.type || "material",
      icon: itemDef?.icon || "📦",
      qty: qty
    };
    playerState.inventory.push(itemObj);
  }
  savePlayerState();
  const activeChar = typeof AccountStore !== "undefined" ? AccountStore.getActiveCharacter() : null;
  if (activeChar && typeof activeChar.id === "string" && activeChar.id.includes("-")) {
    syncInventoryItemToDB(activeChar.id, itemObj);
  }
  if (typeof renderInventory === "function") renderInventory();
  if (typeof renderProfessions === "function") renderProfessions();
  if (typeof renderSkillRecipes === "function" && typeof selectedProfession !== "undefined") renderSkillRecipes(selectedProfession);
}

function removeFromInventory(itemId, qty = 1) {
  if (!playerState.inventory) return;
  const idx = playerState.inventory.findIndex(i => i.id === itemId || i.item_id === itemId);
  if (idx !== -1) {
    const item = playerState.inventory[idx];
    const currentQty = item.qty || 1;
    const newQty = currentQty > qty ? currentQty - qty : 0;
    if (newQty > 0) {
      item.qty = newQty;
    } else {
      playerState.inventory.splice(idx, 1);
    }
    savePlayerState();
    const activeChar = typeof AccountStore !== "undefined" ? AccountStore.getActiveCharacter() : null;
    if (activeChar && typeof activeChar.id === "string" && activeChar.id.includes("-")) {
      syncInventoryItemToDB(activeChar.id, { id: itemId, qty: newQty });
    }
  }
  if (typeof renderInventory === "function") renderInventory();
  if (typeof renderProfessions === "function") renderProfessions();
  if (typeof renderSkillRecipes === "function" && typeof selectedProfession !== "undefined") renderSkillRecipes(selectedProfession);
}

function startProduction(recipeId) {
  const recipe = PRODUCTION_RECIPES.find(r => r.id === recipeId);
  if (!recipe) return;

  // Check capacity (e.g. max 3 slots + Premium)
  const maxSlots = 3 + (isPremiumActive() ? PREMIUM_BONUSES.extraProdSlots : 0);
  if (playerState.productionTimers.length >= maxSlots) {
    showToast(`Production queue is full (Max ${maxSlots}).`, "error");
    return;
  }

  // Check ingredients
  const missingIngredients = [];
  for (const ing of recipe.ingredients) {
    const currentQty = typeof getMaterialQty === "function" ? getMaterialQty(ing.id) : (playerState.inventory.find(i => i.id === ing.id)?.qty || 0);
    if (currentQty < ing.qty) {
      missingIngredients.push(ing);
    }
  }

  if (missingIngredients.length > 0) {
    if (typeof promptQuickBuyForAction === "function") {
      promptQuickBuyForAction({
        actionTitle: recipe.name,
        actionDesc: `Craft ${recipe.name} requiring missing materials.`,
        requiredMaterials: recipe.ingredients,
        baseCost: 0,
        onConfirm: () => startProduction(recipeId)
      });
    } else {
      showToast("Not enough materials.", "error");
    }
    return;
  }

  // Consume ingredients
  for (const ing of recipe.ingredients) {
    removeFromInventory(ing.id, ing.qty);
  }

  // Calculate time reduction based on skill level (max 50%) and house stations
  const rawSkill = (playerState.productionSkills && playerState.productionSkills[recipe.skill]) || (playerState.professions && playerState.professions[recipe.skill]);
  const skillLvl = Math.max(1, rawSkill?.level || 1);
  let reduction = Math.min(0.5, skillLvl * 0.02);
  
  const stationSpeedBonus = typeof getStationSpeedBonus === "function" ? getStationSpeedBonus(recipe.skill) : 0;
  reduction += stationSpeedBonus;

  const baseMs = recipe.timeMs || recipe.baseTime || 30000;
  let finalTimeMs = Math.max(2000, baseMs * (1 - reduction));
  if (typeof isPremiumActive === "function" && isPremiumActive()) {
    finalTimeMs = Math.floor(finalTimeMs * PREMIUM_BONUSES.prodTimeMult);
  }

  playerState.productionTimers.push({
    recipeId: recipe.id,
    startTime: Date.now(),
    endTime: Date.now() + finalTimeMs,
    duration: finalTimeMs
  });

  savePlayerState();
  if (typeof renderProductionQueue === "function") renderProductionQueue();
}

function checkProductionTimers() {
  if (typeof checkHatchingTimer === 'function') checkHatchingTimer();
  if (!playerState.productionTimers || playerState.productionTimers.length === 0) return;
  const now = Date.now();
  let completedAny = false;

  // Iterate backwards to allow removal
  for (let i = playerState.productionTimers.length - 1; i >= 0; i--) {
    const timer = playerState.productionTimers[i];
    if (now >= timer.endTime) {
      finishProduction(timer);
      playerState.productionTimers.splice(i, 1);
      completedAny = true;
    }
  }

  if (completedAny) {
    savePlayerState();
    if (typeof renderProductionQueue === "function") renderProductionQueue();
  }
}

function recoverOfflineProduction() {
  if (!playerState.productionTimers) playerState.productionTimers = [];
  const now = Date.now();
  let completedAny = false;

  for (let i = playerState.productionTimers.length - 1; i >= 0; i--) {
    const timer = playerState.productionTimers[i];
    if (now >= timer.endTime) {
      finishProduction(timer);
      playerState.productionTimers.splice(i, 1);
      completedAny = true;
    }
  }
  // We don't save immediately here, loadPlayerState handles it later or user interactions will.
}

function finishProduction(timer) {
  const recipe = PRODUCTION_RECIPES.find(r => r.id === timer.recipeId);
  if (!recipe) return;

  // Add items
  addToInventory(recipe.resultId, recipe.resultQty);
  if (recipe.extraId && recipe.extraQty) {
    // 50% chance for extra drops
    if (Math.random() < 0.5) addToInventory(recipe.extraId, recipe.extraQty);
  }

  // Add XP
  gainProductionXP(recipe.skill, recipe.xpGain);
  
  if (!playerState.stats.itemsCrafted) playerState.stats.itemsCrafted = 0;
  playerState.stats.itemsCrafted += 1;
  checkAchievements("craft");
}

function gainProductionXP(skillId, amount) {
  if (!playerState.productionSkills[skillId]) return;
  const skill = playerState.productionSkills[skillId];
  const maxLevel = PROD_SKILL_XP_TABLE.length - 1;
  
  if (skill.level >= maxLevel) return;

  skill.xp += amount;
  while (skill.level < maxLevel && skill.xp >= PROD_SKILL_XP_TABLE[skill.level + 1]) {
    skill.xp -= PROD_SKILL_XP_TABLE[skill.level + 1];
    skill.level++;
    showNotification(`YAY! You leveled up ${PRODUCTION_SKILLS[skillId].name} to Level ${skill.level}!`, "success");
  }
}

// ── Effective stats (base + upgrades + equipment) ──
function getClanTerritoryBonuses() {
  const bonuses = { extraGoldPercent: 0, extraXpPercent: 0, extraDropChance: 0 };
  if (!playerState.clan) return bonuses;

  if (typeof loadClan !== "function") return bonuses;
  const clan = loadClan(playerState.clan.id);
  if (!clan) return bonuses;

  clan.fortresses.forEach(regionId => {
    const region = REGIONS.find(r => r.id === regionId);
    if (region && region.buffType) {
      if (region.buffType === "gold") bonuses.extraGoldPercent += region.buffValue;
      if (region.buffType === "xp") bonuses.extraXpPercent += region.buffValue;
      if (region.buffType === "drop") bonuses.extraDropChance += region.buffValue;
    }
  });

  return bonuses;
}

function getEffectiveStats() {
  let extraPower = 0, extraDefense = 0, extraCrit = 0, extraDodge = 0, extraMaxHp = 0;

  const slots = ['head', 'chest', 'legs', 'gloves', 'boots', 'trinket', 'main_hand', 'off_hand', 'accessory', 'weapon', 'armor', 'ring'];
  slots.forEach(slotKey => {
    const raw = playerState.equipment ? playerState.equipment[slotKey] : null;
    if (!raw) return;

    let meta = null;
    if (typeof raw === "object") {
      meta = raw.metadata || raw;
    } else if (typeof raw === "string") {
      const itemDef = ALL_ITEMS[raw];
      if (itemDef) {
        meta = {
          attack_power: itemDef.stat === "power" ? itemDef.value : (itemDef.power || 0),
          defense: itemDef.stat === "defense" ? itemDef.value : (itemDef.defense || 0),
          crit_chance: itemDef.stat === "critChance" ? itemDef.value : (itemDef.crit_chance || 0),
          dodge_chance: itemDef.stat === "dodgeChance" ? itemDef.value : (itemDef.dodge_chance || 0),
          max_hp: itemDef.max_hp || itemDef.maxHp || 0
        };
      }
    }

    if (meta) {
      extraPower += (meta.attack_power || meta.power || meta.value || 0);
      extraDefense += (meta.defense || 0);
      extraCrit += (meta.crit_chance || meta.critChance || 0);
      extraDodge += (meta.dodge_chance || meta.dodgeChance || 0);
      extraMaxHp += (meta.max_hp || meta.maxHp || 0);
    }
  });
  
  const clanBonuses = getClanTerritoryBonuses();
  
  let finalMaxHp = playerState.stats.maxHp + extraMaxHp;
  if (isPremiumActive()) {
    finalMaxHp = Math.floor(finalMaxHp * 1.20);
  }

  let result = {
    maxHp:      finalMaxHp,
    power:      playerState.stats.power   + extraPower,
    defense:    playerState.stats.defense + extraDefense,
    critChance: (playerState.stats.critChance  || 0.05) + extraCrit,
    critDamage: playerState.stats.critDamage  || 1.5,
    dodgeChance:(playerState.stats.dodgeChance || 0.05) + extraDodge,
    damageAbsorb: 0,
    hpRegenBattle: 0,
    clanBonuses: clanBonuses
  };

  // Active pet bonus
  if (playerState.activePet && typeof PET_SPECIES !== 'undefined') {
    const pet = playerState.pets.find(p => p.id === playerState.activePet);
    if (pet) {
      const species = PET_SPECIES[pet.speciesId];
      const scale = getPetStatMultiplier(pet.level);
      const happMult = pet.happiness >= 50 ? 1.0 : 0.5;
      
      if (species.passive.stat) {
        const bonus = species.passive.valuePct
          ? result[species.passive.stat] * species.passive.valuePct * scale * happMult
          : species.passive.value * scale * happMult;
        result[species.passive.stat] += bonus;
      }
      if (species.passive.stats) {
        species.passive.stats.forEach(p => {
          const bonus = p.valuePct
            ? result[p.stat] * p.valuePct * scale * happMult
            : p.value * scale * happMult;
          result[p.stat] += bonus;
        });
      }
    }
  }

  return result;
}

function getPlayerPowerRating(state) {
  let effStats = null;
  if (typeof getEffectiveStats === "function") {
    try { effStats = getEffectiveStats(); } catch (e) {}
  }
  const stats = effStats || state?.stats || {};
  const pwr = Number(stats.power || 0);
  const def = Number(stats.defense || 0);
  const hp  = Number(stats.maxHp || stats.hp || 0);
  const crit = Number(stats.critChance || 0.05);

  let pr = Math.round(pwr * 2.5 + def * 2 + hp * 0.1 + crit * 150);

  if (!effStats && state?.equipment) {
    Object.values(state.equipment).forEach(itemRef => {
      if (!itemRef) return;
      const item = typeof itemRef === "string" ? ALL_ITEMS[itemRef] : itemRef;
      if (!item) return;
      const itemPwr = Number(item.power || item.attack_power || item.attack || item.pwr || item.value || 0);
      const itemDef = Number(item.defense || item.def || 0);
      const itemHp  = Number(item.max_hp || item.hp || 0);
      pr += Math.round(itemPwr * 2.5 + itemDef * 2 + itemHp * 0.1);
    });
  }

  return isNaN(pr) ? 0 : pr;
}

// ================================================================
// CLASS SELECTION
// ================================================================
function checkClassSelection() {
  const modal = document.getElementById("class-selection-modal");
  if (!modal) return;
  
  // If AccountStore has not finished initializing, prevent modal flash by keeping it hidden
  if (typeof AccountStore !== "undefined" && !AccountStore.isInitialized) {
    modal.style.display = "none";
    modal.classList.remove("active");
    return;
  }

  if (!playerState.class && typeof AccountStore !== "undefined") {
    const activeChar = AccountStore.getActiveCharacter();
    if (activeChar && activeChar.class) {
      playerState.class = activeChar.class;
    }
  }

  if (!playerState.class) {
    modal.style.display = "flex";
    modal.classList.add("active");
  } else {
    modal.style.display = "none";
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
  renderCampaignMap();
  renderWorldMap();
}

function renderCampaignMap() {
  const wrapper = document.getElementById("map-wrapper");
  if (!wrapper) return;
  wrapper.innerHTML = "";

  // Render House Node First
  const houseSection = document.createElement("div");
  houseSection.className = "act-section house-section";
  houseSection.innerHTML = `
    <div class="act-levels-row" style="justify-content: center;">
      <div class="level-node house-node" id="map-house-node">
        <span class="level-icon" style="font-size:1.6rem;">${HOUSE_TIERS[playerState.house?.tier || 0]?.icon || "🏕️"}</span>
        <span class="level-node-label">My House</span>
      </div>
    </div>
  `;
  wrapper.appendChild(houseSection);

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

  const houseNode = document.getElementById("map-house-node");
  if (houseNode) {
    houseNode.addEventListener("click", () => {
      openHouseModal();
    });
  }
}

function renderWorldMap() {
  const grid = document.getElementById("world-map-grid");
  if (!grid) return;
  grid.innerHTML = "";

  REGIONS.forEach(region => {
    const isLocked = playerState.level < region.minLevel;
    
    // Check quem controla o fort
    let ownerStr = "None";
    let ownerClan = null;
    if (typeof localStorage !== "undefined") {
      const fortOwnerId = localStorage.getItem(`fortress_${region.id}`);
      if (fortOwnerId && typeof loadClan === "function") {
        ownerClan = loadClan(fortOwnerId);
        if (ownerClan) ownerStr = `[${ownerClan.tag}] ${ownerClan.name}`;
      }
    }

    const card = document.createElement("div");
    card.className = `region-card ${isLocked ? "locked" : ""}`;
    card.style.setProperty("--card-color", region.color);
    
    let actionsHtml = "";
    if (isLocked) {
      actionsHtml = `<button disabled>Locked</button>`;
    } else {
      actionsHtml = `<button onclick="openVillageModal('${region.id}')">🏘️ Enter Village</button>`;
    }

    card.innerHTML = `
      <div class="region-header">
        <div class="region-title">${region.icon} ${region.name}</div>
        <div class="region-level-req">${isLocked ? "🔒" : "🔓"} Lv.${region.minLevel}+</div>
      </div>
      <div class="region-desc">${region.desc}</div>
      <div class="region-fortress">
        <span>${region.fortressIcon} ${region.fortressName}</span>
        <span style="font-size:0.8rem; opacity:0.8;">👑 ${ownerStr}</span>
      </div>
      <div class="region-actions">
        ${actionsHtml}
      </div>
    `;
    grid.appendChild(card);
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

  const curStam  = (typeof playerState.stamina === "number" && !isNaN(playerState.stamina) && playerState.stamina !== null) ? playerState.stamina : maxStam;
  if (playerState.stamina !== curStam) playerState.stamina = curStam;

  // Header
  _setText("header-level", playerState.level);
  _setText("header-gold",  playerState.gold);
  _setText("header-gems",  playerState.gems || 0);
  _setText("header-stamina", `${curStam}/${maxStam}`);
  _setText("store-gems-count", playerState.gems || 0);

  // Character panel
  const charName = playerState.name || "Hero";
  const nameBadge = isPremiumActive() ? `<span title="Premium" style="color:var(--ember);">👑</span> ` : "";
  document.getElementById("char-name").innerHTML = nameBadge + charName;
  
  _setText("char-class-display",  playerState.class);
  _setText("char-level",          playerState.level);
  if (!playerState.xpNeeded || playerState.xpNeeded <= 100 && playerState.level > 1) {
    playerState.xpNeeded = getRequiredXpForLevel(playerState.level);
  }
  _setText("char-xp-text",        `${formatNumber(playerState.xp)}/${formatNumber(playerState.xpNeeded)}`);
  _setText("char-stamina-text",   `${curStam}/${maxStam}`);
  _setText("char-mana-text",      `${playerState.maxMana}/${playerState.maxMana}`);
  _setText("char-power-rating",   pr);

  // Progress bars
  _setWidth("char-xp-fill",      Math.min(100, (playerState.xp / (playerState.xpNeeded || 1)) * 100));
  _setWidth("char-stamina-fill", (playerState.stamina / maxStam) * 100);
  _setWidth("char-mana-fill",    100);

  // Avatar
  const preset = CLASS_PRESETS[playerState.class];
  if (preset) renderAvatar("char-avatar-container", preset.image, preset.avatar);

  // Stats
  if (playerState.currentHp > effStats.maxHp) {
    playerState.currentHp = effStats.maxHp;
  }
  _setText("stat-hp",      `${Math.floor(playerState.currentHp)}/${effStats.maxHp}`);
  _setText("stat-power",   `${effStats.power} (+${effStats.power - playerState.stats.power})`);
  _setText("stat-defense", `${effStats.defense} (+${effStats.defense - playerState.stats.defense})`);
  _setText("stat-crit",    `${Math.round(effStats.critChance * 100)}%`);
  _setText("stat-dodge",   `${Math.round(effStats.dodgeChance * 100)}%`);

  // Upgrade costs
  const hpLvl  = Number(playerState.upgrades?.hpLevel  ?? playerState.upgrades?.hp  ?? 0) || 0;
  const pwrLvl = Number(playerState.upgrades?.powerLevel ?? playerState.upgrades?.power ?? 0) || 0;
  const defLvl = Number(playerState.upgrades?.defenseLevel ?? playerState.upgrades?.defense ?? 0) || 0;

  const hpCost  = 10 + hpLvl * 15;
  const pwrCost = 10 + pwrLvl * 15;
  const defCost = 10 + defLvl * 15;
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
  
  if (typeof renderPetSection === "function") renderPetSection();
}

// ── SHOP ──
async function renderShop() {
  if (!playerState.class) return;

  const weaponsCont = document.getElementById("shop-weapons-container");
  const armorCont   = document.getElementById("shop-armor-container");
  const ringsCont   = document.getElementById("shop-rings-container");
  const consCont    = document.getElementById("shop-consumables-container");
  const foodCont    = document.getElementById("shop-food-container");
  const matsCont    = document.getElementById("shop-materials-container");
  if (!weaponsCont || !armorCont || !ringsCont) return;

  weaponsCont.innerHTML = "";
  armorCont.innerHTML   = "";
  ringsCont.innerHTML   = "";
  if (consCont) consCont.innerHTML = "";
  if (foodCont) foodCont.innerHTML = "";
  if (matsCont) matsCont.innerHTML = "";

  let renderedDynamic = false;
  const activeChar = typeof AccountStore !== "undefined" ? AccountStore.getActiveCharacter() : null;
  if (activeChar && typeof activeChar.id === "string" && activeChar.id.includes("-")) {
    try {
      const shopItems = await getShopInventoryRPC(activeChar.id);
      if (Array.isArray(shopItems) && shopItems.length > 0) {
        renderedDynamic = true;
        shopItems.forEach(item => {
          const rarity = (item.rarity || "common").toLowerCase();
          const canAfford = playerState.gold >= item.price;
          const meetsLevel = playerState.level >= item.min_level;

          const el = document.createElement("div");
          el.className = `shop-item rarity-${rarity}`;
          el.id = `item-${item.item_id}`;

          const statsStr = item.stats ? Object.entries(item.stats)
            .map(([k, v]) => `${k === "attack_power" ? "Atk" : k === "defense" ? "Def" : k === "max_hp" ? "HP" : k}: +${v}`)
            .join(" | ") : "";

          el.innerHTML = `
            <div class="item-icon">${item.icon || "📦"}</div>
            <div class="item-details">
              <h5>${item.name} <span class="rarity-badge ${rarity}">${rarity.toUpperCase()}</span></h5>
              <p>${statsStr || item.slot_type}</p>
              <span class="item-tier" style="color:var(--gold);font-size:0.65rem;">Min Lv. ${item.min_level} | ${item.slot_type}</span>
            </div>
            <button class="btn-buy btn-buy-expansion"
                    data-item="${item.item_id}"
                    ${(!canAfford || !meetsLevel) ? "disabled" : ""}>
              ${!meetsLevel ? `Lv ${item.min_level} Req` : `Buy <span class="cost">${formatNumber(item.price)}g</span>`}
            </button>
          `;

          if (item.slot_type === "main_hand" || item.slot_type === "off_hand") {
            weaponsCont.appendChild(el);
          } else if (item.slot_type === "accessory") {
            ringsCont.appendChild(el);
          } else {
            armorCont.appendChild(el);
          }
        });
      }
    } catch (err) {
      console.error("Failed to load dynamic shop inventory:", err);
    }
  }

  // Local/Offline Fallback for Expanded Equipment
  if (!renderedDynamic) {
    Object.values(EXPANDED_ITEMS).forEach(item => {
      if (!item.is_shop_item) return;
      const rarity = (item.rarity || "common").toLowerCase();
      const canAfford = playerState.gold >= item.cost;
      const meetsLevel = playerState.level >= item.min_level;

      const el = document.createElement("div");
      el.className = `shop-item rarity-${rarity}`;
      el.id = `item-${item.id}`;

      const statsList = [];
      if (item.power) statsList.push(`Atk: +${item.power}`);
      if (item.defense) statsList.push(`Def: +${item.defense}`);
      if (item.max_hp) statsList.push(`HP: +${item.max_hp}`);
      if (item.crit_chance) statsList.push(`Crit: +${Math.round(item.crit_chance * 100)}%`);

      el.innerHTML = `
        <div class="item-icon">${item.icon || "📦"}</div>
        <div class="item-details">
          <h5>${item.name} <span class="rarity-badge ${rarity}">${rarity.toUpperCase()}</span></h5>
          <p>${statsList.join(" | ") || item.slot_type}</p>
          <span class="item-tier" style="color:var(--gold);font-size:0.65rem;">Min Lv. ${item.min_level} | ${item.slot_type}</span>
        </div>
        <button class="btn-buy btn-buy-expansion"
                data-item="${item.id}"
                ${(!canAfford || !meetsLevel) ? "disabled" : ""}>
          ${!meetsLevel ? `Lv ${item.min_level} Req` : `Buy <span class="cost">${formatNumber(item.cost)}g</span>`}
        </button>
      `;

      if (item.slot_type === "main_hand" || item.slot_type === "off_hand") {
        weaponsCont.appendChild(el);
      } else if (item.slot_type === "accessory") {
        ringsCont.appendChild(el);
      } else {
        armorCont.appendChild(el);
      }
    });
  }

  // Consumables
  Object.values(CONSUMABLE_ITEMS).forEach(item => {
    if (consCont) consCont.appendChild(createShopItemEl(item));
  });

  // Food
  Object.values(FOOD_ITEMS).forEach(item => {
    if (foodCont) foodCont.appendChild(createShopItemEl(item));
  });

  // Materials
  Object.values(MATERIAL_ITEMS).forEach(item => {
    if (item.id.includes("seed") || item.id.includes("item_") || item.tier === 1) {
      if (matsCont) matsCont.appendChild(createShopItemEl(item));
    }
  });
}

function renderPremiumStore(tab) {
  const content = document.getElementById("premium-store-content");
  if (!content) return;
  
  // Update tabs UI
  const tabs = document.querySelectorAll("#premium-store-modal .shop-tab");
  tabs.forEach(t => t.classList.remove("active"));
  event && event.currentTarget && event.currentTarget.classList.add("active");

  let html = `<div style="text-align:right; margin-bottom:10px; font-weight:bold; color:var(--ember);">
    Your Gems: <span id="store-gems-count">${playerState.gems || 0}</span> 💎
  </div>`;
  
  if (tab === "pass") {
    html += `
      <div class="panel" style="border-color: var(--ember); text-align:center;">
        <h4 style="color:var(--ember); font-size:1.5rem; margin-top:0;">Ember Pass</h4>
        <p>Access to exclusive benefits for 30 days!</p>
        <ul style="text-align:left; font-size:0.9rem; line-height:1.6;">
          <li>🛡️ +20% HP and +50% HP Regeneration</li>
          <li>⚡ Stamina regenerates 30% faster</li>
          <li>⚒️ +2 Production Slots</li>
          <li>🎒 +20 Inventory Slots</li>
          <li>💰 +15% Gold and +10% XP in Battles</li>
          <li>✨ Exclusive Badge in Chat/Leaderboards</li>
        </ul>
        <button class="btn-action" style="font-size:1.2rem; padding:10px 30px; margin-top:15px;" onclick="buyEmberPass()">Buy (900 💎)</button>
      </div>
    `;
  } else if (tab === "gems") {
    html += `
      <div class="shop-grid">
        <div class="recipe-card" style="text-align:center;">
          <div style="font-size:2.5rem;">💎</div>
          <h4>Pile of Gems</h4>
          <p>100 Gems</p>
          <button class="btn-action" style="width:100%;">R$ 4,90</button>
        </div>
        <div class="recipe-card" style="text-align:center;">
          <div style="font-size:2.5rem;">💰</div>
          <h4>Bag of Gems</h4>
          <p>500 Gems + 50 Bonus</p>
          <button class="btn-action" style="width:100%;">R$ 24,90</button>
        </div>
        <div class="recipe-card" style="text-align:center; border: 1px solid var(--ember);">
          <div style="font-size:2.5rem;">👑</div>
          <h4>Royal Chest</h4>
          <p>1000 Gems + 200 Bonus</p>
          <button class="btn-action" style="width:100%;">R$ 49,90</button>
        </div>
      </div>
    `;
  } else if (tab === "consumables") {
    html += `
      <div class="shop-grid">
        <div class="recipe-card">
          <div style="font-size:2rem; text-align:center;">🧪</div>
          <h4 style="text-align:center; margin:5px 0;">Stamina Potion</h4>
          <p style="font-size:0.8rem; text-align:center;">Restores 100% Stamina. (Max 3/day)</p>
          <button class="btn-action" style="width:100%; margin-top:10px;" onclick="buyPremiumConsumable('stamina_refill', 50)">50 💎</button>
        </div>
        <div class="recipe-card">
          <div style="font-size:2rem; text-align:center;">⏳</div>
          <h4 style="text-align:center; margin:5px 0;">Magic Hourglass</h4>
          <p style="font-size:0.8rem; text-align:center;">Skip 1 hour of production. (Max 10/day)</p>
          <button class="btn-action" style="width:100%; margin-top:10px;" onclick="buyPremiumConsumable('prod_skip', 30)">30 💎</button>
        </div>
        <div class="recipe-card">
          <div style="font-size:2rem; text-align:center;">💖</div>
          <h4 style="text-align:center; margin:5px 0;">Phoenix Tear</h4>
          <p style="font-size:0.8rem; text-align:center;">Revive with 50% HP. (1/battle)</p>
          <button class="btn-action" style="width:100%; margin-top:10px;" onclick="buyPremiumConsumable('second_chance', 100)">100 💎</button>
        </div>
      </div>
    `;
  }
  
  content.innerHTML = html;
}

function buyEmberPass() {
  if (playerState.gems < 900) {
    showToast("Not enough Gems!", "error");
    return;
  }
  
  spendGems(900);
  playerState.isPremium = true;
  // +30 days
  const now = Date.now();
  if (playerState.premiumExpiry && playerState.premiumExpiry > now) {
    playerState.premiumExpiry += 30 * 24 * 60 * 60 * 1000;
  } else {
    playerState.premiumExpiry = now + 30 * 24 * 60 * 60 * 1000;
  }
  
  savePlayerState();
  if (typeof renderStats === "function") renderStats();
  document.getElementById("premium-store-modal").classList.remove("active");
  showToast("Ember Pass activated for 30 days!", "success");
}

function buyPremiumConsumable(type, cost) {
  if (playerState.gems < cost) {
    showToast("Not enough Gems!", "error");
    return;
  }
  if (!canUsePremiumConsumable(type)) {
    showToast("Daily/battle limit reached for this item!", "error");
    return;
  }
  
  spendGems(cost);
  recordPremiumConsumableUsage(type);
  
  if (type === "stamina_refill") {
    playerState.stamina = getMaxStamina(playerState.level);
    showToast("Stamina fully restored!", "success");
  } else if (type === "prod_skip") {
    if (!playerState.productionTimers) playerState.productionTimers = [];
    playerState.productionTimers.forEach(t => t.endTime -= 60 * 60 * 1000); // reduz 1h
    checkProductionTimers();
    showToast("Skipped 1 hour on all productions!", "success");
  } else if (type === "second_chance") {
    if (activeBattleInterval && battlePlayerHp <= 0) {
      battlePlayerHp = Math.floor(playerState.stats.maxHp * 0.5);
      updatePlayerHpUI();
      appendBattleLog("Phoenix Tear used! You revived with 50% HP!", "combat-buff");
      showToast("You revived!", "success");
    } else {
      // Add to inventory? Wait, the prompt says "consumable", but we can just add an item.
      // Or just apply the buff? Let's just give them the item.
      addToInventory("phoenix_tear", 1);
      showToast("Phoenix Tear bought!", "success");
    }
  }
  
  savePlayerState();
  renderPremiumStore('consumables');
}

function createShopItemEl(item) {
  const isWeaponEquipped = playerState.equipment.weapon === item.id;
  const isArmorEquipped  = playerState.equipment.armor  === item.id;
  const isRingEquipped   = playerState.equipment.ring   === item.id;
  const isEquipped = isWeaponEquipped || isArmorEquipped || isRingEquipped;
  
  const canBuyMultiple = item.type === "consumable" || item.type === "food" || item.type === "material";
  const isOwned = !canBuyMultiple && (isEquipped || playerState.inventory.some(i => i.id === item.id));

  const tierLabels = ["","★","★★","★★★","★★★★","★★★★★"];
  let statLabel = "", statValue = "";
  if (!canBuyMultiple && item.stat) {
    statLabel = item.stat === "power" ? "Power" : item.stat === "defense" ? "Defense" :
                item.stat === "critChance" ? "Crit" : "Dodge";
    statValue = item.stat.includes("Chance") ? `+${Math.round(item.value * 100)}%` : `+${item.value}`;
  } else {
    statValue = item.desc || "";
  }

  const el = document.createElement("div");
  el.className = "shop-item";
  el.id = `item-${item.id}`;

  if (canBuyMultiple) {
    el.innerHTML = `
      <div class="item-icon">${item.icon}</div>
      <div class="item-details">
        <h5>${item.name}</h5>
        <p>${statValue}</p>
        <span class="item-tier" style="color:var(--gold);font-size:0.65rem;">${tierLabels[item.tier] || ""} Tier ${item.tier}</span>
      </div>
      <div class="shop-action-group">
        <div class="shop-qty-container">
          <button class="shop-qty-btn shop-qty-minus" data-item="${item.id}">-</button>
          <input type="number" class="shop-qty-input" id="shop-qty-input-${item.id}" value="1" min="1" max="999" data-item="${item.id}" data-unitcost="${item.cost}">
          <button class="shop-qty-btn shop-qty-plus" data-item="${item.id}">+</button>
        </div>
        <div class="shop-qty-presets">
          <button class="shop-preset-btn" data-item="${item.id}" data-qty="1">1x</button>
          <button class="shop-preset-btn" data-item="${item.id}" data-qty="5">5x</button>
          <button class="shop-preset-btn" data-item="${item.id}" data-qty="10">10x</button>
          <button class="shop-preset-btn" data-item="${item.id}" data-qty="50">50x</button>
        </div>
        <button class="btn-buy btn-buy-bulk" id="btn-buy-${item.id}" data-item="${item.id}" ${playerState.gold < item.cost ? "disabled" : ""}>
          Buy 1x <span class="cost" id="btn-buy-cost-${item.id}">${formatNumber(item.cost)}g</span>
        </button>
      </div>
    `;
  } else {
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
  }
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

// ── FORGE ──
function renderMaterials() {
  const list = document.getElementById("materials-list");
  if (!list) return;
  list.innerHTML = "";
  
  const materials = (playerState.inventory || []).filter(inv => {
    const item = ALL_ITEMS[inv.id];
    return item && item.type === "material";
  });
  
  if (!materials.length) {
    list.innerHTML = `<p class="empty-message">You have no materials.</p>`;
    return;
  }
  
  materials.forEach((inv) => {
    const item = ALL_ITEMS[inv.id];
    const qtyStr = (inv.qty && inv.qty > 1) ? ` (x${inv.qty})` : "";
    const el = document.createElement("div");
    el.className = "inventory-item";
    el.innerHTML = `
      <div class="item-icon">${item.icon}</div>
      <div class="item-details"><h5>${item.name}${qtyStr}</h5><p>${item.desc}</p></div>
    `;
    list.appendChild(el);
  });
}

let selectedProfession = "farming";

function renderProfessions() {
  const list = document.getElementById("professions-list");
  if (!list) return;
  list.innerHTML = "";

  Object.values(PRODUCTION_SKILLS).forEach(skill => {
    const rawSkill = (playerState.productionSkills && playerState.productionSkills[skill.id]) || (playerState.professions && playerState.professions[skill.id]);
    const pSkill = { level: Math.max(1, rawSkill?.level || 1), xp: rawSkill?.xp || 0 };
    const maxLevel = PROD_SKILL_XP_TABLE.length - 1;
    const isMax = pSkill.level >= maxLevel;
    const xpStr = isMax ? "MAX" : `${pSkill.xp}/${PROD_SKILL_XP_TABLE[pSkill.level + 1]}`;

    const btn = document.createElement("button");
    btn.className = `profession-btn ${selectedProfession === skill.id ? "active" : ""}`;
    btn.dataset.skill = skill.id;
    btn.innerHTML = `
      <div class="profession-icon">${skill.icon}</div>
      <div class="profession-info">
        <h4>${skill.name}</h4>
        <p>${skill.desc}</p>
        <span class="profession-level">Lv. ${pSkill.level} (${xpStr} XP)</span>
      </div>
    `;
    list.appendChild(btn);
  });
}

function renderSkillRecipes(skillId) {
  const list = document.getElementById("recipes-list");
  const title = document.getElementById("recipes-title");
  if (!list || !title) return;

  const skillInfo = PRODUCTION_SKILLS[skillId];
  title.innerHTML = `${skillInfo.icon} ${skillInfo.name} Recipes`;
  list.innerHTML = "";

  const recipes = PRODUCTION_RECIPES.filter(r => r.skill === skillId);
  const rawSkill = (playerState.productionSkills && playerState.productionSkills[skillId]) || (playerState.professions && playerState.professions[skillId]);
  const pSkill = { level: Math.max(1, rawSkill?.level || 1), xp: rawSkill?.xp || 0 };

  if (recipes.length === 0) {
    list.innerHTML = `<p class="empty-message">No recipes found.</p>`;
    return;
  }

  recipes.forEach(recipe => {
    const resultItem = ALL_ITEMS[recipe.resultId];
    if (!resultItem) return;

    const isLocked = pSkill.level < recipe.tier;
    
    let canCraft = !isLocked;
    const reqsHtml = recipe.ingredients.map(ing => {
      const mat = ALL_ITEMS[ing.id];
      const invItem = playerState.inventory.find(i => i.id === ing.id);
      const hasQty = invItem ? (invItem.qty || 1) : 0;
      const hasEnough = hasQty >= ing.qty;
      if (!hasEnough) canCraft = false;
      return `<li class="${hasEnough ? '' : 'missing'}"><span>${mat.name}</span> <span>${hasQty}/${ing.qty}</span></li>`;
    }).join("");

      // Calculate UI display time
      let reduction = Math.min(0.5, pSkill.level * 0.02);
      if (typeof getStationSpeedBonus === "function") {
        reduction = Math.min(0.9, reduction + getStationSpeedBonus(recipe.skill));
      }
      const finalTimeMs = Math.floor(recipe.timeMs * (1 - reduction));

      const card = document.createElement("div");
      card.className = "recipe-card";
      if (isLocked) card.style.opacity = "0.5";
      
      card.innerHTML = `
        <div class="recipe-header">
          <div class="recipe-icon">${resultItem.icon}</div>
          <div class="recipe-title">
            <h5>${recipe.name}</h5>
            <span>Yields ${recipe.resultQty}x (Lv. ${recipe.tier})</span>
          </div>
        </div>
        <div class="recipe-reqs">
          <strong>Ingredients:</strong>
          <ul>${reqsHtml}</ul>
        </div>
        <button class="btn-craft-recipe" data-recipe="${recipe.id}" ${canCraft ? "" : "disabled"}>
          ${isLocked ? `Requires Lv. ${recipe.tier}` : `Produce (${(finalTimeMs/1000).toFixed(1)}s)`}
        </button>
    `;
    list.appendChild(card);
  });
}

function renderProductionQueue() {
  const container = document.getElementById("production-queue");
  if (!container) return;
  container.innerHTML = "";

  if (playerState.productionTimers.length === 0) {
    container.innerHTML = `<p class="empty-message">Queue empty. Capacity (0/3)</p>`;
    return;
  }

  const now = Date.now();
  playerState.productionTimers.forEach(timer => {
    const recipe = PRODUCTION_RECIPES.find(r => r.id === timer.recipeId);
    if (!recipe) return;
    const item = ALL_ITEMS[recipe.resultId];

    const remaining = Math.max(0, timer.endTime - now);
    const progress = 100 - (remaining / timer.duration) * 100;
    
    const el = document.createElement("div");
    el.className = "queue-item";
    el.innerHTML = `
      <div class="queue-header">
        <span>${item.icon} ${recipe.name}</span>
        <strong>${Math.ceil(remaining / 1000)}s</strong>
      </div>
      <div class="queue-bar">
        <div class="queue-fill" style="width: ${progress}%"></div>
      </div>
    `;
    container.appendChild(el);
  });
}

function initSkillsTabControls() {
  const profList = document.getElementById("professions-list");
  if (profList) {
    profList.addEventListener("click", (e) => {
      const btn = e.target.closest(".profession-btn");
      if (btn) {
        selectedProfession = btn.dataset.skill;
        renderProfessions();
        renderSkillRecipes(selectedProfession);
      }
    });
  }

  const recList = document.getElementById("recipes-list");
  if (recList) {
    recList.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-craft-recipe");
      if (btn && !btn.disabled) {
        const recipeId = btn.dataset.recipe;
        startProduction(recipeId);
      }
    });
  }
}

const RPG_PAPERDOLL_CONFIG = {
  left: [
    { key: "head", label: "Head", defaultIcon: "🪖" },
    { key: "amulet", label: "Necklace", defaultIcon: "📿" },
    { key: "chest", label: "Armor", defaultIcon: "🥋" },
    { key: "main_hand", label: "Weapon", defaultIcon: "🗡️" },
    { key: "off_hand", label: "Off-Hand", defaultIcon: "🛡️" }
  ],
  right: [
    { key: "gloves", label: "Gloves", defaultIcon: "🧤" },
    { key: "accessory", label: "Ring", defaultIcon: "💍" },
    { key: "legs", label: "Legs", defaultIcon: "👖" },
    { key: "boots", label: "Boots", defaultIcon: "👢" },
    { key: "trinket", label: "Trinket", defaultIcon: "🔮" }
  ]
};

function renderPaperdollGrid() {
  const container = document.getElementById("paperdoll-grid");
  if (!container) return;

  const equipped = playerState.equipment || {};
  const heroClass = playerState.class || "Warrior";
  const effStats = typeof getEffectiveStats === "function" ? getEffectiveStats() : {};
  const totalPower = effStats.power || playerState.stats?.power || 0;
  const totalDefense = effStats.defense || playerState.stats?.defense || 0;

  function renderSlotHTML(slot) {
    let raw = equipped[slot.key];
    if (!raw) {
      if (slot.key === "main_hand") raw = equipped.weapon;
      else if (slot.key === "chest") raw = equipped.armor;
      else if (slot.key === "accessory") raw = equipped.ring;
    }

    let meta = null;
    let itemId = null;
    let itemName = null;

    if (raw && typeof raw === "object") {
      itemId = raw.item_id || raw.id;
      itemName = raw.name || raw.metadata?.name || itemId;
      meta = raw.metadata || raw;
    } else if (raw && typeof raw === "string") {
      itemId = raw;
      const def = ALL_ITEMS[raw] || Object.values(ALL_ITEMS).find(i => i.name === raw || i.id === raw);
      itemName = def ? def.name : raw;
      meta = def || { name: raw };
    }

    const rarity = (meta?.rarity || "common").toLowerCase();
    const isOccupied = !!(meta && itemId);
    const enhancementLevel = meta?.enhancement_level || 0;

    let tooltipContent = "";
    if (isOccupied) {
      const statsList = [];
      if (meta.attack_power || meta.power) statsList.push(`+${meta.attack_power || meta.power} Power`);
      if (meta.defense) statsList.push(`+${meta.defense} Defense`);
      if (meta.crit_chance) statsList.push(`+${Math.round(meta.crit_chance * 100)}% Crit`);

      tooltipContent = `
        <div class="rpg-slot-tooltip">
          <strong class="item-name ${rarity}">${itemName} ${enhancementLevel ? '+' + enhancementLevel : ''}</strong>
          <span class="item-rarity-tag ${rarity}">${rarity.toUpperCase()} ${slot.label.toUpperCase()}</span>
          <div class="item-stats">${statsList.length ? statsList.join('<br>') : 'Equipped Item'}</div>
          <span class="click-hint">Click to Unequip</span>
        </div>
      `;
    } else {
      tooltipContent = `
        <div class="rpg-slot-tooltip">
          <strong>Empty ${slot.label} Slot</strong>
        </div>
      `;
    }

    return `
      <div class="rpg-paperdoll-slot rarity-${rarity} ${isOccupied ? 'occupied' : 'empty'}" 
           data-slot="${slot.key}" 
           title="${itemName || 'Empty ' + slot.label}">
        <span class="slot-label">${slot.label}</span>
        <div class="slot-icon-box">
          <span class="icon">${meta?.icon || slot.defaultIcon}</span>
          ${enhancementLevel ? `<span class="enhancement-badge">+${enhancementLevel}</span>` : ''}
        </div>
        ${tooltipContent}
      </div>
    `;
  }

  container.innerHTML = `
    <div class="rpg-paperdoll-wrapper">
      <div class="rpg-paperdoll-header-bar">
        <span>🛡️ EQUIPMENT</span>
      </div>

      <div class="rpg-paperdoll-grid-layout">
        <!-- Left Slots Column -->
        <div class="rpg-slots-column left">
          ${RPG_PAPERDOLL_CONFIG.left.map(s => renderSlotHTML(s)).join('')}
        </div>

        <!-- Center Hero Silhouette Avatar -->
        <div class="rpg-hero-avatar-center">
          <div class="rpg-class-title">${heroClass.toUpperCase()}</div>
          <div class="rpg-hero-silhouette">
            <svg viewBox="0 0 100 160" width="80" height="130" fill="currentColor">
              <path d="M50,15 C42,15 36,22 36,30 C36,36 40,41 45,43 C32,48 20,62 18,85 L15,130 C15,133 17,135 20,135 C23,135 25,133 25,130 L28,95 L38,95 L35,150 C35,153 38,155 41,155 C44,155 46,153 46,150 L49,105 L51,105 L54,150 C54,153 56,155 59,155 C62,155 65,153 65,150 L62,95 L72,95 L75,130 C75,133 77,135 80,135 C83,135 85,133 85,130 L82,85 C80,62 68,48 55,43 C60,41 64,36 64,30 C64,22 58,15 50,15 Z" opacity="0.4"/>
            </svg>
          </div>
          <div class="rpg-paperdoll-stats-footer">
            <div class="stat-badge armor" title="Total Armor Rating">
              🛡️ Armor: <strong>${totalDefense}</strong>
            </div>
            <div class="stat-badge power" title="Total Power Rating">
              ⚡ Power: <strong>${totalPower}</strong>
            </div>
          </div>
        </div>

        <!-- Right Slots Column -->
        <div class="rpg-slots-column right">
          ${RPG_PAPERDOLL_CONFIG.right.map(s => renderSlotHTML(s)).join('')}
        </div>
      </div>
    </div>
  `;

  // Slot Unequip Event Handler
  container.onclick = (e) => {
    const slotCard = e.target.closest(".rpg-paperdoll-slot.occupied");
    if (slotCard) {
      const slotKey = slotCard.dataset.slot;
      unequipItem(slotKey);
    }
  };
}

const DUNGEONS = [
  {
    id: "ironfang_catacombs",
    name: "Ironfang Catacombs",
    theme: "☠️ Undead Crypt",
    maxFloors: 10,
    recPower: 20,
    recDef: 10,
    icon: "💀"
  },
  {
    id: "frostpeak_spire",
    name: "Frostpeak Spire",
    theme: "❄️ Ice Citadel",
    maxFloors: 15,
    recPower: 45,
    recDef: 25,
    icon: "🏰"
  },
  {
    id: "ember_forge_depths",
    name: "Ember Forge Depths",
    theme: "🔥 Volcano Core",
    maxFloors: 20,
    recPower: 80,
    recDef: 50,
    icon: "🌋"
  }
];

function recoverDungeonProgress() {
  if (!playerState.dungeonProgress) playerState.dungeonProgress = {};

  const legacyStr = localStorage.getItem("rpg_player_state");
  if (legacyStr) {
    try {
      const parsed = JSON.parse(legacyStr);
      if (parsed.dungeonProgress && typeof parsed.dungeonProgress === "object") {
        Object.keys(parsed.dungeonProgress).forEach(dId => {
          playerState.dungeonProgress[dId] = Math.max(playerState.dungeonProgress[dId] || 0, parsed.dungeonProgress[dId] || 0);
        });
      }
    } catch(e) {}
  }

  const accountStr = localStorage.getItem("ember_account_v2");
  if (accountStr) {
    try {
      const parsed = JSON.parse(accountStr);
      if (parsed.characterSlots) {
        Object.values(parsed.characterSlots).forEach(char => {
          if (char) {
            const dProg = char.dungeonProgress || char.dungeon_progress;
            if (dProg && typeof dProg === "object") {
              Object.keys(dProg).forEach(dId => {
                playerState.dungeonProgress[dId] = Math.max(playerState.dungeonProgress[dId] || 0, dProg[dId] || 0);
              });
            }
          }
        });
      }
    } catch(e) {}
  }

  // Veteran recovery: if level >= 15, restore Ironfang Catacombs mastery (10/10) if lost
  if ((playerState.level || 1) >= 15 && (!playerState.dungeonProgress["ironfang_catacombs"] || playerState.dungeonProgress["ironfang_catacombs"] < 10)) {
    playerState.dungeonProgress["ironfang_catacombs"] = 10;
  }

  if (typeof AccountStore !== "undefined") {
    const activeChar = AccountStore.getActiveCharacter();
    if (activeChar) {
      activeChar.dungeonProgress = playerState.dungeonProgress;
      activeChar.dungeon_progress = playerState.dungeonProgress;
      AccountStore.save();
    }
  }
}

function renderDungeonSelector() {
  const container = document.getElementById("dungeon-selector-wrapper");
  if (!container) return;
  container.innerHTML = "";

  recoverDungeonProgress();
  const dProg = playerState.dungeonProgress || {};

  DUNGEONS.forEach(dungeon => {
    const highestCleared = dProg[dungeon.id] || 0;
    const isMastered = highestCleared >= dungeon.maxFloors;
    const defaultFloor = Math.min(dungeon.maxFloors, Math.max(1, highestCleared + 1));

    const el = document.createElement("div");
    el.className = `dungeon-card panel ${isMastered ? 'dungeon-mastered' : ''}`;
    if (isMastered) {
      el.style.border = "1px solid var(--gold)";
      el.style.boxShadow = "var(--glow-gold)";
    }

    const options = Array.from({ length: dungeon.maxFloors }, (_, i) => {
      const fNum = i + 1;
      const isCleared = fNum <= highestCleared;
      const isSelected = fNum === defaultFloor;
      return `<option value="${fNum}" ${isSelected ? 'selected' : ''}>
        Floor ${fNum} ${isCleared ? '✓ Cleared' : ''}
      </option>`;
    }).join("");

    el.innerHTML = `
      <div class="dungeon-header">
        <div class="dungeon-icon">${dungeon.icon}</div>
        <div class="dungeon-title-group">
          <h4>${dungeon.name} ${isMastered ? '👑' : ''}</h4>
          <span class="dungeon-theme">${dungeon.theme}</span>
        </div>
      </div>
      <div class="dungeon-progress-bar-wrap" style="margin: 8px 0; background: rgba(0,0,0,0.4); border-radius: 6px; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid ${isMastered ? 'var(--gold)' : 'var(--border)'};">
        <span style="font-size: 0.78rem; color: ${isMastered ? 'var(--gold)' : 'var(--text-muted)'}; font-weight: 700;">
          ${isMastered ? '🏆 MASTERED' : '🚩 Progress'}
        </span>
        <span style="font-size: 0.8rem; font-weight: 700; color: ${isMastered ? 'var(--gold)' : '#fff'};">
          Floor ${highestCleared} / ${dungeon.maxFloors}
        </span>
      </div>
      <div class="dungeon-info-row">
        <span>⚔️ Rec Atk: ${dungeon.recPower}</span>
        <span>🛡️ Rec Def: ${dungeon.recDef}</span>
      </div>
      <div class="dungeon-action-row">
        <select class="dungeon-floor-select" id="floor-select-${dungeon.id}">
          ${options}
        </select>
        <button class="btn-action btn-challenge-dungeon" data-dungeon="${dungeon.id}">⚔️ Enter Encounter</button>
      </div>
    `;
    container.appendChild(el);
  });
}

function openDungeonBattleModal(combatLog) {
  const modal = document.getElementById("dungeon-battle-modal");
  if (!modal) return;

  const enemyNameEl = document.getElementById("dungeon-enemy-name");
  const playerHpBar = document.getElementById("dungeon-player-hp-bar");
  const enemyHpBar = document.getElementById("dungeon-enemy-hp-bar");
  const playerHpText = document.getElementById("dungeon-player-hp-text");
  const enemyHpText = document.getElementById("dungeon-enemy-hp-text");
  const logContainer = document.getElementById("dungeon-combat-log");
  const outcomeCard = document.getElementById("dungeon-outcome-card");

  if (enemyNameEl) enemyNameEl.textContent = combatLog.enemy_name || "Guardian";
  if (logContainer) logContainer.innerHTML = '<p class="log-entry system-entry">⚔️ Battle Started!</p>';
  if (outcomeCard) outcomeCard.style.display = "none";

  modal.style.display = "flex";
  modal.classList.add("active");

  const playbackOptions = { speed: 1, skip: false, cancelled: false };

  const closeBtn = document.getElementById("close-dungeon-battle-btn");
  if (closeBtn) closeBtn.onclick = () => {
    playbackOptions.cancelled = true;
    modal.style.display = "none";
    modal.classList.remove("active");
  };

  const closeOutcomeBtn = document.getElementById("btn-close-dungeon-outcome");
  if (closeOutcomeBtn) closeOutcomeBtn.onclick = () => {
    playbackOptions.cancelled = true;
    modal.style.display = "none";
    modal.classList.remove("active");
    if (window.renderActiveCharacterUI) window.renderActiveCharacterUI();
  };

  const speed1xBtn = document.getElementById("btn-speed-1x");
  const speed2xBtn = document.getElementById("btn-speed-2x");
  const skipBtn = document.getElementById("btn-skip-battle");

  if (speed1xBtn) {
    speed1xBtn.classList.add("active");
    speed1xBtn.onclick = () => {
      playbackOptions.speed = 1;
      speed1xBtn.classList.add("active");
      if (speed2xBtn) speed2xBtn.classList.remove("active");
    };
  }

  if (speed2xBtn) {
    speed2xBtn.classList.remove("active");
    speed2xBtn.onclick = () => {
      playbackOptions.speed = 2;
      speed2xBtn.classList.add("active");
      if (speed1xBtn) speed1xBtn.classList.remove("active");
    };
  }

  if (skipBtn) {
    skipBtn.onclick = () => {
      playbackOptions.skip = true;
    };
  }

  const firstTurn = (combatLog.turns && combatLog.turns[0]) || {};
  const maxPlayerHp = Math.max(1, firstTurn.player_hp || 100);
  const maxEnemyHp = Math.max(1, (firstTurn.enemy_hp !== undefined ? (firstTurn.enemy_hp + (firstTurn.damage || 0)) : 100));

  CombatEngine.playServerCombatLog(combatLog, (turn) => {
    if (playbackOptions.cancelled) return;
    if (playerHpBar) {
      const pPct = Math.max(0, Math.min(100, (turn.player_hp / maxPlayerHp) * 100));
      playerHpBar.style.width = `${pPct}%`;
    }
    if (enemyHpBar) {
      const ePct = Math.max(0, Math.min(100, (turn.enemy_hp / maxEnemyHp) * 100));
      enemyHpBar.style.width = `${ePct}%`;
    }
    if (playerHpText) playerHpText.textContent = `${turn.player_hp} / ${maxPlayerHp}`;
    if (enemyHpText) enemyHpText.textContent = `${turn.enemy_hp} / ${maxEnemyHp}`;

    if (logContainer) {
      const p = document.createElement("p");
      p.className = `log-entry ${turn.attacker === "player" ? "player-hit" : "enemy-hit"} ${turn.is_crit ? "crit-hit" : ""}`;
      p.textContent = `[Turn ${turn.turn}] ${turn.attacker === "player" ? "Hero" : combatLog.enemy_name} deals ${turn.damage} damage! ${turn.is_crit ? "💥 CRITICAL!" : ""}`;
      logContainer.appendChild(p);
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }, playbackOptions).then(() => {
    if (playbackOptions.cancelled) return;
    if (outcomeCard) {
      outcomeCard.style.display = "block";
      const titleEl = document.getElementById("dungeon-outcome-title");
      const rewardsEl = document.getElementById("dungeon-outcome-rewards");
      const nextFloorBtn = document.getElementById("btn-next-dungeon-floor");

      const dungeonDef = DUNGEONS.find(d => d.id === combatLog.dungeon_id);
      const maxFloors = dungeonDef ? dungeonDef.maxFloors : 10;
      const currentFloor = combatLog.floor || 1;
      const isVictory = combatLog.result === "victory";

      if (isVictory) {
        if (!playerState.dungeonProgress) playerState.dungeonProgress = {};
        const curHighest = playerState.dungeonProgress[combatLog.dungeon_id] || 0;
        playerState.dungeonProgress[combatLog.dungeon_id] = Math.max(curHighest, currentFloor);
        savePlayerState();
        if (typeof renderDungeonSelector === "function") renderDungeonSelector();
      }

      const hasNextFloor = isVictory && currentFloor < maxFloors;

      if (nextFloorBtn) {
        if (hasNextFloor) {
          nextFloorBtn.style.display = "block";
          nextFloorBtn.textContent = `➡️ Floor ${currentFloor + 1}`;
          nextFloorBtn.onclick = async () => {
            playbackOptions.cancelled = true;
            modal.style.display = "none";
            modal.classList.remove("active");
            const activeChar = typeof AccountStore !== "undefined" ? AccountStore.getActiveCharacter() : null;
            if (activeChar) {
              const nextFloor = currentFloor + 1;
              try {
                const nextLog = await runDungeonEncounterRPC(activeChar.id, combatLog.dungeon_id, nextFloor);
                if (nextLog) openDungeonBattleModal(nextLog);
              } catch (err) {
                showToast(err.message || "Cannot advance to next floor.", "error");
              }
            }
          };
        } else {
          nextFloorBtn.style.display = "none";
        }
      }

      if (titleEl) {
        if (isVictory) {
          if (currentFloor >= maxFloors) {
            titleEl.textContent = "👑 DUNGEON MASTERED!";
            titleEl.className = "victory";
            if (typeof sendDiscordWebhook === "function") {
              sendDiscordWebhook("dungeon_mastered", {
                dungeonName: dungeonDef ? dungeonDef.name : 'Dungeon',
                floorCount: maxFloors
              });
            }
            if (rewardsEl) {
              rewardsEl.innerHTML = `
                <div style="width:100%; text-align:center; padding:10px; background:rgba(255,215,0,0.15); border:1px solid var(--gold); border-radius:8px; margin-bottom:10px;">
                  <span style="color:var(--gold); font-weight:700; font-size:0.95rem;">🎉 Congratulations! You conquered all ${maxFloors} Floors of ${dungeonDef ? dungeonDef.name : 'this Dungeon'}!</span>
                </div>
                <span>✨ EXP: +${combatLog.exp_gained || 0}</span>
                <span>🪙 Gold: +${combatLog.gold_gained || 0}</span>
              `;
            }
          } else {
            titleEl.textContent = `🏆 FLOOR ${currentFloor} CLEARED!`;
            titleEl.className = "victory";
            if (rewardsEl) {
              rewardsEl.innerHTML = `
                <span>✨ EXP: +${combatLog.exp_gained || 0}</span>
                <span>🪙 Gold: +${combatLog.gold_gained || 0}</span>
              `;
            }
          }
        } else {
          titleEl.textContent = "💀 DEFEAT!";
          titleEl.className = "defeat";
          if (rewardsEl) {
            rewardsEl.innerHTML = `<span>Better luck next time! Upgrade your stats & gear.</span>`;
          }
        }
      }
    }
  });
}

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-challenge-dungeon");
  if (btn) {
    const dungeonId = btn.dataset.dungeon;
    const floorSelect = document.getElementById(`floor-select-${dungeonId}`);
    const floor = floorSelect ? parseInt(floorSelect.value, 10) : 1;

    const activeChar = typeof AccountStore !== "undefined" ? AccountStore.getActiveCharacter() : null;
    if (!activeChar) return;

    let combatLog = null;
    if (typeof activeChar.id === "string" && activeChar.id.includes("-")) {
      try {
        combatLog = await runDungeonEncounterRPC(activeChar.id, dungeonId, floor);
      } catch (err) {
        showToast(err.message || "Could not start dungeon encounter.", "error");
        return;
      }
    } else {
      combatLog = {
        result: "victory",
        dungeon_id: dungeonId,
        floor: floor,
        enemy_name: `Floor ${floor} Guardian`,
        total_turns: 5,
        damage_dealt: 120,
        damage_taken: 35,
        food_consumed: 0,
        exp_gained: 50 + floor * 20,
        gold_gained: 25 + floor * 10,
        turns: [
          { turn: 1, attacker: "player", action: "attack", damage: 25, is_crit: false, player_hp: 100, enemy_hp: 75 },
          { turn: 2, attacker: "enemy", action: "attack", damage: 12, is_crit: false, player_hp: 88, enemy_hp: 75 },
          { turn: 3, attacker: "player", action: "attack", damage: 40, is_crit: true, player_hp: 88, enemy_hp: 35 },
          { turn: 4, attacker: "enemy", action: "attack", damage: 15, is_crit: false, player_hp: 73, enemy_hp: 35 },
          { turn: 5, attacker: "player", action: "attack", damage: 35, is_crit: false, player_hp: 73, enemy_hp: 0 }
        ]
      };
    }

    if (combatLog) {
      openDungeonBattleModal(combatLog);
    }
  }

  const expansionBuyBtn = e.target.closest(".btn-buy-expansion");
  if (expansionBuyBtn && !expansionBuyBtn.disabled) {
    const itemId = expansionBuyBtn.dataset.item;
    const activeChar = typeof AccountStore !== "undefined" ? AccountStore.getActiveCharacter() : null;

    if (activeChar && typeof activeChar.id === "string" && activeChar.id.includes("-")) {
      try {
        const res = await buyShopItemRPC(activeChar.id, itemId);
        if (res && res.success) {
          showToast(`🛍️ Purchased ${res.item_name} for ${res.gold_spent}g!`, "success");
          const dbInv = await getCharacterInventory(activeChar.id);
          if (dbInv && dbInv.length > 0) {
            activeChar.inventory = dbInv.map(i => ({
              id: i.item_id,
              name: i.item_name,
              type: i.item_type,
              qty: i.quantity,
              icon: i.icon,
              metadata: i.metadata
            }));
            playerState.inventory = JSON.parse(JSON.stringify(activeChar.inventory));
          }
          savePlayerState();
          if (window.renderActiveCharacterUI) window.renderActiveCharacterUI();
          renderShop();
          renderInventory();
        }
      } catch (err) {
        showToast(err.message || "Failed to buy item.", "error");
      }
    } else {
      buyItem(itemId);
    }
  }
});

function renderInventory() {
  const list = document.getElementById("inventory-list");
  if (!list) return;
  list.innerHTML = "";

  const maxSlots = playerState.maxInventorySlots || 20;
  const items = playerState.inventory || [];
  const usedSlots = items.length;

  const invCountEl = document.getElementById("inv-count");
  const invMaxEl = document.getElementById("inv-max");
  if (invCountEl) invCountEl.textContent = usedSlots;
  if (invMaxEl) invMaxEl.textContent = maxSlots;

  let counterEl = document.getElementById("inventory-capacity-counter");
  if (!counterEl) {
    counterEl = document.createElement("div");
    counterEl.id = "inventory-capacity-counter";
    counterEl.className = "inventory-capacity-pill";
    list.parentNode.insertBefore(counterEl, list);
  }

  counterEl.innerHTML = `
    <span>📦 Capacity:</span>
    <strong class="${usedSlots >= maxSlots ? 'capacity-full' : ''}">${usedSlots} / ${maxSlots} Slots Used</strong>
  `;

  if (!items.length) {
    list.innerHTML = `<p class="empty-message">Your inventory is empty.</p>`;
    return;
  }

  items.forEach((inv, realIdx) => {
    const itemKey = inv.item_id || inv.id;
    const itemDef = ALL_ITEMS[itemKey] || ALL_ITEMS[inv.id] || ALL_ITEMS[inv.item_id];
    const meta = inv.metadata || {};

    const item = itemDef ? {
      ...itemDef,
      ...inv,
      ...meta,
      id: itemDef.id || itemKey,
      name: inv.name || meta.name || itemDef.name,
      icon: inv.icon || meta.icon || itemDef.icon || "📦",
      type: meta.slot_type || itemDef.slot_type || itemDef.type || inv.item_type || inv.type || "equipment"
    } : {
      id: itemKey,
      name: inv.name || meta.name || itemKey,
      icon: inv.icon || meta.icon || "📦",
      type: meta.slot_type || inv.item_type || inv.type || "material",
      slot_type: meta.slot_type || inv.item_type || inv.type,
      desc: "Equipment or Resource",
      cost: inv.value || meta.cost || 10
    };

    const qty = Math.max(1, Number(inv.qty ?? inv.quantity ?? 1));
    inv.qty = qty;
    inv.quantity = qty;

    const isConsumable = item.type === "consumable" || item.type === "food";
    const slot = getEquipmentSlot(itemDef || item, inv);
    const isEquippable = Boolean(slot) || item.type === "weapon" || item.type === "armor" || item.type === "ring" || item.type === "head" || item.type === "legs" || Boolean(meta.slot_type);

    const qtyBadgeHTML = `<span class="item-qty-badge" title="Quantity: ${qty}">x${qty}</span>`;

    let statsHtml = `<p>${item.desc || "Item"}</p>`;
    if (isEquippable) {
      const statsList = [];
      const atk = meta.attack_power || meta.power || item.value || item.attack_power;
      const def = meta.defense || (item.stat === "defense" ? item.value : null);
      const crit = meta.crit_chance || (item.stat === "critChance" ? item.value : null);
      if (atk) statsList.push(`+${atk} Atk`);
      if (def) statsList.push(`+${def} Def`);
      if (crit) statsList.push(`+${Math.round(crit * 100)}% Crit`);
      statsHtml = `<p>${statsList.length ? statsList.join(" | ") : (item.desc || "Equippable Gear")}</p>`;
    }

    const singlePrice = Math.round((item.cost || 10) * 0.5);
    const totalPrice = singlePrice * qty;

    let actionsHtml = "";
    if (qty > 1) {
      actionsHtml = `
        <button class="btn-sell btn-sell-one" data-item="${item.id}" data-index="${realIdx}">Sell 1 (${singlePrice}g)</button>
        <button class="btn-sell btn-sell-all" data-item="${item.id}" data-index="${realIdx}">Sell All (${totalPrice}g)</button>
      `;
    } else {
      actionsHtml = `<button class="btn-sell" data-item="${item.id}" data-index="${realIdx}">Sell ${singlePrice}g</button>`;
    }

    if (isConsumable) {
      actionsHtml = `<button class="btn-upgrade btn-use" data-item="${item.id}" data-index="${realIdx}">Use</button>` + actionsHtml;
    } else if (isEquippable) {
      actionsHtml = `<button class="btn-upgrade btn-equip" data-item="${item.id}" data-inv-db-id="${inv.dbId || inv.id || ''}" data-index="${realIdx}">Equip</button>` + actionsHtml;
    }

    const el = document.createElement("div");
    el.className = "inventory-item";
    el.innerHTML = `
      <div class="item-icon">${inv.icon || item.icon}</div>
      <div class="item-details">
        <h5 style="display:flex; align-items:center; gap:6px; margin:0 0 4px 0;">
          <span>${inv.name || item.name}</span>
          ${qtyBadgeHTML}
        </h5>
        ${statsHtml}
      </div>
      <div class="inventory-item-actions">${actionsHtml}</div>
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
    const hpLvl = Number(playerState.upgrades?.hpLevel ?? playerState.upgrades?.hp ?? 0) || 0;
    const cost = 10 + hpLvl * 15;
    if (playerState.gold >= cost) {
      playerState.gold -= cost;
      playerState.stats.maxHp += 10;
      playerState.upgrades.hpLevel = hpLvl + 1;
      playerState.upgrades.hp = hpLvl + 1;
      const effStats = getEffectiveStats();
      playerState.currentHp = Math.min(effStats.maxHp, playerState.currentHp + 10);
      savePlayerState(); renderStats(); renderShop();
      showToast("❤️ HP upgraded!", "success");
      if (typeof playSound === "function") playSound("purchase");
      if (typeof renderPetSection === "function") renderPetSection();
    }
  });
  document.getElementById("upgrade-power-btn").addEventListener("click", () => {
    const pwrLvl = Number(playerState.upgrades?.powerLevel ?? playerState.upgrades?.power ?? 0) || 0;
    const cost = 10 + pwrLvl * 15;
    if (playerState.gold >= cost) {
      playerState.gold -= cost;
      playerState.stats.power += 2;
      playerState.upgrades.powerLevel = pwrLvl + 1;
      playerState.upgrades.power = pwrLvl + 1;
      savePlayerState(); renderStats(); renderShop();
      showToast("⚔️ Power upgraded!", "success");
      if (typeof playSound === "function") playSound("purchase");
    }
  });
  document.getElementById("upgrade-defense-btn").addEventListener("click", () => {
    const defLvl = Number(playerState.upgrades?.defenseLevel ?? playerState.upgrades?.defense ?? 0) || 0;
    const cost = 10 + defLvl * 15;
    if (playerState.gold >= cost) {
      playerState.gold -= cost;
      playerState.stats.defense += 1;
      playerState.upgrades.defenseLevel = defLvl + 1;
      playerState.upgrades.defense = defLvl + 1;
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
  const updateBulkButton = (itemId) => {
    const input = document.getElementById(`shop-qty-input-${itemId}`);
    const btn = document.getElementById(`btn-buy-${itemId}`);
    if (!input || !btn) return;
    
    let qty = parseInt(input.value, 10) || 1;
    if (qty < 1) { qty = 1; input.value = 1; }
    const unitCost = parseInt(input.dataset.unitcost, 10) || 0;
    const totalCost = unitCost * qty;
    
    btn.innerHTML = `Buy ${qty}x <span class="cost" id="btn-buy-cost-${itemId}">${formatNumber(totalCost)}g</span>`;
    btn.disabled = playerState.gold < totalCost;
  };

  const handleBuy = (e) => {
    const plus = e.target.closest(".shop-qty-plus");
    const minus = e.target.closest(".shop-qty-minus");
    const preset = e.target.closest(".shop-preset-btn");
    const btn = e.target.closest(".btn-buy");

    if (plus) {
      const itemId = plus.dataset.item;
      const input = document.getElementById(`shop-qty-input-${itemId}`);
      if (input) {
        input.value = (parseInt(input.value, 10) || 1) + 1;
        updateBulkButton(itemId);
      }
      return;
    }
    if (minus) {
      const itemId = minus.dataset.item;
      const input = document.getElementById(`shop-qty-input-${itemId}`);
      if (input) {
        const cur = parseInt(input.value, 10) || 1;
        if (cur > 1) {
          input.value = cur - 1;
          updateBulkButton(itemId);
        }
      }
      return;
    }
    if (preset) {
      const itemId = preset.dataset.item;
      const qty = parseInt(preset.dataset.qty, 10) || 1;
      const input = document.getElementById(`shop-qty-input-${itemId}`);
      if (input) {
        input.value = qty;
        updateBulkButton(itemId);
      }
      return;
    }
    if (btn && !btn.disabled) {
      const itemId = btn.dataset.item;
      const input = document.getElementById(`shop-qty-input-${itemId}`);
      const qty = input ? (parseInt(input.value, 10) || 1) : 1;
      buyItem(itemId, qty);
    }
  };

  ["shop-weapons-container","shop-armor-container","shop-rings-container","shop-consumables-container","shop-food-container","shop-materials-container"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.removeEventListener("click", handleBuy);
      el.addEventListener("click", handleBuy);
      el.addEventListener("input", (e) => {
        const input = e.target.closest(".shop-qty-input");
        if (input) updateBulkButton(input.dataset.item);
      });
    }
  });
}

function buyItem(itemId, qty = 1) {
  const item = ALL_ITEMS[itemId];
  if (!item) return;

  const count = Math.max(1, parseInt(qty, 10) || 1);

  if (item.type === "consumable" || item.type === "material" || item.type === "food") {
    const totalCost = item.cost * count;
    if (playerState.gold < totalCost) { showToast(`Not enough gold! Costs ${formatNumber(totalCost)}g`, "error"); return; }
    playerState.gold -= totalCost;
    addToInventory(itemId, count);
    renderStats(); renderShop(); renderInventory();
    if (typeof renderMaterials === "function") renderMaterials();
    showToast(`✅ Purchased ${count}x ${item.name}!`, "success");
    if (typeof playSound === "function") playSound("purchase");
    return;
  }

  const targetSlot = getEquipmentSlot(item);
  const isOwned = (playerState.equipment && targetSlot && (playerState.equipment[targetSlot] === itemId || playerState.equipment.weapon === itemId || playerState.equipment.armor === itemId || playerState.equipment.ring === itemId)) ||
                  playerState.inventory.some(i => i.id === itemId);
  if (isOwned) { showToast("You already own this item!", "error"); return; }
  if (playerState.gold < item.cost) { showToast("Not enough gold!", "error"); return; }

  playerState.gold -= item.cost;
  equipItem(itemId);
  showToast(`✅ Purchased & equipped ${item.name}!`, "success");
  if (typeof playSound === "function") playSound("purchase");
}

function getEquipmentSlot(itemOrId, invItem) {
  let item = typeof itemOrId === "object" ? itemOrId : ALL_ITEMS[itemOrId];
  if (!item && invItem) item = invItem;

  const slotType = item?.slot_type || item?.slotType || item?.type;

  if (typeof itemOrId === "string") {
    const lower = itemOrId.toLowerCase();
    if (lower.includes("head") || lower.includes("helm") || lower.includes("hood") || lower.includes("crown")) return "head";
    if (lower.includes("amulet") || lower.includes("neck") || lower.includes("pendant")) return "amulet";
    if (lower.includes("chest") || lower.includes("armor") || lower.includes("plate") || lower.includes("robe")) return "chest";
    if (lower.includes("main") || lower.includes("weapon") || lower.includes("sword") || lower.includes("blade") || lower.includes("bow") || lower.includes("staff")) return "main_hand";
    if (lower.includes("off") || lower.includes("shield") || lower.includes("tome") || lower.includes("crest")) return "off_hand";
    if (lower.includes("glove") || lower.includes("gauntlet") || lower.includes("hand")) return "gloves";
    if (lower.includes("ring") || lower.includes("band") || lower.includes("acc")) return "accessory";
    if (lower.includes("leg") || lower.includes("pant") || lower.includes("greave")) return "legs";
    if (lower.includes("boot") || lower.includes("sabaton") || lower.includes("foot") || lower.includes("feet")) return "boots";
    if (lower.includes("trinket") || lower.includes("relic") || lower.includes("charm")) return "trinket";
  }

  if (!slotType) return null;
  const s = String(slotType).toLowerCase();
  if (s === "head" || s === "helmet" || s === "hat") return "head";
  if (s === "chest" || s === "armor" || s === "body" || s === "vest") return "chest";
  if (s === "legs" || s === "pants" || s === "leggings") return "legs";
  if (s === "main_hand" || s === "weapon" || s === "sword" || s === "dagger" || s === "bow" || s === "wand" || s === "staff" || s === "mace" || s === "hammer") return "main_hand";
  if (s === "off_hand" || s === "shield") return "off_hand";
  if (s === "accessory" || s === "ring" || s === "amulet") return "accessory";
  return null;
}

function equipItem(itemId, invIndex) {
  let invItem = null;
  if (invIndex !== undefined && invIndex >= 0 && playerState.inventory[invIndex]) {
    invItem = playerState.inventory[invIndex];
  } else if (Array.isArray(playerState.inventory)) {
    invItem = playerState.inventory.find(i => i.id === itemId || i.item_id === itemId || i.dbId === itemId);
  }

  const actualItemId = invItem ? (invItem.item_id || invItem.id || itemId) : itemId;
  const itemDef = ALL_ITEMS[actualItemId] || ALL_ITEMS[itemId] || invItem;
  const slotKey = getEquipmentSlot(itemDef || actualItemId, invItem);

  if (!slotKey) {
    showToast("This item cannot be equipped!", "error");
    return;
  }

  if (!playerState.equipment) {
    playerState.equipment = { head: null, chest: null, legs: null, main_hand: null, off_hand: null, accessory: null, weapon: null, armor: null, ring: null };
  }

  // Get old item in this slot
  let oldEquipped = playerState.equipment[slotKey];
  if (!oldEquipped) {
    if (slotKey === "main_hand") oldEquipped = playerState.equipment.weapon;
    else if (slotKey === "chest") oldEquipped = playerState.equipment.armor;
    else if (slotKey === "accessory") oldEquipped = playerState.equipment.ring;
  }

  const newPayload = invItem ? (invItem.metadata ? { item_id: actualItemId, id: actualItemId, name: invItem.name || itemDef?.name || actualItemId, metadata: invItem.metadata } : actualItemId) : actualItemId;

  // Set new equipment
  playerState.equipment[slotKey] = newPayload;
  if (slotKey === "main_hand") playerState.equipment.weapon = actualItemId;
  else if (slotKey === "chest") playerState.equipment.armor = actualItemId;
  else if (slotKey === "accessory") playerState.equipment.ring = actualItemId;

  // Move old item back to inventory
  if (oldEquipped) {
    const oldId = typeof oldEquipped === "object" ? (oldEquipped.item_id || oldEquipped.id) : oldEquipped;
    if (oldId && oldId !== actualItemId) {
      playerState.inventory.push({ id: oldId, item_id: oldId, qty: 1 });
    }
  }

  // Remove equipped item from inventory
  if (invIndex !== undefined && invIndex >= 0) {
    playerState.inventory.splice(invIndex, 1);
  } else {
    const idx = playerState.inventory.findIndex(i => i.id === itemId || i.item_id === itemId || i.id === actualItemId || i.item_id === actualItemId);
    if (idx > -1) playerState.inventory.splice(idx, 1);
  }

  if (typeof AccountStore !== "undefined") {
    const activeChar = AccountStore.getActiveCharacter();
    if (activeChar) activeChar.equipped = playerState.equipment;
  }

  savePlayerState();
  renderStats();
  renderShop();
  renderInventory();
  if (typeof renderPaperdollGrid === "function") renderPaperdollGrid();
}

function unequipItem(slotKey) {
  if (!playerState.equipment) return;

  let raw = playerState.equipment[slotKey];
  if (!raw) {
    if (slotKey === "main_hand") raw = playerState.equipment.weapon;
    else if (slotKey === "chest") raw = playerState.equipment.armor;
    else if (slotKey === "accessory") raw = playerState.equipment.ring;
  }

  if (!raw) {
    showToast("No item equipped in that slot!", "error");
    return;
  }

  const itemId = typeof raw === "object" ? (raw.item_id || raw.id) : raw;
  const maxSlots = playerState.maxInventorySlots || 20;

  if (playerState.inventory.length >= maxSlots) {
    showToast("Inventory is full! Cannot unequip.", "error");
    return;
  }

  // Clear slot
  playerState.equipment[slotKey] = null;
  if (slotKey === "main_hand") playerState.equipment.weapon = null;
  else if (slotKey === "chest") playerState.equipment.armor = null;
  else if (slotKey === "accessory") playerState.equipment.ring = null;

  playerState.inventory.push({ id: itemId, qty: 1 });

  if (typeof AccountStore !== "undefined") {
    const activeChar = AccountStore.getActiveCharacter();
    if (activeChar) activeChar.equipped = playerState.equipment;
  }

  savePlayerState();
  renderStats();
  renderShop();
  renderInventory();
  if (typeof renderPaperdollGrid === "function") renderPaperdollGrid();

  const itemDef = ALL_ITEMS[itemId];
  showToast(`📦 Unequipped ${itemDef ? itemDef.name : itemId}!`, "info");
}

function equipItemFromInventory(itemId, invIndex) {
  equipItem(itemId, invIndex);
  const itemDef = ALL_ITEMS[itemId];
  showToast(`✅ Equipped ${itemDef ? itemDef.name : itemId}!`, "success");
}

function sellItemFromInventory(itemId, index) {
  const inv = playerState.inventory[index];
  if (!inv) return;
  const itemKey = inv.item_id || inv.id || itemId;
  const itemDef = ALL_ITEMS[itemKey] || ALL_ITEMS[itemId];
  const cost = itemDef ? (itemDef.cost || itemDef.value || 10) : (inv.cost || inv.value || 10);
  const price = Math.round(cost * 0.5);

  const currentQty = Math.max(1, Number(inv.qty ?? inv.quantity ?? 1));

  playerState.gold += price;

  if (currentQty > 1) {
    inv.qty = currentQty - 1;
    inv.quantity = currentQty - 1;
  } else {
    playerState.inventory.splice(index, 1);
  }

  savePlayerState(); renderStats(); renderShop(); renderInventory();
  if (typeof renderMaterials === "function") renderMaterials();
  showToast(`💰 Sold 1x ${inv.name || (itemDef ? itemDef.name : itemKey)} for ${price}g!`, "success");
}

function sellAllStackFromInventory(itemId, index) {
  const inv = playerState.inventory[index];
  if (!inv) return;
  const itemKey = inv.item_id || inv.id || itemId;
  const itemDef = ALL_ITEMS[itemKey] || ALL_ITEMS[itemId];
  const cost = itemDef ? (itemDef.cost || itemDef.value || 10) : (inv.cost || inv.value || 10);
  const singlePrice = Math.round(cost * 0.5);
  const currentQty = Math.max(1, Number(inv.qty ?? inv.quantity ?? 1));
  const totalPrice = singlePrice * currentQty;

  playerState.gold += totalPrice;
  playerState.inventory.splice(index, 1);

  savePlayerState(); renderStats(); renderShop(); renderInventory();
  if (typeof renderMaterials === "function") renderMaterials();
  showToast(`💰 Sold x${currentQty} ${inv.name || (itemDef ? itemDef.name : itemKey)} for ${totalPrice}g!`, "success");
}

function showBulkSellModal() {
  let modal = document.getElementById("bulk-sell-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "bulk-sell-modal";
    modal.className = "modal active";
    document.body.appendChild(modal);
  } else {
    modal.classList.add("active");
  }

  const items = playerState.inventory || [];

  let matCount = 0;
  let matItemsCount = 0;
  let matGold = 0;

  let gearCount = 0;
  let gearGold = 0;

  let totalCount = 0;
  let totalGold = 0;

  items.forEach(inv => {
    const itemKey = inv.item_id || inv.id;
    const itemDef = ALL_ITEMS[itemKey] || ALL_ITEMS[inv.id] || ALL_ITEMS[inv.item_id];
    const cost = itemDef ? (itemDef.cost || itemDef.value || 10) : (inv.cost || inv.value || 10);
    const singlePrice = Math.round(cost * 0.5);
    const qty = Math.max(1, Number(inv.qty ?? inv.quantity ?? 1));
    const itemType = inv.type || inv.item_type || (itemDef ? itemDef.type : "material");

    const itemTotalVal = singlePrice * qty;
    totalCount += qty;
    totalGold += itemTotalVal;

    if (itemType === "material") {
      matItemsCount++;
      matCount += qty;
      matGold += itemTotalVal;
    } else if (itemType === "weapon" || itemType === "armor" || itemType === "ring" || itemType === "head" || itemType === "legs" || itemType === "equipment") {
      gearCount += qty;
      gearGold += itemTotalVal;
    }
  });

  modal.innerHTML = `
    <div class="modal-content" style="max-width:440px;">
      <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center;">
        <h2>⚡ Bulk Sell Inventory</h2>
        <button class="close-modal-btn" onclick="document.getElementById('bulk-sell-modal').classList.remove('active')" style="background:none; border:none; color:var(--text-muted); font-size:1.5rem; cursor:pointer;">×</button>
      </div>
      <div class="modal-body" style="display:flex; flex-direction:column; gap:12px; margin-top:10px;">
        <p style="font-size:0.85rem; color:var(--text-muted); margin:0;">Select a category to quick sell items directly from your backpack:</p>

        <button id="btn-bulk-sell-materials" class="btn-action" style="padding:10px 14px; text-align:left; display:flex; justify-content:space-between; align-items:center; background:var(--bg-elevated); border:1px solid var(--border); border-radius:6px; cursor:pointer;" ${matCount === 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
          <div>
            <strong style="display:block; font-size:0.9rem;">🧹 Sell All Materials</strong>
            <span style="font-size:0.75rem; color:var(--text-muted);">${matCount} items (${matItemsCount} stacks)</span>
          </div>
          <span style="color:var(--gold); font-weight:bold;">+${matGold}g</span>
        </button>

        <button id="btn-bulk-sell-gear" class="btn-action" style="padding:10px 14px; text-align:left; display:flex; justify-content:space-between; align-items:center; background:var(--bg-elevated); border:1px solid var(--border); border-radius:6px; cursor:pointer;" ${gearCount === 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
          <div>
            <strong style="display:block; font-size:0.9rem;">🗡️ Sell All Unequipped Gear</strong>
            <span style="font-size:0.75rem; color:var(--text-muted);">${gearCount} items</span>
          </div>
          <span style="color:var(--gold); font-weight:bold;">+${gearGold}g</span>
        </button>

        <button id="btn-bulk-sell-all-items" class="btn-danger" style="padding:10px 14px; text-align:left; display:flex; justify-content:space-between; align-items:center; background:var(--danger-dim); border:1px solid var(--danger); border-radius:6px; cursor:pointer;" ${totalCount === 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
          <div>
            <strong style="display:block; font-size:0.9rem;">🎒 Sell Everything in Backpack</strong>
            <span style="font-size:0.75rem; color:var(--text-muted);">${totalCount} items total</span>
          </div>
          <span style="color:#ff6b6b; font-weight:bold;">+${totalGold}g</span>
        </button>
      </div>
    </div>
  `;

  const closeM = () => modal.classList.remove("active");

  const matBtn = document.getElementById("btn-bulk-sell-materials");
  if (matBtn && matCount > 0) {
    matBtn.addEventListener("click", () => {
      closeM();
      bulkSellCategory("material");
    });
  }

  const gearBtn = document.getElementById("btn-bulk-sell-gear");
  if (gearBtn && gearCount > 0) {
    gearBtn.addEventListener("click", () => {
      closeM();
      bulkSellCategory("gear");
    });
  }

  const allBtn = document.getElementById("btn-bulk-sell-all-items");
  if (allBtn && totalCount > 0) {
    allBtn.addEventListener("click", () => {
      closeM();
      bulkSellCategory("all");
    });
  }
}

function bulkSellCategory(category) {
  const items = playerState.inventory || [];
  if (!items.length) return;

  let soldQty = 0;
  let totalGoldGained = 0;

  const remainingItems = [];

  items.forEach(inv => {
    const itemKey = inv.item_id || inv.id;
    const itemDef = ALL_ITEMS[itemKey] || ALL_ITEMS[inv.id] || ALL_ITEMS[inv.item_id];
    const cost = itemDef ? (itemDef.cost || itemDef.value || 10) : (inv.cost || inv.value || 10);
    const singlePrice = Math.round(cost * 0.5);
    const qty = Math.max(1, Number(inv.qty ?? inv.quantity ?? 1));
    const itemType = inv.type || inv.item_type || (itemDef ? itemDef.type : "material");

    let shouldSell = false;
    if (category === "all") {
      shouldSell = true;
    } else if (category === "material" && itemType === "material") {
      shouldSell = true;
    } else if (category === "gear" && (itemType === "weapon" || itemType === "armor" || itemType === "ring" || itemType === "head" || itemType === "legs" || itemType === "equipment")) {
      shouldSell = true;
    }

    if (shouldSell) {
      soldQty += qty;
      totalGoldGained += (singlePrice * qty);
    } else {
      remainingItems.push(inv);
    }
  });

  if (soldQty === 0) {
    showToast("No items matched bulk sell selection.", "info");
    return;
  }

  playerState.inventory = remainingItems;
  playerState.gold += totalGoldGained;

  savePlayerState();
  renderStats();
  renderShop();
  renderInventory();
  if (typeof renderMaterials === "function") renderMaterials();

  const label = category === "material" ? "materials" : (category === "gear" ? "gear items" : "items");
  showToast(`💰 Bulk sold ${soldQty} ${label} for +${totalGoldGained}g!`, "success");
}

function useConsumableFromInventory(itemId, index) {
  const inv = playerState.inventory[index];
  const item = ALL_ITEMS[itemId];
  if (!item || !inv) return;
  
  if (item.type === "food" && activeBattleInterval) {
    if (typeof showToast === "function") showToast("Food can only be used outside of battle!", "error");
    return;
  }
  
  if (item.stat === "restoreHp") {
    const effStats = getEffectiveStats();
    if (playerState.currentHp >= effStats.maxHp) {
      showToast("HP is already full!", "error");
      return;
    }
    playerState.currentHp = Math.min(effStats.maxHp, playerState.currentHp + item.value);
    showToast(`🧪 Used ${item.name}! Restored ${item.value} HP.`, "success");
    if (typeof playSound === "function") playSound("skill");
  }
  
  if (inv.qty && inv.qty > 1) {
    inv.qty--;
  } else {
    playerState.inventory.splice(index, 1);
  }
  
  savePlayerState(); renderStats(); renderInventory();
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

  if (!playerState.upgrades) {
    playerState.upgrades = { hp: 0, power: 0, defense: 0, crit: 0, dodge: 0, mana: 0 };
  }

  // Session allocation state (points being distributed right now)
  const allocations = {};
  SP_OPTIONS.forEach(o => allocations[o.id] = 0);
  let remaining = available;

  // Render options
  optionsEl.innerHTML = "";
  SP_OPTIONS.forEach(opt => {
    const allocatedCount = Number(playerState.upgrades[opt.id] ?? 0);
    const card = document.createElement("div");
    card.className = "sp-option-card";
    card.innerHTML = `
      <div class="sp-option-info">
        <div class="sp-option-label">${opt.label}</div>
        <div class="sp-option-desc">${opt.desc} <span style="opacity: 0.75; font-size: 0.85em; margin-left: 6px;">(Allocated: ${allocatedCount} pts)</span></div>
      </div>
      <div class="sp-option-controls">
        <button class="sp-btn sp-minus" data-opt="${opt.id}" disabled>−</button>
        <span class="sp-count" id="sp-count-${opt.id}">+0</span>
        <button class="sp-btn sp-plus" data-opt="${opt.id}">+</button>
      </div>`;
    optionsEl.appendChild(card);
  });

  function refresh() {
    if (availableEl) availableEl.textContent = remaining;
    SP_OPTIONS.forEach(opt => {
      const countEl = document.getElementById(`sp-count-${opt.id}`);
      if (countEl) countEl.textContent = `+${allocations[opt.id]}`;
      const minus = optionsEl.querySelector(`.sp-minus[data-opt="${opt.id}"]`);
      const plus  = optionsEl.querySelector(`.sp-plus[data-opt="${opt.id}"]`);
      if (minus) minus.disabled = allocations[opt.id] === 0;
      if (plus)  plus.disabled  = remaining === 0;
    });
    if (confirmBtn) confirmBtn.disabled = (remaining === available);
  }

  optionsEl.onclick = (e) => {
    const plus  = e.target.closest(".sp-plus");
    const minus = e.target.closest(".sp-minus");
    if (plus && remaining > 0) { allocations[plus.dataset.opt]++; remaining--; refresh(); }
    if (minus && allocations[minus.dataset.opt] > 0) { allocations[minus.dataset.opt]--; remaining++; refresh(); }
  };

  if (confirmBtn) {
    confirmBtn.onclick = () => {
      const spent = available - remaining;
      if (spent <= 0) return;

      SP_OPTIONS.forEach(opt => {
        const added = allocations[opt.id];
        if (added <= 0) return;

        playerState.upgrades[opt.id] = (playerState.upgrades[opt.id] || 0) + added;
        if (opt.id === "hp") playerState.upgrades.hpLevel = playerState.upgrades.hp;
        if (opt.id === "power") playerState.upgrades.powerLevel = playerState.upgrades.power;
        if (opt.id === "defense") playerState.upgrades.defenseLevel = playerState.upgrades.defense;

        if (opt.statKey === "top") {
          playerState[opt.stat] = (playerState[opt.stat] || 0) + opt.amount * added;
        } else {
          playerState.stats[opt.stat] = (playerState.stats[opt.stat] || 0) + opt.amount * added;
        }
      });

      playerState.skillPoints = Math.max(0, (playerState.skillPoints || 0) - spent);
      savePlayerState();
      renderStats();
      if (typeof renderSkills === "function") renderSkills();
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
  _setText("player-power-val",  formatNumber(playerPR || 0));
  _setText("battle-stamina-cost",staminaCost);
  _setText("battle-player-name",playerState.name || "Hero");

  // Matchup status
  const matchEl = document.getElementById("power-matchup-status");
  if (matchEl) {
    matchEl.className = "matchup-badge " + (playerPR >= (level.suggested || 0) ? "good" : "bad");
    matchEl.textContent = playerPR >= (level.suggested || 0) ? "✅ Ready" : "⚠️ Underpowered";
  }

  // Player HP bar
  _setWidth("player-hp-bar", (playerState.currentHp / effStats.maxHp) * 100);
  _setText("player-hp-text", `${Math.floor(playerState.currentHp)}/${effStats.maxHp}`);

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

  // Render Pet
  if (typeof renderBattlePet === 'function') renderBattlePet();

  // Reset log
  document.getElementById("battle-log").innerHTML = `<p class="system-message">Press "Start Battle" to challenge ${level.name}!</p>`;

  // Buttons
  _show("start-battle-btn");
  _hide("rematch-battle-btn");
  _hide("close-battle-btn");
  _show("close-battle-modal-btn");

  document.getElementById("start-battle-btn").onclick = () => startBattleSimulation(level);

  const idleCombatBtn = document.getElementById("start-idle-combat-btn");
  if (idleCombatBtn) {
    idleCombatBtn.onclick = async () => {
      const activeSlotId = AccountStore.getAccount()?.activeSlotId || 1;
      await CombatEngine.startBatchCombat(activeSlotId, {
        id: level.id ? `level_${level.id}` : `mob_${level.name.toLowerCase().replace(/\s+/g, "_")}`,
        name: level.name,
        avatar: level.avatar || "⚔️",
        level: level.id || 1,
        regionId: "greenhollow",
        hp: level.hp,
        power: level.power,
        defense: level.defense,
        xp: level.xp,
        gold: level.gold
      });

      modal.classList.remove("active");
      if (typeof UIManager !== "undefined" && UIManager.renderCommandCenter) {
        UIManager.renderCommandCenter();
      }
      showToast(`⚡ Started automated idle combat for ${level.name}!`, "success");
    };
  }

  const rematchBtn = document.getElementById("rematch-battle-btn");
  if (rematchBtn) rematchBtn.onclick = () => {
    const eff = getEffectiveStats();
    if (playerState.currentHp <= 0) {
      showToast("Cannot rematch, HP is 0! Heal up first.", "error");
      return;
    }
    const pMax = playerState.maxMana || preset?.mana || 50;
    _setWidth("player-hp-bar", (playerState.currentHp / eff.maxHp) * 100);
    _setText("player-hp-text", `${Math.floor(playerState.currentHp)}/${eff.maxHp}`);
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

function renderBattlePotions() {
  const container = document.getElementById("battle-potions-bar");
  if (!container) return;
  container.innerHTML = "";

  const hpPotions = playerState.inventory.filter(i => {
    const it = ALL_ITEMS[i.id];
    return it && it.type === "consumable" && it.effect === "heal";
  });

  if (hpPotions.length === 0) {
    container.innerHTML = `<span style="font-size:0.75rem; color:var(--text-muted)">No potions...</span>`;
    return;
  }

  hpPotions.forEach(pot => {
    const it = ALL_ITEMS[pot.id];
    const btn = document.createElement("button");
    btn.className = "battle-potion-btn";
    btn.innerHTML = `${it.icon} <span class="qty">${pot.qty}</span>`;
    btn.onclick = () => useBattlePotion(pot.id);
    container.appendChild(btn);
  });
}

function useBattlePotion(itemId) {
  if (battlePlayerHp <= 0 || battleEnemyHp <= 0) return;
  
  const invIdx = playerState.inventory.findIndex(i => i.id === itemId);
  if (invIdx === -1) return;
  
  const it = ALL_ITEMS[itemId];
  if (!it || it.effect !== "heal") return;

  // Consume
  playerState.inventory[invIdx].qty--;
  if (playerState.inventory[invIdx].qty <= 0) {
    playerState.inventory.splice(invIdx, 1);
  }
  savePlayerState();

  // Apply effect
  const effStats = getEffectiveStats();
  const healAmount = it.value;
  battlePlayerHp = Math.min(effStats.maxHp, battlePlayerHp + healAmount);
  updatePlayerHpUI();
  appendBattleLog(`Usou ${it.name} e curou ${healAmount} HP!`, "player-action");
  
  if (typeof playSound === "function") playSound("skill");
  renderBattlePotions(); // Update qty
  if (typeof renderMaterials === "function") renderMaterials(); // Update global inv UI if possible
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
  if (playerState.currentHp <= 0) {
    showToast("Your HP is 0! Use a potion or wait to recover.", "error");
    _show("close-battle-modal-btn");
    return;
  }
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
  petCooldown = 0;
  activePetData = playerState.activePet ? playerState.pets.find(p => p.id === playerState.activePet) : null;

  const effStats = getEffectiveStats();
  const preset   = CLASS_PRESETS[playerState.class];
  battleMaxMana     = playerState.maxMana || preset?.mana || 50;
  currentBattleMana = battleMaxMana;
  battlePlayerHp    = playerState.currentHp;
  battlePlayerMaxHp = effStats.maxHp;
  battleEnemyHp     = level.hp;
  battleEnemyMaxHp  = level.hp;

  updateBattleManaUI();
  updatePlayerHpUI();
  updateEnemyHpUI();

  // UI lock
  _hide("start-battle-btn");
  _hide("next-level-btn");
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
  renderBattlePotions();

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

    // ── Burn tick ──
    if (battleEffects.enemyBurnRounds > 0) {
      battleEnemyHp = Math.max(0, battleEnemyHp - battleEffects.enemyBurnDamage);
      appendBattleLog(`🔥 Burn: ${battleEffects.enemyBurnDamage} damage! (${battleEffects.enemyBurnRounds - 1} rounds left)`, "combat-player-hit");
      battleEffects.enemyBurnRounds--;
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
      let effDef = level.defense;
      if (battleEffects.enemyArmorBreak > 0) {
        effDef = Math.floor(effDef * 0.5); // 50% defense break
        battleEffects.enemyArmorBreak--;
      }
      let baseDmg = Math.max(1, currentEffStats.power - effDef) * hitMult;
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

    // ── PET ATTACK ──
    if (battleRound % 3 === 0 && activePetData && typeof executePetAction === "function") {
      executePetAction(activePetData, currentEffStats, level);
      if (battleEnemyHp <= 0) { handleBattleVictory(level); return; }
    }

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
    } else if (battleEffects.petAbsorbNextHits > 0) {
      appendBattleLog(`🛡️ Your pet absorbs ${level.name}'s attack!`, "system-message");
      battleEffects.petAbsorbNextHits--;
    } else {
      let enemyDamage = 0, enemyLog = "", isEnemyCrit = false;
      if (Math.random() < currentEffStats.dodgeChance) {
        enemyLog = `💨 You dodged ${level.name}'s attack!`;
      } else {
        let effEnemyPwr = level.power;
        if (battleEffects.enemyWeakenRounds > 0) {
          effEnemyPwr = Math.floor(effEnemyPwr * (1 - battleEffects.enemyWeakenAmt));
          battleEffects.enemyWeakenRounds--;
        }
        if (battleEffects.enemySlowRounds > 0) {
           // Skip turn instead of reducing power as slow usually means missing turns.
           appendBattleLog(`❄️ ${level.name} is slowed and missed their attack!`, "system-message");
           battleEffects.enemySlowRounds--;
           return; // skip the rest of the enemy attack
        }
        let rawDmg = Math.max(1, effEnemyPwr - currentEffStats.defense);
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
      if (battlePlayerHp <= 0) { 
        if (activePetData && activePetData.speciesId === "angel_fallen" && !battleEffects.petReviveUsed) {
          battleEffects.petReviveUsed = true;
          battlePlayerHp = Math.floor(battlePlayerMaxHp * 0.30);
          appendBattleLog(`🪽 Fallen Angel revived you with 30% HP!`, "combat-player-crit");
          updatePlayerHpUI();
        } else {
          handleBattleDefeat(); return; 
        }
      }
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
  const effStats = getEffectiveStats();
  const bonuses = effStats.clanBonuses || { extraGoldPercent: 0, extraXpPercent: 0 };
  
  let goldMult = 1 + (bonuses.extraGoldPercent / 100);
  let xpMult = 1 + (bonuses.extraXpPercent / 100);
  
  if (isPremiumActive()) {
    goldMult *= PREMIUM_BONUSES.goldMult;
    xpMult *= PREMIUM_BONUSES.xpMult;
  }
  
  const finalGold = Math.floor(level.gold * goldMult);
  const finalXp = Math.floor(level.xp * xpMult);

  appendBattleLog(`🏆 Victory! You defeated ${level.name}!`, "combat-victory");
  showToast(`⭐ Victory! +${finalGold}g and +${finalXp} XP!`, "success");
  if (typeof playSound === "function") playSound("victory");

  playerState.currentHp = battlePlayerHp;
  playerState.gold += finalGold;
  playerState.xp   += finalXp;

  // Pet XP
  if (playerState.activePet) {
    const pet = playerState.pets.find(p => p.id === playerState.activePet);
    if (pet && typeof PET_XP_TABLE !== 'undefined') {
      const petXpGain = Math.round(level.xp * 0.3); // 30% do XP da batalha
      pet.xp += petXpGain;
      
      // Level up check
      while (pet.level < 20 && pet.xp >= PET_XP_TABLE[pet.level]) {
        pet.xp -= PET_XP_TABLE[pet.level];
        pet.level++;
        appendBattleLog(`⭐ ${pet.name} subiu to Level ${pet.level}!`, "combat-victory");
        if (typeof showToast === 'function') showToast(`⭐ Pet ${pet.name} Level ${pet.level}!`, "success");
      }
    }
  }

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
  let leveledUp = false;
  if (!playerState.xpNeeded || playerState.xpNeeded <= 100 && playerState.level > 1) {
    playerState.xpNeeded = getRequiredXpForLevel(playerState.level);
  }
  while (playerState.xp >= playerState.xpNeeded) {
    playerState.xp -= playerState.xpNeeded;
    playerState.level++;
    playerState.xpNeeded = getRequiredXpForLevel(playerState.level);
    playerState.stats.maxHp   += 15;
    playerState.stats.power   += 3;
    playerState.stats.defense += 2;
    playerState.stamina = getMaxStamina(playerState.level);
    playerState.lastStaminaUpdate = Date.now();
    playerState.skillPoints = (playerState.skillPoints || 0) + 3;
    appendBattleLog(`⭐ LEVEL UP! Now Level ${playerState.level}! Stats increased. +3 Skill Points!`, "combat-victory");
    showToast(`⭐ Level ${playerState.level}! +3 Skill Points available!`, "info");
    if (typeof playSound === "function") playSound("level_up");
    leveledUp = true;
  }
  
  if (leveledUp) {
    checkAchievements("level_up");
  }
  
  if (!level.isBotDuel) {
    checkAchievements("battle_win", { levelId: level.id });
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

  savePlayerState();
  renderMap();

  checkForLootDrop(level);
  
  // Material drop (independent of gear loot)
  const materialDropChance = isPremiumActive() ? PREMIUM_BONUSES.materialDropChance : 0.60; // 60% chance ou 70% premium
  if (Math.random() < materialDropChance) {
    const possibleMats = Object.values(MATERIAL_ITEMS);
    const droppedMat = possibleMats[Math.floor(Math.random() * possibleMats.length)];
    const existing = playerState.inventory.find(i => i.id === droppedMat.id);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      playerState.inventory.push({ id: droppedMat.id, qty: 1 });
    }
    appendBattleLog(`🌿 Found ${droppedMat.name}!`, "combat-victory");
  }

  // Pet Egg Drop (8% base, +2% premium)
  const eggDropChance = isPremiumActive() ? 0.10 : 0.08;
  if (Math.random() < eggDropChance && typeof PET_EGGS !== 'undefined') {
    const possibleEggs = Object.values(PET_EGGS);
    const droppedEgg = possibleEggs[Math.floor(Math.random() * possibleEggs.length)];
    const existingEgg = playerState.inventory.find(i => i.id === droppedEgg.id);
    if (existingEgg) {
      existingEgg.qty = (existingEgg.qty || 1) + 1;
    } else {
      playerState.inventory.push({ id: droppedEgg.id, qty: 1 });
    }
    appendBattleLog(`🥚 Found ${droppedEgg.name}!`, "combat-victory");
    if (typeof showToast === 'function') showToast(`🥚 ${droppedEgg.name} dropped!`, "success");
  }

  savePlayerState();
  renderMap();
  renderStats();
  renderShop();
  renderSkills();

  _show("close-battle-modal-btn", "inline-flex");
  _show("close-battle-btn", "inline-flex");

  const rematchBtn = document.getElementById("rematch-battle-btn");
  if (rematchBtn) {
    rematchBtn.style.display = "inline-flex";
    rematchBtn.onclick = () => {
      openBattleModal(level);
      startBattleSimulation(level);
    };
  }

  const nextLevelBtn = document.getElementById("next-level-btn");
  if (nextLevelBtn) {
    const currentId = typeof level.id === "number" ? level.id : playerState.unlockedLevel;
    const nextLvl = LEVELS.find(l => l.id === currentId + 1);
    if (nextLvl && nextLvl.id <= playerState.unlockedLevel) {
      nextLevelBtn.style.display = "inline-flex";
      nextLevelBtn.onclick = () => {
        openBattleModal(nextLvl);
        startBattleSimulation(nextLvl);
      };
    } else {
      nextLevelBtn.style.display = "none";
    }
  }
}

// ── DEFEAT ──
function handleBattleDefeat() {
  clearInterval(activeBattleInterval);
  activeBattleInterval = null;

  appendBattleLog(`💀 Defeat! You were knocked out...`, "combat-defeat");
  showToast("💀 Defeated! Upgrade your stats and try again.", "error");
  if (typeof playSound === "function") playSound("defeat");
  
  playerState.currentHp = 0;
  savePlayerState();

  _hide("next-level-btn");
  _show("close-battle-modal-btn", "inline-flex");
  _show("close-battle-btn", "inline-flex");

  const rematchBtn = document.getElementById("rematch-battle-btn");
  if (rematchBtn) {
    rematchBtn.style.display = "inline-flex";
    rematchBtn.onclick = () => {
      openBattleModal(currentBattleLevel);
      startBattleSimulation(currentBattleLevel);
    };
  }
}

// ================================================================
// LOOT SYSTEM
// ================================================================
function checkForLootDrop(level) {
  const effStats = getEffectiveStats();
  const bonuses = effStats.clanBonuses || { extraDropChance: 0 };
  let dropChance = 0.45 + (bonuses.extraDropChance / 100);
  if (isPremiumActive()) {
    dropChance = PREMIUM_BONUSES.lootDropChance + (bonuses.extraDropChance / 100);
  }
  
  if (Math.random() > dropChance) return; // Drop chance with bonus

  const levelId = typeof level.id === "number" ? level.id : (level.botLevel || playerState.level || 1);
  const possible = Object.values(EXPANDED_ITEMS).filter(i => i.min_level <= levelId + 5 && i.min_level >= Math.max(1, levelId - 10));
  const candidatePool = possible.length ? possible : Object.values(EXPANDED_ITEMS);
  const loot = candidatePool[Math.floor(Math.random() * candidatePool.length)];

  if (!loot) return;

  let slotKey = loot.slot_type;
  if (slotKey === "main_hand" || slotKey === "off_hand") slotKey = "weapon";
  else if (slotKey === "accessory") slotKey = "ring";
  else if (slotKey === "chest" || slotKey === "head" || slotKey === "legs") slotKey = "armor";

  const equipped = playerState.equipment[slotKey];
  const equippedItem = equipped ? (typeof equipped === "object" ? equipped : ALL_ITEMS[equipped]) : null;
  const lootPower = loot.power || loot.defense || loot.max_hp || 10;
  const equippedPower = equippedItem ? (equippedItem.power || equippedItem.defense || equippedItem.max_hp || 5) : 0;

  if (gameSettings.autoEquip && (!equippedItem || lootPower > equippedPower)) {
    equipLootImmediately(loot);
    showToast(`🎁 Auto-equipped ${loot.name}!`, "success");
  } else {
    pendingLoot = loot;
    showCompareModal(equippedItem, loot);
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

// ================================================================
// HOUSING SYSTEM LOGIC
// ================================================================

function getStationSpeedBonus(skillId) {
  const stationMapping = {
    farming: "farm_plot",
    ranching: "ranch",
    alchemy: "alchemy_lab",
    blacksmith: "forge",
    tanning: "tannery",
    tailoring: "loom",
  };
  const requiredStation = stationMapping[skillId];
  if (!requiredStation) return 0;
  
  let bonus = 0;
  playerState.house.slots.forEach(slot => {
    if (slot.id === requiredStation) {
      bonus += [0, 0.1, 0.25, 0.5][slot.stationTier] || 0.1;
    }
  });
  return bonus;
}

function getHouseInfo() {
  const tierData = HOUSE_TIERS[playerState.house.tier];
  let hpRegenMult = 1.0;
  
  // Bed bonus
  const bed = playerState.house.slots.find(s => s.id === "rest_bed");
  if (bed) hpRegenMult += [0, 0.5, 1.0, 2.0][bed.stationTier];

  // Decoration bonus
  playerState.house.decorations.forEach(d => {
    const deco = DECORATIONS[d.id];
    if (deco && deco.bonus && deco.bonus.type === "hpRegen") {
      hpRegenMult += deco.bonus.value;
    }
  });

  return {
    tier: playerState.house.tier,
    name: playerState.house.name,
    maxSlots: tierData.slots,
    usedSlots: playerState.house.slots.length,
    freeSlots: tierData.slots - playerState.house.slots.length,
    maxDecorations: tierData.maxDecorations,
    usedDecorations: playerState.house.decorations.length,
    icon: tierData.icon,
    hpRegenBonus: hpRegenMult,
    hasTrainingDummy: playerState.house.slots.some(s => s.id === "training_dummy"),
  };
}

function findInventoryMaterial(matId) {
  const invList = playerState.inventory || [];
  return invList.find(i => {
    const id = (i.id || i.item_id || "").toLowerCase();
    const name = (i.name || "").toLowerCase();
    const target = (matId || "").toLowerCase();

    if (id === target) return true;

    if (target === "mat_wood" && (id.includes("wood") || id.includes("log") || name.includes("wood"))) return true;
    if (target === "mat_stone" && (id.includes("stone") || name.includes("stone"))) return true;
    if (target === "mat_iron_ore" && (id.includes("iron") || id.includes("ore") || name.includes("iron"))) return true;
    if (target === "mat_leather" && (id.includes("leather") || id.includes("hide") || name.includes("hide") || name.includes("leather"))) return true;

    return false;
  });
}

function promptQuickBuyForAction({ actionTitle, actionDesc, requiredMaterials, baseCost = 0, onConfirm }) {
  const missingItems = [];
  let matsTotalCost = 0;
  let hasUnbuyable = false;
  const unbuyableNames = [];

  (requiredMaterials || []).forEach(req => {
    const currentQty = getMaterialQty(req.id);
    if (currentQty < req.qty) {
      const needed = req.qty - currentQty;
      const itemDef = ALL_ITEMS[req.id];
      const unitCost = itemDef ? (itemDef.cost || itemDef.price || 0) : 0;
      let name = itemDef ? itemDef.name : req.id;
      if (req.id === "mat_wood") name = "Wood";
      if (req.id === "mat_stone") name = "Stone";
      if (req.id === "mat_iron_ore") name = "Iron Ore";

      if (unitCost > 0) {
        const itemCost = unitCost * needed;
        matsTotalCost += itemCost;
        missingItems.push({
          id: req.id,
          name: name,
          icon: itemDef?.icon || "📦",
          needed: needed,
          unitCost: unitCost,
          itemCost: itemCost
        });
      } else {
        hasUnbuyable = true;
        unbuyableNames.push(`${name} (${currentQty}/${req.qty})`);
      }
    }
  });

  if (hasUnbuyable && missingItems.length === 0) {
    showToast(`Missing non-purchasable items: ${unbuyableNames.join(", ")}`, "error");
    return;
  }

  const grandTotal = matsTotalCost + baseCost;
  const currentGold = playerState.gold || 0;
  const remainingGold = currentGold - grandTotal;

  if (currentGold < grandTotal) {
    showToast(`Not enough gold! Total required: ${formatNumber(grandTotal)}g (You have ${formatNumber(currentGold)}g)`, "error");
    return;
  }

  const modal = document.getElementById("quick-buy-modal");
  if (!modal) return;

  const titleEl = document.getElementById("qb-modal-title");
  const descEl = document.getElementById("qb-action-desc");
  const itemsListEl = document.getElementById("qb-items-list");
  const matsCostEl = document.getElementById("qb-mats-cost");
  const feeRowEl = document.getElementById("qb-fee-row");
  const feeLabelEl = document.getElementById("qb-fee-label");
  const feeCostEl = document.getElementById("qb-fee-cost");
  const totalCostEl = document.getElementById("qb-total-cost");
  const currentGoldEl = document.getElementById("qb-current-gold");
  const remainingGoldEl = document.getElementById("qb-remaining-gold");
  const confirmBtn = document.getElementById("confirm-qb-btn");
  const cancelBtn = document.getElementById("cancel-qb-btn");
  const cancelXBtn = document.getElementById("cancel-qb-x-btn");

  if (titleEl) titleEl.textContent = `🛒 Quick Buy for ${actionTitle}`;
  if (descEl) descEl.textContent = actionDesc || "Review missing materials and total cost before proceeding.";

  if (itemsListEl) {
    itemsListEl.innerHTML = missingItems.map(item => `
      <div class="qb-item-card">
        <div class="qb-item-info">
          <span class="qb-item-icon">${item.icon}</span>
          <div>
            <div class="qb-item-name">${item.name}</div>
            <div class="qb-item-qty">Need ${item.needed} × ${formatNumber(item.unitCost)}g</div>
          </div>
        </div>
        <div class="qb-item-price">+${formatNumber(item.itemCost)}g</div>
      </div>
    `).join("");
    if (hasUnbuyable) {
      itemsListEl.innerHTML += `<div style="font-size:0.78rem; color:#ef4444; margin-top:4px;">⚠️ Non-purchasable required: ${unbuyableNames.join(", ")}</div>`;
    }
  }

  if (matsCostEl) matsCostEl.textContent = `${formatNumber(matsTotalCost)}g`;
  if (feeRowEl) {
    if (baseCost > 0) {
      feeRowEl.style.display = "flex";
      if (feeLabelEl) feeLabelEl.textContent = `${actionTitle} Base Fee:`;
      if (feeCostEl) feeCostEl.textContent = `${formatNumber(baseCost)}g`;
    } else {
      feeRowEl.style.display = "none";
    }
  }

  if (totalCostEl) totalCostEl.textContent = `${formatNumber(grandTotal)}g`;
  if (currentGoldEl) currentGoldEl.textContent = `${formatNumber(currentGold)}g`;
  if (remainingGoldEl) remainingGoldEl.textContent = `${formatNumber(remainingGold)}g`;

  const closeModal = () => {
    modal.style.display = "none";
    modal.classList.remove("active");
  };

  if (cancelBtn) cancelBtn.onclick = closeModal;
  if (cancelXBtn) cancelXBtn.onclick = closeModal;

  if (confirmBtn) {
    confirmBtn.onclick = () => {
      closeModal();
      if (playerState.gold < grandTotal) {
        showToast("Not enough gold!", "error");
        return;
      }
      missingItems.forEach(item => {
        addToInventory(item.id, item.needed);
      });
      if (typeof onConfirm === "function") {
        onConfirm();
      }
    };
  }

  modal.style.display = "flex";
  modal.classList.add("active");
}

function upgradeHouse() {
  const currentTier = playerState.house ? (playerState.house.tier || 0) : 0;
  const nextTier = currentTier + 1;
  if (nextTier > 5) { showToast("House is already at max level!", "error"); return; }
  
  const tierData = HOUSE_TIERS[nextTier];
  if (playerState.gold < tierData.cost) { showToast(`Not enough Gold! Costs ${tierData.cost}g to upgrade.`, "error"); return; }
  
  // Check missing materials
  const missingMats = [];
  if (tierData.materials && tierData.materials.length > 0) {
    for (const mat of tierData.materials) {
      const currentQty = getMaterialQty(mat.id);
      if (currentQty < mat.qty) {
        missingMats.push(mat);
      }
    }
  }

  if (missingMats.length > 0) {
    promptQuickBuyForAction({
      actionTitle: `House Tier ${nextTier}`,
      actionDesc: `Upgrade to ${tierData.name} (Tier ${nextTier}) requiring ${formatNumber(tierData.cost)}g upgrade fee plus missing materials.`,
      requiredMaterials: tierData.materials || [],
      baseCost: tierData.cost,
      onConfirm: () => upgradeHouse()
    });
    return;
  }

  if (playerState.gold < tierData.cost) { showToast(`Not enough Gold! Costs ${tierData.cost}g to upgrade.`, "error"); return; }

  // Deduct materials
    tierData.materials.forEach(mat => {
      let needed = mat.qty;
      while (needed > 0) {
        const inv = findInventoryMaterial(mat.id);
        if (!inv) break;
        const currentQty = Math.max(1, Number(inv.qty ?? inv.quantity ?? 1));
        const idx = playerState.inventory.indexOf(inv);
        if (idx === -1) break;

        if (currentQty > needed) {
          inv.qty = currentQty - needed;
          inv.quantity = inv.qty;
          needed = 0;
        } else {
          needed -= currentQty;
          playerState.inventory.splice(idx, 1);
        }
      }
    });
  }
  
  playerState.gold -= tierData.cost;
  if (!playerState.house) {
    playerState.house = { tier: 1, name: "Simple Tent", slots: [], decorations: [], unlockedDecorations: [] };
  }
  playerState.house.tier = nextTier;
  playerState.house.name = tierData.name;
  savePlayerState();
  if (typeof renderHouse === "function") renderHouse();
  if (typeof renderStats === "function") renderStats();
  showToast(`🏠 House upgraded to ${tierData.name}!`, "success");
}

function installStation(stationId) {
  const station = HOUSE_STATIONS[stationId];
  if (!station) return;
  
  const houseInfo = getHouseInfo();
  if (houseInfo.freeSlots <= 0) { showToast("Your house has no space left! Upgrade it.", "error"); return; }
  if (playerState.house.tier < station.minHouseTier) {
    showToast(`This station requires House level ${station.minHouseTier}!`, "error"); return;
  }
  
  if (playerState.gold < station.cost) { showToast("Not enough Gold!", "error"); return; }

  // Verify materials
  if (station.materials) {
    for (const mat of station.materials) {
      const inv = playerState.inventory.find(i => i.id === mat.id);
      if (!inv || (inv.qty || 1) < mat.qty) {
        showToast(`Not enough material: ${ALL_ITEMS[mat.id]?.name || mat.id}`, "error");
        return;
      }
    }
    // Deduct materials
    station.materials.forEach(mat => {
      const idx = playerState.inventory.findIndex(i => i.id === mat.id);
      if (idx !== -1) {
        playerState.inventory[idx].qty -= mat.qty;
        if (playerState.inventory[idx].qty <= 0) playerState.inventory.splice(idx, 1);
      }
    });
  }

  playerState.gold -= station.cost;
  playerState.house.slots.push({ id: stationId, stationTier: 1, instanceId: "inst_" + Date.now() });
  savePlayerState();
  if (typeof renderHouse === "function") renderHouse();
  if (typeof renderStats === "function") renderStats();
  showToast(`${station.icon} ${station.name} installed successfully!`, "success");
}

function upgradeStation(instanceId) {
  const slot = playerState.house.slots.find(s => s.instanceId === instanceId);
  if (!slot) return;
  
  const station = HOUSE_STATIONS[slot.id];
  const nextTier = slot.stationTier + 1;
  if (nextTier > 3) { showToast("Station is already at max level!", "error"); return; }

  const upgradeCost = station.cost * (nextTier === 2 ? 3 : 8);
  if (playerState.gold < upgradeCost) { showToast(`Costs ${upgradeCost}g to upgrade!`, "error"); return; }
  
  playerState.gold -= upgradeCost;
  slot.stationTier = nextTier;
  savePlayerState();
  if (typeof renderHouse === "function") renderHouse();
  showToast(`${station.icon} ${station.name} upgraded to Level ${nextTier}!`, "success");
}

function removeStation(instanceId) {
  const idx = playerState.house.slots.findIndex(s => s.instanceId === instanceId);
  if (idx !== -1) {
    const station = HOUSE_STATIONS[playerState.house.slots[idx].id];
    playerState.gold += Math.floor(station.cost * 0.5); // 50% refund
    playerState.house.slots.splice(idx, 1);
    savePlayerState();
    if (typeof renderHouse === "function") renderHouse();
    showToast(`Station removed. You recovered ${Math.floor(station.cost * 0.5)}g.`, "info");
  }
}

function openHouseModal() {
  renderHouse();
  document.getElementById("house-modal").classList.add("active");
}

function openVillageModal(regionId) {
  const region = REGIONS.find(r => r.id === regionId);
  if (!region) return;

  document.getElementById("village-modal-title").innerText = `🏰 Village of ${region.name}`;
  document.getElementById("village-desc").innerText = region.desc;

  // Fortress owner
  let ownerStr = "None";
  let ownerClan = null;
  const fortOwnerId = localStorage.getItem(`fortress_${regionId}`);
  if (fortOwnerId && typeof loadClan === "function") {
    ownerClan = loadClan(fortOwnerId);
    if (ownerClan) ownerStr = `[${ownerClan.tag}] ${ownerClan.name}`;
  }
  
  document.getElementById("village-control-info").innerHTML = `
    <p>👑 <strong>${ownerStr}</strong> controls this region.</p>
    <p style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">Trade taxes go to this clan's treasury.</p>
  `;

  document.getElementById("fortress-name-display").innerText = `${region.fortressIcon} ${region.fortressName}`;
  document.getElementById("fortress-owner-display").innerHTML = `
    <h3 style="color:var(--gold); margin-bottom:4px;">${ownerStr}</h3>
    <p style="font-size:0.85rem;">Members of this clan gain ${region.buff}.</p>
  `;

  // Siege Phase
  if (typeof getCurrentSiegePhase === "function") {
    const phase = getCurrentSiegePhase();
    document.getElementById("siege-phase-display").innerText = `Current phase: ${phase.label}`;
    document.getElementById("siege-time-display").innerText = `Time remaining: ${phase.daysLeft} days`;

    const siege = getSiegeData(regionId);
    let competitorsHtml = "";
    siege.attackers.forEach(cId => {
      const c = loadClan(cId);
      if (c) {
        const pts = siege.scores[cId]?.points || 0;
        competitorsHtml += `<li><span class="clan-icon">${c.icon}</span> <span>[${c.tag}] ${c.name}</span> <span style="margin-left:auto; color:var(--gold);">⚔️ ${pts} pts</span></li>`;
      }
    });
    document.getElementById("siege-competitors-list").innerHTML = competitorsHtml || `<li>No clan enrolled yet.</li>`;
  }

  // Bind Buttons
  const registerBtn = document.getElementById("register-village-btn");
  registerBtn.onclick = () => {
    playerState.registeredRegion = regionId;
    savePlayerState();
    showToast(`House moved to ${region.name}!`, "success");
    document.getElementById("village-modal").classList.remove("active");
  };

  const siegeBtn = document.getElementById("siege-register-btn");
  if (siegeBtn) {
    siegeBtn.onclick = () => {
      if (typeof registerForSiege === "function") {
        registerForSiege(regionId);
        openVillageModal(regionId); // reload
      }
    };
  }

  // Reset to first tab
  const modal = document.getElementById("village-modal");
  modal.querySelectorAll(".social-tab-btn").forEach(b => b.classList.remove("active"));
  modal.querySelectorAll(".social-sub-tab").forEach(c => { c.classList.remove("active"); c.style.display="none"; });
  
  modal.querySelector('[data-vtab="overview"]').classList.add("active");
  const overview = document.getElementById("vtab-overview");
  overview.classList.add("active"); overview.style.display = "";

  modal.classList.add("active");
}

function renderHouse() {
  const container = document.getElementById("house-view");
  if (!container) return;
  const houseInfo = getHouseInfo();
  
  let upgradeSectionHtml = "";
  if (houseInfo.tier < 5) {
    const nextTier = HOUSE_TIERS[houseInfo.tier + 1];
    
    let materialsHtml = "";
    if (nextTier.materials && nextTier.materials.length > 0) {
      const matItems = nextTier.materials.map(mat => {
        const currentQty = getMaterialQty(mat.id);
        const hasEnough = currentQty >= mat.qty;
        const matDef = ALL_ITEMS[mat.id];
        let displayName = matDef ? matDef.name : (mat.id.replace(/_/g, " ").replace("mat ", ""));
        if (mat.id === "mat_wood") displayName = "Wood";
        if (mat.id === "mat_iron_ore") displayName = "Iron Ore";
        if (mat.id === "mat_stone") displayName = "Stone";
        const icon = matDef ? matDef.icon : (mat.id.includes("wood") ? "🪵" : mat.id.includes("stone") ? "🪨" : mat.id.includes("iron") ? "⛏️" : "📦");

        const statusColor = hasEnough ? "#4ade80" : "#ef4444";
        const statusIcon = hasEnough ? "✓" : "✗";

        return `
          <span style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:4px; font-size:0.78rem;">
            <span>${icon}</span>
            <span>${displayName}:</span>
            <strong style="color:${statusColor};">${currentQty}/${mat.qty} ${statusIcon}</strong>
          </span>
        `;
      }).join("");

      materialsHtml = `
        <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px; align-items:center;">
          <span style="font-size:0.78rem; color:var(--text-muted); font-weight:bold;">Required Upfront:</span>
          ${matItems}
        </div>
      `;
    } else {
      materialsHtml = `<div style="font-size:0.78rem; color:var(--text-muted); margin-top:6px;">No materials required for this tier upgrade.</div>`;
    }

    const hasGold = playerState.gold >= nextTier.cost;
    const goldColor = hasGold ? "var(--gold)" : "#ef4444";

    const hasMissingMats = nextTier.materials && nextTier.materials.some(mat => getMaterialQty(mat.id) < mat.qty);
    const btnLabel = hasMissingMats ? "🛒 Quick Buy & Upgrade" : "⬆️ Upgrade";
    const btnStyle = hasMissingMats ? "background:linear-gradient(135deg, #2563eb, #4f46e5); border-color:#60a5fa;" : "";

    upgradeSectionHtml = `
      <div class="house-upgrade-banner" style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-card); border:1px solid var(--border); padding:12px 16px; border-radius:var(--r-md); margin-bottom:12px; flex-wrap:wrap; gap:10px;">
        <div style="flex:1; min-width:220px;">
          <div style="font-weight:bold; font-size:0.95rem; color:var(--text-primary);">⬆️ Upgrade to ${nextTier.name} (Tier ${nextTier.tier})</div>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">${nextTier.desc} (${nextTier.slots} slots, ${nextTier.maxDecorations} decos)</div>
          ${materialsHtml}
        </div>
        <button class="btn-action" onclick="upgradeHouse()" style="white-space:nowrap; padding:8px 16px; font-size:0.85rem; ${btnStyle}">
          ${btnLabel} <span class="cost" style="color:${goldColor}; font-weight:bold;">${nextTier.cost}g</span>
        </button>
      </div>
    `;
  }

  let html = `
    <div class="house-header">
      <div class="house-identity">
        <span class="house-icon">${houseInfo.icon}</span>
        <div>
          <h3 class="house-name">${houseInfo.name}</h3>
          <span class="house-tier-label">Tier ${houseInfo.tier}</span>
        </div>
      </div>
    </div>
    ${upgradeSectionHtml}
  `;

  // Bonuses
  if (houseInfo.hpRegenBonus > 1.0 || houseInfo.hasTrainingDummy || houseInfo.usedDecorations > 0) {
    html += `
    <div class="house-bonuses panel">
      <h4 class="panel-title">✨ Active Bonuses</h4>
      <div style="display:flex; gap:10px; font-size:0.85rem; color:var(--text-muted);">
        ${houseInfo.hpRegenBonus > 1.0 ? `<span>❤️ HP Regen: +${Math.round((houseInfo.hpRegenBonus - 1) * 100)}%</span>` : ""}
        ${houseInfo.hasTrainingDummy ? `<span>🎯 Passive XP Active</span>` : ""}
      </div>
    </div>`;
  }

  // Slots Grid
  html += `<div class="house-slots-grid">`;
  
  // Render Occupied Slots
  playerState.house.slots.forEach(slot => {
    const station = HOUSE_STATIONS[slot.id];
    html += `
      <div class="house-slot occupied" onclick="upgradeStation('${slot.instanceId}')">
        <button class="remove-station-btn" onclick="event.stopPropagation(); removeStation('${slot.instanceId}')">×</button>
        <div class="slot-icon">${station.icon}</div>
        <div class="slot-name">${station.name}</div>
        <div class="slot-tier">Level ${slot.stationTier}</div>
      </div>
    `;
  });

  // Render Free Slots
  for (let i = 0; i < houseInfo.freeSlots; i++) {
    html += `
      <div class="house-slot empty" onclick="openStationInstallModal()">
        <div class="slot-icon">➕</div>
        <div class="slot-name">Empty Slot</div>
      </div>
    `;
  }
  
  html += `</div>`; // end slots-grid

  // Decorations Grid
  html += `
    <div class="house-decorations panel" style="margin-top: 15px;">
      <h4 class="panel-title" style="display:flex; justify-content:space-between; align-items:center;">
        <span>🎨 Decorations <span style="font-size:0.8rem; color:var(--text-muted);">(${houseInfo.usedDecorations}/${houseInfo.maxDecorations})</span></span>
        <button class="btn-action" style="font-size:0.75rem; padding:4px 8px;" onclick="openDecorationShopModal()">Shop</button>
      </h4>
      <div class="decorations-grid">
  `;
  
  playerState.house.decorations.forEach(deco => {
    const dInfo = DECORATIONS[deco.id];
    html += `
      <div class="decoration-item" title="${dInfo.name}">
        <button class="remove-deco-btn" onclick="removeDecoration('${deco.instanceId}')">×</button>
        ${dInfo.icon}
      </div>
    `;
  });

  for (let i = 0; i < houseInfo.maxDecorations - houseInfo.usedDecorations; i++) {
    html += `<div class="decoration-item empty" title="Empty Space"></div>`;
  }

  html += `</div></div>`; // end decorations-grid

  container.innerHTML = html;
}

function openStationInstallModal() {
  const list = document.getElementById("station-options-list");
  if (!list) return;
  list.innerHTML = "";

  Object.values(HOUSE_STATIONS).forEach(station => {
    // Check if player has required tier
    const isLocked = playerState.house.tier < station.minHouseTier;
    // Check if already installed
    const isInstalled = playerState.house.slots.some(s => s.id === station.id);
    
    // We allow multiples, but let's just warn if they have it
    const reqsHtml = station.materials ? station.materials.map(m => {
      const invQty = playerState.inventory.find(i => i.id === m.id)?.qty || 0;
      return `<span style="color:${invQty >= m.qty ? 'var(--text-muted)' : 'var(--ember)'}">${ALL_ITEMS[m.id]?.name || m.id}: ${invQty}/${m.qty}</span>`;
    }).join(" | ") : "";

    const el = document.createElement("div");
    el.className = "recipe-card";
    if (isLocked) el.style.opacity = "0.5";
    el.innerHTML = `
      <div class="recipe-header">
        <div class="recipe-icon">${station.icon}</div>
        <div class="recipe-title">
          <h5>${station.name}</h5>
          <span style="color:var(--gold);">${station.cost}g</span>
        </div>
      </div>
      <div class="recipe-reqs" style="font-size:0.75rem; margin: 4px 0;">
        ${reqsHtml}
      </div>
      <button class="btn-craft-recipe" ${isLocked ? "disabled" : ""} onclick="installStation('${station.id}'); document.getElementById('station-install-modal').classList.remove('active');">
        ${isLocked ? `Requires House T${station.minHouseTier}` : "Install"}
      </button>
    `;
    list.appendChild(el);
  });

  document.getElementById("station-install-modal").classList.add("active");
}

function openDecorationShopModal() {
  document.getElementById("gems-count-display").textContent = playerState.gems || 0;
  renderDecorationShop("standard");
  document.getElementById("decoration-shop-modal").classList.add("active");
}

function renderDecorationShop(tab) {
  const list = document.getElementById("decoration-options-list");
  if (!list) return;
  list.innerHTML = "";

  document.getElementById("deco-tab-standard").classList.toggle("active", tab === "standard");
  document.getElementById("deco-tab-premium").classList.toggle("active", tab === "premium");

  Object.values(DECORATIONS).forEach(deco => {
    if (tab === "standard" && deco.premium) return;
    if (tab === "premium" && !deco.premium) return;
    if (deco.unlock && !playerState.house.unlockedDecorations.includes(deco.id)) return; // Unlocked by achievements only

    const hasBought = playerState.house.unlockedDecorations.includes(deco.id);
    const costHtml = deco.premium ? `💎 ${deco.premiumCost}` : `${deco.cost}g`;
    
    const el = document.createElement("div");
    el.className = "recipe-card";
    el.style.display = "flex";
    el.style.flexDirection = "column";
    el.style.alignItems = "center";
    el.style.padding = "10px";
    el.innerHTML = `
      <div style="font-size:2rem; margin-bottom:5px;">${deco.icon}</div>
      <h5 style="margin:0 0 5px 0; text-align:center;">${deco.name}</h5>
      <div style="font-size:0.7rem; color:var(--text-muted); text-align:center; margin-bottom:8px;">
        ${deco.bonus ? `Bonus: ${deco.bonus.type}` : "Cosmetic"}
      </div>
      ${hasBought ? 
        `<button class="btn-action" style="width:100%" onclick="placeDecoration('${deco.id}')">Colocar</button>` : 
        `<button class="btn-craft-recipe" style="width:100%" onclick="buyDecoration('${deco.id}')">Buy ()</button>`
      }
    `;
    list.appendChild(el);
  });
}

function buyDecoration(decoId) {
  const deco = DECORATIONS[decoId];
  if (!deco) return;

  if (deco.premium) {
    if (playerState.gems < deco.premiumCost) { showToast("Not enough Gems!", "error"); return; }
    playerState.gems -= deco.premiumCost;
  } else {
    if (playerState.gold < deco.cost) { showToast("Not enough Gold!", "error"); return; }
    playerState.gold -= deco.cost;
  }

  playerState.house.unlockedDecorations.push(decoId);
  savePlayerState();
  renderDecorationShop(deco.premium ? "premium" : "standard");
  document.getElementById("gems-count-display").textContent = playerState.gems || 0;
  if (typeof renderStats === "function") renderStats();
  showToast(`${deco.name} bought!`, "success");
}

function placeDecoration(decoId) {
  const houseInfo = getHouseInfo();
  if (houseInfo.usedDecorations >= houseInfo.maxDecorations) {
    showToast("Decoration limit reached! Upgrade your house.", "error"); return;
  }
  playerState.house.decorations.push({ id: decoId, instanceId: "deco_" + Date.now() });
  savePlayerState();
  renderHouse();
  showToast("Decoration placed!", "success");
}

function removeDecoration(instanceId) {
  const idx = playerState.house.decorations.findIndex(d => d.instanceId === instanceId);
  if (idx !== -1) {
    playerState.house.decorations.splice(idx, 1);
    savePlayerState();
    renderHouse();
  }
}

// Check achievements
function checkDecoUnlocks() {
  if (!playerState.house) return;
  let changed = false;
  
  // Ex: "defeat_level_10" -> check if player unlocked level 11
  if (playerState.unlockedLevel > 10 && !playerState.house.unlockedDecorations.includes("deco_dragon_head")) {
    playerState.house.unlockedDecorations.push("deco_dragon_head");
    changed = true;
    showToast("🏆 Achievement: Dragon Head unlocked!", "success");
  }

  if (changed) savePlayerState();
}
function _setDisabled(id, val) { const el = document.getElementById(id); if (el) el.disabled = val; }
function _show(id, displayType = "inline-block") { const el = document.getElementById(id); if (el) el.style.display = displayType; }
function _hide(id) { const el = document.getElementById(id); if (el) el.style.display = "none"; }

// Reset
window.resetGame = () => {
  localStorage.removeItem("rpg_player_state");
  localStorage.removeItem("rpg_social_friends");
  window.location.href = window.location.href.split('?')[0].split('#')[0] + window.location.search;
};

// New character -- resets character state only, keeps settings & social
window.newCharacter = () => {
  localStorage.removeItem("rpg_player_state");
  window.location.href = window.location.href.split('?')[0].split('#')[0] + window.location.search;
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

// ================================================================
// EXPANSION PHASE 1 & 2: NARRATOR, REBIRTH, LOOT FILTERS & THE FORGE
// ================================================================

const NARRATOR_LINES = {
  afk_short: [
    "Your hero sharpened their blade while keeping watch over the keep.",
    "A quiet breeze passed through the valley as your hero stood guard.",
    "Your hero practiced form, waiting patiently for your command."
  ],
  afk_long: [
    "While you were away, your hero fought relentlessly through dawn and dusk.",
    "Legends whisper of the endless battles fought in your absence.",
    "Your hero gathered spoils and stood firm against the darkness."
  ],
  level_up: [
    "The ember within burns brighter. You feel... changed.",
    "New strength surges through your veins as your ember awakens!",
    "Boundless potential unlocks as you conquer another threshold."
  ],
  rebirth: [
    "From the ashes of your past self, a celestial fire is ignited!",
    "The Ember King's defeat marks not an end, but a glorious rebirth!",
    "Your mortality burns away, leaving only pure, primordial ember."
  ]
};

function getRandomNarratorLine(category = "afk_long") {
  const lines = NARRATOR_LINES[category] || NARRATOR_LINES.afk_long;
  return lines[Math.floor(Math.random() * lines.length)];
}

// ── REBIRTH SYSTEM UI ──
async function handlePerformRebirth() {
  const activeChar = AccountStore.getActiveCharacter();
  if (!activeChar) return;

  if ((activeChar.unlockedLevel || 1) < 30) {
    if (typeof showToast === "function") showToast("Must defeat Level 30 (The Ember King) before Rebirth!", "error");
    return;
  }

  if (!confirm("🔥 Are you sure you want to REBIRTH? Your level, gold, and equipment will reset, but you will gain Ember Shards and permanent account bonuses!")) {
    return;
  }

  try {
    let result = null;
    if (typeof performRebirthRPC === "function" && activeChar.id && activeChar.id.includes("-")) {
      result = await performRebirthRPC(activeChar.id);
    } else {
      // Local fallback for offline mode
      const account = AccountStore.getAccount();
      account.rebirthCount = (account.rebirthCount || 0) + 1;
      account.emberShards = (account.emberShards || 0) + 1;
      activeChar.level = 1;
      activeChar.xp = 0;
      activeChar.gold = 50;
      activeChar.equipped = { head: null, chest: null, legs: null, main_hand: null, off_hand: null, accessory: null };
      activeChar.unlockedLevel = 1;
      result = { success: true, rebirth_number: account.rebirthCount, shards_earned: 1 };
    }

    if (result && result.success) {
      if (typeof showToast === "function") showToast(`🔥 REBIRTH SUCCESSFUL! Rebirth #${result.rebirth_number} complete! Gained ${result.shards_earned} Ember Shard(s)!`, "success");
      await AccountStore.loadFromSupabase().catch(() => {});
      if (typeof renderActiveCharacterUI === "function") renderActiveCharacterUI();
      const modal = document.getElementById("rebirth-modal");
      if (modal) modal.classList.remove("active");
    }
  } catch (err) {
    if (typeof showToast === "function") showToast("Rebirth failed: " + (err.message || err), "error");
  }
}

function renderRebirthModal() {
  let modal = document.getElementById("rebirth-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "rebirth-modal";
    modal.className = "modal";
    document.body.appendChild(modal);
  }

  const account = AccountStore.getAccount() || {};
  const activeChar = AccountStore.getActiveCharacter() || {};
  const rebirthCount = account.rebirthCount || 0;
  const emberShards = account.emberShards || 0;
  const isEligible = (activeChar.unlockedLevel || 1) >= 30;

  modal.innerHTML = `
    <div class="modal-content panel" style="max-width:520px; border:2px solid var(--gold,#f59e0b);">
      <div class="modal-header">
        <h3 style="color:var(--gold,#f59e0b);">🔥 Ember Rebirth (Prestige)</h3>
        <button class="modal-close-btn" onclick="document.getElementById('rebirth-modal').classList.remove('active')">✕</button>
      </div>
      <div class="modal-body" style="text-align:center; padding:15px;">
        <p class="narrator-quote" style="font-style:italic; color:#fbbf24; margin-bottom:12px;">
          "${getRandomNarratorLine('rebirth')}"
        </p>
        <div style="display:flex; justify-content:space-around; margin:15px 0; background:rgba(0,0,0,0.3); padding:12px; border-radius:8px;">
          <div><div style="font-size:1.4rem; font-weight:bold; color:#f59e0b;">${rebirthCount}</div><div style="font-size:0.8rem; color:#aaa;">Rebirths</div></div>
          <div><div style="font-size:1.4rem; font-weight:bold; color:#ef4444;">💎 ${emberShards}</div><div style="font-size:0.8rem; color:#aaa;">Ember Shards</div></div>
          <div><div style="font-size:1.4rem; font-weight:bold; color:#10b981;">+${emberShards * 2}%</div><div style="font-size:0.8rem; color:#aaa;">Global XP Bonus</div></div>
        </div>
        <div style="text-align:left; background:rgba(255,255,255,0.05); padding:12px; border-radius:8px; margin-bottom:15px;">
          <h4 style="margin-top:0;">⚠️ What happens on Rebirth?</h4>
          <ul style="margin:5px 0; padding-left:20px; font-size:0.85rem; color:#ddd;">
            <li><span style="color:#ef4444;">Resets:</span> Character Level → 1, Gold → 50g, Equipment cleared, Stage progress reset</li>
            <li><span style="color:#10b981;">Keeps:</span> Production Skills, Pet collection, Housing tier, Clan membership</li>
            <li><span style="color:#f59e0b;">Gains:</span> +1 Ember Shard (+2% XP, +1% Gold per shard), unlocks higher Difficulty Tiers!</li>
          </ul>
        </div>
        ${isEligible 
          ? `<button id="btn-confirm-rebirth" class="btn-action" style="background:linear-gradient(135deg, #ef4444, #f59e0b); font-size:1.1rem; padding:10px 24px; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">🔥 Ignite Rebirth</button>`
          : `<p style="color:#ef4444; font-weight:bold;">🔒 Must reach Level 30 (Clear Act III) to unlock Rebirth.</p>`}
      </div>
    </div>
  `;

  modal.classList.add("active");

  const confirmBtn = document.getElementById("btn-confirm-rebirth");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", handlePerformRebirth);
  }
}

// ── LOOT FILTER SETTINGS UI ──
function renderLootFilterSettings() {
  const container = document.getElementById("loot-filter-panel");
  if (!container) return;

  const activeChar = AccountStore.getActiveCharacter() || {};
  const filter = activeChar.lootFilter || { auto_salvage_below: null, keep_materials: true };

  container.innerHTML = `
    <div class="panel" style="padding:12px; margin-top:10px; border:1px solid rgba(255,255,255,0.1);">
      <h4 style="margin-top:0;">🧹 Auto-Salvage Loot Filter</h4>
      <p style="font-size:0.8rem; color:#aaa;">Automatically converts drops below threshold to gold during AFK tasks.</p>
      <div style="display:flex; gap:15px; align-items:center; flex-wrap:wrap;">
        <label style="font-size:0.85rem;">Auto-salvage below:
          <select id="select-salvage-threshold" class="btn-action" style="padding:4px 8px; margin-left:6px;">
            <option value="" ${!filter.auto_salvage_below ? 'selected' : ''}>Disabled (Keep All Loot)</option>
            <option value="uncommon" ${filter.auto_salvage_below === 'uncommon' ? 'selected' : ''}>Common</option>
            <option value="rare" ${filter.auto_salvage_below === 'rare' ? 'selected' : ''}>Uncommon & Below</option>
            <option value="epic" ${filter.auto_salvage_below === 'epic' ? 'selected' : ''}>Rare & Below</option>
          </select>
        </label>
        <label style="font-size:0.85rem; display:flex; align-items:center; gap:5px;">
          <input type="checkbox" id="chk-keep-materials" ${filter.keep_materials !== false ? 'checked' : ''} />
          Always keep Crafting Materials
        </label>
        <button id="btn-save-loot-filter" class="btn-action" style="padding:4px 12px; font-size:0.85rem;">Save Filter</button>
      </div>
    </div>
  `;

  const btnSave = document.getElementById("btn-save-loot-filter");
  if (btnSave) {
    btnSave.addEventListener("click", async () => {
      const sel = document.getElementById("select-salvage-threshold").value || null;
      const chk = document.getElementById("chk-keep-materials").checked;
      const newFilter = { auto_salvage_below: sel, keep_materials: chk };

      activeChar.lootFilter = newFilter;
      if (typeof updateLootFilterRPC === "function" && activeChar.id && activeChar.id.includes("-")) {
        await updateLootFilterRPC(activeChar.id, newFilter).catch(() => {});
      }
      AccountStore.save();
      if (typeof showToast === "function") showToast("Loot filter settings saved!", "success");
    });
  }
}

// ── DIFFICULTY TIER SELECTOR UI ──
function renderDifficultySelector() {
  const container = document.getElementById("difficulty-selector-container");
  if (!container) return;

  const account = AccountStore.getAccount() || {};
  const currentDiff = account.activeDifficulty || "normal";
  const rebirths = account.rebirthCount || 0;

  const tiers = [
    { id: "normal", label: "⚔️ Normal", req: 0 },
    { id: "hardened", label: "🔥 Hardened (+20% Drop Rate)", req: 1 },
    { id: "infernal", label: "💀 Infernal (+50% Drop Rate)", req: 3 },
    { id: "mythic", label: "🌌 Mythic (+100% Drop Rate)", req: 6 }
  ];

  container.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px;">
      <span style="font-size:0.85rem; color:#aaa;">Difficulty:</span>
      <select id="select-active-difficulty" class="btn-action" style="padding:4px 8px; font-size:0.85rem;">
        ${tiers.map(t => `
          <option value="${t.id}" ${currentDiff === t.id ? 'selected' : ''} ${rebirths < t.req ? 'disabled' : ''}>
            ${t.label} ${rebirths < t.req ? `(Requires ${t.req} Rebirths)` : ''}
          </option>
        `).join('')}
      </select>
    </div>
  `;

  const sel = document.getElementById("select-active-difficulty");
  if (sel) {
    sel.addEventListener("change", async (e) => {
      const val = e.target.value;
      account.activeDifficulty = val;
      if (typeof updateActiveDifficultyRPC === "function") {
        await updateActiveDifficultyRPC(val).catch(() => {});
      }
      AccountStore.save();
      if (typeof showToast === "function") showToast(`Difficulty changed to ${val.toUpperCase()}!`, "info");
    });
  }
}

// Global window assignments
window.renderRebirthModal = renderRebirthModal;
window.renderLootFilterSettings = renderLootFilterSettings;
window.renderDifficultySelector = renderDifficultySelector;
window.getRandomNarratorLine = getRandomNarratorLine;

// ── GARRISON NETWORK PANEL UI ──
async function renderGarrisonPanel() {
  const container = document.getElementById("garrison-tab-container");
  if (!container) return;

  const account = AccountStore.getAccount() || {};
  const activeChar = AccountStore.getActiveCharacter() || {};
  const assignments = await GarrisonEngine.getAssignments().catch(() => []);
  const buffs = GarrisonEngine.computeAccountBuffs(assignments);

  const altChars = Object.values(account.characterSlots || {}).filter(c => c && c.id !== activeChar.id);

  let stationsHTML = "";
  Object.values(GARRISON_STATIONS).forEach(st => {
    const assigned = assignments.find(a => a.station_id === st.id);
    const assignedChar = assigned ? Object.values(account.characterSlots || {}).find(c => c && c.id === assigned.character_id) : null;

    stationsHTML += `
      <div class="garrison-card panel" style="padding:14px; border:1px solid var(--border); display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0; color:var(--gold,#f59e0b);">${st.icon} ${st.name}</h4>
            <span style="font-size:0.75rem; background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:4px;">${st.statBuffDesc}</span>
          </div>
          <p style="font-size:0.8rem; color:#aaa; margin:8px 0;">${st.desc}</p>
        </div>
        <div style="margin-top:12px; background:rgba(0,0,0,0.3); padding:8px; border-radius:6px;">
          ${assignedChar ? `
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:bold; font-size:0.85rem; color:#10b981;">🛡️ ${assignedChar.name} (Lv. ${assignedChar.level})</span>
              <button class="btn-action btn-unassign-garrison" data-char="${assignedChar.id}" style="padding:2px 8px; font-size:0.75rem; background:#ef4444; border:none; cursor:pointer;">Unassign</button>
            </div>
          ` : `
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.8rem; color:#888;">Empty Station</span>
              <select class="select-assign-garrison btn-action" data-station="${st.id}" style="padding:2px 6px; font-size:0.75rem;">
                <option value="">+ Assign Alt Hero</option>
                ${altChars.map(alt => `<option value="${alt.id}">${alt.name} (Lv. ${alt.level})</option>`).join('')}
              </select>
            </div>
          `}
        </div>
      </div>
    `;
  });

  container.innerHTML = `
    <div style="padding:15px;">
      <div class="panel" style="margin-bottom:15px; background:linear-gradient(135deg, rgba(245,158,11,0.1), rgba(0,0,0,0.4));">
        <h3 style="margin-top:0; color:var(--gold);">🏰 Account Garrison Network</h3>
        <p style="font-size:0.85rem; color:#ccc;">Station your inactive alt heroes in garrison network posts to passively empower your active main character!</p>
        <div style="display:flex; gap:20px; flex-wrap:wrap; font-size:0.85rem; margin-top:10px;">
          <span>⚡ Global Task Speed: <strong style="color:#10b981;">x${buffs.taskSpeedMultiplier.toFixed(2)}</strong></span>
          <span>🛡️ Gear Stat Bonus: <strong style="color:#60a5fa;">+${Math.round((buffs.gearStatMultiplier - 1) * 100)}%</strong></span>
          <span>🧪 Alchemy Brew: <strong style="color:${buffs.hasAlchemyLab ? '#10b981' : '#666'};">${buffs.hasAlchemyLab ? 'Active' : 'Inactive'}</strong></span>
          <span>🎯 Alt Training: <strong style="color:${buffs.hasTrainingGrounds ? '#10b981' : '#666'};">${buffs.hasTrainingGrounds ? 'Active' : 'Inactive'}</strong></span>
        </div>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:15px;">
        ${stationsHTML}
      </div>
    </div>
  `;

  // Event Listeners
  container.querySelectorAll(".btn-unassign-garrison").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const charId = e.currentTarget.dataset.char;
      await GarrisonEngine.removeFromStation(charId);
      if (typeof showToast === "function") showToast("Alt unassigned from Garrison", "info");
      renderGarrisonPanel();
    });
  });

  container.querySelectorAll(".select-assign-garrison").forEach(sel => {
    sel.addEventListener("change", async (e) => {
      const charId = e.target.value;
      const stationId = e.target.dataset.station;
      if (!charId || !stationId) return;

      try {
        await GarrisonEngine.assignToStation(charId, stationId);
        if (typeof showToast === "function") showToast("Alt hero assigned to Garrison station!", "success");
        renderGarrisonPanel();
      } catch (err) {
        if (typeof showToast === "function") showToast(err.message || "Failed to assign alt", "error");
      }
    });
  });
}

// ── WORLD RIFT & COMMUNITY BOUNTY PANEL UI ──
async function renderWorldRiftPanel() {
  const container = document.getElementById("world-rift-container");
  if (!container) return;

  const activeChar = AccountStore.getActiveCharacter() || {};
  const rift = await WorldEngine.getActiveRift();
  const bounty = await WorldEngine.getActiveBounty();
  const leaderboard = await WorldEngine.getRiftLeaderboard(rift ? rift.id : null);

  const riftPct = rift ? Math.max(0, Math.min(100, (rift.current_hp / rift.total_hp) * 100)) : 0;
  const bountyPct = bounty ? Math.max(0, Math.min(100, (bounty.current_quantity / bounty.target_quantity) * 100)) : 0;

  container.innerHTML = `
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:15px; padding:15px;">
      <!-- World Rift Card -->
      <div class="panel" style="border:2px solid #ef4444;">
        <h3 style="margin-top:0; color:#ef4444; display:flex; align-items:center; gap:8px;">
          ${rift.boss_icon || '🐲'} ${rift.name}
        </h3>
        <p style="font-size:0.8rem; color:#aaa;">${rift.description || ''}</p>
        
        <!-- HP Bar -->
        <div style="background:rgba(0,0,0,0.5); padding:8px; border-radius:6px; margin:12px 0;">
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
            <span>World Boss HP</span>
            <strong>${(rift.current_hp || 0).toLocaleString()} / ${(rift.total_hp || 0).toLocaleString()}</strong>
          </div>
          <div style="background:#333; height:14px; border-radius:7px; overflow:hidden;">
            <div style="background:linear-gradient(90deg, #ef4444, #f59e0b); width:${riftPct}%; height:100%; transition:width 0.5s;"></div>
          </div>
        </div>

        <button id="btn-attack-world-rift" class="btn-action" style="width:100%; padding:10px; background:linear-gradient(135deg, #ef4444, #991b1b); font-weight:bold; font-size:1rem; cursor:pointer;">
          ⚔️ Strike World Boss (Submit DPS Benchmark)
        </button>

        <hr class="panel-divider" style="margin:15px 0;">
        <h4 style="margin:0 0 8px 0;">🏆 Top Contributors</h4>
        <div style="max-height:160px; overflow-y:auto; font-size:0.8rem;">
          ${leaderboard.map((lb, idx) => `
            <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
              <span>#${idx + 1} 🛡️ ${lb.character_name}</span>
              <strong style="color:#f59e0b;">${(lb.damage_dealt || 0).toLocaleString()} dmg</strong>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Community Bounty Card -->
      <div class="panel" style="border:2px solid #38bdf8;">
        <h3 style="margin-top:0; color:#38bdf8; display:flex; align-items:center; gap:8px;">
          ${bounty.resource_icon || '📦'} ${bounty.title}
        </h3>
        <p style="font-size:0.8rem; color:#aaa;">Server-wide commodity sink to unlock global account buffs!</p>
        <p style="font-size:0.85rem; color:#fbbf24;">🎁 Reward: <strong>${bounty.reward_description}</strong></p>

        <!-- Progress Bar -->
        <div style="background:rgba(0,0,0,0.5); padding:8px; border-radius:6px; margin:12px 0;">
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
            <span>Goal: ${bounty.resource_name}</span>
            <strong>${(bounty.current_quantity || 0).toLocaleString()} / ${(bounty.target_quantity || 0).toLocaleString()}</strong>
          </div>
          <div style="background:#333; height:14px; border-radius:7px; overflow:hidden;">
            <div style="background:linear-gradient(90deg, #38bdf8, #10b981); width:${bountyPct}%; height:100%; transition:width 0.5s;"></div>
          </div>
        </div>

        <div style="display:flex; gap:8px; align-items:center; margin-top:12px;">
          <input type="number" id="input-bounty-qty" value="50" min="1" class="btn-action" style="width:90px; padding:6px;" />
          <button id="btn-donate-bounty" class="btn-action" style="flex:1; padding:8px; background:#10b981; font-weight:bold; cursor:pointer;">
            📦 Donate ${bounty.resource_name}
          </button>
        </div>
      </div>
    </div>
  `;

  // Strike Rift Boss Event
  const btnAttack = document.getElementById("btn-attack-world-rift");
  if (btnAttack) {
    btnAttack.addEventListener("click", async () => {
      const pwr = activeChar.power || 100;
      const dmg = pwr * 120 + Math.floor(Math.random() * 500);

      try {
        const res = await WorldEngine.submitDamage(activeChar.id, rift.id, dmg);
        if (res && res.success) {
          if (typeof showToast === "function") showToast(`⚔️ Struck World Boss for ${(res.damage_dealt || dmg).toLocaleString()} damage!`, "success");
          renderWorldRiftPanel();
        }
      } catch (err) {
        if (typeof showToast === "function") showToast("Rift attack failed: " + (err.message || err), "error");
      }
    });
  }

  // Donate Bounty Event
  const btnDonate = document.getElementById("btn-donate-bounty");
  if (btnDonate) {
    btnDonate.addEventListener("click", async () => {
      const qtyInput = document.getElementById("input-bounty-qty");
      const qty = parseInt(qtyInput ? qtyInput.value : "50") || 50;

      try {
        const res = await WorldEngine.donateToBounty(activeChar.id, bounty.id, bounty.resource_target, qty);
        if (res && res.success) {
          if (typeof showToast === "function") showToast(`📦 Donated ${qty}x ${bounty.resource_name} to the King's Bounty!`, "success");
          renderWorldRiftPanel();
        }
      } catch (err) {
        if (typeof showToast === "function") showToast("Donation failed: " + (err.message || err), "error");
      }
    });
  }
}

// Global window assignments
window.renderGarrisonPanel = renderGarrisonPanel;
window.renderWorldRiftPanel = renderWorldRiftPanel;

// ── TASK QUEUE PANEL UI ──
function renderTaskQueuePanel() {
  const container = document.getElementById("task-queue-panel");
  if (!container) return;

  const activeChar = AccountStore.getActiveCharacter() || {};
  const house = activeChar.house || { tier: 0 };
  const queueCap = GameAPI.getQueueCapacity ? GameAPI.getQueueCapacity(house.tier) : 1;

  container.innerHTML = `
    <div class="panel" style="padding:12px; margin-top:10px; border:1px solid rgba(255,255,255,0.1);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h4 style="margin:0;">📋 Action Sequence Queue (${queueCap} Max Slot${queueCap > 1 ? 's' : ''})</h4>
        <span style="font-size:0.75rem; color:#aaa;">Housing Tier ${house.tier || 0}</span>
      </div>
      <p style="font-size:0.8rem; color:#aaa; margin:4px 0 10px 0;">Sequence sequential tasks before going offline. Upgrade Housing to unlock up to 5 queue slots!</p>

      <div id="queue-slots-grid" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
        ${Array.from({ length: queueCap }, (_, idx) => `
          <div style="background:rgba(0,0,0,0.3); border:1px dashed var(--border); padding:8px 12px; border-radius:6px; flex:1; min-width:110px;">
            <div style="font-size:0.75rem; color:#888;">Step ${idx + 1}</div>
            <strong style="font-size:0.85rem; color:var(--gold);">Slot ${idx + 1} Task</strong>
          </div>
        `).join('')}
      </div>
      
      <div style="display:flex; gap:8px;">
        <button id="btn-clear-queue" class="btn-action" style="padding:4px 10px; font-size:0.8rem; background:#ef4444; border:none; cursor:pointer;">Clear Queue</button>
      </div>
    </div>
  `;

  const btnClear = document.getElementById("btn-clear-queue");
  if (btnClear) {
    btnClear.addEventListener("click", async () => {
      if (typeof clearTaskQueueRPC === "function" && activeChar.id && activeChar.id.includes("-")) {
        await clearTaskQueueRPC(activeChar.id).catch(() => {});
      }
      if (typeof showToast === "function") showToast("Action sequence queue cleared", "info");
    });
  }
}

// ── SEASONAL ECHO LEAGUES UI ──
async function renderSeasonalPortal() {
  const container = document.getElementById("seasonal-portal-container");
  if (!container) return;

  const realm = await SeasonsEngine.getActiveRealm();
  const leaderboard = await SeasonsEngine.getSeasonalLeaderboard(realm ? realm.id : null);
  const account = AccountStore.getAccount() || {};
  const echoChar = account.characterSlots ? account.characterSlots[5] : null;

  container.innerHTML = `
    <div class="panel" style="border:2px solid #8b5cf6; padding:15px; margin-top:15px;">
      <h3 style="margin-top:0; color:#a78bfa; display:flex; align-items:center; gap:8px;">
        🏆 ${realm.name} (Seasonal Echo League)
      </h3>
      <p style="font-size:0.85rem; color:#ccc;">${realm.description}</p>

      <div style="display:flex; gap:20px; flex-wrap:wrap; background:rgba(139,92,246,0.1); padding:10px; border-radius:8px; margin:12px 0;">
        <span>⚡ Execution Speed: <strong style="color:#a78bfa;">${realm.mutator_config?.speed_multiplier || 3}x</strong></span>
        <span>⚔️ Mob Damage: <strong style="color:#ef4444;">+${(realm.mutator_config?.mob_damage_bonus || 0.5) * 100}%</strong></span>
        <span>📍 Dedicated Slot: <strong style="color:#10b981;">Slot 5</strong></span>
      </div>

      ${echoChar ? `
        <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div>
            <strong style="color:#a78bfa; font-size:1rem;">🛡️ ${echoChar.name} (Level ${echoChar.level} ${echoChar.class})</strong>
            <div style="font-size:0.8rem; color:#aaa;">Active Seasonal Hero (Slot 5)</div>
          </div>
          <button id="btn-select-echo-hero" class="btn-action" style="padding:6px 14px; background:#8b5cf6; font-weight:bold; cursor:pointer;">Play Echo Hero</button>
        </div>
      ` : `
        <div style="background:rgba(0,0,0,0.3); padding:12px; border-radius:8px; margin-bottom:12px;">
          <h4 style="margin-top:0;">🌟 Enter the Seasonal Realm (Create Slot 5 Hero)</h4>
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <input type="text" id="input-echo-name" placeholder="Echo Hero Name" class="btn-action" style="padding:6px 10px; flex:1; min-width:140px;" />
            <select id="select-echo-class" class="btn-action" style="padding:6px 10px;">
              <option value="Warrior">Warrior</option>
              <option value="Ranger">Ranger</option>
              <option value="Mage">Mage</option>
              <option value="Paladin">Paladin</option>
            </select>
            <button id="btn-create-echo-char" class="btn-action" style="padding:6px 16px; background:linear-gradient(135deg, #8b5cf6, #38bdf8); font-weight:bold; cursor:pointer;">
              🚀 Launch Echo Hero
            </button>
          </div>
        </div>
      `}

      <hr class="panel-divider" style="margin:12px 0;">
      <h4 style="margin:0 0 8px 0;">🏆 Seasonal Leaderboard</h4>
      <div style="max-height:140px; overflow-y:auto; font-size:0.8rem;">
        ${leaderboard.map((lb, idx) => `
          <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
            <span>#${idx + 1} 🛡️ ${lb.name} (${lb.class_id || 'Hero'})</span>
            <strong style="color:#a78bfa;">Lv. ${lb.level} (${(lb.power || 0).toLocaleString()} pwr)</strong>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Create Echo Hero Event
  const btnCreate = document.getElementById("btn-create-echo-char");
  if (btnCreate) {
    btnCreate.addEventListener("click", async () => {
      const nameInput = document.getElementById("input-echo-name");
      const classSelect = document.getElementById("select-echo-class");
      const name = nameInput ? nameInput.value.trim() : "Echo Hero";
      const classId = classSelect ? classSelect.value : "Warrior";

      try {
        await SeasonsEngine.createEchoCharacter(name, classId);
        if (typeof showToast === "function") showToast(`🚀 Seasonal Echo Hero "${name}" created in Slot 5!`, "success");
        renderSeasonalPortal();
        if (typeof renderActiveCharacterUI === "function") renderActiveCharacterUI();
      } catch (err) {
        if (typeof showToast === "function") showToast("Failed to create Echo hero: " + (err.message || err), "error");
      }
    });
  }

  // Play Echo Hero Event
  const btnPlay = document.getElementById("btn-select-echo-hero");
  if (btnPlay) {
    btnPlay.addEventListener("click", () => {
      account.activeSlotId = 5;
      AccountStore.save();
      if (typeof renderActiveCharacterUI === "function") renderActiveCharacterUI();
      if (typeof showToast === "function") showToast("Switched to Seasonal Echo Hero (Slot 5)", "info");
    });
  }
}

// Global window assignments
window.renderTaskQueuePanel = renderTaskQueuePanel;
window.renderSeasonalPortal = renderSeasonalPortal;

// ── DISCORD WEBHOOK SETTINGS UI ──
function renderWebhookSettingsModal() {
  let modal = document.getElementById("webhook-settings-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "webhook-settings-modal";
    modal.className = "modal";
    document.body.appendChild(modal);
  }

  const account = AccountStore.getAccount() || {};
  const currentUrl = account.discordWebhookUrl || "";
  const events = account.webhookEvents || ["rebirth", "rift_kill", "dungeon_mastered", "bounty_completed", "hearth_visit"];

  modal.innerHTML = `
    <div class="modal-content panel" style="max-width:480px; border:2px solid #5865f2;">
      <div class="modal-header">
        <h3 style="color:#5865f2;">🔔 Discord Webhook Integration</h3>
        <button class="modal-close-btn" onclick="document.getElementById('webhook-settings-modal').classList.remove('active')">✕</button>
      </div>
      <div class="modal-body" style="padding:15px;">
        <p style="font-size:0.85rem; color:#ccc;">Connect a Discord Channel Webhook URL to receive live notifications for major in-game accomplishments!</p>
        
        <label style="display:block; font-size:0.85rem; margin-bottom:8px;">Discord Webhook URL:
          <input type="text" id="input-webhook-url" value="${currentUrl}" placeholder="https://discord.com/api/webhooks/..." class="btn-action" style="width:100%; margin-top:4px; padding:8px;" />
        </label>

        <h4 style="margin:12px 0 6px 0;">Select Notification Events:</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:0.85rem;">
          <label><input type="checkbox" class="chk-wh-event" value="dungeon_mastered" ${events.includes("dungeon_mastered") ? 'checked' : ''}> 👑 Dungeon Mastery</label>
          <label><input type="checkbox" class="chk-wh-event" value="rebirth" ${events.includes("rebirth") ? 'checked' : ''}> 🔥 Rebirth Milestones</label>
          <label><input type="checkbox" class="chk-wh-event" value="rift_kill" ${events.includes("rift_kill") ? 'checked' : ''}> 🐲 World Rift Kills</label>
          <label><input type="checkbox" class="chk-wh-event" value="bounty_completed" ${events.includes("bounty_completed") ? 'checked' : ''}> 📦 Bounty Completion</label>
          <label><input type="checkbox" class="chk-wh-event" value="hearth_visit" ${events.includes("hearth_visit") ? 'checked' : ''}> 🏡 Hearth Visits</label>
        </div>

        <div style="display:flex; gap:10px; margin-top:15px;">
          <button id="btn-save-webhook-settings" class="btn-action" style="flex:1; padding:10px; background:#5865f2; font-weight:bold; cursor:pointer;">
            💾 Save Settings
          </button>
          <button id="btn-test-webhook" class="btn-secondary" style="padding:10px; font-weight:bold; cursor:pointer;">
            🧪 Test Webhook
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add("active");

  const btnSave = document.getElementById("btn-save-webhook-settings");
  if (btnSave) {
    btnSave.addEventListener("click", async () => {
      const urlInput = document.getElementById("input-webhook-url");
      const url = urlInput ? urlInput.value.trim() : "";
      const selectedEvents = Array.from(modal.querySelectorAll(".chk-wh-event:checked")).map(cb => cb.value);

      account.discordWebhookUrl = url;
      account.webhookEvents = selectedEvents;
      if (typeof updateWebhookSettingsRPC === "function") {
        await updateWebhookSettingsRPC(url, selectedEvents).catch(() => {});
      }
      AccountStore.save();
      if (typeof showToast === "function") showToast("Discord Webhook settings saved!", "success");
      modal.classList.remove("active");
    });
  }

  const btnTest = document.getElementById("btn-test-webhook");
  if (btnTest) {
    btnTest.addEventListener("click", async () => {
      const urlInput = document.getElementById("input-webhook-url");
      const url = urlInput ? urlInput.value.trim() : "";
      if (!url) {
        showToast("Please enter a Discord Webhook URL first!", "error");
        return;
      }
      showToast("Sending test notification to Discord...", "info");
      const ok = await sendDiscordWebhook("test", { testUrl: url });
      if (ok) {
        showToast("🎉 Test notification delivered to Discord!", "success");
      } else {
        showToast("❌ Webhook failed. Verify your Discord URL.", "error");
      }
    });
  }
}

async function sendDiscordWebhook(event, details = {}) {
  const account = typeof AccountStore !== "undefined" ? AccountStore.getAccount() : null;
  const targetUrl = details.testUrl || account?.discordWebhookUrl;
  if (!targetUrl) return false;

  const events = (account && account.webhookEvents) || ["rebirth", "rift_kill", "dungeon_mastered", "bounty_completed", "hearth_visit"];
  if (event !== "test" && !events.includes(event)) return false;

  const charName = (playerState && playerState.name) || "Hero";

  let title = "🔥 Ember Keep Notification";
  let color = 0xf59e0b; // Gold
  let description = `Event triggered: **${event}**`;

  if (event === "test") {
    title = "🧪 Discord Webhook Test";
    color = 0x3b82f6; // Blue
    description = `Your Ember Keep Discord Webhook integration is active and working! 🎉`;
  } else if (event === "dungeon_mastered") {
    title = "👑 Dungeon Mastered!";
    color = 0xf59e0b; // Gold
    const dName = details.dungeonName || "a Dungeon";
    const floors = details.floorCount || 10;
    description = `**${charName}** conquered & mastered **${dName}** (${floors} Floors Defeated)!`;
  } else if (event === "rebirth") {
    title = "🔥 Glorious Ember Rebirth!";
    color = 0xef4444; // Red
    description = `**${charName}** ignited a Rebirth and earned **+1 Ember Shard**!`;
  } else if (event === "rift_kill") {
    title = "🐲 World Rift Boss Defeated!";
    color = 0x8b5cf6; // Purple
    description = `**${charName}** slayed the World Rift Boss!`;
  } else if (event === "bounty_completed") {
    title = "📦 The King's Bounty Completed!";
    color = 0x10b981; // Green
    description = `Community target achieved! **+15% Gold & Drop Rate Buff** unlocked!`;
  } else if (event === "hearth_visit") {
    title = "🏡 Hearth Ignited!";
    color = 0x38bdf8; // Cyan
    description = `A friend visited your Hearth! Both heroes gained **+15% Production Speed**!`;
  }

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Ember Keep Bot",
        avatar_url: "https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f525.png",
        embeds: [
          {
            title,
            description,
            color,
            footer: { text: "Ember Keep Engine" },
            timestamp: new Date().toISOString()
          }
        ]
      })
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn("Discord Webhook HTTP Error:", res.status, errText);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("Failed sending Discord Webhook:", e);
    return false;
  }
}

// Global window assignments
window.sendDiscordWebhook = sendDiscordWebhook;
window.renderWebhookSettingsModal = renderWebhookSettingsModal;




