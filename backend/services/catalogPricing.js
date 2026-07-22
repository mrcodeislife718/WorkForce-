const ORCA_LAUNCH_RATE_PERCENT = 35;

function positiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function calculateLaunchPricing(worker = {}) {
  const annualHumanSalary = positiveNumber(worker.regular_salary_annual);
  const monthlyHumanSalary = annualHumanSalary > 0 ? annualHumanSalary / 12 : 0;
  const monthlyPrice = monthlyHumanSalary > 0
    ? Math.round(monthlyHumanSalary * (ORCA_LAUNCH_RATE_PERCENT / 100))
    : 0;

  return {
    launch_rate_percent: ORCA_LAUNCH_RATE_PERCENT,
    customer_savings_percent: 100 - ORCA_LAUNCH_RATE_PERCENT,
    regular_salary_annual: annualHumanSalary > 0 ? Math.round(annualHumanSalary) : 0,
    regular_salary_monthly: monthlyHumanSalary > 0 ? Math.round(monthlyHumanSalary) : 0,
    orca_monthly_price: monthlyPrice,
    monthly_salary_savings: monthlyHumanSalary > 0 ? Math.round(monthlyHumanSalary - monthlyPrice) : 0,
  };
}

function calculateBundlePricing(workers = [], launchRatePercent = ORCA_LAUNCH_RATE_PERCENT) {
  const normalizedRate = positiveNumber(launchRatePercent) || ORCA_LAUNCH_RATE_PERCENT;
  const regularSalaryMonthly = workers.reduce((total, worker) => {
    const annual = positiveNumber(worker.regular_salary_annual);
    return total + (annual > 0 ? annual / 12 : 0);
  }, 0);
  const orcaMonthlyPrice = regularSalaryMonthly > 0
    ? Math.round(regularSalaryMonthly * (normalizedRate / 100))
    : 0;

  return {
    launch_rate_percent: normalizedRate,
    customer_savings_percent: 100 - normalizedRate,
    regular_salary_monthly: Math.round(regularSalaryMonthly),
    orca_monthly_price: orcaMonthlyPrice,
    monthly_salary_savings: Math.round(regularSalaryMonthly - orcaMonthlyPrice),
  };
}

module.exports = {
  ORCA_LAUNCH_RATE_PERCENT,
  calculateLaunchPricing,
  calculateBundlePricing,
};
