const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

async function tableNames(queryInterface) {
  const tables = await queryInterface.showAllTables();
  return new Set(tables.map((table) => String(typeof table === 'string' ? table : table.tableName).toLowerCase()));
}

async function createRuntimeCostEvents(queryInterface, transaction) {
  const names = await tableNames(queryInterface);
  if (names.has('runtimecostevents')) return;
  await queryInterface.createTable('RuntimeCostEvents', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    deployment_id: { type: DataTypes.UUID, allowNull: false },
    task_run_id: { type: DataTypes.UUID, allowNull: true },
    runtime_job_id: { type: DataTypes.UUID, allowNull: true },
    trace_id: { type: DataTypes.UUID, allowNull: true },
    source_type: { type: DataTypes.ENUM('model', 'capability', 'infrastructure', 'human'), allowNull: false },
    source_key: { type: DataTypes.STRING(255), allowNull: false },
    provider: { type: DataTypes.STRING(120), allowNull: true },
    model_id: { type: DataTypes.STRING(255), allowNull: true },
    amount_usd: { type: DataTypes.DECIMAL(16, 8), allowNull: false, defaultValue: 0 },
    input_tokens: { type: DataTypes.BIGINT, allowNull: true },
    output_tokens: { type: DataTypes.BIGINT, allowNull: true },
    latency_ms: { type: DataTypes.BIGINT, allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, { transaction });
  await queryInterface.addIndex('RuntimeCostEvents', ['deployment_id', 'createdAt'], { transaction });
  await queryInterface.addIndex('RuntimeCostEvents', ['task_run_id'], { transaction });
  await queryInterface.addIndex('RuntimeCostEvents', ['runtime_job_id'], { transaction });
  await queryInterface.addIndex('RuntimeCostEvents', ['trace_id'], { transaction });
}

async function createRuntimeCheckpoints(queryInterface, transaction) {
  const names = await tableNames(queryInterface);
  if (names.has('runtimecheckpoints')) return;
  await queryInterface.createTable('RuntimeCheckpoints', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    deployment_id: { type: DataTypes.UUID, allowNull: false },
    task_run_id: { type: DataTypes.UUID, allowNull: false },
    runtime_job_id: { type: DataTypes.UUID, allowNull: false },
    trace_id: { type: DataTypes.UUID, allowNull: true },
    sequence: { type: DataTypes.INTEGER, allowNull: false },
    stage: { type: DataTypes.STRING(100), allowNull: false },
    next_action_index: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    state: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    status: { type: DataTypes.ENUM('active', 'superseded', 'restored', 'terminal'), allowNull: false, defaultValue: 'active' },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, { transaction });
  await queryInterface.addIndex('RuntimeCheckpoints', ['runtime_job_id', 'sequence'], { unique: true, transaction });
  await queryInterface.addIndex('RuntimeCheckpoints', ['task_run_id', 'createdAt'], { transaction });
  await queryInterface.addIndex('RuntimeCheckpoints', ['trace_id'], { transaction });
}

async function createOutcomeVerifications(queryInterface, transaction) {
  const names = await tableNames(queryInterface);
  if (names.has('outcomeverifications')) return;
  await queryInterface.createTable('OutcomeVerifications', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    deployment_id: { type: DataTypes.UUID, allowNull: false },
    task_run_id: { type: DataTypes.UUID, allowNull: false },
    trace_id: { type: DataTypes.UUID, allowNull: true },
    verifier_type: { type: DataTypes.ENUM('deterministic', 'customer', 'external', 'model'), allowNull: false, defaultValue: 'deterministic' },
    status: { type: DataTypes.ENUM('pending', 'verified', 'rejected', 'inconclusive'), allowNull: false, defaultValue: 'pending' },
    score: { type: DataTypes.DECIMAL(8, 6), allowNull: true },
    criteria: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    evidence: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    failure_reason: { type: DataTypes.TEXT, allowNull: true },
    verified_at: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, { transaction });
  await queryInterface.addIndex('OutcomeVerifications', ['deployment_id', 'createdAt'], { transaction });
  await queryInterface.addIndex('OutcomeVerifications', ['task_run_id'], { transaction });
  await queryInterface.addIndex('OutcomeVerifications', ['trace_id'], { transaction });
  await queryInterface.addIndex('OutcomeVerifications', ['status'], { transaction });
}

async function migrateMarketControlPlaneSchema() {
  const queryInterface = sequelize.getQueryInterface();
  await sequelize.transaction(async (transaction) => {
    await createRuntimeCostEvents(queryInterface, transaction);
    await createRuntimeCheckpoints(queryInterface, transaction);
    await createOutcomeVerifications(queryInterface, transaction);
  });
}

module.exports = migrateMarketControlPlaneSchema;
