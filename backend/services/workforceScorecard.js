'use strict';

const { Op, fn, col } = require('sequelize');
const {
  Deployment,
  TaskRun,
  CapabilityExecution,
  ApprovalRequest,
  RuntimeJob,
} = require('../models');

function ratio(numerator, denominator) {
  if (!denominator) return null;
  return Number((numerator / denominator).toFixed(4));
}

async function deploymentScorecard(deploymentId) {
  const deployment = await Deployment.findByPk(deploymentId);
  if (!deployment) return null;

  const [
    totalTasks,
    completedTasks,
    failedTasks,
    waitingApprovals,
    totalExecutions,
    succeededExecutions,
    failedExecutions,
    deniedExecutions,
    runtimeFailures,
    durationAggregate,
  ] = await Promise.all([
    TaskRun.count({ where: { deployment_id: deploymentId } }),
    TaskRun.count({ where: { deployment_id: deploymentId, status: 'completed' } }),
    TaskRun.count({ where: { deployment_id: deploymentId, status: 'failed' } }),
    ApprovalRequest.count({ where: { deployment_id: deploymentId } }),
    CapabilityExecution.count({ where: { deployment_id: deploymentId } }),
    CapabilityExecution.count({ where: { deployment_id: deploymentId, status: 'succeeded' } }),
    CapabilityExecution.count({ where: { deployment_id: deploymentId, status: 'failed' } }),
    CapabilityExecution.count({ where: { deployment_id: deploymentId, status: 'denied' } }),
    RuntimeJob.count({ where: { deployment_id: deploymentId, status: 'failed' } }),
    TaskRun.findOne({
      where: { deployment_id: deploymentId, duration_ms: { [Op.ne]: null } },
      attributes: [[fn('AVG', col('duration_ms')), 'avg_duration_ms']],
      raw: true,
    }),
  ]);

  const completionRate = ratio(completedTasks, totalTasks);
  const executionReliability = ratio(succeededExecutions, totalExecutions);
  const escalationRate = ratio(waitingApprovals, Math.max(totalTasks, 1));

  return {
    deployment_id: deploymentId,
    status: deployment.status,
    workforce_level: deployment.workforce_level,
    installed_version: deployment.installed_version,
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      failed: failedTasks,
      completion_rate: completionRate,
      average_duration_ms: Number(durationAggregate?.avg_duration_ms || 0),
    },
    execution: {
      total_actions: totalExecutions,
      succeeded: succeededExecutions,
      failed: failedExecutions,
      denied: deniedExecutions,
      reliability: executionReliability,
      runtime_failures: runtimeFailures,
    },
    governance: {
      approval_requests: waitingApprovals,
      human_escalation_rate: escalationRate,
      policy_denials: deniedExecutions,
    },
    generated_at: new Date().toISOString(),
  };
}

module.exports = { deploymentScorecard };
