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

  // ── Add friend object ──
  function addFriendObj(player) {
    if (friends.some(f => f.id === player.id || f.name.toLowerCase() === player.name.toLowerCase())) {
      if (typeof showToast === "function") showToast(`${player.name} is already in your friends list!`, "error");
      return;
    }
    friends.push(player);
    saveFriends();
    renderSuggested();
    renderMyFriends();
    renderLeaderboard();
    if (typeof showToast === "function") showToast(`👥 Added ${player.name} as a friend!`, "success");
  }

  // ── Add friend by input name ──
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
    addFriendObj(newFriend);
  }

  // ── Render suggested players list ──
  async function renderSuggested() {
    const list = document.getElementById("suggested-friends-list");
    if (!list) return;

    let suggested = [];

    // 1. Fetch main characters from other user accounts in Supabase DB
    if (typeof window.getSuggestedPlayersFromDB === "function") {
      try {
        const dbSuggested = await window.getSuggestedPlayersFromDB();
        if (dbSuggested && dbSuggested.length > 0) {
          suggested = dbSuggested;
        }
      } catch (e) {
        console.warn("Failed to fetch DB suggested players:", e);
      }
    }

    // 2. Add local account slots (other created characters)
    if (typeof AccountStore !== "undefined" && typeof AccountStore.getCharacterSlots === "function") {
      const slots = AccountStore.getCharacterSlots();
      const activeChar = AccountStore.getActiveCharacter();
      Object.values(slots).forEach(char => {
        if (char && (!activeChar || char.id !== activeChar.id)) {
          if (!suggested.some(s => s.id === char.id || s.name.toLowerCase() === char.name.toLowerCase())) {
            suggested.push({
              id: char.id || `slot_${char.slotIndex}`,
              name: char.name,
              class: char.class ? char.class.charAt(0).toUpperCase() + char.class.slice(1) : "Warrior",
              level: char.level || 1,
              power: char.power || (char.level * 50 + 100),
              isBot: false,
              isOnline: true
            });
          }
        }
      });
    }

    // 3. Fallback bots if list has fewer than 4 players
    if (suggested.length < 4) {
      const existingNames = new Set(suggested.map(s => s.name.toLowerCase()));
      BOT_NAMES.forEach((name, i) => {
        if (suggested.length < 8 && !existingNames.has(name.toLowerCase())) {
          suggested.push({
            id: `bot_${i}_${name}`,
            name,
            class: BOT_CLASSES[i % BOT_CLASSES.length],
            level: (i % 15) + 5,
            power: (i + 1) * 350 + 200,
            isBot: true,
            isOnline: (i % 2 === 0)
          });
        }
      });
    }

    // Filter out players already added as friends
    const friendIds = new Set(friends.map(f => f.id));
    const friendNames = new Set(friends.map(f => f.name.toLowerCase()));
    const unadded = suggested.filter(s => !friendIds.has(s.id) && !friendNames.has(s.name.toLowerCase()));

    list.innerHTML = "";
    unadded.slice(0, 6).forEach(player => {
      const li = document.createElement("li");
      li.className = "suggested-item";
      const onlineColor = player.isOnline ? "#2ecc71" : "#555";
      const formattedPwr = typeof formatNumber === "function" ? formatNumber(player.power) : player.power;

      li.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${onlineColor};flex-shrink:0;"></span>
          <div>
            <strong>${player.name}</strong>
            <div style="color:var(--text-muted);font-size:0.72rem;">${player.class} · Lv.${player.level} (${formattedPwr} Pwr)</div>
          </div>
        </div>
        <button class="btn-action btn-add-suggested" style="padding:4px 10px;font-size:0.75rem;min-height:28px;line-height:1;">+ Add</button>
      `;

      const addBtn = li.querySelector(".btn-add-suggested");
      addBtn.addEventListener("click", () => addFriendObj(player));
      list.appendChild(li);
    });

    if (unadded.length === 0) {
      list.innerHTML = `<li style="color:var(--text-muted);font-size:0.82rem;padding:8px;">No new suggested players right now!</li>`;
    }
  }

  // ── Render my friends list ──
  function renderMyFriends() {
    const list = document.getElementById("my-friends-list");
    if (!list) return;
    list.innerHTML = "";

    if (!friends.length) {
      list.innerHTML = `<li style="color:var(--text-muted);font-size:0.82rem;padding:8px;">No friends added yet. Add players from suggestions above!</li>`;
      return;
    }

    friends.forEach(friend => {
      const li = document.createElement("li");
      li.className = "suggested-item";
      const onlineColor = friend.isOnline ? "#2ecc71" : "#555";
      const formattedPwr = typeof formatNumber === "function" ? formatNumber(friend.power) : friend.power;

      li.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${onlineColor};flex-shrink:0;"></span>
          <div>
            <strong>${friend.name}</strong>
            <div style="color:var(--text-muted);font-size:0.72rem;">${friend.class} · Lv.${friend.level} (${formattedPwr} Pwr)</div>
          </div>
        </div>
        <div style="display:flex;gap:4px;">
          <button class="btn-duel-friend" data-friend-id="${friend.id}" title="Duel" style="background:var(--gold-dim);color:#000;font-size:0.75rem;padding:4px 8px;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">⚔️ Duel</button>
          <button class="btn-remove-friend" data-friend-id="${friend.id}" title="Remove" style="background:var(--danger-dim);color:var(--danger);font-size:0.75rem;padding:4px 8px;border:none;border-radius:4px;cursor:pointer;">✕</button>
        </div>
      `;

      const duelBtn = li.querySelector(".btn-duel-friend");
      const removeBtn = li.querySelector(".btn-remove-friend");

      if (duelBtn) {
        duelBtn.addEventListener("click", () => {
          if (typeof window.startPvPDuel === "function") window.startPvPDuel(friend.id);
        });
      }
      if (removeBtn) {
        removeBtn.addEventListener("click", () => window.removeFriend(friend.id));
      }

      list.appendChild(li);
    });
  }

  // ── Remove friend ──
  window.removeFriend = function(id) {
    friends = friends.filter(f => f.id !== id);
    saveFriends();
    renderSuggested();
    renderMyFriends();
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

  // ── Render Clan Tab ──
  function renderClanTab() {
    const noClanView  = document.getElementById("no-clan-view");
    const hasClanView = document.getElementById("has-clan-view");
    if (!noClanView || !hasClanView) return;

    if (typeof window.initializeBotClans === "function") window.initializeBotClans();

    const activeChar = typeof AccountStore !== "undefined" ? AccountStore.getActiveCharacter() : null;
    const pState = window.playerState || activeChar;

    if (pState && pState.clan && pState.clan.id) {
      const clan = typeof window.loadClan === "function" ? window.loadClan(pState.clan.id) : null;
      if (!clan) {
        pState.clan = null;
        if (activeChar) activeChar.clan = null;
        if (typeof window.savePlayerState === "function") window.savePlayerState();
        renderClanTab();
        return;
      }

      noClanView.style.display  = "none";
      hasClanView.style.display = "block";

      const myIcon = document.getElementById("my-clan-icon");
      const myName = document.getElementById("my-clan-name");
      const myStats = document.getElementById("my-clan-stats");
      const membersList = document.getElementById("my-clan-members-list");

      if (myIcon) myIcon.textContent = clan.icon || "⚔️";
      if (myName) myName.textContent = `[${clan.tag}] ${clan.name}`;
      if (myStats) {
        const totalPwr = (clan.members || []).reduce((s, m) => s + (m.power || 0), 0);
        const fmt = window.formatNumber || (typeof formatNumber === "function" ? formatNumber : (n => n));
        myStats.textContent = `Members: ${clan.members.length}/${clan.maxMembers || 20} · Total Power: ${fmt(totalPwr)}`;
      }

      if (membersList) {
        membersList.innerHTML = "";
        (clan.members || []).forEach(member => {
          const li = document.createElement("li");
          li.className = "suggested-item";
          const isLeader = member.id === clan.leader;
          const isMe = member.id === "player" || (activeChar && member.id === activeChar.id);
          const roleTag = isLeader ? "👑 Leader" : "⚔️ Member";
          const fmt = window.formatNumber || (typeof formatNumber === "function" ? formatNumber : (n => n));

          li.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#2ecc71;"></span>
              <div>
                <strong>${member.name}</strong> ${isMe ? "<span style='color:var(--gold);font-size:0.75rem;'>(You)</span>" : ""}
                <div style="color:var(--text-muted);font-size:0.72rem;">${member.class || "Hero"} · Lv.${member.level || 1} (${fmt(member.power)} Pwr) · <span style="color:var(--gold-dim);">${roleTag}</span></div>
              </div>
            </div>
          `;
          membersList.appendChild(li);
        });
      }

    } else {
      noClanView.style.display  = "block";
      hasClanView.style.display = "none";

      const availableList = document.getElementById("available-clans-list");
      if (availableList && typeof window.getAvailableClans === "function") {
        const clans = window.getAvailableClans();
        availableList.innerHTML = "";

        clans.slice(0, 10).forEach(clan => {
          const li = document.createElement("li");
          li.className = "suggested-item";
          const totalPwr = (clan.members || []).reduce((s, m) => s + (m.power || 0), 0);
          const fmt = window.formatNumber || (typeof formatNumber === "function" ? formatNumber : (n => n));

          li.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:1.4rem;">${clan.icon || "⚔️"}</span>
              <div>
                <strong>[${clan.tag}] ${clan.name}</strong>
                <div style="color:var(--text-muted);font-size:0.72rem;">Members: ${clan.members.length}/${clan.maxMembers || 20} · Power: ${fmt(totalPwr)}</div>
              </div>
            </div>
            <button class="btn-action btn-join-clan" data-clan-id="${clan.id}" style="padding:4px 12px;font-size:0.78rem;min-height:28px;">Join</button>
          `;

          const joinBtn = li.querySelector(".btn-join-clan");
          if (joinBtn) {
            joinBtn.addEventListener("click", () => {
              if (typeof window.joinClan === "function") window.joinClan(clan.id);
            });
          }

          availableList.appendChild(li);
        });

        if (clans.length === 0) {
          availableList.innerHTML = `<li style="color:var(--text-muted);font-size:0.82rem;padding:8px;">No available clans found. Create your own!</li>`;
        }
      }
    }
  }
  window.renderClanTab = renderClanTab;

  // ── Input / button ──
  function initSocialControls() {
    const input  = document.getElementById("friend-username-input");
    const addBtn = document.getElementById("add-friend-btn");
    const tbody  = document.getElementById("leaderboard-body");
    const createClanBtn = document.getElementById("create-clan-btn");
    const leaveClanBtn  = document.getElementById("leave-clan-btn");

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

    if (addBtn) {
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

    if (createClanBtn) {
      createClanBtn.addEventListener("click", () => {
        const nameInput  = document.getElementById("clan-name-input");
        const tagInput   = document.getElementById("clan-tag-input");
        const iconSelect = document.getElementById("clan-icon-select");

        const name = nameInput?.value?.trim();
        const tag  = tagInput?.value?.trim();
        const icon = iconSelect?.value || "⚔️";

        if (typeof window.createClan === "function") {
          const created = window.createClan(name, tag, icon);
          if (created) {
            if (nameInput) nameInput.value = "";
            if (tagInput) tagInput.value = "";
          }
        }
      });
    }

    const nameInp = document.getElementById("clan-name-input");
    const tagInp  = document.getElementById("clan-tag-input");
    [nameInp, tagInp].forEach(inp => {
      if (inp) {
        inp.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && createClanBtn) {
            createClanBtn.click();
          }
        });
      }
    });

    if (leaveClanBtn) {
      leaveClanBtn.addEventListener("click", () => {
        if (typeof window.leaveClan === "function") window.leaveClan();
      });
    }

    // Sub-tab switching inside Social Tab
    document.querySelectorAll(".social-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".social-tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".social-sub-tab").forEach(t => t.style.display = "none");

        btn.classList.add("active");
        const targetId = `stab-${btn.dataset.stab}`;
        const targetEl = document.getElementById(targetId);
        if (targetEl) targetEl.style.display = "block";

        if (btn.dataset.stab === "clan") {
          renderClanTab();
        }
      });
    });
  }

  // ── Refresh on player state updates ──
  window.addEventListener("playerStateUpdated", () => {
    renderLeaderboard();
    renderClanTab();
  });

  // ── Auto-refresh UI on main social tab open ──
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.tab === "social-tab") {
        simulateBotActivity();
        renderSuggested();
        renderMyFriends();
        renderLeaderboard();
        renderClanTab();
      }
    });
  });

  // ── Init ──
  function initSocial() {
    loadFriends();
    initSocialControls();
    renderSuggested();
    renderMyFriends();
    renderLeaderboard();
    renderClanTab();

    // Periodic bot simulation
    setInterval(() => {
      simulateBotActivity();
      renderLeaderboard();
    }, 45_000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSocial);
  } else {
    initSocial();
  }

})();
