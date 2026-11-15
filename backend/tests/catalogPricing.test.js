const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateLaunchPricing, calculateBundlePricing } = require('../services/catalogPricing');

test('digital employee launch price is 35 percent of regular salary', () => {
  const pricing = calculateLaunchPricing({ regular_salary_annual: 96000, base_price: 2800, price_model: 'subscription' });
  assert.equal(pricing.regular_salary_monthly, 8000);
  assert.equal(pricing.orca_monthly_price, 2800);
  assert.equal(pricing.monthly_salary_savings, 5200);
  assert.equal(pricing.customer_savings_percent, 65);
});

test('team pricing totals member salaries before applying launch rate', () => {
  const pricing = calculateBundlePricing([
    { regular_salary_annual: 60000, base_price: 1750, price_model: 'subscription' },
    { regular_salary_annual: 84000, base_price: 2450, price_model: 'subscription' },
  ]);
  assert.equal(pricing.regular_salary_monthly, 12000);
  assert.equal(pricing.orca_monthly_price, 4200);
  assert.equal(pricing.monthly_salary_savings, 7800);
});

test('checkout price is not overridden by estimated salary pricing', () => {
  const pricing = calculateLaunchPricing({ regular_salary_annual: 96000, base_price: 2950 });
  assert.equal(pricing.orca_monthly_price, 2950);
  assert.equal(pricing.launch_rate_percent, 36.88);
});

test('historical one-time purchases are not incorrectly labeled monthly', () => {
  const pricing = calculateLaunchPricing({
    regular_salary_annual: 96000, base_price: 1500, price_model: 'one_time',
  });
  assert.equal(pricing.orca_monthly_price, 0);
});

test('team pricing does not invent a price for an unpriced member', () => {
  const pricing = calculateBundlePricing([
    { regular_salary_annual: 96000, base_price: 2800, price_model: 'subscription' },
    { regular_salary_annual: 96000, base_price: 0, price_model: 'subscription' },
  ]);
  assert.equal(pricing.orca_monthly_price, 0);
  assert.equal(pricing.price_status, 'requires_monthly_pricing');
  assert.equal(pricing.customer_savings_percent, null);
});

test('bundle totals actual member prices rather than replacing them with an estimated 35%', () => {
  const pricing = calculateBundlePricing([
    { regular_salary_annual: 96000, base_price: 3000, price_model: 'subscription' },
    { regular_salary_annual: 96000, base_price: 2800, price_model: 'subscription' },
  ]);
  assert.equal(pricing.orca_monthly_price, 5800);
  assert.equal(pricing.launch_rate_percent, 36.25);
});

test('missing salary does not create cheap placeholder pricing', () => {
  const pricing = calculateLaunchPricing({});
  assert.equal(pricing.orca_monthly_price, 0);
  assert.equal(pricing.regular_salary_monthly, 0);
});
