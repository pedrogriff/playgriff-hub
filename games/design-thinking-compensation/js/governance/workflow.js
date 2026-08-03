// js/governance/workflow.js - Zero-Build ES Module
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';

export class GovernanceSLAWorkflow {
  constructor() {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose', // Required to attach DOM click handlers to SVG nodes
      flowchart: { useMaxWidth: true, htmlLabels: true }
    });
  }

  async renderSwimlane(containerId, activeAward = null) {
    const award = activeAward || { status: 'Pending Division Lead Approval', created_at: new Date().toISOString() };

    const diagramDef = `
      %%{init: {'flowchart': {'curve': 'stepAfter'}, 'theme': 'dark'}}%%
      graph TD
        subgraph HR ["HR Partner Swimlane (SLA: 24h)"]
          A["1. Risk Intake & Cliff Modeling"] --> B["2. Draft Equity Award"]
        end
        
        subgraph DIV ["Division Lead Governance Swimlane (SLA: 48h)"]
          B --> C{"3. Budget & Percentile Check"}
          C -->|Within P75 / Budget| D["4. Standard SLA Approval"]
          C -->|Exceeds P75 or 24m Exception| E["5. Flag for Exec Exception"]
        end
        
        subgraph EXEC ["Executive Sponsor Swimlane (SLA: 72h)"]
          E --> F["6. Executive Review & Override"]
        end
        
        subgraph SYS ["Automated SLA Monitor & Comp DB"]
          D --> G["7. Lock Vesting & Commit Grant"]
          F --> G
        end

        classDef slaNode fill:#1e2434,stroke:#ff7b00,stroke-width:2px,color:#fff;
        classDef activeStage fill:#eab308,stroke:#facc15,stroke-width:3px,color:#000,font-weight:bold;
        class A,B,C,D,E,F,G slaNode;
        ${award.status === 'Draft' ? 'class A,B activeStage;' : ''}
        ${award.status === 'Pending Division Lead Approval' ? 'class C activeStage;' : ''}
        ${award.status === 'Pending Exec Exception' ? 'class E,F activeStage;' : ''}
        ${award.status === 'Approved' ? 'class G activeStage;' : ''}
    `;

    const container = document.getElementById(containerId);
    if (!container) return;

    const { svg } = await mermaid.render('swimlane-svg', diagramDef);
    container.innerHTML = svg;

    this.attachSlaNodeListeners(container, award);
  }

  attachSlaNodeListeners(container, award) {
    const stageDetails = {
      'C': { title: '3. Budget & Percentile Check', owner: 'Division Lead (Cloud Infrastructure)', slaHours: 48 },
      'E': { title: '5. Flag for Exec Exception', owner: 'Executive Sponsor', slaHours: 72 },
      'G': { title: '7. Lock Vesting & Commit Grant', owner: 'Supabase Automated Edge Function', slaHours: 0 }
    };

    container.querySelectorAll('.node').forEach(node => {
      node.style.cursor = 'pointer';
      node.addEventListener('click', () => {
        const nodeText = node.textContent.trim();
        let matchedKey = 'C';
        if (nodeText.startsWith('1.') || nodeText.startsWith('2.')) matchedKey = 'A';
        else if (nodeText.startsWith('3.')) matchedKey = 'C';
        else if (nodeText.startsWith('5.')) matchedKey = 'E';
        else if (nodeText.startsWith('7.')) matchedKey = 'G';

        const info = stageDetails[matchedKey] || { title: nodeText, owner: 'HR Business Partner', slaHours: 24 };

        const createdTime = new Date(award.created_at || Date.now()).getTime();
        const deadlineTime = createdTime + (info.slaHours * 3600 * 1000);
        const hoursRemaining = Math.max(0, ((deadlineTime - Date.now()) / (3600 * 1000)).toFixed(1));

        this.showSlaDetailModal(info.title, info.owner, hoursRemaining, info.slaHours);
      });
    });
  }

  showSlaDetailModal(title, owner, remaining, totalSla) {
    let modal = document.getElementById('sla-glass-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sla-glass-modal';
      modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.75); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(6px);';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="glass-card" style="max-width:500px; width:90%; position:relative; border:1px solid rgba(255,123,0,0.4); box-shadow: 0 0 30px rgba(255,123,0,0.2);">
        <h3 style="font-family:'Cinzel', serif; color:#ff7b00; margin-top:0;">Governance SLA Inspection</h3>
        <h4 style="color:#e2e8f0; margin-bottom:8px;">${title}</h4>
        <p style="color:#94a3b8; font-size:0.95rem; line-height:1.6;">
          <strong>Stage Owner:</strong> ${owner}<br>
          <strong>SLA Countdown Timer:</strong> <span style="color:#eab308; font-family:monospace; font-weight:bold;">${remaining}h remaining</span> (of ${totalSla}h SLA)<br>
          <strong>Automated Escalation:</strong> If unresolved when timer expires, Supabase Edge Function triggers webhook alert to Department Head.
        </p>
        <div style="text-align:right; margin-top:20px;">
          <button id="close-sla-modal" style="background:#ff7b00; color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-family:'Inter', sans-serif; font-weight:600;">Close Drawer</button>
        </div>
      </div>
    `;

    document.getElementById('close-sla-modal').addEventListener('click', () => modal.remove());
  }
}
