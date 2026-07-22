const express = require('express');
const { Op } = require('sequelize');
const {
  Worker,
  WorkerPermission,
  WorkforceBundle,
  ConnectorDefinition,
} = require('../models');
const registry = require('../connectors/registerBuiltins')();
const { calculateLaunchPricing, calculateBundlePricing } = require('../services/catalogPricing');

const router = express.Router();
const MAX_RESULTS = 100;

function cleanList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()) : [];
}

function serializeWorker(worker) {
  const data = typeof worker.toJSON === 'function' ? worker.toJSON() : worker;
  const pricing = calculateLaunchPricing(data);
  return {
    ...data,
    skills: cleanList(data.skills),
    work_modes: cleanList(data.work_modes),
    pricing,
    base_price: pricing.orca_monthly_price,
  };
}

function serializeBundle(bundle) {
  const data = typeof bundle.toJSON === 'function' ? bundle.toJSON() : bundle;
  const members = (data.Members || []).map(serializeWorker);
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    type: data.bundle_type,
    description: data.description,
    department: data.department,
    human_authority_required: data.human_authority_required,
    version: data.version,
    release_notes: data.release_notes,
    hero_image_url: data.hero_image_url,
    members,
    member_count: members.length,
    pricing: calculateBundlePricing(members, data.launch_rate_percent),
  };
}

function serializeConnector(definition) {
  const data = typeof definition.toJSON === 'function' ? definition.toJSON() : definition;
  const adapterInstalled = registry.has(data.adapter_key);
  const available = data.status === 'active' && adapterInstalled;
  return {
    id: data.id,
    key: data.key,
    name: data.name,
    description: data.description,
    category: data.category,
    icon_key: data.key,
    documentation_url: data.documentation_url,
    native: data.is_native,
    adapter_installed: adapterInstalled,
    available,
    availability_label: available
      ? 'Available now'
      : data.status === 'not_configured'
        ? 'Requires provider configuration'
        : 'Unavailable',
  };
}

function workerWhere(query) {
  const where = { status: 'published' };
  const q = String(query.q || '').trim();
  const category = String(query.category || '').trim();
  const department = String(query.department || '').trim();

  if (category) where.category = category;
  if (department) where.department = { [Op.iLike]: department };
  if (q) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${q}%` } },
      { role_title: { [Op.iLike]: `%${q}%` } },
      { department: { [Op.iLike]: `%${q}%` } },
      { career_level: { [Op.iLike]: `%${q}%` } },
      { description: { [Op.iLike]: `%${q}%` } },
    ];
  }
  return where;
}

async function loadEmployees(query = {}) {
  const limit = Math.min(Math.max(Number(query.limit) || MAX_RESULTS, 1), MAX_RESULTS);
  const workers = await Worker.findAll({
    where: workerWhere(query),
    include: [{ model: WorkerPermission, required: false }],
    order: [
      ['total_deployments', 'DESC'],
      ['avg_rating', 'DESC'],
      ['name', 'ASC'],
    ],
    limit,
  });
  return workers.map(serializeWorker);
}

async function loadBundles(type) {
  const bundles = await WorkforceBundle.findAll({
    where: { status: 'published', bundle_type: type },
    include: [{
      model: Worker,
      as: 'Members',
      where: { status: 'published' },
      required: false,
      through: { attributes: ['position', 'role_label'] },
    }],
    order: [['name', 'ASC']],
  });
  return bundles.map(serializeBundle);
}

async function loadIntegrations() {
  const definitions = await ConnectorDefinition.findAll({
    where: { status: { [Op.in]: ['active', 'not_configured'] } },
    attributes: { exclude: ['configuration_schema'] },
    order: [['category', 'ASC'], ['name', 'ASC']],
  });
  return definitions.map(serializeConnector);
}

router.get('/catalog', async (req, res) => {
  try {
    const [employees, teams, departments, integrations] = await Promise.all([
      loadEmployees(req.query),
      loadBundles('team'),
      loadBundles('department'),
      loadIntegrations(),
    ]);

    return res.json({
      brand: {
        name: 'ORCA',
        headline: 'Powering the AI Workforce',
        company: 'Orcavenue Ventures',
        company_status: 'planned parent company',
      },
      navigation: [
        { key: 'employees', label: 'Digital Employees', href: '/store/employees', count: employees.length },
        { key: 'teams', label: 'Teams', href: '/store/teams', count: teams.length },
        { key: 'departments', label: 'Departments', href: '/store/departments', count: departments.length },
        { key: 'integrations', label: 'Works With Your Tools', href: '/store/integrations', count: integrations.length },
        { key: 'business', label: 'For Business', href: '/store/business' },
        { key: 'enterprise', label: 'Enterprise', href: '/store/enterprise' },
        { key: 'pricing', label: 'Pricing', href: '/store/pricing' },
      ],
      pricing_policy: {
        launch_rate_percent: 35,
        customer_savings_percent: 65,
        benchmark_basis: "the comparable human role's regular salary",
      },
      counts: {
        employees: employees.length,
        teams: teams.length,
        departments: departments.length,
        integrations: integrations.length,
      },
      employees,
      teams,
      departments,
      integrations,
    });
  } catch (error) {
    console.error('ORCA store catalog error:', error);
    return res.status(500).json({ error: 'Unable to load the ORCA Store catalog.' });
  }
});

router.get('/employees', async (req, res) => {
  try {
    return res.json(await loadEmployees(req.query));
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load digital employees.' });
  }
});

router.get('/bundles/:slug', async (req, res) => {
  try {
    const bundle = await WorkforceBundle.findOne({
      where: { slug: req.params.slug, status: 'published' },
      include: [{
        model: Worker,
        as: 'Members',
        where: { status: 'published' },
        required: false,
        through: { attributes: ['position', 'role_label'] },
      }],
    });
    if (!bundle) return res.status(404).json({ error: 'Workforce plan was not found.' });
    return res.json(serializeBundle(bundle));
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load the workforce plan.' });
  }
});

module.exports = {
  router,
  serializeWorker,
  serializeBundle,
};
