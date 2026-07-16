class ConnectorAdapter {
  constructor(definition) {
    if (!definition?.key) throw new Error('Connector definition key is required.');
    this.definition = definition;
  }

  async validateConnection() {
    throw new Error(`${this.definition.key} does not implement connection validation.`);
  }

  async discoverResources() {
    throw new Error(`${this.definition.key} does not implement resource discovery.`);
  }

  async installDigitalEmployee() {
    throw new Error(`${this.definition.key} does not implement digital employee installation.`);
  }

  async executeCapability() {
    throw new Error(`${this.definition.key} does not implement capability execution.`);
  }

  async pauseDigitalEmployee() {
    throw new Error(`${this.definition.key} does not implement pausing.`);
  }

  async resumeDigitalEmployee() {
    throw new Error(`${this.definition.key} does not implement resuming.`);
  }

  async uninstallDigitalEmployee() {
    throw new Error(`${this.definition.key} does not implement uninstallation.`);
  }

  async healthCheck(args) {
    return this.validateConnection(args);
  }

  normalizeError(error) {
    return {
      code: error.response?.data?.error || error.code || 'CONNECTOR_ERROR',
      message:
        error.response?.data?.error_description ||
        error.response?.data?.message ||
        error.message ||
        'Connector request failed.',
      status: error.response?.status || 500,
    };
  }
}

module.exports = ConnectorAdapter;
