'use strict';

const { Op } = require('sequelize');
const {
  User, Worker, WorkforceBundle, WorkforceBundleMember,
  BundleSubscription, Subscription, Purchase,
} = require('../models');

// Purchases are tied to the exact employee set sold at checkout.
// Editing a catalog bundle does not grant unpurchased additional employees.
function subscriptionEnd(subscription) {
  const ends = [
    subscription.current_period_end,
    ...(subscription.items?.data || []).map((item) => item.current_period_end),
  ].map(Number).filter((end) => Number.isSafeInteger(end) && end > 0);
  return ends.length ? new Date(Math.min(...ends) * 1000) : null;
}

function isBundleActive(row, now = new Date()) {
  return Boolean(row
    && ['active', 'trialing'].includes(row.status)
    && row.current_period_end
    && new Date(row.current_period_end) > now);
}

async function activeBundleEntitlement(userId, workerId) {
  const entries = await BundleSubscription.findAll({
    where: {
      user_id: userId,
      provider: 'stripe',
      status: { [Op.in]: ['active', 'trialing'] },
      current_period_end: { [Op.gt]: new Date() },
      worker_ids: { [Op.contains]: [workerId] },
    },
    order: [['updatedAt', 'DESC']],
    limit: 1,
  });
  return entries.find((row) => isBundleActive(row)) || null;
}

async function bundleWorkers(bundleId) {
  const memberships = await WorkforceBundleMember.findAll({
    where: { workforce_bundle_id: bundleId },
    include: [{ model: Worker }],
    order: [['position', 'ASC']],
  });
  if (memberships.length === 0 || memberships.some((member) => !member.Worker || member.Worker.status !== 'published')) {
    throw new Error('All workforce plan members must be published before monthly checkout.');
  }
  return memberships.map((entry) => entry.Worker);
}

async function createBundleCheckoutSession(userId, slug) {
  const { stripeClient, stripePriceId, assertStripePriceMatches, hasEntitlement } = require('./billingService');
  const bundle = await WorkforceBundle.findOne({ where: { slug, status: 'published' } });
  if (!bundle) throw new Error('Workforce team or department was not found.');
  const members = await bundleWorkers(bundle.id);
  const duplicate = await BundleSubscription.findOne({
    where: {
      user_id: userId,
      workforce_bundle_id: bundle.id,
      provider: 'stripe',
      status: { [Op.in]: ['active', 'trialing'] },
      current_period_end: { [Op.gt]: new Date() },
    },
  });
  if (duplicate) return { already_entitled: true, url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/console` };
  for (const member of members) {
    const right = await hasEntitlement(userId, member);
    if (right.entitled) {
      throw new Error('This plan includes an employee you already have. Manage the existing subscription before paying twice.');
    }
  }
  const stripe = stripeClient();
  const itemPrices = [];
  for (const member of members) {
    const priceId = stripePriceId(member);
    if (!priceId) throw new Error(`Monthly billing is not configured for ${member.name}.`);
    const price = await stripe.prices.retrieve(priceId);
    assertStripePriceMatches(member, price);
    itemPrices.push(priceId);
  }
  const user = await User.findByPk(userId);
  if (!user) throw new Error('Customer account was not found.');
  const existing = await Promise.all([
    Subscription.findOne({
      where: { user_id: userId, provider: 'stripe', provider_customer_id: { [Op.ne]: null } },
      order: [['createdAt', 'DESC']],
    }),
    BundleSubscription.findOne({
      where: { user_id: userId, provider: 'stripe' },
      order: [['createdAt', 'DESC']],
    }),
    Purchase.findOne({
      where: { user_id: userId, provider_customer_id: { [Op.ne]: null } },
      order: [['createdAt', 'DESC']],
    }),
  ]);
  let customerId = existing.find((entry) => entry?.provider_customer_id)?.provider_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: { orca_user_id: userId },
    }, { idempotencyKey: `workforce-customer-${userId}` });
    customerId = customer.id;
  }
  const metadata = {
    orca_user_id: userId,
    orca_bundle_id: bundle.id,
    orca_sale_type: 'bundle',
  };
  const front = process.env.FRONTEND_URL || 'http://localhost:5173';
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: itemPrices.map((price) => ({ price, quantity: 1 })),
    success_url: `${front}/purchase/bundle-success?slug=${encodeURIComponent(bundle.slug)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${front}/store/bundles/${encodeURIComponent(bundle.slug)}`,
    allow_promotion_codes: true,
    metadata,
    subscription_data: { metadata },
  });
  if (!session.url) throw new Error('Stripe did not create a monthly subscription checkout URL.');
  return { url: session.url, id: session.id, member_count: members.length, monthly_price: members.reduce((n, w) => n + Number(w.base_price), 0) };
}

async function persistStripeBundleSubscription(subscription, fallback = {}) {
  const { stripePriceId } = require('./billingService');
  const old = await BundleSubscription.findOne({ where: { provider_subscription_id: subscription.id } });
  const userId = subscription.metadata?.orca_user_id || old?.user_id || fallback.user_id;
  const bundleId = subscription.metadata?.orca_bundle_id || old?.workforce_bundle_id || fallback.bundle_id;
  if (!userId || !bundleId) throw new Error('Bundle subscription has no validated Workforce owner or plan.');
  const [owner, bundle] = await Promise.all([
    User.findByPk(userId),
    WorkforceBundle.findByPk(bundleId),
  ]);
  if (!owner || !bundle) throw new Error('Bundle subscription owner or plan no longer exists.');
  const workerSet = await bundleWorkers(bundle.id);
  const expected = workerSet.map((worker) => stripePriceId(worker));
  const actual = (subscription.items?.data || []).map((item) => ({
    priceId: item.price?.id,
    quantity: Number(item.quantity || 1),
  }));
  const valid = expected.every(Boolean)
    && expected.length === actual.length
    && actual.every((entry) => entry.quantity === 1)
    && JSON.stringify(expected.slice().sort()) === JSON.stringify(actual.map((entry) => entry.priceId).sort());
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  if (!customerId || !subscription.id) throw new Error('Stripe subscription identifiers are incomplete.');
  if (old && (old.user_id !== userId || old.workforce_bundle_id !== bundle.id || old.provider_customer_id !== customerId)) {
    throw new Error('A Stripe subscription cannot be reassigned to another customer or workforce plan.');
  }
  const values = {
    user_id: userId,
    workforce_bundle_id: bundle.id,
    provider: 'stripe',
    provider_customer_id: customerId,
    provider_subscription_id: subscription.id,
    // Changed recurring items revoke workforce privileges instead of silently
    // granting employees not actually covered by the current subscription.
    status: valid ? subscription.status : 'needs_reconciliation',
    worker_ids: valid ? workerSet.map((worker) => worker.id) : [],
    price_ids: actual.map((entry) => entry.priceId),
    current_period_end: subscriptionEnd(subscription),
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    metadata: {
      latest_invoice: typeof subscription.latest_invoice === 'string' ? subscription.latest_invoice : subscription.latest_invoice?.id || null,
      price_reconciliation_ok: valid,
    },
  };
  if (old) { await old.update(values); return old; }
  return BundleSubscription.create(values);
}

module.exports = {
  isBundleActive,
  activeBundleEntitlement,
  bundleWorkers,
  createBundleCheckoutSession,
  persistStripeBundleSubscription,
  subscriptionEnd,
};
