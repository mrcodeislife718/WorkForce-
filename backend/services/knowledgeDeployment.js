'use strict';

// Knowledge-only employees do not need authority over any external system.
// All employees with declared external capabilities keep the connector requirements.
function canDeployWithoutConnections(permissions = []) {
  return Array.isArray(permissions) && permissions.length === 0;
}

module.exports = { canDeployWithoutConnections };
