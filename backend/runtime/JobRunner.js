const os = require('os');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const {
  RuntimeJob,
  SampleAssignment,
  InterviewSession,
  InterviewMessage,
  Worker,
  WorkerPermission,
  Deployment,
  DeploymentConnection,
  WorkspaceConnection,
  ConnectorDefinition,
  DeploymentCapabilityGrant,
  TaskRun,
  ApprovalRequest,
  DeploymentEvent,
} = require('../models');
const { generateJson, generateText } = require('../services/modelProvider');
const { execute: executeCapability } = require('./CapabilityBroker');
const registry = require('../connectors/registerBuiltins')();
const { loadSecrets } = require('../services/connectionService');
const {
  recordModelCost,
  recordCapabilityCost,
  taskCostUsd,
  deploymentCostUsd,
  verifyDeterministicOutcome,
} = require('../services/runtimeAccounting');
const {
  writeCheckpoint,
  restoreCheckpoint,
  markTerminal,
} = require('../services/runtimeCheckpoint');

const workerId = `${os.hostname()}:${process.pid}`;
let timer = null;
let healthTimer = null;
let stopping = false;

async function claimJob() {
  return sequelize.transaction(async (transaction) => {
    const job = await RuntimeJob.findOne({
      where: {
        status: 'queued',
        run_after: { [Op.lte]: new Date() },
      },
      order: [['run_after', 'ASC'], ['createdAt', 'ASC']],
      lock: transaction.LOCK.UPDATE,
      skipLocked: true,
      transaction,
    });
    if (!job) return null;
    await job.update({
      status: 'running',
      locked_at: new Date(),
      locked_by: workerId,
      attempt_count: job.attempt_count + 1,
      last_error: null,
    }, { transaction });
    return job;
  });
}

function sampleSystemPrompt(worker, interview) {
  return [
    `You are ${worker.name}, an ORCA digital employee completing a real sample assignment before hiring.`,
    `Job description: ${worker.description || ''}`,
    `Interview brief: ${interview.summary || interview.goal}`,
    'Complete only the requested sample. Be factual. Clearly identify assumptions, missing inputs, risks, and any actions that would require workspace access or human approval.',
    'Return useful work, not a description of how you would do the work.',
  ].join('\n\n');
}

async function processSample(job) {
  const assignment = await SampleAssignment.findByPk(job.sample_assignment_id, {
    include: [
      { model: Worker },
      { model: InterviewSession, include: [InterviewMessage] },
    ],
  });
  if (!assignment) throw new Error('Sample assignment was not found.');
  await assignment.update({ status: 'running', started_at: new Date(), failure_reason: null });

  const generated = await generateText({
    system: sampleSystemPrompt(assignment.Worker, assignment.InterviewSession),
    messages: [{
      role: 'customer',
      content: [
        `Assignment title: ${assignment.title}`,
        `Instructions: ${assignment.instructions}`,
        `Input data: ${JSON.stringify(assignment.input_data || {})}`,
      ].join('\n\n'),
    }],
    maxTokens: Number(process.env.SAMPLE_MAX_TOKENS || 3000),
  });

  const result = {
    output: generated.text,
    usage: generated.usage,
    estimated_cost_usd: generated.estimated_cost_usd,
    latency_ms: generated.latency_ms,
    completed_by: assignment.Worker.name,
    completed_at: new Date().toISOString(),
  };
  await assignment.update({
    status: 'completed',
    result,
    model_provider: generated.provider,
    model_id: generated.model,
    completed_at: new Date(),
  });
  await job.update({ status: 'completed', result, completed_at: new Date(), locked_at: null, locked_by: null });
}

