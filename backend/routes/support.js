const express = require('express');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const auth = require('../middleware/auth');
const { SupportTicket } = require('../models');
const { isSupportAdmin, parseTicket, parseReply } = require('../services/supportRules');

const router = express.Router();
router.use(auth);

router.get('/tickets', async (req, res) => {
  try {
    const tickets = await SupportTicket.findAll({
      where: { user_id: req.user.id },
      order: [['updatedAt', 'DESC']],
      limit: 100,
    });
    return res.json({ tickets });
  } catch (_error) {
    return res.status(500).json({ error: 'Unable to load support requests.' });
  }
});

router.post('/tickets', async (req, res) => {
  let data;
  try {
    data = parseTicket(req.body);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  try {
    const recent = await SupportTicket.count({
      where: {
        user_id: req.user.id,
        createdAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (recent >= 5) {
      return res.status(429).json({ error: 'Support request limit reached for today.' });
    }
    const ticket = await SupportTicket.create({
      user_id: req.user.id,
      category: data.category,
      subject: data.subject,
      status: 'open',
      messages: [{
        sender: 'customer',
        sender_id: req.user.id,
        body: data.message,
        at: new Date().toISOString(),
      }],
    });
    return res.status(201).json({ ticket });
  } catch (_error) {
    return res.status(500).json({ error: 'Unable to submit support request.' });
  }
});

router.get('/admin/tickets', async (req, res) => {
  if (!isSupportAdmin(req.user.id)) return res.status(403).json({ error: 'Support staff only.' });
  try {
    const tickets = await SupportTicket.findAll({
      order: [['updatedAt', 'DESC']],
      limit: 200,
    });
    return res.json({ tickets });
  } catch (_error) {
    return res.status(500).json({ error: 'Unable to load support queue.' });
  }
});

router.post('/tickets/:id/reply', async (req, res) => {
  let body;
  try {
    body = parseReply(req.body);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  const admin = isSupportAdmin(req.user.id);
  try {
    const ticket = await sequelize.transaction(async (transaction) => {
      const found = await SupportTicket.findByPk(req.params.id, {
        transaction, lock: transaction.LOCK.UPDATE,
      });
      if (!found || (!admin && found.user_id !== req.user.id)) return null;
      await found.update({
        status: found.status === 'resolved' ? 'open' : admin ? 'in_progress' : found.status,
        messages: [
          ...(Array.isArray(found.messages) ? found.messages : []),
          {
            sender: admin ? 'support' : 'customer',
            sender_id: req.user.id,
            body,
            at: new Date().toISOString(),
          },
        ],
      }, { transaction });
      return found;
    });
    if (!ticket) return res.status(404).json({ error: 'Support request not found.' });
    return res.json({ ticket });
  } catch (_error) {
    return res.status(500).json({ error: 'Unable to save support reply.' });
  }
});

router.post('/admin/tickets/:id/status', async (req, res) => {
  if (!isSupportAdmin(req.user.id)) return res.status(403).json({ error: 'Support staff only.' });
  if (!['open', 'in_progress', 'resolved'].includes(req.body.status)) {
    return res.status(400).json({ error: 'Unsupported support status.' });
  }
  try {
    const ticket = await SupportTicket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Support request not found.' });
    await ticket.update({ status: req.body.status });
    return res.json({ ticket });
  } catch (_error) {
    return res.status(500).json({ error: 'Unable to update support status.' });
  }
});

module.exports = router;
