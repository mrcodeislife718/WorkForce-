const express = require('express');
const auth = require('../middleware/auth');
const { Worker, Subscription, Purchase, BundleSubscription, WorkforceBundle } = require('../models');
const { createBundleCheckoutSession, isBundleActive } = require('../services/bundleBillingService');
const {
  stripeClient,
  stripePriceId,
  hasEntitlement,
  createCheckoutSession,
  handleStripeEvent,
} = require('../services/billingService');

const { ownedStripeCustomers, selectOwnedCustomer, publicInvoice } = require('../services/customerInvoices');

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

// One checkout subscribes to every published member of a team/department.
// No member is entitled until the signed Stripe event reconciles the exact
// recurring price set and records the customer-owned bundle subscription.
router.post('/bundle-checkout-session', auth, async (req, res) => {
  try {
    const slug = String(req.body?.slug || '').trim();
    if (!slug || slug.length > 160) return res.status(400).json({ error: 'Valid workforce plan slug required.' });
    return res.status(201).json(await createBundleCheckoutSession(req.user.id, slug));
  } catch (error) {
    return res.status(error.code === 'STRIPE_NOT_CONFIGURED' ? 503 : 409)
      .json({ error: error.message || 'Unable to subscribe to this workforce plan.' });
  }
});

router.get('/bundle/:slug/status', auth, async (req, res) => {
  try {
    const plan = await WorkforceBundle.findOne({ where: { slug: req.params.slug, status: 'published' } });
    if (!plan) return res.status(404).json({ error: 'Team or department was not found.' });
    const subscriptions = await BundleSubscription.findAll({
      where: { user_id: req.user.id, workforce_bundle_id: plan.id, provider: 'stripe' },
      order: [['updatedAt', 'DESC']],
      limit: 20,
    });
    const active = subscriptions.find((subscription) => isBundleActive(subscription));
    return res.json({
      bundle_id: plan.id,
      slug: plan.slug,
      entitled: Boolean(active),
      status: active?.status || subscriptions[0]?.status || 'subscription_required',
      subscribed_employee_ids: active?.worker_ids || [],
      current_period_end: active?.current_period_end || null,
    });
  } catch (_error) {
    return res.status(500).json({ error: 'Unable to check workforce subscription.' });
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
      purchase: entitlement.purchase || null,
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

// Read-only Billing invoice history. The Stripe customer ID is selected exclusively
// from records belonging to the authenticated Workforce customer.
router.get('/invoices', auth, async (req, res) => {
  try {
    const [subscriptions, purchases, bundleSubscriptions] = await Promise.all([
      Subscription.findAll({
        where: { user_id: req.user.id, provider: 'stripe' },
        attributes: ['provider', 'provider_customer_id'],
        order: [['createdAt', 'DESC']],
      }),
      Purchase.findAll({
        where: { user_id: req.user.id },
        attributes: ['provider_customer_id', 'createdAt'],
        order: [['createdAt', 'DESC']],
      }),
      BundleSubscription.findAll({
        where: { user_id: req.user.id, provider: 'stripe' },
        attributes: ['provider', 'provider_customer_id'],
        order: [['createdAt', 'DESC']],
      }),
    ]);
    // Purchases are Stripe-only in the current model. Mark their provider explicitly.
    const ids = ownedStripeCustomers([...subscriptions, ...bundleSubscriptions], purchases.map((purchase) => ({
      provider: 'stripe', provider_customer_id: purchase.provider_customer_id,
    })));
    const customerId = selectOwnedCustomer(ids, req.query.customer_id);
    if (!customerId) {
      return res.json({ invoices: [], customer_ids: [], customer_id: null, has_more: false, next_cursor: null });
    }
    const after = String(req.query.after || '');
    if (after && !/^in_[A-Za-z0-9]+$/.test(after)) {
      return res.status(400).json({ error: 'Invalid invoice cursor.' });
    }
    const page = await stripeClient().invoices.list({
      customer: customerId,
      limit: 25,
      ...(after ? { starting_after: after } : {}),
    });
    return res.json({
      invoices: page.data.map(publicInvoice),
      customer_ids: ids,
      customer_id: customerId,
      has_more: Boolean(page.has_more),
      next_cursor: page.has_more && page.data.length ? page.data[page.data.length - 1].id : null,
    });
  } catch (error) {
    if (error.status === 403) return res.status(403).json({ error: error.message });
    return res.status(503).json({ error: 'Unable to retrieve Stripe invoice history.' });
  }
});

router.get('/purchases', auth, async (req, res) => {
  try {
    const purchases = await Purchase.findAll({
      where: { user_id: req.user.id },
      include: [Worker],
      order: [['updatedAt', 'DESC']],
    });
    return res.json({ purchases });
  } catch (_error) {
    return res.status(500).json({ error: 'Unable to load purchases.' });
  }
});

router.post('/portal', auth, async (req, res) => {
  try {
    const [subscription, purchase, bundleSubscription] = await Promise.all([
      Subscription.findOne({
        where: { user_id: req.user.id, provider: 'stripe' },
        order: [['createdAt', 'DESC']],
      }),
      Purchase.findOne({
        where: { user_id: req.user.id, provider: 'stripe' },
        order: [['createdAt', 'DESC']],
      }),
      BundleSubscription.findOne({
        where: { user_id: req.user.id, provider: 'stripe' },
        order: [['createdAt', 'DESC']],
      }),
    ]);
    const customerId = subscription?.provider_customer_id || purchase?.provider_customer_id || bundleSubscription?.provider_customer_id;
    if (!customerId) return res.status(404).json({ error: 'No paid billing account is connected.' });
    const url = process.env.FRONTEND_URL || 'http://localhost:5173';
    const session = await stripeClient().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${url}/billing`,
    });
    return res.json({ url: session.url });
  } catch (_error) {
    return res.status(503).json({ error: 'Billing management is unavailable. Check payment provider configuration.' });
  }
});

module.exports = { router, webhook };
