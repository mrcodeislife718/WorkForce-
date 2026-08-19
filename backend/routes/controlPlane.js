'use strict';

const express = require('express');
const auth = require('../middleware/auth');
const {
  Deployment,
  DeploymentEvent,
  RuntimeJob,
  TaskRun,
  RuntimeCostEvent,
  RuntimeCheckpoint,
  OutcomeVerification,
} = require('../models');
const { deploymentScorecard, workerScorecard } = require('../services/workforceScorecard');

const router = express.Router();

async function ownedDeployment(userId, deploymentId) {
  return Deployment.findOne({ where: { id: deploymentId, user_id: userId } });
}

async function ownedTask(userId, taskRunId) {
  return TaskRun.findOne({
    where: { id: taskRunId },
    include: [{ model: Deployment, where: { user_id: userId }, required: true }],
  });
}

async function recordControlEvent(deployment, eventType, message, metadata = {}) {
  return DeploymentEvent.create({
    deployment_id: deployment.id,
    event_type: eventType,
    severity: 'warning',
    message,
    metadata,
  });
}

router.get('/fleet', auth, async (req, res) => {
  try {
    const deployments = await Deployment.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    const scorecards = await Promise.all(deployments.map((deployment) => deploymentScorecard(deployment.id)));
    return res.json({ deployments, scorecards });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load workforce fleet.' });
  }
});

router.get('/workers/:workerId/scorecard', auth, async (req, res) => {
  try {
    const ownedCount = await Deployment.count({ where: { user_id: req.user.id, worker_id: req.params.workerId } });
    if (!ownedCount) return res.status(404).json({ error: 'No deployment for this digital employee was found.' });
    return res.json(await workerScorecard(req.params.workerId));
  } catch (error) {
    return res.status(500).json({ error: 'Unable to calculate digital employee scorecard.' });
  }
});

router.get('/deployments/:deploymentId/scorecard', auth, async (req, res) => {
  try {
    const deployment = await ownedDeployment(req.user.id, req.params.deploymentId);
    if (!deployment) return res.status(404).json({ error: 'Deployment was not found.' });
    return res.json(await deploymentScorecard(deployment.id));
  } catch (error) {
    return res.status(500).json({ error: 'Unable to calculate deployment scorecard.' });
  }
});

