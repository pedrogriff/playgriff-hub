// games/design-thinking-compensation/app-bundle.js - Standalone Zero-Failure Application Bundle

(function() {
  'use strict';

  // Demo Profile State
  const profile = {
    id: "EMP-001",
    name: "Alex Mercer",
    employeeHandle: "a.mercer@emberkeep.io",
    role: "Principal Distributed Systems Engineer",
    level: "L6",
    divisionLead: "Cloud Infrastructure",
    talentDesignation: "Strategic Key Talent - P0",
    peerPercentile: "42nd",
    currentCycleTDR: 350000,
    previousCycleTDR: 330000,
    lastRatings: ["Exceptional Impact", "Exceeds Expectations"],
    hasPriorOffCycleAward: false,
    intendedCashFlows: {
      salary: [180000, 180000, 180000, 180000],
      bonus:  [50000,  50000,  50000,  50000],
      equity: [100000, 120000, 50000,  60000], // $70k cash-flow equity cliff in Year 2
      year0Total: 330000,
      year1Total: 350000,
      year2Total: 280000,
      year3Total: 290000
    },
    benchmarks: { "50th": 370000, "75th": 420000, "90th": 480000 }
  };

  let activeAward = null;
  let chartInstance = null;

  // 1. Retention Math & Policy Logic
  function analyzeRetention(prof) {
    const { lastRatings = [], talentDesignation = '', intendedCashFlows = {}, currentCycleTDR = 0, previousCycleTDR = 0 } = prof;

    const isExceptional = lastRatings.some(r => ["Exceptional Impact", "Exceeds Expectations"].includes(r)) ||
                          ["Strategic Key Talent - P0", "Core Tech - Tier 1", "Critical Skill - P0"].includes(talentDesignation);
    const numericPercentile = parseFloat(String(prof.peerPercentile).replace(/[^0-9.-]+/g, '')) || 0.0;
    const diffPercent = previousCycleTDR > 0 ? ((currentCycleTDR / previousCycleTDR) - 1) * 100 : 0.0;

    const year1Total = intendedCashFlows.year1Total || 350000;
    const year2Total = intendedCashFlows.year2Total || 280000;
    const isFacingCliff = year1Total > 0 && year2Total < (year1Total * 0.9);

    let riskLevel = "High";
    let recommendation = "Immediate Off-Cycle Equity Refresh (Target 75th Percentile)";
    let justification = `Top-tier talent currently compensated significantly below peers (${numericPercentile}th percentile). High flight risk due to market demand for ${prof.role}s at ${prof.level}.`;

    if (isFacingCliff) {
      justification += ` Employee is facing a cash-flow cliff ($${(year1Total - year2Total).toLocaleString()} drop in Y2).`;
    }

    const exitStats = {
      totalExits: 28,
      topDestinations: [
        { company: "Competitor Alpha", count: 12 },
        { company: "AI Startup Beta", count: 8 },
        { company: "Tech Giant Gamma", count: 5 },
        { company: "Hardware Tech Delta", count: 3 }
      ]
    };

    return {
      riskLevel,
      recommendation,
      justification,
      isFacingCliff,
      compensationGap: `Current cycle TDR ($${(currentCycleTDR/1000).toFixed(0)}k) is ${diffPercent >= 0 ? 'up' : 'down'} ${Math.abs(diffPercent).toFixed(1)}% vs prior year.`,
      exitStats
    };
  }

  // 2. Chart Renderer (Salary + Bonus + Equity Stacked Bars)
  function renderChart(grantAmount) {
    const canvasEl = document.getElementById('retention-bar-chart');
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');

    const cf = profile.intendedCashFlows;
    const salaryData = cf.salary;
    const bonusData  = cf.bonus;
    const equityData = cf.equity;

    const annualGrantImpact = grantAmount / 2; // 2-year refresh impact per year

    const chartData = {
      labels: ['Prior Year', 'Current Year (Y1)', 'Year + 1 (Y2)', 'Year + 2 (Y3)'],
      datasets: [
        {
          label: 'Base Salary',
          data: salaryData,
          backgroundColor: 'rgba(56, 189, 248, 0.75)', // Cyan
          borderColor: '#38bdf8',
          borderWidth: 1,
          stack: 'total'
        },
        {
          label: 'Annual Bonus',
          data: bonusData,
          backgroundColor: 'rgba(168, 85, 247, 0.75)', // Purple
          borderColor: '#a855f7',
          borderWidth: 1,
          stack: 'total'
        },
        {
          label: 'Vesting Equity',
          data: equityData,
          backgroundColor: 'rgba(239, 68, 68, 0.75)', // Red/Amber
          borderColor: '#ef4444',
          borderWidth: 1,
          stack: 'total'
        },
        {
          label: 'Proposed Refresh Award',
          data: [0, annualGrantImpact, annualGrantImpact, 0],
          backgroundColor: 'rgba(234, 179, 8, 0.9)', // Glowing Gold
          borderColor: '#facc15',
          borderWidth: 2,
          stack: 'total'
        }
      ]
    };

    if (window.Chart) {
      if (chartInstance) {
        chartInstance.data = chartData;
        chartInstance.update();
      } else {
        chartInstance = new window.Chart(ctx, {
          type: 'bar',
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                labels: { color: '#e2e8f0', font: { family: 'Inter', size: 12 } }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.dataset.label}: $${context.raw.toLocaleString()}`;
                  }
                }
              }
            },
            scales: {
              x: { stacked: true, ticks: { color: '#e2e8f0', font: { family: 'Inter' } }, grid: { color: 'rgba(255,255,255,0.05)' } },
              y: { stacked: true, max: 550000, ticks: { color: '#e2e8f0', font: { family: 'Inter' }, callback: val => `$${val/1000}k` }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
      }
    }

    // Update Cliff Visualizer Banner
    const cliffEl = document.getElementById('cliff-visualizer-banner');
    if (cliffEl) {
      const baseYear1 = cf.year1Total;
      const baseYear2 = cf.year2Total;
      const dropPercent = (((baseYear1 - baseYear2) / baseYear1) * 100).toFixed(1);
      cliffEl.innerHTML = `
        <div class="glass-card cliff-warning-pulse" style="display:flex; align-items:center; gap:16px; margin-bottom:24px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <strong style="color:#ef4444; font-family:'Cinzel', serif; font-size:1.05rem;">ATTENTION: CASH-FLOW CLIFF DETECTED</strong>
            <p style="margin:4px 0 0 0; font-size:0.92rem; color:#e2e8f0;">Projected Y2 cash flow drops by <strong>${dropPercent}%</strong> ($${(baseYear1 - baseYear2).toLocaleString()}) due to equity vesting expiration. Immediate refresh evaluation required.</p>
          </div>
        </div>
      `;
    }

    // Update Policy Recommendation & Exit Telemetry
    const analysis = analyzeRetention(profile);
    const recEl = document.getElementById('policy-recommendation');
    const justEl = document.getElementById('policy-justification');
    const exitEl = document.getElementById('exit-telemetry');

    if (recEl) recEl.innerHTML = `<strong>${analysis.recommendation}</strong> (Risk Level: <span style="color:#ef4444; font-weight:700;">${analysis.riskLevel}</span>)`;
    if (justEl) justEl.innerText = analysis.justification;

    if (exitEl) {
      exitEl.innerHTML = `
        <p style="margin:0 0 8px 0;">Total Exits (60-day window): <strong>${analysis.exitStats.totalExits}</strong></p>
        <ul style="margin:0; padding-left:20px; line-height:1.6;">
          ${analysis.exitStats.topDestinations.map(d => `<li><strong>${d.company}</strong>: ${d.count} exits</li>`).join('')}
        </ul>
      `;
    }
  }

  // 3. Mermaid Governance SLA Swimlane Renderer
  async function renderSwimlane() {
    const container = document.getElementById('retention-sla-svg');
    if (!container) return;

    const awardStatus = activeAward ? activeAward.status : 'Pending Division Lead Approval';

    const diagramDef = `
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
        ${awardStatus === 'Draft' ? 'class A,B activeStage;' : ''}
        ${awardStatus === 'Pending Division Lead Approval' ? 'class C activeStage;' : ''}
        ${awardStatus === 'Pending Exec Exception' ? 'class E,F activeStage;' : ''}
        ${awardStatus === 'Approved' ? 'class G activeStage;' : ''}
    `;

    if (window.mermaid) {
      try {
        window.mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
        const { svg } = await window.mermaid.render('swimlane-svg-id', diagramDef);
        container.innerHTML = svg;
      } catch (err) {
        console.warn('Mermaid rendering fallback:', err);
        container.innerHTML = getFallbackSvg();
      }
    } else {
      container.innerHTML = getFallbackSvg();
    }

    attachNodeClickListeners(container);
  }

  function getFallbackSvg() {
    return `
      <div style="width:100%; text-align:center; padding:20px;">
        <div style="display:flex; justify-content:center; gap:20px; flex-wrap:wrap;">
          <div class="glass-card" style="border-color:#ff7b00; cursor:pointer;" onclick="window.showSlaModal('Risk Intake & Cliff Modeling', 'HR Partner', 18, 24)">
            <h4 style="color:#ff7b00; margin:0;">1. HR Intake (SLA: 24h)</h4>
            <p style="margin:4px 0 0 0; font-size:0.85rem; color:#cbd5e1;">Risk assessment complete</p>
          </div>
          <div class="glass-card" style="border-color:#eab308; background:rgba(234,179,8,0.15); cursor:pointer;" onclick="window.showSlaModal('Budget & Percentile Check', 'Division Lead (Cloud Infrastructure)', 42.5, 48)">
            <h4 style="color:#facc15; margin:0;">2. Division Lead Approval (SLA: 48h)</h4>
            <p style="margin:4px 0 0 0; font-size:0.85rem; color:#fff; font-weight:600;">⚡ ACTIVE STAGE</p>
          </div>
          <div class="glass-card" style="border-color:#38bdf8; cursor:pointer;" onclick="window.showSlaModal('Executive Review & Override', 'Executive Sponsor', 72, 72)">
            <h4 style="color:#38bdf8; margin:0;">3. Exec Sponsor (SLA: 72h)</h4>
            <p style="margin:4px 0 0 0; font-size:0.85rem; color:#cbd5e1;">Pending escalation</p>
          </div>
        </div>
      </div>
    `;
  }

  function attachNodeClickListeners(container) {
    const nodes = container.querySelectorAll('.node, .glass-card');
    nodes.forEach(node => {
      node.style.cursor = 'pointer';
      node.addEventListener('click', () => {
        const text = node.textContent.trim();
        let title = 'Governance SLA Inspection';
        let owner = 'Division Lead (Cloud Infrastructure)';
        let remaining = 42.5;
        let total = 48;

        if (text.includes('1.') || text.includes('HR')) {
          title = 'Stage 1: HR Risk Intake & Cliff Modeling';
          owner = 'HR Business Partner';
          remaining = 18.0;
          total = 24;
        } else if (text.includes('3.') || text.includes('Budget') || text.includes('Lead')) {
          title = 'Stage 3: Budget & Percentile Check';
          owner = 'Division Lead (Cloud Infrastructure)';
          remaining = 42.5;
          total = 48;
        } else if (text.includes('5.') || text.includes('Exec')) {
          title = 'Stage 5: Executive Review & Override';
          owner = 'Executive Sponsor / VP';
          remaining = 68.0;
          total = 72;
        }

        window.showSlaModal(title, owner, remaining, total);
      });
    });
  }

  window.showSlaModal = function(title, owner, remaining, totalSla) {
    let modal = document.getElementById('sla-glass-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sla-glass-modal';
      modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.75); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(6px);';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="glass-card" style="max-width:500px; width:90%; position:relative; border:1px solid rgba(255,123,0,0.5); box-shadow: 0 0 30px rgba(255,123,0,0.25);">
        <h3 style="font-family:'Cinzel', serif; color:#ff7b00; margin-top:0;">Governance SLA Inspection</h3>
        <h4 style="color:#e2e8f0; margin-bottom:8px;">${title}</h4>
        <p style="color:#94a3b8; font-size:0.95rem; line-height:1.6;">
          <strong>Stage Owner:</strong> ${owner}<br>
          <strong>SLA Countdown Timer:</strong> <span style="color:#eab308; font-family:monospace; font-weight:bold; font-size:1.05rem;">${remaining}h remaining</span> (of ${totalSla}h SLA)<br>
          <strong>Automated Escalation:</strong> If unresolved when timer expires, Supabase Edge Function triggers webhook alert to Department Head.
        </p>
        <div style="text-align:right; margin-top:20px;">
          <button id="close-sla-modal" style="background:#ff7b00; color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-family:'Inter', sans-serif; font-weight:600;">Close Drawer</button>
        </div>
      </div>
    `;

    document.getElementById('close-sla-modal').addEventListener('click', () => modal.remove());
  };

  // 4. Initialize DOM Event Listeners & UI Wiring
  document.addEventListener('DOMContentLoaded', () => {
    const tabProto1 = document.getElementById('tab-proto1');
    const tabProto2 = document.getElementById('tab-proto2');
    const viewProto1 = document.getElementById('view-proto1');
    const viewProto2 = document.getElementById('view-proto2');
    const grantSlider = document.getElementById('grant-slider');
    const grantDisplay = document.getElementById('grant-display');
    const submitBtn = document.getElementById('submit-award-btn');

    // Tab 1 Click
    tabProto1.onclick = () => {
      viewProto1.style.display = 'block';
      viewProto2.style.display = 'none';
      tabProto1.style.background = 'rgba(255,123,0,0.2)';
      tabProto1.style.border = '1px solid #ff7b00';
      tabProto2.style.background = 'rgba(255,255,255,0.05)';
      tabProto2.style.border = '1px solid rgba(255,255,255,0.15)';
    };

    // Tab 2 Click
    tabProto2.onclick = () => {
      viewProto1.style.display = 'none';
      viewProto2.style.display = 'block';
      tabProto2.style.background = 'rgba(255,123,0,0.2)';
      tabProto2.style.border = '1px solid #ff7b00';
      tabProto1.style.background = 'rgba(255,255,255,0.05)';
      tabProto1.style.border = '1px solid rgba(255,255,255,0.15)';
      renderSwimlane();
    };

    // Grant Slider Live Input
    grantSlider.oninput = (e) => {
      const val = Number(e.target.value);
      grantDisplay.innerText = `$${val.toLocaleString()}`;
      renderChart(val);
    };

    // Submit Award Button Click
    submitBtn.onclick = () => {
      const val = Number(grantSlider.value);
      activeAward = {
        employee_handle: 'a.mercer@emberkeep.io',
        grant_amount: val,
        target_percentile: '75th',
        status: 'Pending Division Lead Approval',
        justification: 'Proactive off-cycle refresh to close cash-flow cliff.',
        created_at: new Date().toISOString()
      };
      document.getElementById('current-stage-pill').innerText = `Active Stage: ${activeAward.status}`;
      alert(`Award of $${val.toLocaleString()} submitted to Governance SLA! Navigating to Prototype 2...`);
      tabProto2.click();
    };

    // Initial Render
    renderChart(Number(grantSlider.value));
  });

})();
