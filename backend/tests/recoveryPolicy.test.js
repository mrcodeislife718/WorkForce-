const test = require('node:test');
const assert = require('node:assert/strict');
const { recoveryDisposition } = require('../runtime/recoveryPolicy');

test('safe queued work and known completed steps can resume', () => {
  assert.equal(recoveryDisposition({ job_type: 'sample_assignment' }), 'retry');
  assert.equal(recoveryDisposition({ job_type: 'deployment_task', payload: {} }, []), 'retry');
  assert.equal(recoveryDisposition({
    job_type: 'deployment_task', payload: {
      action_results: [{ status: 'succeeded', execution_id: 'done-1' }],
    },
  }, [{ id: 'done-1', status: 'succeeded' }]), 'retry');
});

test('unknown external side effects cannot be repeated automatically', () => {
  const job = { job_type: 'deployment_task', payload: { action_results: [] } };
  assert.equal(recoveryDisposition(job, [{ id: 'action-1', status: 'running' }]), 'human_reconciliation');
  assert.equal(recoveryDisposition(job, [{ id: 'action-1', status: 'succeeded' }]), 'human_reconciliation');
  assert.equal(recoveryDisposition(job, [{ id: 'action-1', status: 'failed' }]), 'human_reconciliation');
});
