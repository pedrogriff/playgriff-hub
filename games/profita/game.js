// profita/prototype/game.js
// All improvements applied:
//   #1  Welcome modal on first load
//   #3  advanceTurn finally block — button always re-enables
//   #4  Toast + shake for failed transactions
//   #5  Styled game-over modal (no alert)
//   #6  netWorthHistory starts with 2 values so chart renders immediately
//   #9  Bots start with higher salaries to populate leaderboard faster
//   #10 Duplicate property guard (max 1 of each type)
//   #11 Monthly net-worth delta badge
//   #12 Upskill complete toast (no alert)
//   #14 Emoji nav icons (in HTML)

// --- CONFIGURATION & STATIC DATA ---
const CAREERS = [
    { id: "teacher",  title: "High School Teacher",  startingSalary: 3500, expenses: 1500, upskillCost: 2000, maxSalary: 6000,  upskillLabel: "Advanced Pedagogy Cert" },
    { id: "analyst",  title: "Business Analyst",      startingSalary: 4500, expenses: 1800, upskillCost: 3000, maxSalary: 8500,  upskillLabel: "Data Analytics Cert" },
    { id: "engineer", title: "Software Engineer",     startingSalary: 6000, expenses: 2200, upskillCost: 4000, maxSalary: 15000, upskillLabel: "Senior Engineering Track" },
    { id: "artist",   title: "Graphic Designer",      startingSalary: 3000, expenses: 1400, upskillCost: 1500, maxSalary: 5500,  upskillLabel: "Creative Direction Cert" }
];

const PROPERTIES_FOR_SALE = [
    { id: "condo",     name: "Suburban Condo",  price: 150000, downPaymentPercent: 0.10, monthlyRent: 1100, maintenance: 250 },
    { id: "townhouse", name: "City Townhouse",  price: 300000, downPaymentPercent: 0.15, monthlyRent: 2100, maintenance: 450 },
    { id: "house",     name: "Family House",    price: 500000, downPaymentPercent: 0.20, monthlyRent: 3200, maintenance: 700 }
];

// --- INITIAL STATE ---
function buildInitialState() {
    return {
        age: 22,
        month: 1,
        cash: 10000,
        career: null,
        upskillProgress: 0,
        upskillActive: false,

        // Portfolio
        stockPrice: 100,
        stockOwned: 0,
        cryptoPrice: 30000,
        cryptoOwned: 0,
        bondsHeld: 0,
        properties: [],

        // Goals
        goalNetWorth: 2000000,
        goalAge: 65,

        // History — start with two identical values so chart draws from turn 1
        netWorthHistory: [10000, 10000],
        lastNetWorth: 10000,

        // Settings
        apiKeys: { alphavantage: "", coingecko: "" },

        // First-run flag
        firstRun: true,

        // Bots — higher salaries so they populate leaderboard faster
        bots: [
            { name: "Index Ian",    cash: 10000, stockOwned: 0, cryptoOwned: 0, bondsHeld: 0, properties: [], netWorthHistory: [10000, 10000], strategy: "indexer",     salary: 5500 },
            { name: "Degen Dan",    cash: 10000, stockOwned: 0, cryptoOwned: 0, bondsHeld: 0, properties: [], netWorthHistory: [10000, 10000], strategy: "speculator",  salary: 5000 },
            { name: "Boring Betty", cash: 10000, stockOwned: 0, cryptoOwned: 0, bondsHeld: 0, properties: [], netWorthHistory: [10000, 10000], strategy: "conservative",salary: 4500 },
            { name: "Landlord Lucy",cash: 10000, stockOwned: 0, cryptoOwned: 0, bondsHeld: 0, properties: [], netWorthHistory: [10000, 10000], strategy: "realestate",  salary: 4800 }
        ]
    };
}

let state = buildInitialState();

