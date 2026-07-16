const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkspaceConnection = sequelize.define('WorkspaceConnection', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  connector_definition_id: { type: DataTypes.UUID, allowNull: false },
  external_account_id: { type: DataTypes.STRING(255), allowNull: true },
  external_workspace_id: { type: DataTypes.STRING(255), allowNull: true },
  external_organization_id: { type: DataTypes.STRING(255), allowNull: true },
  account_name: { type: DataTypes.STRING(255), allowNull: true },
  workspace_name: { type: DataTypes.STRING(255), allowNull: false },
  workspace_domain: { type: DataTypes.STRING(255), allowNull: true },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'expired', 'revoked', 'error', 'disconnected'),
    defaultValue: 'pending',
    allowNull: false,
  },
  granted_scopes: { type: DataTypes.JSONB, defaultValue: [], allowNull: false },
  configuration: { type: DataTypes.JSONB, defaultValue: {}, allowNull: false },
  metadata: { type: DataTypes.JSONB, defaultValue: {}, allowNull: false },
  connected_at: { type: DataTypes.DATE, allowNull: true },
  last_verified_at: { type: DataTypes.DATE, allowNull: true },
  last_used_at: { type: DataTypes.DATE, allowNull: true },
  expires_at: { type: DataTypes.DATE, allowNull: true },
  last_error: { type: DataTypes.TEXT, allowNull: true },
}, {
  indexes: [
    { fields: ['user_id'] },
    { fields: ['connector_definition_id'] },
    { fields: ['external_workspace_id'] },
    { fields: ['status'] },
  ],
});

module.exports = WorkspaceConnection;
