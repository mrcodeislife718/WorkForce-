const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeploymentCapabilityGrant = sequelize.define('DeploymentCapabilityGrant', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  deployment_id: { type: DataTypes.UUID, allowNull: false },
  deployment_connection_id: { type: DataTypes.UUID, allowNull: false },
  capability_key: { type: DataTypes.STRING(160), allowNull: false },
  approved: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
  required: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
  approved_by_user_id: { type: DataTypes.UUID, allowNull: false },
  approved_at: { type: DataTypes.DATE, allowNull: true },
  constraints: { type: DataTypes.JSONB, defaultValue: {}, allowNull: false },
}, {
  indexes: [
    { unique: true, fields: ['deployment_id', 'capability_key'] },
    { fields: ['deployment_connection_id'] },
  ],
});

module.exports = DeploymentCapabilityGrant;
