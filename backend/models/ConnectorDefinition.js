const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConnectorDefinition = sequelize.define('ConnectorDefinition', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  key: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(160), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  category: { type: DataTypes.STRING(100), allowNull: false },
  auth_type: {
    type: DataTypes.ENUM('oauth2', 'api_key', 'bearer_token', 'basic_auth', 'webhook', 'custom'),
    allowNull: false,
  },
  adapter_key: { type: DataTypes.STRING(120), allowNull: false },
  status: {
    type: DataTypes.ENUM('active', 'not_configured', 'disabled', 'deprecated'),
    defaultValue: 'not_configured',
    allowNull: false,
  },
  is_native: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
  supports_workspace_discovery: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
  supports_resource_discovery: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
  supports_token_refresh: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
  capability_manifest: {
    type: DataTypes.JSONB,
    defaultValue: { schema_version: '1.0', capabilities: [] },
    allowNull: false,
  },
  configuration_schema: { type: DataTypes.JSONB, defaultValue: {}, allowNull: false },
  icon_url: { type: DataTypes.STRING, allowNull: true },
  documentation_url: { type: DataTypes.STRING, allowNull: true },
}, {
  indexes: [
    { fields: ['category'] },
    { fields: ['status'] },
    { fields: ['adapter_key'] },
  ],
});

module.exports = ConnectorDefinition;
