const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConnectionSecret = sequelize.define('ConnectionSecret', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  workspace_connection_id: { type: DataTypes.UUID, allowNull: false },
  secret_type: { type: DataTypes.STRING(120), allowNull: false },
  encrypted_value: { type: DataTypes.TEXT, allowNull: false },
  encryption_iv: { type: DataTypes.STRING(64), allowNull: false },
  encryption_tag: { type: DataTypes.STRING(64), allowNull: false },
  key_version: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: true },
}, {
  indexes: [
    { fields: ['workspace_connection_id'] },
    { unique: true, fields: ['workspace_connection_id', 'secret_type'] },
  ],
});

module.exports = ConnectionSecret;
