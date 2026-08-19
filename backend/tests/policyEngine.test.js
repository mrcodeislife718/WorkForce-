const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateAction, enforceAction, PolicyViolationError } = require('../runtime/PolicyEngine');

function fixture(overrides = {}) {
  return {
    deployment: { id: 'dep-1', status: 'active' },
    deploymentConnection: {
      id: 'conn-1',
      status: 'active',
      selected_resource_ids: ['approved-resource'],
    },
    grant: {
      approved: true,
      capability_key: 'crm.update',
      constraints: {},
    },
    capabilityKey: 'crm.update',
    input: { resource_id: 'approved-resource', operation: 'update' },
    context: {},
    ...overrides,
  };
}

test('allows an action inside granted authority', () => {
  const decision = evaluateAction(fixture());
  assert.equal(decision.allowed, true);
  assert.deepEqual(decision.reasons, []);
  assert.equal(decision.policy_version, 'workforce-runtime-policy/v1');
});

test('denies resources outside the approved boundary', () => {
  const decision = evaluateAction(fixture({ input: { resource_id: 'other-resource', operation: 'update' } }));
  assert.equal(decision.allowed, false);
  assert.ok(decision.reasons.includes('resource_outside_approved_boundary'));
});

test('enforces operation allowlists', () => {
  const args = fixture();
  args.grant.constraints = { allowed_operations: ['read'] };
  const decision = evaluateAction(args);
  assert.equal(decision.allowed, false);
  assert.ok(decision.reasons.includes('operation_not_allowed'));
});

test('enforces per-task action budgets', () => {
  const args = fixture();
  args.grant.constraints = { max_actions_per_task: 3 };
  args.context = { actionCount: 3 };
  const decision = evaluateAction(args);
  assert.equal(decision.allowed, false);
  assert.ok(decision.reasons.includes('task_action_budget_exhausted'));
});

test('enforces task cost budgets before execution', () => {
  const args = fixture();
  args.grant.constraints = { max_task_cost_usd: 1 };
  args.context = { taskCostUsd: 0.9, estimatedActionCostUsd: 0.2 };
  const decision = evaluateAction(args);
  assert.equal(decision.allowed, false);
  assert.ok(decision.reasons.includes('task_cost_budget_exceeded'));
});

test('enforceAction fails closed with a typed policy error', () => {
  const args = fixture();
  args.deployment.status = 'paused';
  assert.throws(
    () => enforceAction(args),
    (error) => error instanceof PolicyViolationError
      && error.code === 'WORKFORCE_POLICY_DENIED'
      && error.decision.reasons.includes('deployment_not_active'),
  );
});
