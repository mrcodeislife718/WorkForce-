'use strict';

function dollars(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error('Financial amount must be a valid number.');
  return Number(number.toFixed(2));
}

function netPaidOneTimeCents(purchase) {
  if (!['paid', 'partially_refunded', 'refunded'].includes(purchase.status)) return 0;
  if (purchase.status === 'refunded') return 0;
  const charged = Math.max(0, Math.trunc(Number(purchase.amount_cents || 0)));
  const refunded = Math.max(0, Math.trunc(Number(purchase.metadata?.amount_refunded_cents || 0)));
  return Math.max(0, charged - refunded);
}

function summarizeCustomerEconomics({
  deliveredTasks = 0,
  acceptedTasks = 0,
  rejectedTasks = 0,
  reportedMinutesSaved = 0,
  recordedCostUsd = 0,
  purchases = [],
  activeSubscriptions = 0,
}) {
  const reviewedTasks = acceptedTasks + rejectedTasks;
  const paidCents = purchases.reduce((sum, item) => sum + netPaidOneTimeCents(item), 0);
  return {
    delivered_tasks: Number(deliveredTasks),
    customer_accepted_tasks: Number(acceptedTasks),
    customer_rejected_tasks: Number(rejectedTasks),
    customer_acceptance_rate: reviewedTasks > 0 ? Number((acceptedTasks / reviewedTasks).toFixed(4)) : null,
    customer_reported_minutes_saved: Number(reportedMinutesSaved),
    recorded_employee_execution_cost_usd: dollars(recordedCostUsd),
    confirmed_one_time_customer_spend_usd: dollars(paidCents / 100),
    active_subscriptions: Number(activeSubscriptions),
    measurement_notes: {
      customer_reported_minutes_saved: 'Reported by the customer, not independently timed.',
      recorded_employee_execution_cost_usd: 'Uses recorded estimates and provider charges when available; may exclude external fees.',
      confirmed_one_time_customer_spend_usd: 'Confirmed one-time payments less recorded refunds; excludes subscriptions, fees and tax adjustments.',
      customer_acceptance_rate: 'Only customer-reviewed deliveries are included in this rate.',
    },
  };
}

module.exports = { netPaidOneTimeCents, summarizeCustomerEconomics };
