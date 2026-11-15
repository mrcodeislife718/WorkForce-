const test = require('node:test');
const assert = require('node:assert/strict');
const { assertStripePriceMatches } = require('../services/billingService');

test('published monthly price must exactly match Stripe price', () => {
  const worker = { base_price: '29.99', price_model: 'subscription' };
  const price = {
    active: true, currency: 'usd', unit_amount: 2999,
    type: 'recurring', recurring: { interval: 'month', interval_count: 1 },
  };
  assert.doesNotThrow(() => assertStripePriceMatches(worker, price));
  assert.throws(() => assertStripePriceMatches(worker, { ...price, unit_amount: 3000 }), /does not match/);
});

test('one-time licenses cannot accidentally use recurring prices', () => {
  const worker = { base_price: '50.00', price_model: 'one_time' };
  const price = { active: true, currency: 'usd', unit_amount: 5000, type: 'one_time' };
  assert.doesNotThrow(() => assertStripePriceMatches(worker, price));
  assert.throws(() => assertStripePriceMatches(worker, { ...price, type: 'recurring' }), /one-time/);
});

test('inactive provider prices and incorrect currencies are rejected', () => {
  const worker = { base_price: '50.00', price_model: 'one_time' };
  assert.throws(() => assertStripePriceMatches(worker, {
    active: false, currency: 'usd', unit_amount: 5000, type: 'one_time',
  }), /does not match/);
  assert.throws(() => assertStripePriceMatches(worker, {
    active: true, currency: 'eur', unit_amount: 5000, type: 'one_time',
  }), /does not match/);
});