async function planDeploymentTask(job, deployment, taskRun) {
  const grants = await DeploymentCapabilityGrant.findAll({
    where: { deployment_id: deployment.id, approved: true },
  });
  const permissions = await WorkerPermission.findAll({ where: { worker_id: deployment.worker_id } });
  const permissionByKey = new Map(permissions.map((permission) => [permission.capability_key, permission]));
  const allowed = grants.map((grant) => {
    const permission = permissionByKey.get(grant.capability_key);
    return {
      capability_key: grant.capability_key,
      description: permission?.description || '',
      requires_human_approval: Boolean(permission?.requires_human_approval),
      constraints: grant.constraints || {},
    };
  });

  const generated = await generateJson({
    system: [
      `You are ${deployment.Worker.name}, an ORCA digital employee working inside customer-approved tools.`,
      `Job description: ${deployment.Worker.description || ''}`,
      'Create a minimal executable JSON plan using only the approved capabilities below.',
      'Never invent access, credentials, resources, or capabilities.',
      'Return exactly: {"summary":"...","actions":[{"capability_key":"...","input":{}}]}.',
      `Approved capabilities: ${JSON.stringify(allowed)}`,
    ].join('\n\n'),
    messages: [{ role: 'customer', content: String(job.payload.instructions || job.payload.title || '') }],
    maxTokens: Number(process.env.RUNTIME_PLAN_MAX_TOKENS || 1800),
  });

  await recordModelCost({
    deploymentId: deployment.id,
    taskRunId: taskRun.id,
    runtimeJobId: job.id,
    traceId: job.payload.trace_id || null,
    generated,
    purpose: 'task_planning',
  });

  if (!generated.value || !Array.isArray(generated.value.actions)) {
    throw new Error('The model plan did not contain an actions array.');
  }
  for (const action of generated.value.actions) {
    if (!action?.capability_key || !grants.some((grant) => grant.capability_key === action.capability_key)) {
      throw new Error(`The model requested an unapproved capability: ${action?.capability_key || 'missing'}.`);
    }
  }

  const payload = {
    ...job.payload,
    plan: generated.value,
    task_run_id: taskRun.id,
    next_action_index: 0,
    approved_action_indices: job.payload.approved_action_indices || [],
    model_provider: generated.provider,
    model_id: generated.model,
  };
  await job.update({ payload });
  await writeCheckpoint({
    deploymentId: deployment.id,
    taskRunId: taskRun.id,
    runtimeJobId: job.id,
    traceId: payload.trace_id || null,
    stage: 'planned',
    nextActionIndex: 0,
    state: {
      plan: generated.value,
      task_run_id: taskRun.id,
      approved_action_indices: payload.approved_action_indices,
      action_results: [],
    },
  });
  return generated.value;
}

