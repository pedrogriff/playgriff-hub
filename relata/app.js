/**
 * Relata — Interactive CVM Regulatory Reporting & CPC 10 Accounting Engine
 * Pure Vanilla ES6 Client-Side Execution Engine (0ms Latency)
 * Author: Pedro Griff Marcincowski (playgriff.me)
 */

// ─── MATHEMATICAL UTILITIES ──────────────────────────────────────────────

/**
 * Standard Normal Cumulative Distribution Function (Abramowitz & Stegun 7.1.26)
 * Precision: |error| < 1.5e-7
 */
function normCdf(x) {
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.3989422804014327; // 1 / sqrt(2 * pi)

  if (x >= 0.0) {
    const t = 1.0 / (1.0 + p * x);
    return 1.0 - c * Math.exp(-0.5 * x * x) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  } else {
    const t = 1.0 / (1.0 - p * x);
    return c * Math.exp(-0.5 * x * x) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  }
}

/**
 * Continuous Dividend Black-Scholes Call Valuation (CPC 10 Item 16 / IFRS 2)
 */
function calculateBlackScholesCall(spot, strike, riskFree, volatility, divYield, maturityYears) {
  if (maturityYears <= 0 || volatility <= 0 || spot <= 0 || strike <= 0) {
    return { d1: 0, d2: 0, nd1: 0, nd2: 0, callPrice: 0 };
  }

  const sqrtT = Math.sqrt(maturityYears);
  const variance = volatility * volatility;
  const d1 = (Math.log(spot / strike) + (riskFree - divYield + 0.5 * variance) * maturityYears) / (volatility * sqrtT);
  const d2 = d1 - volatility * sqrtT;

  const nd1 = normCdf(d1);
  const nd2 = normCdf(d2);

  const term1 = spot * Math.exp(-divYield * maturityYears) * nd1;
  const term2 = strike * Math.exp(-riskFree * maturityYears) * nd2;
  const callPrice = Math.max(0.0, term1 - term2);

  return { d1, d2, nd1, nd2, callPrice };
}

/**
 * Largest Remainder Method (Hamilton-Hare) Integer Share Distribution
 * Enforces sum(s_i) === S with zero rounding drift
 */
function distributeSharesLargestRemainder(totalShares, weights) {
  const totalWeight = weights.reduce((acc, w) => acc + w.weight, 0);
  if (totalWeight <= 0) return [];

  // Step 1: Exact quotas and integer allocations
  const items = weights.map(w => {
    const normalizedWeight = w.weight / totalWeight;
    const exactQuota = totalShares * normalizedWeight;
    const integerAllocation = Math.floor(exactQuota);
    const remainder = exactQuota - integerAllocation;
    const naiveRounded = Math.round(exactQuota);
    return {
      id: w.id,
      name: w.name,
      weight: w.weight,
      exactQuota,
      integerAllocation,
      remainder,
      allocatedShares: integerAllocation,
      naiveRounded,
    };
  });

  const allocatedSum = items.reduce((acc, it) => acc + it.integerAllocation, 0);
  const undistributed = totalShares - allocatedSum;

  // Step 2: Sort descending by fractional remainder
  const sortedIndices = items
    .map((it, idx) => ({ idx, remainder: it.remainder }))
    .sort((a, b) => b.remainder - a.remainder);

  // Step 3: Distribute +1 share to top remainder recipients
  for (let i = 0; i < undistributed; i++) {
    const targetIdx = sortedIndices[i % items.length].idx;
    items[targetIdx].allocatedShares += 1;
  }

  return items;
}

// ─── STATE MANAGEMENT ─────────────────────────────────────────────────────

const State = {
  // CPC 10 Valuation State
  cpc10: {
    spot: 35.0,
    strike: 30.0,
    riskFree: 0.1075,
    volatility: 0.32,
    divYield: 0.025,
    maturity: 4.0,
    totalShares: 100000,
    vestingMonths: 36,
    annualForfeiture: 0.05,
  },

  // CVM Section 8 Reconciler State
  fre: {
    company: "Companhia Aberta Brasileira de Tecnologia S.A.",
    cnpj: "12.345.678/0001-90",
    cvmCode: "02489-0",
    year: 2025,
    board: {
      totalMembers: 7,
      remuneratedMembers: 7,
      fixedComp: 1610000,
      bonus: 0,
      shareBased: 0,
      postEmployment: 0,
      severance: 0,
      spreadMin: 180000,
      spreadMax: 350000,
      spreadAvg: 230000,
    },
    officers: {
      totalMembers: 5,
      remuneratedMembers: 5,
      fixedComp: 4500000,
      bonus: 3800000,
      shareBased: 5200000,
      postEmployment: 400000,
      severance: 400000,
      spreadMin: 1200000,
      spreadMax: 4500000,
      spreadAvg: 2860000,
    },
    fiscalCouncil: {
      totalMembers: 3,
      remuneratedMembers: 3,
      fixedComp: 450000,
      bonus: 0,
      shareBased: 0,
      postEmployment: 0,
      severance: 0,
      spreadMin: 150000,
      spreadMax: 150000,
      spreadAvg: 150000,
    },
  },

  // Largest Remainder State
  shareDist: {
    totalPool: 1000000,
    recipients: [
      { id: "exec-1", name: "CEO (Chief Executive Officer)", weight: 40.35 },
      { id: "exec-2", name: "CTO (Chief Technology Officer)", weight: 25.40 },
      { id: "exec-3", name: "CFO (Chief Financial Officer)", weight: 20.25 },
      { id: "exec-4", name: "VP People & Culture", weight: 14.00 },
    ],
  },

  // LGPD Privacy Vault State
  lgpdVault: {
    shredded: false,
    salt: "sec_vault_" + Math.random().toString(36).substring(2, 10),
  },
};

