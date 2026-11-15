const { Purchase } = require('../models');

function checkoutPaid(session) {
  return session.mode === 'payment' && session.payment_status === 'paid';
}

async function persistOneTimeCheckout(session) {
  if (session.mode !== 'payment') return null;
  const userId = session.metadata?.orca_user_id;
  const workerId = session.metadata?.orca_worker_id;
  if (!userId || !workerId || !session.id) {
    throw new Error('Signed payment event is missing its Workforce ownership fields.');
  }
  const [purchase] = await Purchase.findOrCreate({
    where: { provider_session_id: session.id },
    defaults: {
      user_id: userId,
      worker_id: workerId,
      provider_session_id: session.id,
      provider_payment_intent_id: session.payment_intent ? String(session.payment_intent) : null,
      provider_customer_id: session.customer ? String(session.customer) : null,
      amount_cents: Number(session.amount_total || 0),
      currency: String(session.currency || 'usd'),
      status: 'pending',
    },
  });
  if (purchase.user_id !== userId || purchase.worker_id !== workerId) {
    throw new Error('Payment ownership does not match the original checkout.');
  }
  const status = checkoutPaid(session) ? 'paid'
    : session.payment_status === 'unpaid' ? purchase.status : 'pending';
  // Never reactivate a fully refunded or disputed purchase when older events arrive.
  if (!['refunded', 'disputed'].includes(purchase.status)) {
    await purchase.update({
      status,
      provider_payment_intent_id: session.payment_intent ? String(session.payment_intent) : purchase.provider_payment_intent_id,
      provider_customer_id: session.customer ? String(session.customer) : purchase.provider_customer_id,
      amount_cents: Number(session.amount_total || purchase.amount_cents),
      currency: String(session.currency || purchase.currency),
      purchased_at: status === 'paid' ? (purchase.purchased_at || new Date()) : purchase.purchased_at,
    });
  }
  return purchase;
}

async function markOneTimePaymentFailed(session) {
  const purchase = await Purchase.findOne({ where: { provider_session_id: session.id } });
  if (purchase && purchase.status === 'pending') await purchase.update({ status: 'failed' });
  return purchase;
}

async function reflectStripeCharge(charge, disputed = false) {
  if (!charge?.payment_intent) return null;
  const purchase = await Purchase.findOne({
    where: { provider_payment_intent_id: String(charge.payment_intent) },
  });
  if (!purchase) return null;
  if (purchase.status === 'disputed' && !disputed) return purchase;
  const fullyRefunded = Number(charge.amount || 0) > 0
    && Number(charge.amount_refunded || 0) >= Number(charge.amount);
  const next = disputed ? 'disputed' : fullyRefunded ? 'refunded' : 'partially_refunded';
  await purchase.update({
    status: next,
    refunded_at: fullyRefunded ? new Date() : purchase.refunded_at,
    metadata: {
      ...purchase.metadata,
      amount_refunded_cents: Number(charge.amount_refunded || 0),
      latest_charge_id: charge.id || null,
    },
  });
  return purchase;
}

module.exports = {
  checkoutPaid,
  persistOneTimeCheckout,
  markOneTimePaymentFailed,
  reflectStripeCharge,
};
