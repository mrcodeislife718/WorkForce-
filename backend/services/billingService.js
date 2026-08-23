const { Op } = require('sequelize');
const Stripe = require('stripe');
const {
  User,
  Worker,
  InterviewSession,
  SampleAssignment,
  Subscription,
} = require('../models');

const PRICE_ENV_BY_WORKER = {
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa': 'STRIPE_PRICE_CUSTOMER_SUPPORT',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb': 'STRIPE_PRICE_FOUNDER_ASSISTANT',
  'cccccccc-cccc-cccc-cccc-cccccccccccc': 'STRIPE_PRICE_COMMERCE_SUPPORT',
  'dddddddd-dddd-dddd-dddd-dddddddddddd': 'STRIPE_PRICE_SALES_FOLLOW_UP',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee': 'STRIPE_PRICE_CONTENT_PRODUCTION',
};

function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    const error = new Error('Stripe billing is not configured.');
    error.code = 'STRIPE_NOT_CONFIGURED';
    throw error;
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function stripePriceId(worker) {
  return worker.stripe_price_id || process.env[PRICE_ENV_BY_WORKER[worker.id]] || null;
}

async function activeSubscription(userId, workerId) {
  return Subscription.findOne({
    where: {
      user_id: userId,
      worker_id: workerId,
      status: { [Op.in]: ['active', 'trialing'] },
      [Op.or]: [
        { current_period_end: null },
        { current_period_end: { [Op.gt]: new Date() } },
      ],
    },
    order: [['updatedAt', 'DESC']],
  });
}

async function hasEntitlement(userId, worker) {
  if (worker.price_model === 'free') return { entitled: true, reason: 'free' };
  const subscription = await activeSubscription(userId, worker.id);
  return { entitled: Boolean(subscription), reason: subscription ? subscription.status : 'subscription_required', subscription };
}

async function assertPurchaseEligibility(userId, workerId) {
  const interview = await InterviewSession.findOne({
    where: { user_id: userId, worker_id: workerId, status: 'completed' },
    order: [['completed_at', 'DESC']],
  });
  if (!interview) throw new Error('Complete the interview before purchasing this digital employee.');
  const sample = await SampleAssignment.findOne({
    where: { user_id: userId, worker_id: workerId, status: 'reviewed' },
    order: [['reviewed_at', 'DESC']],
  });
  if (!sample) throw new Error('Complete and review sample work before purchasing this digital employee.');
  return { interview, sample };
}

async function createCheckoutSession(userId, workerId) {
  const worker = await Worker.findOne({ where: { id: workerId, status: 'published' } });
  if (!worker) throw new Error('Digital employee was not found.');
  if (worker.price_model === 'free') {
    return { free: true, url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/deploy/${worker.id}` };
  }
  if (worker.price_model !== 'subscription') throw new Error('This purchase model is not configured for checkout yet.');
  const priceId = stripePriceId(worker);
  if (!priceId) throw new Error('This digital employee does not have a real Stripe price configured.');
  await assertPurchaseEligibility(userId, workerId);

  const existing = await activeSubscription(userId, workerId);
  if (existing) {
    return { already_entitled: true, url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/deploy/${worker.id}` };
  }

  const user = await User.findByPk(userId);
  const previous = await Subscription.findOne({
    where: { user_id: userId, provider: 'stripe', provider_customer_id: { [Op.ne]: null } },
    order: [['createdAt', 'DESC']],
  });
  const stripe = stripeClient();
  let customerId = previous?.provider_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: { orca_user_id: user.id },
    });
    customerId = customer.id;
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${frontendUrl}/purchase/success?worker_id=${worker.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/worker/${worker.id}`,
    allow_promotion_codes: true,
    metadata: { orca_user_id: user.id, orca_worker_id: worker.id },
    subscription_data: { metadata: { orca_user_id: user.id, orca_worker_id: worker.id } },
  });

  await Subscription.create({
    user_id: user.id,
    worker_id: worker.id,
    provider: 'stripe',
    provider_customer_id: customerId,
    provider_price_id: priceId,
    status: 'pending',
    metadata: { checkout_session_id: session.id },
  });
  return { id: session.id, url: session.url };
}

function subscriptionPeriodEnd(subscription) {
  return subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;
}

async function persistStripeSubscription(stripeSubscription, fallback = {}) {
  const existing = await Subscription.findOne({ where: { provider_subscription_id: stripeSubscription.id } });
  const userId = stripeSubscription.metadata?.orca_user_id || existing?.user_id || fallback.user_id;
  const workerId = stripeSubscription.metadata?.orca_worker_id || existing?.worker_id || fallback.worker_id;
  if (!userId || !workerId) throw new Error('Stripe subscription is missing ORCA ownership metadata.');
  const priceId = stripeSubscription.items?.data?.[0]?.price?.id || existing?.provider_price_id || fallback.provider_price_id;
  const values = {
    user_id: userId,
    worker_id: workerId,
    provider: 'stripe',
    provider_customer_id: String(stripeSubscription.customer),
    provider_subscription_id: stripeSubscription.id,
    provider_price_id: priceId || null,
    status: stripeSubscription.status,
    current_period_end: subscriptionPeriodEnd(stripeSubscription),
    cancel_at_period_end: Boolean(stripeSubscription.cancel_at_period_end),
    metadata: { latest_invoice: stripeSubscription.latest_invoice || null },
  };
  if (existing) {
    await existing.update(values);
    return existing;
  }
  const pending = await Subscription.findOne({
    where: { user_id: userId, worker_id: workerId, provider: 'stripe', status: 'pending' },
    order: [['createdAt', 'DESC']],
  });
  if (pending) {
    await pending.update(values);
    return pending;
  }
  return Subscription.create(values);
}

async function handleStripeEvent(event) {
  const stripe = stripeClient();
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.mode === 'subscription' && session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      await persistStripeSubscription(subscription, {
        user_id: session.metadata?.orca_user_id,
        worker_id: session.metadata?.orca_worker_id,
      });
    }
  } else if (event.type.startsWith('customer.subscription.')) {
    await persistStripeSubscription(event.data.object);
  }
}

module.exports = {
  stripeClient,
  stripePriceId,
  activeSubscription,
  hasEntitlement,
  assertPurchaseEligibility,
  createCheckoutSession,
  handleStripeEvent,
};
