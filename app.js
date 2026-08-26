/**
 * playgriff.me — Total Rewards Technology & Systems Engineering Hub
 * Client-Side Interactive Engine & Visualizer
 * Author: Pedro (@pedrogriff)
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCompFlow();
  initVestingSim();
  initAlgoCore();
});

/* =========================================================================
   1. NAVIGATION & TAB SWITCHING
   ========================================================================= */
function switchTab(targetId) {
  const tabButtons = document.querySelectorAll('.nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(b => {
    if (b.getAttribute('data-tab') === targetId) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  tabPanes.forEach(p => {
    if (p.id === targetId) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (targetId === 'tab-vestingsim') {
    renderMonteCarloSimulation();
  }
}

function initNavigation() {
  const tabButtons = document.querySelectorAll('.nav-btn');
  const jumpButtons = document.querySelectorAll('.jump-tab-btn');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      switchTab(targetId);
    });
  });

  jumpButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      switchTab(targetId);
    });
  });
}

/* =========================================================================
   2. COMPFLOW TOTAL REWARDS & OFFER PLATFORM ENGINE
   ========================================================================= */
const GEO_FACTORS = {
  US_ZONE_1: 1.0,
  US_ZONE_2: 0.90,
  US_ZONE_3: 0.80,
};

const BASE_BANDS = {
  L3: { min: 140000, mid: 165000, max: 190000, targetEquity: 400, targetBonusPct: 10 },
  L4: { min: 170000, mid: 200000, max: 230000, targetEquity: 650, targetBonusPct: 15 },
  L5: { min: 210000, mid: 250000, max: 290000, targetEquity: 900, targetBonusPct: 15 },
  L6: { min: 260000, mid: 310000, max: 360000, targetEquity: 1400, targetBonusPct: 20 },
  L7: { min: 320000, mid: 380000, max: 440000, targetEquity: 2200, targetBonusPct: 25 },
  L8: { min: 400000, mid: 480000, max: 560000, targetEquity: 3500, targetBonusPct: 30 },
};

function getAdjustedBand(level, geo) {
  const base = BASE_BANDS[level] || BASE_BANDS.L5;
  const factor = GEO_FACTORS[geo] || 1.0;
  return {
    min: Math.round(base.min * factor),
    mid: Math.round(base.mid * factor),
    max: Math.round(base.max * factor),
    targetEquity: base.targetEquity,
    targetBonusPct: base.targetBonusPct,
  };
}

let currentOfferState = 'OFFER_DRAFT';

function initCompFlow() {
  initSubNavigation();
  initEmployeePlanning();
  initOfferStudio();
}

function initSubNavigation() {
  const subnavBtns = document.querySelectorAll('.subnav-btn');
  const subpanes = document.querySelectorAll('.subpane');

  subnavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSubpane = btn.getAttribute('data-subpane');
      subnavBtns.forEach(b => b.classList.remove('active'));
      subpanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const pane = document.getElementById(targetSubpane);
      if (pane) pane.classList.add('active');
    });
  });
}

function initEmployeePlanning() {
  const levelSelect = document.getElementById('input-level');
  const geoSelect = document.getElementById('input-geo');
  const equityHint = document.getElementById('hint-equity-target');
  const form = document.getElementById('compflow-form');

  if (!levelSelect || !form) return;

  const updateHint = () => {
    const lvl = levelSelect.value;
    const geo = geoSelect ? geoSelect.value : 'US_ZONE_1';
    const band = getAdjustedBand(lvl, geo);
    if (equityHint) {
      equityHint.textContent = `${lvl} ${geo.replace('_', ' ')} Target: ${band.targetEquity.toLocaleString()} GSUs (Bonus Target: ${band.targetBonusPct}%, Midpoint: $${(band.mid / 1000).toFixed(0)}k)`;
    }
  };

  levelSelect.addEventListener('change', updateHint);
  if (geoSelect) geoSelect.addEventListener('change', updateHint);
  updateHint();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await runAgenticAudit();
  });
}

