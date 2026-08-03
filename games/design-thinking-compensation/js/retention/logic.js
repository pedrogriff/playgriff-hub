// js/retention/logic.js - Zero-Build ES Module for Retention Math & Governance Rules

/**
 * Calculates required 2-year equity refresh grant to reach target percentile benchmark.
 */
export function calculateGrant(profile, targetKey) {
  const targetValue = profile.benchmarks[targetKey] || 0.0;
  const year1Total = profile.intendedCashFlows.year1Total || 0;
  const year2Total = profile.intendedCashFlows.year2Total || 0;
  const currentAnnual = (year1Total + year2Total) / 2;
  const gap = Math.max(0.0, targetValue - currentAnnual);

  // 2-year refresh grant rounded to nearest $10,000
  const twoYearGrantNeeded = gap * 2;
  const roundedGrant = Math.round(twoYearGrantNeeded / 10000) * 10000.0;

  return {
    targetPercentile: targetKey,
    targetAnnualCashFlow: targetValue,
    currentAnnualCashFlow: currentAnnual,
    gap,
    twoYearGrantNeeded: roundedGrant
  };
}

/**
 * Evaluates retention risk level, detects cash-flow cliffs, and enforces all governance policies.
 */
export function analyzeRetention(profile) {
  const { lastRatings = [], talentDesignation = '', intendedCashFlows = {}, recentPromotionDate, currentCycleTDR = 0, previousCycleTDR = 0 } = profile;

  const isExceptional = lastRatings.some(r => ["Exceptional Impact", "Exceeds Expectations"].includes(r)) ||
                        ["Strategic Key Talent - P0", "Core Tech - Tier 1", "Critical Skill - P0"].includes(talentDesignation);
  const isHighPerformer = lastRatings.some(r => ["Exceptional Impact", "Exceeds Expectations"].includes(r));
  const hasLowRating = lastRatings.some(r => ["Needs Improvement", "Unsatisfactory"].includes(r));
  const allMeetsExpectations = lastRatings.length > 0 && lastRatings.every(r => r === "Meets Expectations");

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
  const promoDate = recentPromotionDate ? new Date(recentPromotionDate) : null;
  const recentPromo = promoDate && promoDate > sixMonthsAgo;

  const numericPercentile = parseFloat(String(profile.peerPercentile).replace(/[^0-9.-]+/g, '')) || 0.0;
  const diffPercent = previousCycleTDR > 0 ? ((currentCycleTDR / previousCycleTDR) - 1) * 100 : 0.0;

  // Cliff Detection (Year 2 drop > 10% vs Year 1)
  const year1Total = intendedCashFlows.year1Total || 0;
  const year2Total = intendedCashFlows.year2Total || 0;
  const isFacingCliff = year1Total > 0 && year2Total < (year1Total * 0.9);

  let riskLevel = "Low";
  let recommendation = "";
  let justification = "";
  let performanceContext = "";

  if (hasLowRating) {
    riskLevel = "Low";
    recommendation = "No immediate action; include in standard annual cycle.";
    justification = "Performance ratings do not meet the threshold for proactive retention grants. Focus on performance development and coaching.";
    performanceContext = "Performance history indicates areas for improvement.";
  } else if (allMeetsExpectations && numericPercentile > 50) {
    riskLevel = "Low";
    recommendation = "No action recommended; maintain current positioning.";
    justification = "As a financial steward of organizational resources, we must prioritize limited retention budget for top-tier performers or those significantly below market median. This individual has received multiple 'Meets Expectations' ratings but is already positioned above the 50th percentile, indicating they are appropriately rewarded for their current impact level.";
    performanceContext = "Consistent 'Meets Expectations' contributor with stable performance.";
  } else if (isHighPerformer && numericPercentile < 40 && !recentPromo) {
    riskLevel = "High";
    recommendation = "Immediate Off-Cycle Equity Refresh (Target 75th Percentile)";
    justification = `Top-tier talent currently compensated significantly below peers (${numericPercentile}th percentile). High flight risk due to market demand for ${profile.role}s at ${profile.level}.`;
    performanceContext = "Exceptional trajectory with consistent high-impact delivery.";
  } else if (numericPercentile < 50 || isFacingCliff) {
    riskLevel = "Medium";
    recommendation = "Proactive Equity Adjustment to P50 Baseline";
    justification = `Employee is facing a cash-flow cliff or below market median (${numericPercentile}th percentile).`;
    performanceContext = "Solid performance history with growth potential.";
  } else {
    riskLevel = "Low";
    recommendation = "No immediate action; include in standard annual cycle.";
    justification = "Compensation is well-aligned with current performance and market benchmarks.";
    performanceContext = "Meeting expectations with stable performance history.";
  }

  if (profile.hasPriorOffCycleAward) {
    recommendation += " (Subject to Executive Exception)";
    justification += ` Note: Received prior off-cycle award on ${profile.priorOffCycleAwardDate || 'a previous date'}. Proactive grants are limited to once every 24 months; requires Division Lead exception.`;
  }

  if (isFacingCliff && !isExceptional && numericPercentile > 75) {
    recommendation = "No action recommended; maintain P75 cap.";
    justification += " Policy Restriction: For standard performers facing a cash flow cliff, target compensation must not exceed P75.";
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
    performanceContext,
    isFacingCliff,
    compensationGap: `Current cycle TDR ($${(currentCycleTDR/1000).toFixed(0)}k) is ${diffPercent >= 0 ? 'up' : 'down'} ${Math.abs(diffPercent).toFixed(1)}% vs prior year.`,
    exitStats
  };
}
