'use strict';

const { fn, col } = require('sequelize');
const { RuntimeCostEvent, OutcomeVerification } = require('../models');

function tokenCount(usage, candidates) {
  for (const key of candidates) {
    const value = Number(usage?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

async function recordModelCost({ deploymentId, taskRunId = null, runtimeJobId = null, traceId = null, generated, purpose }) {
  if (!deploymentId || !generated) return null;
  const inputTokens = tokenCount(generated.usage, ['prompt_tokens', 'input_tokens']);
  const outputTokens = tokenCount(generated.usage, ['completion_tokens', 'output_tokens']);
  return RuntimeCostEvent.create({
    deployment_id: deploymentId,
    task_run_id: taskRunId,
    runtime_job_id: runtimeJobId,
    trace_id: traceId,
    source_type: 'model',
    source_key: purpose || 'model_call',
    provider: generated.provider || null,
    model_id: generated.model || null,
    amount_usd: Number(generated.estimated_cost_usd || 0),
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    latency_ms: Number(generated.latency_ms || 0),
    metadata: {
      provider_request_id: generated.provider_request_id || null,
      usage: generated.usage || null,
    },
  });
}

async function recordCapabilityCost({ deploymentId, taskRunId = null, runtimeJobId = null, traceId = null, capabilityKey, execution, amountUsd = 0 }) {
  return RuntimeCostEvent.create({
    deployment_id: deploymentId,
    task_run_id: taskRunId,
    runtime_job_id: runtimeJobId,
    trace_id: traceId,
    source_type: 'capability',
    source_key: capabilityKey,
    provider: execution?.provider || null,
    amount_usd: Number(amountUsd || 0),
    latency_ms: Number(execution?.duration_ms || 0),
    metadata: { capability_execution_id: execution?.id || null },
  });
}

async function totalCost(where) {
  const row = await RuntimeCostEvent.findOne({
    where,
    attributes: [[fn('COALESCE', fn('SUM', col('amount_usd')), 0), 'total']],
    raw: true,
  });
  return Number(row?.total || 0);
}

async function taskCostUsd(taskRunId) {
  return totalCost({ task_run_id: taskRunId });
}

async function deploymentCostUsd(deploymentId) {
  return totalCost({ deployment_id: deploymentId });
}

function classifyDeliveryProof({ actionResults = [], expectedActionCount = null, deliverable = '' }) {
  const expected = expectedActionCount === null ? actionResults.length : Number(expectedActionCount);
  const successful = actionResults.filter((item) => item?.status === 'succeeded').length;
  const hasDeliverable = typeof deliverable === 'string' && deliverable.trim().length >= 10;
  const valid = Number.isInteger(expected) && expected >= 0 && successful === expected;
  // Action receipts show execution; only a customer or independent checker can validate the business outcome.
  const delivered = valid && (expected > 0 || hasDeliverable);
  return {
    status: delivered ? 'inconclusive' : 'rejected',
    score: expected > 0 ? successful / expected : hasDeliverable ? 1 : 0,
    successful,
    expected,
    hasDeliverable,
  };
}

async function verifyDeterministicOutcome({
  deploymentId, taskRunId, traceId = null, actionResults = [],
  expectedActionCount = null, deliverable = '',
}) {
  const proof = classifyDeliveryProof({ actionResults, expectedActionCount, deliverable });
  return OutcomeVerification.create({
    deployment_id: deploymentId,
    task_run_id: taskRunId,
    trace_id: traceId,
    verifier_type: 'deterministic',
    status: proof.status,
    score: proof.score,
    criteria: {
      expected_action_count: proof.expected,
      require_all_actions_succeeded: true,
      customer_acceptance_required: true,
      verification_scope: 'execution_receipts_not_business_outcome',
    },
    evidence: {
      successful_action_count: proof.successful,
      action_results: actionResults,
      deliverable_present: proof.hasDeliverable,
    },
    failure_reason: proof.status === 'rejected'
      ? 'Expected actions were not completed, or no meaningful deliverable was provided.'
      : null,
    verified_at: proof.status === 'rejected' ? new Date() : null,
  });
}

module.exports = {
  recordModelCost,
  recordCapabilityCost,
  taskCostUsd,
  deploymentCostUsd,
  verifyDeterministicOutcome,
  classifyDeliveryProof,
};