async function processDeploymentTask(job) {
  const deployment = await Deployment.findByPk(job.deployment_id, { include: [Worker] });
  if (!deployment) throw new Error('Deployment was not found.');
  if (deployment.status !== 'active') throw new Error('Deployment is not active.');

  let taskRun = job.payload.task_run_id
    ? await TaskRun.findByPk(job.payload.task_run_id)
    : null;
  if (!taskRun) {
    taskRun = await TaskRun.create({
      deployment_id: deployment.id,
      trigger_type: job.payload.trigger_type || 'assigned_task',
      trigger_reference: job.payload.trigger_reference || null,
      title: String(job.payload.title || 'Digital employee task').slice(0, 255),
      status: 'running',
      priority: Number(job.payload.priority || 50),
      started_at: new Date(),
      input_summary: process.env.TELEMETRY_STORE_SUMMARIES === 'true'
        ? String(job.payload.instructions || '').slice(0, 4000)
        : null,
    });
  } else if (taskRun.status === 'waiting_for_approval') {
    await taskRun.update({ status: 'running' });
  }

  if (Number(job.attempt_count || 0) > 1 && !job.payload.restored_from_checkpoint_id) {
    const restored = await restoreCheckpoint(job);
    if (restored) await job.reload();
  }

  const plan = job.payload.plan || await planDeploymentTask(job, deployment, taskRun);
  const permissions = await WorkerPermission.findAll({ where: { worker_id: deployment.worker_id } });
  const grants = await DeploymentCapabilityGrant.findAll({ where: { deployment_id: deployment.id, approved: true } });
  const permissionByKey = new Map(permissions.map((permission) => [permission.capability_key, permission]));
  const grantByKey = new Map(grants.map((grant) => [grant.capability_key, grant]));
  const approvedIndices = new Set(job.payload.approved_action_indices || []);
  let index = Number(job.payload.next_action_index || 0);
  const actionResults = Array.isArray(job.payload.action_results) ? [...job.payload.action_results] : [];

  while (index < plan.actions.length) {
    const action = plan.actions[index];
    const permission = permissionByKey.get(action.capability_key);
    if (permission?.requires_human_approval && !approvedIndices.has(index)) {
      const existing = await ApprovalRequest.findOne({
        where: { runtime_job_id: job.id, capability_key: action.capability_key, status: 'pending' },
      });
      if (!existing) {
        await ApprovalRequest.create({
          deployment_id: deployment.id,
          runtime_job_id: job.id,
          capability_key: action.capability_key,
          requested_action: { index, input: action.input || {} },
          reason: `This capability is marked as requiring human approval: ${permission.description}`,
        });
      }
      const waitingPayload = {
        ...job.payload,
        plan,
        task_run_id: taskRun.id,
        next_action_index: index,
        action_results: actionResults,
      };
      await taskRun.update({ status: 'waiting_for_approval' });
      await job.update({
        status: 'waiting_approval',
        payload: waitingPayload,
        locked_at: null,
        locked_by: null,
      });
      await writeCheckpoint({
        deploymentId: deployment.id,
        taskRunId: taskRun.id,
        runtimeJobId: job.id,
        traceId: waitingPayload.trace_id || null,
        stage: 'waiting_for_approval',
        nextActionIndex: index,
        state: {
          plan,
          task_run_id: taskRun.id,
          approved_action_indices: waitingPayload.approved_action_indices || [],
          action_results: actionResults,
        },
      });
      await DeploymentEvent.create({
        deployment_id: deployment.id,
        event_type: 'task.waiting_for_approval',
        severity: 'warning',
        message: `${deployment.Worker.name} is waiting for approval to use ${action.capability_key}.`,
        metadata: { runtime_job_id: job.id, task_run_id: taskRun.id, capability_key: action.capability_key, trace_id: job.payload.trace_id || null },
      });
      return;
    }

    const grant = grantByKey.get(action.capability_key);
    const currentTaskCost = await taskCostUsd(taskRun.id);
    const currentDeploymentCost = await deploymentCostUsd(deployment.id);
    const estimatedActionCost = Number(grant?.constraints?.estimated_action_cost_usd || 0);
    const executed = await executeCapability({
      deploymentId: deployment.id,
      taskRunId: taskRun.id,
      capabilityKey: action.capability_key,
      input: action.input || {},
      policyContext: {
        actionCount: actionResults.length,
        taskCostUsd: currentTaskCost,
        deploymentCostUsd: currentDeploymentCost,
        estimatedActionCostUsd: estimatedActionCost,
      },
    });
    await recordCapabilityCost({
      deploymentId: deployment.id,
      taskRunId: taskRun.id,
      runtimeJobId: job.id,
      traceId: job.payload.trace_id || null,
      capabilityKey: action.capability_key,
      execution: executed.execution,
      amountUsd: estimatedActionCost,
    });
    actionResults.push({
      capability_key: action.capability_key,
      execution_id: executed.execution.id,
      status: 'succeeded',
    });
    index += 1;
    const progressPayload = {
      ...job.payload,
      plan,
      task_run_id: taskRun.id,
      next_action_index: index,
      action_results: actionResults,
    };
    await job.update({ payload: progressPayload });
    await writeCheckpoint({
      deploymentId: deployment.id,
      taskRunId: taskRun.id,
      runtimeJobId: job.id,
      traceId: progressPayload.trace_id || null,
      stage: 'action_completed',
      nextActionIndex: index,
      state: {
        plan,
        task_run_id: taskRun.id,
        approved_action_indices: progressPayload.approved_action_indices || [],
        action_results: actionResults,
      },
    });
  }

  const verification = await verifyDeterministicOutcome({
    deploymentId: deployment.id,
    taskRunId: taskRun.id,
    traceId: job.payload.trace_id || null,
    actionResults,
    expectedActionCount: plan.actions.length,
  });
  const completedAt = new Date();
  const verified = verification.status === 'verified';
  await taskRun.update({
    status: verified ? 'completed' : 'failed',
    completed_at: completedAt,
    duration_ms: taskRun.started_at ? completedAt.getTime() - new Date(taskRun.started_at).getTime() : null,
    failure_reason: verified ? null : verification.failure_reason,
    output_summary: process.env.TELEMETRY_STORE_SUMMARIES === 'true' ? String(plan.summary || '').slice(0, 4000) : null,
  });
  await job.update({
    status: verified ? 'completed' : 'failed',
    result: {
      summary: plan.summary || '',
      actions: actionResults,
      verification: {
        id: verification.id,
        status: verification.status,
        score: Number(verification.score),
      },
      total_cost_usd: await taskCostUsd(taskRun.id),
    },
    completed_at: completedAt,
    locked_at: null,
    locked_by: null,
  });
  await markTerminal(job.id);
  await DeploymentEvent.create({
    deployment_id: deployment.id,
    event_type: verified ? 'task.verified_completed' : 'task.verification_failed',
    severity: verified ? 'info' : 'error',
    message: verified
      ? `${deployment.Worker.name} completed and verified a task.`
      : `${deployment.Worker.name} completed execution but failed outcome verification.`,
    metadata: {
      runtime_job_id: job.id,
      task_run_id: taskRun.id,
      action_count: actionResults.length,
      verification_id: verification.id,
      trace_id: job.payload.trace_id || null,
    },
  });
}

