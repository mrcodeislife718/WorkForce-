const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  worker_id: { type: DataTypes.UUID, allowNull: false },
  provider: {
    type: DataTypes.ENUM('stripe', 'free'),
    allowNull: false,
  },
  provider_customer_id: { type: DataTypes.STRING(255), allowNull: true },
  provider_subscription_id: { type: DataTypes.STRING(255), allowNull: true, unique: true },
  provider_price_id: { type: DataTypes.STRING(255), allowNull: true },
  status: {
    type: DataTypes.ENUM('pending', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired'),
    defaultValue: 'pending',
    allowNull: false,
  },
  current_period_end: { type: DataTypes.DATE, allowNull: true },
  cancel_at_period_end: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
  metadata: { type: DataTypes.JSONB, defaultValue: {}, allowNull: false },
}, {
  indexes: [
    { fields: ['user_id', 'worker_id'] },
    { fields: ['status'] },
    { fields: ['provider_customer_id'] },
  ],
});

module.exports = Subscription;
