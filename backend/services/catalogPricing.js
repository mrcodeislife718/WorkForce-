const ORCA_LAUNCH_RATE_PERCENT = 35;

function positiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function calculateLaunchPricing(worker = {}) {
  const annualHumanSalary = positiveNumber(worker.regular_salary_annual);
  const monthlyHumanSalary = annualHumanSalary > 0 ? annualHumanSalary / 12 : 0;
  const listedPrice = positiveNumber(worker.base_price);
  const monthlyPrice = worker.price_model === 'one_time' || worker.price_model === 'free'
    ? 0
    : listedPrice;
  const listedPercent = monthlyHumanSalary && monthlyPrice
    ? Number(((monthlyPrice / monthlyHumanSalary) * 100).toFixed(2))
    : null;

  return {
    launch_rate_percent: listedPercent,
    customer_savings_percent: listedPercent === null ? null : Number((100 - listedPercent).toFixed(2)),
    regular_salary_annual: annualHumanSalary > 0 ? Math.round(annualHumanSalary) : 0,
    regular_salary_monthly: monthlyHumanSalary > 0 ? Math.round(monthlyHumanSalary) : 0,
    orca_monthly_price: monthlyPrice,
    monthly_salary_savings: monthlyHumanSalary > 0 && monthlyPrice > 0
      ? Number((monthlyHumanSalary - monthlyPrice).toFixed(2))
      : null,
  };
}

function calculateBundlePricing(workers = [], launchRatePercent = ORCA_LAUNCH_RATE_PERCENT) {
  const regularSalaryMonthly = workers.reduce((total, worker) => {
    const annual = positiveNumber(worker.regular_salary_annual);
    return total + (annual > 0 ? annual / 12 : 0);
  }, 0);
  // A team or department price is the sum of its actual listed monthly employee
  // prices. Never substitute a salary-based estimate for a real commercial price.
  const priced = workers.length > 0 && workers.every((worker) =>
    worker.price_model === 'subscription' && positiveNumber(worker.base_price) > 0
  );
  const orcaMonthlyPrice = priced
    ? Number(workers.reduce((total, worker) => total + positiveNumber(worker.base_price), 0).toFixed(2))
    : 0;
  const listedPercent = regularSalaryMonthly > 0 && orcaMonthlyPrice > 0
    ? Number(((orcaMonthlyPrice / regularSalaryMonthly) * 100).toFixed(2))
    : null;

  return {
    launch_rate_percent: listedPercent,
    customer_savings_percent: listedPercent === null ? null : Number((100 - listedPercent).toFixed(2)),
    regular_salary_monthly: Math.round(regularSalaryMonthly),
    orca_monthly_price: orcaMonthlyPrice,
    monthly_salary_savings: listedPercent === null ? null
      : Number((regularSalaryMonthly - orcaMonthlyPrice).toFixed(2)),
    price_status: priced ? 'priced_monthly' : 'requires_monthly_pricing',
  };
}

module.exports = {
  ORCA_LAUNCH_RATE_PERCENT,
  calculateLaunchPricing,
  calculateBundlePricing,
};
