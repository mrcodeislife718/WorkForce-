'use strict';

const { Sequelize } = require('sequelize');
require('dotenv').config();

function databaseConfiguration(env = process.env) {
  const databaseUrl = String(env.DATABASE_URL || '').trim();
  if (databaseUrl) {
    let parsed;
    try { parsed = new URL(databaseUrl); } catch {
      throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
    }
    if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !parsed.username || !parsed.hostname) {
      throw new Error('DATABASE_URL must be a PostgreSQL URL containing a database user and host.');
    }
    if (parsed.searchParams.get('sslmode') === 'disable') {
      throw new Error('DATABASE_URL must not disable transport encryption.');
    }
  }

  const useSsl = env.DB_SSL === 'true';
  if (env.NODE_ENV === 'production' && !useSsl) {
    throw new Error('DB_SSL=true is required for remote production PostgreSQL.');
  }
  if (env.NODE_ENV === 'production' && env.DB_SSL_REJECT_UNAUTHORIZED === 'false') {
    throw new Error('Production TLS certificate verification cannot be disabled.');
  }
  const optionalInteger = (key, fallback) => {
    const n = Number(env[key] || fallback);
    if (!Number.isInteger(n) || n < 0) throw new Error(key + ' must be a non-negative integer.');
    return n;
  };

  return {
    databaseUrl,
    database: env.DB_NAME,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    options: {
      host: env.DB_HOST,
      port: optionalInteger('DB_PORT', 5432),
      dialect: 'postgres',
      logging: env.DB_LOGGING === 'true' ? console.log : false,
      pool: {
        max: optionalInteger('DB_POOL_MAX', 10),
        min: optionalInteger('DB_POOL_MIN', 0),
        acquire: optionalInteger('DB_POOL_ACQUIRE_MS', 30000),
        idle: optionalInteger('DB_POOL_IDLE_MS', 10000),
      },
      dialectOptions: useSsl
        ? { ssl: { require: true, rejectUnauthorized: true } }
        : {},
    },
  };
}

const settings = databaseConfiguration();
const sequelize = settings.databaseUrl
  ? new Sequelize(settings.databaseUrl, settings.options)
  : new Sequelize(settings.database, settings.username, settings.password, settings.options);

module.exports = sequelize;
module.exports.databaseConfiguration = databaseConfiguration;
