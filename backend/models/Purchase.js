const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Purchase = sequelize.define('Purchase', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  worker_id: { type: DataTypes.UUID, allowNull: false },
  provider: { type: DataTypes.STRING(32), defaultValue: 'stripe', allowNull: false },
  provider_session_id: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  provider_payment_intent_id: { type: DataTypes.STRING(255), allowNull: true, unique: true },
  provider_customer_id: { type: DataTypes.STRING(255), allowNull: true },
  provider_price_id: { type: DataTypes.STRING(255), allowNull: true },
  amount_cents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  currency: { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'usd' },
  status: {
    type: DataTypes.STRING(32),
    validate: { isIn: [['pending', 'paid', 'partially_refunded', 'refunded', 'failed', 'disputed']] },
    allowNull: false,
    defaultValue: 'pending',
  },
  purchased_at: { type: DataTypes.DATE, allowNull: true },
  refunded_at: { type: DataTypes.DATE, allowNull: true },
  metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
}, {
  indexes: [
    { fields: ['user_id', 'worker_id'] },
    { fields: ['status'] },
    { fields: ['provider_customer_id'] },
  ],
});

module.exports = Purchase;
