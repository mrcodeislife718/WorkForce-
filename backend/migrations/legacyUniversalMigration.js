const crypto = require('crypto');
const { DataTypes, QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

function slug(value) {
  return String(value || 'permission')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '');
}

function legacyCapability(tool, scope) {
  const normalizedTool = String(tool || '').toLowerCase();
  const normalizedScope = String(scope || '').toLowerCase();
  if (normalizedScope.includes('read message')) return ['messages.read', 'message', 'read', 'medium'];
  if (normalizedScope.includes('send repl') || normalizedScope.includes('send message')) return ['messages.send', 'message', 'create', 'high'];
  if (normalizedScope.includes('read email')) return ['email.read', 'email', 'read', 'medium'];
  if (normalizedScope.includes('send email')) return ['email.send', 'email', 'create', 'high'];
  if (normalizedScope.includes('view order') || normalizedScope.includes('read order')) return ['orders.read', 'order', 'read', 'medium'];
  if (normalizedScope.includes('update order')) return ['orders.update', 'order', 'update', 'critical'];
  if (normalizedScope.includes('update product')) return ['products.update', 'product', 'update', 'high'];
  if (normalizedScope.includes('read contact')) return ['contacts.read', 'contact', 'read', 'medium'];
  return [`legacy.${slug(normalizedTool)}.${slug(normalizedScope)}`, normalizedTool || 'resource', 'execute', 'high'];
}

async function resolveTable(queryInterface, expected) {
  const tables = await queryInterface.showAllTables();
  const names = tables.map((table) => typeof table === 'string' ? table : table.tableName);
  return names.find((name) => String(name).toLowerCase() === expected.toLowerCase()) || null;
}

async function addColumnIfMissing(queryInterface, table, columns, name, definition) {
  if (!columns[name]) {
    await queryInterface.addColumn(table, name, definition);
    columns[name] = definition;
  }
}

async function migrateWorkerPermissions(queryInterface, transaction) {
  const table = await resolveTable(queryInterface, 'WorkerPermissions');
  if (!table) return;
  const columns = await queryInterface.describeTable(table);

  await addColumnIfMissing(queryInterface, table, columns, 'capability_key', { type: DataTypes.STRING(160), allowNull: true, transaction });
  await addColumnIfMissing(queryInterface, table, columns, 'name', { type: DataTypes.STRING(160), allowNull: true, transaction });
  await addColumnIfMissing(queryInterface, table, columns, 'description', { type: DataTypes.TEXT, allowNull: true, transaction });
  await addColumnIfMissing(queryInterface, table, columns, 'resource_type', { type: DataTypes.STRING(100), allowNull: true, transaction });
  await addColumnIfMissing(queryInterface, table, columns, 'action', { type: DataTypes.STRING(40), allowNull: true, transaction });
  await addColumnIfMissing(queryInterface, table, columns, 'risk_level', { type: DataTypes.STRING(20), allowNull: true, transaction });
  await addColumnIfMissing(queryInterface, table, columns, 'requires_human_approval', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, transaction });
  await addColumnIfMissing(queryInterface, table, columns, 'constraints_schema', { type: DataTypes.JSONB, allowNull: false, defaultValue: {}, transaction });

  const quoted = queryInterface.queryGenerator.quoteTable(table);
  const toolExpression = columns.tool ? '"tool"::text AS tool' : "'' AS tool";
  const scopeExpression = columns.scope ? '"scope" AS scope' : "'' AS scope";
  const rows = await sequelize.query(
    `SELECT "id", ${toolExpression}, ${scopeExpression}, "capability_key", "name" FROM ${quoted}`,
    { type: QueryTypes.SELECT, transaction },
  );

  for (const row of rows) {
    if (row.capability_key && row.name) continue;
    const [capabilityKey, resourceType, action, riskLevel] = legacyCapability(row.tool, row.scope);
    await queryInterface.bulkUpdate(table, {
      capability_key: row.capability_key || capabilityKey,
      name: row.name || row.scope || capabilityKey,
      description: row.scope ? `Migrated legacy permission: ${row.scope}` : `Permission for ${capabilityKey}`,
      resource_type: resourceType,
      action,
      risk_level: riskLevel,
    }, { id: row.id }, { transaction });
  }

  for (const [name, definition] of Object.entries({
    capability_key: { type: DataTypes.STRING(160), allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    resource_type: { type: DataTypes.STRING(100), allowNull: false },
    action: { type: DataTypes.STRING(40), allowNull: false },
    risk_level: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'low' },
  })) {
    await queryInterface.changeColumn(table, name, definition, { transaction });
  }

  if (columns.tool) await queryInterface.removeColumn(table, 'tool', { transaction });
  if (columns.scope) await queryInterface.removeColumn(table, 'scope', { transaction });
  await sequelize.query('DROP TYPE IF EXISTS "enum_WorkerPermissions_tool"', { transaction });
}