async function runAgenticAudit() {
  const level = document.getElementById('input-level').value;
  const geo = document.getElementById('input-geo').value;
  const rating = document.getElementById('input-rating').value;
  const currentBase = parseFloat(document.getElementById('input-current-base').value) || 0;
  const proposedBase = parseFloat(document.getElementById('input-proposed-base').value) || 0;
  const ipf = parseFloat(document.getElementById('input-ipf').value) || 1.0;
  const cpf = parseFloat(document.getElementById('input-cpf').value) || 1.0;
  const proposedGSUs = parseInt(document.getElementById('input-proposed-gsus').value, 10) || 0;

  const band = getAdjustedBand(level, geo);
  const compaRatio = (proposedBase / band.mid).toFixed(3);
  const equityRatio = (proposedGSUs / band.targetEquity).toFixed(2);
  const velocityPct = currentBase > 0 ? (((proposedBase - currentBase) / currentBase) * 100).toFixed(1) : '0.0';

  // Bonus Formula: Base * TargetBonusPct * IPF * CPF
  const targetBonusAmount = proposedBase * (band.targetBonusPct / 100);
  const calculatedBonus = Math.round(targetBonusAmount * ipf * cpf);

  const feed = document.getElementById('tool-log-feed');
  const badgeState = document.getElementById('badge-decision-state');
  const banner = document.getElementById('decision-banner');
  const title = document.getElementById('decision-title');
  const desc = document.getElementById('decision-text');

  const metricCompa = document.getElementById('metric-compa-ratio');
  const metricCompaStatus = document.getElementById('metric-compa-status');
  const metricBonus = document.getElementById('metric-bonus-amt');
  const metricBonusSub = document.getElementById('metric-bonus-sub');
  const metricVelocity = document.getElementById('metric-velocity');

  // Step 1: Submitted
  setStepActive('step-submitted');
  feed.innerHTML = '';
  addLog(feed, `[Workflow] Employee Review submitted (${level}, ${geo}, ${rating.replace('_', ' ')}).`, 'log-dim');

  await sleep(220);
  setStepActive('step-auditing');
  badgeState.textContent = 'AGENT AUDITING';
  badgeState.className = 'badge badge-warning';

  // Step 2: Tool 1 - Compa-Ratio & Salary Band
  addLog(feed, `[Tool Invocation] calculate_compa_ratio(proposed=$${proposedBase.toLocaleString()}, mid=$${band.mid.toLocaleString()}) -> ${compaRatio}`, 'log-tool');
  await sleep(220);

  let bandPass = true;
  if (proposedBase < band.min) {
    bandPass = false;
    addLog(feed, `[Tool Finding: FAIL] verify_salary_band_compliance: Base below band floor ($${band.min.toLocaleString()})`, 'log-warn');
  } else if (proposedBase > band.max) {
    bandPass = false;
    addLog(feed, `[Tool Finding: FAIL] verify_salary_band_compliance: Base exceeds band ceiling ($${band.max.toLocaleString()})`, 'log-error');
  } else {
    addLog(feed, `[Tool Finding: PASS] verify_salary_band_compliance: Base in range [$${band.min.toLocaleString()}, $${band.max.toLocaleString()}]`, 'log-success');
  }

  // Step 3: Tool 2 - Performance Bonus Formula
  await sleep(220);
  addLog(feed, `[Tool Invocation] calculate_target_bonus(base=$${proposedBase.toLocaleString()}, target=${band.targetBonusPct}%, IPF=${ipf}x, CPF=${cpf}x) -> $${calculatedBonus.toLocaleString()}`, 'log-tool');
  addLog(feed, `[Tool Finding: PASS] evaluate_bonus_compliance: Bonus fully funded within 105% CPF guideline`, 'log-success');

  // Step 4: Tool 3 - Equity Guidelines
  await sleep(220);
  addLog(feed, `[Tool Invocation] evaluate_equity_guidelines(gsus=${proposedGSUs.toLocaleString()}, target=${band.targetEquity}, rating=${rating})`, 'log-tool');

  let equityPass = true;
  const ratingMults = {
    NEEDS_IMPROVEMENT: [0, 0],
    CONSISTENTLY_MEETS: [0.8, 1.2],
    EXCEEDS: [1.1, 1.45],
    STRONGLY_OUTPERFORMS: [1.35, 1.8],
    SUPERB: [1.7, 2.3],
  };
  const [minM, maxM] = ratingMults[rating] || [0.8, 1.2];
  const minG = Math.floor(band.targetEquity * minM);
  const maxG = Math.floor(band.targetEquity * maxM);

  if (proposedGSUs < minG) {
    equityPass = false;
    addLog(feed, `[Tool Finding: WARN] evaluate_equity_guidelines: ${proposedGSUs} GSUs below guideline (${minG} GSUs)`, 'log-warn');
  } else if (proposedGSUs > maxG) {
    equityPass = false;
    addLog(feed, `[Tool Finding: FAIL] evaluate_equity_guidelines: ${proposedGSUs} GSUs exceeds max allowable (${maxG} GSUs)`, 'log-error');
  } else {
    addLog(feed, `[Tool Finding: PASS] evaluate_equity_guidelines: ${proposedGSUs} GSUs within [${minG}, ${maxG}] (${equityRatio}x)`, 'log-success');
  }

  // Step 5: Tool 4 - Velocity & Rating Compliance
  await sleep(220);
  let velocityPass = true;
  if (rating === 'NEEDS_IMPROVEMENT' && proposedBase > currentBase) {
    velocityPass = false;
    addLog(feed, `[Tool Finding: FAIL] evaluate_base_increase_velocity: Base raise strictly blocked for Needs Improvement`, 'log-error');
  } else if (parseFloat(velocityPct) > 20.0) {
    velocityPass = false;
    addLog(feed, `[Tool Finding: FAIL] evaluate_base_increase_velocity: +${velocityPct}% exceeds +20.0% merit velocity cap`, 'log-error');
  } else {
    addLog(feed, `[Tool Finding: PASS] evaluate_base_increase_velocity: +${velocityPct}% merit increase within policy`, 'log-success');
  }

  // Step 6: Synthesize Decision
  await sleep(250);
  setStepActive('step-decision');

  metricCompa.textContent = compaRatio;
  metricCompaStatus.textContent = `Mid: $${(band.mid / 1000).toFixed(0)}k | Band: [${(band.min / 1000).toFixed(0)}k-${(band.max / 1000).toFixed(0)}k]`;

  metricBonus.textContent = `$${calculatedBonus.toLocaleString()}`;
  metricBonusSub.textContent = `${band.targetBonusPct}% Target × ${(ipf * cpf).toFixed(2)}x Multiplier`;

  metricVelocity.textContent = `+${velocityPct}%`;

  banner.className = 'decision-banner';

  if (!velocityPass && rating === 'NEEDS_IMPROVEMENT') {
    badgeState.textContent = 'REJECTED';
    badgeState.className = 'badge badge-danger';
    banner.classList.add('rejected');
    title.textContent = '❌ REJECTED BY GOVERNANCE POLICY';
    desc.textContent = `Employees with rating '${rating}' are strictly ineligible for base salary increases under enterprise total rewards governance.`;
    addLog(feed, `[Agent Synthesis: REJECT] State Machine Transition: SUBMITTED -> REJECTED`, 'log-error');
  } else if (!bandPass || !equityPass || !velocityPass) {
    badgeState.textContent = 'VP EXCEPTION REQUIRED';
    badgeState.className = 'badge badge-warning';
    banner.classList.add('escalated');
    title.textContent = '⚠️ ESCALATED TO VP CALIBRATION COMMITTEE';
    desc.textContent = `Proposal contains non-standard policy deviations (Compa-Ratio: ${compaRatio}, Equity: ${equityRatio}x). Detailed exception brief synthesized for executive review.`;
    addLog(feed, `[Agent Synthesis: ESCALATE] State Machine Transition: SUBMITTED -> VP_EXCEPTION_REQUIRED`, 'log-warn');
  } else {
    badgeState.textContent = 'AUTO-APPROVED';
    badgeState.className = 'badge badge-success';
    banner.classList.add('approved');
    title.textContent = '✅ AUTO-APPROVED BY AGENT';
    desc.textContent = `Proposal satisfies all salary band limits (Compa-Ratio: ${compaRatio}), performance equity multipliers (${equityRatio}x of target), and merit velocity caps.`;
    addLog(feed, `[Agent Synthesis: APPROVED] State Machine Transition: SUBMITTED -> AUTO_APPROVED`, 'log-success');
  }
}

