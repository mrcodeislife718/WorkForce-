const test = require('node:test');
const assert = require('node:assert/strict');
const { createRateLimiter, requestSecurity, validateProductionEnvironment } = require('../security/productionBoundary');

test('production configuration fails closed without explicit secrets and origins', () => {
  assert.throws(
    () => validateProductionEnvironment({ NODE_ENV: 'production', JWT_SECRET: '', CORS_ORIGINS: '' }),
    /JWT_SECRET must be configured/,
  );
  assert.throws(
    () => validateProductionEnvironment({ NODE_ENV: 'production', JWT_SECRET: 'secret', CORS_ORIGINS: 'http://localhost:5173' }),
    /non-local production origins/,
  );
  assert.doesNotThrow(() => validateProductionEnvironment({
    NODE_ENV: 'production',
    JWT_SECRET: 'secret',
    CORS_ORIGINS: 'https://workforce.example.com',
  }));
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
