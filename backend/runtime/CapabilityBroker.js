const {
  Deployment,
  DeploymentConnection,
  DeploymentCapabilityGrant,
  WorkspaceConnection,
  ConnectorDefinition,
  CapabilityExecution,
} = require('../models');
const registry = require('../connectors/registerBuiltins')();
const { loadSecrets } = require('../services/connectionService');

function assertResourceAllowed(deploymentConnection, input = {}) {
  const selected = deploymentConnection.selected_resource_ids || [];
  const requested = input.resource_id || input.external_resource_id || input.channel_id || input.mailbox_id || null;
  if (selected.length > 0 && requested && !selected.includes(requested)) {
    throw new Error('Requested resource is outside the customer-approved resource boundary.');
  }
}

async function execute({ deploymentId, taskRunId = null, capabilityKey, input = {} }) {
  const grant = await DeploymentCapabilityGrant.findOne({
    where: {
      deployment_id: deploymentId,
      capability_key: capabilityKey,
      approved: true,
    },
    include: [{
      model: DeploymentConnection,
      include: [{ model: WorkspaceConnection, include: [ConnectorDefinition] }],
    }],
  });
  if (!grant) throw new Error(`Capability ${capabilityKey} is not approved for this deployment.`);

  const deployment = await Deployment.findByPk(deploymentId);
  if (!deployment || deployment.status !== 'active') {
    throw new Error('Digital employee deployment is not active.');
  }

  const deploymentConnection = grant.DeploymentConnection;
  if (!deploymentConnection || deploymentConnection.status !== 'active') {
    throw new Error('The approved workspace binding is not active.');
  }
  assertResourceAllowed(deploymentConnection, input);

  const connection = deploymentConnection.WorkspaceConnection;
  const adapter = registry.get(connection.ConnectorDefinition.adapter_key);
  const secrets = await loadSecrets(connection.id);
  const startedAt = new Date();
  const execution = await CapabilityExecution.create({
    task_run_id: taskRunId,
    deployment_id: deploymentId,
    deployment_connection_id: deploymentConnection.id,
    capability_key: capabilityKey,
    provider: connection.ConnectorDefinition.key,
    external_workspace_id: connection.external_workspace_id,
    resource_type: input.resource_type || null,
    operation: input.operation || capabilityKey,
    status: 'running',
    started_at: startedAt,
    metadata: {},
  });

  try {
    const result = await adapter.executeCapability({
      connection,
      secrets,
      capabilityKey,
      input,
      grant,
      deploymentConnection,
    });
    const completedAt = new Date();
    await execution.update({
      status: 'succeeded',
      completed_at: completedAt,
      duration_ms: completedAt.getTime() - startedAt.getTime(),
      records_read: Number(result?.records_read || 0),
      records_created: Number(result?.records_created || 0),
      records_updated: Number(result?.records_updated || 0),
      records_deleted: Number(result?.records_deleted || 0),
      metadata: {
        provider_status: result?.status || null,
        provider_request_id: result?.headers?.['x-request-id'] || null,
      },
    });
    await deployment.update({ last_activity_at: completedAt });
    await connection.update({ last_used_at: completedAt });
    return { execution, result };
  } catch (error) {
    const completedAt = new Date();
    await execution.update({
      status: 'failed',
      completed_at: completedAt,
      duration_ms: completedAt.getTime() - startedAt.getTime(),
      error_code: error.code || 'CAPABILITY_EXECUTION_FAILED',
      error_message_redacted: String(error.message || 'Capability execution failed.').slice(0, 2000),
    });
    throw error;
  }
}

module.exports = { execute, assertResourceAllowed };
