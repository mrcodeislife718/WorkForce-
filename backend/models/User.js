const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING },
  avatar_url: { type: DataTypes.STRING },
  connected_tools: { type: DataTypes.JSONB, defaultValue: {} },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});

module.exports = User;