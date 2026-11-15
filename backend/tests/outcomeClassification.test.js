const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyDeliveryProof } = require('../services/runtimeAccounting');

test('completed actions await actual customer outcome review', () => {
  const result = classifyDeliveryProof({
    actionResults: [{ status: 'succeeded' }, { status: 'succeeded' }],
    expectedActionCount: 2,
    deliverable: 'Two customer-authorized updates completed; awaiting your review.',
  });
  assert.equal(result.status, 'inconclusive');
  assert.equal(result.score, 1);
});

test('meaningful knowledge work can be delivered without side effects', () => {
  assert.equal(classifyDeliveryProof({
    actionResults: [],
    expectedActionCount: 0,
    deliverable: 'A completed research brief, ready for review.',
  }).status, 'inconclusive');
});

test('an empty plan is not a completed task', () => {
  assert.equal(classifyDeliveryProof({
    actionResults: [],
    expectedActionCount: 0,
  }).status, 'rejected');
});

test('failed or missing external actions cannot be called complete', () => {
  assert.equal(classifyDeliveryProof({
    actionResults: [{ status: 'failed' }],
    expectedActionCount: 1,
  }).status, 'rejected');
  assert.equal(classifyDeliveryProof({
    actionResults: [{ status: 'succeeded' }],
    expectedActionCount: 2,
  }).status, 'rejected');
});

test('successful tool actions without a useful written deliverable are not complete', () => {
  assert.equal(classifyDeliveryProof({
    actionResults: [{ status: 'succeeded' }],
    expectedActionCount: 1,
    deliverable: '',
  }).status, 'rejected');
});
