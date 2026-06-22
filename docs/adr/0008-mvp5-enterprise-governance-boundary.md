# ADR 0008: MVP 5 Enterprise Governance Boundary

## Status

Accepted

## Context

MVP 5 introduces enterprise operation, automation, security, and governance
features. The roadmap includes RBAC/ABAC, SSO/OIDC, API keys, service accounts,
automatic approval, ontology import/export, query consoles, observability,
backup/restore, cost controls, and retention policy.

This scope is broad enough to derail the product if all enterprise capabilities
are treated as P0. MVP1 through MVP4 already established strict product rules:
candidate graph and published graph are separated, evidence is required for
trust, review/publish lineage is auditable, RAG/search are read-only, and
development auth is acceptable for local thin slices. MVP5 needs a durable
boundary that adds governance without weakening those rules.

## Decision

- MVP5 P0 is an admin/operator governance thin slice, not another search/RAG
  demo.
- P0 demo flow centers on:
  - admin console and organization/project governance summary;
  - canonical role assignments and permission checks;
  - API key/service account local lifecycle with one-time secret reveal,
    masked future display, revoke confirmation, and audit;
  - automatic approval policy definition, dry-run preview, policy diff, and
    gated enforce mode;
  - JSON ontology import/export with dry-run compatibility, conflicts,
    warnings, destructive impact, and audit;
  - operations view for job health, retry, DLQ, cost budget, structured events,
    and observability availability;
  - retention and backup governance with policy view, deletion dry-run, backup
    snapshot metadata, restore dry-run, confirmation, and audit.
- Local development auth remains acceptable for MVP5 P0 implementation and
  smoke tests.
- Production SSO/OIDC, production secret rotation, vault/KMS integration,
  cross-region backup, full HA/distributed infrastructure, full SPARQL/Cypher
  console, full RDF/OWL/SHACL fidelity, and full customer-authored ABAC
  expression language are P1 unless explicitly promoted by a later PM decision.
- Canonical P0 roles are:
  - `ORGANIZATION_ADMIN`
  - `PROJECT_ADMIN`
  - `ONTOLOGY_EDITOR`
  - `SOURCE_MANAGER`
  - `REVIEWER`
  - `PUBLISHER`
  - `ANALYST_VIEWER`
  - `EXTERNAL_API_CONSUMER`
  - `SERVICE_ACCOUNT`
- P0 permission dimensions are principal type, organization/project scope,
  role, resource type, action, data state, version context, sensitivity, and
  environment.
- Automatic approval must be dry-run-first and audit-first. Enforce mode cannot
  publish candidate facts unless evidence, validation, ontology/version context,
  candidate eligibility, policy version, and auditable decision gates pass.
- Secrets are sensitive governance data. Raw secrets may be returned only once
  at creation time, must not appear in list/detail responses, logs, reports,
  fixtures, audit text, or UI after initial reveal, and must be shown only as
  masked values thereafter.
- Destructive operations require impact preview and confirmation. This includes
  credential revoke, import overwrite, retention deletion, backup restore, and
  DLQ purge/acknowledge if such actions are added.

## Consequences

- Backend can draft MVP5 APIs additively without building production identity
  provider integration or distributed infrastructure first.
- Frontend can design a focused admin console with permission-aware states,
  masked-secret UX, dry-run/enforce distinction, policy diffs, and audit links.
- QA can create deterministic local acceptance around authorization matrix,
  one-time secret reveal, automatic approval safety gates, JSON import/export,
  operations/DLQ/cost visibility, retention/backup dry-run, and MVP1-MVP4
  regression guards.
- Enterprise features become safe to expand in later waves because P0 freezes
  the security invariants and P1 exclusions before runtime work starts.
- The platform continues to preserve candidate/published graph separation,
  evidence traceability, review/publish lineage, and read-only RAG/search
  boundaries while adding automation and governance.