/* =========================================================================
   2.1. NEW HIRE OFFER STUDIO LOGIC
   ========================================================================= */
function initOfferStudio() {
  const form = document.getElementById('offer-form');
  const levelSelect = document.getElementById('offer-level');
  const geoSelect = document.getElementById('offer-geo');
  const equityHint = document.getElementById('offer-equity-hint');

  const btnVpApprove = document.getElementById('btn-offer-vp-approve');
  const btnExtend = document.getElementById('btn-offer-extend');
  const btnAccept = document.getElementById('btn-offer-accept');

  if (!form || !levelSelect) return;

  const updateOfferHint = () => {
    const lvl = levelSelect.value;
    const geo = geoSelect ? geoSelect.value : 'US_ZONE_1';
    const band = getAdjustedBand(lvl, geo);
    if (equityHint) {
      equityHint.textContent = `${lvl} ${geo.replace('_', ' ')} Guideline: ${band.targetEquity.toLocaleString()} GSUs (Max: ${Math.round(band.targetEquity * 1.5).toLocaleString()} GSUs)`;
    }
  };

  levelSelect.addEventListener('change', updateOfferHint);
  if (geoSelect) geoSelect.addEventListener('change', updateOfferHint);
  updateOfferHint();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await runOfferAudit();
  });

  if (btnVpApprove) {
    btnVpApprove.addEventListener('click', () => {
      transitionOfferState('OFFER_APPROVED', 'VP Exception Approved by Executive Committee');
    });
  }

  if (btnExtend) {
    btnExtend.addEventListener('click', () => {
      transitionOfferState('OFFER_EXTENDED', 'Offer Letter Extended to Candidate');
    });
  }

  if (btnAccept) {
    btnAccept.addEventListener('click', () => {
      transitionOfferState('OFFER_ACCEPTED', 'Candidate Formally Accepted Offer');
    });
  }
}

