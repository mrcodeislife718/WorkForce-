const { randomUUID } = require('crypto');

function parsePositiveInteger(value, fallback, name) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer.`);
  return parsed;
}

function parseProductionHttpsOrigin(value, name) {
  let url;
  try { url = new URL(String(value || '')); } catch {
    throw new Error(name + ' must be an explicit HTTPS origin.');
  }
  if (url.protocol !== 'https:' || !url.hostname || ['localhost', '127.0.0.1'].includes(url.hostname)
    || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error(name + ' must be an explicit non-local HTTPS origin without paths or credentials.');
  }
  return url.origin;
}

function validateProductionEnvironment(env = process.env) {
  if (env.NODE_ENV !== 'production') return;
  if (String(env.JWT_SECRET || '').length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 random characters in production.');
  }
  if (Buffer.from(String(env.ORCA_CREDENTIAL_ENCRYPTION_KEY || ''), 'base64').length !== 32) {
    throw new Error('ORCA_CREDENTIAL_ENCRYPTION_KEY must be a base64-encoded 32-byte key in production.');
  }
  if (env.DB_SSL !== 'true' || env.DB_SSL_REJECT_UNAUTHORIZED === 'false') {
    throw new Error('Production database connections must use validated TLS (DB_SSL=true).');
  }
  if (!env.DATABASE_URL && ![env.DB_HOST, env.DB_USER, env.DB_NAME, env.DB_PASSWORD].every(Boolean)) {
    throw new Error('A real PostgreSQL connection must be configured in production.');
  }
  parseProductionHttpsOrigin(env.FRONTEND_URL, 'FRONTEND_URL');
  parseProductionHttpsOrigin(env.PUBLIC_API_URL, 'PUBLIC_API_URL');
  const origins = String(env.CORS_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
  if (!origins.length) throw new Error('CORS_ORIGINS must contain explicit non-local production origins.');
  for (const origin of origins) parseProductionHttpsOrigin(origin, 'CORS_ORIGINS');
}

function createRateLimiter({ windowMs = 60_000, max = 30 } = {}) {
  windowMs = parsePositiveInteger(windowMs, 60_000, 'rate limit window');
  max = parsePositiveInteger(max, 30, 'rate limit maximum');
  const buckets = new Map();
  return function rateLimit(req, res, next) {
    const now = Date.now();
    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    const remaining = Math.max(0, max - bucket.count);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > max) return res.status(429).json({ error: 'Too many requests. Try again later.' });
    return next();
  };
}

function requestSecurity(req, res, next) {
  const supplied = req.get?.('x-request-id');
  const requestId = typeof supplied === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(supplied) ? supplied : randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return next();
}

module.exports = {
  createRateLimiter,
  requestSecurity,
  validateProductionEnvironment,
};
