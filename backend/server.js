require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Op } = require('sequelize');
const sequelize = require('./config/database');
const { User, Worker, WorkerPermission, Deployment, Review } = require('./models');
const auth = require('./middleware/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();

// Middleware
app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self' http://localhost:5173 http://localhost:5000; connect-src 'self' http://localhost:5173 http://localhost:5000;");
  next();
});
app.use(express.json());

// ---------- AUTH (simple signup/login for testing) ----------
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, name });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user.id, email, name } });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user.id, email, name: user.name } });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---------- STORE FRONT (public) ----------
app.get('/api/store/top-deployed', async (req, res) => {
  const workers = await Worker.findAll({
    where: { status: 'published' },
    order: [['total_deployments', 'DESC']],
    limit: 10,
  });
  res.json(workers);
});

app.get('/api/store/trending', async (req, res) => {
  const workers = await Worker.findAll({
    where: { status: 'published' },
    order: [['updatedAt', 'DESC']],
    limit: 10,
  });
  res.json(workers);
});

app.get('/api/store/editors-choice', async (req, res) => {
  const workers = await Worker.findAll({
    where: { status: 'published' },
    limit: 3,
    order: sequelize.random(),
  });
  res.json(workers);
});

app.get('/api/store/search', async (req, res) => {
  const { q } = req.query;
  const workers = await Worker.findAll({
    where: {
      status: 'published',
      [Op.or]: [
        { name: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
      ],
    },
  });
  res.json(workers);
});

// ---------- WORKER DETAIL ----------
app.get('/api/workers/:id', async (req, res) => {
  const worker = await Worker.findByPk(req.params.id, {
    include: [WorkerPermission],
  });
  if (!worker) return res.status(404).json({ error: 'Worker not found' });
  res.json(worker);
});

app.get('/api/workers/:id/reviews', async (req, res) => {
  const reviews = await Review.findAll({
    include: [{ model: Deployment, include: [User] }],
    where: { '$Deployment.worker_id$': req.params.id },
    limit: 20,
    order: [['createdAt', 'DESC']],
  });
  res.json(reviews);
});

// ---------- DEPLOYMENTS (protected) ----------
app.post('/api/deployments/initiate', auth, async (req, res) => {
  const { worker_id, tool } = req.body;
  const deployment = await Deployment.create({
    user_id: req.user.id,
    worker_id,
    tool,
    status: 'active',
    workspace_id: 'test_workspace',
    oauth_token_encrypted: 'dummy_token',
  });
  await Worker.increment('total_deployments', { by: 1, where: { id: worker_id } });
  res.json(deployment);
});

app.get('/api/console/deployments', auth, async (req, res) => {
  const deployments = await Deployment.findAll({
    where: { user_id: req.user.id, status: { [Op.ne]: 'uninstalled' } },
    include: [Worker],
  });
  res.json(deployments);
});

app.delete('/api/deployments/:id', auth, async (req, res) => {
  const deployment = await Deployment.findOne({
    where: { id: req.params.id, user_id: req.user.id },
  });
  if (!deployment) return res.status(404).json({ error: 'Not found' });
  deployment.status = 'uninstalled';
  await deployment.save();
  res.json({ success: true });
});

// ---------- SYNC DATABASE & START SERVER ----------
sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced');
  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
  });
});