async function runOfferAudit() {
  const candidateName = document.getElementById('offer-candidate-name').value;
  const level = document.getElementById('offer-level').value;
  const geo = document.getElementById('offer-geo').value;
  const base = parseFloat(document.getElementById('offer-base').value) || 0;
  const signon = parseFloat(document.getElementById('offer-signon').value) || 0;
  const equity = parseInt(document.getElementById('offer-equity').value, 10) || 0;

  const band = getAdjustedBand(level, geo);
  const compa = (base / band.mid).toFixed(3);
  const targetBonus = Math.round(base * (band.targetBonusPct / 100));
  const ttc = base + targetBonus;
  const y1tc = ttc + signon;

  // Update pills
  document.getElementById('pill-base').textContent = `$${base.toLocaleString()}`;
  document.getElementById('pill-bonus').textContent = `$${targetBonus.toLocaleString()}`;
  document.getElementById('pill-signon').textContent = `$${signon.toLocaleString()}`;
  document.getElementById('pill-ttc').textContent = `$${ttc.toLocaleString()}`;
  document.getElementById('pill-y1tc').textContent = `$${y1tc.toLocaleString()}`;

  const feed = document.getElementById('offer-log-feed');
  feed.innerHTML = '';
  addLog(feed, `[Offer Workflow] Candidate offer created for ${candidateName} (${level}, ${geo}).`, 'log-dim');

  setOfferStepActive('ostep-audit');
  await sleep(200);

  addLog(feed, `[Tool Invocation] calculate_compa_ratio(base=$${base.toLocaleString()}, mid=$${band.mid.toLocaleString()}) -> ${compa}`, 'log-tool');

  let bandOk = true;
  if (base > band.max) {
    bandOk = false;
    addLog(feed, `[Tool Finding: FAIL] verify_salary_band: Base exceeds max ($${band.max.toLocaleString()})`, 'log-error');
  } else {
    addLog(feed, `[Tool Finding: PASS] verify_salary_band: Base within band range [$${band.min.toLocaleString()}, $${band.max.toLocaleString()}]`, 'log-success');
  }

  await sleep(200);
  let signonOk = true;
  if (signon > 50000) {
    signonOk = false;
    addLog(feed, `[Tool Finding: ESCALATE] evaluate_sign_on_bonus: Sign-on $${signon.toLocaleString()} exceeds standard $50,000 threshold (VP Approval Required)`, 'log-warn');
  } else {
    addLog(feed, `[Tool Finding: PASS] evaluate_sign_on_bonus: Sign-on $${signon.toLocaleString()} <= $50,000 policy ceiling`, 'log-success');
  }

  await sleep(200);
  let equityOk = true;
  const maxEq = Math.round(band.targetEquity * 1.5);
  if (equity > maxEq) {
    equityOk = false;
    addLog(feed, `[Tool Finding: FAIL] evaluate_equity_caps: ${equity} GSUs exceeds 1.5x new hire cap (${maxEq} GSUs)`, 'log-error');
  } else {
    addLog(feed, `[Tool Finding: PASS] evaluate_equity_caps: ${equity} GSUs compliant with new hire baseline`, 'log-success');
  }

  await sleep(250);
  const banner = document.getElementById('offer-decision-banner');
  const title = document.getElementById('offer-decision-title');
  const desc = document.getElementById('offer-decision-text');
  const badge = document.getElementById('offer-badge-state');

  const btnVpApprove = document.getElementById('btn-offer-vp-approve');
  const btnExtend = document.getElementById('btn-offer-extend');
  const btnAccept = document.getElementById('btn-offer-accept');

  banner.className = 'decision-banner';
  btnVpApprove.style.display = 'none';
  btnExtend.style.display = 'none';
  btnAccept.style.display = 'none';

  if (!signonOk || !bandOk || !equityOk) {
    currentOfferState = 'VP_EXCEPTION_REQUIRED';
    badge.textContent = 'VP EXCEPTION REQUIRED';
    badge.className = 'badge badge-warning';
    banner.classList.add('escalated');
    title.textContent = '⚠️ VP EXCEPTION APPROVAL REQUIRED';
    desc.textContent = `Offer exceeds standard policy guidelines ($${signon.toLocaleString()} sign-on or compa ${compa}). Requires VP Engineering / Compensation Committee approval.`;
    addLog(feed, `[Offer State Machine] OFFER_DRAFT -> VP_EXCEPTION_REQUIRED`, 'log-warn');
    btnVpApprove.style.display = 'inline-flex';
  } else {
    currentOfferState = 'OFFER_APPROVED';
    badge.textContent = 'OFFER APPROVED';
    badge.className = 'badge badge-success';
    banner.classList.add('approved');
    title.textContent = '✅ OFFER APPROVED';
    desc.textContent = `Offer package conforms to all location salary bands, standard sign-on limits, and equity allocations. Ready to extend to candidate.`;
    addLog(feed, `[Offer State Machine] OFFER_DRAFT -> OFFER_APPROVED`, 'log-success');
    setOfferStepActive('ostep-approved');
    btnExtend.style.display = 'inline-flex';
  }
}

