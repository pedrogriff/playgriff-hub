// ================================================================
// EMBER KEEP — Clans System Module (clans.js)
// Native ES Module
// ================================================================

import { AccountStore } from "./account.js";

const DEFAULT_CLAN = {
  id: null,
  name: "",
  tag: "",
  icon: "⚔️",
  leader: null,
  officers: [],
  members: [], // [{ id, name, class, level, power, isBot, joinedAt }]
  maxMembers: 20,
  fortresses: [], // ["greenhollow", etc]
  siegePoints: 0,
  totalPower: 0,
  createdAt: null,
};

const BOT_CLAN_NAMES = [
  "Iron Wolves", "Shadow Legion", "Crimson Fang", "Storm Riders",
  "Ember Guard", "Frost Reapers", "Night Sentinels", "Blood Ravens",
  "Golden Hawks", "Void Walkers", "Dragon Sworn", "Phoenix Order",
];

function toast(msg, type = "info") {
  if (typeof window.showToast === "function") window.showToast(msg, type);
  else if (typeof showToast === "function") showToast(msg, type);
}

function saveState() {
  if (typeof window.savePlayerState === "function") window.savePlayerState();
  else if (typeof savePlayerState === "function") savePlayerState();
  else if (typeof AccountStore !== "undefined" && typeof AccountStore.save === "function") AccountStore.save();
}

function refreshStats() {
  if (typeof window.renderStats === "function") window.renderStats();
  else if (typeof renderStats === "function") renderStats();
  else if (typeof window.renderActiveCharacterUI === "function") window.renderActiveCharacterUI();
}

function checkAch(type) {
  if (typeof window.checkAchievements === "function") window.checkAchievements(type);
  else if (typeof checkAchievements === "function") checkAchievements(type);
}

export function loadClan(clanId) {
  if (!clanId) return null;
  const saved = localStorage.getItem(`clan_${clanId}`);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch (e) {
    return null;
  }
}

export function saveClan(clan) {
  if (!clan || !clan.id) return;
  clan.totalPower = (clan.members || []).reduce((sum, m) => sum + (m.power || 0), 0);
  localStorage.setItem(`clan_${clan.id}`, JSON.stringify(clan));
}

