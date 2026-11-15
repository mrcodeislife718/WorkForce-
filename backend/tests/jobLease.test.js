const test = require('node:test');
const assert = require('node:assert/strict');
const {
  staleAfterMs, heartbeatIntervalMs, createJobHeartbeat, verifyOwnedLease,
} = require('../runtime/jobLease');

test('heartbeat interval remains safely below recovery cutoff', () => {
  assert.equal(staleAfterMs({ RUNTIME_STALE_LOCK_MS: '900000' }), 900000);
  assert.equal(heartbeatIntervalMs({ RUNTIME_STALE_LOCK_MS: '900000' }), 30000);
  assert.throws(() => heartbeatIntervalMs({
    RUNTIME_STALE_LOCK_MS: '120000', RUNTIME_HEARTBEAT_MS: '60000',
  }), /less than one third/);
});

test('only current running worker can perform external actions', async () => {
  const model = {
    async findOne({ where }) {
      if (where.locked_by === 'worker-A' && where.status === 'running') return { id: where.id };
      return null;
    },
  };
  await assert.doesNotReject(verifyOwnedLease({ model, id: 'job-1', workerId: 'worker-A' }));
  await assert.rejects(verifyOwnedLease({ model, id: 'job-1', workerId: 'worker-B' }), /ownership was lost/);
});

test('heartbeat writes remain scoped to original owner and running state', async () => {
  const updates = [];
  const model = {
    async update(values, query) {
      updates.push({ values, query });
      return [1];
    },
    async findOne() { return { id: 'job-1' }; },
  };
  const heartbeat = createJobHeartbeat({ model, id: 'job-1', workerId: 'worker-A', intervalMs: 5 });
  await new Promise((resolve) => setTimeout(resolve, 30));
  await heartbeat.assertOwned();
  await heartbeat.stop();
  assert.ok(updates.length >= 1);
  assert.ok(updates.every(({ query }) =>
    query.where.id === 'job-1' &&
    query.where.locked_by === 'worker-A' &&
    query.where.status === 'running'));
});

test('missing owner causes safe refusal without reusing a lease', async () => {
  const model = {
    async update() { return [0]; },
    async findOne() { return null; },
  };
  const heartbeat = createJobHeartbeat({ model, id: 'job-1', workerId: 'worker-A', intervalMs: 5 });
  await new Promise((resolve) => setTimeout(resolve, 30));
  await assert.rejects(heartbeat.assertOwned(), /ownership was lost/);
  await heartbeat.stop();
});
