const crypto = require('crypto');
const axios = require('axios');
const ConnectorAdapter = require('../ConnectorAdapter');
const { assertSafeUrl } = require('../security/networkGuard');

function sign(secret, timestamp, body) {
  return crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

class GenericWebhookConnector extends ConnectorAdapter {
  constructor() {
    super({
      key: 'generic-webhook',
      name: 'Signed Webhook',
      capabilities: ['webhook.deliver'],
    });
  }

  async deliver({ connection, secrets, eventType, payload }) {
    const url = connection.configuration?.webhook_url;
    if (!url) throw new Error('webhook_url is required.');
    if (!secrets.webhook_secret) throw new Error('Webhook secret is missing.');
    await assertSafeUrl(url, connection.configuration?.allowed_hosts || []);

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify({ event_type: eventType, payload });
    const signature = sign(secrets.webhook_secret, timestamp, body);

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'X-ORCA-Timestamp': timestamp,
        'X-ORCA-Signature': `sha256=${signature}`,
      },
      timeout: Number(process.env.CONNECTOR_REQUEST_TIMEOUT_MS || 30000),
      maxContentLength: Number(process.env.CONNECTOR_MAX_RESPONSE_BYTES || 5242880),
      maxBodyLength: Number(process.env.CONNECTOR_MAX_RESPONSE_BYTES || 5242880),
      validateStatus: (status) => status >= 200 && status < 300,
    });

    return { ok: true, status: response.status, data: response.data };
  }

  async validateConnection({ connection, secrets }) {
    try {
      const challenge = crypto.randomBytes(24).toString('hex');
      const response = await this.deliver({
        connection,
        secrets,
        eventType: 'orca.connection.verify',
        payload: { challenge },
      });
      if (connection.configuration?.require_challenge_echo !== false) {
        const returned = response.data?.challenge;
        if (returned !== challenge) throw new Error('Webhook did not return the ORCA verification challenge.');
      }
      return { ok: true, provider_response_status: response.status };
    } catch (error) {
      return { ok: false, error: this.normalizeError(error) };
    }
  }

  async discoverResources() {
    return [];
  }

  async installDigitalEmployee({ connection, secrets, worker, deployment, grants, selectedResourceIds }) {
    const response = await this.deliver({
      connection,
      secrets,
      eventType: 'orca.digital_employee.install',
      payload: {
        orca_deployment_id: deployment.id,
        digital_employee: { id: worker.id, name: worker.name, version: worker.version },
        approved_capabilities: grants.map((grant) => ({
          key: grant.capability_key,
          constraints: grant.constraints || {},
        })),
        selected_resource_ids: selectedResourceIds,
        telemetry_url: `${process.env.PUBLIC_API_URL || ''}/api/telemetry/deployments/${deployment.id}`,
      },
    });
    const externalInstallationId = response.data?.installation_id || response.data?.id;
    if (!externalInstallationId) {
      throw new Error('Webhook install response did not return installation_id or id.');
    }
    return { ok: true, external_installation_id: String(externalInstallationId) };
  }

  async executeCapability({ connection, secrets, capabilityKey, input }) {
    return this.deliver({
      connection,
      secrets,
      eventType: 'orca.capability.execute',
      payload: { capability_key: capabilityKey, input },
    });
  }

  async pauseDigitalEmployee(args) {
    return this.lifecycle('pause', args);
  }

  async resumeDigitalEmployee(args) {
    return this.lifecycle('resume', args);
  }

  async uninstallDigitalEmployee(args) {
    return this.lifecycle('uninstall', args);
  }

  async lifecycle(action, { connection, secrets, deploymentConnection }) {
    return this.deliver({
      connection,
      secrets,
      eventType: `orca.digital_employee.${action}`,
      payload: {
        orca_deployment_id: deploymentConnection.deployment_id,
        external_installation_id: deploymentConnection.external_installation_id,
      },
    });
  }
}

module.exports = new GenericWebhookConnector();
