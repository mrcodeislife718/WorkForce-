const registry = require('./registry');
const genericRest = require('./universal/GenericRestConnector');
const genericWebhook = require('./universal/GenericWebhookConnector');

function registerBuiltins() {
  if (!registry.has(genericRest.definition.key)) {
    registry.register(genericRest.definition.key, genericRest);
  }
  if (!registry.has(genericWebhook.definition.key)) {
    registry.register(genericWebhook.definition.key, genericWebhook);
  }
  return registry;
}

module.exports = registerBuiltins;
