const test = require('node:test');
const assert = require('node:assert/strict');
const { netPaidOneTimeCents, summarizeCustomerEconomics } = require('../services/economicMeasures');

test('confirmed purchases count net of actual recorded partial refunds', () => {
  assert.equal(netPaidOneTimeCents({ status: 'paid', amount_cents: 12000 }), 12000);
  assert.equal(netPaidOneTimeCents({
    status: 'partially_refunded', amount_cents: 12000,
    metadata: { amount_refunded_cents: 3000 },
  }), 9000);
  assert.equal(netPaidOneTimeCents({ status: 'refunded', amount_cents: 12000 }), 0);
  assert.equal(netPaidOneTimeCents({ status: 'pending', amount_cents: 12000 }), 0);
  assert.equal(netPaidOneTimeCents({ status: 'disputed', amount_cents: 12000 }), 0);
});

test('an acceptance rate needs real customer reviews, never dummy data', () => {
  const empty = summarizeCustomerEconomics({});
  assert.equal(empty.customer_acceptance_rate, null);
  assert.equal(empty.confirmed_one_time_customer_spend_usd, 0);
  const measured = summarizeCustomerEconomics({
    deliveredTasks: 5, acceptedTasks: 2, rejectedTasks: 1,
    recordedCostUsd: 1.345, reportedMinutesSaved: 45,
    purchases: [{ status: 'paid', amount_cents: 12000 }],
  });
  assert.equal(measured.customer_acceptance_rate, 0.6667);
  assert.equal(measured.recorded_employee_execution_cost_usd, 1.34);
  assert.equal(measured.confirmed_one_time_customer_spend_usd, 120);
});