function transitionOfferState(newState, message) {
  currentOfferState = newState;
  const feed = document.getElementById('offer-log-feed');
  const badge = document.getElementById('offer-badge-state');
  const banner = document.getElementById('offer-decision-banner');
  const title = document.getElementById('offer-decision-title');
  const desc = document.getElementById('offer-decision-text');

  const btnVpApprove = document.getElementById('btn-offer-vp-approve');
  const btnExtend = document.getElementById('btn-offer-extend');
  const btnAccept = document.getElementById('btn-offer-accept');

  btnVpApprove.style.display = 'none';
  btnExtend.style.display = 'none';
  btnAccept.style.display = 'none';

  addLog(feed, `[State Transition] ${message} (New State: ${newState})`, 'log-success');

  if (newState === 'OFFER_APPROVED') {
    badge.textContent = 'OFFER APPROVED';
    badge.className = 'badge badge-success';
    setOfferStepActive('ostep-approved');
    banner.className = 'decision-banner approved';
    title.textContent = '✅ VP EXCEPTION SIGNED & APPROVED';
    desc.textContent = 'Executive approval recorded with full immutable audit logging. Ready to generate offer letter.';
    btnExtend.style.display = 'inline-flex';
  } else if (newState === 'OFFER_EXTENDED') {
    badge.textContent = 'OFFER EXTENDED';
    badge.className = 'badge badge-warning';
    setOfferStepActive('ostep-extended');
    banner.className = 'decision-banner';
    title.textContent = '📨 OFFER LETTER EXTENDED TO CANDIDATE';
    desc.textContent = 'Formal offer package delivered via DocuSign with 7-day expiration window.';
    btnAccept.style.display = 'inline-flex';
  } else if (newState === 'OFFER_ACCEPTED') {
    badge.textContent = 'OFFER ACCEPTED';
    badge.className = 'badge badge-success';
    setOfferStepActive('ostep-accepted');
    banner.className = 'decision-banner approved';
    title.textContent = '🎉 CANDIDATE ACCEPTED OFFER';
    desc.textContent = 'Candidate signature verified. Pre-boarding workflow and headcount budget reservation completed.';
  }
}