// --- DOM ELEMENTS ---
const elements = {
    age:              document.getElementById("player-age"),
    netWorth:         document.getElementById("player-net-worth"),
    nwDelta:          document.getElementById("player-nw-delta"),
    cashFlow:         document.getElementById("player-cash-flow"),
    metricCash:       document.getElementById("metric-cash"),
    metricDebt:       document.getElementById("metric-debt"),
    chartPath:        document.getElementById("chart-path"),
    chartFill:        document.getElementById("chart-fill"),
    goalProgressText: document.getElementById("goal-progress-text"),
    goalProgressFill: document.getElementById("goal-progress-fill"),
    goalYearsLeft:    document.getElementById("goal-years-left"),

    careerTitle:      document.getElementById("career-title"),
    careerSalary:     document.getElementById("career-salary"),
    careerExpenses:   document.getElementById("career-expenses"),
    courseList:       document.getElementById("course-list"),
    jobList:          document.getElementById("job-list"),

    stockPrice:       document.getElementById("stock-price"),
    stockOwned:       document.getElementById("stock-owned"),
    stockValueRow:    document.getElementById("stock-value-row"),
    btnBuyStock:      document.getElementById("btn-buy-stock"),
    btnSellStock:     document.getElementById("btn-sell-stock"),

    cryptoPrice:      document.getElementById("crypto-price"),
    cryptoOwned:      document.getElementById("crypto-owned"),
    cryptoValueRow:   document.getElementById("crypto-value-row"),
    btnBuyCrypto:     document.getElementById("btn-buy-crypto"),
    btnSellCrypto:    document.getElementById("btn-sell-crypto"),

    bondsHeld:        document.getElementById("bonds-held"),
    inputBondAmount:  document.getElementById("input-bond-amount"),
    btnBuyBonds:      document.getElementById("btn-buy-bonds"),
    btnSellBonds:     document.getElementById("btn-sell-bonds"),

    propertyList:     document.getElementById("property-list"),
    leaderboardBody:  document.getElementById("leaderboard-body"),

    btnExportCode:             document.getElementById("btn-export-code"),
    btnImportCode:             document.getElementById("btn-import-code"),
    inputImportCode:           document.getElementById("input-import-code"),
    exportOutputContainer:     document.getElementById("export-output-container"),
    textExportCode:            document.getElementById("text-export-code"),

    keyAlpha:         document.getElementById("key-alphavantage"),
    keyGecko:         document.getElementById("key-coingecko"),
    btnSaveKeys:      document.getElementById("btn-save-keys"),
    settingsStatus:   document.getElementById("settings-status"),
    btnResetGame:     document.getElementById("btn-reset-game"),

    btnAdvanceMonth:  document.getElementById("btn-advance-month"),
    turnIndicator:    document.getElementById("turn-indicator"),

    // Modals
    modalWelcome:     document.getElementById("modal-welcome"),
    btnWelcomeStart:  document.getElementById("btn-welcome-start"),
    modalGameover:    document.getElementById("modal-gameover"),
    gameoverNetworth: document.getElementById("gameover-networth"),
    gameoverRank:     document.getElementById("gameover-rank"),
    gameoverGoal:     document.getElementById("gameover-goal"),
    gameoverMessage:  document.getElementById("gameover-message"),
    gameoverIcon:     document.getElementById("gameover-icon"),
    btnGameoverRestart: document.getElementById("btn-gameover-restart"),

    toastContainer:   document.getElementById("toast-container"),
};

// --- INITIALIZATION ---
function init() {
    setupNavigation();
    setupEventListeners();
    loadGame();
    renderAll();

    // Show welcome modal on first run
    if (state.firstRun) {
        elements.modalWelcome.style.display = "flex";
    }
}

// --- TOAST NOTIFICATION SYSTEM ---
function showToast(message, type = "success", duration = 2800) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, duration + 300); // cleanup after fade-out
}

// Shake a button to signal a failed action
function shakeButton(btn) {
    btn.classList.remove("btn-shake");
    void btn.offsetWidth; // force reflow
    btn.classList.add("btn-shake");
    btn.addEventListener("animationend", () => btn.classList.remove("btn-shake"), { once: true });
}

// --- NAVIGATION TABS ---
function setupNavigation() {
    const buttons = document.querySelectorAll(".nav-button");
    const panels  = document.querySelectorAll(".tab-panel");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("active"));
            panels.forEach(p => p.classList.remove("active"));

            btn.classList.add("active");
            const targetTab = btn.getAttribute("data-tab");
            document.getElementById(targetTab).classList.add("active");

            if (targetTab === "tab-dashboard") {
                renderChart();
            }
        });
    });
}

function setupEventListeners() {
    // Advance Month
    elements.btnAdvanceMonth.addEventListener("click", advanceTurn);

    // Stocks
    elements.btnBuyStock.addEventListener("click",  () => tradeStock(1));
    elements.btnSellStock.addEventListener("click", () => tradeStock(-1));

    // Crypto
    elements.btnBuyCrypto.addEventListener("click",  () => tradeCrypto(0.1));
    elements.btnSellCrypto.addEventListener("click", () => tradeCrypto(-0.1));

    // Bonds
    elements.btnBuyBonds.addEventListener("click",  investBonds);
    elements.btnSellBonds.addEventListener("click", liquidateBonds);

    // Settings
    elements.btnSaveKeys.addEventListener("click",   saveAPIKeys);
    elements.btnResetGame.addEventListener("click",  resetGame);

    // Import/Export
    elements.btnExportCode.addEventListener("click", exportGame);
    elements.btnImportCode.addEventListener("click", importGame);

    // Welcome modal
    elements.btnWelcomeStart.addEventListener("click", () => {
        elements.modalWelcome.style.display = "none";
        state.firstRun = false;
        saveGame();
        // Auto-navigate to Career tab so player picks a job
        document.querySelector('[data-tab="tab-career"]').click();
    });

    // Game over modal
    elements.btnGameoverRestart.addEventListener("click", () => {
        elements.modalGameover.hidden = true;
        resetGame(true);
    });
}

