const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkerPermission = sequelize.define('WorkerPermission', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  worker_id: { type: DataTypes.UUID, allowNull: false },
  tool: { type: DataTypes.ENUM('slack','gmail','shopify','notion','hubspot'), allowNull: false },
  scope: { type: DataTypes.STRING, allowNull: false },
  is_required: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});

module.exports = WorkerPermission;