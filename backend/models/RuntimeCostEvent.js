const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RuntimeCostEvent = sequelize.define('RuntimeCostEvent', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  deployment_id: { type: DataTypes.UUID, allowNull: false },
  task_run_id: { type: DataTypes.UUID, allowNull: true },
  runtime_job_id: { type: DataTypes.UUID, allowNull: true },
  trace_id: { type: DataTypes.UUID, allowNull: true },
  source_type: {
    type: DataTypes.ENUM('model', 'capability', 'infrastructure', 'human'),
    allowNull: false,
  },
  source_key: { type: DataTypes.STRING(255), allowNull: false },
  provider: { type: DataTypes.STRING(120), allowNull: true },
  model_id: { type: DataTypes.STRING(255), allowNull: true },
  amount_usd: { type: DataTypes.DECIMAL(16, 8), allowNull: false, defaultValue: 0 },
  input_tokens: { type: DataTypes.BIGINT, allowNull: true },
  output_tokens: { type: DataTypes.BIGINT, allowNull: true },
  latency_ms: { type: DataTypes.BIGINT, allowNull: true },
  metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
}, {
  indexes: [
    { fields: ['deployment_id', 'createdAt'] },
    { fields: ['task_run_id'] },
    { fields: ['runtime_job_id'] },
    { fields: ['trace_id'] },
    { fields: ['source_type'] },
  ],
});

module.exports = RuntimeCostEvent;