// --- STATE MANAGEMENT ---
function saveGame() {
    localStorage.setItem("profita_state", JSON.stringify(state));
}

function loadGame() {
    const saved = localStorage.getItem("profita_state");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Merge to ensure new keys from updates are present
            state = Object.assign(buildInitialState(), parsed);
            // Ensure history always has ≥ 2 entries
            if (state.netWorthHistory.length < 2) {
                const v = state.netWorthHistory[0] || 10000;
                state.netWorthHistory = [v, v];
            }
        } catch (e) {
            console.error("Failed to load state, starting fresh", e);
        }
    }
}

function resetGame(skipConfirm = false) {
    const confirmed = skipConfirm || confirm("Reset all progress? This cannot be undone.");
    if (confirmed) {
        localStorage.removeItem("profita_state");
        location.reload();
    }
}

// --- CORE CALCULATIONS ---
function getNetWorth(targetState = state) {
    const stockVal  = targetState.stockOwned  * targetState.stockPrice;
    const cryptoVal = targetState.cryptoOwned * targetState.cryptoPrice;
    const bondsVal  = targetState.bondsHeld;

    let propertyEquity = 0;
    let totalDebt = 0;
    targetState.properties.forEach(p => {
        propertyEquity += p.currentPrice;
        totalDebt      += p.mortgageAmount;
    });

    return targetState.cash + stockVal + cryptoVal + bondsVal + propertyEquity - totalDebt;
}

function getMonthlyExpenses(targetState = state) {
    let exp = targetState.career ? targetState.career.expenses : 1200;
    targetState.properties.forEach(p => {
        exp += p.monthlyMaintenance;
        exp += p.monthlyMortgagePayment;
    });
    return exp;
}

function getMonthlyCashFlow(targetState = state) {
    let income = targetState.career ? targetState.career.startingSalary : 0;
    targetState.properties.forEach(p => {
        income += p.monthlyRentalIncome;
    });
    income += targetState.bondsHeld * 0.0025; // 3% annual / 12
    return income - getMonthlyExpenses(targetState);
}

// --- RENDERING ---
function renderAll() {
    renderStatus();
    renderDashboard();
    renderCareer();
    renderAssets();
    renderLeaderboard();
    renderSettings();
}

function renderStatus() {
    elements.age.innerText = state.age;

    const nw = getNetWorth();
    elements.netWorth.innerText = formatCurrency(nw);

    // Monthly delta badge (#11)
    const delta = nw - (state.lastNetWorth || nw);
    if (state.month > 2 && Math.abs(delta) > 0) {
        const sign = delta >= 0 ? "+" : "";
        elements.nwDelta.innerText = `${sign}${formatCurrency(delta)}`;
        elements.nwDelta.className = `nw-delta ${delta >= 0 ? "positive" : "negative"}`;
    } else {
        elements.nwDelta.innerText = "";
        elements.nwDelta.className = "nw-delta";
    }

    const cf = getMonthlyCashFlow();
    elements.cashFlow.innerText = (cf >= 0 ? "+" : "") + formatCurrency(cf) + "/mo";
    elements.cashFlow.className = "value " + (cf >= 0 ? "cashflow-text wealth-text" : "cashflow-text danger-text");

    elements.turnIndicator.innerText = `Month ${state.month} · Age ${state.age}`;
}

function renderDashboard() {
    elements.metricCash.innerText = formatCurrency(state.cash);

    let totalDebt = 0;
    state.properties.forEach(p => totalDebt += p.mortgageAmount);
    elements.metricDebt.innerText = formatCurrency(totalDebt);

    // Goal progress
    const nw  = getNetWorth();
    const pct = Math.min(100, Math.max(0, (nw / state.goalNetWorth) * 100));
    elements.goalProgressText.innerText = `${pct.toFixed(1)}% (${formatCurrency(nw)} / ${formatCurrency(state.goalNetWorth)})`;
    elements.goalProgressFill.style.width = `${pct}%`;

    const yearsLeft = state.goalAge - state.age;
    elements.goalYearsLeft.innerText = yearsLeft > 0
        ? `${yearsLeft} year${yearsLeft !== 1 ? "s" : ""} until retirement`
        : "Retirement age reached!";

    renderChart();
}

