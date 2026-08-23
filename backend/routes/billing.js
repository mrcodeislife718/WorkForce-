const express = require('express');
const auth = require('../middleware/auth');
const { Worker, Subscription } = require('../models');
const {
  stripeClient,
  stripePriceId,
  hasEntitlement,
  createCheckoutSession,
  handleStripeEvent,
} = require('../services/billingService');

const router = express.Router();

async function webhook(req, res) {
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(503).json({ error: 'Stripe webhook verification is not configured.' });
    }
    const signature = req.get('stripe-signature');
    if (!signature) return res.status(400).json({ error: 'Stripe signature is required.' });
    const event = stripeClient().webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    await handleStripeEvent(event);
    return res.json({ received: true });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Stripe webhook verification failed.' });
  }
}

router.post('/checkout-session', auth, async (req, res) => {
  try {
    return res.status(201).json(await createCheckoutSession(req.user.id, req.body.worker_id));
  } catch (error) {
    const status = error.code === 'STRIPE_NOT_CONFIGURED' ? 503 : 409;
    return res.status(status).json({ error: error.message || 'Unable to create checkout session.' });
  }
});

router.get('/worker/:workerId/status', auth, async (req, res) => {
  try {
    const worker = await Worker.findOne({ where: { id: req.params.workerId, status: 'published' } });
    if (!worker) return res.status(404).json({ error: 'Digital employee was not found.' });
    const entitlement = await hasEntitlement(req.user.id, worker);
    return res.json({
      worker_id: worker.id,
      price_model: worker.price_model,
      base_price: worker.base_price,
      stripe_price_configured: Boolean(stripePriceId(worker)),
      entitled: entitlement.entitled,
      reason: entitlement.reason,
      subscription: entitlement.subscription || null,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load billing status.' });
  }
});

router.get('/subscriptions', auth, async (req, res) => {
  try {
    const subscriptions = await Subscription.findAll({
      where: { user_id: req.user.id },
      include: [Worker],
      order: [['updatedAt', 'DESC']],
    });
    return res.json({ subscriptions });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load subscriptions.' });
  }
});

module.exports = { router, webhook };
