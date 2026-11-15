'use strict';

// An action may have reached a customer service before our worker restarted.
// When an execution record is uncertain, do not blindly repeat the action.
function recoveryDisposition(job, executions = []) {
  if (job.job_type !== 'deployment_task') return 'retry';
  const recorded = new Set(
    (Array.isArray(job.payload?.action_results) ? job.payload.action_results : [])
      .filter((item) => item?.status === 'succeeded' && item.execution_id)
      .map((item) => item.execution_id),
  );
  for (const execution of executions) {
    if (execution.status !== 'succeeded' || !recorded.has(execution.id)) {
      return 'human_reconciliation';
    }
  }
  return 'retry';
}

module.exports = { recoveryDisposition };
