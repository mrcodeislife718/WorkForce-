const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeploymentEvent = sequelize.define('DeploymentEvent', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  deployment_id: { type: DataTypes.UUID, allowNull: false },
  deployment_connection_id: { type: DataTypes.UUID, allowNull: true },
  event_type: { type: DataTypes.STRING(160), allowNull: false },
  severity: {
    type: DataTypes.ENUM('debug', 'info', 'warning', 'error', 'critical'),
    defaultValue: 'info',
    allowNull: false,
  },
  message: { type: DataTypes.TEXT, allowNull: false },
  metadata: { type: DataTypes.JSONB, defaultValue: {}, allowNull: false },
}, {
  indexes: [
    { fields: ['deployment_id', 'createdAt'] },
    { fields: ['deployment_connection_id'] },
    { fields: ['event_type'] },
  ],
});

module.exports = DeploymentEvent;
