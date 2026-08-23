'use strict';

class PolicyViolationError extends Error {
  constructor(message, decision) {
    super(message);
    this.name = 'PolicyViolationError';
    this.code = 'WORKFORCE_POLICY_DENIED';
    this.decision = decision;
  }
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeConstraints(constraints = {}) {
  return constraints && typeof constraints === 'object' ? constraints : {};
}

function requestedResource(input = {}) {
  return input.resource_id
    || input.external_resource_id
    || input.channel_id
    || input.mailbox_id
    || null;
}

/**
 * Deterministic policy decision point for an external capability action.
 *
 * Model output is intentionally not consulted here. This layer converts the
 * authority granted by a customer into an enforceable allow/deny decision.
 */
function evaluateAction({ deployment, deploymentConnection, grant, capabilityKey, input = {}, context = {} }) {
  const constraints = normalizeConstraints(grant?.constraints);
  const reasons = [];

  if (!deployment || deployment.status !== 'active') reasons.push('deployment_not_active');
  if (!grant || grant.approved !== true) reasons.push('capability_not_approved');
  if (!deploymentConnection || deploymentConnection.status !== 'active') reasons.push('connection_not_active');
  if (grant?.capability_key && grant.capability_key !== capabilityKey) reasons.push('capability_mismatch');

  const resource = requestedResource(input);
  const selectedResources = deploymentConnection?.selected_resource_ids || [];
  if (selectedResources.length > 0 && resource && !selectedResources.includes(resource)) {
    reasons.push('resource_outside_approved_boundary');
  }

  if (Array.isArray(constraints.allowed_operations) && constraints.allowed_operations.length > 0) {
    const operation = input.operation || capabilityKey;
    if (!constraints.allowed_operations.includes(operation)) reasons.push('operation_not_allowed');
  }

  if (Array.isArray(constraints.denied_operations)) {
    const operation = input.operation || capabilityKey;
    if (constraints.denied_operations.includes(operation)) reasons.push('operation_explicitly_denied');
  }

  const actionLimit = finiteNumber(constraints.max_actions_per_task);
  const actionCount = finiteNumber(context.actionCount) || 0;
  if (actionLimit !== null && actionCount >= actionLimit) reasons.push('task_action_budget_exhausted');

  const taskCostLimit = finiteNumber(constraints.max_task_cost_usd);
  const taskCost = finiteNumber(context.taskCostUsd) || 0;
  const estimatedActionCost = finiteNumber(context.estimatedActionCostUsd) || 0;
  if (taskCostLimit !== null && taskCost + estimatedActionCost > taskCostLimit) {
    reasons.push('task_cost_budget_exceeded');
  }

  const deploymentCostLimit = finiteNumber(constraints.max_deployment_cost_usd);
  const deploymentCost = finiteNumber(context.deploymentCostUsd) || 0;
  if (deploymentCostLimit !== null && deploymentCost + estimatedActionCost > deploymentCostLimit) {
    reasons.push('deployment_cost_budget_exceeded');
  }

  const decision = {
    allowed: reasons.length === 0,
    reasons,
    capability_key: capabilityKey,
    operation: input.operation || capabilityKey,
    resource_id: resource,
    deployment_id: deployment?.id || null,
    deployment_connection_id: deploymentConnection?.id || null,
    policy_version: 'workforce-runtime-policy/v1',
    evaluated_at: new Date().toISOString(),
    budgets: {
      action_count: actionCount,
      max_actions_per_task: actionLimit,
      task_cost_usd: taskCost,
      max_task_cost_usd: taskCostLimit,
      deployment_cost_usd: deploymentCost,
      max_deployment_cost_usd: deploymentCostLimit,
      estimated_action_cost_usd: estimatedActionCost,
    },
  };

  return decision;
}

function enforceAction(args) {
  const decision = evaluateAction(args);
  if (!decision.allowed) {
    throw new PolicyViolationError(`Workforce policy denied ${decision.capability_key}: ${decision.reasons.join(', ')}`, decision);
  }
  return decision;
}

module.exports = {
  PolicyViolationError,
  evaluateAction,
  enforceAction,
};
