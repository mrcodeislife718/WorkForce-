const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkerPermission = sequelize.define('WorkerPermission', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  worker_id: { type: DataTypes.UUID, allowNull: false },
  capability_key: { type: DataTypes.STRING(160), allowNull: false },
  name: { type: DataTypes.STRING(160), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  resource_type: { type: DataTypes.STRING(100), allowNull: false },
  action: {
    type: DataTypes.STRING(40),
    allowNull: false,
    validate: { isIn: [['read', 'create', 'update', 'delete', 'execute', 'subscribe']] },
  },
  risk_level: {
    type: DataTypes.STRING(20),
    defaultValue: 'low',
    allowNull: false,
    validate: { isIn: [['low', 'medium', 'high', 'critical']] },
  },
  is_required: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
  requires_human_approval: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
  constraints_schema: { type: DataTypes.JSONB, defaultValue: {}, allowNull: false },
}, {
  indexes: [
    { unique: true, fields: ['worker_id', 'capability_key'] },
  ],
});

module.exports = WorkerPermission;
