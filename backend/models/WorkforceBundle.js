const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkforceBundle = sequelize.define('WorkforceBundle', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(180), allowNull: false },
  bundle_type: {
    type: DataTypes.STRING(32),
    allowNull: false,
    validate: { isIn: [['team', 'department']] },
  },
  description: { type: DataTypes.TEXT, allowNull: false },
  department: { type: DataTypes.STRING(160), allowNull: true },
  status: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: 'draft',
    validate: { isIn: [['draft', 'published', 'deprecated']] },
  },
  human_authority_required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  launch_rate_percent: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 35 },
  version: { type: DataTypes.STRING(64), allowNull: false, defaultValue: '1.0.0' },
  release_notes: { type: DataTypes.TEXT, allowNull: true },
  hero_image_url: { type: DataTypes.STRING, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  indexes: [
    { fields: ['bundle_type'] },
    { fields: ['status'] },
    { fields: ['department'] },
  ],
});

module.exports = WorkforceBundle;
