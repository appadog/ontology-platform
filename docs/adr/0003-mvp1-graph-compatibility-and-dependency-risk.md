# ADR 0003: MVP 1 Graph Compatibility and Dependency Risk

## Status

Accepted

## Context

Wave 2 backend reported that `OntologyGraph` responses include canonical graph-oriented fields and additional raw ontology fields:

- canonical: `nodes`, `edges`, `properties`
- compatibility: `classes`, `relations`

Wave 2 frontend also reported two dependency issues:

- `hana-style-component` GitHub dependency prepare/build script is slow, so install was performed with `npm install --ignore-scripts`.
- `npm audit` reports 5 vulnerabilities.

Wave 3 backend reported the `BE-010` type sharing decision and source delete behavior:

- Backend exports `docs/api/openapi-mvp1.json` as the canonical OpenAPI artifact.
- Frontend may generate types from that file or manually synchronize its `shared/api` types against it.
- QA uses that file for INT-002/INT-003 contract review.
- Source delete is implemented as internal `is_deleted` soft delete without adding `ARCHIVED` or `DELETED` to `SourceStatus`.

PM must keep the MVP 1 contract stable for Backend, Frontend, and QA while deciding whether dependency findings are release blockers, risks, or follow-up tasks.

## Decision

- `OntologyGraph.nodes[]`, `OntologyGraph.edges[]`, and `OntologyGraph.properties[]` remain the canonical contract.
- Backend may return `classes[]` and `relations[]` only as compatibility fields during the MVP 1 transition period.
- Frontend new work and QA contract review must judge graph compatibility against `nodes[]`, `edges[]`, and `properties[]`, not `classes[]` or `relations[]`.
- `hana-style-component` install script delay is tracked as an MVP 1 dependency risk, not as a P0 blocker, because the frontend currently builds with `npm install --ignore-scripts` and the adapter boundary is present.
- `npm audit` 5 findings are split into a separate P2 frontend task, `FE-011 Dependency hardening`, because vulnerability review should produce a patch/override/replace decision rather than remain an informal note.
- `BE-010` is accepted: `docs/api/openapi-mvp1.json` is the canonical OpenAPI export for MVP 1 contract review and type sharing.
- Source delete is accepted as internal soft delete. It does not change `SourceStatus`; deleted sources are excluded from list/detail/preview and project `source_count`.

## Consequences

- Backend can preserve `classes` and `relations` for backward compatibility without changing the canonical API contract.
- Frontend should migrate any graph UI/type usage that depends on `classes` or `relations` to `nodes`, `edges`, and `properties`.
- QA should not fail Backend solely for returning `classes` and `relations`, but should fail FE/contract review if canonical fields are missing or ignored.
- The current `docs/api/openapi-mvp1.json` may still include `classes` and `relations` in the `OntologyGraph` schema. This is tolerated as a transition artifact, but generated frontend code should treat canonical `nodes`, `edges`, `properties` as the source of UI behavior.
- Backend should mark `classes` and `relations` optional/deprecated in a follow-up OpenAPI cleanup if generated clients are forced to treat compatibility fields as required.
- Dependency install delay is visible as risk, while security findings have an owned backlog path.
- Source archive/delete UX should not display `ARCHIVED` or `DELETED` as `SourceStatus` in MVP 1.

## Follow-up

- Frontend: update `OntologyGraph` types, mocks, and modeler usage to canonical `nodes`, `edges`, `properties`.
- Backend: keep OpenAPI examples centered on canonical graph fields; mark `classes`, `relations` compatibility-only if included in schema.
- QA: include canonical graph field assertions in INT-002/INT-003.
- QA: use `docs/api/openapi-mvp1.json` as the contract artifact for OpenAPI vs FE type/mock review.
- PM: revisit the OpenAPI compatibility-field cleanup after QA reports INT-003 findings.
