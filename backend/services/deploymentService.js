const crypto = require('crypto');
const sequelize = require('../config/database');
const {
  Worker,
  WorkerPermission,
  ConnectorDefinition,
  WorkspaceConnection,
  Deployment,
  DeploymentConnection,
  DeploymentCapabilityGrant,
  DeploymentEvent,
} = require('../models');
const registry = require('../connectors/registerBuiltins')();
const { loadSecrets, validateConnection } = require('./connectionService');
const { validateCapabilityAssignments } = require('./capabilityResolver');

const PAST_TENSE = { pause: 'paused', resume: 'resumed', uninstall: 'uninstalled' };

async function event(deploymentId, deploymentConnectionId, eventType, message, metadata = {}, severity = 'info') {
  return DeploymentEvent.create({
    deployment_id: deploymentId,
    deployment_connection_id: deploymentConnectionId || null,
    event_type: eventType,
    severity,
    message,
    metadata,
  });
}

async function loadOwnedConnections(userId, ids) {
  const connections = await WorkspaceConnection.findAll({
    where: { id: ids, user_id: userId, status: 'active' },
    include: [{ model: ConnectorDefinition }],
  });
  if (connections.length !== new Set(ids).size) {
    throw new Error('One or more active workspace connections were not found.');
  }
  return connections;
}

async function createDeployment({ userId, workerId, name, bindings, capabilityAssignments }) {
  if (!Array.isArray(bindings) || bindings.length === 0) {
    throw new Error('At least one real workspace connection is required.');
  }
  if (!Array.isArray(capabilityAssignments)) {
    throw new Error('Capability assignments are required.');
  }

  const worker = await Worker.findOne({
    where: { id: workerId, status: 'published' },
    include: [{ model: WorkerPermission }],
  });
  if (!worker) throw new Error('Digital employee was not found.');

  const connectionIds = [...new Set(bindings.map((binding) => binding.connection_id))];
  const connections = await loadOwnedConnections(userId, connectionIds);
  const connectionById = new Map(connections.map((connection) => [connection.id, connection]));

  const validationErrors = validateCapabilityAssignments(
    worker.WorkerPermissions,
    capabilityAssignments,
    connections.map((connection) => ({
      connectionId: connection.id,
      definition: connection.ConnectorDefinition,
    })),
  );
  if (validationErrors.length > 0) {
    const error = new Error('Digital employee capability validation failed.');
    error.details = validationErrors;
    throw error;
  }

  for (const connection of connections) {
    const result = await validateConnection(connection);
    if (!result.ok) {
      const error = new Error(`Workspace connection ${connection.workspace_name} failed validation.`);
      error.details = [result.error];
      throw error;
    }
  }

  const telemetryToken = crypto.randomBytes(32).toString('base64url');
  const telemetryTokenHash = crypto.createHash('sha256').update(telemetryToken).digest('hex');

  const created = await sequelize.transaction(async (transaction) => {
    const deployment = await Deployment.create({
      user_id: userId,
      worker_id: workerId,
      name: name || worker.name,
      workforce_level: 'single',
      status: 'validating',
      availability_target: '24/7/365',
      runtime_configuration: {},
      telemetry_token_hash: telemetryTokenHash,
    }, { transaction });

    const deploymentConnections = [];
    for (const binding of bindings) {
      const row = await DeploymentConnection.create({
        deployment_id: deployment.id,
        workspace_connection_id: binding.connection_id,
        selected_resource_ids: binding.selected_resource_ids || [],
        configuration: binding.configuration || {},
        status: 'pending',
      }, { transaction });
      deploymentConnections.push(row);
    }

    const connectionRowByWorkspaceId = new Map(
      deploymentConnections.map((row) => [row.workspace_connection_id, row]),
    );

    const grants = [];
    for (const assignment of capabilityAssignments) {
      const requirement = worker.WorkerPermissions.find(
        (permission) => permission.capability_key === assignment.capability_key,
      );
      if (!requirement) throw new Error(`Unknown capability: ${assignment.capability_key}`);
      const deploymentConnection = connectionRowByWorkspaceId.get(assignment.connection_id);
      if (!deploymentConnection) {
        throw new Error(`Capability ${assignment.capability_key} references an unbound connection.`);
      }
      const grant = await DeploymentCapabilityGrant.create({
        deployment_id: deployment.id,
        deployment_connection_id: deploymentConnection.id,
        capability_key: assignment.capability_key,
        approved: Boolean(assignment.approved),
        required: Boolean(requirement.is_required),
        approved_by_user_id: userId,
        approved_at: assignment.approved ? new Date() : null,
        constraints: assignment.constraints || {},
      }, { transaction });
      grants.push(grant);
    }

    return { deployment, deploymentConnections, grants };
  });

  const installed = [];
  try {
    for (const deploymentConnection of created.deploymentConnections) {
      const connection = connectionById.get(deploymentConnection.workspace_connection_id);
      const adapter = registry.get(connection.ConnectorDefinition.adapter_key);
      const secrets = await loadSecrets(connection.id);
      const grants = created.grants.filter(
        (grant) => grant.deployment_connection_id === deploymentConnection.id && grant.approved,
      );
      const result = await adapter.installDigitalEmployee({
        connection,
        secrets,
        worker,
        deployment: created.deployment,
        grants,
        selectedResourceIds: deploymentConnection.selected_resource_ids,
        telemetryToken,
      });
      if (!result?.ok || !result.external_installation_id) {
        throw new Error(`Installation failed for ${connection.workspace_name}.`);
      }

      await deploymentConnection.update({
        external_installation_id: result.external_installation_id,
        status: 'active',
        last_health_check_at: new Date(),
      });
      installed.push({ deploymentConnection, connection, adapter, secrets });
      await event(
        created.deployment.id,
        deploymentConnection.id,
        'deployment.connection.installed',
        `Digital employee installed in ${connection.workspace_name}.`,
        {
          connector_key: connection.ConnectorDefinition.key,
          external_workspace_id: connection.external_workspace_id,
          external_installation_id: result.external_installation_id,
        },
      );
    }

    await created.deployment.update({
      status: 'active',
      deployed_at: new Date(),
      last_activity_at: new Date(),
    });
    await Worker.increment('total_deployments', { by: 1, where: { id: worker.id } });
    await event(
      created.deployment.id,
      null,
      'deployment.activated',
      'Digital employee is active and available 24/7/365.',
      { connection_count: installed.length },
    );
    return loadDeployment(userId, created.deployment.id);
  } catch (error) {
    for (const installedItem of installed.reverse()) {
      try {
        await installedItem.adapter.uninstallDigitalEmployee(installedItem);
        await installedItem.deploymentConnection.update({ status: 'removed' });
      } catch (compensationError) {
        await event(
          created.deployment.id,
          installedItem.deploymentConnection.id,
          'deployment.compensation.failed',
          'ORCA could not automatically remove a partially installed digital employee.',
          { error: compensationError.message },
          'critical',
        );
      }
    }
    await created.deployment.update({ status: 'failed' });
    await event(
      created.deployment.id,
      null,
      'deployment.failed',
      'Digital employee deployment failed.',
      { error: error.message },
      'error',
    );
    throw error;
  }
}