async function migrateDeployments(queryInterface, transaction) {
  const table = await resolveTable(queryInterface, 'Deployments');
  if (!table) return;
  const columns = await queryInterface.describeTable(table);
  const quoted = queryInterface.queryGenerator.quoteTable(table);

  if (columns.status && String(columns.status.type).toUpperCase().includes('ENUM')) {
    await sequelize.query(
      `ALTER TABLE ${quoted} ALTER COLUMN "status" TYPE VARCHAR(32) USING "status"::text`,
      { transaction },
    );
    await sequelize.query('DROP TYPE IF EXISTS "enum_Deployments_status"', { transaction });
  }

  await addColumnIfMissing(queryInterface, table, columns, 'name', { type: DataTypes.STRING(255), allowNull: true, transaction });
  await addColumnIfMissing(queryInterface, table, columns, 'workforce_level', { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'single', transaction });
  await addColumnIfMissing(queryInterface, table, columns, 'team_id', { type: DataTypes.UUID, allowNull: true, transaction });
  await addColumnIfMissing(queryInterface, table, columns, 'department_id', { type: DataTypes.UUID, allowNull: true, transaction });
  await addColumnIfMissing(queryInterface, table, columns, 'manager_deployment_id', { type: DataTypes.UUID, allowNull: true, transaction });
  await addColumnIfMissing(queryInterface, table, columns, 'runtime_configuration', { type: DataTypes.JSONB, allowNull: false, defaultValue: {}, transaction });
  await addColumnIfMissing(queryInterface, table, columns, 'availability_target', { type: DataTypes.STRING(20), allowNull: false, defaultValue: '24/7/365', transaction });
  await addColumnIfMissing(queryInterface, table, columns, 'telemetry_token_hash', { type: DataTypes.STRING(64), allowNull: true, transaction });
  await addColumnIfMissing(queryInterface, table, columns, 'paused_at', { type: DataTypes.DATE, allowNull: true, transaction });
  await addColumnIfMissing(queryInterface, table, columns, 'uninstalled_at', { type: DataTypes.DATE, allowNull: true, transaction });

  await sequelize.query(
    `UPDATE ${quoted} SET "status" = CASE WHEN "status" = 'pending' THEN 'draft' ELSE "status" END`,
    { transaction },
  );

  const workersTable = await resolveTable(queryInterface, 'Workers');
  const workerJoin = workersTable
    ? `LEFT JOIN ${queryInterface.queryGenerator.quoteTable(workersTable)} w ON w."id" = d."worker_id"`
    : '';
  const workerName = workersTable ? 'w."name" AS worker_name' : 'NULL AS worker_name';
  const rows = await sequelize.query(
    `SELECT d."id", d."name", d."telemetry_token_hash", ${workerName} FROM ${quoted} d ${workerJoin}`,
    { type: QueryTypes.SELECT, transaction },
  );

  for (const row of rows) {
    const updates = {};
    if (!row.name) updates.name = row.worker_name || 'Digital employee';
    if (!row.telemetry_token_hash) {
      const token = crypto.randomBytes(32).toString('base64url');
      updates.telemetry_token_hash = crypto.createHash('sha256').update(token).digest('hex');
    }
    if (Object.keys(updates).length > 0) {
      await queryInterface.bulkUpdate(table, updates, { id: row.id }, { transaction });
    }
  }

  await queryInterface.changeColumn(table, 'name', { type: DataTypes.STRING(255), allowNull: false }, { transaction });
  await queryInterface.changeColumn(table, 'telemetry_token_hash', { type: DataTypes.STRING(64), allowNull: false }, { transaction });
  await queryInterface.changeColumn(table, 'status', { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'draft' }, { transaction });

  for (const legacyColumn of ['tool', 'workspace_id', 'oauth_token_encrypted']) {
    if (columns[legacyColumn]) await queryInterface.removeColumn(table, legacyColumn, { transaction });
  }
  await sequelize.query('DROP TYPE IF EXISTS "enum_Deployments_tool"', { transaction });
}

async function migrateLegacyUniversalSchema() {
  const queryInterface = sequelize.getQueryInterface();
  await sequelize.transaction(async (transaction) => {
    await migrateWorkerPermissions(queryInterface, transaction);
    await migrateDeployments(queryInterface, transaction);
  });
}

module.exports = migrateLegacyUniversalSchema;
