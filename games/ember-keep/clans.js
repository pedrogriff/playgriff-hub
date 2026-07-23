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
    if (typeof showToast === "function") showToast("Please enter a Clan name!", "error");
    return false;
  }
  if (!tag) {
    if (typeof showToast === "function") showToast("Please enter a 4-letter Clan TAG!", "error");
    return false;
  }

  if (playerState.level < 5) {
    if (typeof showToast === "function") showToast("Level 5 required to found a Clan!", "error");
    return false;
  }
  if (playerState.gold < 500) {
    if (typeof showToast === "function") showToast("500g required to found a Clan!", "error");
    return false;
  }
  if (playerState.clan) {
    if (typeof showToast === "function") showToast("You already belong to a clan!", "error");
    return false;
  }

  const activeChar = typeof AccountStore !== "undefined" ? AccountStore.getActiveCharacter() : null;
  const charId = (activeChar && activeChar.id) || "player";
  const charName = playerState.name || (activeChar && activeChar.name) || "Hero";

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
      class: playerState.class || "Warrior",
      level: playerState.level || 1,
      power: (typeof getEffectiveStats === "function" ? (getEffectiveStats().power + getEffectiveStats().defense) : 150),
      isBot: false,
      joinedAt: Date.now(),
    }],
    createdAt: Date.now(),
  };

  playerState.gold -= 500;
  playerState.clan = { id: clan.id, name: clan.name, tag: clan.tag, icon: clan.icon, role: "leader" };

  // Fill with 5-8 bot members to start
  fillClanWithBots(clan, 5 + Math.floor(Math.random() * 4));

  saveClan(clan);
  if (typeof savePlayerState === "function") savePlayerState();
  if (typeof showToast === "function") showToast(`⚔️ Clan [${clan.tag}] ${clan.name} founded!`, "success");

  if (typeof checkAchievements === "function") checkAchievements("clan");
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
  if (playerState.clan) {
    if (typeof showToast === "function") showToast("You already belong to a clan!", "error");
    return false;
  }
  const clan = loadClan(clanId);
  if (!clan || clan.members.length >= clan.maxMembers) {
    if (typeof showToast === "function") showToast("Clan is full or unavailable!", "error");
    return false;
  }

  const activeChar = typeof AccountStore !== "undefined" ? AccountStore.getActiveCharacter() : null;
  const charId = (activeChar && activeChar.id) || "player";
  const charName = playerState.name || (activeChar && activeChar.name) || "Hero";

  clan.members.push({
    id: charId,
    name: charName,
    class: playerState.class || "Warrior",
    level: playerState.level || 1,
    power: (typeof getEffectiveStats === "function" ? (getEffectiveStats().power + getEffectiveStats().defense) : 150),
    isBot: false,
    joinedAt: Date.now(),
  });

  playerState.clan = { id: clan.id, name: clan.name, tag: clan.tag, icon: clan.icon, role: "member" };
  saveClan(clan);
  if (typeof savePlayerState === "function") savePlayerState();
  if (typeof showToast === "function") showToast(`⚔️ Joined [${clan.tag}] ${clan.name}!`, "success");
  if (typeof window.renderClanTab === "function") window.renderClanTab();
  return true;
}

export function leaveClan() {
  if (!playerState.clan) return;
  const activeChar = typeof AccountStore !== "undefined" ? AccountStore.getActiveCharacter() : null;
  const charId = (activeChar && activeChar.id) || "player";

  const clan = loadClan(playerState.clan.id);
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
  playerState.clan = null;
  if (typeof savePlayerState === "function") savePlayerState();
  if (typeof showToast === "function") showToast("You left the clan.", "info");
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
