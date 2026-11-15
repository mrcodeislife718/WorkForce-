'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { isBundleActive, subscriptionEnd } = require('../services/bundleBillingService');

test('team employee entitlement requires an actually active monthly period', () => {
  const tomorrow = new Date(Date.now() + 86400000);
  const yesterday = new Date(Date.now() - 86400000);
  assert.equal(isBundleActive({ status: 'active', current_period_end: tomorrow }), true);
  assert.equal(isBundleActive({ status: 'trialing', current_period_end: tomorrow }), true);
  assert.equal(isBundleActive({ status: 'past_due', current_period_end: tomorrow }), false);
  assert.equal(isBundleActive({ status: 'canceled', current_period_end: tomorrow }), false);
  assert.equal(isBundleActive({ status: 'active', current_period_end: yesterday }), false);
  assert.equal(isBundleActive({ status: 'active', current_period_end: null }), false);
});

test('monthly period uses earliest worker line item expiry rather than pretending permanent access', () => {
  const end = subscriptionEnd({
    items: { data: [
      { current_period_end: 1797000000 },
      { current_period_end: 1796000000 },
      { current_period_end: 1796500000 },
    ] },
  });
  assert.equal(end.toISOString(), new Date(1796000000 * 1000).toISOString());
  assert.equal(subscriptionEnd({ items: { data: [] } }), null);
});

test('top-level Stripe expiry is respected if earlier than an item expiry', () => {
  const end = subscriptionEnd({
    current_period_end: 1795900000,
    items: { data: [{ current_period_end: 1796100000 }] },
  });
  assert.equal(end.toISOString(), new Date(1795900000 * 1000).toISOString());
});
