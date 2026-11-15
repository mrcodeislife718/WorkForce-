const test = require('node:test');
const assert = require('node:assert/strict');
const { checkoutPaid } = require('../services/oneTimePurchaseService');

test('one-time payment is not activated until Stripe confirms payment', () => {
  assert.equal(checkoutPaid({ mode: 'payment', payment_status: 'unpaid' }), false);
  assert.equal(checkoutPaid({ mode: 'payment', payment_status: 'paid' }), true);
  assert.equal(checkoutPaid({ mode: 'subscription', payment_status: 'paid' }), false);
});
