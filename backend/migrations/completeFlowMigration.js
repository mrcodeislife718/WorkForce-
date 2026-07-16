const { DataTypes, QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

async function resolveTable(queryInterface, expected) {
  const tables = await queryInterface.showAllTables();
  const names = tables.map((table) => typeof table === 'string' ? table : table.tableName);
  return names.find((name) => String(name).toLowerCase() === expected.toLowerCase()) || null;
}

async function addColumnIfMissing(queryInterface, table, columns, name, definition, transaction) {
  if (!columns[name]) {
    await queryInterface.addColumn(table, name, definition, { transaction });
    columns[name] = definition;
  }
}

async function migrateWorkers(queryInterface, transaction) {
  const table = await resolveTable(queryInterface, 'Workers');
  if (!table) return;
  const columns = await queryInterface.describeTable(table);
  await addColumnIfMissing(queryInterface, table, columns, 'stripe_price_id', { type: DataTypes.STRING(255), allowNull: true }, transaction);
  await addColumnIfMissing(queryInterface, table, columns, 'interview_prompt', { type: DataTypes.TEXT, allowNull: true }, transaction);
  await addColumnIfMissing(queryInterface, table, columns, 'sample_prompt', { type: DataTypes.TEXT, allowNull: true }, transaction);
  await addColumnIfMissing(queryInterface, table, columns, 'runtime_prompt', { type: DataTypes.TEXT, allowNull: true }, transaction);
}

async function migrateDeployments(queryInterface, transaction) {
  const table = await resolveTable(queryInterface, 'Deployments');
  if (!table) return;
  const columns = await queryInterface.describeTable(table);
  await addColumnIfMissing(queryInterface, table, columns, 'installed_version', { type: DataTypes.STRING(64), allowNull: true }, transaction);
  await addColumnIfMissing(queryInterface, table, columns, 'update_status', { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'current' }, transaction);
  await addColumnIfMissing(queryInterface, table, columns, 'last_health_check_at', { type: DataTypes.DATE, allowNull: true }, transaction);

  const deployments = queryInterface.queryGenerator.quoteTable(table);
  const workersTable = await resolveTable(queryInterface, 'Workers');
  if (workersTable) {
    const workers = queryInterface.queryGenerator.quoteTable(workersTable);
    await sequelize.query(
      `UPDATE ${deployments} d SET "installed_version" = COALESCE(d."installed_version", w."version", '1.0.0') FROM ${workers} w WHERE w."id" = d."worker_id"`,
      { type: QueryTypes.UPDATE, transaction },
    );
  } else {
    await sequelize.query(
      `UPDATE ${deployments} SET "installed_version" = COALESCE("installed_version", '1.0.0')`,
      { type: QueryTypes.UPDATE, transaction },
    );
  }
  await queryInterface.changeColumn(table, 'installed_version', {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: '1.0.0',
  }, { transaction });
}

async function migrateCompleteFlowSchema() {
  const queryInterface = sequelize.getQueryInterface();
  await sequelize.transaction(async (transaction) => {
    await migrateWorkers(queryInterface, transaction);
    await migrateDeployments(queryInterface, transaction);
  });
}

module.exports = migrateCompleteFlowSchema;
