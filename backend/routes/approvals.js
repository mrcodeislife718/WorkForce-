const express = require('express');
const auth = require('../middleware/auth');
const {
  ApprovalRequest,
  RuntimeJob,
  Deployment,
  Worker,
} = require('../models');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const approvals = await ApprovalRequest.findAll({
      where: { status: 'pending' },
      include: [{
        model: Deployment,
        where: { user_id: req.user.id },
        include: [Worker],
      }],
      order: [['requested_at', 'ASC']],
    });
    return res.json({ approvals });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load approval requests.' });
  }
});

router.post('/:id/approve', auth, async (req, res) => {
  try {
    const approval = await ApprovalRequest.findOne({
      where: { id: req.params.id, status: 'pending' },
      include: [{ model: Deployment, where: { user_id: req.user.id } }],
    });
    if (!approval) return res.status(404).json({ error: 'Approval request was not found.' });
    const job = await RuntimeJob.findOne({ where: { id: approval.runtime_job_id, status: 'waiting_approval' } });
    if (!job) return res.status(409).json({ error: 'Runtime job is no longer waiting for this approval.' });

    const actionIndex = Number(approval.requested_action?.index);
    const approvedIndices = new Set(job.payload?.approved_action_indices || []);
    approvedIndices.add(actionIndex);
    await approval.update({
      status: 'approved',
      decided_at: new Date(),
      decided_by_user_id: req.user.id,
    });
    await job.update({
      status: 'queued',
      run_after: new Date(),
      locked_at: null,
      locked_by: null,
      payload: { ...job.payload, approved_action_indices: [...approvedIndices] },
    });
    return res.json({ approved: true, runtime_job_id: job.id });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to approve action.' });
  }
});

router.post('/:id/deny', auth, async (req, res) => {
  try {
    const approval = await ApprovalRequest.findOne({
      where: { id: req.params.id, status: 'pending' },
      include: [{ model: Deployment, where: { user_id: req.user.id } }],
    });
    if (!approval) return res.status(404).json({ error: 'Approval request was not found.' });
    const job = await RuntimeJob.findByPk(approval.runtime_job_id);
    await approval.update({
      status: 'denied',
      decided_at: new Date(),
      decided_by_user_id: req.user.id,
    });
    if (job && job.status === 'waiting_approval') {
      await job.update({
        status: 'failed',
        last_error: String(req.body.reason || 'Customer denied the required action.').slice(0, 4000),
        completed_at: new Date(),
      });
    }
    return res.json({ denied: true });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to deny action.' });
  }
});

module.exports = router;