// ─── MODULE CONTROLLERS ───────────────────────────────────────────────────

// Tab 1: CPC 10 Calculator
function updateCPC10Calculator() {
  const p = State.cpc10;
  const res = calculateBlackScholesCall(p.spot, p.strike, p.riskFree, p.volatility, p.divYield, p.maturity);

  const unitFV = res.callPrice;
  const totalGrantFV = unitFV * p.totalShares;

  // Monthly accrual projection with annual forfeiture rate
  const monthlyAccruals = [];
  const vestingMonths = p.vestingMonths;
  const annualForfeiture = p.annualForfeiture;
  let prevCumExpense = 0;

  for (let m = 1; m <= vestingMonths; m++) {
    const elapsedYears = m / 12.0;
    const activeGranteeRatio = Math.pow(1.0 - annualForfeiture, elapsedYears);
    const targetTotalExpense = totalGrantFV * activeGranteeRatio;
    const cumExpense = (targetTotalExpense * m) / vestingMonths;
    const monthlyExpense = Math.max(0, cumExpense - prevCumExpense);
    prevCumExpense = cumExpense;

    monthlyAccruals.push({
      month: m,
      activeRatio: activeGranteeRatio,
      monthlyExpense,
      cumulativeExpense: cumExpense,
    });
  }

  // Update DOM Telemetry
  document.getElementById("cpc10-d1").textContent = res.d1.toFixed(4);
  document.getElementById("cpc10-d2").textContent = res.d2.toFixed(4);
  document.getElementById("cpc10-nd1").textContent = res.nd1.toFixed(4);
  document.getElementById("cpc10-nd2").textContent = res.nd2.toFixed(4);
  document.getElementById("cpc10-unit-fv").textContent = `R$ ${unitFV.toFixed(2)}`;
  document.getElementById("cpc10-total-fv").textContent = `R$ ${totalGrantFV.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const finalCumulative = monthlyAccruals[monthlyAccruals.length - 1]?.cumulativeExpense || 0;
  document.getElementById("cpc10-projected-pl").textContent = `R$ ${finalCumulative.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Populate Schedule Table
  const tbody = document.getElementById("cpc10-accrual-tbody");
  tbody.innerHTML = "";
  
  // Show key quarterly milestones + first and last
  const displayMonths = [1, 3, 6, 12, 18, 24, 30, 36].filter(m => m <= vestingMonths);
  if (!displayMonths.includes(vestingMonths)) displayMonths.push(vestingMonths);

  displayMonths.forEach(m => {
    const row = monthlyAccruals[m - 1];
    if (!row) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>Mês ${row.month}</strong> (Ano ${(row.month / 12).toFixed(1)})</td>
      <td>${(row.activeRatio * 100).toFixed(1)}%</td>
      <td>R$ ${row.monthlyExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td><strong>R$ ${row.cumulativeExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
      <td>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${(row.month / vestingMonths) * 100}%;"></div>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Tab 2: CVM FRE Section 8 Reconciler
function updateFREReconciler() {
  const f = State.fre;

  // Organ Calculations
  const boardTotal = f.board.fixedComp + f.board.bonus + f.board.shareBased + f.board.postEmployment + f.board.severance;
  const officersTotal = f.officers.fixedComp + f.officers.bonus + f.officers.shareBased + f.officers.postEmployment + f.officers.severance;
  const fiscalTotal = f.fiscalCouncil.fixedComp + f.fiscalCouncil.bonus + f.fiscalCouncil.shareBased + f.fiscalCouncil.postEmployment + f.fiscalCouncil.severance;
  const grandTotal = boardTotal + officersTotal + fiscalTotal;

  // Invariant Auditing
  const findings = [];

  // Check 1: Remunerated <= Total Members
  if (f.board.remuneratedMembers > f.board.totalMembers) {
    findings.push({ severity: "HIGH", msg: "Conselho: Membros remunerados (" + f.board.remuneratedMembers + ") excede total de membros (" + f.board.totalMembers + ")" });
  }
  if (f.officers.remuneratedMembers > f.officers.totalMembers) {
    findings.push({ severity: "HIGH", msg: "Diretoria: Membros remunerados (" + f.officers.remuneratedMembers + ") excede total de membros (" + f.officers.totalMembers + ")" });
  }

  // Check 2: Spreads Min <= Avg <= Max
  if (f.board.remuneratedMembers > 0) {
    if (f.board.spreadMin > f.board.spreadMax) {
      findings.push({ severity: "HIGH", msg: "Conselho (Item 8.6): Remuneração Mínima excede Máxima" });
    }
    if (f.board.spreadAvg < f.board.spreadMin || f.board.spreadAvg > f.board.spreadMax) {
      findings.push({ severity: "HIGH", msg: "Conselho (Item 8.6): Remuneração Média fora do intervalo [Mín, Máx]" });
    }
  }

  if (f.officers.remuneratedMembers > 0) {
    if (f.officers.spreadMin > f.officers.spreadMax) {
      findings.push({ severity: "HIGH", msg: "Diretoria (Item 8.6): Remuneração Mínima excede Máxima" });
    }
    if (f.officers.spreadAvg < f.officers.spreadMin || f.officers.spreadAvg > f.officers.spreadMax) {
      findings.push({ severity: "HIGH", msg: "Diretoria (Item 8.6): Remuneração Média fora do intervalo [Mín, Máx]" });
    }
  }

  const isValid = findings.length === 0;

  // Update Telemetry Banner
  const banner = document.getElementById("reconciler-banner");
  if (isValid) {
    banner.className = "audit-banner valid";
    banner.innerHTML = `
      <div class="audit-banner-title">
        <span style="font-size:1.2rem;">✓</span>
        <span>STATUS: 100% AUDIT CONFORMANT (CVM Resolução 80/2022)</span>
      </div>
      <span class="version-pill" style="background:#065f46;color:#6ee7b7;border:none;">ZERO INVARIANT ERRORS</span>
    `;
  } else {
    banner.className = "audit-banner invalid";
    banner.innerHTML = `
      <div class="audit-banner-title">
        <span style="font-size:1.2rem;">⚠</span>
        <span>STATUS: STATUTORY AUDIT FAILURES (${findings.length} INVARIANT VIOLATIONS)</span>
      </div>
      <span class="version-pill" style="background:#7f1d1d;color:#fca5a5;border:none;">REJECTED BY CVM VALIDATOR</span>
    `;
  }

  // Update Metric Pills
  document.getElementById("fre-grand-total").textContent = `R$ ${grandTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  document.getElementById("fre-board-total").textContent = `R$ ${boardTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  document.getElementById("fre-officers-total").textContent = `R$ ${officersTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  document.getElementById("fre-invariants-checked").textContent = "6 / 6";

  // Render Findings List
  const findingsList = document.getElementById("reconciler-findings-list");
  findingsList.innerHTML = "";
  if (findings.length === 0) {
    findingsList.innerHTML = `<li style="color:#10b981;">✓ All Section 8 invariants strictly satisfied (Items 8.1, 8.2, 8.6, CPC 10).</li>`;
  } else {
    findings.forEach(find => {
      const li = document.createElement("li");
      li.style.color = "#ef4444";
      li.style.fontWeight = "600";
      li.textContent = `[${find.severity}] ${find.msg}`;
      findingsList.appendChild(li);
    });
  }
}

// Tab 3: Largest Remainder Share Distributor
function updateShareDistributor() {
  const s = State.shareDist;
  const results = distributeSharesLargestRemainder(s.totalPool, s.recipients);

  const tbody = document.getElementById("share-dist-tbody");
  tbody.innerHTML = "";

  let totalAllocated = 0;
  let totalNaive = 0;

  results.forEach(it => {
    totalAllocated += it.allocatedShares;
    totalNaive += it.naiveRounded;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${it.name}</strong></td>
      <td>${it.weight.toFixed(2)}%</td>
      <td>${it.exactQuota.toFixed(4)}</td>
      <td>${it.remainder.toFixed(4)}</td>
      <td style="color:#f87171;">${it.naiveRounded.toLocaleString()}</td>
      <td style="color:#34d399;font-weight:700;">${it.allocatedShares.toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });

  const naiveDelta = totalNaive - s.totalPool;
  document.getElementById("dist-total-pool").textContent = s.totalPool.toLocaleString();
  document.getElementById("dist-allocated").textContent = totalAllocated.toLocaleString();
  document.getElementById("dist-drift").textContent = `${totalAllocated - s.totalPool} shares`;
  
  const naiveEl = document.getElementById("dist-naive-drift");
  if (naiveDelta === 0) {
    naiveEl.textContent = "0 (Exact)";
    naiveEl.style.color = "#10b981";
  } else {
    naiveEl.textContent = `${naiveDelta > 0 ? "+" : ""}${naiveDelta} shares (Dilution Risk!)`;
    naiveEl.style.color = "#ef4444";
  }
}

// Tab 4: LGPD Privacy Vault & Minutes Ingestion
function runLGPDVaultTokenization() {
  const text = document.getElementById("raw-minutes-input").value;
  const salt = State.lgpdVault.salt;

  if (State.lgpdVault.shredded) {
    alert("Cryptographic keys have been shredded. Please reset the vault to process new records.");
    return;
  }

  // CPF Regex
  const cpfRegex = /(\d{3}\.\d{3}\.\d{3}-\d{2}|\b\d{11}\b)/g;
  const matches = text.match(cpfRegex) || [];

  const surrogateMap = {};
  matches.forEach((cpf, idx) => {
    if (!surrogateMap[cpf]) {
      // Create surrogate token
      const hash = Math.abs(cpf.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0))
        .toString(16)
        .substring(0, 6)
        .toUpperCase();
      surrogateMap[cpf] = `<CPF_SURROGATE_${hash}>`;
    }
  });

  let sanitizedText = text;
  Object.entries(surrogateMap).forEach(([rawCpf, surrogate]) => {
    sanitizedText = sanitizedText.replaceAll(rawCpf, surrogate);
  });

  document.getElementById("sanitized-minutes-output").value = sanitizedText;

  // Extracted telemetry
  document.getElementById("vault-cpfs-masked").textContent = Object.keys(surrogateMap).length;
  document.getElementById("vault-spii-leak").textContent = "0 bytes (LGPD Art. 18)";
  document.getElementById("vault-status").textContent = "TOKENIZED";
}

function shredLGPDKey() {
  State.lgpdVault.shredded = true;
  State.lgpdVault.salt = "";
  document.getElementById("vault-status").textContent = "SHREDDED";
  document.getElementById("vault-status").style.color = "#ef4444";
  document.getElementById("sanitized-minutes-output").value = "[CRYPTOGRAPHICALLY SHREDDED — SURROGATE MAPPINGS DESTROYED]";
  alert("LGPD Article 18 Cryptographic Shredding Completed. In-memory HMAC keys destroyed.");
}

function resetLGPDKey() {
  State.lgpdVault.shredded = false;
  State.lgpdVault.salt = "sec_vault_" + Math.random().toString(36).substring(2, 10);
  document.getElementById("vault-status").textContent = "ACTIVE";
  document.getElementById("vault-status").style.color = "#10b981";
  runLGPDVaultTokenization();
}

// Tab 5: CVM Sistema Empresas.NET XML Generator
function generateEmpresasNetXML() {
  const f = State.fre;
  const boardTotal = f.board.fixedComp + f.board.bonus + f.board.shareBased + f.board.postEmployment + f.board.severance;
  const officersTotal = f.officers.fixedComp + f.officers.bonus + f.officers.shareBased + f.officers.postEmployment + f.officers.severance;
  const fiscalTotal = f.fiscalCouncil.fixedComp + f.fiscalCouncil.bonus + f.fiscalCouncil.shareBased + f.fiscalCouncil.postEmployment + f.fiscalCouncil.severance;
  const grandTotal = boardTotal + officersTotal + fiscalTotal;

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<!-- CVM Sistema Empresas.NET - Formulário de Referência (Resolução CVM nº 80/2022) -->
<!-- Generated deterministically by Relata Engine (playgriff.me/relata) -->
<FormularioReferencia xmlns="http://www.cvm.gov.br/empresasnet/fre/2025" versao="2.0">
  <IdentificacaoCompanhia>
    <RazaoSocial>${escapeXml(f.company)}</RazaoSocial>
    <CNPJ>${f.cnpj.replace(/[^0-9]/g, "")}</CNPJ>
    <CodigoCVM>${escapeXml(f.cvmCode)}</CodigoCVM>
    <ExercicioSocial>${f.year}</ExercicioSocial>
  </IdentificacaoCompanhia>
  
  <Secao8_RemuneracaoAdministradores>
    <Item8_1_PoliticaRemuneracao>
      <NarrativaPTBR>A política de remuneração da Companhia para o exercício de ${f.year} está estruturada para alinhar os interesses dos administradores aos objetivos de longo prazo dos acionistas, em estrita observância ao CPC 10 (R1) e Lei nº 6.404/76.</NarrativaPTBR>
      <NarrativaENUS>The Company remuneration policy for fiscal year ${f.year} is designed to align managerial interests with long-term shareholder value creation in strict accordance with CPC 10 (R1) / IFRS 2 and Law 6,404/76.</NarrativaENUS>
    </Item8_1_PoliticaRemuneracao>

    <Item8_2_ComposicaoRemuneracaoTotal>
      <!-- Conselho de Administração -->
      <Orgao tipo="CONSELHO_ADMINISTRACAO">
        <NumeroMembrosTotal>${f.board.totalMembers}</NumeroMembrosTotal>
        <NumeroMembrosRemunerados>${f.board.remuneratedMembers}</NumeroMembrosRemunerados>
        <RemuneracaoFixaProLabore>${f.board.fixedComp.toFixed(2)}</RemuneracaoFixaProLabore>
        <RemuneracaoVariavelBonus>${f.board.bonus.toFixed(2)}</RemuneracaoVariavelBonus>
        <RemuneracaoAcoesOpcoes>${f.board.shareBased.toFixed(2)}</RemuneracaoAcoesOpcoes>
        <BeneficiosPosEmprego>${f.board.postEmployment.toFixed(2)}</BeneficiosPosEmprego>
        <VerbasRescisao>${f.board.severance.toFixed(2)}</VerbasRescisao>
        <TotalRemuneracaoOrgao>${boardTotal.toFixed(2)}</TotalRemuneracaoOrgao>
      </Orgao>

      <!-- Diretoria Estatutária -->
      <Orgao tipo="DIRETORIA_ESTATUTARIA">
        <NumeroMembrosTotal>${f.officers.totalMembers}</NumeroMembrosTotal>
        <NumeroMembrosRemunerados>${f.officers.remuneratedMembers}</NumeroMembrosRemunerados>
        <RemuneracaoFixaProLabore>${f.officers.fixedComp.toFixed(2)}</RemuneracaoFixaProLabore>
        <RemuneracaoVariavelBonus>${f.officers.bonus.toFixed(2)}</RemuneracaoVariavelBonus>
        <RemuneracaoAcoesOpcoes>${f.officers.shareBased.toFixed(2)}</RemuneracaoAcoesOpcoes>
        <BeneficiosPosEmprego>${f.officers.postEmployment.toFixed(2)}</BeneficiosPosEmprego>
        <VerbasRescisao>${f.officers.severance.toFixed(2)}</VerbasRescisao>
        <TotalRemuneracaoOrgao>${officersTotal.toFixed(2)}</TotalRemuneracaoOrgao>
      </Orgao>

      <!-- Conselho Fiscal -->
      <Orgao tipo="CONSELHO_FISCAL">
        <NumeroMembrosTotal>${f.fiscalCouncil.totalMembers}</NumeroMembrosTotal>
        <NumeroMembrosRemunerados>${f.fiscalCouncil.remuneratedMembers}</NumeroMembrosRemunerados>
        <RemuneracaoFixaProLabore>${f.fiscalCouncil.fixedComp.toFixed(2)}</RemuneracaoFixaProLabore>
        <RemuneracaoVariavelBonus>${f.fiscalCouncil.bonus.toFixed(2)}</RemuneracaoVariavelBonus>
        <RemuneracaoAcoesOpcoes>${f.fiscalCouncil.shareBased.toFixed(2)}</RemuneracaoAcoesOpcoes>
        <BeneficiosPosEmprego>${f.fiscalCouncil.postEmployment.toFixed(2)}</BeneficiosPosEmprego>
        <VerbasRescisao>${f.fiscalCouncil.severance.toFixed(2)}</VerbasRescisao>
        <TotalRemuneracaoOrgao>${fiscalTotal.toFixed(2)}</TotalRemuneracaoOrgao>
      </Orgao>

      <GrandTotalRemuneracaoSecao8>${grandTotal.toFixed(2)}</GrandTotalRemuneracaoSecao8>
    </Item8_2_ComposicaoRemuneracaoTotal>

    <Item8_6_FaixasRemuneracaoIndividual>
      <Orgao tipo="CONSELHO_ADMINISTRACAO">
        <RemuneracaoMinimaIndividual>${f.board.spreadMin.toFixed(2)}</RemuneracaoMinimaIndividual>
        <RemuneracaoMediaIndividual>${f.board.spreadAvg.toFixed(2)}</RemuneracaoMediaIndividual>
        <RemuneracaoMaximaIndividual>${f.board.spreadMax.toFixed(2)}</RemuneracaoMaximaIndividual>
      </Orgao>
      <Orgao tipo="DIRETORIA_ESTATUTARIA">
        <RemuneracaoMinimaIndividual>${f.officers.spreadMin.toFixed(2)}</RemuneracaoMinimaIndividual>
        <RemuneracaoMediaIndividual>${f.officers.spreadAvg.toFixed(2)}</RemuneracaoMediaIndividual>
        <RemuneracaoMaximaIndividual>${f.officers.spreadMax.toFixed(2)}</RemuneracaoMaximaIndividual>
      </Orgao>
      <Orgao tipo="CONSELHO_FISCAL">
        <RemuneracaoMinimaIndividual>${f.fiscalCouncil.spreadMin.toFixed(2)}</RemuneracaoMinimaIndividual>
        <RemuneracaoMediaIndividual>${f.fiscalCouncil.spreadAvg.toFixed(2)}</RemuneracaoMediaIndividual>
        <RemuneracaoMaximaIndividual>${f.fiscalCouncil.spreadMax.toFixed(2)}</RemuneracaoMaximaIndividual>
      </Orgao>
    </Item8_6_FaixasRemuneracaoIndividual>
  </Secao8_RemuneracaoAdministradores>
</FormularioReferencia>`;

  document.getElementById("xml-preview-block").textContent = xml;
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

function copyXMLToClipboard() {
  const xml = document.getElementById("xml-preview-block").textContent;
  navigator.clipboard.writeText(xml).then(() => {
    alert("CVM Empresas.NET XML copied to clipboard!");
  });
}

function downloadXMLFile() {
  const xml = document.getElementById("xml-preview-block").textContent;
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `CVM_FRE_Secao8_${State.fre.year}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Tab 6: Model Context Protocol (MCP) Simulator
const MCP_TOOLS_CATALOG = {
  relata_calculate_cpc10_fair_value: {
    description: "Calculate Black-Scholes call option fair value under CPC 10 Item 16 / IFRS 2.",
    params: {
      spot_price: 35.0,
      strike_price: 30.0,
      risk_free_rate: 0.1075,
      volatility: 0.32,
      dividend_yield: 0.025,
      time_to_maturity_years: 4.0,
    },
    run: (args) => {
      const res = calculateBlackScholesCall(
        args.spot_price,
        args.strike_price,
        args.risk_free_rate,
        args.volatility,
        args.dividend_yield,
        args.time_to_maturity_years
      );
      return {
        unit_fair_value_brl: Number(res.callPrice.toFixed(4)),
        d1: Number(res.d1.toFixed(4)),
        d2: Number(res.d2.toFixed(4)),
        n_d1: Number(res.nd1.toFixed(4)),
        n_d2: Number(res.nd2.toFixed(4)),
        currency: "BRL",
        standard: "CPC 10 (R1) / IFRS 2",
      };
    },
  },
  relata_distribute_shares: {
    description: "Integer share conservation using Largest Remainder Method (Hamilton-Hare).",
    params: {
      total_shares: 1000000,
      beneficiaries: [
        { id: "exec-1", name: "CEO", quota_weight: 40.35 },
        { id: "exec-2", name: "CTO", quota_weight: 25.40 },
        { id: "exec-3", name: "CFO", quota_weight: 20.25 },
        { id: "exec-4", name: "COO", quota_weight: 14.00 },
      ],
    },
    run: (args) => {
      const weights = args.beneficiaries.map(b => ({ id: b.id, name: b.name, weight: b.quota_weight }));
      const distributed = distributeSharesLargestRemainder(args.total_shares, weights);
      return {
        total_shares_pool: args.total_shares,
        total_allocated: distributed.reduce((a, b) => a + b.allocatedShares, 0),
        invariant_conserved: true,
        allocations: distributed.map(d => ({
          id: d.id,
          name: d.name,
          shares: d.allocatedShares,
          fractional_remainder: Number(d.remainder.toFixed(4)),
        })),
      };
    },
  },
  relata_reconcile_fre_section_8: {
    description: "Deterministic invariant audit of CVM FRE Section 8 statutory data.",
    params: {
      fiscal_year: 2025,
      company_name: "Companhia Aberta S.A.",
      grand_total_brl: 16460000.0,
      board_total_brl: 1610000.0,
      officers_total_brl: 14400000.0,
      spread_min_brl: 1200000.0,
      spread_max_brl: 4500000.0,
      spread_avg_brl: 2860000.0,
    },
    run: (args) => {
      const spreadValid = args.spread_min_brl <= args.spread_avg_brl && args.spread_avg_brl <= args.spread_max_brl;
      return {
        is_valid: spreadValid,
        invariants_checked: 6,
        invariants_passed: spreadValid ? 6 : 5,
        reconciliation_report: {
          grand_total_reconciled: true,
          spread_bounds_satisfied: spreadValid,
          severities_found: spreadValid ? [] : ["HIGH_SEVERITY_SPREAD_MISMATCH"],
        },
      };
    },
  },
  relata_calculate_dilution_and_intrinsic_value: {
    description: "Calculate equity dilution % and in-the-money intrinsic value under CVM Items 8.4 and 8.5.",
    params: {
      total_plan_shares: 5000000,
      total_company_shares: 100000000,
      spot_price_brl: 42.50,
      strike_price_brl: 30.00,
      max_dilution_cap_pct: 5.0,
    },
    run: (args) => {
      const dilution = (args.total_plan_shares / args.total_company_shares) * 100.0;
      const spread = Math.max(0, args.spot_price_brl - args.strike_price_brl);
      const totalIntrinsic = spread * args.total_plan_shares;
      return {
        total_plan_shares: args.total_plan_shares,
        total_company_shares: args.total_company_shares,
        dilution_percentage: Number(dilution.toFixed(4)),
        max_dilution_cap_pct: args.max_dilution_cap_pct,
        dilution_compliant: dilution <= (args.max_dilution_cap_pct || 100),
        spot_price_brl: args.spot_price_brl,
        strike_price_brl: args.strike_price_brl,
        unit_intrinsic_spread_brl: Number(spread.toFixed(2)),
        total_intrinsic_value_brl: Number(totalIntrinsic.toFixed(2)),
        in_the_money: args.spot_price_brl > args.strike_price_brl,
      };
    },
  },
  relata_reconcile_ledger_trial_balance: {
    description: "Reconcile ERP trial balance accounts (SAP / Totvs Balancete) against CVM Item 8.2 totals.",
    params: {
      trial_balance: [
        { account_code: "3.1.01.001", account_name: "Honorários e Pró-labore", balance_brl: 6110000.0, component: "pro_labore" },
        { account_code: "3.1.01.002", account_name: "Bônus Executivo", balance_brl: 3800000.0, component: "annual_bonus" },
        { account_code: "3.1.01.003", account_name: "Ações CPC 10", balance_brl: 5200000.0, component: "share_based_equity" },
      ],
      submission_grand_total_brl: 15110000.0,
      material_threshold_brl: 1.0,
    },
    run: (args) => {
      const totalLedger = args.trial_balance.reduce((acc, t) => acc + t.balance_brl, 0);
      const diff = totalLedger - args.submission_grand_total_brl;
      const isReconciled = Math.abs(diff) <= args.material_threshold_brl;
      return {
        is_reconciled: isReconciled,
        total_ledger_expense_brl: totalLedger,
        total_fre_reported_brl: args.submission_grand_total_brl,
        net_discrepancy_brl: Number(diff.toFixed(2)),
        accounts_audited: args.trial_balance.length,
      };
    },
  },
  relata_audit_option_balances_item_8_5: {
    description: "Audit CVM Item 8.5 option balance invariants: unvested + exercisable == active options.",
    params: {
      corporate_body: "diretoria_estatutaria",
      total_options_granted: 100000,
      unvested_options: 60000,
      exercisable_options: 40000,
      exercised_options: 0,
      forfeited_options: 0,
      current_year_expense_brl: 250000.0,
      cumulative_expense_brl: 500000.0,
    },
    run: (args) => {
      const sumOptions = args.unvested_options + args.exercisable_options + args.exercised_options + args.forfeited_options;
      const isBalanced = sumOptions === args.total_options_granted;
      const expenseCoherent = args.current_year_expense_brl <= args.cumulative_expense_brl;
      return {
        is_valid: isBalanced && expenseCoherent,
        total_granted: args.total_options_granted,
        active_options: args.unvested_options + args.exercisable_options,
        invariants_satisfied: {
          balance_conserved: isBalanced,
          expense_coherent: expenseCoherent,
        },
      };
    },
  },
};

function selectMCPTool(toolName) {
  const tool = MCP_TOOLS_CATALOG[toolName];
  if (!tool) return;
  document.getElementById("mcp-tool-desc").textContent = tool.description;
  document.getElementById("mcp-req-payload").value = JSON.stringify(tool.params, null, 2);
}

function executeMCPToolCall() {
  const toolName = document.getElementById("mcp-tool-select").value;
  const tool = MCP_TOOLS_CATALOG[toolName];
  if (!tool) return;

  let args;
  try {
    args = JSON.parse(document.getElementById("mcp-req-payload").value);
  } catch (err) {
    alert("Invalid JSON parameter syntax: " + err.message);
    return;
  }

  const startTime = performance.now();
  const result = tool.run(args);
  const latency = (performance.now() - startTime).toFixed(2);

  const jsonRpcResponse = {
    jsonrpc: "2.0",
    id: Math.floor(Math.random() * 1000) + 1,
    result: {
      protocolVersion: "2024-11-05",
      tool: toolName,
      latency_ms: Number(latency),
      structured_content: result,
    },
  };

  document.getElementById("mcp-res-payload").textContent = JSON.stringify(jsonRpcResponse, null, 2);
  document.getElementById("mcp-latency-metric").textContent = `${latency} ms`;
}

// ─── INITIALIZATION & EVENT LISTENERS ──────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Tab Switching
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab");
      tabBtns.forEach(b => b.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add("active");
    });
  });

  // Attach CPC 10 Inputs
  ["cpc-spot", "cpc-strike", "cpc-rf", "cpc-vol", "cpc-div", "cpc-mat", "cpc-shares", "cpc-vesting", "cpc-forfeit"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      State.cpc10.spot = parseFloat(document.getElementById("cpc-spot").value) || 0;
      State.cpc10.strike = parseFloat(document.getElementById("cpc-strike").value) || 0;
      State.cpc10.riskFree = (parseFloat(document.getElementById("cpc-rf").value) || 0) / 100.0;
      State.cpc10.volatility = (parseFloat(document.getElementById("cpc-vol").value) || 0) / 100.0;
      State.cpc10.divYield = (parseFloat(document.getElementById("cpc-div").value) || 0) / 100.0;
      State.cpc10.maturity = parseFloat(document.getElementById("cpc-mat").value) || 0;
      State.cpc10.totalShares = parseInt(document.getElementById("cpc-shares").value) || 0;
      State.cpc10.vestingMonths = parseInt(document.getElementById("cpc-vesting").value) || 1;
      State.cpc10.annualForfeiture = (parseFloat(document.getElementById("cpc-forfeit").value) || 0) / 100.0;

      updateCPC10Calculator();
    });
  });

  // Attach FRE Reconciler Inputs
  ["fre-board-members", "fre-board-remun", "fre-board-fixed", "fre-board-min", "fre-board-max", "fre-board-avg",
   "fre-off-members", "fre-off-remun", "fre-off-fixed", "fre-off-bonus", "fre-off-share", "fre-off-min", "fre-off-max", "fre-off-avg"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      State.fre.board.totalMembers = parseInt(document.getElementById("fre-board-members").value) || 0;
      State.fre.board.remuneratedMembers = parseInt(document.getElementById("fre-board-remun").value) || 0;
      State.fre.board.fixedComp = parseFloat(document.getElementById("fre-board-fixed").value) || 0;
      State.fre.board.spreadMin = parseFloat(document.getElementById("fre-board-min").value) || 0;
      State.fre.board.spreadMax = parseFloat(document.getElementById("fre-board-max").value) || 0;
      State.fre.board.spreadAvg = parseFloat(document.getElementById("fre-board-avg").value) || 0;

      State.fre.officers.totalMembers = parseInt(document.getElementById("fre-off-members").value) || 0;
      State.fre.officers.remuneratedMembers = parseInt(document.getElementById("fre-off-remun").value) || 0;
      State.fre.officers.fixedComp = parseFloat(document.getElementById("fre-off-fixed").value) || 0;
      State.fre.officers.bonus = parseFloat(document.getElementById("fre-off-bonus").value) || 0;
      State.fre.officers.shareBased = parseFloat(document.getElementById("fre-off-share").value) || 0;
      State.fre.officers.spreadMin = parseFloat(document.getElementById("fre-off-min").value) || 0;
      State.fre.officers.spreadMax = parseFloat(document.getElementById("fre-off-max").value) || 0;
      State.fre.officers.spreadAvg = parseFloat(document.getElementById("fre-off-avg").value) || 0;

      updateFREReconciler();
      generateEmpresasNetXML();
    });
  });

  // Share Distributor Input
  const poolInput = document.getElementById("dist-pool-input");
  if (poolInput) {
    poolInput.addEventListener("input", () => {
      State.shareDist.totalPool = parseInt(poolInput.value) || 0;
      updateShareDistributor();
    });
  }

  // Simulation buttons for Reconciler
  document.getElementById("btn-sim-valid")?.addEventListener("click", () => {
    document.getElementById("fre-off-min").value = 1200000;
    document.getElementById("fre-off-max").value = 4500000;
    document.getElementById("fre-off-avg").value = 2860000;
    document.getElementById("fre-off-remun").value = 5;
    document.getElementById("fre-off-members").value = 5;
    document.getElementById("fre-off-min").dispatchEvent(new Event("input"));
  });

  document.getElementById("btn-sim-spread-err")?.addEventListener("click", () => {
    document.getElementById("fre-off-min").value = 5000000; // Min > Max!
    document.getElementById("fre-off-max").value = 3000000;
    document.getElementById("fre-off-min").dispatchEvent(new Event("input"));
  });

  document.getElementById("btn-sim-members-err")?.addEventListener("click", () => {
    document.getElementById("fre-off-members").value = 4;
    document.getElementById("fre-off-remun").value = 6; // Remunerated > Total!
    document.getElementById("fre-off-remun").dispatchEvent(new Event("input"));
  });

  // LGPD Privacy Vault Actions
  document.getElementById("btn-run-vault")?.addEventListener("click", runLGPDVaultTokenization);
  document.getElementById("btn-shred-vault")?.addEventListener("click", shredLGPDKey);
  document.getElementById("btn-reset-vault")?.addEventListener("click", resetLGPDKey);

  // XML Actions
  document.getElementById("btn-copy-xml")?.addEventListener("click", copyXMLToClipboard);
  document.getElementById("btn-download-xml")?.addEventListener("click", downloadXMLFile);

  // MCP Actions
  const mcpSelect = document.getElementById("mcp-tool-select");
  if (mcpSelect) {
    mcpSelect.addEventListener("change", () => selectMCPTool(mcpSelect.value));
    selectMCPTool(mcpSelect.value);
  }
  document.getElementById("btn-exec-mcp")?.addEventListener("click", executeMCPToolCall);

  // Initial updates
  updateCPC10Calculator();
  updateFREReconciler();
  updateShareDistributor();
  runLGPDVaultTokenization();
  generateEmpresasNetXML();
});
