const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SupportTicket = sequelize.define('SupportTicket', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  category: {
    type: DataTypes.STRING(40), allowNull: false,
    validate: { isIn: [['billing', 'employee', 'assignment', 'other']] },
  },
  subject: { type: DataTypes.STRING(200), allowNull: false },
  status: {
    type: DataTypes.STRING(40), allowNull: false, defaultValue: 'open',
    validate: { isIn: [['open', 'in_progress', 'resolved']] },
  },
  messages: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
}, {
  indexes: [
    { fields: ['user_id', 'createdAt'] },
    { fields: ['status', 'createdAt'] },
  ],
});

module.exports = SupportTicket;
