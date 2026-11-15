'use strict';

function staleAfterMs(env = process.env) {
  const ms = Number(env.RUNTIME_STALE_LOCK_MS || 900000);
  if (!Number.isSafeInteger(ms) || ms < 120000) {
    throw new Error('RUNTIME_STALE_LOCK_MS must be at least 120000.');
  }
  return ms;
}

function heartbeatIntervalMs(env = process.env) {
  const stale = staleAfterMs(env);
  const configured = Number(env.RUNTIME_HEARTBEAT_MS || Math.min(30000, Math.floor(stale / 4)));
  if (!Number.isSafeInteger(configured) || configured < 1000 || configured * 3 >= stale) {
    throw new Error('RUNTIME_HEARTBEAT_MS must be >=1000 and less than one third of the stale-lock duration.');
  }
  return configured;
}

function lostLeaseError() {
  const error = new Error('Workforce job ownership was lost; no more external actions can be performed.');
  error.code = 'WORKFORCE_JOB_LEASE_LOST';
  return error;
}

async function verifyOwnedLease({ model, id, workerId }) {
  const owned = await model.findOne({
    where: { id, locked_by: workerId, status: 'running' },
    attributes: ['id'],
  });
  if (!owned) throw lostLeaseError();
}

function createJobHeartbeat({ model, id, workerId, intervalMs, onError = () => {} }) {
  let stopped = false;
  let lost = false;
  let inFlight = null;

  const beat = async () => {
    if (stopped || inFlight) return;
    const current = (async () => {
      try {
        const [updated] = await model.update(
          { locked_at: new Date() },
          { where: { id, locked_by: workerId, status: 'running' } },
        );
        if (updated !== 1) lost = true;
      } catch (error) {
        onError(error);
      }
    })();
    inFlight = current;
    try { await current; } finally { if (inFlight === current) inFlight = null; }
  };
  const timer = setInterval(() => { beat().catch(onError); }, intervalMs);
  timer.unref?.();

  return {
    async assertOwned() {
      if (lost) throw lostLeaseError();
      await verifyOwnedLease({ model, id, workerId });
      if (lost) throw lostLeaseError();
    },
    async stop() {
      stopped = true;
      clearInterval(timer);
      if (inFlight) await inFlight;
    },
  };
}

module.exports = {
  staleAfterMs, heartbeatIntervalMs, createJobHeartbeat, verifyOwnedLease,
};
