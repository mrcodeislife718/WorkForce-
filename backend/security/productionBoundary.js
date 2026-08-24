const { randomUUID } = require('crypto');

function parsePositiveInteger(value, fallback, name) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer.`);
  return parsed;
}

function validateProductionEnvironment(env = process.env) {
  if (env.NODE_ENV !== 'production') return;
  const required = ['JWT_SECRET', 'CORS_ORIGINS'];
  for (const key of required) {
    if (!String(env[key] || '').trim()) throw new Error(`${key} must be configured in production.`);
  }
  const origins = String(env.CORS_ORIGINS).split(',').map((value) => value.trim()).filter(Boolean);
  if (!origins.length || origins.some((origin) => origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    throw new Error('CORS_ORIGINS must contain explicit non-local production origins.');
  }
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
  const requestId = typeof supplied === 'string' && supplied.length <= 128 ? supplied : randomUUID();
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
