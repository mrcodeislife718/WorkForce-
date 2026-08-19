'use strict';

const { Op, fn, col } = require('sequelize');
const {
  Deployment,
  TaskRun,
  CapabilityExecution,
  ApprovalRequest,
  RuntimeJob,
  RuntimeCostEvent,
  OutcomeVerification,
} = require('../models');

function ratio(numerator, denominator) {
  if (!denominator) return null;
  return Number((numerator / denominator).toFixed(4));
}

async function sumCost(where) {
  const row = await RuntimeCostEvent.findOne({
    where,
    attributes: [[fn('COALESCE', fn('SUM', col('amount_usd')), 0), 'total']],
    raw: true,
  });
  return Number(row?.total || 0);
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
    verificationTotal,
    verifiedOutcomes,
    rejectedOutcomes,
    totalCostUsd,
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
    OutcomeVerification.count({ where: { deployment_id: deploymentId } }),
    OutcomeVerification.count({ where: { deployment_id: deploymentId, status: 'verified' } }),
    OutcomeVerification.count({ where: { deployment_id: deploymentId, status: 'rejected' } }),
    sumCost({ deployment_id: deploymentId }),
  ]);

  const completionRate = ratio(completedTasks, totalTasks);
  const executionReliability = ratio(succeededExecutions, totalExecutions);
  const escalationRate = ratio(waitingApprovals, Math.max(totalTasks, 1));
  const verificationRate = ratio(verifiedOutcomes, verificationTotal);
  const costPerVerifiedTask = verifiedOutcomes ? Number((totalCostUsd / verifiedOutcomes).toFixed(6)) : null;

  return {
    deployment_id: deploymentId,
    worker_id: deployment.worker_id,
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
    verification: {
      total: verificationTotal,
      verified: verifiedOutcomes,
      rejected: rejectedOutcomes,
      verification_rate: verificationRate,
    },
    economics: {
      total_cost_usd: Number(totalCostUsd.toFixed(6)),
      cost_per_verified_task_usd: costPerVerifiedTask,
    },
    governance: {
      approval_requests: waitingApprovals,
      human_escalation_rate: escalationRate,
      policy_denials: deniedExecutions,
    },
    generated_at: new Date().toISOString(),
  };
}

async function workerScorecard(workerId) {
  const deployments = await Deployment.findAll({ where: { worker_id: workerId }, attributes: ['id'] });
  const cards = await Promise.all(deployments.map((deployment) => deploymentScorecard(deployment.id)));
  const valid = cards.filter(Boolean);
  const totals = valid.reduce((acc, card) => {
    acc.tasks += card.tasks.total;
    acc.completed += card.tasks.completed;
    acc.failed += card.tasks.failed;
    acc.actions += card.execution.total_actions;
    acc.succeededActions += card.execution.succeeded;
    acc.denied += card.execution.denied;
    acc.verifications += card.verification.total;
    acc.verified += card.verification.verified;
    acc.rejected += card.verification.rejected;
    acc.approvals += card.governance.approval_requests;
    acc.cost += card.economics.total_cost_usd;
    return acc;
  }, {
    tasks: 0,
    completed: 0,
    failed: 0,
    actions: 0,
    succeededActions: 0,
    denied: 0,
    verifications: 0,
    verified: 0,
    rejected: 0,
    approvals: 0,
    cost: 0,
  });

  return {
    worker_id: workerId,
    deployment_count: valid.length,
    tasks: {
      total: totals.tasks,
      completed: totals.completed,
      failed: totals.failed,
      completion_rate: ratio(totals.completed, totals.tasks),
    },
    execution: {
      total_actions: totals.actions,
      succeeded: totals.succeededActions,
      reliability: ratio(totals.succeededActions, totals.actions),
      policy_denials: totals.denied,
    },
    verification: {
      total: totals.verifications,
      verified: totals.verified,
      rejected: totals.rejected,
      verification_rate: ratio(totals.verified, totals.verifications),
    },
    governance: {
      approval_requests: totals.approvals,
      human_escalation_rate: ratio(totals.approvals, Math.max(totals.tasks, 1)),
    },
    economics: {
      total_cost_usd: Number(totals.cost.toFixed(6)),
      cost_per_verified_task_usd: totals.verified
        ? Number((totals.cost / totals.verified).toFixed(6))
        : null,
    },
    generated_at: new Date().toISOString(),
  };
}

module.exports = { deploymentScorecard, workerScorecard };
