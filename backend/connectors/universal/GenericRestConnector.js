const axios = require('axios');
const ConnectorAdapter = require('../ConnectorAdapter');
const { assertSafeUrl } = require('../security/networkGuard');

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

function buildAuthHeaders(configuration, secrets) {
  const auth = configuration.auth || {};
  switch (auth.type) {
    case 'bearer_token':
      if (!secrets.bearer_token) throw new Error('Bearer token is missing.');
      return { Authorization: `Bearer ${secrets.bearer_token}` };
    case 'api_key':
      if (!secrets.api_key) throw new Error('API key is missing.');
      return { [auth.header_name || 'X-API-Key']: secrets.api_key };
    case 'basic_auth': {
      if (!secrets.basic_username || !secrets.basic_password) {
        throw new Error('Basic-auth credentials are missing.');
      }
      const encoded = Buffer.from(`${secrets.basic_username}:${secrets.basic_password}`).toString('base64');
      return { Authorization: `Basic ${encoded}` };
    }
    case 'none':
    case undefined:
      return {};
    default:
      throw new Error(`Unsupported REST authentication type: ${auth.type}`);
  }
}

function interpolatePath(path, params = {}) {
  return String(path).replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    if (params[key] === undefined || params[key] === null) {
      throw new Error(`Missing path parameter: ${key}`);
    }
    return encodeURIComponent(String(params[key]));
  });
}

class GenericRestConnector extends ConnectorAdapter {
  constructor() {
    super({ key: 'generic-rest', name: 'Generic REST API', capabilities: ['api.request'] });
  }

  async request({ configuration, secrets, operation, input = {} }) {
    if (!configuration?.base_url) throw new Error('REST connector base_url is required.');
    if (!operation?.path) throw new Error('REST connector operation path is required.');

    const method = String(operation.method || 'GET').toUpperCase();
    if (!ALLOWED_METHODS.has(method)) throw new Error(`HTTP method ${method} is not allowed.`);

    const baseUrl = configuration.base_url.endsWith('/') ? configuration.base_url : `${configuration.base_url}/`;
    const relativePath = interpolatePath(operation.path.replace(/^\//, ''), input.path_params || {});
    const url = new URL(relativePath, baseUrl).toString();
    await assertSafeUrl(url, configuration.allowed_hosts || []);

    const response = await axios({
      method,
      url,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...buildAuthHeaders(configuration, secrets),
        ...(configuration.headers || {}),
        ...(operation.headers || {}),
      },
      params: input.query || undefined,
      data: ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? input.body : undefined,
      timeout: Number(process.env.CONNECTOR_REQUEST_TIMEOUT_MS || 30000),
      maxContentLength: Number(process.env.CONNECTOR_MAX_RESPONSE_BYTES || 5242880),
      maxBodyLength: Number(process.env.CONNECTOR_MAX_RESPONSE_BYTES || 5242880),
      validateStatus: (status) => status >= 200 && status < 300,
    });

    return {
      ok: true,
      status: response.status,
      data: response.data,
      headers: {
        'content-type': response.headers['content-type'] || null,
        'x-request-id': response.headers['x-request-id'] || null,
      },
    };
  }

  async validateConnection({ connection, secrets }) {
    try {
      const operation = connection.configuration?.operations?.health;
      if (!operation) throw new Error('A real health operation must be configured.');
      const response = await this.request({ configuration: connection.configuration, secrets, operation });
      return { ok: true, provider_response_status: response.status };
    } catch (error) {
      return { ok: false, error: this.normalizeError(error) };
    }
  }

  async discoverResources({ connection, secrets }) {
    const operation = connection.configuration?.operations?.discover_resources;
    if (!operation) return [];
    const response = await this.request({ configuration: connection.configuration, secrets, operation });
    const resources = Array.isArray(response.data) ? response.data : response.data?.resources;
    if (!Array.isArray(resources)) throw new Error('Resource discovery response must contain an array.');
    return resources.map((resource) => ({
      external_id: String(resource.id),
      resource_type: String(resource.type || 'resource'),
      name: String(resource.name || resource.id),
      parent_external_id: resource.parent_id ? String(resource.parent_id) : null,
      metadata: resource.metadata || {},
    }));
  }

  async installDigitalEmployee({
    connection,
    secrets,
    worker,
    deployment,
    grants,
    selectedResourceIds,
    telemetryToken,
  }) {
    const operation = connection.configuration?.operations?.install;
    if (!operation) throw new Error('A real install operation must be configured for this workspace.');
    const response = await this.request({
      configuration: connection.configuration,
      secrets,
      operation,
      input: {
        body: {
          orca_deployment_id: deployment.id,
          digital_employee: { id: worker.id, name: worker.name, version: worker.version },
          approved_capabilities: grants.map((grant) => ({
            key: grant.capability_key,
            constraints: grant.constraints || {},
          })),
          selected_resource_ids: selectedResourceIds,
          telemetry: {
            url: `${process.env.PUBLIC_API_URL || ''}/api/telemetry/deployments/${deployment.id}/events`,
            bearer_token: telemetryToken,
          },
        },
      },
    });
    const externalInstallationId = response.data?.installation_id || response.data?.id;
    if (!externalInstallationId) throw new Error('Install response did not return installation_id or id.');
    return { ok: true, external_installation_id: String(externalInstallationId), response: response.data };
  }

  async executeCapability({ connection, secrets, capabilityKey, input }) {
    const operation = connection.configuration?.operations?.[capabilityKey];
    if (!operation) throw new Error(`Capability ${capabilityKey} is not configured for this connection.`);
    return this.request({ configuration: connection.configuration, secrets, operation, input });
  }

  async pauseDigitalEmployee(args) { return this.lifecycleRequest('pause', args); }
  async resumeDigitalEmployee(args) { return this.lifecycleRequest('resume', args); }
  async uninstallDigitalEmployee(args) { return this.lifecycleRequest('uninstall', args); }

  async lifecycleRequest(action, { connection, secrets, deploymentConnection }) {
    const operation = connection.configuration?.operations?.[action];
    if (!operation) throw new Error(`A real ${action} operation must be configured.`);
    return this.request({
      configuration: connection.configuration,
      secrets,
      operation,
      input: {
        body: {
          external_installation_id: deploymentConnection.external_installation_id,
          orca_deployment_id: deploymentConnection.deployment_id,
        },
      },
    });
  }
}

module.exports = new GenericRestConnector();
