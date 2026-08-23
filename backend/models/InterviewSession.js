const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InterviewSession = sequelize.define('InterviewSession', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  worker_id: { type: DataTypes.UUID, allowNull: false },
  goal: { type: DataTypes.TEXT, allowNull: false },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'cancelled', 'failed'),
    defaultValue: 'active',
    allowNull: false,
  },
  summary: { type: DataTypes.TEXT, allowNull: true },
  model_provider: { type: DataTypes.STRING(120), allowNull: true },
  model_id: { type: DataTypes.STRING(255), allowNull: true },
  started_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
  completed_at: { type: DataTypes.DATE, allowNull: true },
}, {
  indexes: [
    { fields: ['user_id', 'createdAt'] },
    { fields: ['worker_id'] },
    { fields: ['status'] },
  ],
});

module.exports = InterviewSession;
