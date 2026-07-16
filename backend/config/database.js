const { Sequelize } = require('sequelize');
require('dotenv').config();

const useSsl = process.env.DB_SSL === 'true';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    dialect: 'postgres',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    pool: {
      max: Number(process.env.DB_POOL_MAX || 10),
      min: Number(process.env.DB_POOL_MIN || 0),
      acquire: Number(process.env.DB_POOL_ACQUIRE_MS || 30000),
      idle: Number(process.env.DB_POOL_IDLE_MS || 10000),
    },
    dialectOptions: useSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
          },
        }
      : {},
  },
);

module.exports = sequelize;
