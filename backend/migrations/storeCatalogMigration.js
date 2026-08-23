const { DataTypes } = require('sequelize');
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

  const additions = {
    role_title: { type: DataTypes.STRING(180), allowNull: true },
    department: { type: DataTypes.STRING(160), allowNull: true },
    career_level: { type: DataTypes.STRING(100), allowNull: true },
    equivalent_experience_years: { type: DataTypes.INTEGER, allowNull: true },
    skills: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    work_modes: { type: DataTypes.JSONB, allowNull: false, defaultValue: ['support', 'coverage', 'role_fill'] },
    human_oversight: { type: DataTypes.TEXT, allowNull: true },
    support_summary: { type: DataTypes.TEXT, allowNull: true },
    regular_salary_annual: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    comparable_monthly_salary: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    avatar_variant: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    profile_image_url: { type: DataTypes.STRING, allowNull: true },
    developer_name: { type: DataTypes.STRING(160), allowNull: true },
    publisher_name: { type: DataTypes.STRING(160), allowNull: true, defaultValue: 'ORCA Studios' },
    publisher_type: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'first_party' },
    is_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_orca_certified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    evidence_status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'new' },
    product_type: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'individual' },
    readiness_state: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'defined' },
    verified_money_made: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    verified_money_saved: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    activation_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    included_workload: { type: DataTypes.TEXT, allowNull: true },
    supported_channels: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    supported_systems: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    integrations_included: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    execution_limits: { type: DataTypes.TEXT, allowNull: true },
    availability: { type: DataTypes.STRING(255), allowNull: true },
    support_level: { type: DataTypes.STRING(255), allowNull: true },
    protect_level: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'ORCA Protect Standard' },
    overage_pricing: { type: DataTypes.TEXT, allowNull: true },
    evaluation_options: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    team_roles: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  };

  for (const [name, definition] of Object.entries(additions)) {
    await addColumnIfMissing(queryInterface, table, columns, name, definition, transaction);
  }
}

async function createBundles(queryInterface, transaction) {
  const workersTable = await resolveTable(queryInterface, 'Workers');
  if (!workersTable) return;

  let bundlesTable = await resolveTable(queryInterface, 'WorkforceBundles');
  if (!bundlesTable) {
    bundlesTable = 'WorkforceBundles';
    await queryInterface.createTable(bundlesTable, {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(180), allowNull: false },
      bundle_type: { type: DataTypes.STRING(32), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      department: { type: DataTypes.STRING(160), allowNull: true },
      status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'draft' },
      human_authority_required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      launch_rate_percent: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 35 },
      version: { type: DataTypes.STRING(64), allowNull: false, defaultValue: '1.0.0' },
      release_notes: { type: DataTypes.TEXT, allowNull: true },
      hero_image_url: { type: DataTypes.STRING, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    }, { transaction });
    await queryInterface.addIndex(bundlesTable, ['bundle_type'], { transaction });
    await queryInterface.addIndex(bundlesTable, ['status'], { transaction });
  }

  const existingMembers = await resolveTable(queryInterface, 'WorkforceBundleMembers');
  if (!existingMembers) {
    await queryInterface.createTable('WorkforceBundleMembers', {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      workforce_bundle_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: bundlesTable, key: 'id' },
        onDelete: 'CASCADE',
      },
      worker_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: workersTable, key: 'id' },
        onDelete: 'CASCADE',
      },
      position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      role_label: { type: DataTypes.STRING(180), allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    }, { transaction });
    await queryInterface.addIndex('WorkforceBundleMembers', ['workforce_bundle_id', 'worker_id'], {
      unique: true,
      transaction,
    });
  }
}

async function migrateStoreCatalogSchema() {
  const queryInterface = sequelize.getQueryInterface();
  await sequelize.transaction(async (transaction) => {
    await migrateWorkers(queryInterface, transaction);
    await createBundles(queryInterface, transaction);
  });
}

module.exports = migrateStoreCatalogSchema;