router.get('/tasks/:taskRunId/evidence', auth, async (req, res) => {
  try {
    const task = await ownedTask(req.user.id, req.params.taskRunId);
    if (!task) return res.status(404).json({ error: 'Task run was not found.' });
    const [costs, checkpoints, verifications, jobs] = await Promise.all([
      RuntimeCostEvent.findAll({ where: { task_run_id: task.id }, order: [['createdAt', 'ASC']] }),
      RuntimeCheckpoint.findAll({ where: { task_run_id: task.id }, order: [['sequence', 'ASC']] }),
      OutcomeVerification.findAll({ where: { task_run_id: task.id }, order: [['createdAt', 'ASC']] }),
      RuntimeJob.findAll({
        where: { deployment_id: task.deployment_id },
        order: [['createdAt', 'DESC']],
        limit: 50,
      }),
    ]);
    const relatedJobs = jobs.filter((job) => job.payload?.task_run_id === task.id);
    const totalCostUsd = costs.reduce((sum, event) => sum + Number(event.amount_usd || 0), 0);
    return res.json({
      task,
      trace_ids: [...new Set([
        ...costs.map((item) => item.trace_id),
        ...checkpoints.map((item) => item.trace_id),
        ...verifications.map((item) => item.trace_id),
      ].filter(Boolean))],
      economics: { total_cost_usd: Number(totalCostUsd.toFixed(6)) },
      costs,
      checkpoints,
      verifications,
      runtime_jobs: relatedJobs,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to reconstruct task evidence.' });
  }
});

router.post('/tasks/:taskRunId/verify', auth, async (req, res) => {
  try {
    const task = await ownedTask(req.user.id, req.params.taskRunId);
    if (!task) return res.status(404).json({ error: 'Task run was not found.' });
    const status = String(req.body.status || '').toLowerCase();
    if (!['verified', 'rejected', 'inconclusive'].includes(status)) {
      return res.status(400).json({ error: 'status must be verified, rejected, or inconclusive.' });
    }
    const scoreValue = req.body.score === undefined || req.body.score === null ? null : Number(req.body.score);
    if (scoreValue !== null && (!Number.isFinite(scoreValue) || scoreValue < 0 || scoreValue > 1)) {
      return res.status(400).json({ error: 'score must be between 0 and 1.' });
    }
    const traceId = String(req.body.trace_id || '').trim() || null;
    const verification = await OutcomeVerification.create({
      deployment_id: task.deployment_id,
      task_run_id: task.id,
      trace_id: traceId,
      verifier_type: 'customer',
      status,
      score: scoreValue,
      criteria: req.body.criteria && typeof req.body.criteria === 'object' ? req.body.criteria : {},
      evidence: req.body.evidence && typeof req.body.evidence === 'object' ? req.body.evidence : {},
      failure_reason: status === 'rejected' ? String(req.body.failure_reason || 'Customer rejected outcome.').slice(0, 4000) : null,
      verified_at: new Date(),
    });
    await DeploymentEvent.create({
      deployment_id: task.deployment_id,
      event_type: `task.customer_${status}`,
      severity: status === 'rejected' ? 'warning' : 'info',
      message: `Customer outcome verification recorded as ${status}.`,
      metadata: { task_run_id: task.id, verification_id: verification.id, trace_id: traceId },
    });
    return res.status(201).json(verification);
  } catch (error) {
    return res.status(500).json({ error: 'Unable to record customer outcome verification.' });
  }
});

router.post('/deployments/:deploymentId/pause', auth, async (req, res) => {
  try {
    const deployment = await ownedDeployment(req.user.id, req.params.deploymentId);
    if (!deployment) return res.status(404).json({ error: 'Deployment was not found.' });
    if (deployment.status === 'uninstalled') return res.status(409).json({ error: 'Uninstalled deployments cannot be paused.' });
    await deployment.update({ status: 'paused', paused_at: new Date() });
    await recordControlEvent(deployment, 'control.pause', 'Customer paused digital employee execution.', {
      reason: String(req.body.reason || 'manual_control').slice(0, 500),
    });
    return res.json({ deployment_id: deployment.id, status: deployment.status });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to pause deployment.' });
  }
});

router.post('/deployments/:deploymentId/resume', auth, async (req, res) => {
  try {
    const deployment = await ownedDeployment(req.user.id, req.params.deploymentId);
    if (!deployment) return res.status(404).json({ error: 'Deployment was not found.' });
    if (!['paused', 'degraded'].includes(deployment.status)) {
      return res.status(409).json({ error: 'Only paused or degraded deployments can be resumed.' });
    }
    const runtimeConfiguration = { ...(deployment.runtime_configuration || {}) };
    delete runtimeConfiguration.quarantined;
    delete runtimeConfiguration.quarantine_reason;
    await deployment.update({ status: 'active', paused_at: null, runtime_configuration: runtimeConfiguration });
    await recordControlEvent(deployment, 'control.resume', 'Customer resumed digital employee execution.');
    return res.json({ deployment_id: deployment.id, status: deployment.status });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to resume deployment.' });
  }
});

router.post('/deployments/:deploymentId/quarantine', auth, async (req, res) => {
  try {
    const deployment = await ownedDeployment(req.user.id, req.params.deploymentId);
    if (!deployment) return res.status(404).json({ error: 'Deployment was not found.' });
    if (deployment.status === 'uninstalled') return res.status(409).json({ error: 'Uninstalled deployments cannot be quarantined.' });
    const reason = String(req.body.reason || 'manual_quarantine').slice(0, 1000);
    const runtimeConfiguration = {
      ...(deployment.runtime_configuration || {}),
      quarantined: true,
      quarantine_reason: reason,
      quarantined_at: new Date().toISOString(),
    };
    await deployment.update({ status: 'paused', paused_at: new Date(), runtime_configuration: runtimeConfiguration });
    await RuntimeJob.update({
      status: 'failed',
      last_error: 'Deployment quarantined by customer control plane.',
      completed_at: new Date(),
      locked_at: null,
      locked_by: null,
    }, {
      where: { deployment_id: deployment.id, status: ['queued', 'running'] },
    });
    await TaskRun.update({ status: 'cancelled', failure_reason: 'Deployment quarantined by customer control plane.' }, {
      where: { deployment_id: deployment.id, status: ['queued', 'running', 'waiting_for_approval'] },
    });
    await recordControlEvent(deployment, 'control.quarantine', 'Customer quarantined digital employee execution.', { reason });
    return res.json({ deployment_id: deployment.id, status: deployment.status, quarantined: true });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to quarantine deployment.' });
  }
});

router.post('/fleet/emergency-stop', auth, async (req, res) => {
  try {
    const deployments = await Deployment.findAll({
      where: { user_id: req.user.id, status: ['active', 'degraded'] },
    });
    const reason = String(req.body.reason || 'fleet_emergency_stop').slice(0, 1000);
    for (const deployment of deployments) {
      const runtimeConfiguration = {
        ...(deployment.runtime_configuration || {}),
        quarantined: true,
        quarantine_reason: reason,
        quarantined_at: new Date().toISOString(),
      };
      await deployment.update({ status: 'paused', paused_at: new Date(), runtime_configuration: runtimeConfiguration });
      await RuntimeJob.update({
        status: 'failed',
        last_error: 'Fleet emergency stop activated.',
        completed_at: new Date(),
        locked_at: null,
        locked_by: null,
      }, { where: { deployment_id: deployment.id, status: ['queued', 'running'] } });
      await recordControlEvent(deployment, 'control.fleet_emergency_stop', 'Fleet emergency stop paused this deployment.', { reason });
    }
    return res.json({ stopped: deployments.length, reason });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to stop workforce fleet.' });
  }
});

module.exports = router;