async function loadDeployment(userId, deploymentId) {
  return Deployment.findOne({
    where: { id: deploymentId, user_id: userId },
    attributes: { exclude: ['telemetry_token_hash'] },
    include: [
      { model: Worker },
      {
        model: DeploymentConnection,
        include: [{ model: WorkspaceConnection, include: [{ model: ConnectorDefinition }] }],
      },
      { model: DeploymentCapabilityGrant },
    ],
  });
}

async function changeLifecycle({ userId, deploymentId, action }) {
  const deployment = await loadDeployment(userId, deploymentId);
  if (!deployment) throw new Error('Deployment was not found.');
  if (!['pause', 'resume', 'uninstall'].includes(action)) throw new Error('Unsupported lifecycle action.');

  const failures = [];
  for (const deploymentConnection of deployment.DeploymentConnections) {
    const connection = deploymentConnection.WorkspaceConnection;
    const adapter = registry.get(connection.ConnectorDefinition.adapter_key);
    const secrets = await loadSecrets(connection.id);
    try {
      if (action === 'pause') {
        await adapter.pauseDigitalEmployee({ connection, secrets, deploymentConnection });
        await deploymentConnection.update({ status: 'paused' });
      } else if (action === 'resume') {
        const health = await adapter.healthCheck({ connection, secrets });
        if (!health.ok) throw new Error('Workspace connection failed its health check.');
        await adapter.resumeDigitalEmployee({ connection, secrets, deploymentConnection });
        await deploymentConnection.update({ status: 'active', last_health_check_at: new Date() });
      } else {
        await adapter.uninstallDigitalEmployee({ connection, secrets, deploymentConnection });
        await deploymentConnection.update({ status: 'removed' });
      }
      const completedAction = PAST_TENSE[action];
      await event(
        deployment.id,
        deploymentConnection.id,
        `deployment.connection.${completedAction}`,
        `Digital employee ${completedAction} for ${connection.workspace_name}.`,
      );
    } catch (error) {
      failures.push({ connection_id: connection.id, workspace_name: connection.workspace_name, error: error.message });
      await deploymentConnection.update({ status: 'degraded' });
    }
  }

  if (failures.length > 0) {
    await Deployment.update({ status: 'degraded' }, { where: { id: deployment.id } });
    const error = new Error(`Deployment ${action} was incomplete.`);
    error.details = failures;
    throw error;
  }

  const updates = action === 'pause'
    ? { status: 'paused', paused_at: new Date() }
    : action === 'resume'
      ? { status: 'active', paused_at: null, last_activity_at: new Date() }
      : { status: 'uninstalled', uninstalled_at: new Date() };
  await Deployment.update(updates, { where: { id: deployment.id } });
  const completedAction = PAST_TENSE[action];
  await event(deployment.id, null, `deployment.${completedAction}`, `Digital employee ${completedAction}.`);
  return loadDeployment(userId, deployment.id);
}

module.exports = { createDeployment, loadDeployment, changeLifecycle };
