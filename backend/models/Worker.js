const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Worker = sequelize.define('Worker', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  developer_id: { type: DataTypes.UUID, allowNull: false },
  description: { type: DataTypes.TEXT },
  category: { type: DataTypes.ENUM('support','sales','admin','design','research'), allowNull: false },
  hero_banner_url: { type: DataTypes.STRING },
  icon_url: { type: DataTypes.STRING },
  avg_rating: { type: DataTypes.FLOAT, defaultValue: 0 },
  total_reviews: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_deployments: { type: DataTypes.INTEGER, defaultValue: 0 },
  price_model: { type: DataTypes.ENUM('subscription','one_time','free'), defaultValue: 'free' },
  base_price: { type: DataTypes.DECIMAL(10,2), defaultValue: 0.00 },
  version: { type: DataTypes.STRING, defaultValue: '1.0.0' },
  release_notes: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('draft','published','deprecated'), defaultValue: 'draft' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});

module.exports = Worker;