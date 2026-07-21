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
          <span class="ap-badge" title="Ascension Points">✨ ${account.ascensionPoints || 0}/${account.maxAp || 10} AP</span>
        </div>
        <div class="command-center-slots">
    `;

    [1, 2, 3, 4, 5].forEach(slotId => {
      const char = account.characterSlots ? account.characterSlots[slotId] : null;
      const activeTask = account.activeTasks ? account.activeTasks[slotId] : null;
      const isActiveSlot = account.activeSlotId === slotId;
      const isUnlockedSlot = slotId <= 3; // Slots 1-3 active parallel, 4-5 extra unlockable

      if (char) {
        const taskStatusText = activeTask ? `${activeTask.icon} ${activeTask.targetName}` : "Idle";
        const statusClass = activeTask ? "status-active" : "status-idle";

        html += `
          <div class="slot-card ${isActiveSlot ? 'slot-current' : ''}" data-slot="${slotId}">
            <div class="slot-header">
              <span class="slot-number">Slot ${slotId}</span>
              <span class="slot-name">${char.name} (Lv.${char.level})</span>
            </div>
            <div class="slot-task ${statusClass}">
              ${taskStatusText}
            </div>
            <button class="btn-slot-switch" data-slot="${slotId}" ${isActiveSlot ? 'disabled' : ''}>
              ${isActiveSlot ? 'Active' : 'Switch'}
            </button>
          </div>
        `;
      } else if (isUnlockedSlot) {
        html += `
          <div class="slot-card slot-empty" data-slot="${slotId}">
            <span class="slot-number">Slot ${slotId}</span>
            <span class="slot-empty-text">Empty Slot</span>
            <button class="btn-create-char" data-slot="${slotId}">+ Create</button>
          </div>
        `;
      } else {
        html += `
          <div class="slot-card slot-locked" data-slot="${slotId}" style="opacity:0.6;">
            <span class="slot-number">Slot ${slotId}</span>
            <span class="slot-empty-text">🔒 Locked Slot</span>
            <button class="btn-create-char" data-slot="${slotId}">Unlock</button>
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

    container.querySelectorAll(".btn-create-char").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const slot = parseInt(e.target.getAttribute("data-slot"), 10);
        this.showCharacterCreationModal(slot);
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

    let reportsHTML = "";
    aggregatedReport.reports.forEach(r => {
      const minutes = Math.floor(r.elapsedMs / 60000);
      let statusWarning = "";
      if (r.inventoryFullPaused) {
        statusWarning = `<p class="status-alert warning">⚠️ Task paused: Inventory reached maximum capacity (${r.cyclesProcessed} cycles completed)!</p>`;
      }
      if (r.foodExhausted) {
        statusWarning = `<p class="status-alert danger">🚨 Combat stopped: Food exhausted! 100% rewards kept, auto-teleported to town.</p>`;
      }

      let lootListHTML = "";
      if (r.lootItems && r.lootItems.length > 0) {
        lootListHTML = `<div class="loot-grid">` + r.lootItems.map(l => `<span class="loot-chip">${l.icon} ${l.name} x${l.qty}</span>`).join('') + `</div>`;
      }

      reportsHTML += `
        <div class="offline-char-card">
          <h4>🛡️ Character Slot ${r.slotId}: ${r.charName}</h4>
          <p>⏳ Duration: <strong>${minutes} mins</strong> (${r.cyclesProcessed} cycles completed)</p>
          <p>⭐ EXP Gained: <strong>+${r.expGained} XP</strong> ${r.newLevel ? `(Reached Level ${r.newLevel}!)` : ''}</p>
          <p>💰 Gold Earned: <strong>+${r.goldGained}g</strong></p>
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
          <p class="offline-subtitle">Welcome back! While you were away, your active characters achieved the following progress:</p>
          <div class="offline-reports-list">
            ${reportsHTML}
          </div>
        </div>
        <div class="modal-footer">
          <button id="close-offline-modal-btn" class="btn-action">Claim All Rewards</button>
        </div>
      </div>
    `;

    document.getElementById("close-offline-modal-btn").addEventListener("click", () => {
      modal.classList.remove("active");
    });
  }
};
