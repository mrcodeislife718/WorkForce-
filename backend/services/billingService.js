const { Op } = require('sequelize');
const Stripe = require('stripe');
const {
  User,
  Worker,
  InterviewSession,
  SampleAssignment,
  Subscription,
  Purchase,
} = require('../models');
const {
  persistOneTimeCheckout,
  markOneTimePaymentFailed,
  reflectStripeCharge,
} = require('./oneTimePurchaseService');

const PRICE_ENV_BY_WORKER = {
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa': 'STRIPE_PRICE_CUSTOMER_SUPPORT',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb': 'STRIPE_PRICE_FOUNDER_ASSISTANT',
  'cccccccc-cccc-cccc-cccc-cccccccccccc': 'STRIPE_PRICE_COMMERCE_SUPPORT',
  'dddddddd-dddd-dddd-dddd-dddddddddddd': 'STRIPE_PRICE_SALES_FOLLOW_UP',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee': 'STRIPE_PRICE_CONTENT_PRODUCTION',
  'ffffffff-ffff-4fff-8fff-fffffffffff1': 'STRIPE_PRICE_RESEARCH_BRIEFING',
  'ffffffff-ffff-4fff-8fff-fffffffffff2': 'STRIPE_PRICE_ENGINEERING_OPERATIONS',
  'ffffffff-ffff-4fff-8fff-fffffffffff3': 'STRIPE_PRICE_DATA_ANALYTICS',
  'ffffffff-ffff-4fff-8fff-fffffffffff4': 'STRIPE_PRICE_FINANCE_OPERATIONS',
  'ffffffff-ffff-4fff-8fff-fffffffffff5': 'STRIPE_PRICE_PEOPLE_OPERATIONS',
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

const OWNER_SEED_ID = '11111111-1111-1111-1111-111111111111';

function isInternalOwnerTestAccess(userId, env = process.env) {
  // Developer-owned local testing is never a customer billing bypass.
  // A predictable account ID alone is insufficient: the seed administrator
  // requires a separately configured private password.
  return env.NODE_ENV !== 'production'
    && env.INTERNAL_OWNER_TEST_ACCESS === 'true'
    && String(env.SEED_ADMIN_PASSWORD || '').length >= 20
    && userId === OWNER_SEED_ID;
}

async function hasEntitlement(userId, worker) {
  if (isInternalOwnerTestAccess(userId)) {
    return { entitled: true, reason: 'owner_local_test', subscription: null };
  }
  // Workforce employee access is not granted by a free catalog flag.
  if (worker.price_model === 'free') return { entitled: false, reason: 'monthly_subscription_required' };
  if (worker.price_model === 'one_time') {
    const purchase = await Purchase.findOne({
      where: { user_id: userId, worker_id: worker.id, status: { [Op.in]: ['paid', 'partially_refunded'] } },
      order: [['purchased_at', 'DESC']],
    });
    return { entitled: Boolean(purchase), reason: purchase ? 'one_time_purchase' : 'purchase_required', purchase };
  }
  const subscription = await activeSubscription(userId, worker.id);
  if (subscription) return { entitled: true, reason: subscription.status, subscription };
  const { activeBundleEntitlement } = require('./bundleBillingService');
  const bundle = await activeBundleEntitlement(userId, worker.id);
  return { entitled: Boolean(bundle), reason: bundle ? 'active_team_or_department_subscription' : 'subscription_required', subscription: bundle };
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

function assertStripePriceMatches(worker, price) {
  const amountCents = Math.round(Number(worker.base_price) * 100);
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error('Digital employee has no valid purchase price.');
  }
  if (!price?.active || price.currency !== 'usd' || price.unit_amount !== amountCents) {
    throw new Error('The payment provider price does not match the advertised USD price.');
  }
  if (worker.price_model !== 'subscription') {
    throw new Error('Workforce employee prices must be monthly subscriptions.');
  }
  if (price.type !== 'recurring' || price.recurring?.interval !== 'month'
    || Number(price.recurring?.interval_count) !== 1) {
    throw new Error('This employee must have a matching monthly Stripe price.');
  }
}

async function createCheckoutSession(userId, workerId) {
  const worker = await Worker.findOne({ where: { id: workerId, status: 'published' } });
  if (!worker) throw new Error('Digital employee was not found.');
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  if (worker.price_model !== 'subscription') {
    throw new Error('New Workforce employee hires require a paid monthly subscription.');
  }
  const priceId = stripePriceId(worker);
  if (!priceId) throw new Error('This digital employee does not have a real Stripe price configured.');

  const entitlement = await hasEntitlement(userId, worker);
  if (entitlement.entitled) return { already_entitled: true, url: `${frontendUrl}/deploy/${worker.id}` };

  const stripe = stripeClient();
  const price = await stripe.prices.retrieve(priceId);
  assertStripePriceMatches(worker, price);

  const user = await User.findByPk(userId);
  if (!user) throw new Error('Account was not found.');
  const [subscription, previousPurchase] = await Promise.all([
    Subscription.findOne({
      where: { user_id: userId, provider: 'stripe', provider_customer_id: { [Op.ne]: null } },
      order: [['createdAt', 'DESC']],
    }),
    Purchase.findOne({
      where: { user_id: userId, provider_customer_id: { [Op.ne]: null } },
      order: [['createdAt', 'DESC']],
    }),
  ]);
  let customerId = subscription?.provider_customer_id || previousPurchase?.provider_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: { orca_user_id: user.id },
    });
    customerId = customer.id;
  }
  const metadata = { orca_user_id: user.id, orca_worker_id: worker.id };
  const mode = 'subscription';
  const session = await stripe.checkout.sessions.create({
    mode,
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${frontendUrl}/purchase/success?worker_id=${worker.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/worker/${worker.id}`,
    allow_promotion_codes: true,
    metadata,
    ...(mode === 'subscription'
      ? { subscription_data: { metadata } }
      : { payment_intent_data: { metadata } }),
  });
  if (!session.url) throw new Error('The payment provider did not create a checkout URL.');

  if (mode === 'subscription') {
    await Subscription.create({
      user_id: user.id,
      worker_id: worker.id,
      provider: 'stripe',
      provider_customer_id: customerId,
      provider_price_id: priceId,
      status: 'pending',
      metadata: { checkout_session_id: session.id },
    });
  } else {
    await Purchase.findOrCreate({
      where: { provider_session_id: session.id },
      defaults: {
        user_id: user.id,
        worker_id: worker.id,
        provider_session_id: session.id,
        provider_customer_id: customerId,
        provider_price_id: priceId,
        amount_cents: Number(price.unit_amount),
        currency: price.currency,
        status: 'pending',
      },
    });
  }
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
    if (session.mode === 'payment') {
      await persistOneTimeCheckout(session);
    } else if (session.mode === 'subscription' && session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      if (session.metadata?.orca_sale_type === 'bundle') {
        const { persistStripeBundleSubscription } = require('./bundleBillingService');
        await persistStripeBundleSubscription(subscription, {
          user_id: session.metadata?.orca_user_id,
          bundle_id: session.metadata?.orca_bundle_id,
        });
      } else {
        await persistStripeSubscription(subscription, {
          user_id: session.metadata?.orca_user_id,
          worker_id: session.metadata?.orca_worker_id,
        });
      }
    }
  } else if (event.type === 'checkout.session.async_payment_succeeded') {
    await persistOneTimeCheckout(event.data.object);
  } else if (event.type === 'checkout.session.async_payment_failed') {
    await markOneTimePaymentFailed(event.data.object);
  } else if (event.type === 'charge.refunded') {
    await reflectStripeCharge(event.data.object);
  } else if (event.type === 'charge.dispute.created') {
    const disputedCharge = await stripe.charges.retrieve(event.data.object.charge);
    await reflectStripeCharge(disputedCharge, true);
  } else if (event.type.startsWith('customer.subscription.')) {
    const { BundleSubscription } = require('../models');
    const { persistStripeBundleSubscription } = require('./bundleBillingService');
    const id = event.data.object.id;
    const existingBundle = await BundleSubscription.findOne({ where: { provider_subscription_id: id } });
    if (existingBundle || event.data.object.metadata?.orca_sale_type === 'bundle') {
      // Fetch current Stripe state instead of trusting out-of-order event snapshots.
      const current = await stripe.subscriptions.retrieve(id, { expand: ['items.data.price'] });
      await persistStripeBundleSubscription(current, {
        user_id: existingBundle?.user_id,
        bundle_id: existingBundle?.workforce_bundle_id,
      });
    } else {
      await persistStripeSubscription(event.data.object);
    }
  }
}

module.exports = {
  stripeClient,
  stripePriceId,
  activeSubscription,
  hasEntitlement,
  assertPurchaseEligibility,
  assertStripePriceMatches,
  createCheckoutSession,
  handleStripeEvent,
  isInternalOwnerTestAccess,
};
