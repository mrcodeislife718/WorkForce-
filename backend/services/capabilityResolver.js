const { WorkerPermission, WorkspaceConnection, ConnectorDefinition } = require('../models');

function capabilityKeys(connection) {
  const definitionCapabilities = connection?.ConnectorDefinition?.capability_manifest?.capabilities || [];
  const connectionCapabilities = connection?.configuration?.capabilities || [];
  return new Set([
    ...definitionCapabilities.map((capability) => typeof capability === 'string' ? capability : capability.key),
    ...connectionCapabilities.map((capability) => typeof capability === 'string' ? capability : capability.key),
  ].filter(Boolean));
}

async function getDigitalEmployeeRequirements(workerId) {
  return WorkerPermission.findAll({
    where: { worker_id: workerId },
    order: [['is_required', 'DESC'], ['capability_key', 'ASC']],
  });
}

async function getCompatibleConnections(userId, workerId) {
  const requirements = await getDigitalEmployeeRequirements(workerId);
  const connections = await WorkspaceConnection.findAll({
    where: { user_id: userId, status: 'active' },
    include: [{ model: ConnectorDefinition }],
    order: [['workspace_name', 'ASC']],
  });

  return connections.map((connection) => {
    const supported = capabilityKeys(connection);
    const satisfied = requirements.filter((requirement) => supported.has(requirement.capability_key));
    return {
      connection,
      satisfied_capabilities: satisfied.map((requirement) => requirement.capability_key),
      can_satisfy_all_required: requirements
        .filter((requirement) => requirement.is_required)
        .every((requirement) => supported.has(requirement.capability_key)),
    };
  });
}

function validateCapabilityAssignments(requirements, assignments, connections) {
  const assignmentByCapability = new Map(assignments.map((item) => [item.capability_key, item]));
  const connectionById = new Map(connections.map((connection) => [connection.id, connection]));
  const errors = [];

  for (const requirement of requirements) {
    const assignment = assignmentByCapability.get(requirement.capability_key);
    if (!assignment) {
      if (requirement.is_required) errors.push(`Missing required capability: ${requirement.capability_key}`);
      continue;
    }
    if (!assignment.approved) {
      if (requirement.is_required) errors.push(`Required capability was not approved: ${requirement.capability_key}`);
      continue;
    }
    const connection = connectionById.get(assignment.connection_id);
    if (!connection) {
      errors.push(`Connection was not supplied for capability: ${requirement.capability_key}`);
      continue;
    }
    if (!capabilityKeys(connection).has(requirement.capability_key)) {
      errors.push(`${connection.ConnectorDefinition.name} does not provide ${requirement.capability_key}`);
    }
  }

  return errors;
}

module.exports = {
  capabilityKeys,
  getDigitalEmployeeRequirements,
  getCompatibleConnections,
  validateCapabilityAssignments,
};
