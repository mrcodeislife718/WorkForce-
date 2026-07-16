const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaskRun = sequelize.define('TaskRun', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  deployment_id: { type: DataTypes.UUID, allowNull: false },
  trigger_type: { type: DataTypes.STRING(100), allowNull: false },
  trigger_reference: { type: DataTypes.STRING(255), allowNull: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  status: {
    type: DataTypes.ENUM('queued', 'running', 'waiting_for_approval', 'completed', 'failed', 'cancelled', 'timed_out'),
    defaultValue: 'queued',
    allowNull: false,
  },
  priority: { type: DataTypes.INTEGER, defaultValue: 50, allowNull: false },
  started_at: { type: DataTypes.DATE, allowNull: true },
  completed_at: { type: DataTypes.DATE, allowNull: true },
  duration_ms: { type: DataTypes.BIGINT, allowNull: true },
  failure_reason: { type: DataTypes.TEXT, allowNull: true },
  input_summary: { type: DataTypes.TEXT, allowNull: true },
  output_summary: { type: DataTypes.TEXT, allowNull: true },
  human_minutes_used: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, allowNull: false },
  estimated_minutes_saved: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, allowNull: false },
}, {
  indexes: [
    { fields: ['deployment_id', 'createdAt'] },
    { fields: ['status'] },
  ],
});

module.exports = TaskRun;
