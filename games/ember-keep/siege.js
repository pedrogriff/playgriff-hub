// ================================================================
// SYSTEM: SIEGE (CERCO)
// ================================================================

const SIEGE_CYCLE_DAYS = 7;
const SIEGE_CYCLE_MS = 7 * 24 * 3600 * 1000;

function getSiegeCycleStart() {
  let start = localStorage.getItem("siege_cycle_start");
  if (!start) {
    start = Date.now();
    localStorage.setItem("siege_cycle_start", start);
  }
  return parseInt(start, 10);
}

function getCurrentSiegePhase() {
  const cycleStart = getSiegeCycleStart();
  let elapsed = Date.now() - cycleStart;
  
  // Se o ciclo já passou, reinicia
  if (elapsed >= SIEGE_CYCLE_MS) {
    const newStart = Date.now();
    localStorage.setItem("siege_cycle_start", newStart);
    // Reinicia todas as sieges
    REGIONS.forEach(r => initSiegeData(r.id, true));
    elapsed = 0;
  }

  const dayInCycle = Math.floor(elapsed / (24 * 3600 * 1000));
  
  if (dayInCycle <= 2) return { phase:"inscription", daysLeft: 3 - dayInCycle, label: "Inscrição" };
  if (dayInCycle <= 4) return { phase:"preparation", daysLeft: 5 - dayInCycle, label: "Preparação" };
  if (dayInCycle === 5) return { phase:"siege", daysLeft: 0, label: "Dia do Cerco" };
  return { phase:"results", daysLeft: 7 - dayInCycle, label: "Resultados" };
}

function initSiegeData(regionId, forceReset = false) {
  let data = localStorage.getItem(`siege_${regionId}`);
  if (!data || forceReset) {
    data = {
      regionId,
      defender: null, // clanId atual controlador da fortaleza, será setado depois
      attackers: [],  // lista de clanIds
      scores: {},     // { clanId: { points: 0 } }
      resolved: false,
      winner: null
    };
    
    // Pega o atual controlador
    const regionControl = localStorage.getItem(`fortress_${regionId}`);
    if (regionControl) {
      data.defender = regionControl;
      data.scores[regionControl] = { points: 0 };
    } else {
      // Se ninguem controla, os bots atacam
    }
    
    // Bots se inscrevem automaticamente no reset
    const allClans = getAvailableClans();
    const bots = allClans.filter(c => c.id.startsWith("clan_bot_"));
    // Pega 2 bots aleatorios
    const r1 = bots[Math.floor(Math.random()*bots.length)];
    const r2 = bots[Math.floor(Math.random()*bots.length)];
    if (r1 && data.defender !== r1.id) { data.attackers.push(r1.id); data.scores[r1.id] = { points:0 }; }
    if (r2 && data.defender !== r2.id && r1 !== r2) { data.attackers.push(r2.id); data.scores[r2.id] = { points:0 }; }
    
    localStorage.setItem(`siege_${regionId}`, JSON.stringify(data));
  }
}

function getSiegeData(regionId) {
  let data = localStorage.getItem(`siege_${regionId}`);
  if (!data) {
    initSiegeData(regionId);
    data = localStorage.getItem(`siege_${regionId}`);
  }
  return JSON.parse(data);
}

function saveSiegeData(regionId, data) {
  localStorage.setItem(`siege_${regionId}`, JSON.stringify(data));
}

function registerForSiege(regionId) {
  const phase = getCurrentSiegePhase();
  if (phase.phase !== "inscription") {
    showToast("Fase de inscrição já passou!", "error");
    return;
  }
  
  if (!playerState.clan) return;
  const myClanId = playerState.clan.id;
  
  const siege = getSiegeData(regionId);
  if (siege.defender === myClanId || siege.attackers.includes(myClanId)) {
    showToast("Clã já inscrito!", "error");
    return;
  }
  
  siege.attackers.push(myClanId);
  siege.scores[myClanId] = { points: 0 };
  saveSiegeData(regionId, siege);
  showToast("Inscrito no cerco!", "success");
  if (typeof renderSiegeView === "function") renderSiegeView(regionId);
}

function addSiegePoints(regionId, points) {
  if (!playerState.clan) return;
  const phase = getCurrentSiegePhase();
  if (phase.phase !== "preparation" && phase.phase !== "inscription") return; // Só pode pontuar antes do cerco

  const siege = getSiegeData(regionId);
  const myClanId = playerState.clan.id;
  if (!siege.scores[myClanId]) return;
  
  siege.scores[myClanId].points += points;
  saveSiegeData(regionId, siege);
}

function simulateWeeklySiege() {
  const now = Date.now();
  const lastSim = localStorage.getItem("last_siege_sim") || 0;
  const elapsed = now - parseInt(lastSim);
  
  if (elapsed < 3600000) return; // Máximo 1x por hora
  
  const phase = getCurrentSiegePhase();
  
  REGIONS.forEach(region => {
    const siege = getSiegeData(region.id);
    
    if (phase.phase === "preparation" || phase.phase === "inscription") {
      // Bots ganham pontos
      Object.keys(siege.scores).forEach(clanId => {
        if (clanId.startsWith("clan_bot_")) {
          siege.scores[clanId].points += Math.floor(Math.random() * 50) + 10;
        }
      });
      saveSiegeData(region.id, siege);
    }
    
    if (phase.phase === "siege" && !siege.resolved) {
      resolveSiege(region.id);
    }
  });
  
  localStorage.setItem("last_siege_sim", now);
}

function resolveSiege(regionId) {
  const siege = getSiegeData(regionId);
  let highestScore = -1;
  let winner = null;
  
  Object.keys(siege.scores).forEach(clanId => {
    const clan = loadClan(clanId);
    if (!clan) return;
    
    let score = siege.scores[clanId].points 
                + (clan.totalPower * 0.1) 
                + (clan.members.length * 5);
                
    if (clanId === siege.defender) {
      score *= 1.15; // 15% bonus de defesa
    }
    
    if (score > highestScore) {
      highestScore = score;
      winner = clanId;
    }
  });
  
  siege.resolved = true;
  siege.winner = winner;
  
  if (winner) {
    transferFortressControl(regionId, winner);
  }
  
  saveSiegeData(regionId, siege);
}

function transferFortressControl(regionId, clanId) {
  // Remover dos outros clãs
  const allClans = getAvailableClans();
  allClans.forEach(c => {
    if (c.fortresses.includes(regionId)) {
      c.fortresses = c.fortresses.filter(r => r !== regionId);
      saveClan(c);
    }
  });
  
  // Adicionar ao novo clan
  const newClan = loadClan(clanId);
  if (newClan && !newClan.fortresses.includes(regionId)) {
    newClan.fortresses.push(regionId);
    saveClan(newClan);
  }
  
  localStorage.setItem(`fortress_${regionId}`, clanId);
}

// Inicializa as fortalezas com clãs bot
function initializeFortresses() {
  if (localStorage.getItem("fortresses_initialized")) return;
  
  const allClans = getAvailableClans();
  const bots = allClans.filter(c => c.id.startsWith("clan_bot_"));
  
  REGIONS.forEach((region, i) => {
    if (bots[i]) {
      transferFortressControl(region.id, bots[i].id);
    }
  });
  
  localStorage.setItem("fortresses_initialized", "true");
}
