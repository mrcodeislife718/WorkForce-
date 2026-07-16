const {
  ConnectorDefinition,
  WorkspaceConnection,
  ConnectionSecret,
  WorkspaceResource,
} = require('../models');
const registry = require('../connectors/registerBuiltins')();
const { encryptSecret, decryptSecret } = require('./credentialVault');

async function loadSecrets(workspaceConnectionId) {
  const records = await ConnectionSecret.findAll({
    where: { workspace_connection_id: workspaceConnectionId },
  });
  return Object.fromEntries(records.map((record) => [record.secret_type, decryptSecret(record)]));
}

async function storeSecrets(workspaceConnectionId, secrets = {}) {
  for (const [secretType, plaintext] of Object.entries(secrets)) {
    if (plaintext === undefined || plaintext === null || plaintext === '') continue;
    const encrypted = encryptSecret(String(plaintext));
    await ConnectionSecret.upsert({
      workspace_connection_id: workspaceConnectionId,
      secret_type: secretType,
      ...encrypted,
    });
  }
}

async function getOwnedConnection(userId, connectionId, options = {}) {
  return WorkspaceConnection.findOne({
    where: { id: connectionId, user_id: userId },
    include: [{ model: ConnectorDefinition }],
    ...options,
  });
}

async function validateConnection(connection) {
  const definition = connection.ConnectorDefinition || await connection.getConnectorDefinition();
  if (!definition) throw new Error('Connector definition was not found.');
  if (!registry.has(definition.adapter_key)) {
    throw new Error(`Connector adapter ${definition.adapter_key} is not installed.`);
  }

  const adapter = registry.get(definition.adapter_key);
  const secrets = await loadSecrets(connection.id);
  const result = await adapter.validateConnection({ connection, secrets });

  if (!result.ok) {
    await connection.update({
      status: 'error',
      last_error: JSON.stringify(result.error),
      last_verified_at: new Date(),
    });
    return result;
  }

  await connection.update({
    status: 'active',
    connected_at: connection.connected_at || new Date(),
    last_verified_at: new Date(),
    last_error: null,
  });
  return result;
}

async function discoverAndPersistResources(connection) {
  const definition = connection.ConnectorDefinition || await connection.getConnectorDefinition();
  const adapter = registry.get(definition.adapter_key);
  const secrets = await loadSecrets(connection.id);
  const resources = await adapter.discoverResources({ connection, secrets });

  for (const resource of resources) {
    await WorkspaceResource.upsert({
      workspace_connection_id: connection.id,
      external_id: resource.external_id,
      resource_type: resource.resource_type,
      name: resource.name,
      parent_external_id: resource.parent_external_id || null,
      metadata: resource.metadata || {},
      is_selectable: resource.is_selectable !== false,
      last_discovered_at: new Date(),
    });
  }

  return WorkspaceResource.findAll({
    where: { workspace_connection_id: connection.id },
    order: [['resource_type', 'ASC'], ['name', 'ASC']],
  });
}

module.exports = {
  loadSecrets,
  storeSecrets,
  getOwnedConnection,
  validateConnection,
  discoverAndPersistResources,
};
