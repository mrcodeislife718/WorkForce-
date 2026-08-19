require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Op } = require('sequelize');
const sequelize = require('./config/database');
const { User, Worker, WorkerPermission, Deployment, Review } = require('./models');
const auth = require('./middleware/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const migrateLegacyUniversalSchema = require('./migrations/legacyUniversalMigration');
const migrateCompleteFlowSchema = require('./migrations/completeFlowMigration');
const migrateStoreCatalogSchema = require('./migrations/storeCatalogMigration');
const migrateMarketControlPlaneSchema = require('./migrations/marketControlPlaneMigration');

const connectorRoutes = require('./routes/connectors');
const connectionRoutes = require('./routes/connections');
const interviewRoutes = require('./routes/interviews');
const sampleAssignmentRoutes = require('./routes/sampleAssignments');
const deploymentRoutes = require('./routes/deployments');
const telemetryRoutes = require('./routes/telemetry');
const consoleRoutes = require('./routes/console');
const runtimeRoutes = require('./routes/runtime');
const approvalRoutes = require('./routes/approvals');
const controlPlaneRoutes = require('./routes/controlPlane');
const { router: billingRoutes, webhook: billingWebhook } = require('./routes/billing');
const { router: storeCatalogRoutes } = require('./routes/storeCatalog');
const { startRuntimeWorker, stopRuntimeWorker } = require('./runtime/JobRunner');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by ORCA.'));
  },
  credentials: true,
}));
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.post('/api/billing/webhook', express.raw({ type: 'application/json', limit: '1mb' }), billingWebhook);
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));

function signToken(user) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET must be configured.');
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '12h' });
}

app.get('/api/health', async (_req, res) => {
  try {
    await sequelize.authenticate();
    return res.json({ status: 'ok', service: 'orca-store-backend' });
  } catch (error) {
    return res.status(503).json({ status: 'error', service: 'orca-store-backend' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const name = String(req.body.name || '').trim();
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'A valid email is required.' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must contain at least 8 characters.' });
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password: hashed, name });
    return res.status(201).json({
      token: signToken(user),
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to create account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    return res.json({
      token: signToken(user),
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to sign in.' });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  return res.json({ user: { id: req.user.id, email: req.user.email, name: req.user.name } });
});

app.get('/api/store/top-deployed', async (_req, res) => {
  try {
    return res.json(await Worker.findAll({
      where: { status: 'published' },
      order: [['total_deployments', 'DESC']],
      limit: 10,
    }));
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load digital employees.' });
  }
});

app.get('/api/store/trending', async (_req, res) => {
  try {
    return res.json(await Worker.findAll({
      where: { status: 'published' },
      order: [['updatedAt', 'DESC']],
      limit: 10,
    }));
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load digital employees.' });
  }
});

app.get('/api/store/editors-choice', async (_req, res) => {
  try {
    return res.json(await Worker.findAll({
      where: { status: 'published' },
      limit: 3,
      order: sequelize.random(),
    }));
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load digital employees.' });
  }
});

app.get('/api/store/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const where = { status: 'published' };
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { role_title: { [Op.iLike]: `%${q}%` } },
        { department: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
      ];
    }
    return res.json(await Worker.findAll({ where, limit: 50 }));
  } catch (error) {
    return res.status(500).json({ error: 'Unable to search digital employees.' });
  }
});

app.get('/api/workers/:id', async (req, res) => {
  try {
    const worker = await Worker.findByPk(req.params.id, { include: [WorkerPermission] });
    if (!worker) return res.status(404).json({ error: 'Digital employee was not found.' });
    return res.json(worker);
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load digital employee.' });
  }
});

app.get('/api/workers/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.findAll({
      include: [{ model: Deployment, include: [User] }],
      where: { '$Deployment.worker_id$': req.params.id },
      limit: 20,
      order: [['createdAt', 'DESC']],
    });
    return res.json(reviews);
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load reviews.' });
  }
});

app.use('/api/store', storeCatalogRoutes);
app.use('/api/connectors', connectorRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/sample-assignments', sampleAssignmentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/runtime', runtimeRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/console', consoleRoutes);
app.use('/api/control-plane', controlPlaneRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  return res.status(500).json({ error: 'ORCA encountered an unexpected error.' });
});

async function prepareDatabase() {
  await sequelize.authenticate();
  if (process.env.RUN_LEGACY_MIGRATIONS !== 'false') {
    await migrateLegacyUniversalSchema();
    await migrateCompleteFlowSchema();
    await migrateStoreCatalogSchema();
    await migrateMarketControlPlaneSchema();
  }
  const syncMode = process.env.DB_SYNC_MODE || (process.env.NODE_ENV === 'production' ? 'none' : 'alter');
  if (syncMode === 'alter') await sequelize.sync({ alter: true });
  else if (syncMode === 'create') await sequelize.sync();
}

async function start() {
  await prepareDatabase();
  startRuntimeWorker();
  const port = Number(process.env.PORT || 5000);
  const server = app.listen(port, () => console.log(`ORCA backend running on port ${port}`));
  const shutdown = async () => {
    stopRuntimeWorker();
    server.close(async () => {
      await sequelize.close().catch(() => {});
      process.exit(0);
    });
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
  return server;
}

if (require.main === module) {
  start().catch((error) => {
    console.error('ORCA backend failed to start:', error);
    process.exit(1);
  });
}

module.exports = { app, start, prepareDatabase };
