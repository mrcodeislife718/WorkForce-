# Workforce hosting and real-customer cutover

This document describes the existing ORCA/Workforce deployment, not a replacement application. The GitHub branch of record is `main`. Never upload production credentials to GitHub.

## Current deployment split

- **Store and customer console:** Vite React frontend in `frontend/`, Vercel project `workforce` in team `mrbronxny718-2363s-projects`.
- **Customer, employee, assignment, audit, and billing records:** PostgreSQL accessible only from the trusted backend. The existing Sequelize models and migrations stay the source of truth.
- **Employee runtime:** a continuously running Node 22 service using `Dockerfile` at repository root, with a connected real AI model, database, and approved external tools.
- **Billing:** a *separate Workforce Stripe account*, with USD monthly recurring Price IDs and signed webhooks. JiffyLaundry is not a payment account for Workforce.

The Vercel frontend is not a persistent task host. It must not contain `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `JWT_SECRET`, or `ORCA_CREDENTIAL_ENCRYPTION_KEY`.

## Start with self-hosted PostgreSQL (no new account)

Supabase is **optional**, not required. The application already uses ordinary PostgreSQL through Sequelize and can run its database and API on the user's existing Linux machine. A dedicated Docker Compose stack (`compose.yaml`) provides:

- `postgres`: PostgreSQL 16 on a private container-only network, with records persisted in a named Docker volume;
- `backend`: the actual Node/Express API **and persistent employee task worker**, reachable on **localhost only** at port 5000;
- automatic restart after host reboot when Docker is running;
- randomly generated, locally stored secrets; no cloud provider or new account.

Run from the GitHub repository root on Linux Mint (Node.js 22 and Docker Engine + Docker Compose plugin must be installed):

```bash
git pull --ff-only origin main
docker compose version
bash scripts/setup-local-workforce.sh
docker compose --env-file backend/.env build backend
docker compose --env-file backend/.env up -d postgres
docker compose --env-file backend/.env run --rm backend npm run seed
docker compose --env-file backend/.env up -d backend
curl -fsS http://localhost:5000/api/health
```

On first launch, `scripts/setup-local-workforce.sh` creates `backend/.env` with **private cryptographically random** database, JWT, and connection-encryption secrets. It refuses to overwrite an existing `backend/.env`. The secrets are ignored by Git. If your existing env uses different values, edit it privately to match the intended new local database; don't commit it.

```bash
# Inspect application logs:
docker compose --env-file backend/.env logs --tail 80 backend

# Start the development website on your ThinkPad:
cd frontend
npm ci
npm run dev
# Open http://localhost:5173
```

The frontend's Vite dev proxy forwards `/api` requests to `http://localhost:5000`. The customer-facing Vercel website **cannot** reach the laptop's private `localhost`; this stack is for building and verifying the real product locally before choosing its 24/7 public hosting.

To protect local records, run a backup (produces a sensitive file outside Git):

```bash
bash scripts/backup-local-workforce.sh
```

Keep a securely encrypted, off-device backup and rehearse a restore before accepting customer information. The named Docker volume survives `docker compose down`, but **`docker compose down --volumes` deletes the database**. Never use that destructive command on a database you need to keep.

To stop only the local application without deleting records:

```bash
docker compose --env-file backend/.env down
```

### The eventual always-on commercial environment

The same ordinary PostgreSQL and backend can later run on **one persistent, owner-approved server** (or reliable self-hosted hardware). This avoids separate application hosting and database-service accounts. That move still requires HTTPS reverse proxy, firewall, production-grade network boundaries, backups, restore testing, monitoring, uptime, customer isolation, and a real AI model accessible to the server. If the database is on a separate server, enable verified PostgreSQL TLS (`DB_SSL=true`). Do not expose its port publicly.

For remote production configure `NODE_ENV=production`, strong private `JWT_SECRET`, `ORCA_CREDENTIAL_ENCRYPTION_KEY`, `PUBLIC_API_URL`, `FRONTEND_URL`, `CORS_ORIGINS`, `MODEL_API_BASE_URL`, `MODEL_API_KEY`, `MODEL_ID`, and separate Workforce Stripe test/live credentials as appropriate. Backend production checks deliberately reject missing secrets and insecure cross-origin endpoints.

Do **not** publish a commercial frontend against the local-only backend. The Vercel Hobby plan must also be reviewed for commercial eligibility.

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
