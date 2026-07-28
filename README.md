# ORCA

**A digital labor marketplace, deployment, governance, and workforce-operations platform.**

> **Powering the AI Workforce.**

ORCA is designed to make digital employees discoverable, testable, governable, deployable, monitorable, and replaceable through one commercial platform.

The product combines **ORCA Store**, **ORCA Console**, and **ORCA Protect** across a catalog designed for approximately **650 digital employees**. It is not merely an agent directory or downloadable prompt marketplace. ORCA manages the complete lifecycle of digital labor from publishing and discovery through permission review, subscription, installation, operation, monitoring, support, rollback, and removal.

## Mission

ORCA is designed to create a professional operating market for digital employees that organizations can evaluate and deploy with the same seriousness applied to software, vendors, and human workforce systems.

Its goals are to:

- provide a large organized catalog of specialized digital employees;
- make worker capabilities, permissions, integrations, versions, pricing, and evidence understandable before deployment;
- allow customers to test workers safely before granting operational access;
- manage subscriptions, installation, connectors, workspace deployment, and lifecycle state;
- give customers one console for their active digital workforce;
- protect organizations through permission review, monitoring, policy, auditability, pause, replacement, rollback, and uninstall;
- support creators and publishers with worker submission, versioning, distribution, earnings, and performance information;
- operate as the commercial infrastructure layer for digital labor.

## Product system

```text
ORCA
├── ORCA Store
├── ORCA Console
└── ORCA Protect
```

### ORCA Store

The marketplace and discovery surface for digital employees.

ORCA Store is intended to support:

- worker categories and collections;
- search, filtering, and recommendations;
- worker profiles and demonstrations;
- capabilities and supported tasks;
- pricing and subscription models;
- required tools, integrations, and permissions;
- versions, release notes, and status;
- ratings, reviews, and deployment history;
- publisher and ownership information;
- installation and purchase workflows.

### ORCA Console

The customer’s digital workforce operating center.

ORCA Console is intended to manage:

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

### ORCA Protect

The trust, permission, safety, and governance layer.

ORCA Protect is intended to provide:

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

## Digital employee lifecycle

```text
Creator or publisher submits worker
    -> worker identity and version recorded
    -> capabilities and permissions declared
    -> technical and policy review
    -> sandbox evaluation and evidence
    -> listing published in ORCA Store
    -> customer discovers and evaluates worker
    -> subscription or purchase
    -> permission review and authorization
    -> connectors and workspace configured
    -> worker deployed
    -> activity, quality, usage, and cost monitored
    -> update, pause, replace, roll back, or uninstall
```

## Intended platform architecture

```text
Public and customer surfaces
├── ORCA Store
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
ORCA Console
├── Active workforce inventory
├── Worker activity and status
├── Usage and cost
├── Performance and quality
├── Permission and connector controls
└── Incidents, support, and lifecycle history
              │
              ▼
ORCA Protect
├── Policy enforcement
├── Data and tool boundaries
├── Monitoring and alerts
├── Execution and audit records
├── Revocation and emergency controls
└── Trust and integrity services
```

## Worker record

A complete ORCA worker record is intended to bind:

- canonical worker identity;
- publisher and ownership;
- category and description;
- supported tasks and capabilities;
- required tools and permissions;
- supported connectors and deployment environments;
- pricing model and commercial terms;
- version and release notes;
- evaluation and demonstration evidence;
- status, deprecation, and replacement information;
- ratings, reviews, deployments, and operational performance;
- support and documentation.

## Current repository foundation

The current repository contains an initial frontend and backend implementation snapshot for ORCA Store.

The existing backend foundation includes:

- Node.js and Express;
- PostgreSQL through Sequelize;
- JWT-based authentication;
- user, worker, worker-permission, deployment, and review models;
- subscription, one-time, and free pricing models;
- worker version and release-note records;
- deployment state including pending, active, paused, and uninstalled;
- connector-oriented deployment records;
- Slack, Gmail, Shopify, Notion, and HubSpot permission categories;
- seed data for initial digital employee profiles;
- frontend and backend product surfaces.

This implementation is a foundation for the larger ORCA architecture. The full approximately 650-worker catalog, complete evaluation system, ORCA Console, and ORCA Protect should not be treated as implemented merely because they are part of the intended product.

## Creator and publisher system

ORCA is intended to support a two-sided ecosystem in which qualified creators and organizations can publish digital employees while customers retain clear control over what they install.

Publisher capabilities include:

- worker creation and submission;
- profile, media, demonstration, and documentation management;
- capabilities, tools, permissions, and integration declarations;
- pricing and licensing configuration;
- versioning and release management;
- customer support and incident response;
- deployment, review, usage, and earnings reporting;
- deprecation and successor-worker management.

## Workforce operations

ORCA treats digital employees as durable operational assets rather than one-time downloads.

The workforce layer is intended to track:

- assigned organization and workspace;
- configured tools and access;
- current version and deployment state;
- operating schedule and task class;
- activity, quality, errors, and outcomes;
- cost and usage;
- permission changes;
- updates and incidents;
- support, replacement, rollback, and removal history.

## Security and governance

- Explicit capability and permission declarations
- No operational authority from marketplace presence alone
- Customer approval before connector or workspace access
- Encrypted provider tokens and credentials
- Product- and workspace-scoped deployment records
- Versioned worker and permission history
- Sandboxed evaluation before protected deployment where applicable
- Pause, revocation, rollback, replacement, and uninstall controls
- Auditability for consequential permission and deployment changes
- Separation between publisher claims and supporting evidence
- Human customer authority over installed digital labor

## Commercial model

ORCA is designed to support revenue through:

- digital employee subscriptions;
- one-time worker licenses;
- free workers with paid services or upgrades;
- marketplace transaction fees;
- creator and publisher revenue sharing;
- enterprise workforce management;
- ORCA Protect governance services;
- private catalogs and organization deployments;
- integration, support, and deployment services;
- performance, analytics, and workforce-intelligence products.

## Independent product boundary

ORCA is an independent product with its own marketplace, deployment model, governance layer, source, brand, and commercial identity.

ORCA may integrate with Axion, Teamwork, Sessions, Codeable, Epiphany, or other systems through controlled interfaces, but it is not a feature or submodule of those products.

## Repository boundary

This repository contains the controlled public ORCA Store implementation and product documentation. Proprietary worker definitions, complete catalog data, protected evaluation methods, customer credentials, connector secrets, ORCA Protect policies, enterprise configurations, and commercial operating assets are maintained privately.

## Ownership and licensing

ORCA is independently designed and developed by **Charles Castillo**, Software Engineer and AI Systems Engineer.

All rights reserved. No source, architecture, worker catalog, documentation, branding, deployment system, governance system, or commercial rights are granted without explicit written authorization.
