const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SampleAssignment = sequelize.define('SampleAssignment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  worker_id: { type: DataTypes.UUID, allowNull: false },
  interview_session_id: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false },
  instructions: { type: DataTypes.TEXT, allowNull: false },
  input_data: { type: DataTypes.JSONB, defaultValue: {}, allowNull: false },
  status: {
    type: DataTypes.ENUM('queued', 'running', 'completed', 'failed', 'reviewed'),
    defaultValue: 'queued',
    allowNull: false,
  },
  result: { type: DataTypes.JSONB, allowNull: true },
  model_provider: { type: DataTypes.STRING(120), allowNull: true },
  model_id: { type: DataTypes.STRING(255), allowNull: true },
  started_at: { type: DataTypes.DATE, allowNull: true },
  completed_at: { type: DataTypes.DATE, allowNull: true },
  failure_reason: { type: DataTypes.TEXT, allowNull: true },
  rating: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 5 } },
  feedback: { type: DataTypes.TEXT, allowNull: true },
  reviewed_at: { type: DataTypes.DATE, allowNull: true },
}, {
  indexes: [
    { fields: ['user_id', 'createdAt'] },
    { fields: ['worker_id'] },
    { fields: ['interview_session_id'] },
    { fields: ['status'] },
  ],
});

module.exports = SampleAssignment;
