# Workforce — engineering and economic completion record

Last reviewed: 2026-11-15. This document describes source-code implementation, NOT a production launch.

## Scope and ownership

Product: independent Workforce Store, Workforce Console and Workforce Protect platform.
Source: this repository, main branch. Preserve the existing ORCA identity and commercial operation unless the owner approves a change.
Authority: customer permissions for runtime activity; project owner for architecture, billing arrangements, deployment and consequential decisions.
No artificial employee, industry, model or project limits. Maintain private data isolation.

## Engineering rules — enforced or open

1. Existing code first: original Express/PostgreSQL, React, Stripe, connectors, policy controls, worker roster, runtime and checkpoints retained. Done for these changes.
2. Finish original objective: full multi-industry autonomous employees and complete marketplace are NOT production verified.
3. Repair rather than replan: implemented task delivery, review, billing, price alignment, crash recovery and knowledge-only deployment; tests added.
4. Preserve functioning work/data: additive Purchase table migration; no table removal, old subscription records and external connector rules retained.
5. Complete customer workflow: customer sign-in, listing, purchase, guarded deployment, assignment, delivery, review, billing and operations surfaces exist in source. External live services and all end-to-end flows require verification.
6. Evidence for completion: GitHub CI validates building and source tests, not real customer service, money movement, external tool execution or production failover.
7. Ownership: no project merger, forced paid model or deployment. Configured provider credentials remain customer controlled.
8. Recovery: recorded checkpoints, interrupted-job recovery, external-action repeat prevention; live interruption tests remain.

## Economic rules — enforced or open

1. Economic purpose: customer hires digital employees for measurable professional work. Internal productivity and commercial sale are distinct.
2. Revenue collection: Stripe subscriptions and one-time checkout implemented with signed webhooks, status records and refund/dispute gating. Live money and full invoice/fee reconciliation remain unverified.
3. Acquisition: catalog and discovery surfaces exist. Source-level paid conversion attribution, actual external campaigns and real lead acquisition measurements are not complete.
4. Purchase friction: evaluation is optional, but customer billing and permission confirmation remain mandatory.
5. Delivery and retention: actionable work, customer acceptance/rejection, durable lessons and console inspection implemented. A customer support ticket and response workflow is implemented in source. Live responsiveness and customer success monitoring remain unverified.
6. Financial evidence: verified one-time receipts net of recorded refunds, recorded execution expenses and subscription status have distinct reporting. True accounting cash reconciliation, taxes and full margins remain.
7. Real outcomes: accepted/rejected counts, separately labeled customer-reported time saved, no simulated conversion or acceptance numbers.
8. Repeatability: scheduled job recovery and checks implemented; actual deployment resilience, independent monitoring and capacity proof remain.

## Current software

- Existing roster and teams preserved.
- New research/briefing worker Evelyn Brooks can be hired free, without outside accounts, for substantive knowledge work once a real text model is configured.
- External-tool workers retain customer-selected connections and permission enforcement.
- Every completed assignment can be delivered and then accepted/rejected; only customer-approved lessons feed back within that deployment.
- Stripe subscription and one-time billing records are distinct; refunds and disputes can remove one-time entitlement.
- Worker interruption recovery uses recorded action progress and pauses uncertain work to prevent accidental duplicate side effects.
- Authenticated customer economic report has real-record counts, recorded costs, confirmed one-time spending and separately labeled self-reported savings.
- Private support requests and replies work through signed-in customer accounts; a configured trusted support account can review and resolve requests.

## Last known state

Source changes: committed to main.
Automated verification: check the latest GitHub Actions run for the current main revision. Passing CI does not establish live readiness.
Production deployment: not independently verified in this development session.
External credentials and third-party service authorization: not supplied in this development session.
Payment charge/refund integration: source implemented; real signed event testing pending.
Free model serving: configurable real provider; actual provider not verified.
Customer acquisition attribution, verified live support fulfillment, advanced team coordination, enterprise administration, full financial reconciliation and real production load/recovery testing: incomplete.

## Next concrete engineering action

Run the existing GitHub CI on main, repair failing builds/tests, then perform end-to-end tests against an authorized PostgreSQL database, a real compatible model, protected test connections and Stripe test mode. Confirm complete flows with evidence before any owner-approved production deployment.

## Completion reporting

Always report source implemented, tests passed, integrations verified, live deployed, real customer outcome and actual financial production separately. Never describe missing evidence as a passing result.