function renderChart() {
    const history = state.netWorthHistory;
    if (history.length < 2) return;

    const maxNW   = Math.max(...history);
    const minNW   = Math.min(...history, 0);
    const range   = Math.max(maxNW - minNW, 1);
    const width   = 500;
    const height  = 200;
    const padT    = 14;
    const padB    = 6;

    const toY = val => height - padB - ((val - minNW) / range) * (height - padT - padB);

    const pts = history.map((val, idx) => {
        const x = (idx / (history.length - 1)) * width;
        const y = toY(val);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    elements.chartPath.setAttribute("points", pts.join(" "));

    // Gradient fill polygon
    const fillPts = [
        `0,${height}`,
        ...pts,
        `${width},${height}`
    ];
    elements.chartFill.setAttribute("points", fillPts.join(" "));
}

function renderCareer() {
    if (state.career) {
        elements.careerTitle.innerText  = state.career.title;
        elements.careerSalary.innerText = formatCurrency(state.career.startingSalary);
        elements.careerExpenses.innerText = formatCurrency(state.career.expenses);
    } else {
        elements.careerTitle.innerText    = "Unemployed";
        elements.careerSalary.innerText   = "$0";
        elements.careerExpenses.innerText = "$1,200 (Basic Living)";
    }

    // Up-skilling
    elements.courseList.innerHTML = "";
    if (state.career) {
        const upskillBtn = document.createElement("button");
        upskillBtn.className = "btn btn-buy";

        if (state.upskillActive) {
            const pct = Math.round((state.upskillProgress / 12) * 100);
            upskillBtn.innerHTML = `Studying… ${state.upskillProgress}/12 months (${pct}%)`;
            upskillBtn.disabled = true;
        } else {
            upskillBtn.innerText = `Start Course (${formatCurrency(state.career.upskillCost)})`;
            upskillBtn.addEventListener("click", startUpskill);
            if (state.cash < state.career.upskillCost) {
                upskillBtn.disabled = true;
            }
        }

        const courseDiv = document.createElement("div");
        courseDiv.className = "course-item";
        courseDiv.innerHTML = `
            <div class="item-info">
                <span class="title">${state.career.upskillLabel || "Professional Skill Certification"}</span>
                <span class="subtitle">+20% salary increase · 12-month program</span>
            </div>
        `;
        courseDiv.appendChild(upskillBtn);
        elements.courseList.appendChild(courseDiv);
    } else {
        elements.courseList.innerHTML = `<p class="hint">Pick a career first to access courses.</p>`;
    }

    // Available Careers
    elements.jobList.innerHTML = "";
    CAREERS.forEach(c => {
        if (state.career && state.career.id === c.id) return;

        const applyBtn = document.createElement("button");
        applyBtn.className = "btn btn-buy";
        applyBtn.innerText = "Apply";
        applyBtn.addEventListener("click", () => selectCareer(c));

        const jobDiv = document.createElement("div");
        jobDiv.className = "career-item";
        jobDiv.innerHTML = `
            <div class="item-info">
                <span class="title">${c.title}</span>
                <span class="subtitle">Salary: ${formatCurrency(c.startingSalary)}/mo · Expenses: ${formatCurrency(c.expenses)}/mo</span>
            </div>
        `;
        jobDiv.appendChild(applyBtn);
        elements.jobList.appendChild(jobDiv);
    });
}

function renderAssets() {
    // Stocks
    elements.stockPrice.innerText = formatCurrency(state.stockPrice);
    elements.stockOwned.innerText = state.stockOwned;
    elements.btnSellStock.disabled = state.stockOwned <= 0;
    if (state.stockOwned > 0 && elements.stockValueRow) {
        elements.stockValueRow.innerText = `Portfolio value: ${formatCurrency(state.stockOwned * state.stockPrice)}`;
    }

    // Crypto
    elements.cryptoPrice.innerText = formatCurrency(state.cryptoPrice);
    elements.cryptoOwned.innerText = state.cryptoOwned.toFixed(2);
    elements.btnSellCrypto.disabled = state.cryptoOwned <= 0;
    if (state.cryptoOwned > 0 && elements.cryptoValueRow) {
        elements.cryptoValueRow.innerText = `Portfolio value: ${formatCurrency(state.cryptoOwned * state.cryptoPrice)}`;
    }

    // Bonds
    elements.bondsHeld.innerText = formatCurrency(state.bondsHeld);
    elements.btnSellBonds.disabled = state.bondsHeld <= 0;

    // Properties Market
    elements.propertyList.innerHTML = "";

    // Owned properties set for duplicate guard (#10)
    const ownedIds = new Set(state.properties.map(p => p.id));

    PROPERTIES_FOR_SALE.forEach(p => {
        const downPayment   = p.price * p.downPaymentPercent;
        const mortgage      = p.price - downPayment;
        const interest      = 0.05 / 12;
        const mortgagePayment = Math.round(mortgage * (interest / (1 - Math.pow(1 + interest, -360))));

        const alreadyOwned = ownedIds.has(p.id);
        const canAfford    = state.cash >= downPayment;

        const buyBtn = document.createElement("button");
        buyBtn.className = "btn btn-buy";

        if (alreadyOwned) {
            buyBtn.innerText  = "Already Owned";
            buyBtn.disabled   = true;
        } else {
            buyBtn.innerText  = `Buy (${formatCurrency(downPayment)} down)`;
            buyBtn.disabled   = !canAfford;
            buyBtn.addEventListener("click", () => buyProperty(p, downPayment, mortgage, mortgagePayment));
        }

        const netCashFlow = p.monthlyRent - p.maintenance - mortgagePayment;
        const cfClass     = netCashFlow >= 0 ? "wealth-text" : "danger-text";

        const propDiv = document.createElement("div");
        propDiv.className = "property-item";
        propDiv.innerHTML = `
            <div class="item-info">
                <span class="title">${p.name} · ${formatCurrency(p.price)}</span>
                <span class="subtitle">Rent +${formatCurrency(p.monthlyRent)} · Maint. -${formatCurrency(p.maintenance)} · Mortgage -${formatCurrency(mortgagePayment)}</span>
                <span class="subtitle">Net cash flow: <span class="${cfClass}">${netCashFlow >= 0 ? "+" : ""}${formatCurrency(netCashFlow)}/mo</span></span>
            </div>
        `;
        propDiv.appendChild(buyBtn);
        elements.propertyList.appendChild(propDiv);
    });

    // Owned Real Estate
    if (state.properties.length > 0) {
        const hdr = document.createElement("h3");
        hdr.innerText = "Owned Real Estate";
        hdr.style.marginTop = "1rem";
        elements.propertyList.appendChild(hdr);

        state.properties.forEach((p, idx) => {
            const sellBtn = document.createElement("button");
            sellBtn.className = "btn btn-sell";
            sellBtn.innerText = "Sell";
            sellBtn.addEventListener("click", () => sellProperty(idx));

            const equity = p.currentPrice - p.mortgageAmount;

            const propDiv = document.createElement("div");
            propDiv.className = "property-item";
            propDiv.innerHTML = `
                <div class="item-info">
                    <span class="title">${p.name} · ${formatCurrency(p.currentPrice)}</span>
                    <span class="subtitle">Equity: ${formatCurrency(equity)} · Debt: ${formatCurrency(p.mortgageAmount)}</span>
                    <span class="subtitle">Mortgage: -${formatCurrency(p.monthlyMortgagePayment)}/mo</span>
                </div>
            `;
            propDiv.appendChild(sellBtn);
            elements.propertyList.appendChild(propDiv);
        });
    }
}

function renderLeaderboard() {
    elements.leaderboardBody.innerHTML = "";

    const totalYears = Math.max(1, state.month / 12);
    const calcReturn = (initial, current) =>
        ((Math.pow(Math.max(current, 1) / initial, 1 / totalYears) - 1) * 100).toFixed(1) + "%";

    const playerNW = getNetWorth();
    let leaderboard = [
        { name: "You", nw: playerNW, returnRate: calcReturn(10000, playerNW), strategy: state.career ? state.career.title : "Unemployed", isPlayer: true }
    ];

    state.bots.forEach(bot => {
        const botNW = getNetWorth(bot);
        leaderboard.push({
            name: bot.name,
            nw: botNW,
            returnRate: calcReturn(10000, botNW),
            strategy: getBotStrategyLabel(bot.strategy),
            isPlayer: false
        });
    });

    leaderboard.sort((a, b) => b.nw - a.nw);

    leaderboard.forEach((entry, index) => {
        const row = document.createElement("tr");
        if (entry.isPlayer) row.className = "player-row";

        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}`;

        row.innerHTML = `
            <td>${medal}</td>
            <td>${entry.name}</td>
            <td class="wealth-text">${formatCurrency(entry.nw)}</td>
            <td>${entry.returnRate}</td>
            <td style="font-size:0.78rem;color:var(--text-muted)">${entry.strategy}</td>
        `;
        elements.leaderboardBody.appendChild(row);
    });
}

function renderSettings() {
    elements.keyAlpha.value = state.apiKeys.alphavantage;
    elements.keyGecko.value = state.apiKeys.coingecko;
}

// --- ACTIONS ---
function selectCareer(career) {
    state.career = { ...career };
    state.upskillActive  = false;
    state.upskillProgress = 0;
    saveGame();
    renderAll();
    showToast(`💼 Career changed to ${career.title}!`, "success");
}

function startUpskill() {
    if (state.cash >= state.career.upskillCost) {
        state.cash -= state.career.upskillCost;
        state.upskillActive   = true;
        state.upskillProgress = 0;
        saveGame();
        renderAll();
        showToast(`🎓 Upskilling started! Advance 12 months to complete.`, "success");
    } else {
        shakeButton(document.querySelector("#course-list .btn"));
        showToast(`❌ Not enough cash. Need ${formatCurrency(state.career.upskillCost)}.`, "error");
    }
}

function tradeStock(qty) {
    if (qty > 0) {
        const cost = state.stockPrice * qty;
        if (state.cash >= cost) {
            state.cash    -= cost;
            state.stockOwned += qty;
            showToast(`📊 Bought ${qty} stock share${qty > 1 ? "s" : ""} for ${formatCurrency(cost)}`, "success");
        } else {
            shakeButton(elements.btnBuyStock);
            showToast(`❌ Not enough cash. Need ${formatCurrency(cost)}.`, "error");
            return;
        }
    } else {
        const sellQty = Math.min(state.stockOwned, Math.abs(qty));
        if (sellQty <= 0) {
            shakeButton(elements.btnSellStock);
            showToast("❌ No shares to sell.", "error");
            return;
        }
        const proceeds = state.stockPrice * sellQty;
        state.cash       += proceeds;
        state.stockOwned -= sellQty;
        showToast(`📊 Sold ${sellQty} stock share${sellQty > 1 ? "s" : ""} for ${formatCurrency(proceeds)}`, "success");
    }
    saveGame();
    renderAll();
}

function tradeCrypto(qty) {
    if (qty > 0) {
        const cost = state.cryptoPrice * qty;
        if (state.cash >= cost) {
            state.cash        -= cost;
            state.cryptoOwned += qty;
            showToast(`₿ Bought ${qty.toFixed(1)} BTC for ${formatCurrency(cost)}`, "success");
        } else {
            shakeButton(elements.btnBuyCrypto);
            showToast(`❌ Not enough cash. Need ${formatCurrency(cost)}.`, "error");
            return;
        }
    } else {
        const sellQty = Math.min(state.cryptoOwned, Math.abs(qty));
        if (sellQty <= 0) {
            shakeButton(elements.btnSellCrypto);
            showToast("❌ No crypto to sell.", "error");
            return;
        }
        const proceeds = state.cryptoPrice * sellQty;
        state.cash        += proceeds;
        state.cryptoOwned -= sellQty;
        showToast(`₿ Sold ${sellQty.toFixed(1)} BTC for ${formatCurrency(proceeds)}`, "success");
    }
    saveGame();
    renderAll();
}

function investBonds() {
    const amt = parseFloat(elements.inputBondAmount.value) || 0;
    if (amt < 100) {
        shakeButton(elements.btnBuyBonds);
        showToast("❌ Minimum investment is $100.", "error");
        return;
    }
    if (state.cash >= amt) {
        state.cash      -= amt;
        state.bondsHeld += amt;
        elements.inputBondAmount.value = "";
        saveGame();
        renderAll();
        showToast(`🏛️ Invested ${formatCurrency(amt)} in bonds`, "success");
    } else {
        shakeButton(elements.btnBuyBonds);
        showToast(`❌ Not enough cash. Need ${formatCurrency(amt)}.`, "error");
    }
}

function liquidateBonds() {
    if (state.bondsHeld <= 0) {
        shakeButton(elements.btnSellBonds);
        showToast("❌ No bonds to liquidate.", "error");
        return;
    }
    const amt = state.bondsHeld;
    state.cash      += amt;
    state.bondsHeld  = 0;
    saveGame();
    renderAll();
    showToast(`🏛️ Liquidated ${formatCurrency(amt)} in bonds`, "success");
}

function buyProperty(p, downPayment, mortgage, mortgagePayment) {
    if (state.cash >= downPayment) {
        state.cash -= downPayment;
        state.properties.push({
            id:                   p.id,
            name:                 p.name,
            purchasePrice:        p.price,
            currentPrice:         p.price,
            downPayment:          downPayment,
            mortgageAmount:       mortgage,
            monthlyMortgagePayment: mortgagePayment,
            monthlyRentalIncome:  p.monthlyRent,
            monthlyMaintenance:   p.maintenance
        });
        saveGame();
        renderAll();
        showToast(`🏠 Purchased ${p.name}!`, "success");
    } else {
        showToast(`❌ Not enough cash for the down payment (${formatCurrency(downPayment)}).`, "error");
    }
}

function sellProperty(idx) {
    const p      = state.properties[idx];
    const equity = p.currentPrice - p.mortgageAmount;
    state.cash  += Math.max(0, equity);
    state.properties.splice(idx, 1);
    saveGame();
    renderAll();
    showToast(`🏠 Sold ${p.name} for ${formatCurrency(Math.max(0, equity))} equity`, "success");
}

function saveAPIKeys() {
    state.apiKeys.alphavantage = elements.keyAlpha.value.trim();
    state.apiKeys.coingecko    = elements.keyGecko.value.trim();
    saveGame();
    showToast("🔑 API keys saved!", "success");
}

// --- TURN TICK ---
async function advanceTurn() {
    elements.btnAdvanceMonth.disabled = true;

    // Animated processing state
    elements.btnAdvanceMonth.querySelector(".btn-title").innerText = "⏳ Processing Markets…";

    try {
        // 1. Fetch or simulate asset prices
        await updateAssetPrices();

        // 2. Record last net worth for delta display
        state.lastNetWorth = getNetWorth();

        // 3. Player income / expenses
        const cashFlow = getMonthlyCashFlow();
        state.cash += cashFlow;

        // 4. Mortgage amortization
        state.properties.forEach(p => {
            if (p.mortgageAmount > 0) {
                const monthlyInterest  = p.mortgageAmount * (0.05 / 12);
                const principalPaid    = p.monthlyMortgagePayment - monthlyInterest;
                p.mortgageAmount       = Math.max(0, p.mortgageAmount - principalPaid);
            }
        });

        // 5. Upskilling progress
        if (state.upskillActive) {
            state.upskillProgress++;
            if (state.upskillProgress >= 12) {
                state.upskillActive   = false;
                state.upskillProgress = 0;
                const newSalary = Math.min(state.career.maxSalary, Math.round(state.career.startingSalary * 1.2));
                const raise     = newSalary - state.career.startingSalary;
                state.career.startingSalary = newSalary;
                // Toast instead of alert (#12)
                showToast(`🎓 Upskilling complete! +${formatCurrency(raise)}/mo raise earned!`, "success", 4000);
            }
        }

        // 6. Advance time
        state.month++;
        if (state.month % 12 === 1 && state.month > 1) {
            state.age++;
        }

        // 7. Run bots
        simulateBots();

        // 8. Record net worth history
        state.netWorthHistory.push(getNetWorth());

        // 9. Save
        saveGame();

        // 10. Render
        renderAll();

        // 11. Check game over
        if (state.age >= 65) {
            showGameOver();
        }

    } finally {
        // Always re-enable button — even if an error occurred (#3)
        elements.btnAdvanceMonth.disabled = false;
        elements.btnAdvanceMonth.querySelector(".btn-title").innerText = "⏭ Advance Month";
    }
}

// --- STYLED GAME OVER (#5) ---
function showGameOver() {
    const nw  = getNetWorth();
    const pct = Math.min(100, (nw / state.goalNetWorth) * 100).toFixed(1);

    // Calculate player rank
    const playerNW = nw;
    let rank = 1;
    state.bots.forEach(bot => {
        if (getNetWorth(bot) > playerNW) rank++;
    });

    elements.gameoverNetworth.innerText = formatCurrency(nw);
    elements.gameoverRank.innerText     = `#${rank} of ${state.bots.length + 1}`;
    elements.gameoverGoal.innerText     = `${pct}%`;

    if (nw >= state.goalNetWorth) {
        elements.gameoverIcon.innerText    = "🏆";
        elements.gameoverMessage.innerText = "Incredible! You hit the $2M retirement goal. A true Profita champion!";
    } else if (nw >= state.goalNetWorth * 0.5) {
        elements.gameoverIcon.innerText    = "👍";
        elements.gameoverMessage.innerText = "Solid effort! You made it halfway to your $2M goal. Try a bolder strategy next time.";
    } else {
        elements.gameoverIcon.innerText    = "💪";
        elements.gameoverMessage.innerText = "A humble retirement. Every journey starts somewhere — go again and beat your score!";
    }

    elements.modalGameover.hidden = false;
}

// --- ASSET PRICE UPDATES ---
async function updateAssetPrices() {
    let stockUpdated  = false;
    let cryptoUpdated = false;

    // Alpha Vantage
    if (state.apiKeys.alphavantage) {
        try {
            const res  = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${state.apiKeys.alphavantage}`);
            const data = await res.json();
            if (data["Global Quote"]?.["05. price"]) {
                state.stockPrice = parseFloat(data["Global Quote"]["05. price"]);
                stockUpdated = true;
            }
        } catch (e) {
            console.warn("Alpha Vantage failed, using simulation", e);
        }
    }

    // CoinGecko
    if (state.apiKeys.coingecko) {
        try {
            const res  = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&x_cg_demo_api_key=${state.apiKeys.coingecko}`);
            const data = await res.json();
            if (data.bitcoin?.usd) {
                state.cryptoPrice = data.bitcoin.usd;
                cryptoUpdated = true;
            }
        } catch (e) {
            console.warn("CoinGecko failed, using simulation", e);
        }
    }

    // Simulation fallbacks
    if (!stockUpdated) {
        const drift      = 0.005;
        const volatility = 0.04;
        const change     = drift + (Math.random() - 0.5) * volatility;
        state.stockPrice = Math.max(10, state.stockPrice * (1 + change));
    }

    if (!cryptoUpdated) {
        const drift      = 0.01;
        const volatility = 0.18;
        const change     = drift + (Math.random() - 0.5) * volatility;
        state.cryptoPrice = Math.max(100, state.cryptoPrice * (1 + change));
    }

    // Property appreciation (0.2–0.5% per month)
    state.properties.forEach(p => {
        const growth   = 0.002 + Math.random() * 0.003;
        p.currentPrice = Math.round(p.currentPrice * (1 + growth));
    });
}

// --- BOT SIMULATION (#9 — higher salaries already in initial state) ---
function simulateBots() {
    state.bots.forEach(bot => {
        // Income / expenses
        bot.cash += bot.salary - 1500;
        bot.cash += bot.bondsHeld * 0.0025;

        // Property income/expenses
        bot.properties.forEach(p => {
            bot.cash += p.monthlyRentalIncome - p.monthlyMaintenance - p.monthlyMortgagePayment;
            if (p.mortgageAmount > 0) {
                const monthlyInterest = p.mortgageAmount * (0.05 / 12);
                const principalPaid   = p.monthlyMortgagePayment - monthlyInterest;
                p.mortgageAmount      = Math.max(0, p.mortgageAmount - principalPaid);
            }
        });

        // Strategy-based investing
        if (bot.strategy === "indexer") {
            if (bot.cash > 2000) {
                const investAmt   = (bot.cash - 2000) * 0.85;
                bot.stockOwned   += investAmt / state.stockPrice;
                bot.cash         -= investAmt;
            }
        } else if (bot.strategy === "speculator") {
            if (bot.cash > 1000) {
                const cryptoInvest = (bot.cash - 1000) * 0.7;
                const stockInvest  = (bot.cash - 1000) * 0.1;
                bot.cryptoOwned   += cryptoInvest / state.cryptoPrice;
                bot.stockOwned    += stockInvest  / state.stockPrice;
                bot.cash          -= (cryptoInvest + stockInvest);
            }
        } else if (bot.strategy === "conservative") {
            if (bot.cash > 3000) {
                const investAmt = (bot.cash - 3000) * 0.8;
                bot.bondsHeld  += investAmt;
                bot.cash       -= investAmt;
            }
        } else if (bot.strategy === "realestate") {
            const targetProp  = PROPERTIES_FOR_SALE[1]; // Townhouse
            const downPayment = targetProp.price * targetProp.downPaymentPercent;

            if (bot.cash >= downPayment + 3000 && bot.properties.length < 3) {
                const mortgage       = targetProp.price - downPayment;
                const interest       = 0.05 / 12;
                const mortgagePayment = Math.round(mortgage * (interest / (1 - Math.pow(1 + interest, -360))));

                bot.cash -= downPayment;
                bot.properties.push({
                    name:                   targetProp.name,
                    purchasePrice:          targetProp.price,
                    currentPrice:           targetProp.price,
                    downPayment,
                    mortgageAmount:         mortgage,
                    monthlyMortgagePayment: mortgagePayment,
                    monthlyRentalIncome:    targetProp.monthlyRent,
                    monthlyMaintenance:     targetProp.maintenance
                });
            }
        }

        bot.netWorthHistory.push(getNetWorth(bot));
    });
}

function getBotStrategyLabel(strategy) {
    switch (strategy) {
        case "indexer":      return "90% Index Stocks";
        case "speculator":   return "70% Crypto";
        case "conservative": return "80% Fixed Bonds";
        case "realestate":   return "Leveraged Real Estate";
        default:             return "Unknown";
    }
}

// --- IMPORT / EXPORT ---
function exportGame() {
    const serial = btoa(JSON.stringify(state));
    elements.textExportCode.value = serial;
    elements.exportOutputContainer.style.display = "block";
    elements.textExportCode.select();
    showToast("📋 Code copied! Share with friends.", "success");
}

function importGame() {
    const raw = elements.inputImportCode.value.trim();
    if (!raw) {
        showToast("❌ Paste a friend's code first.", "error");
        return;
    }

    try {
        const importedState = JSON.parse(atob(raw));
        if (importedState.bots && importedState.netWorthHistory) {
            const friendName = prompt("Enter your friend's name:", "Friend");
            if (friendName) {
                state.bots.push({
                    name:             `${friendName} (Import)`,
                    cash:             importedState.cash,
                    stockOwned:       importedState.stockOwned,
                    cryptoOwned:      importedState.cryptoOwned,
                    bondsHeld:        importedState.bondsHeld,
                    properties:       importedState.properties || [],
                    strategy:         "Imported",
                    salary:           0,
                    netWorthHistory:  importedState.netWorthHistory
                });
                saveGame();
                renderAll();
                showToast(`✅ ${friendName}'s stats imported! Check Rankings.`, "success", 3500);
                elements.inputImportCode.value = "";
            }
        } else {
            showToast("❌ Invalid save code format.", "error");
        }
    } catch (e) {
        showToast("❌ Failed to parse code. Is it a valid Profita code?", "error");
    }
}

// --- HELPERS ---
function formatCurrency(val) {
    return new Intl.NumberFormat("en-US", {
        style:                 "currency",
        currency:              "USD",
        maximumFractionDigits: 0
    }).format(val);
}

// Boot
window.onload = init;
