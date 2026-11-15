# Workforce — verified implementation and launch record

Reviewed 2026-11-15. WorkForce- is an independent ORCA/Workforce digital-employee marketplace, Store, Console and Protect product. This is a description of **software committed on `main`**, not a claim that commercial deployment is live.

## Completion-first engineering checks

- Original source kept: Express, Sequelize/PostgreSQL, React/Vite, named employees, permissions, encrypted connector credentials, managed/direct API adapters, runtime and checkpoint recovery, signed Stripe checkout/webhooks, customer reviews and support.
- The entire professional catalog has no hard-coded industry/category enum. A non-destructive migration carries existing employee rows into an extensible category column.
- Ten named employees are listed with role-specific skills, premium **monthly** prices, professional permissions and actual work contracts. New roles include engineering, analytics, finance and people operations.
- Actual existing REST APIs can be connected via a customer-owned token. A GitHub Issues preset uses the exact selected repository for issue reading and human-approved issue creation; no provider-specific ORCA install API is demanded.
- Employees generate work, observe actual provider tool results, prepare a grounded deliverable after external calls, and accept customer feedback. A rejected deliverable queues a **new written correction** without blindly replaying prior external side effects. Customer-approved verified lessons are scoped to the deployment.
- Job leases heartbeat through PostgreSQL; uncertain external effects are held for reconciliation after interruption; actions are gated by capability, selected resource, user approval and deterministic policy.
- A separate encrypted service runs existing GGUF model files through the official llama.cpp server image, in a private Docker network. **Ollama is not the runtime**. PostgreSQL and the persistent Node employee backend run in the same Compose stack, no Supabase account.
- Local seeded developer account may hire/assign live employee work without paying itself **only with a private, randomly generated password and `INTERNAL_OWNER_TEST_ACCESS=true` outside production**. Normal customer subscription enforcement and monthly pricing remain mandatory.
- Store includes individuals, teams and departments. The source implements one Stripe Checkout subscription for a paid bundle and reconciles its exact recurring line items before entitlement; a customer's rights are derived from the original paid member set, not arbitrary future catalog changes.
- CI: backend unit tests and real PostgreSQL + HTTP signup/login/catalog/entitlement checks; Vite frontend build; Docker Compose config; project proof gate. See the current `main` GitHub Actions status, not an earlier commit's status.

## Eight engineering rules

1. Inspect and preserve actual source: **implemented**.
2. Deliver a complete usable commercial autonomous workforce, not only samples: **source significantly expanded; external real customers not yet verified**.
3. Fix integration faults directly: **implemented** for startup index collision, category restriction, direct REST adapter, and review-to-correction.
4. Protect existing data and project identity: **implemented** for legacy category migration, database volume, backups and customer-scoped records; restoration must still be tested.
5. Real work, auth, billing, professional tools, support, recovery: **implemented as code**, dependent on real configured model, Stripe merchant and customer workspaces.
6. Independent verification with outcome evidence: **automated checks**, live task acceptance and side-effect reconciliation remain.
7. Owner authorization for risky actions and deployment: **enforced in source and required operationally**.
8. Persistence and self-improvement from verified lessons: **implemented and guarded**, reliability under actual live interruption remains to be tested.

## Eight economic production rules

1. Digital employees serve a real customer business function with named deliverables: implemented in profiles and runtime.
2. Premium recurring monthly prices, checkout, subscriptions, invoices and teams: implemented in source; actual Workforce Stripe merchant and signed production webhooks not connected.
3. Customer acquisition: catalog and sales funnel implemented; campaigns, attribution and actual conversions not launched or measured.
4. Buyer conversion: purchase CTA, Stripe Checkout, signed payment confirmation and access gating implemented.
5. Service and retention: console, recurring tasks, support and automatic correction to rejected work implemented; real customer retention unmeasured.
6. Financial evidence: costs and invoices recorded; bank settlement/tax and full net margins not reconciled.
7. Outcome quality: no simulated acceptance claims; independently reviewable customer receipts exist.
8. Sustainable operation: persistent backend and backup scripts prepared, but **no commercial-grade always-on backend is live**.

## External deployment boundaries

The only connected Vercel project is `workforce` in `mrbronxny718-2363s-projects`, rooted at `frontend/`. The commercial frontend is not deployed, and Vercel Hobby commercial eligibility must be checked. A customer's web browser cannot access a private laptop's `localhost` backend.

The backend may be developed with **owner-controlled local PostgreSQL and a previously downloaded GGUF**; installing Docker, booting the actual model on the user's ThinkPad, and testing a real assignment must be completed in that environment. Remote CI has no access to the laptop or model files.

**Do not use unrelated JiffyLaundry Stripe credentials.** Paid Workforce production hiring and team billing require a separate authorized Workforce merchant, actual per-employee monthly Price IDs, signed webhook secrets and verified test events. No live Stripe merchant was used or charged in this work.

Avoid claiming production success, confirmed uptime, verified model outputs, real customer revenues or customer acceptance without real end-to-end evidence. Do not add accounts or spend money without owner authorization.

## Instructions

Local self-hosted operation: `docs/WORKFORCE_HOSTING.md`.

Current code and build checks: `https://github.com/mrcodeislife718/WorkForce-/actions`.
