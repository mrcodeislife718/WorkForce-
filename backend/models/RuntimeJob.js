const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RuntimeJob = sequelize.define('RuntimeJob', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  deployment_id: { type: DataTypes.UUID, allowNull: true },
  sample_assignment_id: { type: DataTypes.UUID, allowNull: true },
  job_type: {
    type: DataTypes.ENUM('sample_assignment', 'deployment_task', 'health_check'),
    allowNull: false,
  },
  payload: { type: DataTypes.JSONB, defaultValue: {}, allowNull: false },
  status: {
    type: DataTypes.ENUM('queued', 'running', 'waiting_approval', 'completed', 'failed'),
    defaultValue: 'queued',
    allowNull: false,
  },
  attempt_count: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
  max_attempts: { type: DataTypes.INTEGER, defaultValue: 5, allowNull: false },
  run_after: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
  locked_at: { type: DataTypes.DATE, allowNull: true },
  locked_by: { type: DataTypes.STRING(255), allowNull: true },
  last_error: { type: DataTypes.TEXT, allowNull: true },
  result: { type: DataTypes.JSONB, allowNull: true },
  completed_at: { type: DataTypes.DATE, allowNull: true },
}, {
  indexes: [
    { fields: ['status', 'run_after'] },
    { fields: ['deployment_id'] },
    { fields: ['sample_assignment_id'] },
    { fields: ['locked_at'] },
  ],
});

module.exports = RuntimeJob;
