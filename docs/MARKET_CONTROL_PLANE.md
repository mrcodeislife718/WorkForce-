# Workforce Market-Derived Control Plane

## Why this exists

The 2026 enterprise-agent market is converging on a clear production requirement: companies do not merely need agents; they need infrastructure that can deploy, govern, observe, evaluate, interrupt, and economically operate digital workers across heterogeneous models, frameworks, tools, and environments.

Workforce already has important pieces of that system: a worker marketplace, interviews and sample assignments, deployments, connector bindings, capability grants, approval requests, runtime jobs, execution records, health checks, billing primitives, and lifecycle operations. The next competitive step is to turn those pieces into a coherent **Workforce Control Plane**.

## Market signals converted into product requirements

| Market signal | Competitive requirement for Workforce | Existing foundation | Build target |
| --- | --- | --- | --- |
| Managed long-horizon agents are becoming a product category | Separate the worker's intelligence from its execution environment and make model/runtime providers replaceable | `modelProvider`, `JobRunner`, connectors | Provider-neutral execution contract + runtime adapters |
| Enterprises need one place to operate agents | Central control plane for every deployed worker | Deployments, events, task runs | Fleet inventory, scheduling, pause/resume/kill, health and policy state |
| Static permissions are insufficient | Enforce policy on every proposed action and across multi-step execution paths | Capability grants, human approvals, `CapabilityBroker` | Policy decision point before every capability execution; budgets and path constraints |
| Agent identity and delegated authority are enterprise requirements | Every worker/deployment/action must have attributable identity and attenuated authority | Worker + Deployment + grants | Deployment principal, delegation chain, scoped authority receipts |
| Production adoption requires observability | Trace task → plan → action → connector → result, with latency, errors and cost | TaskRun, CapabilityExecution, DeploymentEvent | Trace IDs, plan/action lineage, cost/token accounting, SLOs, fleet dashboards |
| Evaluation must continue after deployment | Promotion/retirement should depend on measured evidence, not catalog claims | Interviews, samples, reviews | Evaluation gates, canaries, scorecards, regression checks, evidence-backed worker ranking |
| Enterprise buyers demand auditability | Reconstruct exactly what a worker was allowed to do, attempted, did, and why | execution/event records | Tamper-evident receipts and exportable audit bundles |
| Data sovereignty and hybrid deployment matter | Workforce must not require one cloud/model vendor | connector/provider boundaries | self-hosted/private-cloud execution mode and customer-controlled secrets |
| Cost incidents are a production risk | Treat economics as a runtime control | billing service/catalog pricing | per-task budgets, per-worker spend caps, cost/performance metrics, automatic throttling |
| Enterprises will run agents from many frameworks/vendors | Workforce should manage external workers, not only workers authored inside Workforce | connector architecture | universal worker registration/runtime adapter contract |
| Failures need containment and recovery | Operators need interrupt, quarantine, rollback and replacement | deployment status + events | kill switch, quarantine, rollback checkpoints, replacement workflow |
| Agent catalogs are becoming enterprise infrastructure | Marketplace differentiation must be evidence, not listings | Store + samples + deployment | verified performance, compatibility, risk, cost and reliability profiles |

## Product position

Workforce should compete as the **operating and labor control plane for digital employees**, not as another agent framework.

The durable abstraction is:

`discover → evaluate → hire → authorize → connect → deploy → execute → observe → govern → measure → pay → improve/replace/retire`

Frameworks and models are suppliers beneath that abstraction. Workforce owns the employment, authority, execution evidence, economics, and lifecycle layer above them.

## Competitive completion gates

Workforce is not commercially complete until these gates are demonstrated:

1. **Universal runtime** — at least three materially different model/runtime providers can execute the same worker contract without changing business logic.
2. **Action-time governance** — every external side effect passes through a deterministic policy decision before execution.
3. **Fleet control** — an operator can inventory, pause, resume, quarantine, replace, and retire deployed workers centrally.
4. **End-to-end evidence** — every completed task can be reconstructed from assignment through plan, approvals, capability calls, results, cost, and final state.
5. **Continuous evaluation** — workers have production scorecards for task success, policy violations, approval burden, latency, reliability, and cost.
6. **Economic controls** — per-task and per-deployment budgets can prevent runaway spending.
7. **Sovereign deployment** — secrets and execution can remain in customer-controlled infrastructure.
8. **External worker support** — a worker built outside Workforce can be registered, governed, observed, and retired through the same lifecycle.
9. **Recovery** — unsafe or degraded workers can be stopped and replaced without losing the audit chain.
10. **Commercial proof** — benchmark evidence and customer usage demonstrate superiority on measurable dimensions.

## Mandatory commercial architecture

### USP
Hire and operate digital employees from any provider through one governed workforce system, with evidence from evaluation through production and replacement.

### Measurable superiority targets
- 100% of external side effects mediated by the capability/policy boundary.
- 100% of production tasks attributable to a deployment identity and trace.
- 100% of approval-required actions blocked until explicit approval.
- <1 minute fleet-wide quarantine target from operator command to execution denial.
- Reconstructable audit bundle for every production task.
- Provider replacement without changing the worker's business contract.
- Cost, latency, reliability, and task-success scorecards per worker and deployment.

### Moat
The compounding data asset is not prompts. It is longitudinal worker evidence: interviews, samples, permissions, deployments, action traces, approvals, outcomes, reliability, cost, compatibility, customer context, replacement history, and verified performance.

### Acquisition engine
Lead with a production migration wedge: companies with agent pilots that cannot safely reach production. Import their existing agents, connect approved tools, govern actions, measure results, then expand into marketplace workers and workforce bundles.

### Monetization
- Workforce platform subscription.
- Per-active-digital-employee fee.
- Usage/operation fee for governed executions.
- Marketplace take rate on third-party workers.
- Enterprise governance/compliance tier.
- Private-cloud/self-hosted enterprise license.
- Evaluation/certification fee for marketplace publishers.

### Cross-sell role
Workforce can consume Measure for independent evaluation/certification, Sessions for engineering/runtime memory and incident reconstruction, and Axion for portable worker/agent identity and provenance.

### Proof standard
Do not claim superiority from architecture alone. Publish reproducible comparisons measuring deployment time, task completion, policy interception, recovery time, audit completeness, approval burden, cost per successful task, provider portability, and reliability under injected failures.

## Execution order

### P0 — Control-plane enforcement
1. Add a deterministic policy engine in front of `CapabilityBroker.execute`.
2. Add per-task/deployment action and cost budgets.
3. Add emergency deployment quarantine/kill semantics.
4. Add trace/correlation IDs across runtime jobs, task runs, approvals and capability executions.
5. Record policy decisions as deployment evidence.

### P1 — Observability and evaluation
1. Production scorecards.
2. Cost/token/provider telemetry.
3. SLO and failure-rate aggregation.
4. Continuous evaluation gates and canary promotion.
5. Exportable audit bundles.

### P2 — Universal workforce
1. External worker registration contract.
2. Runtime/provider adapter interface.
3. Private/self-hosted execution workers.
4. Importers for major agent frameworks.
5. Delegation chains for manager/subordinate digital workers.

### P3 — Marketplace defensibility
1. Evidence-backed marketplace ranking.
2. Verified compatibility matrix.
3. Risk/reliability badges based on observed evidence.
4. Replacement recommendations based on cost/performance.
5. Publisher certification and revenue sharing.

The immediate implementation tranche starts with P0 because governance, identity, observability, containment, and economics are the recurring gaps exposed by the market and they amplify the value of infrastructure Workforce already has.