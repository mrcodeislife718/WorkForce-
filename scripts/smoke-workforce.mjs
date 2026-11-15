// Real HTTP + PostgreSQL integration check, not a simulated model or payment.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const base = process.env.WORKFORCE_SMOKE_URL || 'http://127.0.0.1:5000';
async function call(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
}
async function waitForHealth() {
  for (let i = 0; i < 50; i += 1) {
    try {
      const health = await call('/api/health');
      if (health.status === 200 && health.body.status === 'ok') return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('Workforce HTTP API and PostgreSQL did not become healthy.');
}

await waitForHealth();
const catalog = await call('/api/store/catalog');
assert.equal(catalog.status, 200);
const people = catalog.body.employees || [];
for (const name of [
  'Naomi Carter', 'Sofia Hayes', 'Aisha Bennett', 'Andre Lewis', 'Maya Bennett',
  'Evelyn Brooks', 'Gabriel Torres', 'Imani Brooks', 'Daniel Rivera', 'Olivia Chen',
]) {
  const worker = people.find((candidate) => candidate.name === name);
  assert.ok(worker, `Missing real named digital employee: ${name}`);
  assert.equal(worker.price_model, 'subscription');
  assert.ok(Number(worker.base_price) > 1900, `Unexpectedly cheap professional price for ${name}`);
}

const bundles = [...(catalog.body.teams || []), ...(catalog.body.departments || [])];
assert.ok(bundles.length >= 6, 'Published teams and departments must be in the real catalog.');
for (const plan of bundles) {
  assert.ok(plan.members?.length > 0, `Empty published workforce plan: ${plan.name}`);
  const total = plan.members.reduce((sum, worker) => sum + Number(worker.base_price), 0);
  assert.ok(Math.abs(total - Number(plan.pricing?.orca_monthly_price)) < 0.01,
    `Team monthly price does not equal the actual premium employee prices for ${plan.name}`);
}

const email = `workforce-http-smoke+${randomUUID()}@example.test`;
const password = `test-${randomUUID()}-secret`;
const signup = await call('/api/auth/signup', {
  method: 'POST', body: { email, password, name: 'HTTP Integration Customer' },
});
assert.equal(signup.status, 201, JSON.stringify(signup.body));
assert.ok(signup.body.token);

const login = await call('/api/auth/login', {
  method: 'POST', body: { email, password },
});
assert.equal(login.status, 200);
assert.equal(login.body.user.email, email);

const me = await call('/api/auth/me', { token: login.body.token });
assert.equal(me.status, 200);
assert.equal(me.body.user.id, signup.body.user.id);

const unowned = await call('/api/console/overview');
assert.equal(unowned.status, 401);

const bundleSlug = bundles[0].slug;
const bundleStatus = await call(`/api/billing/bundle/${bundleSlug}/status`, { token: login.body.token });
assert.equal(bundleStatus.status, 200);
assert.equal(bundleStatus.body.entitled, false, 'Free team access bypassed paid subscription.');
const teamCheckout = await call('/api/billing/bundle-checkout-session', {
  method: 'POST', token: login.body.token, body: { slug: bundleSlug },
});
assert.equal(teamCheckout.status, 503, 'Team checkout must fail closed without a real Workforce Stripe merchant.');

const employeeId = people.find((p) => p.name === 'Evelyn Brooks').id;
const billing = await call(`/api/billing/worker/${employeeId}/status`, { token: login.body.token });
assert.equal(billing.status, 200);
assert.equal(billing.body.entitled, false, 'Customer received an unpurchased professional employee.');
assert.equal(billing.body.price_model, 'subscription');

const eligibility = await call(`/api/deployments/eligibility/${employeeId}`, { token: login.body.token });
assert.equal(eligibility.status, 200);
assert.equal(eligibility.body.eligible, false, 'Customer bypassed real monthly entitlement.');
assert.ok(eligibility.body.blockers.some((b) => b.code === 'PURCHASE_REQUIRED'));

const create = await call('/api/deployments', {
  method: 'POST',
  token: login.body.token,
  body: { worker_id: employeeId, name: 'Not Purchased', bindings: [], capability_assignments: [] },
});
assert.equal(create.status, 409, 'Customer deployed without a paid subscription.');

console.log('PASS: real PostgreSQL, real Express HTTP, full professional catalog, signup/login, identity separation and premium individual/team subscription enforcement.');
