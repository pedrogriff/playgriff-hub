// ================================================================
// EMBER KEEP — Social System
// ================================================================

(function() {

  const BOT_NAMES = [
    "AshWarden", "EmberKnight", "NightVeil", "CinderBlade", "SoulForge",
    "Pyrothane", "GrimLight", "StormShade", "VoidCaster", "DawnStriker",
    "RuneBreaker", "ShadowPyre", "FrostFang", "IronVeil", "GoldMaw",
    "BlackEmber", "RedMantle", "StormRager", "DuskWarden", "HolyFire",
  ];

  const BOT_CLASSES = ["Warrior", "Ranger", "Mage", "Paladin"];

  let friends = [];

  // ── Load persisted friends ──
  function loadFriends() {
    const saved = localStorage.getItem("rpg_social_friends");
    if (saved) {
      try { friends = JSON.parse(saved); } catch(e) { friends = []; }
    }
    if (!friends.length) generateInitialBots();
  }

  function saveFriends() {
    localStorage.setItem("rpg_social_friends", JSON.stringify(friends));
  }

  // ── Generate starting bots ──
  function generateInitialBots() {
    const shuffle = arr => arr.sort(() => Math.random() - 0.5);
    const picked  = shuffle([...BOT_NAMES]).slice(0, 12);
    friends = picked.map((name, i) => ({
      id:       `bot_${i}_${name}`,
      name,
      class:    BOT_CLASSES[Math.floor(Math.random() * BOT_CLASSES.length)],
      level:    Math.floor(Math.random() * 25) + 1,
      power:    Math.floor(Math.random() * 8000) + 200,
      isBot:    true,
      isOnline: Math.random() > 0.4,
    }));
    saveFriends();
  }

  // ── Simulate bot activity ──
  function simulateBotActivity() {
    friends.forEach(friend => {
      if (!friend.isBot) return;
      if (Math.random() < 0.15) {
        friend.power += Math.floor(Math.random() * 60) + 10;
        if (Math.random() < 0.06) {
          friend.level = Math.min(30, friend.level + 1);
          friend.power += 200;
        }
        friend.isOnline = Math.random() > 0.3;
      }
    });
    saveFriends();
  }

  // ── Add friend ──
  function addFriend(name) {
    name = name.trim();
    if (!name) return;
    if (friends.some(f => f.name.toLowerCase() === name.toLowerCase())) {
      if (typeof showToast === "function") showToast(`${name} is already your friend!`, "error");
      return;
    }
    const newFriend = {
      id:       `custom_${Date.now()}`,
      name,
      class:    BOT_CLASSES[Math.floor(Math.random() * BOT_CLASSES.length)],
      level:    Math.floor(Math.random() * 15) + 1,
      power:    Math.floor(Math.random() * 3000) + 100,
      isBot:    true,
      isOnline: true,
    };
    friends.push(newFriend);
    saveFriends();
    renderSuggested();
    renderLeaderboard();
    if (typeof showToast === "function") showToast(`👥 Added ${name} as a friend!`, "success");
  }

  // ── Render suggested list ──
  function renderSuggested() {
    const list = document.getElementById("suggested-friends-list");
    if (!list) return;
    list.innerHTML = "";

    const topFriends = friends.slice(0, 8);
    topFriends.forEach(friend => {
      const li = document.createElement("li");
      li.className = "suggested-item";
      const onlineColor = friend.isOnline ? "#2ecc71" : "#555";
      li.innerHTML = `
        <div>
          <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${onlineColor};margin-right:5px;"></span>
          <strong>${friend.name}</strong>
          <span style="color:var(--text-muted);font-size:0.72rem;margin-left:6px;">${friend.class} · Lv.${friend.level}</span>
        </div>
        <button onclick="window.removeFriend('${friend.id}')" title="Remove" style="background:var(--danger-dim);">✕</button>
      `;
      list.appendChild(li);
    });

    if (topFriends.length === 0) {
      list.innerHTML = `<li style="color:var(--text-muted);font-size:0.82rem;padding:8px;">Add friends to see them here.</li>`;
    }
  }

  // ── Remove friend ──
  window.removeFriend = function(id) {
    friends = friends.filter(f => f.id !== id);
    saveFriends();
    renderSuggested();
    renderLeaderboard();
  };

  window.getFriendById = function(id) {
    return friends.find(f => f.id === id);
  };

  window.updateFriendPower = function(id, newPower) {
    const friend = friends.find(f => f.id === id);
    if (friend) {
      friend.power = newPower;
      saveFriends();
      renderLeaderboard();
    }
  };

  // ── Render leaderboard ──
  function renderLeaderboard() {
    const tbody = document.getElementById("leaderboard-body");
    if (!tbody) return;

    // Build combined list with player
    const allEntries = friends.map(f => ({
      id:       f.id,
      name:     f.name,
      class:    f.class,
      level:    f.level,
      power:    f.power,
      isPlayer: false,
    }));

    // Get player data from game state if available
    if (typeof playerState !== "undefined" && playerState.class) {
      const pr = typeof getPlayerPowerRating === "function"
        ? getPlayerPowerRating(playerState)
        : playerState.stats?.power || 0;
      allEntries.push({
        id:       "player",
        name:     playerState.name || "You",
        level:    playerState.level || 1,
        power:    pr,
        isPlayer: true,
      });
    } else {
      allEntries.push({ id:"player", name:"You", level:1, power:0, isPlayer:true });
    }

    allEntries.sort((a, b) => b.power - a.power);
    const top20 = allEntries.slice(0, 20);

    tbody.innerHTML = "";
    top20.forEach((entry, i) => {
      const rankEmoji = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
      const tr = document.createElement("tr");
      if (entry.isPlayer) tr.classList.add("current-player");
      
      const actionHtml = entry.isPlayer 
        ? `<span style="color: var(--text-muted); opacity: 0.5;">-</span>`
        : `<button class="btn-challenge" data-bot-id="${entry.id}">⚔️ Duel</button>`;

      tr.innerHTML = `
        <td>${rankEmoji}</td>
        <td>${entry.isPlayer ? `<strong>${entry.name}</strong> (You)` : entry.name}</td>
        <td>Lv.${entry.level}</td>
        <td>${typeof formatNumber === "function" ? formatNumber(entry.power) : entry.power}</td>
        <td style="text-align: right;">${actionHtml}</td>`;
      tbody.appendChild(tr);
    });
  }

  // ── Input / button ──
  function initSocialControls() {
    const input  = document.getElementById("friend-username-input");
    const addBtn = document.getElementById("add-friend-btn");
    const tbody  = document.getElementById("leaderboard-body");

    if (tbody) {
      tbody.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-challenge");
        if (btn) {
          const botId = btn.dataset.botId;
          if (typeof window.startPvPDuel === "function") {
            window.startPvPDuel(botId);
          }
        }
      });
    }

    if (!addBtn) return;

    addBtn.addEventListener("click", () => {
      const name = input?.value?.trim();
      if (!name) return;
      addFriend(name);
      if (input) input.value = "";
    });

    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addBtn.click();
    });
  }

  // ── Refresh on player state updates ──
  window.addEventListener("playerStateUpdated", () => {
    renderLeaderboard();
  });

  // ── Auto-refresh UI on social tab open ──
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.tab === "social-tab") {
        simulateBotActivity();
        renderSuggested();
        renderLeaderboard();
      }
    });
  });

  // ── Init ──
  document.addEventListener("DOMContentLoaded", () => {
    loadFriends();
    initSocialControls();
    renderSuggested();
    renderLeaderboard();

    // Periodic bot simulation
    setInterval(() => {
      simulateBotActivity();
      renderLeaderboard();
    }, 45_000);
  });

})();
