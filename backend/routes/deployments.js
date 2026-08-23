const express = require('express');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const {
  Deployment,
  Worker,
  DeploymentConnection,
  WorkspaceConnection,
  ConnectorDefinition,
  DeploymentEvent,
} = require('../models');
const {
  getDigitalEmployeeRequirements,
  getCompatibleConnections,
} = require('../services/capabilityResolver');
const {
  assertDeploymentEligibility,
  createDeployment,
  loadDeployment,
  changeLifecycle,
  updateDeployment,
} = require('../services/deploymentService');

const router = express.Router();

router.get('/eligibility/:workerId', auth, async (req, res) => {
  try {
    const worker = await Worker.findOne({ where: { id: req.params.workerId, status: 'published' } });
    if (!worker) return res.status(404).json({ error: 'Digital employee was not found.' });
    const eligibility = await assertDeploymentEligibility(req.user.id, worker);
    return res.json({
      eligible: eligibility.eligible,
      blockers: eligibility.blockers,
      interview_id: eligibility.interview?.id || null,
      sample_assignment_id: eligibility.sample?.id || null,
      entitlement_reason: eligibility.entitlement.reason,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to check deployment eligibility.' });
  }
});

router.get('/prepare/:workerId', auth, async (req, res) => {
  try {
    const worker = await Worker.findOne({ where: { id: req.params.workerId, status: 'published' } });
    if (!worker) return res.status(404).json({ error: 'Digital employee was not found.' });
    const eligibility = await assertDeploymentEligibility(req.user.id, worker);
    const requirements = await getDigitalEmployeeRequirements(req.params.workerId);
    const compatibility = await getCompatibleConnections(req.user.id, req.params.workerId);
    return res.json({
      eligibility: {
        eligible: eligibility.eligible,
        blockers: eligibility.blockers,
        interview_id: eligibility.interview?.id || null,
        sample_assignment_id: eligibility.sample?.id || null,
        entitlement_reason: eligibility.entitlement.reason,
      },
      requirements,
      connections: compatibility.map((item) => ({
        connection: item.connection,
        satisfied_capabilities: item.satisfied_capabilities,
        can_satisfy_all_required: item.can_satisfy_all_required,
      })),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to prepare digital employee deployment.' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const deployments = await Deployment.findAll({
      where: { user_id: req.user.id, status: { [Op.ne]: 'uninstalled' } },
      attributes: { exclude: ['telemetry_token_hash'] },
      include: [
        { model: Worker },
        { model: DeploymentConnection, include: [{ model: WorkspaceConnection, include: [{ model: ConnectorDefinition }] }] },
      ],
      order: [['createdAt', 'DESC']],
    });
    for (const deployment of deployments) {
      if (deployment.Worker && deployment.installed_version !== deployment.Worker.version && deployment.update_status === 'current') {
        deployment.setDataValue('update_status', 'update_available');
      }
    }
    return res.json(deployments);
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load deployments.' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const deployment = await createDeployment({
      userId: req.user.id,
      workerId: req.body.worker_id,
      name: req.body.name,
      bindings: req.body.bindings,
      capabilityAssignments: req.body.capability_assignments,
    });
    return res.status(201).json({ deployment });
  } catch (error) {
    return res.status(409).json({
      error: error.message || 'Digital employee deployment failed.',
      details: error.details || [],
    });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const deployment = await loadDeployment(req.user.id, req.params.id);
    if (!deployment) return res.status(404).json({ error: 'Deployment was not found.' });
    if (deployment.Worker && deployment.installed_version !== deployment.Worker.version && deployment.update_status === 'current') {
      deployment.setDataValue('update_status', 'update_available');
    }
    const events = await DeploymentEvent.findAll({
      where: { deployment_id: deployment.id },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
    return res.json({ deployment, events });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load deployment.' });
  }
});

router.post('/:id/pause', auth, async (req, res) => {
  try {
    return res.json({ deployment: await changeLifecycle({ userId: req.user.id, deploymentId: req.params.id, action: 'pause' }) });
  } catch (error) {
    return res.status(409).json({ error: error.message, details: error.details || [] });
  }
});

router.post('/:id/resume', auth, async (req, res) => {
  try {
    return res.json({ deployment: await changeLifecycle({ userId: req.user.id, deploymentId: req.params.id, action: 'resume' }) });
  } catch (error) {
    return res.status(409).json({ error: error.message, details: error.details || [] });
  }
});

router.post('/:id/update', auth, async (req, res) => {
  try {
    return res.json({ deployment: await updateDeployment({ userId: req.user.id, deploymentId: req.params.id }) });
  } catch (error) {
    return res.status(409).json({ error: error.message, details: error.details || [] });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    return res.json({ deployment: await changeLifecycle({ userId: req.user.id, deploymentId: req.params.id, action: 'uninstall' }) });
  } catch (error) {
    return res.status(409).json({ error: error.message, details: error.details || [] });
  }
});

module.exports = router;
