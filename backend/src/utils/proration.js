const PLAN_TIERS = {
  'basic': 1,
  'premium': 2,
  'business': 3,
};

function getPlanTier(planName) {
  return PLAN_TIERS[planName.toLowerCase()] || 0;
}

function isUpgrade(currentPlanName, newPlanName) {
  return getPlanTier(newPlanName) > getPlanTier(currentPlanName);
}

function isDowngrade(currentPlanName, newPlanName) {
  return getPlanTier(newPlanName) < getPlanTier(currentPlanName);
}

function getDaysInBillingCycle(feeTerm) {
  switch (feeTerm) {
    case 'yearly': return 365;
    case 'half-yearly': return 182;
    case 'quarterly': return 91;
    case 'monthly': return 30;
    default: return 365;
  }
}

function calculateRemainingDays(startDate, endDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function calculateTotalDays(startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - start.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function calculateRemainingValue(amountPaid, startDate, endDate) {
  const remainingDays = calculateRemainingDays(startDate, endDate);
  const totalDays = calculateTotalDays(startDate, endDate);
  if (totalDays <= 0 || remainingDays <= 0) return 0;
  return Math.round((remainingDays / totalDays) * amountPaid * 100) / 100;
}

function calculateUpgradePayable(newPlanPrice, currentAmountPaid, currentStartDate, currentEndDate, existingCredit = 0) {
  const remainingValue = calculateRemainingValue(currentAmountPaid, currentStartDate, currentEndDate);
  const remainingDays = calculateRemainingDays(currentStartDate, currentEndDate);

  let totalCredit = remainingValue + (existingCredit || 0);
  let payableAmount = Math.max(0, newPlanPrice - totalCredit);

  payableAmount = Math.round(payableAmount * 100) / 100;
  totalCredit = Math.round(totalCredit * 100) / 100;

  return {
    originalAmount: Math.round(newPlanPrice * 100) / 100,
    creditApplied: Math.round(remainingValue * 100) / 100,
    existingCreditUsed: Math.round((existingCredit || 0) * 100) / 100,
    totalCreditApplied: totalCredit,
    payableAmount,
    remainingDays,
  };
}

function calculateEndDate(fromDate, feeTerm) {
  const date = new Date(fromDate);
  switch (feeTerm) {
    case 'yearly': date.setFullYear(date.getFullYear() + 1); break;
    case 'half-yearly': date.setMonth(date.getMonth() + 6); break;
    case 'quarterly': date.setMonth(date.getMonth() + 3); break;
    case 'monthly': date.setMonth(date.getMonth() + 1); break;
    default: throw new Error(`Invalid fee term: ${feeTerm}`);
  }
  return date;
}

module.exports = {
  getPlanTier,
  isUpgrade,
  isDowngrade,
  getDaysInBillingCycle,
  calculateRemainingDays,
  calculateTotalDays,
  calculateRemainingValue,
  calculateUpgradePayable,
  calculateEndDate,
};
