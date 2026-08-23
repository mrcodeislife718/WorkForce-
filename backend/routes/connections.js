const express = require('express');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const {
  ConnectorDefinition,
  WorkspaceConnection,
  ConnectionSecret,
  WorkspaceResource,
  DeploymentConnection,
  Deployment,
} = require('../models');
const registry = require('../connectors/registerBuiltins')();
const {
  storeSecrets,
  getOwnedConnection,
  validateConnection,
  discoverAndPersistResources,
} = require('../services/connectionService');

const router = express.Router();

function validateUniversalConfiguration(definition, configuration, secrets) {
  const capabilities = Array.isArray(configuration?.capabilities)
    ? configuration.capabilities.map((value) => typeof value === 'string' ? value.trim() : value?.key).filter(Boolean)
    : [];
  if (capabilities.length === 0) {
    throw new Error('Declare at least one real capability provided by this connection.');
  }
  if (!Array.isArray(configuration?.allowed_hosts) || configuration.allowed_hosts.length === 0) {
    throw new Error('At least one allowed host is required.');
  }

  if (definition.adapter_key === 'generic-rest') {
    if (!configuration?.base_url) throw new Error('base_url is required.');
    for (const lifecycleOperation of ['health', 'install', 'pause', 'resume', 'update', 'uninstall']) {
      if (!configuration?.operations?.[lifecycleOperation]) {
        throw new Error(`A real ${lifecycleOperation} operation is required.`);
      }
    }
    for (const capability of capabilities) {
      if (!configuration?.operations?.[capability]) {
        throw new Error(`A real REST operation is required for capability ${capability}.`);
      }
    }
    const authType = configuration.auth?.type;
    if (authType === 'bearer_token' && !secrets?.bearer_token) throw new Error('bearer_token is required.');
    if (authType === 'api_key' && !secrets?.api_key) throw new Error('api_key is required.');
    if (authType === 'basic_auth' && (!secrets?.basic_username || !secrets?.basic_password)) {
      throw new Error('basic_username and basic_password are required.');
    }
  }

  if (definition.adapter_key === 'generic-webhook') {
    if (!configuration?.webhook_url) throw new Error('webhook_url is required.');
    if (!secrets?.webhook_secret) throw new Error('webhook_secret is required.');
  }
}

router.get('/', auth, async (req, res) => {
  try {
    const connections = await WorkspaceConnection.findAll({
      where: { user_id: req.user.id },
      include: [{ model: ConnectorDefinition }],
      attributes: { exclude: ['configuration'] },
      order: [['createdAt', 'DESC']],
    });
    return res.json(connections);
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load workspace connections.' });
  }
});

router.post('/', auth, async (req, res) => {
  const { connector_key, workspace_name, configuration = {}, secrets = {} } = req.body;
  if (!connector_key || !workspace_name) {
    return res.status(400).json({ error: 'connector_key and workspace_name are required.' });
  }

  let connection;
  try {
    const definition = await ConnectorDefinition.findOne({ where: { key: connector_key } });
    if (!definition) return res.status(404).json({ error: 'Connector was not found.' });
    if (definition.status !== 'active' || !registry.has(definition.adapter_key)) {
      return res.status(409).json({ error: 'This connector is not configured and available yet.' });
    }

    validateUniversalConfiguration(definition, configuration, secrets);

    connection = await WorkspaceConnection.create({
      user_id: req.user.id,
      connector_definition_id: definition.id,
      workspace_name: String(workspace_name).trim(),
      workspace_domain: req.body.workspace_domain || null,
      external_account_id: req.body.external_account_id || null,
      external_workspace_id: req.body.external_workspace_id || null,
      external_organization_id: req.body.external_organization_id || null,
      account_name: req.body.account_name || null,
      status: 'pending',
      granted_scopes: req.body.granted_scopes || [],
      configuration,
      metadata: req.body.metadata || {},
    });

    await storeSecrets(connection.id, secrets);
    connection.ConnectorDefinition = definition;
    const validation = await validateConnection(connection);
    if (!validation.ok) {
      return res.status(422).json({
        error: 'The real workspace connection could not be validated.',
        details: validation.error,
        connection_id: connection.id,
      });
    }

    const resources = await discoverAndPersistResources(connection);
    const created = await getOwnedConnection(req.user.id, connection.id, {
      include: [{ model: ConnectorDefinition }, { model: WorkspaceResource }],
    });
    return res.status(201).json({ connection: created, resources });
  } catch (error) {
    if (connection && ['pending', 'active'].includes(connection.status)) {
      await connection.update({ status: 'error', last_error: error.message }).catch(() => {});
    }
    return res.status(400).json({ error: error.message || 'Unable to connect workspace.' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const connection = await getOwnedConnection(req.user.id, req.params.id, {
      include: [{ model: ConnectorDefinition }, { model: WorkspaceResource }],
    });
    if (!connection) return res.status(404).json({ error: 'Workspace connection was not found.' });
    const payload = connection.toJSON();
    delete payload.configuration;
    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load workspace connection.' });
  }
});

router.post('/:id/test', auth, async (req, res) => {
  try {
    const connection = await getOwnedConnection(req.user.id, req.params.id);
    if (!connection) return res.status(404).json({ error: 'Workspace connection was not found.' });
    const result = await validateConnection(connection);
    return res.status(result.ok ? 200 : 422).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.post('/:id/discover', auth, async (req, res) => {
  try {
    const connection = await getOwnedConnection(req.user.id, req.params.id);
    if (!connection) return res.status(404).json({ error: 'Workspace connection was not found.' });
    if (connection.status !== 'active') {
      return res.status(409).json({ error: 'Only an active real workspace connection can be discovered.' });
    }
    const resources = await discoverAndPersistResources(connection);
    return res.json({ resources });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const connection = await getOwnedConnection(req.user.id, req.params.id);
    if (!connection) return res.status(404).json({ error: 'Workspace connection was not found.' });

    const activeBinding = await DeploymentConnection.findOne({
      where: {
        workspace_connection_id: connection.id,
        status: { [Op.in]: ['pending', 'active', 'degraded', 'paused'] },
      },
      include: [{
        model: Deployment,
        where: { user_id: req.user.id, status: { [Op.ne]: 'uninstalled' } },
        required: true,
      }],
    });
    if (activeBinding) {
      return res.status(409).json({
        error: 'Uninstall the digital employees using this workspace before disconnecting it.',
      });
    }

    await ConnectionSecret.destroy({ where: { workspace_connection_id: connection.id } });
    await WorkspaceResource.destroy({ where: { workspace_connection_id: connection.id } });
    await connection.update({ status: 'disconnected', last_error: null, configuration: {} });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to disconnect workspace.' });
  }
});

module.exports = router;
