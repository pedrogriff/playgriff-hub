// ================================================================
// EMBER KEEP — Multi-Character UI & Dashboard Component (ui.js)
// Native ES Module
// ================================================================

import { AccountStore } from "./account.js";
import { GameAPI } from "./engine.js";

export const UIManager = {
  init() {
    this.renderCommandCenter();
    this.setupEventListeners();
  },

  setupEventListeners() {
    window.addEventListener("ember_account_synced", () => {
      this.renderCommandCenter();
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

    [1, 2, 3].forEach(slotId => {
      const char = account.characterSlots[slotId];
      const activeTask = account.activeTasks ? account.activeTasks[slotId] : null;
      const isActiveSlot = account.activeSlotId === slotId;

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
      } else {
        html += `
          <div class="slot-card slot-empty" data-slot="${slotId}">
            <span class="slot-number">Slot ${slotId}</span>
            <span class="slot-empty-text">Empty Slot</span>
            <button class="btn-create-char" data-slot="${slotId}">+ Create</button>
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
