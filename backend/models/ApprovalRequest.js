const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApprovalRequest = sequelize.define('ApprovalRequest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  deployment_id: { type: DataTypes.UUID, allowNull: false },
  runtime_job_id: { type: DataTypes.UUID, allowNull: false },
  capability_key: { type: DataTypes.STRING(160), allowNull: false },
  requested_action: { type: DataTypes.JSONB, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'denied', 'expired'),
    defaultValue: 'pending',
    allowNull: false,
  },
  requested_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
  decided_at: { type: DataTypes.DATE, allowNull: true },
  decided_by_user_id: { type: DataTypes.UUID, allowNull: true },
}, {
  indexes: [
    { fields: ['deployment_id', 'status'] },
    { fields: ['runtime_job_id'] },
  ],
});

module.exports = ApprovalRequest;
