const crypto = require('crypto');
const { Deployment } = require('../models');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function safeEqual(left, right) {
  const a = Buffer.from(left || '', 'utf8');
  const b = Buffer.from(right || '', 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = async function deploymentTokenAuth(req, res, next) {
  try {
    const authorization = req.get('Authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Deployment token is required.' });
    const deploymentId = req.params.deploymentId || req.params.id;
    const deployment = await Deployment.findByPk(deploymentId);
    if (!deployment) return res.status(404).json({ error: 'Deployment was not found.' });
    if (!safeEqual(hashToken(token), deployment.telemetry_token_hash)) {
      return res.status(401).json({ error: 'Invalid deployment token.' });
    }
    if (deployment.status === 'uninstalled') {
      return res.status(410).json({ error: 'Deployment has been uninstalled.' });
    }
    req.deployment = deployment;
    return next();
  } catch (error) {
    return res.status(500).json({ error: 'Unable to authenticate deployment.' });
  }
};

module.exports.hashToken = hashToken;
module.exports.safeEqual = safeEqual;
