# INT-001 MVP 1 Demo Acceptance Report

## Review Snapshot

- Date: 2026-06-17
- Owner: PM/Architecture Agent
- Scope: INT-001 demo flow, INT-002 enum sync, INT-003 contract review, INT-004 closeout checklist
- Current status: **PARTIAL / ACCEPTANCE CLOSEOUT REQUIRED**
- Source documents:
  - `docs/backlog/MVP1_BACKLOG.md`
  - `docs/api/API_CONTRACT_PRIORITY_MVP1.md`
  - `docs/api/openapi-mvp1.json`
  - `docs/pm/PRD_MVP1.md`
  - `docs/pm/IA_MVP1.md`
  - `docs/pm/GLOSSARY.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-004/QA_REPORT.md`
  - `docs/handoffs/wave-005/BACKEND_REPORT.md`

## Executive Result

INT-001 is not closed yet. Backend P0 API regression and OpenAPI freshness are reported PASS in Wave 5, but full MVP 1 demo acceptance still requires actual FE-to-BE UI evidence and browser/manual UAT evidence.

Closeout rules:

- Backend API full flow alone is **partial evidence**.
- Frontend mock route smoke alone is **partial evidence**.
- Full pass requires at least one `VITE_USE_MOCK_API=false` actual FE-to-BE smoke covering Source list/detail/upload/preview.
- Full pass also requires Ontology authoring actual API smoke for draft/class/property/relation.
- Browser click smoke is preferred. If browser automation is unavailable, QA must leave manual UAT checklist evidence, environment, and not-run reason for PM exception review.
- `/api/v1/dashboard` is excluded from MVP 1 actual API. Any remaining frontend actual API call to that endpoint is a contract mismatch, not a backend backlog item.

## Current Closeout Checklist

| Area | Required evidence | Status | Notes / blockers | Linked backlog IDs |
|---|---|---:|---|---|
| Backend health/auth | `/health`, `/api/v1/me` smoke | PASS | Wave 5 backend regression reports PASS. | BE-001, BE-009 |
| Backend Project API | create/list/detail/update/archive smoke and OpenAPI exposure | PASS | Wave 5 backend regression reports PASS. | BE-003, BE-010 |
| Backend Ontology API | version/class/property/relation/graph smoke and OpenAPI exposure | PASS | Wave 5 backend regression reports PASS. Graph canonical fields remain `nodes`, `edges`, `properties`. | BE-004, BE-005, BE-010 |
| Backend Source API | upload/list/detail/preview smoke and OpenAPI exposure | PASS | Wave 5 backend regression reports Source API paths and tests PASS. | BE-006, BE-007, BE-010 |
| OpenAPI freshness | `docs/api/openapi-mvp1.json` equals current backend export | PASS | Wave 5 backend freshness check reports `fresh=True`. | BE-010, INT-003 |
| Enum sync | `SourceStatus`, `SourcePreviewStatus`, `Cardinality`, graph status enums align | PARTIAL | Backend/OpenAPI side PASS. Frontend/QA Wave 5 evidence is still pending in this report snapshot. | INT-002, FE-009 |
| Dashboard actual API boundary | Actual API mode must not call `/api/v1/dashboard` | OPEN | MVP 1 decision: do not add backend endpoint. Frontend must compute from P0 APIs or keep mock-only/P1 boundary. | FE-013, INT-003 |
| Graph compatibility nullable type | FE type must tolerate optional/deprecated compatibility fields if present | OPEN | New UI/QA criteria use `nodes`, `edges`, `properties`; compatibility `classes`, `relations` must not be canonical. | FE-009, INT-003 |
| Source actual FE-to-BE | `VITE_USE_MOCK_API=false` Source list/detail/upload/preview smoke | PARTIAL | Wave 4 reported actual HTTP Source flow evidence, but browser click upload/preview evidence remains incomplete. | FE-006, FE-007, FE-009, INT-001 |
| Ontology authoring actual FE-to-BE | draft/class/property/relation creation or update through UI/API boundary | OPEN | Required before INT-001 full pass. | FE-014, INT-001 |
| Browser/manual UAT | Browser click smoke or manual UAT checklist with reason | OPEN | Browser automation preferred; manual evidence acceptable only with explicit PM exception review. | INT-005, QA |
| Local infra compose | Docker Compose smoke | BLOCKED | Wave 5 backend reports `docker: command not found`. Needs Docker-capable environment or PM environment exception. | BE-002, QA |

