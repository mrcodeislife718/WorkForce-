'use strict';

// Only invoice customer IDs already linked to the authenticated ORCA account.
function ownedStripeCustomers(subscriptions = [], purchases = []) {
  const result = new Set();
  for (const row of [...subscriptions, ...purchases]) {
    const id = row?.provider_customer_id;
    if (row?.provider === 'stripe' && typeof id === 'string' && /^cus_[A-Za-z0-9]+$/.test(id)) {
      result.add(id);
    }
  }
  return [...result];
}

function selectOwnedCustomer(customerIds, requestedId) {
  if (customerIds.length === 0) return null;
  if (!requestedId) return customerIds[0];
  if (!customerIds.includes(requestedId)) {
    const error = new Error('Invoice account was not found.');
    error.status = 403;
    throw error;
  }
  return requestedId;
}

function publicInvoice(invoice) {
  return {
    id: invoice.id,
    number: invoice.number || null,
    status: invoice.status,
    currency: invoice.currency,
    amount_due_cents: Number(invoice.amount_due || 0),
    amount_paid_cents: Number(invoice.amount_paid || 0),
    amount_remaining_cents: Number(invoice.amount_remaining || 0),
    created_at: Number(invoice.created || 0) * 1000,
    due_at: invoice.due_date ? Number(invoice.due_date) * 1000 : null,
    hosted_invoice_url: invoice.hosted_invoice_url || null,
    invoice_pdf: invoice.invoice_pdf || null,
    subscription_id: typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id || null,
  };
}

module.exports = { ownedStripeCustomers, selectOwnedCustomer, publicInvoice };
