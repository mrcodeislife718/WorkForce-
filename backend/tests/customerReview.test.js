const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCustomerReview } = require('../services/customerReview');

test('acceptance can record customer-confirmed savings and feedback', () => {
  assert.deepEqual(
    parseCustomerReview({ decision: 'accepted', rating: 5, feedback: 'Useful result', minutes_saved: 30 }),
    { status: 'verified', rating: 5, feedback: 'Useful result', customer_reported_minutes_saved: 30 },
  );
});

test('rejected work needs actionable correction feedback', () => {
  assert.throws(() => parseCustomerReview({ decision: 'rejected', feedback: 'bad' }), /at least 10/);
  assert.equal(parseCustomerReview({
    decision: 'rejected', feedback: 'The customer email address is incorrect.',
  }).status, 'rejected');
});

test('out-of-range and fabricated saving amounts cannot be recorded', () => {
  assert.throws(() => parseCustomerReview({ decision: 'accepted', rating: 6 }), /Rating/);
  assert.throws(() => parseCustomerReview({ decision: 'accepted', minutes_saved: -3 }), /minutes/);
  assert.throws(() => parseCustomerReview({ decision: 'accepted', minutes_saved: 'not a number' }), /minutes/);
});

test('customer rejection never claims minutes saved', () => {
  assert.equal(
    parseCustomerReview({ decision: 'rejected', feedback: 'Please correct the spreadsheet.', minutes_saved: 500 })
      .customer_reported_minutes_saved,
    null,
  );
});
