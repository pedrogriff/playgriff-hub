/**
 * CompFlow Platform — Enterprise Total Rewards & Calibration SaaS
 * Client-Side State Engine & Visualizer
 * Author: Pedro (@pedrogriff)
 */

document.addEventListener('DOMContentLoaded', () => {
  CompFlowApp.init();
});

const CompFlowApp = {
  // ─── STATE STORE ──────────────────────────────────────────────────────────
  state: {
    activeRoute: 'planning',
    activePersona: 'PEOPLE_MANAGER',
    activeGeo: 'US_ZONE_1',
    selectedEmpId: null,

    // Base Benchmark Bands
    bands: {
      L3: { min: 140000, mid: 165000, max: 190000, targetEquity: 400, bonusPct: 10 },
      L4: { min: 170000, mid: 200000, max: 230000, targetEquity: 650, bonusPct: 15 },
      L5: { min: 210000, mid: 250000, max: 290000, targetEquity: 900, bonusPct: 15 },
      L6: { min: 260000, mid: 310000, max: 360000, targetEquity: 1400, bonusPct: 20 },
      L7: { min: 320000, mid: 380000, max: 440000, targetEquity: 2200, bonusPct: 25 },
      L8: { min: 400000, mid: 480000, max: 560000, targetEquity: 3500, bonusPct: 30 },
    },

    geoFactors: {
      US_ZONE_1: 1.0,
      US_ZONE_2: 0.90,
      US_ZONE_3: 0.80,
    },

    // Department Envelope Budget
    departmentBudget: {
      name: 'Platform Engineering Department',
      costCenter: 'CC-1010-INFRA',
      headcount: 15,
      totalPayroll: 3750000,
      allocatedMerit: 320000,  // ~8.5% total envelope
      allocatedBonus: 750000,  // Baseline 20% target across 15 engineers
      allocatedEquity: 36000,  // RSUs
      cpf: 1.05,               // Company Performance Factor
    },

    // 15 Team Members Roster
    employees: [
      { id: 'EMP-1001', name: 'Alex Rivera', role: 'Staff Infrastructure Engineer', level: 'L6', geo: 'US_ZONE_1', rating: 'SUPERB', currentBase: 305000, proposedBase: 335000, ipf: 1.30, equity: 1800, status: 'AUTO_APPROVED', selected: true, notes: 'Designed zero-downtime distributed Redis replication cluster.' },
      { id: 'EMP-1002', name: 'Sarah Kowalski', role: 'Senior Systems Engineer', level: 'L5', geo: 'US_ZONE_1', rating: 'EXCEEDS', currentBase: 235000, proposedBase: 252000, ipf: 1.15, equity: 1100, status: 'AUTO_APPROVED', selected: true, notes: 'Kernel eBPF telemetry performance improvements.' },
      { id: 'EMP-1003', name: 'David Zhang', role: 'Staff Distributed Systems Engineer', level: 'L6', geo: 'US_ZONE_1', rating: 'STRONGLY_OUTPERFORMS', currentBase: 310000, proposedBase: 345000, ipf: 1.20, equity: 1600, status: 'AUTO_APPROVED', selected: true, notes: 'Led multi-region data persistence migration.' },
      { id: 'EMP-1004', name: 'Elena Rostova', role: 'Principal Architect', level: 'L7', geo: 'US_ZONE_1', rating: 'SUPERB', currentBase: 380000, proposedBase: 425000, ipf: 1.35, equity: 2900, status: 'VP_EXCEPTION_REQUIRED', selected: true, notes: 'Core architecture overhaul; raise +11.8% and high equity grant.' },
      { id: 'EMP-1005', name: 'Marcus Sterling', role: 'Senior Reliability Engineer', level: 'L5', geo: 'US_ZONE_2', rating: 'CONSISTENTLY_MEETS', currentBase: 215000, proposedBase: 226000, ipf: 1.00, equity: 850, status: 'AUTO_APPROVED', selected: true, notes: 'Solid platform on-call reliability execution.' },
      { id: 'EMP-1006', name: 'Priya Sharma', role: 'Software Engineer III', level: 'L4', geo: 'US_ZONE_1', rating: 'STRONGLY_OUTPERFORMS', currentBase: 195000, proposedBase: 212000, ipf: 1.20, equity: 850, status: 'AUTO_APPROVED', selected: true, notes: 'Built automated canary deployment service.' },
      { id: 'EMP-1007', name: 'Liam Dubois', role: 'Software Engineer II', level: 'L3', geo: 'US_ZONE_3', rating: 'CONSISTENTLY_MEETS', currentBase: 130000, proposedBase: 136000, ipf: 1.00, equity: 350, status: 'AUTO_APPROVED', selected: true, notes: 'Fast onboarding and bug fixes in queue workers.' },
      { id: 'EMP-1008', name: 'Hannah Vogel', role: 'Senior Security Systems SWE', level: 'L5', geo: 'US_ZONE_1', rating: 'EXCEEDS', currentBase: 240000, proposedBase: 258000, ipf: 1.15, equity: 1050, status: 'AUTO_APPROVED', selected: true, notes: 'Hardened Kubernetes SPIFFE/mTLS certificates.' },
      { id: 'EMP-1009', name: 'Kai Tanaka', role: 'Software Engineer III', level: 'L4', geo: 'US_ZONE_2', rating: 'CONSISTENTLY_MEETS', currentBase: 180000, proposedBase: 187000, ipf: 1.00, equity: 600, status: 'AUTO_APPROVED', selected: true, notes: 'Consistent contributions to CI/CD pipeline.' },
      { id: 'EMP-1010', name: 'Julia Novak', role: 'Senior SWE (Edge & Compute)', level: 'L5', geo: 'US_ZONE_1', rating: 'NEEDS_IMPROVEMENT', currentBase: 230000, proposedBase: 230000, ipf: 0.00, equity: 0, status: 'AUTO_APPROVED', selected: true, notes: 'Base salary frozen per total rewards performance policy.' },
      { id: 'EMP-1011', name: 'Noah Al-Mansoor', role: 'Staff Reliability Architect', level: 'L6', geo: 'US_ZONE_1', rating: 'STRONGLY_OUTPERFORMS', currentBase: 295000, proposedBase: 320000, ipf: 1.25, equity: 1500, status: 'AUTO_APPROVED', selected: true, notes: 'Led cross-functional disaster recovery exercises.' },
      { id: 'EMP-1012', name: 'Olivia Santos', role: 'Senior Observability Engineer', level: 'L5', geo: 'US_ZONE_3', rating: 'SUPERB', currentBase: 200000, proposedBase: 228000, ipf: 1.30, equity: 1400, status: 'VP_EXCEPTION_REQUIRED', selected: true, notes: 'Massive impact on Prometheus metric scalability (+14% raise).' },
      { id: 'EMP-1013', name: 'Gabriel Dubois', role: 'Software Engineer II', level: 'L3', geo: 'US_ZONE_1', rating: 'EXCEEDS', currentBase: 160000, proposedBase: 172000, ipf: 1.10, equity: 500, status: 'AUTO_APPROVED', selected: true, notes: 'High velocity contributions to SDK client.' },
      { id: 'EMP-1014', name: 'Quinn Larsson', role: 'Staff Security Engineer', level: 'L6', geo: 'US_ZONE_2', rating: 'CONSISTENTLY_MEETS', currentBase: 275000, proposedBase: 286000, ipf: 1.00, equity: 1250, status: 'AUTO_APPROVED', selected: true, notes: 'Solid maintenance of vulnerability scanner pipelines.' },
      { id: 'EMP-1015', name: 'Tara Mendoza', role: 'Software Engineer III', level: 'L4', geo: 'US_ZONE_1', rating: 'STRONGLY_OUTPERFORMS', currentBase: 190000, proposedBase: 208000, ipf: 1.25, equity: 850, status: 'AUTO_APPROVED', selected: true, notes: 'Re-architected distributed tracing collector.' },
    ],

    // Candidate Offers Pipeline
    offers: [
      { id: 'OFF-2026-001', name: 'Cassandra Vance', role: 'Senior Distributed SWE', level: 'L5', geo: 'US_ZONE_1', base: 245000, signon: 35000, equity: 1000, status: 'OFFER_DRAFT', targetBonusPct: 15, notes: 'Top candidate from leading cloud infrastructure provider.' },
      { id: 'OFF-2026-002', name: 'Marcus Sterling Jr.', role: 'Staff Kernel Systems Architect', level: 'L6', geo: 'US_ZONE_1', base: 320000, signon: 65000, equity: 1600, status: 'VP_EXCEPTION_REQUIRED', targetBonusPct: 20, notes: 'Sign-on $65,000 > $50,000 threshold requires VP approval.' },
      { id: 'OFF-2026-003', name: 'Lillian Chen', role: 'Software Engineer III', level: 'L4', geo: 'US_ZONE_2', base: 185000, signon: 20000, equity: 650, status: 'AUDIT_PENDING', targetBonusPct: 15, notes: 'Strong algorithms and distributed cache expertise.' },
      { id: 'OFF-2026-004', name: 'Vikram Mehta', role: 'Principal AI Infrastructure Lead', level: 'L7', geo: 'US_ZONE_1', base: 390000, signon: 50000, equity: 2400, status: 'OFFER_APPROVED', targetBonusPct: 25, notes: 'Executive VP approved. Offer letter ready to extend.' },
      { id: 'OFF-2026-005', name: 'Fiona Gallagher', role: 'Software Engineer II', level: 'L3', geo: 'US_ZONE_1', base: 165000, signon: 15000, equity: 450, status: 'OFFER_ACCEPTED', targetBonusPct: 10, notes: 'Candidate accepted offer. Start date scheduled for next month.' },
    ],
  },

  // ─── INITIALIZATION ───────────────────────────────────────────────────────
  init() {
    this.bindRouter();
    this.bindPersonaSwitcher();
    this.bindGatewayControls();
    this.bindToolbarAndFilters();
    this.bindDrawerEvents();
    this.bindOfferModalEvents();
    this.bindApiExplorerEvents();
    this.bindEtlPanelEvents();
    this.bindCounterSimulatorEvents();

    this.renderActiveRoute();
    this.renderBudgetHeaders();
    this.renderCalibrationTable();
    this.renderOfferPipeline();
    this.renderExceptionsQueue();
    this.renderSalaryMatrix();
    this.renderAnalyticsCharts();
  },

  // ─── HASH ROUTER ──────────────────────────────────────────────────────────
  bindRouter() {
    window.addEventListener('hashchange', () => {
      this.handleHashChange();
    });

    // Default route
    if (!window.location.hash) {
      window.location.hash = '#/planning';
    } else {
      this.handleHashChange();
    }
  },

  handleHashChange() {
    const rawHash = window.location.hash.replace('#/', '').replace('#', '');
    const validRoutes = ['planning', 'offers', 'exceptions', 'matrix', 'analytics', 'api'];
    this.state.activeRoute = validRoutes.includes(rawHash) ? rawHash : 'planning';
    this.renderActiveRoute();
  },

  renderActiveRoute() {
    const current = this.state.activeRoute;
    document.querySelectorAll('.sidebar-link').forEach(link => {
      if (link.getAttribute('data-route') === current) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    document.querySelectorAll('.workspace-view').forEach(view => {
      if (view.id === `view-${current}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Close overlays if open
    document.getElementById('drawer-overlay')?.classList.remove('open');
    document.getElementById('calibration-drawer')?.classList.remove('open');
    document.getElementById('offer-modal-overlay')?.classList.remove('open');
    document.getElementById('offer-modal')?.classList.remove('open');

    if (current === 'analytics') {
      setTimeout(() => this.renderAnalyticsCharts(), 50);
    }
  },

  bindPersonaSwitcher() {
    const select = document.getElementById('persona-select');
    if (!select) return;
    select.addEventListener('change', (e) => {
      this.state.activePersona = e.target.value;
    });
  },

  // ─── MATHEMATICAL & POLICY TOOLS ──────────────────────────────────────────
  getAdjustedBand(level, geo) {
    const base = this.state.bands[level] || this.state.bands.L5;
    const factor = this.state.geoFactors[geo] || 1.0;
    return {
      min: Math.round(base.min * factor),
      mid: Math.round(base.mid * factor),
      max: Math.round(base.max * factor),
      targetEquity: base.targetEquity,
      bonusPct: base.bonusPct,
    };
  },

  calculateBonus(baseSalary, bonusTargetPct, ipf) {
    const cpf = this.state.departmentBudget.cpf;
    return Math.round(baseSalary * (bonusTargetPct / 100) * ipf * cpf);
  },

  getMarketBenchmark(level, geo) {
    const geoMult = this.state.geoFactors[geo] || 1.0;
    const baseMap = {
      L3: { p10: 135000, p25: 150000, p50: 165000, p75: 180000, p90: 195000, radford: 'P1' },
      L4: { p10: 165000, p25: 185000, p50: 205000, p75: 225000, p90: 245000, radford: 'P2' },
      L5: { p10: 205000, p25: 230000, p50: 255000, p75: 280000, p90: 305000, radford: 'P3' },
      L6: { p10: 255000, p25: 285000, p50: 315000, p75: 350000, p90: 385000, radford: 'P4' },
      L7: { p10: 315000, p25: 355000, p50: 395000, p75: 440000, p90: 490000, radford: 'P5' },
      L8: { p10: 395000, p25: 445000, p50: 500000, p75: 560000, p90: 630000, radford: 'P6' },
    };
    const b = baseMap[level] || baseMap.L5;
    return {
      p10: Math.round(b.p10 * geoMult),
      p25: Math.round(b.p25 * geoMult),
      p50: Math.round(b.p50 * geoMult),
      p75: Math.round(b.p75 * geoMult),
      p90: Math.round(b.p90 * geoMult),
      radford: b.radford,
    };
  },

  calculateMarketPercentile(base, bench) {
    if (base <= bench.p10) return Math.max(Math.round((base / bench.p10) * 10), 1);
    if (base <= bench.p25) return Math.round(10 + ((base - bench.p10) / (bench.p25 - bench.p10)) * 15);
    if (base <= bench.p50) return Math.round(25 + ((base - bench.p25) / (bench.p50 - bench.p25)) * 25);
    if (base <= bench.p75) return Math.round(50 + ((base - bench.p50) / (bench.p75 - bench.p50)) * 25);
    if (base <= bench.p90) return Math.round(75 + ((base - bench.p75) / (bench.p90 - bench.p75)) * 15);
    return Math.min(Math.round(90 + ((base - bench.p90) / bench.p90) * 10), 99);
  },

  calculateOfferWinRate(percentile) {
    const k = 0.05;
    const midpoint = 45.0;
    const val = 1.0 / (1.0 + Math.exp(-k * (percentile - midpoint)));
    return Math.min(Math.max(Math.round(val * 100), 10), 98);
  },


  // ─── BUDGET DEPLETION HEADER ──────────────────────────────────────────────
  renderBudgetHeaders() {
    let totalMeritSpent = 0;
    let totalBonusSpent = 0;
    let totalEquitySpent = 0;

    this.state.employees.forEach(emp => {
      const raise = emp.proposedBase - emp.currentBase;
      if (raise > 0) totalMeritSpent += raise;

      const band = this.getAdjustedBand(emp.level, emp.geo);
      const bonus = this.calculateBonus(emp.proposedBase, band.bonusPct, emp.ipf);
      totalBonusSpent += bonus;

      totalEquitySpent += emp.equity;
    });

    const allocMerit = this.state.departmentBudget.allocatedMerit;
    const allocBonus = this.state.departmentBudget.allocatedBonus;
    const allocEquity = this.state.departmentBudget.allocatedEquity;

    const meritPct = ((totalMeritSpent / allocMerit) * 100).toFixed(1);
    const bonusPct = ((totalBonusSpent / allocBonus) * 100).toFixed(1);
    const equityPct = ((totalEquitySpent / allocEquity) * 100).toFixed(1);

    document.getElementById('hdr-merit-spent').textContent = `$${totalMeritSpent.toLocaleString()}`;
    document.getElementById('hdr-merit-alloc').textContent = `$${allocMerit.toLocaleString()}`;
    document.getElementById('hdr-merit-pct').textContent = `${meritPct}% Depleted`;
    document.getElementById('hdr-merit-rem').textContent = `$${Math.max(0, allocMerit - totalMeritSpent).toLocaleString()} Remaining`;

    const barMerit = document.getElementById('hdr-bar-merit');
    barMerit.style.width = `${Math.min(parseFloat(meritPct), 100)}%`;
    barMerit.className = `gauge-bar-fill ${parseFloat(meritPct) > 100 ? 'fill-rose' : (parseFloat(meritPct) > 85 ? 'fill-amber' : 'fill-emerald')}`;

    document.getElementById('hdr-bonus-spent').textContent = `$${totalBonusSpent.toLocaleString()}`;
    document.getElementById('hdr-bonus-alloc').textContent = `$${allocBonus.toLocaleString()}`;
    document.getElementById('hdr-bonus-pct').textContent = `${bonusPct}% Funded`;

    document.getElementById('hdr-equity-spent').textContent = `${totalEquitySpent.toLocaleString()}`;
    document.getElementById('hdr-equity-alloc').textContent = `${allocEquity.toLocaleString()} RSUs`;
    document.getElementById('hdr-equity-pct').textContent = `${equityPct}% Allocated`;
    document.getElementById('hdr-equity-rem').textContent = `${Math.max(0, allocEquity - totalEquitySpent).toLocaleString()} RSUs Left`;
    document.getElementById('hdr-bar-equity').style.width = `${Math.min(parseFloat(equityPct), 100)}%`;

    // Exception Badge Count in Sidebar
    const exceptionEmps = this.state.employees.filter(e => e.status === 'VP_EXCEPTION_REQUIRED').length;
    const exceptionOffers = this.state.offers.filter(o => o.status === 'VP_EXCEPTION_REQUIRED').length;
    document.getElementById('badge-exception-count').textContent = exceptionEmps + exceptionOffers;
  },

  // ─── VIEW 1: CALIBRATION TABLE ────────────────────────────────────────────
  renderCalibrationTable() {
    const tbody = document.getElementById('calibration-tbody');
    if (!tbody) return;

    const searchTerm = (document.getElementById('roster-search')?.value || '').toLowerCase();
    const filterLvl = document.getElementById('filter-level')?.value || 'ALL';
    const filterStat = document.getElementById('filter-status')?.value || 'ALL';
    const filterRat = document.getElementById('filter-rating')?.value || 'ALL';

    tbody.innerHTML = '';

    const filtered = this.state.employees.filter(emp => {
      const matchSearch = emp.name.toLowerCase().includes(searchTerm) || emp.id.toLowerCase().includes(searchTerm) || emp.role.toLowerCase().includes(searchTerm);
      const matchLvl = filterLvl === 'ALL' || emp.level === filterLvl;
      const matchStat = filterStat === 'ALL' || emp.status === filterStat;
      const matchRat = filterRat === 'ALL' || emp.rating === filterRat;
      return matchSearch && matchLvl && matchStat && matchRat;
    });

    filtered.forEach(emp => {
      const band = this.getAdjustedBand(emp.level, emp.geo);
      const compa = (emp.proposedBase / band.mid).toFixed(3);
      const raisePct = (((emp.proposedBase - emp.currentBase) / emp.currentBase) * 100).toFixed(1);
      const bonusAmt = this.calculateBonus(emp.proposedBase, band.bonusPct, emp.ipf);

      // Mini compa dot position (0.75x to 1.25x range normalized to 0% - 100%)
      const normalizedCompaPct = Math.min(Math.max(((parseFloat(compa) - 0.75) / 0.50) * 100, 5), 95);
      const dotColorClass = parseFloat(compa) > 1.15 ? 'dot-amber' : (parseFloat(compa) < 0.85 ? 'dot-rose' : 'dot-green');

      let statusBadge = `<span class="badge badge-success">Auto-Approved</span>`;
      if (emp.status === 'VP_EXCEPTION_REQUIRED') {
        statusBadge = `<span class="badge badge-warning">VP Exception</span>`;
      } else if (emp.status === 'REJECTED') {
        statusBadge = `<span class="badge badge-danger">Rejected</span>`;
      } else if (emp.status === 'DRAFT') {
        statusBadge = `<span class="badge badge-draft">Draft</span>`;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="th-chk" onclick="event.stopPropagation()"><input type="checkbox" class="emp-chk" data-id="${emp.id}" ${emp.selected ? 'checked' : ''}></td>
        <td>
          <div class="emp-cell">
            <div class="emp-avatar">${emp.name.split(' ').map(n => n[0]).join('')}</div>
            <div class="emp-details">
              <strong>${emp.name}</strong>
              <span>${emp.role}</span>
            </div>
          </div>
        </td>
        <td><strong>${emp.level}</strong> <span style="font-size:0.7rem; color:var(--text-muted);">(${emp.geo.replace('US_', '')})</span></td>
        <td><span class="badge ${emp.rating === 'SUPERB' ? 'badge-success' : (emp.rating === 'NEEDS_IMPROVEMENT' ? 'badge-danger' : 'badge-draft')}">${emp.rating.replace('_', ' ')}</span></td>
        <td style="font-family:var(--font-mono);">$${emp.currentBase.toLocaleString()}</td>
        <td>
          <div class="compa-cell-box">
            <span class="compa-val">${compa}</span>
            <div class="mini-compa-track">
              <div class="mini-compa-dot ${dotColorClass}" style="left: ${normalizedCompaPct}%;"></div>
            </div>
          </div>
        </td>
        <td onclick="event.stopPropagation()">
          <input type="number" class="inline-input-sal" data-id="${emp.id}" value="${emp.proposedBase}" step="1000">
          <span class="inline-raise-tag ${parseFloat(raisePct) > 15 ? 'warn' : ''}">+${raisePct}%</span>
        </td>
        <td style="font-family:var(--font-mono);">$${bonusAmt.toLocaleString()} <span style="font-size:0.65rem; color:var(--text-muted);">(${emp.ipf}x)</span></td>
        <td style="font-family:var(--font-mono);">${emp.equity.toLocaleString()} RSUs</td>
        <td>${statusBadge}</td>
        <td onclick="event.stopPropagation()">
          <button class="btn btn-xs btn-outline btn-audit-single" data-id="${emp.id}">⚡ Audit</button>
        </td>
      `;

      tr.addEventListener('click', () => {
        this.openCalibrationDrawer(emp.id);
      });

      tbody.appendChild(tr);
    });

    this.bindTableInlineEvents();
  },

  bindTableInlineEvents() {
    document.querySelectorAll('.inline-input-sal').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        const val = parseFloat(e.target.value) || 0;
        const emp = this.state.employees.find(x => x.id === id);
        if (emp) {
          emp.proposedBase = val;
          this.auditSingleProposal(emp);
          this.renderBudgetHeaders();
          this.renderCalibrationTable();
          this.renderExceptionsQueue();
        }
      });
    });

    document.querySelectorAll('.btn-audit-single').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const emp = this.state.employees.find(x => x.id === id);
        if (emp) {
          this.auditSingleProposal(emp);
          this.renderBudgetHeaders();
          this.renderCalibrationTable();
          this.renderExceptionsQueue();
          this.openCalibrationDrawer(emp.id);
        }
      });
    });

    document.querySelectorAll('.emp-chk').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        const emp = this.state.employees.find(x => x.id === id);
        if (emp) emp.selected = e.target.checked;
      });
    });
  },

  auditSingleProposal(emp) {
    const band = this.getAdjustedBand(emp.level, emp.geo);
    const compa = parseFloat((emp.proposedBase / band.mid).toFixed(3));
    const raisePct = emp.currentBase > 0 ? ((emp.proposedBase - emp.currentBase) / emp.currentBase) * 100 : 0;

    if (emp.rating === 'NEEDS_IMPROVEMENT' && emp.proposedBase > emp.currentBase) {
      emp.status = 'REJECTED';
    } else if (compa > 1.15 || raisePct > 15.0 || emp.equity > band.targetEquity * 1.5) {
      emp.status = 'VP_EXCEPTION_REQUIRED';
    } else {
      emp.status = 'AUTO_APPROVED';
    }
  },

  bindToolbarAndFilters() {
    const search = document.getElementById('roster-search');
    const fLvl = document.getElementById('filter-level');
    const fStat = document.getElementById('filter-status');
    const fRat = document.getElementById('filter-rating');

    [search, fLvl, fStat, fRat].forEach(el => {
      if (el) el.addEventListener('input', () => this.renderCalibrationTable());
    });

    document.getElementById('chk-select-all')?.addEventListener('change', (e) => {
      const checked = e.target.checked;
      this.state.employees.forEach(emp => emp.selected = checked);
      this.renderCalibrationTable();
    });

    document.getElementById('btn-batch-audit')?.addEventListener('click', () => {
      this.state.employees.filter(e => e.selected).forEach(emp => {
        this.auditSingleProposal(emp);
      });
      this.renderBudgetHeaders();
      this.renderCalibrationTable();
      this.renderExceptionsQueue();
    });

    document.getElementById('btn-apply-baseline')?.addEventListener('click', () => {
      this.state.employees.forEach(emp => {
        if (emp.rating !== 'NEEDS_IMPROVEMENT') {
          emp.proposedBase = Math.round(emp.currentBase * 1.045 / 1000) * 1000;
          this.auditSingleProposal(emp);
        }
      });
      this.renderBudgetHeaders();
      this.renderCalibrationTable();
      this.renderBudgetHeaders();
    });
  },

  // ─── SLIDE-OUT DRAWER ─────────────────────────────────────────────────────
  openCalibrationDrawer(empId) {
    const emp = this.state.employees.find(x => x.id === empId);
    if (!emp) return;
    this.state.selectedEmpId = empId;

    const band = this.getAdjustedBand(emp.level, emp.geo);
    const compa = (emp.proposedBase / band.mid).toFixed(3);

    document.getElementById('drawer-emp-name').textContent = emp.name;
    document.getElementById('drawer-emp-role').textContent = `${emp.level} • ${emp.role} • ${emp.geo}`;

    document.getElementById('drw-band-min').textContent = `$${(band.min / 1000).toFixed(0)}k (Min)`;
    document.getElementById('drw-band-mid').textContent = `$${(band.mid / 1000).toFixed(0)}k (Mid)`;
    document.getElementById('drw-band-max').textContent = `$${(band.max / 1000).toFixed(0)}k (Max)`;

    const markerPct = Math.min(Math.max(((emp.proposedBase - band.min) / (band.max - band.min)) * 100, 0), 100);
    document.getElementById('drw-band-marker').style.left = `${markerPct}%`;
    document.getElementById('drw-compa-val').textContent = compa;

    const tag = document.getElementById('drw-compa-tag');
    if (parseFloat(compa) > 1.15) {
      tag.className = 'badge badge-warning';
      tag.textContent = 'High Compa (VP Exception)';
    } else if (parseFloat(compa) < 0.85) {
      tag.className = 'badge badge-danger';
      tag.textContent = 'Below Band Floor';
    } else {
      tag.className = 'badge badge-success';
      tag.textContent = 'In Band Compliant';
    }

    // Market Benchmark Placement (DOL / BLS)
    const bench = this.getMarketBenchmark(emp.level, emp.geo);
    const mPct = this.calculateMarketPercentile(emp.proposedBase, bench);
    const mCompa = (emp.proposedBase / bench.p50).toFixed(3);
    const mSpread = bench.p90 - bench.p10;
    const mPenetration = mSpread > 0 ? (((emp.proposedBase - bench.p10) / mSpread) * 100).toFixed(1) : '50.0';

    document.getElementById('drw-market-percentile-badge').textContent = `${mPct}th Percentile (${bench.radford})`;
    document.getElementById('drw-market-bar-fill').style.width = `${mPct}%`;
    document.getElementById('drw-market-marker').style.left = `${mPct}%`;
    document.getElementById('drw-market-p10').textContent = `$${(bench.p10 / 1000).toFixed(0)}k`;
    document.getElementById('drw-market-p50').textContent = `$${(bench.p50 / 1000).toFixed(0)}k`;
    document.getElementById('drw-market-p90').textContent = `$${(bench.p90 / 1000).toFixed(0)}k`;
    document.getElementById('drw-market-penetration').textContent = `${mPenetration}%`;
    document.getElementById('drw-market-compa').textContent = mCompa;

    document.getElementById('drw-input-base').value = emp.proposedBase;
    document.getElementById('drw-input-rating').value = emp.rating;
    document.getElementById('drw-input-ipf').value = emp.ipf;
    document.getElementById('drw-input-equity').value = emp.equity;
    document.getElementById('drw-input-notes').value = emp.notes || '';

    // Render ReAct Log
    const logBox = document.getElementById('drw-audit-log');
    logBox.innerHTML = `
      <div class="log-entry log-dim">[System] Evaluating ${emp.name} (${emp.level}, ${emp.geo}) against target bands.</div>
      <div class="log-entry log-tool">[Tool] calculate_compa_ratio(proposed=$${emp.proposedBase.toLocaleString()}, mid=$${band.mid.toLocaleString()}) -> ${compa}</div>
      <div class="log-entry ${emp.proposedBase <= band.max ? 'log-pass' : 'log-fail'}">[Finding] verify_salary_band: ${emp.proposedBase <= band.max ? 'PASS' : 'FAIL'} (Band Ceiling: $${band.max.toLocaleString()})</div>
      <div class="log-entry log-tool">[Tool] calculate_bonus(base=$${emp.proposedBase.toLocaleString()}, target=${band.bonusPct}%, IPF=${emp.ipf}x, CPF=1.05x) -> $${this.calculateBonus(emp.proposedBase, band.bonusPct, emp.ipf).toLocaleString()}</div>
      <div class="log-entry log-tool">[Tool] evaluate_equity_guidelines(rsus=${emp.equity.toLocaleString()}, target=${band.targetEquity}) -> ${(emp.equity / band.targetEquity).toFixed(2)}x</div>
      <div class="log-entry ${emp.status === 'AUTO_APPROVED' ? 'log-pass' : 'log-warn'}">[Agent Synthesis] Outcome: ${emp.status}</div>
    `;

    document.getElementById('drawer-overlay').classList.add('open');
    document.getElementById('calibration-drawer').classList.add('open');
  },

  bindDrawerEvents() {
    const closeDrawer = () => {
      document.getElementById('drawer-overlay').classList.remove('open');
      document.getElementById('calibration-drawer').classList.remove('open');
    };

    document.getElementById('btn-close-drawer')?.addEventListener('click', closeDrawer);
    document.getElementById('drawer-overlay')?.addEventListener('click', closeDrawer);

    document.getElementById('drw-btn-save')?.addEventListener('click', () => {
      if (!this.state.selectedEmpId) return;
      const emp = this.state.employees.find(x => x.id === this.state.selectedEmpId);
      if (emp) {
        emp.proposedBase = parseFloat(document.getElementById('drw-input-base').value) || emp.currentBase;
        emp.rating = document.getElementById('drw-input-rating').value;
        emp.ipf = parseFloat(document.getElementById('drw-input-ipf').value) || 1.0;
        emp.equity = parseInt(document.getElementById('drw-input-equity').value, 10) || 0;
        emp.notes = document.getElementById('drw-input-notes').value;

        this.auditSingleProposal(emp);
        this.renderBudgetHeaders();
        this.renderCalibrationTable();
        this.renderExceptionsQueue();
        closeDrawer();
      }
    });

    document.getElementById('drw-btn-audit')?.addEventListener('click', () => {
      if (!this.state.selectedEmpId) return;
      const emp = this.state.employees.find(x => x.id === this.state.selectedEmpId);
      if (emp) {
        emp.proposedBase = parseFloat(document.getElementById('drw-input-base').value) || emp.currentBase;
        emp.rating = document.getElementById('drw-input-rating').value;
        emp.ipf = parseFloat(document.getElementById('drw-input-ipf').value) || 1.0;
        emp.equity = parseInt(document.getElementById('drw-input-equity').value, 10) || 0;
        this.auditSingleProposal(emp);
        this.openCalibrationDrawer(emp.id);
      }
    });
  },

  // ─── VIEW 2: CANDIDATE OFFER PIPELINE ─────────────────────────────────────
  renderOfferPipeline() {
    const cols = {
      OFFER_DRAFT: document.getElementById('list-offer-draft'),
      AUDIT_PENDING: document.getElementById('list-offer-audit'),
      VP_EXCEPTION_REQUIRED: document.getElementById('list-offer-vp'),
      OFFER_APPROVED: document.getElementById('list-offer-approved'),
      OFFER_ACCEPTED: document.getElementById('list-offer-accepted'),
    };

    Object.values(cols).forEach(col => { if (col) col.innerHTML = ''; });

    const counts = { OFFER_DRAFT: 0, AUDIT_PENDING: 0, VP_EXCEPTION_REQUIRED: 0, OFFER_APPROVED: 0, OFFER_ACCEPTED: 0 };

    this.state.offers.forEach(offer => {
      counts[offer.status] = (counts[offer.status] || 0) + 1;
      const colEl = cols[offer.status];
      if (!colEl) return;

      const band = this.getAdjustedBand(offer.level, offer.geo);
      const targetBonus = Math.round(offer.base * (offer.targetBonusPct / 100));
      const ttc = offer.base + targetBonus;
      const y1tc = ttc + offer.signon;

      const card = document.createElement('div');
      card.className = 'offer-card';
      card.innerHTML = `
        <div class="offer-card-top">
          <div>
            <div class="candidate-name">${offer.name}</div>
            <div class="offer-role-tag">${offer.level} • ${offer.role}</div>
          </div>
          <span class="badge ${offer.status === 'VP_EXCEPTION_REQUIRED' ? 'badge-warning' : (offer.status === 'OFFER_ACCEPTED' ? 'badge-success' : 'badge-draft')}">${offer.geo.replace('US_', '')}</span>
        </div>
        <div class="offer-comp-grid">
          <div><span>Base:</span> <strong>$${offer.base.toLocaleString()}</strong></div>
          <div><span>Sign-on:</span> <strong style="${offer.signon > 50000 ? 'color:var(--accent-rose);' : ''}">$${offer.signon.toLocaleString()}</strong></div>
          <div><span>TTC:</span> <strong>$${ttc.toLocaleString()}</strong></div>
          <div><span>1st Yr Direct:</span> <strong style="color:var(--accent-emerald);">$${y1tc.toLocaleString()}</strong></div>
        </div>
        <div class="offer-card-actions">
          ${offer.status === 'OFFER_DRAFT' ? `<button class="btn btn-xs btn-primary btn-trans-offer" data-id="${offer.id}" data-target="AUDIT_PENDING">⚡ Audit</button>` : ''}
          ${offer.status === 'AUDIT_PENDING' ? `<button class="btn btn-xs btn-primary btn-trans-offer" data-id="${offer.id}" data-target="${offer.signon > 50000 ? 'VP_EXCEPTION_REQUIRED' : 'OFFER_APPROVED'}">Evaluate Policy</button>` : ''}
          ${offer.status === 'VP_EXCEPTION_REQUIRED' ? `<button class="btn btn-xs btn-warning btn-trans-offer" data-id="${offer.id}" data-target="OFFER_APPROVED">✍️ Sign VP</button>` : ''}
          ${offer.status === 'OFFER_APPROVED' ? `<button class="btn btn-xs btn-primary btn-trans-offer" data-id="${offer.id}" data-target="OFFER_EXTENDED">📨 Extend</button>` : ''}
          ${offer.status === 'OFFER_EXTENDED' ? `<button class="btn btn-xs btn-success btn-trans-offer" data-id="${offer.id}" data-target="OFFER_ACCEPTED">🎉 Accept</button>` : ''}
          ${offer.status === 'OFFER_ACCEPTED' ? `<span class="badge badge-success">✓ Onboarding</span>` : ''}
        </div>
      `;

      colEl.appendChild(card);
    });

    document.getElementById('count-offer-draft').textContent = counts.OFFER_DRAFT || 0;
    document.getElementById('count-offer-audit').textContent = counts.AUDIT_PENDING || 0;
    document.getElementById('count-offer-vp').textContent = counts.VP_EXCEPTION_REQUIRED || 0;
    document.getElementById('count-offer-approved').textContent = counts.OFFER_APPROVED || 0;
    document.getElementById('count-offer-accepted').textContent = counts.OFFER_ACCEPTED || 0;
    document.getElementById('badge-offers-count').textContent = this.state.offers.length;

    this.bindOfferCardActions();
  },

  bindOfferCardActions() {
    document.querySelectorAll('.btn-trans-offer').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const target = btn.getAttribute('data-target');
        const offer = this.state.offers.find(x => x.id === id);
        if (offer) {
          offer.status = target;
          this.renderOfferPipeline();
          this.renderExceptionsQueue();
          this.renderBudgetHeaders();
        }
      });
    });
  },

  bindOfferModalEvents() {
    const modal = document.getElementById('offer-modal');
    const overlay = document.getElementById('offer-modal-overlay');
    const recalculateModalComp = () => {
      const level = document.getElementById('m-job-level')?.value || 'L5';
      const geo = document.getElementById('m-geo-tier')?.value || 'US_ZONE_1';
      const base = parseFloat(document.getElementById('m-proposed-base')?.value) || 240000;
      const signon = parseFloat(document.getElementById('m-signon-bonus')?.value) || 0;
      const equityEl = document.getElementById('m-equity-rsus') || document.getElementById('m-equity-gsus');
      const equity = parseInt(equityEl ? equityEl.value : '0', 10) || 1000;

      const band = this.getAdjustedBand(level, geo);
      const bench = this.getMarketBenchmark(level, geo);
      const targetBonus = Math.round(base * (band.bonusPct / 100));
      const ttc = base + targetBonus;
      const y1EquityVal = Math.round(equity * (1 / 3) * 150);
      const y1tc = ttc + signon + y1EquityVal;

      const mPct = this.calculateMarketPercentile(base, bench);
      const winRate = this.calculateOfferWinRate(mPct);

      const elBonus = document.getElementById('m-calc-bonus');
      const elTtc = document.getElementById('m-calc-ttc');
      const elY1tc = document.getElementById('m-calc-y1tc');
      const elWinrate = document.getElementById('m-calc-winrate');
      const elWinrateFill = document.getElementById('m-winrate-fill');
      const elPct = document.getElementById('m-calc-pct');

      if (elBonus) elBonus.textContent = `$${targetBonus.toLocaleString()}`;
      if (elTtc) elTtc.textContent = `$${ttc.toLocaleString()}`;
      if (elY1tc) elY1tc.textContent = `$${y1tc.toLocaleString()}`;
      if (elWinrate) elWinrate.textContent = `${winRate}% Win-Rate Probability`;
      if (elWinrateFill) elWinrateFill.style.width = `${winRate}%`;
      if (elPct) elPct.textContent = `${mPct}th`;
    };

    ['m-job-level', 'm-geo-tier', 'm-proposed-base', 'm-signon-bonus', 'm-equity-rsus', 'm-equity-gsus'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', recalculateModalComp);
      document.getElementById(id)?.addEventListener('change', recalculateModalComp);
    });

    const openModal = () => {
      recalculateModalComp();
      modal.classList.add('open');
      overlay.classList.add('open');
    };
    const closeModal = () => {
      modal.classList.remove('open');
      overlay.classList.remove('open');
    };

    document.getElementById('btn-open-offer-builder')?.addEventListener('click', openModal);
    document.getElementById('btn-close-offer-modal')?.addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal')?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', closeModal);

    document.getElementById('modal-offer-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('m-candidate-name').value;
      const level = document.getElementById('m-job-level').value;
      const geo = document.getElementById('m-geo-tier').value;
      const base = parseFloat(document.getElementById('m-proposed-base').value) || 200000;
      const signon = parseFloat(document.getElementById('m-signon-bonus').value) || 0;
      const eqEl = document.getElementById('m-equity-rsus') || document.getElementById('m-equity-gsus');
      const equity = parseInt(eqEl ? eqEl.value : '0', 10) || 1000;

      const band = this.getAdjustedBand(level, geo);
      const newOffer = {
        id: `OFF-2026-00${this.state.offers.length + 1}`,
        name,
        role: `${level} Software Engineer`,
        level,
        geo,
        base,
        signon,
        equity,
        status: signon > 50000 ? 'VP_EXCEPTION_REQUIRED' : 'OFFER_APPROVED',
        targetBonusPct: band.bonusPct,
        notes: 'Modeled in Offer Studio.',
      };

      this.state.offers.unshift(newOffer);
      this.renderOfferPipeline();
      this.renderExceptionsQueue();
      this.renderBudgetHeaders();
      closeModal();
    });
  },

  // ─── VIEW 3: EXCEPTIONS QUEUE ─────────────────────────────────────────────
  renderExceptionsQueue() {
    const grid = document.getElementById('exceptions-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const empExceptions = this.state.employees.filter(e => e.status === 'VP_EXCEPTION_REQUIRED');
    const offerExceptions = this.state.offers.filter(o => o.status === 'VP_EXCEPTION_REQUIRED');

    if (empExceptions.length === 0 && offerExceptions.length === 0) {
      grid.innerHTML = `
        <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
          <span style="font-size: 2rem;">✅</span>
          <h3 style="margin: 10px 0;">All Exceptions Cleared</h3>
          <p style="color: var(--text-muted);">No pending reviews or candidate offers currently breach standard compensation policy thresholds.</p>
        </div>
      `;
      return;
    }

    empExceptions.forEach(emp => {
      const band = this.getAdjustedBand(emp.level, emp.geo);
      const compa = (emp.proposedBase / band.mid).toFixed(3);
      const raisePct = (((emp.proposedBase - emp.currentBase) / emp.currentBase) * 100).toFixed(1);

      const card = document.createElement('div');
      card.className = 'exception-card';
      card.innerHTML = `
        <div>
          <div class="exception-header">
            <div>
              <div class="exception-title">${emp.name} (Review Proposal)</div>
              <div class="exception-subject">${emp.level} • ${emp.role} • ${emp.geo}</div>
            </div>
            <span class="badge badge-warning">Review Exception</span>
          </div>
          <div class="violation-chips">
            ${parseFloat(compa) > 1.15 ? `<span class="chip-warn">Compa-Ratio: ${compa} (&gt;1.15 limit)</span>` : ''}
            ${parseFloat(raisePct) > 10.0 ? `<span class="chip-warn">Merit Velocity: +${raisePct}% (&gt;10% target)</span>` : ''}
            ${emp.equity > band.targetEquity * 1.5 ? `<span class="chip-warn">Equity Grant: ${emp.equity} RSUs (&gt;1.5x guideline)</span>` : ''}
          </div>
          <div class="exception-rationale">
            <strong>Manager Justification:</strong> "${emp.notes || 'High performance and specialized technical leadership across strategic infrastructure deliverables.'}"
          </div>
        </div>
        <div class="exception-actions">
          <button class="btn btn-sm btn-success btn-approve-single-vp" data-type="emp" data-id="${emp.id}">✍️ Sign Exception</button>
          <button class="btn btn-sm btn-outline" onclick="CompFlowApp.openCalibrationDrawer('${emp.id}')">Inspect Profile</button>
        </div>
      `;
      grid.appendChild(card);
    });

    offerExceptions.forEach(offer => {
      const card = document.createElement('div');
      card.className = 'exception-card';
      card.innerHTML = `
        <div>
          <div class="exception-header">
            <div>
              <div class="exception-title">${offer.name} (Candidate Offer)</div>
              <div class="exception-subject">${offer.level} • ${offer.role} • ${offer.geo}</div>
            </div>
            <span class="badge badge-warning">Offer Exception</span>
          </div>
          <div class="violation-chips">
            ${offer.signon > 50000 ? `<span class="chip-warn">Sign-on: $${offer.signon.toLocaleString()} (&gt;$50,000 Cap)</span>` : ''}
          </div>
          <div class="exception-rationale">
            <strong>Recruiting Brief:</strong> "${offer.notes || 'Sign-on bonus structured to buy out candidate unvested equity tranche from competing offer.'}"
          </div>
        </div>
        <div class="exception-actions">
          <button class="btn btn-sm btn-success btn-approve-single-vp" data-type="offer" data-id="${offer.id}">✍️ Approve Sign-on Bonus</button>
        </div>
      `;
      grid.appendChild(card);
    });

    document.querySelectorAll('.btn-approve-single-vp').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        const id = btn.getAttribute('data-id');
        if (type === 'emp') {
          const emp = this.state.employees.find(x => x.id === id);
          if (emp) emp.status = 'AUTO_APPROVED';
        } else {
          const offer = this.state.offers.find(x => x.id === id);
          if (offer) offer.status = 'OFFER_APPROVED';
        }
        this.renderBudgetHeaders();
        this.renderCalibrationTable();
        this.renderOfferPipeline();
        this.renderExceptionsQueue();
      });
    });

    document.getElementById('btn-batch-approve-vp')?.addEventListener('click', () => {
      this.state.employees.forEach(e => { if (e.status === 'VP_EXCEPTION_REQUIRED') e.status = 'AUTO_APPROVED'; });
      this.state.offers.forEach(o => { if (o.status === 'VP_EXCEPTION_REQUIRED') o.status = 'OFFER_APPROVED'; });
      this.renderBudgetHeaders();
      this.renderCalibrationTable();
      this.renderOfferPipeline();
      this.renderExceptionsQueue();
    });
  },

  // ─── VIEW 4: SALARY MATRIX ────────────────────────────────────────────────
  renderSalaryMatrix() {
    const grid = document.getElementById('matrix-cards-grid');
    if (!grid) return;

    grid.innerHTML = '';

    document.querySelectorAll('.geo-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.geo-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.activeGeo = btn.getAttribute('data-geo');
        this.renderSalaryMatrix();
      });
    });

    const geo = this.state.activeGeo || 'US_ZONE_1';

    Object.entries(this.state.bands).forEach(([lvl, baseBand]) => {
      const band = this.getAdjustedBand(lvl, geo);
      const bench = this.getMarketBenchmark(lvl, geo);
      const card = document.createElement('div');
      card.className = 'band-card';
      card.innerHTML = `
        <div class="band-card-header">
          <div class="band-card-title">${lvl} SWE (Radford ${bench.radford})</div>
          <span class="badge badge-neutral">${geo.replace('US_', '')}</span>
        </div>
        <div class="band-range-visual">
          <div class="range-labels">
            <span>Min: $${(band.min / 1000).toFixed(0)}k</span>
            <span style="color:var(--text-primary); font-weight:700;">Mid: $${(band.mid / 1000).toFixed(0)}k</span>
            <span>Max: $${(band.max / 1000).toFixed(0)}k</span>
          </div>
          <div class="range-bar-track">
            <div class="range-bar-spread"></div>
            <div class="range-midpoint-notch"></div>
          </div>
        </div>
        <div class="percentiles-grid-5">
          <div class="p-col"><span>P10</span><strong>$${(bench.p10 / 1000).toFixed(0)}k</strong></div>
          <div class="p-col"><span>P25</span><strong>$${(bench.p25 / 1000).toFixed(0)}k</strong></div>
          <div class="p-col highlight-p50"><span>P50</span><strong>$${(bench.p50 / 1000).toFixed(0)}k</strong></div>
          <div class="p-col"><span>P75</span><strong>$${(bench.p75 / 1000).toFixed(0)}k</strong></div>
          <div class="p-col"><span>P90</span><strong>$${(bench.p90 / 1000).toFixed(0)}k</strong></div>
        </div>
        <div class="band-targets-list">
          <div>Bonus Target: <strong>${band.bonusPct}%</strong></div>
          <div>Equity Guideline: <strong>${band.targetEquity.toLocaleString()} RSUs</strong></div>
        </div>
      `;
      grid.appendChild(card);
    });
  },

  // ─── VIEW 5: EXECUTIVE ANALYTICS ──────────────────────────────────────────
  renderAnalyticsCharts() {
    const canvas = document.getElementById('compa-dist-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();

    // Gaussian bell curve for Compa Ratio [0.80 to 1.20]
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    const mean = 1.00;
    const stdDev = 0.08;
    for (let x = 0; x <= width - 50; x++) {
      const compaVal = 0.80 + (x / (width - 50)) * 0.40;
      const z = (compaVal - mean) / stdDev;
      const yNorm = Math.exp(-0.5 * z * z);
      const canvasY = (height - 35) - yNorm * (height - 70);

      const canvasX = 30 + x;
      if (x === 0) ctx.moveTo(canvasX, canvasY);
      else ctx.lineTo(canvasX, canvasY);
    }
    ctx.stroke();

    // Plot employee scatter points on the curve
    let sumCompa = 0;
    this.state.employees.forEach(emp => {
      const band = this.getAdjustedBand(emp.level, emp.geo);
      const c = emp.proposedBase / band.mid;
      sumCompa += c;

      const normX = Math.min(Math.max((c - 0.80) / 0.40, 0), 1);
      const ptX = 30 + normX * (width - 50);
      const z = (c - mean) / stdDev;
      const ptY = (height - 35) - Math.exp(-0.5 * z * z) * (height - 70);

      ctx.fillStyle = c > 1.15 ? '#f59e0b' : (c < 0.85 ? '#f43f5e' : '#10b981');
      ctx.beginPath();
      ctx.arc(ptX, ptY, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });

    const avg = (sumCompa / this.state.employees.length).toFixed(3);
    document.getElementById('val-avg-compa').textContent = avg;
  },

  // ─── VIEW 6: API EXPLORER ─────────────────────────────────────────────────
  bindApiExplorerEvents() {
    const resCode = document.getElementById('ep-res-code');

    document.querySelectorAll('.test-ep-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const ep = btn.getAttribute('data-ep');
        if (ep === 'login') {
          resCode.textContent = JSON.stringify({
            access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            token_type: "bearer",
            user_id: "u-1001-admin",
            user_role: "HR_ADMIN",
            expires_in_hours: 8
          }, null, 2);
        } else if (ep === 'bands') {
          resCode.textContent = JSON.stringify(this.state.bands, null, 2);
        } else if (ep === 'benchmarks') {
          resCode.textContent = JSON.stringify({
            job_family: "SOFTWARE_ENGINEERING",
            job_level: "L5",
            radford_level: "P3",
            geo_tier: "US_ZONE_1",
            currency: "USD",
            sample_size: 450,
            percentiles: {
              p10_base: "205000.00",
              p25_base: "230000.00",
              p50_base: "255000.00",
              p75_base: "280000.00",
              p90_base: "305000.00",
              target_bonus_pct: "15.00",
              p50_equity_rsus: 800,
              p75_equity_rsus: 1200
            },
            data_source: "US_DOL_OFLC_LCA_AND_BLS_OEWS",
            survey_year: 2026,
            annual_aging_rate: "0.040"
          }, null, 2);
        } else if (ep === 'compare') {
          resCode.textContent = JSON.stringify({
            compa_ratio: "1.020",
            range_penetration_pct: "62.5",
            market_percentile_rank: 74,
            estimated_offer_win_rate_pct: "82.1",
            within_band: true,
            total_target_cash: "276000.00",
            total_direct_comp_y1: "311000.00",
            benchmark_p50_base: "255000.00",
            data_source: "US_DOL_OFLC_LCA_AND_BLS_OEWS"
          }, null, 2);
        } else if (ep === 'proposals') {
          resCode.textContent = JSON.stringify({
            cycle_id: "CYC-2026-ANNUAL",
            employee_id: "EMP-1001",
            proposed_base: 335000,
            proposed_bonus: 78500,
            individual_perf_factor: 1.30,
            proposed_equity_rsus: 1800,
            performance_rating: "SUPERB"
          }, null, 2);
        } else if (ep === 'audit') {
          resCode.textContent = JSON.stringify({
            decision: "AUTO_APPROVED",
            compa_ratio: "1.080",
            velocity_pct: "+9.8%",
            equity_multiplier: "1.28x",
            status_transition: "DRAFT -> AUTO_APPROVED",
            audit_timestamp: new Date().toISOString()
          }, null, 2);
        } else if (ep === 'etl-dol') {
          resCode.textContent = JSON.stringify({
            job_id: "job-dol-f8319ba2",
            status: "SUCCESS",
            source_type: "DOL_OFLC",
            source_url: "https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/LCA_Disclosure_Data_FY2024_Q4.csv",
            fiscal_year: 2026,
            records_streamed: 1728,
            valid_observations: 1728,
            outliers_pruned_iqr: 109,
            cohorts_aggregated: 65,
            benchmarks_upserted: 65,
            antitrust_safe_harbor_discarded: 1,
            execution_time_seconds: 0.068,
            dry_run: false,
            timestamp: new Date().toISOString()
          }, null, 2);
        } else if (ep === 'sim-counter') {
          resCode.textContent = JSON.stringify({
            first_year_our_tdc: "367000.00",
            first_year_comp_tdc: "313750.00",
            first_year_tdc_delta: "+53250.00",
            four_year_our_tdc: "1280000.00",
            four_year_comp_tdc: "1215000.00",
            four_year_tdc_delta: "+65000.00",
            forfeiture_coverage_pct: "115.00",
            predicted_win_rate_pct: "84.5",
            win_rate_tier: "HIGHLY_COMPETITIVE",
            year_by_year: [
              { year: 1, our_cash: "307500.00", our_equity_value: "59400.00", our_tdc: "366900.00", comp_tdc: "313750.00", delta_tdc: "+53150.00" },
              { year: 2, our_cash: "270250.00", our_equity_value: "59400.00", our_tdc: "329650.00", comp_tdc: "298750.00", delta_tdc: "+30900.00" },
              { year: 3, our_cash: "270250.00", our_equity_value: "39600.00", our_tdc: "309850.00", comp_tdc: "298750.00", delta_tdc: "+11100.00" },
              { year: 4, our_cash: "270250.00", our_equity_value: "21600.00", our_tdc: "291850.00", comp_tdc: "298750.00", delta_tdc: "-6900.00" }
            ],
            recommended_counter: {
              recommended_base: "235000.00",
              recommended_signon: "45000.00",
              recommended_equity_rsus: 1800,
              target_win_rate_pct: "85.00",
              rationale: "Elevate sign-on bonus to $45,000 to neutralize near-term cash deficit, and expand equity grant to 1,800 RSUs to ensure long-term TDC superiority."
            },
            recruiter_talking_points: [
              "Front-Loaded Equity Advantage: Our enterprise 33/33/22/12 schedule vests 66% within the first 24 months, accelerating liquidity compared to competitor's linear schedule.",
              "Superior 4-Year Cumulative TDC: Our package delivers $65,000 more in total direct compensation over 4 years.",
              "Immediate Year 1 Outperformance: You realize $53,250 higher take-home compensation in your first 12 months between base, target bonus, and initial vesting tranches.",
              "Full Equity Forfeiture Protection: Our upfront buyout package fully covers (100%+) the $75,000 of unvested equity you leave behind."
            ]
          }, null, 2);
        } else if (ep === 'metrics') {
          resCode.textContent = `# HELP compflow_audit_requests_total Total count of deterministic calibration audits.\n# TYPE compflow_audit_requests_total counter\ncompflow_audit_requests_total{decision="AUTO_APPROVED"} 12\ncompflow_audit_requests_total{decision="VP_EXCEPTION_REQUIRED"} 3\n\n# HELP compflow_budget_depletion_ratio Budget depletion ratio\ncompflow_budget_depletion_ratio{department="Platform Engineering"} 0.577`;
        }
      });
    });

    document.getElementById('btn-ping-api')?.addEventListener('click', async () => {
      resCode.textContent = `Pinging ${this.apiGateway.baseUrl}/healthz...`;
      const res = await this.apiGateway.ping();
      if (res.ok) {
        resCode.textContent = `[Live K8s Microservice Response]\nGET ${this.apiGateway.baseUrl}/healthz\nStatus: 200 OK (${res.latencyMs}ms latency)\n\n` + JSON.stringify(res.data, null, 2);
      } else {
        resCode.textContent = `[Gateway Notice: Offline or LAN required]\nGET ${this.apiGateway.baseUrl}/healthz\nResult: ${res.error || 'HTTP ' + res.status}\n\nNote: The Talos bare-metal cluster ingress operates on the private homelab network (10.0.0.170). If browsing externally without Tailscale/VPN, CompFlow operates seamlessly in high-fidelity In-Browser Simulation mode.`;
      }
    });
  },

  // ─── HYBRID API GATEWAY ───────────────────────────────────────────────────
  apiGateway: {
    mode: 'SIMULATION', // 'SIMULATION' | 'LIVE_API'
    baseUrl: 'https://compflow.10.0.0.170.nip.io',
    isOnline: false,
    latencyMs: null,

    async ping() {
      const t0 = performance.now();
      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 3500);
        const res = await fetch(`${this.baseUrl}/healthz`, {
          signal: ctrl.signal,
          mode: 'cors'
        });
        clearTimeout(timeout);
        const elapsed = Math.round(performance.now() - t0);
        if (res.ok) {
          const data = await res.json();
          this.isOnline = true;
          this.latencyMs = elapsed;
          return { ok: true, data, latencyMs: elapsed };
        }
        this.isOnline = false;
        return { ok: false, status: res.status, latencyMs: elapsed };
      } catch (err) {
        this.isOnline = false;
        return { ok: false, error: err.message };
      }
    },

    async fetchBenchmark(family, level, geo) {
      if (this.mode !== 'LIVE_API') return null;
      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 3000);
        const res = await fetch(`${this.baseUrl}/api/v1/benchmarks/lookup?job_family=${family}&job_level=${level}&geo_tier=${geo}`, {
          signal: ctrl.signal,
          mode: 'cors'
        });
        clearTimeout(timeout);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('[CompFlow Gateway] Live benchmark lookup failed; using local simulation:', e);
      }
      return null;
    },

    async compareOffer(payload) {
      if (this.mode !== 'LIVE_API') return null;
      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 3000);
        const res = await fetch(`${this.baseUrl}/api/v1/benchmarks/compare`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: ctrl.signal,
          mode: 'cors'
        });
        clearTimeout(timeout);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('[CompFlow Gateway] Live offer compare failed; using local simulation:', e);
      }
      return null;
    },

    async triggerLiveDolEtl(dryRun = false, limit = 1728) {
      if (this.mode !== 'LIVE_API') return null;
      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 10000);
        const res = await fetch(`${this.baseUrl}/api/v1/benchmarks/etl/ingest-live-dol`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer compflow-master-service-key-2026'
          },
          body: JSON.stringify({ dry_run: dryRun, limit_records: limit, fiscal_year: 2026 }),
          signal: ctrl.signal,
          mode: 'cors'
        });
        clearTimeout(timeout);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('[CompFlow Gateway] Live ETL trigger failed; falling back to local simulation:', e);
      }
      return null;
    },

    async fetchLatestEtlReport() {
      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 3000);
        const res = await fetch(`${this.baseUrl}/api/v1/benchmarks/etl/latest-report`, {
          signal: ctrl.signal,
          mode: 'cors'
        });
        clearTimeout(timeout);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('[CompFlow Gateway] Fetch latest ETL report failed:', e);
      }
      return null;
    },

    async simulateCounterOffer(payload) {
      if (this.mode !== 'LIVE_API') return null;
      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 3500);
        const res = await fetch(`${this.baseUrl}/api/v1/offers/negotiation/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: ctrl.signal,
          mode: 'cors'
        });
        clearTimeout(timeout);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('[CompFlow Gateway] Live counter simulation failed; using local simulation:', e);
      }
      return null;
    }
  },

  bindGatewayControls() {
    const modeSelect = document.getElementById('gateway-mode-select');
    const statusPill = document.getElementById('global-api-status');
    const statusIndicator = document.getElementById('global-api-indicator');
    const statusText = document.getElementById('global-api-text');

    const updatePill = async (userInitiated = false) => {
      if (this.apiGateway.mode === 'SIMULATION') {
        if (statusIndicator) statusIndicator.className = 'health-indicator online';
        if (statusText) statusText.textContent = 'Sim Active';
        if (statusPill) statusPill.title = 'In-Browser Deterministic Engine Active (Click to ping K8s)';
      } else {
        if (statusText) statusText.textContent = 'Probing K8s...';
        if (statusIndicator) statusIndicator.className = 'health-indicator warn';
        const health = await this.apiGateway.ping();
        if (health.ok) {
          if (statusIndicator) statusIndicator.className = 'health-indicator online';
          if (statusText) statusText.textContent = `K8s Online (${health.latencyMs}ms)`;
          if (statusPill) statusPill.title = `Connected to ${this.apiGateway.baseUrl} (${health.latencyMs}ms)`;
        } else {
          if (statusIndicator) statusIndicator.className = 'health-indicator offline';
          if (statusText) statusText.textContent = 'K8s Offline (Sim Fallback)';
          if (statusPill) statusPill.title = `Cannot reach ${this.apiGateway.baseUrl} - homelab network/VPN required. Local simulator will handle requests seamlessly.`;
        }
      }
    };

    modeSelect?.addEventListener('change', (e) => {
      this.apiGateway.mode = e.target.value;
      updatePill(true);
    });

    statusPill?.addEventListener('click', () => {
      if (this.apiGateway.mode === 'SIMULATION') {
        if (modeSelect) modeSelect.value = 'LIVE_API';
        this.apiGateway.mode = 'LIVE_API';
      }
      updatePill(true);
    });

    // Run initial health check in background
    setTimeout(() => updatePill(false), 500);
  },

  bindEtlPanelEvents() {
    const btnTrigger = document.getElementById('btn-trigger-dol-etl');
    const btnRefresh = document.getElementById('btn-refresh-etl-status');
    const terminal = document.getElementById('etl-log-terminal');

    const appendLog = (msg, cls = '') => {
      if (!terminal) return;
      const line = document.createElement('div');
      line.className = `terminal-line ${cls}`;
      line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
      terminal.appendChild(line);
      terminal.scrollTop = terminal.scrollHeight;
    };

    const updateStats = (records, outliers, cohorts, latency) => {
      const elRec = document.getElementById('etl-stat-records');
      const elOut = document.getElementById('etl-stat-outliers');
      const elCoh = document.getElementById('etl-stat-cohorts');
      const elLat = document.getElementById('etl-stat-latency');
      if (elRec) elRec.textContent = records.toLocaleString();
      if (elOut) elOut.textContent = outliers.toLocaleString();
      if (elCoh) elCoh.textContent = cohorts.toLocaleString();
      if (elLat) elLat.textContent = latency;
    };

    btnTrigger?.addEventListener('click', async () => {
      btnTrigger.disabled = true;
      appendLog('Initiating US Department of Labor OFLC H-1B stream ingestion...', 'terminal-highlight');

      if (this.apiGateway.mode === 'LIVE_API') {
        appendLog(`Connecting to live Talos microservice: POST ${this.apiGateway.baseUrl}/api/v1/benchmarks/etl/ingest-live-dol`, 'terminal-line');
        const report = await this.apiGateway.triggerLiveDolEtl(false, 1728);
        if (report) {
          appendLog(`Streamed ${report.records_streamed.toLocaleString()} certified foreign labor filings from ${report.source_url}.`, 'terminal-line');
          appendLog(`Tukey IQR outlier pruning: stripped ${report.outliers_pruned_iqr} extreme anomalous entries outside [Q1 - 1.5×IQR, Q3 + 1.5×IQR].`, 'terminal-warn');
          appendLog(`Safe Harbor compliance: verified n >= 5 across tech cohorts. Discarded: ${report.antitrust_safe_harbor_discarded}.`, 'terminal-line');
          appendLog(`PostgreSQL 16 upsert complete: ${report.benchmarks_upserted} active benchmarks aged to 2026 in ${report.execution_time_seconds}s!`, 'terminal-success');
          updateStats(report.records_streamed, report.outliers_pruned_iqr, report.cohorts_aggregated, `${Math.round(report.execution_time_seconds * 1000)} ms`);
          btnTrigger.disabled = false;
          return;
        }
        appendLog('Live K8s API unreachable (LAN/VPN required) — executing high-fidelity local streaming simulation...', 'terminal-warn');
      }

      // Simulation mode
      setTimeout(() => {
        appendLog('Reading chunked stream: 1,728 authentic certified LCA records loaded.', 'terminal-line');
      }, 150);

      setTimeout(() => {
        appendLog('Standardizing SOC codes (15-1252.00, 15-1244.00, 15-1212.00) across 3 geo cost tiers.', 'terminal-line');
      }, 350);

      setTimeout(() => {
        appendLog('Tukey IQR anomaly detector: pruned 109 extreme outlier wages outside [1.5 × IQR].', 'terminal-warn');
      }, 550);

      setTimeout(() => {
        appendLog('Compounding 4.0% annual wage movement index forward to FY2026.', 'terminal-line');
      }, 750);

      setTimeout(() => {
        appendLog('✅ Ingestion complete: 65 market benchmark cohorts calibrated and cached in 68ms.', 'terminal-success');
        updateStats(1728, 109, 65, '68 ms');
        btnTrigger.disabled = false;
      }, 950);
    });

    btnRefresh?.addEventListener('click', async () => {
      appendLog('Querying latest ETL execution report from /api/v1/benchmarks/etl/latest-report...', 'terminal-highlight');
      if (this.apiGateway.mode === 'LIVE_API') {
        const report = await this.apiGateway.fetchLatestEtlReport();
        if (report) {
          appendLog(`Last Run: Job ${report.job_id} (${report.status}) - ${report.records_streamed} records, ${report.outliers_pruned_iqr} outliers cut, ${report.execution_time_seconds}s latency.`, 'terminal-success');
          updateStats(report.records_streamed, report.outliers_pruned_iqr, report.cohorts_aggregated, `${Math.round(report.execution_time_seconds * 1000)} ms`);
          return;
        }
      }
      appendLog('Last Run: Baseline FY2026 DOL LCA & BLS OEWS Extract - 1,728 records, 109 outliers cut, 68ms latency.', 'terminal-line');
    });
  },

  bindCounterSimulatorEvents() {
    const btnOpen = document.getElementById('btn-open-counter-simulator');
    const modal = document.getElementById('counter-simulator-modal');
    const overlay = document.getElementById('counter-simulator-overlay');
    const btnClose = document.getElementById('btn-close-sim-modal');
    const btnCloseFooter = document.getElementById('btn-close-sim-footer');
    const btnOptimize = document.getElementById('btn-apply-rec-counter');
    const btnApplyOffer = document.getElementById('btn-apply-to-offer-builder');
    const btnCopyTP = document.getElementById('btn-copy-talking-points');

    const presetSelect = document.getElementById('sim-competitor-preset');
    const compNameInput = document.getElementById('sim-comp-name');
    const compBaseInput = document.getElementById('sim-comp-base');
    const compBonusInput = document.getElementById('sim-comp-bonus');
    const compSignonInput = document.getElementById('sim-comp-signon');
    const compEquityInput = document.getElementById('sim-comp-equity');
    const compSchedInput = document.getElementById('sim-comp-schedule');
    const compForfeitInput = document.getElementById('sim-comp-forfeit');

    const ourBaseSlider = document.getElementById('sim-our-base-slider');
    const ourBaseVal = document.getElementById('sim-our-base-val');
    const ourSignonSlider = document.getElementById('sim-our-signon-slider');
    const ourSignonVal = document.getElementById('sim-our-signon-val');
    const ourEquitySlider = document.getElementById('sim-our-equity-slider');
    const ourEquityVal = document.getElementById('sim-our-equity-val');

    const winratePct = document.getElementById('sim-winrate-pct');
    const winrateFill = document.getElementById('sim-winrate-fill');
    const winrateBadge = document.getElementById('sim-winrate-badge');
    const coverageVal = document.getElementById('sim-coverage-val');
    const tdcAdvantage = document.getElementById('sim-tdc-advantage');
    const tdcTbody = document.getElementById('sim-tdc-tbody');
    const talkingPointsList = document.getElementById('sim-talking-points-list');

    const presets = {
      stripe: { name: 'Stripe', base: 225000, bonus: 15, signon: 25000, equity: 1600, sched: 'STANDARD_FOUR_YEAR_EQUAL_25', forfeit: 75000 },
      datadog: { name: 'Datadog', base: 230000, bonus: 15, signon: 30000, equity: 1700, sched: 'STANDARD_FOUR_YEAR_EQUAL_25', forfeit: 50000 },
      snowflake: { name: 'Snowflake', base: 235000, bonus: 15, signon: 20000, equity: 1500, sched: 'STANDARD_FOUR_YEAR_EQUAL_25', forfeit: 60000 },
      openai: { name: 'OpenAI', base: 265000, bonus: 0, signon: 50000, equity: 2200, sched: 'STANDARD_FOUR_YEAR_EQUAL_25', forfeit: 100000 },
      backloaded: { name: 'Enterprise Cloud Co', base: 220000, bonus: 10, signon: 20000, equity: 2400, sched: 'BACK_LOADED_5_15_40_40', forfeit: 40000 }
    };

    let latestSimulationResult = null;

    const openModal = () => {
      if (modal) modal.style.display = 'block';
      if (overlay) overlay.style.display = 'block';
      recalculate();
    };

    const closeModal = () => {
      if (modal) modal.style.display = 'none';
      if (overlay) overlay.style.display = 'none';
    };

    btnOpen?.addEventListener('click', openModal);
    btnClose?.addEventListener('click', closeModal);
    btnCloseFooter?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', closeModal);

    presetSelect?.addEventListener('change', (e) => {
      const p = presets[e.target.value];
      if (p) {
        if (compNameInput) compNameInput.value = p.name;
        if (compBaseInput) compBaseInput.value = p.base;
        if (compBonusInput) compBonusInput.value = p.bonus;
        if (compSignonInput) compSignonInput.value = p.signon;
        if (compEquityInput) compEquityInput.value = p.equity;
        if (compSchedInput) compSchedInput.value = p.sched;
        if (compForfeitInput) compForfeitInput.value = p.forfeit;
        recalculate();
      }
    });

    const updateSliderLabels = () => {
      if (ourBaseVal && ourBaseSlider) ourBaseVal.textContent = `$${parseInt(ourBaseSlider.value, 10).toLocaleString()}`;
      if (ourSignonVal && ourSignonSlider) ourSignonVal.textContent = `$${parseInt(ourSignonSlider.value, 10).toLocaleString()}`;
      if (ourEquityVal && ourEquitySlider) ourEquityVal.textContent = `${parseInt(ourEquitySlider.value, 10).toLocaleString()} RSUs`;
    };

    [ourBaseSlider, ourSignonSlider, ourEquitySlider].forEach(slider => {
      slider?.addEventListener('input', () => {
        updateSliderLabels();
        recalculate();
      });
    });

    [compNameInput, compBaseInput, compBonusInput, compSignonInput, compEquityInput, compSchedInput, compForfeitInput].forEach(inp => {
      inp?.addEventListener('input', () => recalculate());
      inp?.addEventListener('change', () => recalculate());
    });

    const recalculate = async () => {
      updateSliderLabels();
      const ourBase = parseFloat(ourBaseSlider?.value || '235000');
      const ourSignon = parseFloat(ourSignonSlider?.value || '45000');
      const ourEquity = parseInt(ourEquitySlider?.value || '1800', 10);

      const compName = compNameInput?.value || 'Competitor';
      const compBase = parseFloat(compBaseInput?.value || '225000');
      const compBonusPct = parseFloat(compBonusInput?.value || '15');
      const compSignon = parseFloat(compSignonInput?.value || '25000');
      const compEquity = parseInt(compEquityInput?.value || '1600', 10);
      const compSched = compSchedInput?.value || 'STANDARD_FOUR_YEAR_EQUAL_25';
      const compForfeit = parseFloat(compForfeitInput?.value || '75000');

      const payload = {
        our_offer: {
          base_salary: ourBase.toString(),
          target_bonus_pct: '15.00',
          signon_bonus: ourSignon.toString(),
          equity_rsus_4yr: ourEquity,
          share_price_estimate: '100.00',
          vesting_schedule: 'ENTERPRISE_FRONT_LOADED_33_33_22_12'
        },
        competing_offer: {
          competitor_name: compName,
          base_salary: compBase.toString(),
          target_bonus_pct: compBonusPct.toString(),
          signon_bonus: compSignon.toString(),
          equity_rsus_4yr: compEquity,
          share_price_estimate: '100.00',
          vesting_schedule: compSched,
          forfeited_unvested_equity: compForfeit.toString()
        }
      };

      if (this.apiGateway.mode === 'LIVE_API') {
        const liveRes = await this.apiGateway.simulateCounterOffer(payload);
        if (liveRes) {
          renderSimulationResult(liveRes);
          return;
        }
      }

      // Local In-Browser Simulation
      const ourSchedPct = [0.33, 0.33, 0.22, 0.12];
      const compSchedPct = compSched === 'BACK_LOADED_5_15_40_40' ? [0.05, 0.15, 0.40, 0.40] : [0.25, 0.25, 0.25, 0.25];

      const ourBonus = ourBase * 0.15;
      const compBonus = compBase * (compBonusPct / 100);

      const ourTotalEq = ourEquity * 100;
      const compTotalEq = compEquity * 100;

      let ourSum = 0;
      let compSum = 0;
      const yby = [];

      for (let i = 0; i < 4; i++) {
        const ourCash = ourBase + ourBonus + (i === 0 ? ourSignon : 0);
        const compCash = compBase + compBonus + (i === 0 ? compSignon : 0);
        const ourEq = ourTotalEq * ourSchedPct[i];
        const compEq = compTotalEq * compSchedPct[i];

        const ourTdc = ourCash + ourEq;
        const compTdc = compCash + compEq;
        const delta = ourTdc - compTdc;

        ourSum += ourTdc;
        compSum += compTdc;

        yby.push({
          year: i + 1,
          our_cash: ourCash.toFixed(2),
          our_equity_value: ourEq.toFixed(2),
          our_tdc: ourTdc.toFixed(2),
          comp_tdc: compTdc.toFixed(2),
          delta_tdc: delta.toFixed(2)
        });
      }

      const yr1Our = parseFloat(yby[0].our_tdc);
      const yr1Comp = parseFloat(yby[0].comp_tdc);
      const yr1Delta = yr1Our - yr1Comp;
      const fourYrDelta = ourSum - compSum;

      // Forfeiture Buyout Coverage
      let coveragePct = 100.0;
      if (compForfeit > 0) {
        const eqPrem = Math.max(0, parseFloat(yby[0].our_equity_value) - (compTotalEq * compSchedPct[0]));
        const buyout = ourSignon + eqPrem;
        coveragePct = Math.min(200.0, Math.round((buyout / compForfeit) * 100));
      }

      // Win rate sigmoid
      const rYr1 = yr1Our / yr1Comp;
      const r4Yr = ourSum / compSum;
      const rForfeit = Math.min(1.0, coveragePct / 100.0);

      let z = 5.5 * (rYr1 - 1.0) + 3.5 * (r4Yr - 1.0) + 1.5 * (rForfeit - 1.0);
      if (compSched !== 'ENTERPRISE_FRONT_LOADED_33_33_22_12') z += 0.35;

      const prob = 1.0 / (1.0 + Math.exp(-z));
      const winPct = Math.max(5.0, Math.min(98.0, Math.round(prob * 1000) / 10));

      let tier = 'HIGHLY_COMPETITIVE';
      if (winPct < 50.0) tier = 'AT_RISK';
      else if (winPct < 65.0) tier = 'MARGINAL';
      else if (winPct < 80.0) tier = 'COMPETITIVE';

      const talkingPoints = [
        `Front-Loaded Equity Advantage: Our enterprise 33/33/22/12 schedule vests 66% within the first 24 months, accelerating liquidity compared to ${compName}'s linear schedule.`,
        fourYrDelta >= 0
          ? `Superior 4-Year Cumulative TDC: Our package delivers $${Math.round(fourYrDelta).toLocaleString()} more in total direct compensation over 4 years.`
          : `Near-Term Cash Flow Priority: While 4-year figures are competitive, our Year 1 cash flow guarantees immediate financial upside with less reliance on backend vesting.`,
        yr1Delta >= 0
          ? `Immediate Year 1 Outperformance: You realize $${Math.round(yr1Delta).toLocaleString()} higher take-home compensation in your first 12 months.`
          : `Guaranteed Base Salary Stability: High cash proportion provides predictable monthly earnings independent of equity market cycles.`
      ];

      if (compForfeit > 0) {
        talkingPoints.push(
          coveragePct >= 100
            ? `Full Equity Forfeiture Protection: Our upfront buyout package fully covers (100%+) the $${Math.round(compForfeit).toLocaleString()} of unvested equity you leave behind.`
            : `Substantial Equity Forfeiture Offset: Our Year 1 package bridges ${coveragePct}% of your forfeited unvested equity immediately, eliminating transition risk.`
        );
      }

      const simResult = {
        first_year_our_tdc: yr1Our.toFixed(2),
        first_year_comp_tdc: yr1Comp.toFixed(2),
        first_year_tdc_delta: yr1Delta.toFixed(2),
        four_year_our_tdc: ourSum.toFixed(2),
        four_year_comp_tdc: compSum.toFixed(2),
        four_year_tdc_delta: fourYrDelta.toFixed(2),
        forfeiture_coverage_pct: coveragePct.toString(),
        predicted_win_rate_pct: winPct.toString(),
        win_rate_tier: tier,
        year_by_year: yby,
        recommended_counter: {
          recommended_base: (compBase > ourBase ? compBase : ourBase).toString(),
          recommended_signon: (yr1Delta < 0 ? Math.round(ourSignon + Math.abs(yr1Delta) + 10000) : ourSignon).toString(),
          recommended_equity_rsus: (fourYrDelta < 0 ? Math.round(ourEquity + Math.abs(fourYrDelta) / 100 * 1.15) : ourEquity)
        },
        recruiter_talking_points: talkingPoints
      };

      renderSimulationResult(simResult);
    };

    const renderSimulationResult = (res) => {
      latestSimulationResult = res;
      const winPct = parseFloat(res.predicted_win_rate_pct);
      if (winratePct) winratePct.textContent = `${winPct.toFixed(1)}%`;
      if (winrateFill) winrateFill.style.width = `${winPct}%`;

      if (winrateBadge) {
        winrateBadge.className = 'badge';
        if (winPct >= 80.0) {
          winrateBadge.classList.add('badge-success');
          winrateBadge.textContent = '🟢 Highly Competitive';
        } else if (winPct >= 65.0) {
          winrateBadge.classList.add('badge-primary');
          winrateBadge.textContent = '🔵 Competitive';
        } else if (winPct >= 50.0) {
          winrateBadge.classList.add('badge-warning');
          winrateBadge.textContent = '🟡 Marginal Parity';
        } else {
          winrateBadge.classList.add('badge-danger');
          winrateBadge.textContent = '🔴 At Risk';
        }
      }

      const cov = parseFloat(res.forfeiture_coverage_pct);
      if (coverageVal) {
        coverageVal.textContent = `${Math.round(cov)}% (${cov >= 100 ? 'Full Offset' : 'Partial Offset'})`;
        coverageVal.className = cov >= 100 ? 'text-emerald' : 'text-amber';
      }

      const fourYrDelta = parseFloat(res.four_year_tdc_delta);
      if (tdcAdvantage) {
        if (fourYrDelta >= 0) {
          tdcAdvantage.textContent = `+$${Math.round(fourYrDelta).toLocaleString()} 4-Year TDC Lead`;
          tdcAdvantage.style.color = '#10b981';
          tdcAdvantage.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        } else {
          tdcAdvantage.textContent = `-$${Math.round(Math.abs(fourYrDelta)).toLocaleString()} 4-Year Deficit`;
          tdcAdvantage.style.color = '#ef4444';
          tdcAdvantage.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        }
      }

      if (tdcTbody && res.year_by_year) {
        let rowsHtml = '';
        res.year_by_year.forEach(row => {
          const delta = parseFloat(row.delta_tdc);
          const deltaFormatted = delta >= 0 ? `+$${Math.round(delta).toLocaleString()}` : `-$${Math.round(Math.abs(delta)).toLocaleString()}`;
          const deltaClass = delta >= 0 ? 'text-emerald' : 'text-rose';
          rowsHtml += `
            <tr>
              <td><strong>Year ${row.year}</strong></td>
              <td>$${Math.round(parseFloat(row.our_cash)).toLocaleString()}</td>
              <td>$${Math.round(parseFloat(row.our_equity_value)).toLocaleString()}</td>
              <td><strong>$${Math.round(parseFloat(row.our_tdc)).toLocaleString()}</strong></td>
              <td>$${Math.round(parseFloat(row.comp_tdc)).toLocaleString()}</td>
              <td class="${deltaClass}"><strong>${deltaFormatted}</strong></td>
            </tr>
          `;
        });
        tdcTbody.innerHTML = rowsHtml;
      }

      if (talkingPointsList && res.recruiter_talking_points) {
        talkingPointsList.innerHTML = res.recruiter_talking_points.map(pt => `<div class="tp-item">${pt}</div>`).join('');
      }
    };

    btnOptimize?.addEventListener('click', () => {
      if (latestSimulationResult && latestSimulationResult.recommended_counter) {
        const rc = latestSimulationResult.recommended_counter;
        if (ourBaseSlider && rc.recommended_base) ourBaseSlider.value = Math.round(parseFloat(rc.recommended_base));
        if (ourSignonSlider && rc.recommended_signon) ourSignonSlider.value = Math.round(parseFloat(rc.recommended_signon));
        if (ourEquitySlider && rc.recommended_equity_rsus) ourEquitySlider.value = parseInt(rc.recommended_equity_rsus, 10);
        recalculate();
      }
    });

    btnApplyOffer?.addEventListener('click', () => {
      const ourBase = ourBaseSlider?.value || '235000';
      const ourSignon = ourSignonSlider?.value || '45000';
      const ourEquity = ourEquitySlider?.value || '1800';

      const mBase = document.getElementById('m-proposed-base');
      const mSignon = document.getElementById('m-signon-bonus');
      const mEquity = document.getElementById('m-equity-rsus');

      if (mBase) {
        mBase.value = ourBase;
        mBase.dispatchEvent(new Event('input'));
      }
      if (mSignon) {
        mSignon.value = ourSignon;
        mSignon.dispatchEvent(new Event('input'));
      }
      if (mEquity) {
        mEquity.value = ourEquity;
        mEquity.dispatchEvent(new Event('input'));
      }

      closeModal();
      document.getElementById('btn-open-offer-builder')?.click();
    });

    btnCopyTP?.addEventListener('click', () => {
      if (latestSimulationResult && latestSimulationResult.recruiter_talking_points) {
        const text = latestSimulationResult.recruiter_talking_points.join('\n\n');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).catch(() => {});
        }
        btnCopyTP.textContent = '✅ Copied!';
        setTimeout(() => { btnCopyTP.textContent = '📋 Copy Talking Points'; }, 2000);
      }
    });
  }
};
