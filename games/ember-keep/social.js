// Social & Friend System for Hero's Quest

const CLASSES = ["Warrior", "Ranger", "Mage"];
function getRandomClass() {
  return CLASSES[Math.floor(Math.random() * CLASSES.length)];
}

// Seeded pool of mock bots
const SUGGESTED_FRIENDS = [
  { name: "Leeroy", baseLevel: 1, basePower: 12, class: "Warrior" },
  { name: "Jaina", baseLevel: 2, basePower: 22, class: "Mage" },
  { name: "Kael", baseLevel: 3, basePower: 38, class: "Mage" },
  { name: "Sylvanas", baseLevel: 4, basePower: 58, class: "Ranger" },
  { name: "Uther", baseLevel: 5, basePower: 92, class: "Warrior" }
];

let friends = [];

// Initialize social elements on DOM load
document.addEventListener("DOMContentLoaded", () => {
  loadFriends();
  renderSuggestedFriends();
  renderLeaderboard();

  // Listen to player updates to refresh player stats on the leaderboard and simulate friend updates
  window.addEventListener("playerStateUpdated", (event) => {
    const updatedPlayerState = event.detail;
    
    // Simulate active social environment: friends make progress
    simulateFriendProgress();
    
    renderLeaderboard();
  });

  // Controls for custom friend addition
  document.getElementById("add-friend-btn").addEventListener("click", () => {
    const input = document.getElementById("friend-username-input");
    const username = input.value.trim();
    if (username) {
      if (friends.some(f => f.name.toLowerCase() === username.toLowerCase())) {
        showToast("You are already friends with this player!", "error");
      } else {
        addFriend(username, Math.floor(Math.random() * 2) + 1, Math.floor(Math.random() * 15) + 10);
        input.value = "";
      }
    }
  });
});

// Load friends from localStorage or default to empty
function loadFriends() {
  const savedFriends = localStorage.getItem("rpg_social_friends");
  if (savedFriends) {
    try {
      friends = JSON.parse(savedFriends);
      let updated = false;
      friends.forEach(f => {
        if (!f.class) {
          f.class = getRandomClass();
          updated = true;
        }
        if (f.name.includes("🛡️")) {
          f.name = f.name.replace(" 🛡️", "");
          updated = true;
        }
      });
      if (updated) saveFriends();
    } catch (e) {
      console.error("Error parsing friends list", e);
      friends = [];
    }
  } else {
    friends = [
      { name: "Leeroy", level: 1, power: 12, class: "Warrior" }
    ];
    saveFriends();
  }
}

// Save friends to localStorage
function saveFriends() {
  localStorage.setItem("rpg_social_friends", JSON.stringify(friends));
}

// Render the list of suggested friends
function renderSuggestedFriends() {
  const listEl = document.getElementById("suggested-friends-list");
  if (!listEl) return;

  listEl.innerHTML = "";

  SUGGESTED_FRIENDS.forEach(bot => {
    const isAdded = friends.some(f => f.name === bot.name);
    if (isAdded) return;

    const classIcon = typeof CLASS_PRESETS !== 'undefined' ? (CLASS_PRESETS[bot.class]?.avatar || "") : "";

    const li = document.createElement("li");
    li.className = "suggested-item";
    li.innerHTML = `
      <span>${bot.name} ${classIcon} (Lvl ${bot.baseLevel})</span>
      <button data-name="${bot.name}">Add</button>
    `;

    li.querySelector("button").addEventListener("click", () => {
      addFriend(bot.name, bot.baseLevel, bot.basePower, bot.class);
      renderSuggestedFriends();
    });

    listEl.appendChild(li);
  });
}

function addFriend(name, level, power, className = null) {
  const friendClass = className || getRandomClass();
  friends.push({ name, level, power, class: friendClass });
  saveFriends();
  renderLeaderboard();
  showToast(`Added ${name} as a friend!`, "success");
}

// Compute player's total power rating for leaderboard comparison


// Render the dynamic leaderboard
function renderLeaderboard() {
  const tbody = document.getElementById("leaderboard-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  // Get active player state
  const savedState = localStorage.getItem("rpg_player_state");
  let localPlayer = { level: 1, power: 10, name: "Hero (You)", isPlayer: true, class: null };
  if (savedState) {
    try {
      const state = JSON.parse(savedState);
      localPlayer.level = state.unlockedLevel; // Progression rank matches highest unlocked level
      localPlayer.power = getPlayerPowerRating(state);
      localPlayer.class = state.class;
    } catch (e) {}
  }

  // Combine Player and Friends
  const leaderboardEntries = [
    localPlayer,
    ...friends.map(f => ({ level: f.level, power: f.power, name: f.name, class: f.class, isPlayer: false }))
  ];

  // Sort: Level descending, then Power descending
  leaderboardEntries.sort((a, b) => {
    if (b.level !== a.level) {
      return b.level - a.level;
    }
    return b.power - a.power;
  });

  // Render to DOM
  leaderboardEntries.forEach((entry, index) => {
    const tr = document.createElement("tr");
    if (entry.isPlayer) {
      tr.className = "current-player";
    }

    const classIcon = typeof CLASS_PRESETS !== 'undefined' ? (CLASS_PRESETS[entry.class]?.avatar || "") : "";
    const classText = entry.class ? ` (${entry.class})` : "";
    const displayName = `${entry.name} ${classIcon}${classText}`.trim();

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${entry.isPlayer ? "⭐ <strong>" + displayName + "</strong>" : displayName}</td>
      <td>Level ${entry.level}</td>
      <td>${entry.power}</td>
    `;

    tbody.appendChild(tr);
  });
}

// Simulate other friends making progress
function simulateFriendProgress() {
  if (friends.length === 0) return;

  // 50% chance a friend makes progress when the player updates state (e.g. finishes level)
  if (Math.random() < 0.50) {
    const randomIndex = Math.floor(Math.random() * friends.length);
    const friend = friends[randomIndex];

    // Determine type of progress: Level up or Power up
    if (Math.random() < 0.4) {
      friend.level += 1;
      friend.power += Math.floor(Math.random() * 15) + 10;
      showToast(`📢 News: ${friend.name} reached Level ${friend.level}!`, "info");
    } else {
      friend.power += Math.floor(Math.random() * 12) + 5;
      showToast(`📢 News: ${friend.name} upgraded their gear!`, "info");
    }

    saveFriends();
  }
}
