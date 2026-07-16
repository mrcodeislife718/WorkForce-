const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeploymentConnection = sequelize.define('DeploymentConnection', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  deployment_id: { type: DataTypes.UUID, allowNull: false },
  workspace_connection_id: { type: DataTypes.UUID, allowNull: false },
  selected_resource_ids: { type: DataTypes.JSONB, defaultValue: [], allowNull: false },
  configuration: { type: DataTypes.JSONB, defaultValue: {}, allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'degraded', 'paused', 'removed'),
    defaultValue: 'pending',
    allowNull: false,
  },
  last_health_check_at: { type: DataTypes.DATE, allowNull: true },
}, {
  indexes: [
    { unique: true, fields: ['deployment_id', 'workspace_connection_id'] },
    { fields: ['workspace_connection_id'] },
  ],
});

module.exports = DeploymentConnection;
