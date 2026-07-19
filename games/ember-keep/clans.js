// ================================================================
// SYSTEM: CLANS
// ================================================================

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

function loadClan(clanId) {
  const saved = localStorage.getItem(`clan_${clanId}`);
  if (!saved) return null;
  return JSON.parse(saved);
}

function saveClan(clan) {
  clan.totalPower = clan.members.reduce((sum, m) => sum + m.power, 0);
  localStorage.setItem(`clan_${clan.id}`, JSON.stringify(clan));
}

function createClan(name, tag, icon) {
  if (playerState.level < 5) { showToast("Nível 5 necessário!", "error"); return; }
  if (playerState.gold < 500) { showToast("500g necessários!", "error"); return; }
  if (playerState.clan) { showToast("Você já pertence a um clã!", "error"); return; }
  
  const clan = {
    ...JSON.parse(JSON.stringify(DEFAULT_CLAN)),
    id: `clan_player_${Date.now()}`,
    name: name,
    tag: tag.substring(0, 4).toUpperCase(),
    icon: icon,
    leader: "player",
    members: [{
      id: "player", name: playerState.name,
      class: playerState.class || "Warrior", level: playerState.level,
      power: getEffectiveStats().power + getEffectiveStats().defense,
      isBot: false,
      joinedAt: Date.now(),
    }],
    createdAt: Date.now(),
  };
  
  playerState.gold -= 500;
  playerState.clan = { id: clan.id, name: clan.name, role: "leader" };
  
  // Preencher com bots
  fillClanWithBots(clan, 5 + Math.floor(Math.random() * 8));
  
  saveClan(clan);
  savePlayerState();
  showToast(`Clã [${clan.tag}] criado!`, "success");
  
  if (typeof checkAchievements === "function") checkAchievements("clan");
  
  // Atualizar UI se estiver na tela
  if (typeof renderClanTab === "function") renderClanTab();
}

function fillClanWithBots(clan, count) {
  for(let i=0; i<count; i++) {
    if (clan.members.length >= clan.maxMembers) break;
    const isOfficer = Math.random() < 0.2;
    const botId = `bot_${Math.random().toString(36).substr(2, 9)}`;
    const botName = generateBotName();
    const classes = Object.keys(CLASS_PRESETS);
    const botClass = classes[Math.floor(Math.random() * classes.length)];
    const avgLvl = Math.max(1, (clan.members[0].level || 10) + Math.floor(Math.random()*6 - 3));
    
    clan.members.push({
      id: botId, name: botName, class: botClass, level: avgLvl,
      power: avgLvl * 15 + Math.floor(Math.random() * 50),
      isBot: true,
      joinedAt: Date.now() - Math.floor(Math.random() * 100000000),
    });
    
    if (isOfficer) clan.officers.push(botId);
  }
}

function generateBotName() {
  const f = ["Dark", "Iron", "Storm", "Frost", "Ember", "Shadow", "Light", "Void"];
  const l = ["blade", "heart", "weaver", "strike", "born", "walker", "smith", "soul"];
  return f[Math.floor(Math.random()*f.length)] + l[Math.floor(Math.random()*l.length)];
}

function getAvailableClans() {
  const clans = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith("clan_")) {
      clans.push(JSON.parse(localStorage.getItem(key)));
    }
  }
  return clans.sort((a,b) => b.totalPower - a.totalPower);
}

function joinClan(clanId) {
  if (playerState.clan) return;
  const clan = loadClan(clanId);
  if (!clan || clan.members.length >= clan.maxMembers) {
    showToast("Clã cheio ou não existe!", "error");
    return;
  }
  
  clan.members.push({
    id: "player", name: playerState.name,
    class: playerState.class || "Warrior", level: playerState.level,
    power: getEffectiveStats().power + getEffectiveStats().defense,
    isBot: false,
    joinedAt: Date.now(),
  });
  
  playerState.clan = { id: clan.id, name: clan.name, role: "member" };
  saveClan(clan);
  savePlayerState();
  showToast(`Bem vindo a [${clan.tag}]!`, "success");
  if (typeof renderClanTab === "function") renderClanTab();
}

function leaveClan() {
  if (!playerState.clan) return;
  const clan = loadClan(playerState.clan.id);
  if (clan) {
    clan.members = clan.members.filter(m => m.id !== "player");
    if (clan.leader === "player") {
      if (clan.members.length > 0) {
        clan.leader = clan.members[0].id;
      } else {
        localStorage.removeItem(`clan_${clan.id}`);
      }
    }
    if (clan.members.length > 0) saveClan(clan);
  }
  playerState.clan = null;
  savePlayerState();
  showToast("Você saiu do clã.", "info");
  if (typeof renderClanTab === "function") renderClanTab();
}

// Inicializa bots se não existirem
function initializeBotClans() {
  if (localStorage.getItem("bot_clans_initialized")) return;
  
  // Criar 10 clãs bot
  for(let i=0; i<10; i++) {
    const clanName = BOT_CLAN_NAMES[i % BOT_CLAN_NAMES.length] + (i >= BOT_CLAN_NAMES.length ? ` ${i}` : "");
    const clan = {
      ...JSON.parse(JSON.stringify(DEFAULT_CLAN)),
      id: `clan_bot_${i}`,
      name: clanName,
      tag: clanName.substring(0, 3).toUpperCase(),
      icon: ["🐺","🦅","🦁","🐉","💀","🔥","⚡","❄️","🌑","🔮"][i%10],
      leader: "bot_leader",
      members: [],
      createdAt: Date.now() - Math.floor(Math.random() * 5000000000),
    };
    
    // Nível médio dos bots baseado na região q vão tentar dominar, mas aleatório
    const baseLvl = 5 + (i * 2);
    
    // Leader
    clan.members.push({
      id: "bot_leader", name: generateBotName(), class: "Warrior", level: baseLvl + 5,
      power: (baseLvl+5) * 20, isBot: true, joinedAt: clan.createdAt
    });
    clan.leader = "bot_leader";
    
    fillClanWithBots(clan, 10 + Math.floor(Math.random()*9));
    saveClan(clan);
  }
  
  localStorage.setItem("bot_clans_initialized", "true");
}
