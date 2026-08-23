const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateLaunchPricing, calculateBundlePricing } = require('../services/catalogPricing');

test('digital employee launch price is 35 percent of regular salary', () => {
  const pricing = calculateLaunchPricing({ regular_salary_annual: 96000 });
  assert.equal(pricing.regular_salary_monthly, 8000);
  assert.equal(pricing.orca_monthly_price, 2800);
  assert.equal(pricing.monthly_salary_savings, 5200);
  assert.equal(pricing.customer_savings_percent, 65);
});

test('team pricing totals member salaries before applying launch rate', () => {
  const pricing = calculateBundlePricing([
    { regular_salary_annual: 60000 },
    { regular_salary_annual: 84000 },
  ]);
  assert.equal(pricing.regular_salary_monthly, 12000);
  assert.equal(pricing.orca_monthly_price, 4200);
  assert.equal(pricing.monthly_salary_savings, 7800);
});

test('missing salary does not create cheap placeholder pricing', () => {
  const pricing = calculateLaunchPricing({});
  assert.equal(pricing.orca_monthly_price, 0);
  assert.equal(pricing.regular_salary_monthly, 0);
});
