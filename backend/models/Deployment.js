const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Deployment = sequelize.define('Deployment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  worker_id: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(255), allowNull: false },
  workforce_level: {
    type: DataTypes.STRING(32),
    defaultValue: 'single',
    allowNull: false,
    validate: { isIn: [['single', 'team', 'department']] },
  },
  team_id: { type: DataTypes.UUID, allowNull: true },
  department_id: { type: DataTypes.UUID, allowNull: true },
  manager_deployment_id: { type: DataTypes.UUID, allowNull: true },
  status: {
    type: DataTypes.STRING(32),
    defaultValue: 'draft',
    allowNull: false,
    validate: { isIn: [['draft', 'validating', 'active', 'paused', 'degraded', 'failed', 'uninstalled']] },
  },
  runtime_configuration: { type: DataTypes.JSONB, defaultValue: {}, allowNull: false },
  availability_target: { type: DataTypes.STRING(20), defaultValue: '24/7/365', allowNull: false },
  telemetry_token_hash: { type: DataTypes.STRING(64), allowNull: false },
  installed_version: { type: DataTypes.STRING(64), allowNull: false, defaultValue: '1.0.0' },
  update_status: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: 'current',
    validate: { isIn: [['current', 'update_available', 'updating', 'update_failed']] },
  },
  deployed_at: { type: DataTypes.DATE, allowNull: true },
  paused_at: { type: DataTypes.DATE, allowNull: true },
  uninstalled_at: { type: DataTypes.DATE, allowNull: true },
  last_activity_at: { type: DataTypes.DATE, allowNull: true },
  last_health_check_at: { type: DataTypes.DATE, allowNull: true },
}, {
  indexes: [
    { fields: ['user_id'] },
    { fields: ['worker_id'] },
    { fields: ['status'] },
    { fields: ['team_id'] },
    { fields: ['department_id'] },
    { fields: ['update_status'] },
  ],
});

module.exports = Deployment;