export function createClan(name, tag, icon) {
  name = (name || "").trim();
  tag = (tag || "").trim();
  icon = icon || "⚔️";

  if (!name) {
    toast("Please enter a Clan name!", "error");
    return false;
  }
  if (!tag) {
    toast("Please enter a 4-letter Clan TAG!", "error");
    return false;
  }

  const activeChar = typeof AccountStore !== "undefined" ? AccountStore.getActiveCharacter() : null;
  const pState = window.playerState || activeChar || {};

  const charLevel = pState.level !== undefined ? pState.level : (activeChar ? activeChar.level : 1);
  const charGold  = pState.gold !== undefined ? pState.gold : (activeChar ? activeChar.gold : 0);
  const charClan  = pState.clan || (activeChar ? activeChar.clan : null);

  if (charLevel < 5) {
    toast("Level 5 required to found a Clan!", "error");
    return false;
  }
  if (charGold < 500) {
    toast("500g required to found a Clan!", "error");
    return false;
  }
  if (charClan && charClan.id) {
    toast("You already belong to a clan!", "error");
    return false;
  }

  const charId = (activeChar && activeChar.id) || pState.id || "player";
  const charName = pState.name || (activeChar && activeChar.name) || "Hero";

  let charPower = 150;
  if (typeof window.getEffectiveStats === "function") {
    const stats = window.getEffectiveStats();
    charPower = (stats.power || 0) + (stats.defense || 0);
  } else if (typeof getEffectiveStats === "function") {
    const stats = getEffectiveStats();
    charPower = (stats.power || 0) + (stats.defense || 0);
  } else if (pState.power) {
    charPower = pState.power + (pState.defense || 0);
  }

  const clan = {
    ...JSON.parse(JSON.stringify(DEFAULT_CLAN)),
    id: `clan_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: name,
    tag: tag.substring(0, 4).toUpperCase(),
    icon: icon,
    leader: charId,
    members: [{
      id: charId,
      name: charName,
      class: pState.class || (activeChar ? activeChar.class : "Warrior"),
      level: charLevel,
      power: charPower,
      isBot: false,
      joinedAt: Date.now(),
    }],
    createdAt: Date.now(),
  };

  if (pState.gold !== undefined) pState.gold = Math.max(0, pState.gold - 500);
  if (activeChar) activeChar.gold = Math.max(0, (activeChar.gold || 0) - 500);

  const clanObj = { id: clan.id, name: clan.name, tag: clan.tag, icon: clan.icon, role: "leader" };
  pState.clan = clanObj;
  if (activeChar) activeChar.clan = clanObj;

  // Fill with 5-8 bot members to start
  fillClanWithBots(clan, 5 + Math.floor(Math.random() * 4));

  saveClan(clan);
  saveState();
  refreshStats();
  toast(`⚔️ Clan [${clan.tag}] ${clan.name} founded!`, "success");

  checkAch("clan");
  if (typeof window.renderClanTab === "function") window.renderClanTab();
  return true;
}

export function fillClanWithBots(clan, count) {
  for(let i=0; i<count; i++) {
    if (clan.members.length >= clan.maxMembers) break;
    const isOfficer = Math.random() < 0.2;
    const botId = `bot_${Math.random().toString(36).substr(2, 9)}`;
    const botName = generateBotName();
    const classes = ["Warrior", "Ranger", "Mage", "Paladin"];
    const botClass = classes[Math.floor(Math.random() * classes.length)];
    const avgLvl = Math.max(1, (clan.members[0]?.level || 10) + Math.floor(Math.random()*6 - 3));

    clan.members.push({
      id: botId,
      name: botName,
      class: botClass,
      level: avgLvl,
      power: avgLvl * 25 + Math.floor(Math.random() * 50),
      isBot: true,
      joinedAt: Date.now() - Math.floor(Math.random() * 100000000),
    });

    if (isOfficer) clan.officers.push(botId);
  }
}

export function generateBotName() {
  const f = ["Dark", "Iron", "Storm", "Frost", "Ember", "Shadow", "Light", "Void", "Grim", "Star"];
  const l = ["blade", "heart", "weaver", "strike", "born", "walker", "smith", "soul", "guard", "rider"];
  return f[Math.floor(Math.random()*f.length)] + l[Math.floor(Math.random()*l.length)];
}

export function getAvailableClans() {
  initializeBotClans();
  const clans = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith("clan_")) {
      try {
        const c = JSON.parse(localStorage.getItem(key));
        if (c && c.id) clans.push(c);
      } catch (e) {}
    }
  }
  return clans.sort((a,b) => (b.totalPower || 0) - (a.totalPower || 0));
}

export function joinClan(clanId) {
  const activeChar = typeof AccountStore !== "undefined" ? AccountStore.getActiveCharacter() : null;
  const pState = window.playerState || activeChar || {};

  if (pState.clan && pState.clan.id) {
    toast("You already belong to a clan!", "error");
    return false;
  }
  const clan = loadClan(clanId);
  if (!clan || (clan.members && clan.members.length >= (clan.maxMembers || 20))) {
    toast("Clan is full or unavailable!", "error");
    return false;
  }

  const charId = (activeChar && activeChar.id) || pState.id || "player";
  const charName = pState.name || (activeChar && activeChar.name) || "Hero";

  let charPower = 150;
  if (typeof window.getEffectiveStats === "function") {
    const stats = window.getEffectiveStats();
    charPower = (stats.power || 0) + (stats.defense || 0);
  } else if (typeof getEffectiveStats === "function") {
    const stats = getEffectiveStats();
    charPower = (stats.power || 0) + (stats.defense || 0);
  } else if (pState.power) {
    charPower = pState.power + (pState.defense || 0);
  }

  clan.members = clan.members || [];
  clan.members.push({
    id: charId,
    name: charName,
    class: pState.class || "Warrior",
    level: pState.level || 1,
    power: charPower,
    isBot: false,
    joinedAt: Date.now(),
  });

  const clanObj = { id: clan.id, name: clan.name, tag: clan.tag, icon: clan.icon, role: "member" };
  pState.clan = clanObj;
  if (activeChar) activeChar.clan = clanObj;

  saveClan(clan);
  saveState();
  refreshStats();
  toast(`⚔️ Joined [${clan.tag}] ${clan.name}!`, "success");
  if (typeof window.renderClanTab === "function") window.renderClanTab();
  return true;
}

export function leaveClan() {
  const activeChar = typeof AccountStore !== "undefined" ? AccountStore.getActiveCharacter() : null;
  const pState = window.playerState || activeChar;
  if (!pState || !pState.clan || !pState.clan.id) return;
  const charId = (activeChar && activeChar.id) || pState.id || "player";

  const clan = loadClan(pState.clan.id);
  if (clan) {
    clan.members = (clan.members || []).filter(m => m.id !== charId && m.id !== "player");
    if (clan.leader === charId || clan.leader === "player") {
      if (clan.members.length > 0) {
        clan.leader = clan.members[0].id;
      } else {
        localStorage.removeItem(`clan_${clan.id}`);
      }
    }
    if (clan.members.length > 0) saveClan(clan);
  }
  pState.clan = null;
  if (activeChar) activeChar.clan = null;

  saveState();
  refreshStats();
  toast("You left the clan.", "info");
  if (typeof window.renderClanTab === "function") window.renderClanTab();
}

export function initializeBotClans() {
  if (localStorage.getItem("bot_clans_initialized")) return;

  for(let i=0; i<8; i++) {
    const clanName = BOT_CLAN_NAMES[i % BOT_CLAN_NAMES.length];
    const tag = clanName.substring(0, 3).toUpperCase() + (i + 1);
    const clan = {
      ...JSON.parse(JSON.stringify(DEFAULT_CLAN)),
      id: `clan_bot_${i}`,
      name: clanName,
      tag: tag,
      icon: ["🐺","🦅","🦁","🐉","💀","🔥","⚡","❄️"][i%8],
      leader: `bot_leader_${i}`,
      members: [],
      createdAt: Date.now() - Math.floor(Math.random() * 5000000000),
    };

    const baseLvl = 5 + (i * 2);
    clan.members.push({
      id: `bot_leader_${i}`, name: generateBotName(), class: "Warrior", level: baseLvl + 5,
      power: (baseLvl+5) * 20, isBot: true, joinedAt: clan.createdAt
    });
    clan.leader = `bot_leader_${i}`;

    fillClanWithBots(clan, 8 + Math.floor(Math.random()*6));
    saveClan(clan);
  }

  localStorage.setItem("bot_clans_initialized", "true");
}

if (typeof window !== "undefined") {
  window.loadClan = loadClan;
  window.saveClan = saveClan;
  window.createClan = createClan;
  window.joinClan = joinClan;
  window.leaveClan = leaveClan;
  window.getAvailableClans = getAvailableClans;
  window.initializeBotClans = initializeBotClans;
}
