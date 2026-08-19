const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OutcomeVerification = sequelize.define('OutcomeVerification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  deployment_id: { type: DataTypes.UUID, allowNull: false },
  task_run_id: { type: DataTypes.UUID, allowNull: false },
  trace_id: { type: DataTypes.UUID, allowNull: true },
  verifier_type: {
    type: DataTypes.ENUM('deterministic', 'customer', 'external', 'model'),
    allowNull: false,
    defaultValue: 'deterministic',
  },
  status: {
    type: DataTypes.ENUM('pending', 'verified', 'rejected', 'inconclusive'),
    allowNull: false,
    defaultValue: 'pending',
  },
  score: { type: DataTypes.DECIMAL(8, 6), allowNull: true },
  criteria: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  evidence: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  failure_reason: { type: DataTypes.TEXT, allowNull: true },
  verified_at: { type: DataTypes.DATE, allowNull: true },
}, {
  indexes: [
    { fields: ['deployment_id', 'createdAt'] },
    { fields: ['task_run_id'] },
    { fields: ['trace_id'] },
    { fields: ['status'] },
  ],
});

module.exports = OutcomeVerification;
