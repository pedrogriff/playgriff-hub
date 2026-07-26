// ================================================================
// EMBER KEEP — Multi-Character UI, Auth Modals & Dashboard (ui.js)
// Native ES Module
// ================================================================

import { AccountStore } from "./account.js";
import { GameAPI } from "./engine.js";
import { signIn, signUp, signOut, getUser } from "./db.js";

export const UIManager = {
  async init() {
    this.renderHeaderUserStatus();
    this.renderCommandCenter();
    this.setupEventListeners();
    await this.checkAuthStatus();
  },

  setupEventListeners() {
    window.addEventListener("ember_account_synced", () => {
      this.renderCommandCenter();
      this.renderHeaderUserStatus();
    });
  },

  /**
   * Check Authentication Session on Startup
   */
  async checkAuthStatus() {
    try {
      const user = await getUser();
      if (!user) {
        this.showAuthModal();
      } else {
        this.hideAuthModal();
        this.renderHeaderUserStatus(user.email);
      }
    } catch (e) {
      console.warn("Auth check failed:", e);
    }
  },

  /**
   * Render Header User Email Badge & Sign Out Button
   */
  async renderHeaderUserStatus(emailParam = null) {
    let email = emailParam;
    if (!email) {
      const user = await getUser().catch(() => null);
      email = user ? user.email : "Guest";
    }

    let badge = document.getElementById("header-user-badge");
    const container = document.getElementById("quick-stats");
    if (!container) return;

    if (!badge) {
      badge = document.createElement("div");
      badge.id = "header-user-badge";
      badge.className = "user-header-pill";
      container.parentNode.insertBefore(badge, container.nextSibling);
    }

    if (email && email !== "Guest") {
      badge.innerHTML = `
        <span class="user-email-label">👤 ${email}</span>
        <button id="btn-sign-out" class="btn-sign-out" title="Sign Out">Sign Out</button>
      `;
      document.getElementById("btn-sign-out").addEventListener("click", async () => {
        await signOut();
        window.location.reload();
      });
    } else {
      badge.innerHTML = `
        <button id="btn-open-login" class="btn-action" style="font-size:0.8rem; padding:4px 10px;">Login / Register</button>
      `;
      document.getElementById("btn-open-login").addEventListener("click", () => {
        this.showAuthModal();
      });
    }
  },

  /**
   * Show Login / Registration Modal
   */
  showAuthModal() {
    let modal = document.getElementById("auth-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "auth-modal";
      modal.className = "modal active";
      document.body.appendChild(modal);
    } else {
      modal.classList.add("active");
    }

    modal.innerHTML = `
      <div class="modal-content auth-modal-content">
        <div class="modal-header">
          <h2>🔥 Welcome to Ember Keep</h2>
        </div>
        <div class="modal-body">
          <div class="auth-tabs">
            <button id="auth-tab-signin" class="auth-tab-btn active">Sign In</button>
            <button id="auth-tab-signup" class="auth-tab-btn">Create Account</button>
          </div>

          <form id="auth-form" class="auth-form" onsubmit="return false;">
            <div class="form-group">
              <label for="auth-email">Email Address</label>
              <input type="email" id="auth-email" placeholder="hero@realm.com" required autocomplete="email">
            </div>
            <div class="form-group">
              <label for="auth-password">Password</label>
              <input type="password" id="auth-password" placeholder="••••••••" required minlength="6" autocomplete="current-password">
            </div>
            <div id="auth-error-msg" class="auth-error-msg" style="display:none;"></div>
            <button type="submit" id="auth-submit-btn" class="btn-action auth-submit-btn">Sign In</button>
          </form>
          <div class="auth-guest-option">
            <button id="btn-continue-guest" class="btn-secondary" style="width:100%; margin-top:12px;">Play as Guest (Local Only)</button>
          </div>
        </div>
      </div>
    `;

    let isSignUpMode = false;
    const tabSignIn = document.getElementById("auth-tab-signin");
    const tabSignUp = document.getElementById("auth-tab-signup");
    const submitBtn = document.getElementById("auth-submit-btn");
    const errorMsg = document.getElementById("auth-error-msg");
    const form = document.getElementById("auth-form");

    tabSignIn.addEventListener("click", () => {
      isSignUpMode = false;
      tabSignIn.classList.add("active");
      tabSignUp.classList.remove("active");
      submitBtn.textContent = "Sign In";
      errorMsg.style.display = "none";
    });

    tabSignUp.addEventListener("click", () => {
      isSignUpMode = true;
      tabSignUp.classList.add("active");
      tabSignIn.classList.remove("active");
      submitBtn.textContent = "Create Account";
      errorMsg.style.display = "none";
    });

    document.getElementById("btn-continue-guest").addEventListener("click", () => {
      this.hideAuthModal();
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("auth-email").value.trim();
      const password = document.getElementById("auth-password").value;

      submitBtn.disabled = true;
      submitBtn.textContent = "Authenticating...";
      errorMsg.style.display = "none";

      try {
        if (isSignUpMode) {
          const data = await signUp(email, password);
          if (data && data.session) {
            // Auto logged-in (email confirmation off)
            await AccountStore.init();
            this.hideAuthModal();
            this.renderHeaderUserStatus(email);
            this.renderCommandCenter();
          } else {
            // Email confirmation required
            isSignUpMode = false;
            tabSignIn.classList.add("active");
            tabSignUp.classList.remove("active");
            submitBtn.textContent = "Sign In";

            errorMsg.className = "auth-info-msg";
            errorMsg.innerHTML = `✨ <strong>Account created!</strong><br>A confirmation email has been sent to <strong>${email}</strong>.<br>Please check your inbox and click the verification link before signing in.`;
            errorMsg.style.display = "block";
          }
        } else {
          await signIn(email, password);
          await AccountStore.init();
          this.hideAuthModal();
          this.renderHeaderUserStatus(email);
          this.renderCommandCenter();

          const offlineReport = await GameAPI.simulateOfflineProgressAll();
          if (offlineReport) {
            this.showOfflineSummaryModal(offlineReport);
          }
          this.renderCommandCenter();
          if (typeof window.renderActiveCharacterUI === "function") {
            window.renderActiveCharacterUI();
          }
        }
      } catch (err) {
        let message = err.message || "Authentication failed.";
        if (message.toLowerCase().includes("email not confirmed")) {
          message = "📧 Email not confirmed. Please check your inbox and click the verification link to activate your account.";
        } else if (message.toLowerCase().includes("invalid login credentials")) {
          message = "🔑 Invalid email or password. Please try again.";
        } else if (message.toLowerCase().includes("user already registered")) {
          message = "⚠️ An account with this email already exists. Please sign in instead.";
        }

        errorMsg.className = "auth-error-msg";
        errorMsg.textContent = message;
        errorMsg.style.display = "block";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isSignUpMode ? "Create Account" : "Sign In";
      }
    });
  },

  hideAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) modal.classList.remove("active");
  },

  /**
   * Character Creation Modal
   */
  showCharacterCreationModal(targetSlotIndex) {
    let modal = document.getElementById("create-char-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "create-char-modal";
      modal.className = "modal active";
      document.body.appendChild(modal);
    } else {
      modal.classList.add("active");
    }

    modal.innerHTML = `
      <div class="modal-content" style="max-width:450px;">
        <div class="modal-header">
          <h2>🧙 Create Character (Slot ${targetSlotIndex})</h2>
          <button class="close-modal-btn" onclick="document.getElementById('create-char-modal').classList.remove('active')">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group" style="margin-bottom:15px;">
            <label style="display:block; margin-bottom:5px; font-weight:600;">Hero Name</label>
            <input type="text" id="new-char-name-input" placeholder="Enter hero name..." maxlength="20" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--bg-primary); color:#fff;">
          </div>
          <label style="display:block; margin-bottom:8px; font-weight:600;">Choose Class</label>
          <div class="class-selection-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px;">
            <button class="class-choice-btn active" data-class="Warrior">🛡️ Warrior</button>
            <button class="class-choice-btn" data-class="Ranger">🏹 Ranger</button>
            <button class="class-choice-btn" data-class="Mage">🔮 Mage</button>
            <button class="class-choice-btn" data-class="Paladin">⚜️ Paladin</button>
          </div>
        </div>
        <div class="modal-footer">
          <button id="confirm-create-char-btn" class="btn-action" style="width:100%;">Create Hero</button>
        </div>
      </div>
    `;

    let selectedClass = "Warrior";
    const classBtns = modal.querySelectorAll(".class-choice-btn");
    classBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        classBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedClass = btn.getAttribute("data-class");
      });
    });

    document.getElementById("confirm-create-char-btn").addEventListener("click", async () => {
      const nameInput = document.getElementById("new-char-name-input").value.trim() || `Hero ${targetSlotIndex}`;
      await AccountStore.createCharacter(targetSlotIndex, nameInput, selectedClass);
      modal.classList.remove("active");
      this.renderCommandCenter();
      if (window.renderActiveCharacterUI) window.renderActiveCharacterUI();
    });
  },

  /**
   * Show Custom In-Game Delete Confirmation Modal (Bypasses Sandboxed Window.confirm Restrictions)
   */
  showDeleteConfirmationModal(slotId, charName, level) {
    let modal = document.getElementById("delete-character-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "delete-character-modal";
      modal.className = "modal";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-content panel" style="max-width:400px; border:2px solid #ef4444;">
        <div class="modal-header">
          <h3 style="color:#ef4444; margin:0;">⚠️ Delete Hero</h3>
          <button class="modal-close-btn" onclick="document.getElementById('delete-character-modal').classList.remove('active')">✕</button>
        </div>
        <div class="modal-body" style="padding:15px; text-align:center;">
          <p style="font-size:0.95rem; color:#fff;">Are you sure you want to <strong>DELETE</strong> Level ${level} <strong>${charName}</strong>?</p>
          <p style="font-size:0.8rem; color:#ef4444; margin-top:8px;">This will permanently remove this hero and all their equipment from Slot ${slotId}. This action cannot be undone!</p>
          
          <div style="display:flex; gap:10px; margin-top:18px;">
            <button id="cancel-delete-char-btn" class="btn-action" style="flex:1; padding:8px; background:var(--bg-elevated); cursor:pointer;">Cancel</button>
            <button id="confirm-delete-char-btn" class="btn-action" style="flex:1; padding:8px; background:#ef4444; color:#fff; font-weight:bold; cursor:pointer;">Delete Hero</button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add("active");

    document.getElementById("cancel-delete-char-btn").onclick = () => {
      modal.classList.remove("active");
    };

    document.getElementById("confirm-delete-char-btn").onclick = async () => {
      modal.classList.remove("active");
      await AccountStore.deleteCharacter(slotId);
      if (typeof showToast === "function") showToast(`Hero "${charName}" deleted`, "info");
      this.renderCommandCenter();
      if (window.renderActiveCharacterUI) window.renderActiveCharacterUI();
    };
  },

  /**
   * Render Multi-Character Command Center Dashboard Mini-Bar
   */
  renderCommandCenter() {
    const container = document.getElementById("command-center-dashboard");
    if (!container) return;

    const account = AccountStore.getAccount();
    if (!account) return;

    let html = `
      <div class="command-center-bar">
        <div class="command-center-title">
          <span>🔥 Command Center</span>
        </div>
        <div class="command-center-slots">
    `;

    [1, 2, 3, 4, 5].forEach(slotId => {
      const char = account.characterSlots ? account.characterSlots[slotId] : null;
      const activeTask = account.activeTasks ? account.activeTasks[slotId] : null;
      const isActiveSlot = account.activeSlotId === slotId;
      const isSeasonalSlot = slotId === 5;
      const slotTitle = isSeasonalSlot ? `Slot 5 (Echo)` : `Slot ${slotId}`;

      if (char) {
        let taskIcon = activeTask?.icon;
        if (!taskIcon || taskIcon === "undefined") {
          const tType = (activeTask?.type || "").toLowerCase();
          if (tType === "mining") taskIcon = "⛏️";
          else if (tType === "woodcutting") taskIcon = "🪓";
          else if (tType === "fishing") taskIcon = "🎣";
          else if (tType === "combat") taskIcon = "⚔️";
          else taskIcon = "⚡";
        }

        let taskName = activeTask?.targetName || activeTask?.targetId || "Active Task";
        if (typeof taskName === "string" && taskName.startsWith("level_")) {
          taskName = `Dungeon Level ${taskName.replace("level_", "")}`;
        } else if (typeof taskName === "string") {
          taskName = taskName.replace(/_/g, " ");
        }

        const taskStatusText = activeTask ? `${taskIcon} ${taskName}` : "Idle";
        const statusClass = activeTask ? "status-active" : "status-idle";
        const taskBtnText = activeTask ? "🛑 Stop" : "⚡ Task";
        const taskBtnClass = activeTask ? "btn-stop-task" : "btn-start-task";

        html += `
          <div class="slot-card ${isActiveSlot ? 'slot-current' : ''} ${isSeasonalSlot ? 'slot-seasonal' : ''}" data-slot="${slotId}">
            <div class="slot-header" style="display:flex; justify-content:space-between; align-items:center;">
              <span class="slot-number" style="font-size:0.75rem; color:var(--text-muted);">${slotTitle}</span>
              <button class="btn-slot-delete" data-slot="${slotId}" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:0.8rem; padding:0 2px;" title="Delete Character">🗑️</button>
            </div>
            <div class="slot-name" style="font-weight:bold; font-size:0.85rem;">${char.name} (Lv.${char.level})</div>
            <div class="slot-task ${statusClass}" style="font-size:0.75rem;">
              ${taskStatusText}
            </div>
            <div class="slot-actions-group" style="display:flex; gap:4px; margin-top:4px;">
              <button class="btn-slot-action ${taskBtnClass}" data-slot="${slotId}" style="padding:2px 6px; font-size:0.75rem;">
                ${taskBtnText}
              </button>
              <button class="btn-slot-switch" data-slot="${slotId}" ${isActiveSlot ? 'disabled' : ''} style="padding:2px 6px; font-size:0.75rem;">
                ${isActiveSlot ? 'Active' : 'Switch'}
              </button>
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="slot-card slot-empty ${isSeasonalSlot ? 'slot-seasonal' : ''}" data-slot="${slotId}">
            <span class="slot-number" style="font-size:0.75rem; color:var(--text-muted);">${slotTitle}</span>
            <span class="slot-empty-text" style="font-size:0.8rem; display:block; margin:2px 0;">Empty</span>
            <button class="btn-create-char" data-slot="${slotId}" style="padding:2px 8px; font-size:0.75rem; background:var(--gold); border:none; border-radius:4px; font-weight:bold; cursor:pointer;">+ Create</button>
          </div>
        `;
      }
    });

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attach click listeners
    container.querySelectorAll(".btn-slot-switch").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const slot = parseInt(e.target.getAttribute("data-slot"), 10);
        AccountStore.setActiveSlot(slot);
        this.renderCommandCenter();
        if (window.renderActiveCharacterUI) window.renderActiveCharacterUI();
      });
    });

    container.querySelectorAll(".btn-slot-delete").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const slot = parseInt(e.target.getAttribute("data-slot"), 10);
        const char = account.characterSlots ? account.characterSlots[slot] : null;
        if (!char) return;
        this.showDeleteConfirmationModal(slot, char.name, char.level);
      });
    });

    container.querySelectorAll(".btn-slot-action").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const slot = parseInt(e.target.getAttribute("data-slot"), 10);
        const task = account.activeTasks ? account.activeTasks[slot] : null;
        if (task) {
          await GameAPI.stopTask(slot);
          this.renderCommandCenter();
          if (window.renderActiveCharacterUI) window.renderActiveCharacterUI();
        } else {
          this.showIdleTaskPickerModal(slot);
        }
      });
    });

    container.querySelectorAll(".btn-create-char").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const slot = parseInt(e.target.getAttribute("data-slot"), 10);
        this.showCharacterCreationModal(slot);
      });
    });
  },

  /**
   * Idle Task Selection Modal
   */
  showIdleTaskPickerModal(slotId) {
    const char = AccountStore.getCharacter(slotId);
    if (!char) return;

    let modal = document.getElementById("idle-task-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "idle-task-modal";
      modal.className = "modal active";
      document.body.appendChild(modal);
    } else {
      modal.classList.add("active");
    }

    const availableTasks = [
      { type: "mining", targetId: "coal_vein", name: "Coal Vein", icon: "⛏️", reqLvl: 1, cycleMs: 4000, category: "Mining" },
      { type: "mining", targetId: "iron_deposit", name: "Iron Deposit", icon: "⛏️", reqLvl: 5, cycleMs: 4000, category: "Mining" },
      { type: "woodcutting", targetId: "oak_forest", name: "Oak Forest", icon: "🪓", reqLvl: 1, cycleMs: 4000, category: "Woodcutting" },
      { type: "woodcutting", targetId: "willow_grove", name: "Willow Grove", icon: "🪓", reqLvl: 5, cycleMs: 4000, category: "Woodcutting" },
      { type: "fishing", targetId: "greenhollow_river", name: "River Fishing", icon: "🎣", reqLvl: 1, cycleMs: 4000, category: "Fishing" },
      { type: "combat", targetId: "mossy_grotto", name: "Mossy Grotto Mobs", icon: "⚔️", reqLvl: 1, cycleMs: 4000, category: "Combat" },
      { type: "combat", targetId: "goblin_warren", name: "Goblin Warren Mobs", icon: "⚔️", reqLvl: 3, cycleMs: 4000, category: "Combat" },
    ];

    let taskGridHTML = "";
    availableTasks.forEach(t => {
      const isLocked = char.level < t.reqLvl;
      taskGridHTML += `
        <div class="task-choice-card ${isLocked ? 'locked' : ''}">
          <div class="task-choice-header">
            <span class="task-icon">${t.icon}</span>
            <div class="task-details">
              <strong>${t.name}</strong>
              <span class="task-category">${t.category} · Lv.${t.reqLvl}+</span>
            </div>
          </div>
          <button class="btn-action btn-select-task" data-type="${t.type}" data-target="${t.targetId}" data-name="${t.name}" data-icon="${t.icon}" ${isLocked ? 'disabled' : ''}>
            ${isLocked ? '🔒 Locked' : '▶️ Start Action'}
          </button>
        </div>
      `;
    });

    modal.innerHTML = `
      <div class="modal-content" style="max-width:520px;">
        <div class="modal-header">
          <h2>⚡ Idle Tasks for Slot ${slotId}: ${char.name}</h2>
          <button class="close-modal-btn" onclick="document.getElementById('idle-task-modal').classList.remove('active')">×</button>
        </div>
        <div class="modal-body">
          <p class="offline-subtitle">Select an automated idle action. Progress will calculate authoritative offline time on DB server.</p>
          <div class="task-choice-grid" style="display:flex; flex-direction:column; gap:10px;">
            ${taskGridHTML}
          </div>
        </div>
      </div>
    `;

    modal.querySelectorAll(".btn-select-task").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const type = btn.getAttribute("data-type");
        const targetId = btn.getAttribute("data-target");
        const targetName = btn.getAttribute("data-name");
        const icon = btn.getAttribute("data-icon");

        const taskSpec = {
          type,
          targetId,
          targetName,
          icon,
          cycleMs: 4000,
          totalStack: Infinity
        };

        await GameAPI.startTask(slotId, taskSpec);
        modal.classList.remove("active");
        this.renderCommandCenter();
        if (window.renderActiveCharacterUI) window.renderActiveCharacterUI();
      });
    });
  },

  /**
   * Render Aggregated Offline Progression Report Modal
   */
  showOfflineSummaryModal(aggregatedReport) {
    if (!aggregatedReport || !aggregatedReport.reports || aggregatedReport.reports.length === 0) return;

    let modal = document.getElementById("offline-summary-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "offline-summary-modal";
      modal.className = "modal active";
      document.body.appendChild(modal);
    } else {
      modal.classList.add("active");
    }

    const formatDuration = (ms) => {
      const totalSecs = Math.floor(ms / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
      if (mins > 0) return `${mins}m ${secs}s`;
      return `${secs}s`;
    };

    let reportsHTML = "";
    aggregatedReport.reports.forEach(r => {
      const durationStr = formatDuration(r.elapsedMs || 0);
      let statusWarning = "";
      if (r.elapsedMs >= 24 * 3600 * 1000) {
        statusWarning += `<p class="status-alert warning">⏰ 24-Hour Max Idle Limit Reached (Daily Check-in Required)</p>`;
      }
      if (r.inventoryFullPaused) {
        statusWarning += `<p class="status-alert warning">⚠️ Task paused: Inventory reached maximum capacity (${r.cyclesProcessed} cycles completed)!</p>`;
      }
      if (r.foodExhausted) {
        statusWarning += `<p class="status-alert danger">🚨 Combat stopped: Food exhausted! 100% rewards kept, auto-teleported to town.</p>`;
      }

      let lootListHTML = "";
      if (r.lootItems && r.lootItems.length > 0) {
        lootListHTML = `<div class="loot-grid">` + r.lootItems.map(l => `<span class="loot-chip">${l.icon} ${l.name} x${l.qty}</span>`).join('') + `</div>`;
      }

      const levelBadge = r.newLevel ? `<span class="level-up-badge">🎉 Reached Level ${r.newLevel}!</span>` : '';
      const taskNameStr = r.activeTaskSpec ? ` (${r.activeTaskSpec.name || r.activeTaskSpec.type})` : '';

      reportsHTML += `
        <div class="offline-char-card">
          <div class="offline-char-header">
            <h4>🛡️ Character Slot ${r.slotId}: ${r.charName}${taskNameStr}</h4>
            ${levelBadge}
          </div>
          <div class="offline-stats-grid">
            <div class="offline-stat"><span class="stat-icon">⏳</span> <span>Duration:</span> <strong>${durationStr}</strong> (${r.cyclesProcessed} cycles)</div>
            <div class="offline-stat"><span class="stat-icon">⭐</span> <span>EXP Gained:</span> <strong>+${r.expGained} XP</strong></div>
            <div class="offline-stat"><span class="stat-icon">💰</span> <span>Gold Earned:</span> <strong>+${r.goldGained}g</strong></div>
          </div>
          ${lootListHTML}
          ${statusWarning}
        </div>
      `;
    });

    modal.innerHTML = `
      <div class="modal-content offline-modal-content">
        <div class="modal-header">
          <h2>📜 Aggregated Offline Progression Summary</h2>
        </div>
        <div class="modal-body">
          <p class="offline-subtitle">Welcome back! Server time verified your idle progress (24h max limit per daily session):</p>
          <div class="offline-reports-list">
            ${reportsHTML}
          </div>
        </div>
        <div class="modal-footer" style="display:flex;gap:12px;">
          <button id="continue-offline-modal-btn" class="btn-action" style="flex:1;">▶️ Claim & Continue Task(s)</button>
          <button id="close-offline-modal-btn" class="btn-secondary" style="flex:1;">🛑 Claim & Complete Task(s)</button>
        </div>
      </div>
    `;

    document.getElementById("continue-offline-modal-btn").addEventListener("click", async () => {
      modal.classList.remove("active");
      if (typeof window.GameAPI !== "undefined" && typeof window.GameAPI.continueTasksFromReport === "function") {
        await window.GameAPI.continueTasksFromReport(aggregatedReport.reports);
      }
      this.renderCommandCenter();
      if (typeof window.renderActiveCharacterUI === "function") {
        window.renderActiveCharacterUI();
      }
      if (typeof showToast === "function") {
        showToast("▶️ Rewards claimed & tasks continued for a new 24h cycle!", "success");
      }
    });

    document.getElementById("close-offline-modal-btn").addEventListener("click", async () => {
      modal.classList.remove("active");

      const account = AccountStore.getAccount();
      if (account) {
        const slotsToStop = (aggregatedReport && aggregatedReport.reports)
          ? aggregatedReport.reports.map(r => r.slotId)
          : [1, 2, 3, 4, 5];

        for (const slotId of slotsToStop) {
          if (account.activeTasks && account.activeTasks[slotId]) {
            if (typeof GameAPI !== "undefined" && typeof GameAPI.stopTask === "function") {
              await GameAPI.stopTask(slotId);
            } else {
              account.activeTasks[slotId] = null;
            }
          }
        }
        AccountStore.save();
      }

      this.renderCommandCenter();
      if (typeof window.renderActiveCharacterUI === "function") {
        window.renderActiveCharacterUI();
      }

      if (typeof showToast === "function") {
        showToast("✨ Rewards claimed & task completed.", "info");
      }
    });
  }
};

