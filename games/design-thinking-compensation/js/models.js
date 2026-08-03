// js/models.js - Anonymized Data Models for Ember Keep Retention Radar

export class EmployeeProfile {
  constructor({
    id = '',
    name = '',
    employeeHandle = '',
    role = '',
    level = '',
    divisionLead = '',
    talentDesignation = '',
    peerPercentile = '',
    currentCycleTDR = 0,
    previousCycleTDR = 0,
    lastRatings = [],
    hasPriorOffCycleAward = false,
    priorOffCycleAwardDate = null,
    recentPromotionDate = null,
    intendedCashFlows = {},
    benchmarks = {}
  } = {}) {
    this.id = id;
    this.name = name;
    this.employeeHandle = employeeHandle;
    this.role = role;
    this.level = level;
    this.divisionLead = divisionLead;
    this.talentDesignation = talentDesignation;
    this.peerPercentile = peerPercentile;
    this.currentCycleTDR = currentCycleTDR;
    this.previousCycleTDR = previousCycleTDR;
    this.lastRatings = lastRatings;
    this.hasPriorOffCycleAward = hasPriorOffCycleAward;
    this.priorOffCycleAwardDate = priorOffCycleAwardDate;
    this.recentPromotionDate = recentPromotionDate;
    this.intendedCashFlows = intendedCashFlows;
    this.benchmarks = benchmarks;
  }
}

export class SavedAward {
  constructor({
    id = '',
    employee_handle = '',
    grant_amount = 0,
    target_percentile = '75th',
    status = 'Draft',
    justification = '',
    created_at = new Date().toISOString()
  } = {}) {
    this.id = id;
    this.employee_handle = employee_handle;
    this.grant_amount = grant_amount;
    this.target_percentile = target_percentile;
    this.status = status;
    this.justification = justification;
    this.created_at = created_at;
  }
}
