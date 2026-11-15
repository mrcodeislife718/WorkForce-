const test = require('node:test');
const assert = require('node:assert/strict');
const { createRateLimiter, requestSecurity, validateProductionEnvironment } = require('../security/productionBoundary');

const validProduction = {
  NODE_ENV: 'production',
  JWT_SECRET: '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  ORCA_CREDENTIAL_ENCRYPTION_KEY: Buffer.alloc(32, 42).toString('base64'),
  CORS_ORIGINS: 'https://workforce.example.com',
  FRONTEND_URL: 'https://workforce.example.com',
  PUBLIC_API_URL: 'https://api.workforce.example.com',
  DATABASE_URL: 'postgresql://workforce@postgres.example.com:5432/workforce',
  DB_SSL: 'true',
};

test('production configuration requires real secrets and HTTPS on every trust boundary', () => {
  assert.doesNotThrow(() => validateProductionEnvironment(validProduction));
  assert.throws(() => validateProductionEnvironment({
    ...validProduction, JWT_SECRET: '',
  }), /JWT_SECRET/);
  assert.throws(() => validateProductionEnvironment({
    ...validProduction, ORCA_CREDENTIAL_ENCRYPTION_KEY: '123',
  }), /32-byte/);
  assert.throws(() => validateProductionEnvironment({
    ...validProduction, DB_SSL: 'false',
  }), /validated TLS/);
  assert.throws(() => validateProductionEnvironment({
    ...validProduction, CORS_ORIGINS: 'http://localhost:5173',
  }), /HTTPS origin/);
  assert.throws(() => validateProductionEnvironment({
    ...validProduction, PUBLIC_API_URL: 'http://api.workforce.example.com',
  }), /HTTPS origin/);
  assert.throws(() => validateProductionEnvironment({
    ...validProduction, DATABASE_URL: '',
  }), /PostgreSQL connection/);
});

test('rate limiter permits budget then returns HTTP 429', () => {
  const middleware = createRateLimiter({ windowMs: 60_000, max: 1 });
  const headers = {};
  const req = { ip: '203.0.113.10' };
  let statusCode = null;
  let body = null;
  const res = {
    setHeader(name, value) { headers[name] = value; },
    status(code) { statusCode = code; return this; },
    json(value) { body = value; return this; },
  };
  let calls = 0;
  middleware(req, res, () => { calls += 1; });
  assert.equal(calls, 1);
  assert.equal(headers['X-RateLimit-Remaining'], '0');
  middleware(req, res, () => { calls += 1; });
  assert.equal(calls, 1);
  assert.equal(statusCode, 429);
  assert.match(body.error, /Too many requests/);
});

test('request security adds a correlation id and hardening headers', () => {
  const headers = {};
  const req = { get() { return undefined; } };
  const res = { setHeader(name, value) { headers[name] = value; } };
  let called = false;
  requestSecurity(req, res, () => { called = true; });
  assert.equal(called, true);
  assert.ok(req.requestId);
  assert.equal(headers['X-Request-Id'], req.requestId);
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['X-Frame-Options'], 'DENY');
  assert.match(headers['Permissions-Policy'], /camera=\(\)/);
});

test('malformed user-controlled request IDs never enter response headers', () => {
  const headers = {};
  const req = { get() { return 'injected\\r\\nset-cookie: bad=1'; } };
  const res = { setHeader(key, value) { headers[key] = value; } };
  requestSecurity(req, res, () => {});
  assert.match(headers['X-Request-Id'], /^[a-f0-9-]{36}$/);
});
