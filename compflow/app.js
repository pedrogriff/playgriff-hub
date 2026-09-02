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
  }
};
