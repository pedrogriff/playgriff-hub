/**
 * NextComp — Salary Range Workbench Client Engine
 * Author: Pedro (@pedrogriff) & DeepMind Agentic Pair Programmer
 * Formula Engine: lib/comp-math.ts mathematical specifications
 */

(function () {
  'use strict';

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Core Mathematical Formulas (lib/comp-math.ts)
  // ──────────────────────────────────────────────────────────────────────────

  function calculateMinFromMidAndSpread(mid, spread) {
    if (mid <= 0 || spread <= 0) return 0;
    return mid / (1 + spread / 2);
  }

  function calculateMaxFromMinAndSpread(min, spread) {
    if (min <= 0 || spread <= 0) return 0;
    return min * (1 + spread);
  }

  function calculateSpread(min, max) {
    if (min <= 0 || max <= min) return 0.4;
    return (max - min) / min;
  }

  function calculateCompaRatio(base, mid) {
    if (mid <= 0) return 0;
    return base / mid;
  }

  function calculateRangePenetrationPct(base, min, max) {
    if (max <= min) return 0;
    return ((base - min) / (max - min)) * 100;
  }

  function isGreenCircle(base, min) {
    return base < min;
  }

  function isRedCircle(base, max) {
    return base > max;
  }

  function calculateGreenCircleCorrectionBudget(base, min) {
    return base < min ? min - base : 0;
  }

  function formatUSD(val) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(Math.round(val));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Data Store: Job Families, Baseline Salary Bands, & Incumbents
  // ──────────────────────────────────────────────────────────────────────────

  const INITIAL_FAMILIES = [
    {
      id: 'ENG',
      code: 'ENG',
      name: 'Engineering',
      description: 'Software engineering, infrastructure, distributed systems, and ML engineering.',
    },
    {
      id: 'PROD',
      code: 'PROD',
      name: 'Product',
      description: 'Product strategy, roadmap execution, technical specifications, and user growth.',
    },
    {
      id: 'DSGN',
      code: 'DSGN',
      name: 'Design',
      description: 'Product design, user experience, visual identity, and design systems.',
    },
  ];

  const BASE_BAND_PARAMS = {
    IC1: { min: 110000, mid: 135000, max: 160000, role: 'Associate Contributor' },
    IC2: { min: 140000, mid: 165000, max: 195000, role: 'Staff Contributor' },
    IC3: { min: 180000, mid: 210000, max: 250000, role: 'Senior Specialist' },
    IC4: { min: 225000, mid: 265000, max: 315000, role: 'Staff / Tech Lead' },
    IC5: { min: 275000, mid: 325000, max: 390000, role: 'Principal Architect' },
    IC6: { min: 340000, mid: 410000, max: 500000, role: 'Distinguished Fellow' },
  };

  const INITIAL_EMPLOYEES = [
    { id: 'EMP-001', name: 'Alex Vance', email: 'alex.vance@nextcomp.local', family: 'ENG', level: 'IC4', title: 'Staff Software Engineer', base: 265000 },
    { id: 'EMP-002', name: 'Elena Rostova', email: 'elena.rostova@nextcomp.local', family: 'ENG', level: 'IC3', title: 'Senior Software Engineer', base: 205000 },
    { id: 'EMP-003', name: 'Marcus Chen', email: 'marcus.chen@nextcomp.local', family: 'PROD', level: 'IC4', title: 'Staff Product Manager', base: 245000 },
    { id: 'EMP-004', name: 'Sarah Lin', email: 'sarah.lin@nextcomp.local', family: 'DSGN', level: 'IC3', title: 'Senior Product Designer', base: 185000 },
    { id: 'EMP-005', name: 'Jordan Blake', email: 'jordan.blake@nextcomp.local', family: 'ENG', level: 'IC1', title: 'Associate Software Engineer', base: 98000 },
    { id: 'EMP-006', name: 'Maya Patel', email: 'maya.patel@nextcomp.local', family: 'ENG', level: 'IC2', title: 'Software Engineer II', base: 155000 },
    { id: 'EMP-007', name: 'David Kim', email: 'david.kim@nextcomp.local', family: 'PROD', level: 'IC2', title: 'Product Manager II', base: 125000 },
    { id: 'EMP-008', name: 'Rachel Green', email: 'rachel.green@nextcomp.local', family: 'PROD', level: 'IC5', title: 'Principal Product Manager', base: 380000 },
    { id: 'EMP-009', name: 'Liam O\'Connor', email: 'liam.oconnor@nextcomp.local', family: 'DSGN', level: 'IC1', title: 'Associate Product Designer', base: 92000 },
    { id: 'EMP-010', name: 'Chloe Bennett', email: 'chloe.bennett@nextcomp.local', family: 'DSGN', level: 'IC4', title: 'Staff Product Designer', base: 295000 },
  ];

  function buildBaselineBands() {
    const bands = {};
    for (const fam of INITIAL_FAMILIES) {
      const factor = fam.code === 'ENG' ? 1.0 : fam.code === 'PROD' ? 0.95 : 0.90;
      for (const [level, cfg] of Object.entries(BASE_BAND_PARAMS)) {
        const key = `${fam.code}_${level}`;
        const min = Math.round(cfg.min * factor);
        const mid = Math.round(cfg.mid * factor);
        const max = Math.round(cfg.max * factor);
        const spread = calculateSpread(min, max);
        bands[key] = {
          key,
          familyCode: fam.code,
          familyName: fam.name,
          level,
          roleTitle: cfg.role,
          min,
          mid,
          max,
          spread,
          baselineMin: min,
          baselineMid: mid,
          baselineMax: max,
          baselineSpread: spread,
        };
      }
    }
    return bands;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Application State & Controller
  // ──────────────────────────────────────────────────────────────────────────

  const App = {
    bands: {},
    employees: INITIAL_EMPLOYEES,
    families: INITIAL_FAMILIES,
    selectedFamilyFilter: 'ALL',
    rosterCircleFilter: 'ALL',
    rosterSearchQuery: '',

    init: function () {
      this.bands = this.loadSavedBands() || buildBaselineBands();
      this.render();
      this.bindEvents();
    },

    loadSavedBands: function () {
      try {
        const saved = localStorage.getItem('nextcomp_salary_bands_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Object.keys(parsed).length === 18) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Could not load saved bands from localStorage', e);
      }
      return null;
    },

    saveBandsToStorage: function () {
      try {
        localStorage.setItem('nextcomp_salary_bands_v1', JSON.stringify(this.bands));
        this.showToast('✓ Saved 18 salary bands to browser storage successfully!');
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
    },

    resetAll: function () {
      localStorage.removeItem('nextcomp_salary_bands_v1');
      this.bands = buildBaselineBands();
      this.render();
      this.showToast('Reset all salary bands back to database baseline values.');
    },

    resetSingleBand: function (key) {
      const b = this.bands[key];
      if (!b) return;
      b.mid = b.baselineMid;
      b.spread = b.baselineSpread;
      b.min = b.baselineMin;
      b.max = b.baselineMax;
      this.render();
    },

    updateMidpoint: function (key, newMid) {
      const b = this.bands[key];
      if (!b || newMid <= 0 || isNaN(newMid)) return;
      b.mid = Math.round(newMid);
      b.min = Math.round(calculateMinFromMidAndSpread(b.mid, b.spread));
      b.max = Math.round(calculateMaxFromMinAndSpread(b.min, b.spread));
      this.render();
    },

    updateSpread: function (key, newSpreadPct) {
      const b = this.bands[key];
      if (!b || newSpreadPct <= 0 || isNaN(newSpreadPct)) return;
      b.spread = newSpreadPct / 100;
      b.min = Math.round(calculateMinFromMidAndSpread(b.mid, b.spread));
      b.max = Math.round(calculateMaxFromMinAndSpread(b.min, b.spread));
      this.render();
    },

    applyMidpointBump: function (pctDelta) {
      for (const key in this.bands) {
        const b = this.bands[key];
        b.mid = Math.round(b.mid * (1 + pctDelta / 100));
        b.min = Math.round(calculateMinFromMidAndSpread(b.mid, b.spread));
        b.max = Math.round(calculateMaxFromMinAndSpread(b.min, b.spread));
      }
      this.render();
      this.showToast(`Applied ${pctDelta > 0 ? '+' : ''}${pctDelta}% midpoint adjustment across all 18 bands.`);
    },

    applySpreadNormalize: function (targetPct) {
      const spread = targetPct / 100;
      for (const key in this.bands) {
        const b = this.bands[key];
        b.spread = spread;
        b.min = Math.round(calculateMinFromMidAndSpread(b.mid, b.spread));
        b.max = Math.round(calculateMaxFromMinAndSpread(b.min, b.spread));
      }
      this.render();
      this.showToast(`Normalized all salary band spreads to ${targetPct}%.`);
    },

    showToast: function (msg) {
      const bar = document.getElementById('toast-notification');
      if (!bar) return;
      bar.innerHTML = `<span>${msg}</span><span style="font-size:0.65rem;opacity:0.8;">REAL-TIME RECALC</span>`;
      bar.style.display = 'flex';
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => {
        bar.style.display = 'none';
      }, 3500);
    },

    copyShareableLink: function () {
      const url = window.location.href.split('#')[0];
      navigator.clipboard.writeText(url).then(() => {
        this.showToast('Copied shareable link to clipboard: ' + url);
      }).catch(() => {
        prompt('Copy shareable workbench link:', url);
      });
    },

    // ────────────────────────────────────────────────────────────────────────
    // 4. Analysis & Rendering
    // ────────────────────────────────────────────────────────────────────────

    calculateTelemetry: function () {
      let totalEmps = this.employees.length;
      let greenCircles = 0;
      let greenBudget = 0;
      let redCircles = 0;
      let inRange = 0;
      let totalCompa = 0;

      const deptMap = {
        ENG: { code: 'ENG', name: 'Engineering', count: 0, compaSum: 0, green: 0, budget: 0, red: 0 },
        PROD: { code: 'PROD', name: 'Product', count: 0, compaSum: 0, green: 0, budget: 0, red: 0 },
        DSGN: { code: 'DSGN', name: 'Design', count: 0, compaSum: 0, green: 0, budget: 0, red: 0 },
      };

      const analyzedEmployees = this.employees.map((emp) => {
        const bandKey = `${emp.family}_${emp.level}`;
        const band = this.bands[bandKey];
        const dept = deptMap[emp.family];

        if (!band) return emp;

        dept.count++;
        const compa = calculateCompaRatio(emp.base, band.mid);
        totalCompa += compa;
        dept.compaSum += compa;

        const isGreen = isGreenCircle(emp.base, band.min);
        const isRed = isRedCircle(emp.base, band.max);
        const budget = calculateGreenCircleCorrectionBudget(emp.base, band.min);
        const penetration = calculateRangePenetrationPct(emp.base, band.min, band.max);

        if (isGreen) {
          greenCircles++;
          greenBudget += budget;
          dept.green++;
          dept.budget += budget;
        } else if (isRed) {
          redCircles++;
          dept.red++;
        } else {
          inRange++;
        }

        return {
          ...emp,
          band,
          compaRatio: compa,
          rangePenetrationPct: penetration,
          isGreenCircle: isGreen,
          isRedCircle: isRed,
          isInRange: !isGreen && !isRed,
          correctionBudget: budget,
          circleStatus: isGreen ? 'GREEN_CIRCLE' : isRed ? 'RED_CIRCLE' : 'IN_RANGE',
        };
      });

      const avgCompa = totalEmps > 0 ? totalCompa / totalEmps : 0;

      return {
        totalEmps,
        greenCircles,
        greenBudget,
        redCircles,
        inRange,
        avgCompa,
        deptMap,
        analyzedEmployees,
      };
    },

    render: function () {
      const telemetry = this.calculateTelemetry();

      // Render KPIs
      this.renderKPIs(telemetry);

      // Render Department telemetry strip
      this.renderDeptStrip(telemetry.deptMap);

      // Render Salary Bands tables
      this.renderBandsTable(telemetry.analyzedEmployees);

      // Render Incumbent Roster
      this.renderRoster(telemetry.analyzedEmployees);

      // Check if modified
      const hasMods = Object.values(this.bands).some(
        (b) => b.mid !== b.baselineMid || Math.abs(b.spread - b.baselineSpread) > 0.001
      );
      const resetBtn = document.getElementById('btn-reset-all');
      if (resetBtn) resetBtn.disabled = !hasMods;
    },

    renderKPIs: function (telemetry) {
      // 1. Employees Below Min (Green Circle)
      const elGreenCount = document.getElementById('kpi-green-count');
      const elGreenSubhead = document.getElementById('kpi-green-subhead');
      const elGreenBudget = document.getElementById('kpi-green-budget');

      if (elGreenCount) elGreenCount.innerText = telemetry.greenCircles;
      if (elGreenSubhead) {
        const pct = ((telemetry.greenCircles / telemetry.totalEmps) * 100).toFixed(0);
        elGreenSubhead.innerText = `incumbents (${pct}%)`;
      }
      if (elGreenBudget) elGreenBudget.innerText = formatUSD(telemetry.greenBudget);

      // 2. Employees Above Max (Red Circle)
      const elRedCount = document.getElementById('kpi-red-count');
      const elRedSubhead = document.getElementById('kpi-red-subhead');
      if (elRedCount) elRedCount.innerText = telemetry.redCircles;
      if (elRedSubhead) {
        const pct = ((telemetry.redCircles / telemetry.totalEmps) * 100).toFixed(0);
        elRedSubhead.innerText = `incumbents (${pct}%)`;
      }

      // 3. Average Compa-Ratio
      const elCompaVal = document.getElementById('kpi-compa-val');
      const elCompaSubhead = document.getElementById('kpi-compa-subhead');
      const elInRangeText = document.getElementById('kpi-inrange-text');

      if (elCompaVal) elCompaVal.innerText = `${(telemetry.avgCompa * 100).toFixed(1)}%`;
      if (elCompaSubhead) elCompaSubhead.innerText = `(Index: ${telemetry.avgCompa.toFixed(3)})`;
      if (elInRangeText) {
        const pct = ((telemetry.inRange / telemetry.totalEmps) * 100).toFixed(0);
        elInRangeText.innerText = `${telemetry.inRange} of ${telemetry.totalEmps} (${pct}%)`;
      }
    },

    renderDeptStrip: function (deptMap) {
      const container = document.getElementById('dept-strip-grid');
      if (!container) return;

      container.innerHTML = Object.values(deptMap).map((dept) => {
        const avg = dept.count > 0 ? (dept.compaSum / dept.count) * 100 : 0;
        const isSelected = this.selectedFamilyFilter === dept.code;
        return `
          <div class="dept-card" style="${isSelected ? 'border-color: rgba(0, 242, 254, 0.7); background: rgba(10, 15, 29, 0.8);' : ''}">
            <div class="dept-card-top">
              <div class="dept-card-name">
                <span>${dept.name}</span>
                <span class="dept-code-pill">${dept.code}</span>
              </div>
              <span style="font-size:0.7rem; color: var(--text-dim);">${dept.count} headcount</span>
            </div>
            <div class="dept-compa-line">
              <span style="color: var(--text-muted);">Avg Compa-Ratio:</span>
              <span class="dept-compa-val">${avg.toFixed(1)}%</span>
            </div>
            <div class="dept-circle-summary">
              <span class="val-green">● ${dept.green} under (${formatUSD(dept.budget)})</span>
              <span class="val-red">● ${dept.red} over</span>
            </div>
          </div>
        `;
      }).join('');
    },

    renderBandsTable: function (analyzedEmployees) {
      const container = document.getElementById('salary-bands-container');
      if (!container) return;

      const familiesToDisplay = this.selectedFamilyFilter === 'ALL'
        ? this.families
        : this.families.filter((f) => f.code === this.selectedFamilyFilter);

      container.innerHTML = familiesToDisplay.map((fam) => {
        const famEmployees = analyzedEmployees.filter((e) => e.family === fam.code);
        const famCompa = famEmployees.length > 0
          ? (famEmployees.reduce((acc, e) => acc + e.compaRatio, 0) / famEmployees.length) * 100
          : 0;

        const levels = ['IC1', 'IC2', 'IC3', 'IC4', 'IC5', 'IC6'];
        const rowsHtml = levels.map((lvl) => {
          const key = `${fam.code}_${lvl}`;
          const b = this.bands[key];
          if (!b) return '';

          const lvlEmps = famEmployees.filter((e) => e.level === lvl);
          const hasGreen = lvlEmps.some((e) => e.isGreenCircle);
          const hasRed = lvlEmps.some((e) => e.isRedCircle);
          const isModified = b.mid !== b.baselineMid || Math.abs(b.spread - b.baselineSpread) > 0.001;
          const spreadPct = (b.spread * 100).toFixed(1);

          return `
            <tr class="${isModified ? 'row-modified' : ''}">
              <td>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <span class="level-tag">${b.level}</span>
                  <span style="color: var(--text-muted); font-family: var(--font-sans);">${b.roleTitle}</span>
                </div>
              </td>
              <td style="text-align: center;">
                <span class="level-tag" style="color: var(--text-main); font-weight: 500;">
                  ${lvlEmps.length}
                  ${hasGreen ? '<span class="circle-dot green" style="display:inline-block; margin-left:4px; vertical-align:middle;"></span>' : ''}
                  ${hasRed ? '<span class="circle-dot red" style="display:inline-block; margin-left:4px; vertical-align:middle;"></span>' : ''}
                </span>
              </td>
              <td style="text-align: right; font-weight: 700; color: #fff;">
                <div>${formatUSD(b.min)}</div>
                ${isModified ? `<div style="font-size:0.6rem; color:var(--text-dim);">was ${formatUSD(b.baselineMin)}</div>` : ''}
              </td>
              <td>
                <div class="stepper-box">
                  <button type="button" class="step-btn" data-action="step-mid" data-key="${key}" data-delta="-5000" title="Decrement -$5,000">-</button>
                  <div class="step-input-wrap">
                    <span class="prefix">$</span>
                    <input type="number" step="1000" class="step-input mid-input ${isModified ? 'modified' : ''}" data-key="${key}" value="${b.mid}">
                  </div>
                  <button type="button" class="step-btn" data-action="step-mid" data-key="${key}" data-delta="5000" title="Increment +$5,000">+</button>
                </div>
              </td>
              <td>
                <div class="stepper-box">
                  <button type="button" class="step-btn" data-action="step-spread" data-key="${key}" data-delta="-2.5" title="Narrow spread -2.5%">-</button>
                  <div class="step-input-wrap">
                    <input type="number" step="0.5" class="step-input spread-input ${isModified ? 'modified' : ''}" data-spread-key="${key}" value="${spreadPct}">
                    <span class="suffix">%</span>
                  </div>
                  <button type="button" class="step-btn" data-action="step-spread" data-key="${key}" data-delta="2.5" title="Widen spread +2.5%">+</button>
                </div>
              </td>
              <td style="text-align: right; font-weight: 700; color: #fff;">
                <div>${formatUSD(b.max)}</div>
                ${isModified ? `<div style="font-size:0.6rem; color:var(--text-dim);">was ${formatUSD(b.baselineMax)}</div>` : ''}
              </td>
              <td style="text-align: right; color: var(--text-muted);">
                ${formatUSD(b.max - b.min)}
              </td>
              <td>
                <div class="band-mini-bar">
                  <div class="bar-track">
                    <div class="bar-fill"></div>
                    <div class="bar-mid-notch"></div>
                  </div>
                  <div class="bar-labels">
                    <span>Min</span>
                    <span style="color:var(--terminal-cyan); font-weight:bold;">Mid</span>
                    <span>Max</span>
                  </div>
                </div>
              </td>
              <td style="text-align: center;">
                ${isModified
                  ? `<button type="button" class="btn btn-outline" style="padding:0.2rem 0.4rem; font-size:0.65rem;" data-action="reset-band" data-key="${key}" title="Reset this band">↺</button>`
                  : `<span style="color:var(--text-dim);">•</span>`}
              </td>
            </tr>
          `;
        }).join('');

        return `
          <div class="family-block">
            <div class="family-header">
              <div class="family-header-left">
                <div class="family-icon">⚡</div>
                <div>
                  <div class="family-title-row">
                    <h3 class="family-title">${fam.name} Family</h3>
                    <span class="family-code-pill">${fam.code}</span>
                  </div>
                  <p class="family-desc">${fam.description}</p>
                </div>
              </div>
              <div class="family-header-right">
                <span>6 IC Levels</span>
                <span>•</span>
                <span>${famEmployees.length} Incumbents</span>
                <span>•</span>
                <span style="color:var(--terminal-cyan); font-weight:700;">Compa: ${famCompa.toFixed(1)}%</span>
              </div>
            </div>
            <div class="table-responsive">
              <table class="bands-table">
                <thead>
                  <tr>
                    <th>Level & Role</th>
                    <th style="text-align:center;">Incumbents</th>
                    <th style="text-align:right;">Min Base</th>
                    <th style="text-align:center; min-width: 180px;">Midpoint (Editable)</th>
                    <th style="text-align:center; min-width: 160px;">Spread % (Editable)</th>
                    <th style="text-align:right;">Max Base</th>
                    <th style="text-align:right;">Range Width</th>
                    <th style="text-align:center; min-width: 140px;">Band Visual</th>
                    <th style="text-align:center;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }).join('');
    },

    renderRoster: function (analyzedEmployees) {
      const container = document.getElementById('roster-tbody');
      const countLabel = document.getElementById('roster-headcount-label');
      if (!container) return;

      const q = this.rosterSearchQuery.trim().toLowerCase();
      const filtered = analyzedEmployees.filter((emp) => {
        if (this.selectedFamilyFilter !== 'ALL' && emp.family !== this.selectedFamilyFilter) return false;
        if (this.rosterCircleFilter !== 'ALL' && emp.circleStatus !== this.rosterCircleFilter) return false;
        if (q !== '') {
          const matchName = emp.name.toLowerCase().includes(q);
          const matchTitle = emp.title.toLowerCase().includes(q);
          const matchLevel = emp.level.toLowerCase().includes(q);
          const matchNum = emp.id.toLowerCase().includes(q);
          if (!matchName && !matchTitle && !matchLevel && !matchNum) return false;
        }
        return true;
      });

      if (countLabel) {
        countLabel.innerText = `(Showing ${filtered.length} of ${analyzedEmployees.length} employees)`;
      }

      if (filtered.length === 0) {
        container.innerHTML = `
          <tr>
            <td colspan="10" style="text-align:center; padding: 2rem; color: var(--text-dim);">
              No employee incumbents match the selected filters.
            </td>
          </tr>
        `;
        return;
      }

      container.innerHTML = filtered.map((emp) => {
        const compaPct = (emp.compaRatio * 100).toFixed(1);
        let badgeHtml = '';
        let deltaHtml = '';

        if (emp.isGreenCircle) {
          badgeHtml = `<span class="status-tag green">● GREEN CIRCLE</span>`;
          deltaHtml = `<span class="val-green font-bold">+${formatUSD(emp.correctionBudget)}</span>`;
        } else if (emp.isRedCircle) {
          badgeHtml = `<span class="status-tag red">● RED CIRCLE</span>`;
          deltaHtml = `<span class="val-red">+${formatUSD(emp.base - emp.band.max)} over</span>`;
        } else {
          badgeHtml = `<span class="status-tag in-range">IN RANGE</span>`;
          deltaHtml = `<span style="color:var(--text-dim);">&mdash;</span>`;
        }

        return `
          <tr style="${emp.isGreenCircle ? 'background:rgba(0,229,153,0.03);' : emp.isRedCircle ? 'background:rgba(244,63,94,0.03);' : ''}">
            <td>
              <div style="font-weight:700; color:#fff; font-family:var(--font-sans);">${emp.name}</div>
              <div style="font-size:0.65rem; color:var(--text-dim);">${emp.id} &bull; ${emp.email}</div>
            </td>
            <td>
              <div style="font-family:var(--font-sans); color:var(--text-main);">${emp.title}</div>
              <div style="font-size:0.65rem; color:var(--terminal-cyan);">${emp.family}</div>
            </td>
            <td style="text-align:center;">
              <span class="level-tag">${emp.level}</span>
            </td>
            <td style="text-align:right; font-weight:700; color:#fff;">
              ${formatUSD(emp.base)}
            </td>
            <td style="text-align:right; color:var(--text-muted);">
              ${formatUSD(emp.band.mid)}
            </td>
            <td style="text-align:center;">
              <span style="font-weight:700; ${emp.isGreenCircle ? 'color:var(--growth-emerald);' : emp.isRedCircle ? 'color:var(--danger-rose);' : 'color:#fff;'}">
                ${compaPct}%
              </span>
            </td>
            <td style="text-align:center; color:var(--text-muted); font-size:0.7rem;">
              ${formatUSD(emp.band.min)} &ndash; ${formatUSD(emp.band.max)}
            </td>
            <td style="text-align:center;">
              ${emp.rangePenetrationPct.toFixed(1)}%
            </td>
            <td style="text-align:center;">
              ${badgeHtml}
            </td>
            <td style="text-align:right;">
              ${deltaHtml}
            </td>
          </tr>
        `;
      }).join('');
    },

    // ────────────────────────────────────────────────────────────────────────
    // 5. User Interaction Bindings
    // ────────────────────────────────────────────────────────────────────────

    bindEvents: function () {
      // Midpoint & Spread input changes
      document.addEventListener('change', (e) => {
        if (e.target.matches('.mid-input')) {
          const key = e.target.getAttribute('data-key');
          const val = parseFloat(e.target.value);
          this.updateMidpoint(key, val);
        } else if (e.target.matches('.spread-input')) {
          const key = e.target.getAttribute('data-spread-key');
          const val = parseFloat(e.target.value);
          this.updateSpread(key, val);
        }
      });

      // Stepper & Action buttons
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const action = btn.getAttribute('data-action');
        if (action === 'step-mid') {
          const key = btn.getAttribute('data-key');
          const delta = parseFloat(btn.getAttribute('data-delta'));
          const currentMid = this.bands[key]?.mid || 100000;
          this.updateMidpoint(key, currentMid + delta);
        } else if (action === 'step-spread') {
          const key = btn.getAttribute('data-key');
          const delta = parseFloat(btn.getAttribute('data-delta'));
          const currentSpreadPct = (this.bands[key]?.spread || 0.4) * 100;
          this.updateSpread(key, currentSpreadPct + delta);
        } else if (action === 'reset-band') {
          const key = btn.getAttribute('data-key');
          this.resetSingleBand(key);
        }
      });

      // Job Family Filter Pills
      const familyFilterBtns = document.querySelectorAll('.family-filter-btn');
      familyFilterBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          familyFilterBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.selectedFamilyFilter = btn.getAttribute('data-family');
          this.render();
        });
      });

      // Quick Presets
      document.querySelectorAll('.preset-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const preset = btn.getAttribute('data-preset');
          if (preset === '+3mid') this.applyMidpointBump(3.0);
          else if (preset === '+5mid') this.applyMidpointBump(5.0);
          else if (preset === '40spread') this.applySpreadNormalize(40);
          else if (preset === '50spread') this.applySpreadNormalize(50);
        });
      });

      // Global Reset
      const resetAllBtn = document.getElementById('btn-reset-all');
      if (resetAllBtn) {
        resetAllBtn.addEventListener('click', () => this.resetAll());
      }

      // Save to Storage
      const saveBtn = document.getElementById('btn-save-storage');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => this.saveBandsToStorage());
      }

      // Share Link
      const shareBtn = document.getElementById('btn-share-link');
      if (shareBtn) {
        shareBtn.addEventListener('click', () => this.copyShareableLink());
      }

      // Roster Search Input
      const searchInput = document.getElementById('roster-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.rosterSearchQuery = e.target.value;
          const telemetry = this.calculateTelemetry();
          this.renderRoster(telemetry.analyzedEmployees);
        });
      }

      // Roster Circle Filter Buttons
      const circleFilterBtns = document.querySelectorAll('.circle-filter-btn');
      circleFilterBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          circleFilterBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.rosterCircleFilter = btn.getAttribute('data-filter');
          const telemetry = this.calculateTelemetry();
          this.renderRoster(telemetry.analyzedEmployees);
        });
      });
    },
  };

  // Launch when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });

})();
