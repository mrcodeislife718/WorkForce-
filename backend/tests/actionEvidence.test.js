const test = require('node:test');
const assert = require('node:assert/strict');
const { redactEvidence, publicActionEvidence, buildCompletionMessages } = require('../services/actionEvidence');

test('real provider observations are attached to the same capability execution', () => {
  const observation = publicActionEvidence({
    capabilityKey: 'orders.read',
    executionId: 'exec_123',
    providerResult: { status: 200, data: { orders: [{ id: 'order_42', status: 'shipped' }] } },
  });
  assert.equal(observation.capability_key, 'orders.read');
  assert.equal(observation.execution_id, 'exec_123');
  assert.match(observation.observed_data_excerpt, /order_42/);
});

test('sensitive key fields are removed recursively before model synthesis', () => {
  const result = redactEvidence({
    api_key: 'never-show',
    nested: { access_token: 'private-token', customer: { id: 'customer_99' } },
    items: [{ password: 'dont-leak', name: 'example' }],
  });
  assert.equal(result.api_key, '[redacted]');
  assert.equal(result.nested.access_token, '[redacted]');
  assert.equal(result.items[0].password, '[redacted]');
  assert.equal(result.nested.customer.id, 'customer_99');
  assert.doesNotMatch(JSON.stringify(result), /never-show|private-token|dont-leak/);
});

test('untrusted tool data is bounded and clearly identified as non-instructions', () => {
  const evidence = publicActionEvidence({
    capabilityKey: 'api.request',
    executionId: 'exec_999',
    providerResult: { status: 200, data: { long: 'a'.repeat(20000) } },
  });
  assert.ok(evidence.observed_data_excerpt.length <= 5012);
  assert.equal(evidence.truncated, true);
  const messages = buildCompletionMessages({
    instructions: 'Summarize the order response.',
    summary: 'Read the orders',
    draft: 'Orders might be available.',
    actions: [evidence],
  });
  assert.equal(messages[0].role, 'customer');
  assert.match(messages[0].content, /UNTRUSTED DATA/);
  assert.match(messages[0].content, /exec_999/);
});
