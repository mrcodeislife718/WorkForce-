class ConnectorRegistry {
  constructor() {
    this.adapters = new Map();
  }

  register(key, adapter) {
    if (!key || typeof key !== 'string') throw new TypeError('Connector key must be a string.');
    if (!adapter) throw new TypeError(`Connector adapter is required for ${key}.`);
    if (this.adapters.has(key)) throw new Error(`Connector ${key} is already registered.`);
    this.adapters.set(key, adapter);
  }

  replace(key, adapter) {
    if (!key || !adapter) throw new TypeError('Connector key and adapter are required.');
    this.adapters.set(key, adapter);
  }

  get(key) {
    const adapter = this.adapters.get(key);
    if (!adapter) throw new Error(`No connector adapter is registered for ${key}.`);
    return adapter;
  }

  has(key) {
    return this.adapters.has(key);
  }

  list() {
    return Array.from(this.adapters.entries()).map(([key, adapter]) => ({
      key,
      definition: adapter.definition,
    }));
  }
}

module.exports = new ConnectorRegistry();
