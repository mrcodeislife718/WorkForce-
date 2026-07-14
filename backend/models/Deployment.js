const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Deployment = sequelize.define('Deployment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  worker_id: { type: DataTypes.UUID, allowNull: false },
  tool: { type: DataTypes.ENUM('slack','gmail','shopify','notion','hubspot'), allowNull: false },
  workspace_id: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('pending','active','paused','uninstalled'), defaultValue: 'pending' },
  oauth_token_encrypted: { type: DataTypes.TEXT },
  deployed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  last_activity_at: { type: DataTypes.DATE },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});

module.exports = Deployment;