## INT-001 Demo Flow Pass Criteria

| Step | Expected result | Pass evidence |
|---|---|---|
| 1. Local entry | User opens frontend in dev mode and backend is reachable. | Browser/manual evidence plus `/health` and `/api/v1/me` result. |
| 2. Project creation | User creates or selects the demo project and sees project detail. | Actual API request/response or UI trace with project ID. |
| 3. Ontology draft | User creates or selects a draft ontology version. | Actual API request/response or UI trace with `version_id`. |
| 4. Class/property/relation authoring | User creates class nodes, properties, and relations with full enum-compatible cardinality. | Actual API evidence for class/property/relation writes and graph read. |
| 5. Graph confirmation | Modeler renders class nodes, relation edges, and properties for the same `version_id`. | UI evidence uses canonical `OntologyGraph.nodes[]`, `edges[]`, `properties[]`. |
| 6. Source upload | User uploads CSV/Excel and source appears in list/detail. | `VITE_USE_MOCK_API=false` UI/API evidence. |
| 7. Source preview | User opens source detail and sees columns, sample rows, and warnings. | Actual preview response and UI evidence. |
| 8. Status display | Source status and preview status are shown separately. | UI evidence shows `SourceStatus` and `SourcePreviewStatus` as distinct fields/badges. |
| 9. Dashboard boundary | Dashboard does not fail because `/api/v1/dashboard` is absent. | Actual API mode evidence shows no request to `/api/v1/dashboard`, or dashboard kept behind mock-only/P1 boundary. |

## API / Enum / DTO Decisions Locked for Closeout

| Decision | Closeout rule |
|---|---|
| Canonical OpenAPI artifact | `docs/api/openapi-mvp1.json` is the source for INT-002/INT-003. |
| `/api/v1/dashboard` | Excluded from MVP 1 actual API. Frontend boundary issue only; no backend endpoint. |
| `OntologyGraph` | Canonical fields are `nodes[]`, `edges[]`, `properties[]`. `classes[]`, `relations[]` are optional/deprecated compatibility fields only. |
| `Cardinality` | FE relation/edge type must accept the full OpenAPI enum. |
| `SourceStatus` | Delete/archive values are not added. Source delete uses backend internal `is_deleted`. |
| `SourcePreviewStatus` | Remains separate from `SourceStatus`; CSV/Excel preview uses `READY`, TXT/PDF can use `NOT_AVAILABLE`. |

## Remaining Blockers for MVP 1 Closeout

1. Frontend actual API mode must remove or replace `/api/v1/dashboard` calls.
2. Frontend must align `OntologyGraph.classes`/`relations` compatibility typing with OpenAPI nullable optional shape if those fields remain in types.
3. Ontology authoring actual API smoke must be demonstrated.
4. Browser click smoke or manual UAT evidence must be recorded.
5. Docker Compose smoke remains blocked until a Docker-capable environment is available or PM accepts an environment exception.
6. QA must rerun INT-002/INT-003 and mark INT-001 PASS/PARTIAL after Frontend Wave 5 evidence lands.

## MVP 2 Boundary

MVP 2 design draft review may continue, but implementation must not begin until MVP 1 `INT-001`, `INT-002`, and `INT-003` are PASS or explicitly accepted as PM exceptions. MVP 2 work must not be used to hide unresolved MVP 1 blockers.
