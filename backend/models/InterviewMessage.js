const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InterviewMessage = sequelize.define('InterviewMessage', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  interview_session_id: { type: DataTypes.UUID, allowNull: false },
  role: {
    type: DataTypes.ENUM('customer', 'digital_employee', 'system'),
    allowNull: false,
  },
  content: { type: DataTypes.TEXT, allowNull: false },
  sequence_number: { type: DataTypes.INTEGER, allowNull: false },
  model_provider: { type: DataTypes.STRING(120), allowNull: true },
  model_id: { type: DataTypes.STRING(255), allowNull: true },
}, {
  indexes: [
    { unique: true, fields: ['interview_session_id', 'sequence_number'] },
    { fields: ['interview_session_id', 'createdAt'] },
  ],
});

module.exports = InterviewMessage;
