const test = require('node:test');
const assert = require('node:assert/strict');
const { assertStripePriceMatches } = require('../services/billingService');

const monthly = {
  active: true, currency: 'usd', unit_amount: 280000,
  type: 'recurring', recurring: { interval: 'month', interval_count: 1 },
};

test('premium published monthly price must exactly match Stripe price', () => {
  const worker = { base_price: '2800.00', price_model: 'subscription' };
  assert.doesNotThrow(() => assertStripePriceMatches(worker, monthly));
  assert.throws(() => assertStripePriceMatches(worker, { ...monthly, unit_amount: 280001 }), /does not match/);
});

test('new Workforce employee hires cannot use one-time or free Stripe pricing', () => {
  const worker = { base_price: '2800.00', price_model: 'one_time' };
  assert.throws(() => assertStripePriceMatches(worker, monthly), /monthly subscriptions/);
  assert.throws(() => assertStripePriceMatches({ ...worker, price_model: 'free' }, monthly), /monthly subscriptions/);
  assert.throws(() => assertStripePriceMatches({ ...worker, price_model: 'subscription' }, {
    active: true, currency: 'usd', unit_amount: 280000, type: 'one_time',
  }), /matching monthly Stripe price/);
});

test('annual, inactive, incorrectly priced, and non-USD prices are rejected', () => {
  const worker = { base_price: '2800.00', price_model: 'subscription' };
  assert.throws(() => assertStripePriceMatches(worker, {
    ...monthly, recurring: { interval: 'year', interval_count: 1 },
  }), /matching monthly/);
  assert.throws(() => assertStripePriceMatches(worker, { ...monthly, active: false }), /does not match/);
  assert.throws(() => assertStripePriceMatches(worker, { ...monthly, currency: 'eur' }), /does not match/);
});