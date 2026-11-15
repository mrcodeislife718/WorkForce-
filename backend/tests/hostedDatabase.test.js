const test = require('node:test');
const assert = require('node:assert/strict');
const { databaseConfiguration } = require('../config/database');

const base = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://postgres.workforce:pa%40ss@db.example.net:5432/postgres',
  DB_SSL: 'true',
};

test('hosted PostgreSQL keeps full URL including encoded password with validated TLS', () => {
  const config = databaseConfiguration(base);
  assert.equal(config.databaseUrl, base.DATABASE_URL);
  assert.equal(config.options.dialect, 'postgres');
  assert.deepEqual(config.options.dialectOptions.ssl, { require: true, rejectUnauthorized: true });
});

test('production PostgreSQL refuses cleartext and disabled certificate verification', () => {
  assert.throws(() => databaseConfiguration({ ...base, DB_SSL: 'false' }), /DB_SSL=true/);
  assert.throws(() => databaseConfiguration({ ...base, DB_SSL_REJECT_UNAUTHORIZED: 'false' }), /verification cannot/);
  assert.throws(() => databaseConfiguration({ ...base, DATABASE_URL: base.DATABASE_URL + '?sslmode=disable' }), /must not disable/);
});

test('database URL rejects non-PostgreSQL URLs', () => {
  assert.throws(() => databaseConfiguration({ ...base, DATABASE_URL: 'https://example.org' }), /PostgreSQL URL/);
  assert.throws(() => databaseConfiguration({ ...base, DATABASE_URL: '@' }), /valid PostgreSQL/);
});

test('local PostgreSQL settings still work without DATABASE_URL', () => {
  const config = databaseConfiguration({
    NODE_ENV: 'test',
    DB_HOST: 'localhost', DB_PORT: '5432', DB_NAME: 'orca_ci',
    DB_USER: 'orca', DB_PASSWORD: 'test', DB_SSL: 'false',
  });
  assert.equal(config.databaseUrl, '');
  assert.equal(config.database, 'orca_ci');
  assert.equal(config.options.host, 'localhost');
  assert.equal(config.options.port, 5432);
  assert.deepEqual(config.options.dialectOptions, {});
});