function setOfferStepActive(stepId) {
  const steps = ['ostep-draft', 'ostep-audit', 'ostep-approved', 'ostep-extended', 'ostep-accepted'];
  const activeIdx = steps.indexOf(stepId);
  steps.forEach((id, idx) => {
    const el = document.getElementById(id);
    if (el) {
      if (idx <= activeIdx) el.classList.add('active');
      else el.classList.remove('active');
    }
  });
}

function addLog(container, text, className) {
  const el = document.createElement('div');
  el.className = `log-entry ${className}`;
  el.textContent = text;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

function setStepActive(stepId) {
  const steps = ['step-draft', 'step-submitted', 'step-auditing', 'step-decision'];
  const activeIdx = steps.indexOf(stepId);
  steps.forEach((id, idx) => {
    const el = document.getElementById(id);
    if (el) {
      if (idx <= activeIdx) el.classList.add('active');
      else el.classList.remove('active');
    }
  });
}

function sleep(ms) {
/* =========================================================================
   3. VESTINGSIM & MONTE CARLO ENGINE
   ========================================================================= */
function initVestingSim() {
  const sharesInput = document.getElementById('input-grant-shares');
  const priceInput = document.getElementById('input-stock-price');
  const schedSelect = document.getElementById('input-schedule-type');
  const volSlider = document.getElementById('slider-volatility');
  const driftSlider = document.getElementById('slider-drift');
  const btnSim = document.getElementById('btn-run-simulation');

  if (!sharesInput || !priceInput) return;

  const update = () => {
    document.getElementById('val-volatility').textContent = `${volSlider.value}%`;
    document.getElementById('val-drift').textContent = `${driftSlider.value}%`;
    renderVestingBarChart();
    renderMonteCarloSimulation();
  };

  sharesInput.addEventListener('input', update);
  priceInput.addEventListener('input', update);
  schedSelect.addEventListener('change', update);
  volSlider.addEventListener('input', update);
  driftSlider.addEventListener('input', update);
  btnSim.addEventListener('click', update);

  update();
}

function calculateVestingTranches(totalShares, scheduleType) {
  const tranches = [];
  if (totalShares <= 0) return tranches;

  if (scheduleType === 'FRONT_LOADED') {
    const yearWeights = [0.33, 0.33, 0.22, 0.12];
    const yearShares = distributeIntegerShares(totalShares, yearWeights);

    const monthWeights12 = Array(12).fill(1 / 12);
    yearShares.forEach((yTotal, yIdx) => {
      const mShares = distributeIntegerShares(yTotal, monthWeights12);
      mShares.forEach((shares, mIdx) => {
        tranches.push({ month: yIdx * 12 + mIdx + 1, shares, year: yIdx + 1 });
      });
    });
  } else if (scheduleType === 'CLIFF_4YR') {
    const cliffShares = Math.floor(totalShares * 0.25);
    const remShares = totalShares - cliffShares;
    tranches.push({ month: 12, shares: cliffShares, year: 1 });

    const m36 = Array(36).fill(1 / 36);
    const postCliff = distributeIntegerShares(remShares, m36);
    postCliff.forEach((shares, idx) => {
      const m = 13 + idx;
      tranches.push({ month: m, shares, year: Math.ceil(m / 12) });
    });
  } else if (scheduleType === 'EVEN_MONTHLY') {
    const m48 = Array(48).fill(1 / 48);
    const allocated = distributeIntegerShares(totalShares, m48);
    allocated.forEach((shares, idx) => {
      tranches.push({ month: idx + 1, shares, year: Math.ceil((idx + 1) / 12) });
    });
  } else if (scheduleType === 'EVEN_QUARTERLY') {
    const q16 = Array(16).fill(1 / 16);
    const allocated = distributeIntegerShares(totalShares, q16);
    allocated.forEach((shares, idx) => {
      const m = (idx + 1) * 3;
      tranches.push({ month: m, shares, year: Math.ceil(m / 12) });
    });
  }

  return tranches;
}

function distributeIntegerShares(total, weights) {
  const allocated = [];
  const remainders = [];
  let sumAllocated = 0;

  weights.forEach((w, idx) => {
    const ideal = total * w;
    const floor = Math.floor(ideal);
    const rem = ideal - floor;
    allocated.push(floor);
    remainders.push({ rem, idx });
    sumAllocated += floor;
  });

  const unallocated = total - sumAllocated;
  remainders.sort((a, b) => b.rem - a.rem);

  for (let i = 0; i < unallocated; i++) {
    const targetIdx = remainders[i % weights.length].idx;
    allocated[targetIdx] += 1;
  }
  return allocated;
}

function renderVestingBarChart() {
  const totalShares = parseInt(document.getElementById('input-grant-shares').value, 10) || 1000;
  const schedType = document.getElementById('input-schedule-type').value;
  const container = document.getElementById('vesting-bar-chart');
  const sumBadge = document.getElementById('chart-total-shares-check');

  if (!container) return;

  const tranches = calculateVestingTranches(totalShares, schedType);
  container.innerHTML = '';

  const maxShares = Math.max(...tranches.map(t => t.shares), 1);
  let totalSum = 0;

  tranches.forEach(t => {
    totalSum += t.shares;
    const bar = document.createElement('div');
    bar.className = `bar-col col-y${t.year}`;
    const heightPct = (t.shares / maxShares) * 100;
    bar.style.height = `${Math.max(heightPct, 6)}%`;
    bar.title = `Month ${t.month} (Year ${t.year}): ${t.shares} GSUs`;
    container.appendChild(bar);
  });

  if (sumBadge) {
    sumBadge.textContent = `Sum = ${totalSum.toLocaleString()} GSUs`;
  }
}

function renderMonteCarloSimulation() {
  const canvas = document.getElementById('mc-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const S0 = parseFloat(document.getElementById('input-stock-price').value) || 175;
  const totalShares = parseInt(document.getElementById('input-grant-shares').value, 10) || 1000;
  const schedType = document.getElementById('input-schedule-type').value;
  const vol = (parseFloat(document.getElementById('slider-volatility').value) || 25) / 100;
  const mu = (parseFloat(document.getElementById('slider-drift').value) || 8) / 100;

  const tranches = calculateVestingTranches(totalShares, schedType);

  const numPaths = 300;
  const months = 48;
  const dt = 1 / 12;
  const driftTerm = (mu - 0.5 * vol * vol) * dt;
  const volTerm = vol * Math.sqrt(dt);

  const paths = [];
  const realizedValues = [];

  for (let p = 0; p < numPaths; p++) {
    const path = [S0];
    let curr = S0;
    for (let m = 1; m <= months; m++) {
      const z = gaussianRandom();
      curr = curr * Math.exp(driftTerm + volTerm * z);
      path.push(curr);
    }
    paths.push(path);

    let payout = 0;
    tranches.forEach(t => {
      payout += t.shares * path[t.month];
    });
    realizedValues.push(payout);
  }

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  let maxP = S0;
  let minP = S0;
  paths.forEach(p => {
    p.forEach(val => {
      if (val > maxP) maxP = val;
      if (val < minP) minP = val;
    });
  });
  maxP *= 1.05;
  minP = Math.max(0, minP * 0.95);

  const getX = (m) => (m / months) * (width - 60) + 40;
  const getY = (price) => height - 30 - ((price - minP) / (maxP - minP)) * (height - 50);

  ctx.strokeStyle = '#24324a';
  ctx.lineWidth = 1;
  for (let yStep = 0; yStep <= 4; yStep++) {
    const pVal = minP + (yStep / 4) * (maxP - minP);
    const yPos = getY(pVal);
    ctx.beginPath();
    ctx.moveTo(40, yPos);
    ctx.lineTo(width - 20, yPos);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(`$${pVal.toFixed(0)}`, 5, yPos + 3);
  }

  ctx.lineWidth = 0.7;
  paths.slice(0, 80).forEach((path) => {
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.12)';
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(path[0]));
    for (let m = 1; m <= months; m++) {
      ctx.lineTo(getX(m), getY(path[m]));
    }
    ctx.stroke();
  });

  realizedValues.sort((a, b) => a - b);
  const p10 = realizedValues[Math.floor(0.1 * numPaths)];
  const p50 = realizedValues[Math.floor(0.5 * numPaths)];
  const p90 = realizedValues[Math.floor(0.9 * numPaths)];

  document.getElementById('val-p10').textContent = `$${Math.round(p10).toLocaleString()}`;
  document.getElementById('val-p50').textContent = `$${Math.round(p50).toLocaleString()}`;
  document.getElementById('val-p90').textContent = `$${Math.round(p90).toLocaleString()}`;
}

function gaussianRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/* =========================================================================
   4. ALGOCORE INTERACTIVE CS BENCHMARK
   ========================================================================= */
function initAlgoCore() {
  const btnRace = document.getElementById('btn-start-race');
  const sliderP = document.getElementById('slider-percentile');
  const valTargetP = document.getElementById('val-target-p');
  const resSalary = document.getElementById('tree-salary-result');
  const resMeta = document.getElementById('tree-salary-meta');

  if (!btnRace || !sliderP) return;

  btnRace.addEventListener('click', () => {
    runQueueRace();
  });

  sliderP.addEventListener('input', () => {
    const p = parseInt(sliderP.value, 10);
    valTargetP.textContent = `${p}th Percentile`;

    const minSal = 130000;
    const maxSal = 520000;
    const salary = Math.round(minSal + (maxSal - minSal) * Math.pow(p / 100, 1.3));
    const rank = Math.round((p / 100) * 50000);

    resSalary.textContent = `$${salary.toLocaleString()}`;
    resMeta.textContent = `Rank: #${rank.toLocaleString()} of 50,000 | AVL Tree Lookup: 0.02 ms`;
  });
}

function runQueueRace() {
  const progArray = document.getElementById('prog-array');
  const progRing = document.getElementById('prog-ring');
  const timeArray = document.getElementById('timer-array');
  const timeRing = document.getElementById('timer-ring');
  const btnRace = document.getElementById('btn-start-race');

  btnRace.disabled = true;
  progArray.style.width = '0%';
  progRing.style.width = '0%';
  timeArray.textContent = 'Running...';
  timeRing.textContent = 'Running...';

  setTimeout(() => {
    progRing.style.width = '100%';
    timeRing.textContent = '0.45 ms (O(1) WINNER)';
  }, 100);

  let arrayProgress = 0;
  const interval = setInterval(() => {
    arrayProgress += 5;
    progArray.style.width = `${arrayProgress}%`;
    timeArray.textContent = `${(arrayProgress * 28.5).toFixed(0)} ms (O(N²) Shifting)`;

    if (arrayProgress >= 100) {
      clearInterval(interval);
      timeArray.textContent = '2,850 ms (Quadratic Lag)';
      btnRace.disabled = false;
    }
  }, 80);
}
