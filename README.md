# Workforce

**A digital workforce marketplace, deployment, governance, and workforce-operations platform.**

> **Powering the AI Workforce.**

Workforce is designed to make digital workers discoverable, testable, governable, deployable, monitorable, updateable, replaceable, and removable through one commercial platform.

The product combines **Workforce Store**, **Workforce Console**, and **Workforce Protect**. It is not merely an agent directory or prompt marketplace. Workforce manages the lifecycle of digital labor from publishing and discovery through permission review, subscription, installation, operation, monitoring, support, rollback, and removal.

## Product system

```text
Workforce
├── Workforce Store
├── Workforce Console
└── Workforce Protect
```

### Workforce Store

The marketplace and discovery surface for digital workers.

It is designed to support:

- worker categories, collections, search, and filtering;
- worker profiles, capabilities, supported tasks, and demonstrations;
- pricing and subscription models;
- required tools, integrations, and permissions;
- versions, release notes, and lifecycle status;
- ratings, reviews, and deployment history;
- publisher and ownership information;
- installation and purchase workflows.

### Workforce Console

The customer's digital-workforce operating center.

It is designed to manage:

- subscribed and installed workers;
- workspace and tool connections;
- deployment state;
- permission grants and revocation;
- worker configuration;
- activity and performance;
- usage and cost visibility;
- updates and version changes;
- pause, replacement, rollback, and uninstall;
- support, incidents, and operational history.

### Workforce Protect

The trust, permission, safety, and governance layer.

It is designed to provide:

- pre-installation permission review;
- capability and data-access boundaries;
- connector and workspace authorization;
- sandbox evaluation;
- policy and risk checks;
- activity and execution records;
- alerting and incident review;
- version and publisher integrity;
- emergency pause and revocation;
- controlled rollback and uninstall.

## Digital worker lifecycle

```text
Creator or publisher submits worker
    -> identity and version recorded
    -> capabilities and permissions declared
    -> technical and policy review
    -> sandbox evaluation and evidence
    -> listing published in Workforce Store
    -> customer discovers and evaluates worker
    -> subscription or purchase
    -> permission review and authorization
    -> connectors and workspace configured
    -> worker deployed
    -> activity, quality, usage, and cost monitored
    -> update, pause, replace, roll back, or uninstall
```

## Platform architecture

```text
Public and customer surfaces
├── Workforce Store
├── Worker profile and comparison
├── Customer account and billing
├── Creator and publisher portal
└── Support and documentation
              │
              ▼
Identity and commercial layer
├── Users and organizations
├── Publishers and creators
├── Worker identities and versions
├── Pricing, subscriptions, and entitlements
└── Ratings, reviews, and commercial records
              │
              ▼
Trust and evaluation
├── Capability manifests
├── Permission declarations
├── Integration requirements
├── Sandbox and demonstration runs
├── Policy and security review
└── Verification and release evidence
              │
              ▼
Deployment and connectors
├── Workspace selection
├── OAuth and credential authorization
├── Slack, Gmail, Shopify, Notion, HubSpot, and other connectors
├── Installation and configuration
├── Deployment state
└── Update, pause, rollback, replacement, and uninstall
              │
              ▼
Workforce Console
├── Active workforce inventory
├── Worker activity and status
├── Usage and cost
├── Performance and quality
├── Permission and connector controls
└── Incidents, support, and lifecycle history
              │
              ▼
Workforce Protect
├── Policy enforcement
├── Data and tool boundaries
├── Monitoring and alerts
├── Execution and audit records
├── Revocation and emergency controls
└── Trust and integrity services
```

## Current implementation foundation

The current repository contains an initial frontend and backend implementation foundation for **Workforce Store**.

The existing implementation includes:

- Node.js and Express;
- PostgreSQL through Sequelize;
- JWT-based authentication;
- user, worker, worker-permission, deployment, and review models;
- subscription, one-time, and free pricing models;
- worker version and release-note records;
- deployment states including pending, active, paused, and uninstalled;
- connector-oriented deployment records;
- Slack, Gmail, Shopify, Notion, and HubSpot permission categories;
- seed data for initial digital-worker profiles;
- frontend and backend product surfaces.

The repository is an implementation foundation for the larger Workforce architecture. Planned product surfaces are not presented as completed unless supported by the current source.

## Security and governance

- Explicit capability and permission declarations
- No operational authority from marketplace presence alone
- Customer approval before connector or workspace access
- Protected provider tokens and credentials
- Product- and workspace-scoped deployment records
- Versioned worker and permission history
- Sandboxed evaluation before protected deployment where applicable
- Pause, revocation, rollback, replacement, and uninstall controls
- Auditability for consequential permission and deployment changes
- Separation between publisher claims and supporting evidence
- Human customer authority over installed digital labor

## Commercial direction

Workforce is designed to support revenue through:

- digital-worker subscriptions;
- one-time worker licenses;
- marketplace transaction fees;
- creator and publisher revenue sharing;
- enterprise workforce management;
- Workforce Protect governance services;
- private catalogs and organization deployments;
- integration, support, and deployment services;
- performance, analytics, and workforce-intelligence products.

## Product boundary

Workforce is an independent product with its own marketplace, deployment model, governance layer, source, brand, and commercial identity.

Workforce may integrate with Axion, Teamwork, Sessions, Codeable, Epiphany, or other systems through controlled interfaces, but it is not a feature or submodule of those products.

## Repository boundary

This repository contains the controlled public Workforce Store implementation and product documentation. Proprietary worker definitions, complete catalog data, protected evaluation methods, customer credentials, connector secrets, Workforce Protect policies, enterprise configurations, and commercial operating assets remain private.

## Ownership

Workforce is independently designed and developed by **Charles Castillo**, Software Engineer and AI Systems Engineer.

All rights reserved. No source, architecture, worker catalog, documentation, branding, deployment system, governance system, or commercial rights are granted without explicit written authorization.
