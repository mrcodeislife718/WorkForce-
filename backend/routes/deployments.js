const express = require('express');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const {
  Deployment,
  Worker,
  DeploymentConnection,
  WorkspaceConnection,
  ConnectorDefinition,
  DeploymentCapabilityGrant,
  DeploymentEvent,
} = require('../models');
const {
  getDigitalEmployeeRequirements,
  getCompatibleConnections,
} = require('../services/capabilityResolver');
const {
  createDeployment,
  loadDeployment,
  changeLifecycle,
} = require('../services/deploymentService');

const router = express.Router();

router.get('/prepare/:workerId', auth, async (req, res) => {
  try {
    const requirements = await getDigitalEmployeeRequirements(req.params.workerId);
    const compatibility = await getCompatibleConnections(req.user.id, req.params.workerId);
    return res.json({
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
      where: {
        user_id: req.user.id,
        status: { [Op.ne]: 'uninstalled' },
      },
      attributes: { exclude: ['telemetry_token_hash'] },
      include: [
        { model: Worker },
        {
          model: DeploymentConnection,
          include: [{ model: WorkspaceConnection, include: [{ model: ConnectorDefinition }] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
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
    const deployment = await changeLifecycle({
      userId: req.user.id,
      deploymentId: req.params.id,
      action: 'pause',
    });
    return res.json({ deployment });
  } catch (error) {
    return res.status(409).json({ error: error.message, details: error.details || [] });
  }
});

router.post('/:id/resume', auth, async (req, res) => {
  try {
    const deployment = await changeLifecycle({
      userId: req.user.id,
      deploymentId: req.params.id,
      action: 'resume',
    });
    return res.json({ deployment });
  } catch (error) {
    return res.status(409).json({ error: error.message, details: error.details || [] });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const deployment = await changeLifecycle({
      userId: req.user.id,
      deploymentId: req.params.id,
      action: 'uninstall',
    });
    return res.json({ deployment });
  } catch (error) {
    return res.status(409).json({ error: error.message, details: error.details || [] });
  }
});

module.exports = router;
