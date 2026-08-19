'use strict';

const { RuntimeCheckpoint } = require('../models');

async function writeCheckpoint({ deploymentId, taskRunId, runtimeJobId, traceId = null, stage, nextActionIndex = 0, state = {} }) {
  const last = await RuntimeCheckpoint.findOne({
    where: { runtime_job_id: runtimeJobId },
    order: [['sequence', 'DESC']],
  });
  if (last && last.status === 'active') await last.update({ status: 'superseded' });
  return RuntimeCheckpoint.create({
    deployment_id: deploymentId,
    task_run_id: taskRunId,
    runtime_job_id: runtimeJobId,
    trace_id: traceId,
    sequence: Number(last?.sequence || 0) + 1,
    stage,
    next_action_index: Number(nextActionIndex || 0),
    state,
    status: 'active',
  });
}

async function latestCheckpoint(runtimeJobId) {
  return RuntimeCheckpoint.findOne({
    where: { runtime_job_id: runtimeJobId },
    order: [['sequence', 'DESC']],
  });
}

async function restoreCheckpoint(runtimeJob) {
  const checkpoint = await latestCheckpoint(runtimeJob.id);
  if (!checkpoint || !runtimeJob.payload) return null;
  const state = checkpoint.state || {};
  await runtimeJob.update({
    payload: {
      ...runtimeJob.payload,
      ...state,
      next_action_index: checkpoint.next_action_index,
      restored_from_checkpoint_id: checkpoint.id,
    },
  });
  await checkpoint.update({ status: 'restored' });
  return checkpoint;
}

async function markTerminal(runtimeJobId) {
  const checkpoint = await latestCheckpoint(runtimeJobId);
  if (checkpoint && checkpoint.status !== 'terminal') await checkpoint.update({ status: 'terminal' });
  return checkpoint;
}

module.exports = { writeCheckpoint, latestCheckpoint, restoreCheckpoint, markTerminal };
