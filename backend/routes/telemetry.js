const crypto = require('crypto');
const express = require('express');
const {
  Deployment,
  DeploymentConnection,
  WorkspaceConnection,
  ConnectorDefinition,
  DeploymentEvent,
  TaskRun,
  CapabilityExecution,
} = require('../models');

const router = express.Router();

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function safeEqual(left, right) {
  const a = Buffer.from(left || '', 'utf8');
  const b = Buffer.from(right || '', 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function bearerToken(req) {
  const authorization = req.get('Authorization') || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
}

function safeMetadata(data = {}) {
  const allowed = [
    'provider_request_id',
    'resource_type',
    'operation',
    'records_read',
    'records_created',
    'records_updated',
    'records_deleted',
    'retry_count',
    'input_tokens',
    'output_tokens',
    'estimated_cost',
    'currency',
    'human_approval_required',
    'outcome_type',
    'outcome_value',
    'outcome_confidence',
  ];
  return Object.fromEntries(allowed.filter((key) => data[key] !== undefined).map((key) => [key, data[key]]));
}

async function authenticateDeployment(req, res, next) {
  try {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: 'Deployment telemetry token is required.' });
    const deployment = await Deployment.findByPk(req.params.deploymentId);
    if (!deployment) return res.status(404).json({ error: 'Deployment was not found.' });
    if (!safeEqual(hashToken(token), deployment.telemetry_token_hash)) {
      return res.status(401).json({ error: 'Invalid deployment telemetry token.' });
    }
    if (deployment.status === 'uninstalled') {
      return res.status(410).json({ error: 'Deployment has been uninstalled.' });
    }
    req.deployment = deployment;
    return next();
  } catch (error) {
    return res.status(500).json({ error: 'Unable to authenticate deployment telemetry.' });
  }
}

async function resolveDeploymentConnection(deploymentId, externalInstallationId) {
  if (!externalInstallationId) return null;
  return DeploymentConnection.findOne({
    where: {
      deployment_id: deploymentId,
      external_installation_id: externalInstallationId,
    },
    include: [{ model: WorkspaceConnection, include: [{ model: ConnectorDefinition }] }],
  });
}

router.post('/deployments/:deploymentId/events', authenticateDeployment, async (req, res) => {
  const { event_type, external_installation_id, task_run_id, capability_execution_id, data = {} } = req.body;
  if (!event_type) return res.status(400).json({ error: 'event_type is required.' });

  try {
    const deployment = req.deployment;
    const deploymentConnection = await resolveDeploymentConnection(deployment.id, external_installation_id);
    if (external_installation_id && !deploymentConnection) {
      return res.status(403).json({ error: 'External installation does not belong to this deployment.' });
    }

    const now = new Date();
    let taskRun = null;
    let capabilityExecution = null;

    if (event_type === 'task.started') {
      taskRun = await TaskRun.create({
        deployment_id: deployment.id,
        trigger_type: String(data.trigger_type || 'external_event'),
        trigger_reference: data.trigger_reference ? String(data.trigger_reference) : null,
        title: String(data.title || 'Digital employee task').slice(0, 255),
        status: 'running',
        priority: Number.isFinite(Number(data.priority)) ? Number(data.priority) : 50,
        started_at: now,
        input_summary: process.env.TELEMETRY_STORE_SUMMARIES === 'true' ? data.input_summary || null : null,
      });
    } else if (event_type === 'task.completed' || event_type === 'task.failed') {
      taskRun = await TaskRun.findOne({ where: { id: task_run_id, deployment_id: deployment.id } });
      if (!taskRun) return res.status(404).json({ error: 'Task run was not found.' });
      const durationMs = taskRun.started_at ? now.getTime() - new Date(taskRun.started_at).getTime() : null;
      await taskRun.update({
        status: event_type === 'task.completed' ? 'completed' : 'failed',
        completed_at: now,
        duration_ms: durationMs,
        failure_reason: event_type === 'task.failed' ? String(data.error_message || 'Task failed.').slice(0, 2000) : null,
        output_summary: process.env.TELEMETRY_STORE_SUMMARIES === 'true' ? data.output_summary || null : null,
        human_minutes_used: Number(data.human_minutes_used || 0),
        estimated_minutes_saved: Number(data.estimated_minutes_saved || 0),
      });
    } else if (event_type === 'capability.started') {
      if (!deploymentConnection) {
        return res.status(400).json({ error: 'external_installation_id is required for capability telemetry.' });
      }
      capabilityExecution = await CapabilityExecution.create({
        task_run_id: task_run_id || null,
        deployment_id: deployment.id,
        deployment_connection_id: deploymentConnection.id,
        capability_key: String(data.capability_key || ''),
        provider: deploymentConnection.WorkspaceConnection.ConnectorDefinition.key,
        external_workspace_id: deploymentConnection.WorkspaceConnection.external_workspace_id,
        resource_type: data.resource_type ? String(data.resource_type) : null,
        operation: String(data.operation || data.capability_key || 'execute'),
        status: 'running',
        started_at: now,
        metadata: safeMetadata(data),
      });
    } else if (event_type === 'capability.completed' || event_type === 'capability.failed' || event_type === 'capability.denied') {
      capabilityExecution = await CapabilityExecution.findOne({
        where: { id: capability_execution_id, deployment_id: deployment.id },
      });
      if (!capabilityExecution) return res.status(404).json({ error: 'Capability execution was not found.' });
      const durationMs = now.getTime() - new Date(capabilityExecution.started_at).getTime();
      const status = event_type === 'capability.completed'
        ? 'succeeded'
        : event_type === 'capability.denied'
          ? 'denied'
          : 'failed';
      await capabilityExecution.update({
        status,
        completed_at: now,
        duration_ms: durationMs,
        records_read: Number(data.records_read || 0),
        records_created: Number(data.records_created || 0),
        records_updated: Number(data.records_updated || 0),
        records_deleted: Number(data.records_deleted || 0),
        retry_count: Number(data.retry_count || 0),
        error_code: status === 'succeeded' ? null : String(data.error_code || 'EXTERNAL_OPERATION_FAILED').slice(0, 120),
        error_message_redacted: status === 'succeeded' ? null : String(data.error_message || 'External operation failed.').slice(0, 2000),
        metadata: safeMetadata(data),
      });
    } else if (event_type !== 'heartbeat') {
      return res.status(400).json({ error: 'Unsupported telemetry event type.' });
    }

    await DeploymentEvent.create({
      deployment_id: deployment.id,
      deployment_connection_id: deploymentConnection?.id || null,
      event_type,
      severity: event_type.endsWith('.failed') ? 'error' : event_type.endsWith('.denied') ? 'warning' : 'info',
      message: String(data.message || event_type).slice(0, 2000),
      metadata: safeMetadata(data),
    });

    await deployment.update({ last_activity_at: now });
    if (deploymentConnection) {
      await deploymentConnection.update({ last_health_check_at: now });
      await deploymentConnection.WorkspaceConnection.update({ last_used_at: now });
    }

    return res.status(202).json({
      accepted: true,
      task_run_id: taskRun?.id || task_run_id || null,
      capability_execution_id: capabilityExecution?.id || capability_execution_id || null,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to record telemetry.' });
  }
});

module.exports = router;
