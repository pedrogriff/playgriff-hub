// js/retention/chart.js - Zero-Build ES Module
import Chart from 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/+esm';

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

    const baseYear0 = cf.year0Total || 330000;
    const baseYear1 = cf.year1Total || 350000;
    const baseYear2 = cf.year2Total || 280000; // Demonstrates $70k cash-flow cliff
    const baseYear3 = cf.year3Total || 290000;

    const grantAnnualImpact = showGrantImpact ? (customGrantAmount / 2) : 0;

    const data = {
      labels: ['Prior Year', 'Current Year (Y1)', 'Year + 1 (Y2)', 'Year + 2 (Y3)'],
      datasets: [
        {
          label: 'Base Compensation ($)',
          data: [baseYear0, baseYear1, baseYear2, baseYear3],
          backgroundColor: 'rgba(56, 189, 248, 0.65)',
          borderColor: 'rgba(56, 189, 248, 1)',
          borderWidth: 1,
          stack: 'total'
        },
        {
          label: 'Proposed Award Impact ($)',
          data: [0, grantAnnualImpact, grantAnnualImpact, 0],
          backgroundColor: 'rgba(234, 179, 8, 0.85)',
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
            legend: { labels: { color: '#e2e8f0', font: { family: 'Inter' } } },
            tooltip: {
              callbacks: { label: ctx => `${ctx.dataset.label}: $${ctx.raw.toLocaleString()}` }
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
