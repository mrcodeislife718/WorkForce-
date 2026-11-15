'use strict';

const express = require('express');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const { randomUUID } = require('node:crypto');
const { hasEntitlement } = require('../services/billingService');
const auth = require('../middleware/auth');
const {
  Deployment, Worker, RuntimeJob, TaskRun, OutcomeVerification, DeploymentEvent,
} = require('../models');
const { parseCustomerReview } = require('../services/customerReview');

const router = express.Router();
router.use(auth);

async function ownedJob(userId, id) {
  const job = await RuntimeJob.findOne({
    where: { id, job_type: 'deployment_task' },
    include: [{ model: Deployment, where: { user_id: userId }, required: true }],
  });
  return job;
}

router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await ownedJob(req.user.id, req.params.id);
    if (!job) return res.status(404).json({ error: 'Work assignment not found.' });
    const review = job.payload?.task_run_id
      ? await OutcomeVerification.findOne({
          where: { task_run_id: job.payload.task_run_id, verifier_type: 'customer' },
        })
      : null;
    return res.json({ review });
  } catch (_error) {
    return res.status(500).json({ error: 'Unable to load work review.' });
  }
});

router.post('/jobs/:id', async (req, res) => {
  let decision;
  try {
    decision = parseCustomerReview(req.body);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    const job = await ownedJob(req.user.id, req.params.id);
    if (!job) return res.status(404).json({ error: 'Work assignment not found.' });
    if (job.status !== 'completed' || !job.payload?.task_run_id) {
      return res.status(409).json({ error: 'Only delivered work can be reviewed.' });
    }

    const employee = await Worker.findByPk(job.Deployment.worker_id);
    const entitlement = employee ? await hasEntitlement(req.user.id, employee) : { entitled: false };
    const allowCorrection = decision.status === 'rejected'
      && job.Deployment.status === 'active'
      && !job.Deployment.runtime_configuration?.quarantined
      && entitlement.entitled;

    const completed = await sequelize.transaction(async (transaction) => {
      const task = await TaskRun.findOne({
        where: { id: job.payload.task_run_id, deployment_id: job.deployment_id, status: 'completed' },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!task) throw new Error('Completed task record was not found.');
      const where = { task_run_id: task.id, verifier_type: 'customer' };
      const data = {
        deployment_id: job.deployment_id,
        task_run_id: task.id,
        verifier_type: 'customer',
        status: decision.status,
        score: decision.rating ? decision.rating / 5 : null,
        criteria: { source: 'customer_work_review', version: 1 },
        evidence: {
          feedback: decision.feedback,
          work_summary: String(job.result?.summary || '').slice(0, 500),
          rating: decision.rating,
          customer_reported_minutes_saved: decision.customer_reported_minutes_saved,
          reviewed_by_user_id: req.user.id,
        },
        failure_reason: decision.status === 'rejected' ? decision.feedback : null,
        verified_at: new Date(),
      };
      const existing = await OutcomeVerification.findOne({ where, transaction });
      const outcome = existing
        ? await existing.update(data, { transaction })
        : await OutcomeVerification.create(data, { transaction });
      await task.update({
        estimated_minutes_saved: decision.customer_reported_minutes_saved ?? 0,
      }, { transaction });
      await DeploymentEvent.create({
        deployment_id: job.deployment_id,
        event_type: decision.status === 'verified' ? 'task.customer_accepted' : 'task.customer_rejected',
        severity: decision.status === 'verified' ? 'info' : 'warning',
        message: decision.status === 'verified'
          ? 'Customer accepted the delivered work.'
          : 'Customer requested corrections to delivered work.',
        metadata: { task_run_id: task.id, runtime_job_id: job.id, review_id: outcome.id },
      }, { transaction });
      let correctionJobId = null;
      if (allowCorrection) {
        // Locking the completed TaskRun above serializes review-and-requeue
        // against concurrent duplicate customer requests.
        const existingCorrection = await RuntimeJob.findOne({
          where: {
            deployment_id: job.deployment_id,
            job_type: 'deployment_task',
            payload: { [Op.contains]: { correction_of_job_id: job.id } },
          },
          transaction,
        });
        const repair = existingCorrection || await RuntimeJob.create({
          deployment_id: job.deployment_id,
          job_type: 'deployment_task',
          status: 'queued',
          run_after: new Date(),
          max_attempts: Number(process.env.RUNTIME_TASK_MAX_ATTEMPTS || 5),
          payload: {
            trace_id: randomUUID(),
            title: `Revision: ${String(job.payload?.title || 'Customer deliverable').slice(0, 230)}`,
            instructions: String(job.payload?.instructions || ''),
            priority: Number(job.payload?.priority || 50),
            trigger_type: 'customer_requested_revision',
            correction_of_job_id: job.id,
            customer_feedback: decision.feedback,
          },
        }, { transaction });
        correctionJobId = repair.id;
      }
      return { review: outcome, correction_job_id: correctionJobId };
    });

    return res.json(completed);
  } catch (error) {
    if (error.message === 'Completed task record was not found.') {
      return res.status(409).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Unable to save work review.' });
  }
});

module.exports = router;