async function processHealthCheck(job) {
  const deployment = await Deployment.findByPk(job.deployment_id, {
    include: [{
      model: DeploymentConnection,
      include: [{ model: WorkspaceConnection, include: [ConnectorDefinition] }],
    }],
  });
  if (!deployment || deployment.status === 'uninstalled') {
    await job.update({ status: 'completed', result: { skipped: true }, completed_at: new Date() });
    return;
  }

  const failures = [];
  for (const binding of deployment.DeploymentConnections) {
    const connection = binding.WorkspaceConnection;
    try {
      const adapter = registry.get(connection.ConnectorDefinition.adapter_key);
      const secrets = await loadSecrets(connection.id);
      const result = await adapter.healthCheck({ connection, secrets, deploymentConnection: binding });
      if (!result?.ok) throw new Error(result?.error?.message || 'Health check failed.');
      await binding.update({ status: 'active', last_health_check_at: new Date() });
    } catch (error) {
      failures.push({ connection_id: connection.id, error: error.message });
      await binding.update({ status: 'degraded', last_health_check_at: new Date() });
    }
  }
  await deployment.update({ status: failures.length ? 'degraded' : deployment.status === 'paused' ? 'paused' : 'active' });
  await job.update({ status: 'completed', result: { failures }, completed_at: new Date(), locked_at: null, locked_by: null });
}

async function failOrRetry(job, error) {
  const attempts = job.attempt_count;
  if (attempts < job.max_attempts && error.code !== 'MODEL_PROVIDER_NOT_CONFIGURED') {
    const delaySeconds = Math.min(900, 2 ** attempts * 15);
    await job.update({
      status: 'queued',
      run_after: new Date(Date.now() + delaySeconds * 1000),
      last_error: String(error.message || error).slice(0, 4000),
      locked_at: null,
      locked_by: null,
    });
    return;
  }

  await job.update({
    status: 'failed',
    last_error: String(error.message || error).slice(0, 4000),
    completed_at: new Date(),
    locked_at: null,
    locked_by: null,
  });
  await markTerminal(job.id).catch(() => {});
  if (job.sample_assignment_id) {
    await SampleAssignment.update({
      status: 'failed',
      failure_reason: String(error.message || error).slice(0, 4000),
      completed_at: new Date(),
    }, { where: { id: job.sample_assignment_id } });
  }
  if (job.deployment_id) {
    await DeploymentEvent.create({
      deployment_id: job.deployment_id,
      event_type: 'runtime.job.failed',
      severity: 'error',
      message: 'A digital employee runtime job failed.',
      metadata: {
        runtime_job_id: job.id,
        job_type: job.job_type,
        error: String(error.message || error).slice(0, 1000),
        trace_id: job.payload?.trace_id || null,
      },
    });
  }
}

async function processOne() {
  const job = await claimJob();
  if (!job) return false;
  try {
    if (job.job_type === 'sample_assignment') await processSample(job);
    else if (job.job_type === 'deployment_task') await processDeploymentTask(job);
    else if (job.job_type === 'health_check') await processHealthCheck(job);
    else throw new Error(`Unsupported runtime job type: ${job.job_type}`);
  } catch (error) {
    await failOrRetry(job, error);
  }
  return true;
}

async function tick() {
  if (stopping) return;
  try {
    const batchSize = Number(process.env.RUNTIME_JOB_BATCH_SIZE || 5);
    for (let index = 0; index < batchSize; index += 1) {
      if (!(await processOne())) break;
    }
  } catch (error) {
    console.error('ORCA runtime worker tick failed:', error);
  }
}

async function scheduleHealthChecks() {
  const deployments = await Deployment.findAll({
    where: { status: { [Op.in]: ['active', 'degraded'] } },
    attributes: ['id'],
  });
  for (const deployment of deployments) {
    const existing = await RuntimeJob.findOne({
      where: {
        deployment_id: deployment.id,
        job_type: 'health_check',
        status: { [Op.in]: ['queued', 'running'] },
      },
    });
    if (!existing) {
      await RuntimeJob.create({
        deployment_id: deployment.id,
        job_type: 'health_check',
        payload: {},
        status: 'queued',
        max_attempts: 3,
        run_after: new Date(),
      });
    }
  }
}

function startRuntimeWorker() {
  if (timer) return;
  stopping = false;
  const interval = Number(process.env.RUNTIME_POLL_INTERVAL_MS || 2000);
  const healthInterval = Number(process.env.HEALTH_CHECK_INTERVAL_MS || 300000);
  timer = setInterval(tick, interval);
  timer.unref?.();
  healthTimer = setInterval(() => scheduleHealthChecks().catch((error) => console.error('Health scheduling failed:', error)), healthInterval);
  healthTimer.unref?.();
  tick();
  scheduleHealthChecks().catch((error) => console.error('Initial health scheduling failed:', error));
}

function stopRuntimeWorker() {
  stopping = true;
  if (timer) clearInterval(timer);
  if (healthTimer) clearInterval(healthTimer);
  timer = null;
  healthTimer = null;
}

module.exports = {
  claimJob,
  processOne,
  scheduleHealthChecks,
  startRuntimeWorker,
  stopRuntimeWorker,
};
