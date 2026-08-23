const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CapabilityExecution = sequelize.define('CapabilityExecution', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  task_run_id: { type: DataTypes.UUID, allowNull: true },
  deployment_id: { type: DataTypes.UUID, allowNull: false },
  deployment_connection_id: { type: DataTypes.UUID, allowNull: false },
  capability_key: { type: DataTypes.STRING(160), allowNull: false },
  provider: { type: DataTypes.STRING(120), allowNull: false },
  external_workspace_id: { type: DataTypes.STRING(255), allowNull: true },
  resource_type: { type: DataTypes.STRING(100), allowNull: true },
  operation: { type: DataTypes.STRING(100), allowNull: false },
  status: {
    type: DataTypes.ENUM('running', 'succeeded', 'failed', 'denied'),
    defaultValue: 'running',
    allowNull: false,
  },
  started_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
  completed_at: { type: DataTypes.DATE, allowNull: true },
  duration_ms: { type: DataTypes.BIGINT, allowNull: true },
  records_read: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
  records_created: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
  records_updated: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
  records_deleted: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
  retry_count: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
  error_code: { type: DataTypes.STRING(120), allowNull: true },
  error_message_redacted: { type: DataTypes.TEXT, allowNull: true },
  metadata: { type: DataTypes.JSONB, defaultValue: {}, allowNull: false },
}, {
  indexes: [
    { fields: ['deployment_id', 'createdAt'] },
    { fields: ['task_run_id'] },
    { fields: ['capability_key'] },
    { fields: ['status'] },
  ],
});

module.exports = CapabilityExecution;
