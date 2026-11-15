'use strict';

const express = require('express');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const {
  Deployment, TaskRun, OutcomeVerification, RuntimeCostEvent, Purchase, Subscription,
} = require('../models');
const { summarizeCustomerEconomics } = require('../services/economicMeasures');
const router = express.Router();

router.get('/mine', auth, async (req, res) => {
  try {
    const deployments = await Deployment.findAll({
      where: { user_id: req.user.id },
      attributes: ['id'],
    });
    const deploymentIds = deployments.map((item) => item.id);
    const taskWhere = { deployment_id: { [Op.in]: deploymentIds } };
    const outcomeWhere = { ...taskWhere, verifier_type: 'customer' };
    const [
      deliveredTasks, acceptedTasks, rejectedTasks,
      reportedMinutesSaved, recordedCostUsd, purchases, activeSubscriptions,
    ] = await Promise.all([
      TaskRun.count({ where: { ...taskWhere, status: 'completed' } }),
      OutcomeVerification.count({ where: { ...outcomeWhere, status: 'verified' } }),
      OutcomeVerification.count({ where: { ...outcomeWhere, status: 'rejected' } }),
      TaskRun.sum('estimated_minutes_saved', { where: taskWhere }),
      RuntimeCostEvent.sum('amount_usd', { where: taskWhere }),
      Purchase.findAll({
        where: { user_id: req.user.id },
        attributes: ['status', 'amount_cents', 'metadata'],
      }),
      Subscription.count({
        where: {
          user_id: req.user.id,
          status: { [Op.in]: ['active', 'trialing'] },
          [Op.or]: [
            { current_period_end: null },
            { current_period_end: { [Op.gt]: new Date() } },
          ],
        },
      }),
    ]);
    return res.json(summarizeCustomerEconomics({
      deliveredTasks, acceptedTasks, rejectedTasks,
      reportedMinutesSaved: reportedMinutesSaved || 0,
      recordedCostUsd: recordedCostUsd || 0,
      purchases,
      activeSubscriptions,
    }));
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load measured workforce economics.' });
  }
});

module.exports = router;
