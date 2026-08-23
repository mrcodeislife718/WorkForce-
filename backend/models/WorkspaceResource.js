const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkspaceResource = sequelize.define('WorkspaceResource', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  workspace_connection_id: { type: DataTypes.UUID, allowNull: false },
  external_id: { type: DataTypes.STRING(255), allowNull: false },
  resource_type: { type: DataTypes.STRING(100), allowNull: false },
  name: { type: DataTypes.STRING(255), allowNull: false },
  parent_external_id: { type: DataTypes.STRING(255), allowNull: true },
  metadata: { type: DataTypes.JSONB, defaultValue: {}, allowNull: false },
  is_selectable: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
  last_discovered_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
}, {
  indexes: [
    { unique: true, fields: ['workspace_connection_id', 'external_id', 'resource_type'] },
    { fields: ['workspace_connection_id'] },
  ],
});

module.exports = WorkspaceResource;
