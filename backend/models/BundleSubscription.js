'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BundleSubscription = sequelize.define('BundleSubscription', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  workforce_bundle_id: { type: DataTypes.UUID, allowNull: false },
  provider: { type: DataTypes.STRING(20), defaultValue: 'stripe', allowNull: false },
  provider_customer_id: { type: DataTypes.STRING(255), allowNull: false },
  provider_subscription_id: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  status: { type: DataTypes.STRING(48), allowNull: false },
  worker_ids: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  price_ids: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  current_period_end: { type: DataTypes.DATE, allowNull: true },
  cancel_at_period_end: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
}, {
  indexes: [
    { fields: ['user_id', 'status'] },
    { fields: ['workforce_bundle_id'] },
    { fields: ['provider_customer_id'] },
  ],
});

module.exports = BundleSubscription;
