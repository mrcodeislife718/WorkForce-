const express = require('express');
const auth = require('../middleware/auth');
const deploymentTokenAuth = require('../middleware/deploymentTokenAuth');
const { Deployment, Worker, RuntimeJob, TaskRun } = require('../models');
const { hasEntitlement } = require('../services/billingService');

const router = express.Router();

function taskPayload(body) {
  const title = String(body.title || '').trim();
  const instructions = String(body.instructions || '').trim();
  if (title.length < 3) throw new Error('Task title must contain at least 3 characters.');
  if (instructions.length < 10) throw new Error('Task instructions must contain at least 10 characters.');
  return {
    title,
    instructions,
    trigger_type: body.trigger_type || 'external_event',
    trigger_reference: body.trigger_reference || null,
    priority: Number.isFinite(Number(body.priority)) ? Number(body.priority) : 50,
  };
}

async function enqueue(deployment, payload) {
  if (deployment.status !== 'active') {
    throw new Error('Digital employee deployment is not active.');
  }
  const worker = deployment.Worker || await Worker.findByPk(deployment.worker_id);
  if (!worker) throw new Error('Digital employee was not found.');
  const entitlement = await hasEntitlement(deployment.user_id, worker);
  if (!entitlement.entitled) {
    await deployment.update({ status: 'paused', paused_at: new Date() });
    throw new Error('Digital employee subscription is not active. The deployment was paused.');
  }
  return RuntimeJob.create({
    deployment_id: deployment.id,
    job_type: 'deployment_task',
    payload,
    status: 'queued',
    max_attempts: Number(process.env.RUNTIME_TASK_MAX_ATTEMPTS || 5),
    run_after: new Date(),
  });
}

router.post('/deployments/:deploymentId/tasks', deploymentTokenAuth, async (req, res) => {
  try {
    const deployment = await Deployment.findByPk(req.deployment.id, { include: [Worker] });
    const job = await enqueue(deployment, taskPayload(req.body));
    return res.status(202).json({ job_id: job.id, status: job.status });
  } catch (error) {
    return res.status(409).json({ error: error.message || 'Unable to queue task.' });
  }
});

router.post('/assign/:deploymentId', auth, async (req, res) => {
  try {
    const deployment = await Deployment.findOne({
      where: { id: req.params.deploymentId, user_id: req.user.id },
      include: [Worker],
    });
    if (!deployment) return res.status(404).json({ error: 'Deployment was not found.' });
    const job = await enqueue(deployment, { ...taskPayload(req.body), trigger_type: 'customer_assigned' });
    return res.status(202).json({ job_id: job.id, status: job.status });
  } catch (error) {
    return res.status(409).json({ error: error.message || 'Unable to queue task.' });
  }
});

router.get('/jobs/:id', auth, async (req, res) => {
  try {
    const job = await RuntimeJob.findByPk(req.params.id, {
      include: [{ model: Deployment }],
    });
    if (!job || job.Deployment?.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Runtime job was not found.' });
    }
    const taskRun = job.payload?.task_run_id ? await TaskRun.findByPk(job.payload.task_run_id) : null;
    return res.json({ job, task_run: taskRun });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load runtime job.' });
  }
});

module.exports = router;
