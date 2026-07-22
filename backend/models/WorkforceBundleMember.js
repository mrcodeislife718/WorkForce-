const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkforceBundleMember = sequelize.define('WorkforceBundleMember', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  workforce_bundle_id: { type: DataTypes.UUID, allowNull: false },
  worker_id: { type: DataTypes.UUID, allowNull: false },
  position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  role_label: { type: DataTypes.STRING(180), allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  indexes: [
    { unique: true, fields: ['workforce_bundle_id', 'worker_id'] },
    { fields: ['position'] },
  ],
});

module.exports = WorkforceBundleMember;
