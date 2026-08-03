// js/retention/chart.js - Zero-Build ES Module
import Chart from 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/auto/+esm';

let chartInstance = null;

export class RetentionCliffVisualizer {
  constructor(canvasId, cliffContainerId) {
    this.canvasId = canvasId;
    this.cliffContainerId = cliffContainerId;
  }

  render(profile, customGrantAmount = 0, showGrantImpact = false) {
    const canvasEl = document.getElementById(this.canvasId);
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    const cf = profile.intendedCashFlows || {};

    const salaryData = cf.salary || [180000, 180000, 180000, 180000];
    const bonusData  = cf.bonus  || [50000,  50000,  50000,  50000];
    const equityData = cf.equity || [100000, 120000, 50000,  60000];

    const baseYear1 = cf.year1Total || (salaryData[1] + bonusData[1] + equityData[1]);
    const baseYear2 = cf.year2Total || (salaryData[2] + bonusData[2] + equityData[2]);

    const grantAnnualImpact = showGrantImpact ? (customGrantAmount / 2) : 0;

    const data = {
      labels: ['Prior Year', 'Current Year (Y1)', 'Year + 1 (Y2)', 'Year + 2 (Y3)'],
      datasets: [
        {
          label: 'Base Salary',
          data: salaryData,
          backgroundColor: 'rgba(56, 189, 248, 0.75)',
          borderColor: '#38bdf8',
          borderWidth: 1,
          stack: 'total'
        },
        {
          label: 'Annual Bonus',
          data: bonusData,
          backgroundColor: 'rgba(168, 85, 247, 0.75)',
          borderColor: '#a855f7',
          borderWidth: 1,
          stack: 'total'
        },
        {
          label: 'Vesting Equity',
          data: equityData,
          backgroundColor: 'rgba(239, 68, 68, 0.75)',
          borderColor: '#ef4444',
          borderWidth: 1,
          stack: 'total'
        },
        {
          label: 'Proposed Refresh Award',
          data: [0, grantAnnualImpact, grantAnnualImpact, 0],
          backgroundColor: 'rgba(234, 179, 8, 0.9)',
          borderColor: '#facc15',
          borderWidth: 2,
          stack: 'total'
        }
      ]
    };

    if (chartInstance) {
      chartInstance.data = data;
      chartInstance.update();
    } else {
      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: data,
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
                label: ctx => `${ctx.dataset.label}: $${ctx.raw.toLocaleString()}`
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

    const cliffEl = document.getElementById(this.cliffContainerId);
    const isCliff = baseYear1 > 0 && baseYear2 < (baseYear1 * 0.9);
    if (cliffEl) {
      if (isCliff) {
        const dropPercent = (((baseYear1 - baseYear2) / baseYear1) * 100).toFixed(1);
        cliffEl.innerHTML = `
          <div class="glass-card cliff-warning-pulse" style="display:flex; align-items:center; gap:16px; margin-bottom:16px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <strong style="color:#ef4444; font-family:'Cinzel', serif;">ATTENTION: CASH-FLOW CLIFF DETECTED</strong>
              <p style="margin:4px 0 0 0; font-size:0.9rem;">Projected Y2 cash flow drops by <strong>${dropPercent}%</strong> ($${(baseYear1 - baseYear2).toLocaleString()}) due to equity vesting expiration. Immediate refresh evaluation required.</p>
            </div>
          </div>
        `;
      } else {
        cliffEl.innerHTML = '';
      }
    }
  }
}
