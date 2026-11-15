# Workforce hosting and real-customer cutover

This document describes the existing ORCA/Workforce deployment, not a replacement application. The GitHub branch of record is `main`. Never upload production credentials to GitHub.

## Current deployment split

- **Store and customer console:** Vite React frontend in `frontend/`, Vercel project `workforce` in team `mrbronxny718-2363s-projects`.
- **Customer, employee, assignment, audit, and billing records:** PostgreSQL accessible only from the trusted backend. The existing Sequelize models and migrations stay the source of truth.
- **Employee runtime:** a continuously running Node 22 service using `Dockerfile` at repository root, with a connected real AI model, database, and approved external tools.
- **Billing:** a *separate Workforce Stripe account*, with USD monthly recurring Price IDs and signed webhooks. JiffyLaundry is not a payment account for Workforce.

The Vercel frontend is not a persistent task host. It must not contain `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `JWT_SECRET`, or `ORCA_CREDENTIAL_ENCRYPTION_KEY`.

## Database

Create a **new dedicated Workforce PostgreSQL database** under the owner-approved organization. Do not reuse unrelated existing projects without owner authorization.

For Supabase: use the Connect panel's **Session pooler** URL when the backend host is IPv4-only. For IPv6-capable persistent hosts, the direct Postgres URL is also supported. Do not fabricate the pooler host or username. Supabase connection reference: https://supabase.com/docs/guides/database/connecting-to-postgres .

For the hosted backend, configure in its **private environment variables**, not its public source:

```dotenv
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://REPLACE_FROM_DATABASE_CONNECT_PANEL
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
DB_POOL_MAX=10
DB_SYNC_MODE=none
RUN_LEGACY_MIGRATIONS=false
JWT_SECRET=REPLACE_WITH_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
ORCA_CREDENTIAL_ENCRYPTION_KEY=REPLACE_WITH_A_32_BYTE_BASE64_KEY
PUBLIC_API_URL=https://api.example.com
FRONTEND_URL=https://workforce.example.com
CORS_ORIGINS=https://workforce.example.com
MODEL_PROVIDER=openai-compatible
MODEL_API_BASE_URL=https://approved-model-provider.example.com/v1
MODEL_API_KEY=REPLACE_WITH_PROVIDER_KEY
MODEL_ID=REPLACE_WITH_APPROVED_REAL_MODEL
RUNTIME_STALE_LOCK_MS=900000
RUNTIME_HEARTBEAT_MS=30000
RUNTIME_DELIVER_MAX_TOKENS=3500
```

Replace example hosts with the **actual** deployed endpoints. These are templates, **not verified endpoints**. Do not use `DB_SSL_REJECT_UNAUTHORIZED=false` to bypass certificate problems. Never configure database/admin keys in Vercel's `VITE_` variables.

Before putting customer data into a managed database with a public Data API, ensure that the Sequelize tables in `public` are **not anonymously accessible**. Prefer a dedicated project with the Data API disabled or `public` removed from exposed schemas, and inspect grants/row-level-security settings. The application uses trusted backend PostgreSQL access, not Supabase browser-client data access.

## Initialize and verify the database

From the owner-approved running environment after the database exists and the private environment variables are configured:

```bash
cd backend
npm ci
npm run migrate:universal
npm run seed:data
npm run check
npm test
```

Run database migrations in a controlled release process, **not in a publicly accessible web request**. Confirm additive migration behavior on a backup before changing a live database. Make backups and verify restore procedures before customer onboarding.

## Start employee API locally

```bash
cd backend
npm ci
npm start
```

The REST service uses `PORT` and exposes `/api/health`. The same process runs the persistent job poller with recovery and heartbeats. Production requires a host that does not sleep between requests.

Container build and local verification:

```bash
docker build -t workforce-backend .
docker run --rm --env-file backend/.env -p 5000:5000 workforce-backend
curl -fsS http://localhost:5000/api/health
```

This test requires a working PostgreSQL instance and correctly configured private env. Do not expose port 5000 directly to the Internet without HTTPS reverse proxy and firewall.

## Vercel frontend

The connected project uses `frontend/`, Vite, `npm ci`, `npm run build` and `dist/`. `frontend/vercel.json` supports direct links to React routes.

After a reachable backend is deployed, set the following **public, non-secret** Vercel build variable to its real HTTPS origin:

```dotenv
VITE_API_URL=https://YOUR-REAL-BACKEND-HOST
```

Only then re-enable Git deployments / trigger an authorized release. Verify `/store/employees`, `/billing`, signup, and permission-driven employee deployment against the backend. The Vercel Hobby plan must not be used for a commercial production operation if the account's plan restricts commercial use.

## Test payments, not live charges

In Workforce's own Stripe **test-mode** account, create monthly recurring USD prices matching each published employee's `base_price`. Put the IDs and secret key only in the backend's private environment. For a local webhook listener:

```bash
stripe login
stripe listen --forward-to localhost:5000/api/billing/webhook
```

Copy the listener's secret to backend `STRIPE_WEBHOOK_SECRET` privately. Production has a different endpoint signing secret. Test both initial and renewal subscription invoices, failed payment, cancellations, refunds, disputes, and owner-scoped invoice history. Webhook signatures and real payment status—not a success-page visit—govern entitlements.

## Live acceptance gates

Before collecting money: database backups and restores verified; AI model reachable by the **remote backend**; runtime tool permissions tested with real customer-approved resources; external actions safely reconciled after interruption; customer feedback and correction work functioning; secured email and customer support; Stripe test events and invoices reconciled; HTTPS/CORS verified; error monitoring and capacity established; actual commercial hosting terms accepted by owner; explicit owner approval for production switch.

**Verification levels:** source implementation, automated tests, connected test environment, customer acceptance, and live production are separate claims. Do not claim the product is live until the last two are achieved.
