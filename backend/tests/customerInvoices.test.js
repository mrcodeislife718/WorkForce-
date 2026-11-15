const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ownedStripeCustomers, selectOwnedCustomer, publicInvoice,
} = require('../services/customerInvoices');

test('customer-scoped invoice listing deduplicates Stripe customers and ignores invalid IDs', () => {
  const customers = ownedStripeCustomers([
    { provider: 'stripe', provider_customer_id: 'cus_A123' },
    { provider: 'stripe', provider_customer_id: 'cus_A123' },
    { provider: 'other', provider_customer_id: 'cus_B456' },
  ], [
    { provider: 'stripe', provider_customer_id: 'cus_C789' },
    { provider: 'stripe', provider_customer_id: 'malformed' },
  ]);
  assert.deepEqual(customers, ['cus_A123', 'cus_C789']);
});

test('invoice view does not allow a different customers Stripe account', () => {
  assert.equal(selectOwnedCustomer(['cus_A123'], ''), 'cus_A123');
  assert.equal(selectOwnedCustomer([], null), null);
  assert.throws(() => selectOwnedCustomer(['cus_A123'], 'cus_OTHER'), /not found/);
});

test('invoice view exposes only billing fields and omits private Stripe object data', () => {
  const invoice = publicInvoice({
    id: 'in_123', number: 'WC-001', status: 'paid', currency: 'usd',
    amount_due: 280000, amount_paid: 280000, amount_remaining: 0,
    created: 1750000000, due_date: null, subscription: 'sub_123',
    hosted_invoice_url: 'https://invoice.stripe.com/i/example',
    invoice_pdf: 'https://pay.stripe.com/invoice/example/pdf',
    customer_email: 'private@example.com',
    lines: { data: [{ description: 'Private line item' }] },
  });
  assert.equal(invoice.amount_due_cents, 280000);
  assert.equal(invoice.created_at, 1750000000000);
  assert.equal(invoice.subscription_id, 'sub_123');
  assert.equal('customer_email' in invoice, false);
  assert.equal('lines' in invoice, false);
});
