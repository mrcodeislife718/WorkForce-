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

app.use(cors());
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' http://localhost:5173 http://localhost:5000; connect-src 'self' http://localhost:5173 http://localhost:5000; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';",
  );
  next();
});
app.use(express.json());

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, name });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    return res.json({ token, user: { id: user.id, email, name } });
  } catch (error) {
    return res.status(400).json({ error: error.message });
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
    return res.json({ token, user: { id: user.id, email, name: user.name } });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

const publishedWhere = { status: 'published' };

async function featuredDigitalEmployees(req, res, next) {
  try {
    const digitalEmployees = await Worker.findAll({
      where: publishedWhere,
      order: [['createdAt', 'ASC']],
      limit: 6,
    });
    return res.json(digitalEmployees);
  } catch (error) {
    return next(error);
  }
}

async function recommendedDigitalEmployees(req, res, next) {
  try {
    const digitalEmployees = await Worker.findAll({
      where: publishedWhere,
      order: [['category', 'ASC'], ['name', 'ASC']],
      limit: 6,
    });
    return res.json(digitalEmployees);
  } catch (error) {
    return next(error);
  }
}

async function popularBusinessFunctions(req, res, next) {
  try {
    const digitalEmployees = await Worker.findAll({
      where: publishedWhere,
      order: [['updatedAt', 'DESC'], ['name', 'ASC']],
      limit: 6,
    });
    return res.json(digitalEmployees);
  } catch (error) {
    return next(error);
  }
}

async function newDigitalEmployees(req, res, next) {
  try {
    const digitalEmployees = await Worker.findAll({
      where: publishedWhere,
      order: [['createdAt', 'DESC']],
      limit: 6,
    });
    return res.json(digitalEmployees);
  } catch (error) {
    return next(error);
  }
}

app.get('/api/store/featured', featuredDigitalEmployees);
app.get('/api/store/recommended', recommendedDigitalEmployees);
app.get('/api/store/popular-functions', popularBusinessFunctions);
app.get('/api/store/new-employees', newDigitalEmployees);

// Backward-compatible internal routes. Customer-facing surfaces use digital employee terminology.
app.get('/api/store/top-deployed', featuredDigitalEmployees);
app.get('/api/store/trending', popularBusinessFunctions);
app.get('/api/store/editors-choice', recommendedDigitalEmployees);

app.get('/api/store/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const category = String(req.query.category || '').trim();
    const where = { ...publishedWhere };

    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
        { publisher_name: { [Op.iLike]: `%${q}%` } },
      ];
    }

    if (category) where.category = category;

    const digitalEmployees = await Worker.findAll({
      where,
      order: [['name', 'ASC']],
      limit: 30,
    });
    return res.json(digitalEmployees);
  } catch (error) {
    return next(error);
  }
});

async function digitalEmployeeDetail(req, res, next) {
  try {
    const digitalEmployee = await Worker.findByPk(req.params.id, {
      include: [WorkerPermission],
    });
    if (!digitalEmployee) {
      return res.status(404).json({ error: 'Digital employee not found' });
    }
    return res.json(digitalEmployee);
  } catch (error) {
    return next(error);
  }
}

app.get('/api/digital-employees/:id', digitalEmployeeDetail);
app.get('/api/workers/:id', digitalEmployeeDetail);

async function digitalEmployeeReviews(req, res, next) {
  try {
    const reviews = await Review.findAll({
      include: [{ model: Deployment, include: [User] }],
      where: { '$Deployment.worker_id$': req.params.id },
      limit: 20,
      order: [['createdAt', 'DESC']],
    });
    return res.json(reviews);
  } catch (error) {
    return next(error);
  }
}

app.get('/api/digital-employees/:id/reviews', digitalEmployeeReviews);
app.get('/api/workers/:id/reviews', digitalEmployeeReviews);

app.post('/api/deployments/initiate', auth, async (req, res, next) => {
  try {
    const digitalEmployeeId = req.body.digital_employee_id || req.body.worker_id;
    const { tool, workspace_id: workspaceId } = req.body;

    if (!digitalEmployeeId || !tool) {
      return res.status(400).json({ error: 'Digital employee and deployment tool are required' });
    }

    const digitalEmployee = await Worker.findByPk(digitalEmployeeId);
    if (!digitalEmployee || digitalEmployee.status !== 'published') {
      return res.status(404).json({ error: 'Deployable digital employee not found' });
    }

    const deployment = await Deployment.create({
      user_id: req.user.id,
      worker_id: digitalEmployeeId,
      tool,
      status: 'pending',
      workspace_id: workspaceId || null,
      oauth_token_encrypted: null,
    });

    return res.status(201).json({
      id: deployment.id,
      digital_employee_id: digitalEmployeeId,
      status: deployment.status,
      tool: deployment.tool,
      message: 'Deployment request created. Payment, permission approval, and workspace connection must be completed before activation.',
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/console/deployments', auth, async (req, res, next) => {
  try {
    const deployments = await Deployment.findAll({
      where: { user_id: req.user.id, status: { [Op.ne]: 'uninstalled' } },
      include: [Worker],
    });
    return res.json(deployments);
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/deployments/:id', auth, async (req, res, next) => {
  try {
    const deployment = await Deployment.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!deployment) return res.status(404).json({ error: 'Deployment not found' });

    deployment.status = 'uninstalled';
    await deployment.save();
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  return res.status(500).json({ error: 'ORCA could not complete this request' });
});

sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced');
  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
  });
});
