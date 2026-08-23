const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RuntimeCheckpoint = sequelize.define('RuntimeCheckpoint', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  deployment_id: { type: DataTypes.UUID, allowNull: false },
  task_run_id: { type: DataTypes.UUID, allowNull: false },
  runtime_job_id: { type: DataTypes.UUID, allowNull: false },
  trace_id: { type: DataTypes.UUID, allowNull: true },
  sequence: { type: DataTypes.INTEGER, allowNull: false },
  stage: { type: DataTypes.STRING(100), allowNull: false },
  next_action_index: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  state: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  status: {
    type: DataTypes.ENUM('active', 'superseded', 'restored', 'terminal'),
    allowNull: false,
    defaultValue: 'active',
  },
}, {
  indexes: [
    { fields: ['runtime_job_id', 'sequence'], unique: true },
    { fields: ['task_run_id', 'createdAt'] },
    { fields: ['deployment_id', 'createdAt'] },
    { fields: ['trace_id'] },
  ],
});

module.exports = RuntimeCheckpoint;
