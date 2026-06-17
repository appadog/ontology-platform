# INT-001 MVP 1 Demo Acceptance Report

## Review Snapshot

- Date: 2026-06-17
- QA owner: Integration/QA Agent
- Scope: INT-001 demo flow and INT-002/INT-003 contract alignment
- Source documents:
  - `docs/backlog/MVP1_BACKLOG.md`
  - `docs/pm/PRD_MVP1.md`
  - `docs/pm/IA_MVP1.md`
  - `docs/pm/GLOSSARY.md`
  - `docs/api/API_CONTRACT_PRIORITY_MVP1.md`
  - `docs/adr/0002-mvp1-p0-contract-and-demo-flow.md`
  - `AGENTS.md`

## Executive Result

Overall INT-001 status: **FAIL / NOT RUNNABLE**

The MVP 1 demo flow is clearly specified in PM/API documents, but backend and frontend implementations are not present yet. Evidence:

- `apps/backend` currently contains only `README.md` and `app/.gitkeep`.
- `apps/frontend` currently contains only `README.md` and `src/.gitkeep`.
- No `pyproject.toml`, `package.json`, `openapi.json`, `openapi.yaml`, or local `docker-compose.yml` was found within the app/infra implementation paths.
- The current backlog already marks ontology version/property, source upload, and source preview work as P0, so the remaining blocker is implementation rather than priority alignment.

This means runtime validation cannot proceed beyond document review. PM/API document blockers found during review have been resolved by ADR 0002 and the updated PRD/IA/API/Glossary documents, but all user-facing INT-001 steps are marked fail or blocked until BE-001/BE-010 and FE-001/FE-009 establish runnable app and contract surfaces.

## INT-001 Demo Flow Checklist

| Step | Expected result | Status | Evidence / notes | Linked backlog IDs |
|---|---|---:|---|---|
| Local app entry | User enters dev mode and sees current roles plus project selector. | FAIL | No backend `/api/v1/me`; no frontend app shell, topbar, or project selector implementation. | BE-001, BE-009, FE-001, FE-002, FE-004, INT-001 |
| Health check | `GET /health` confirms backend is running. | FAIL | No FastAPI entrypoint or route implementation exists. | BE-001, BE-010, INT-001 |
| Project creation | User creates `기업 문서 온톨로지 Demo` project and sees detail. | FAIL | `POST /api/v1/projects` and project screens are not implemented. | BE-003, FE-004, INT-001 |
| Ontology draft version | User creates or selects an ontology draft version for the project. | FAIL | Ontology version is P0 in the backlog/API contract, but no implementation exists. | BE-005, FE-005, INT-001 |
| Class creation | User creates `Company`, `Person`, `Department`, `Document`, `Contract`. | FAIL | Class API and modeler UI are not implemented. | BE-004, FE-005, INT-001 |
| Property creation | User creates class properties with data type, cardinality, and required state. | FAIL | Property API is P0 in the backlog/API contract, but no implementation exists. | BE-005, FE-005, INT-001 |
| Relation creation | User creates relations with domain/range/cardinality. | FAIL | Relation API and UI are not implemented. | BE-004, FE-005, INT-001 |
| Graph confirmation | User sees class nodes, relation edges, and property list in the modeler canvas for the same `version_id`. | FAIL | Graph API and React Flow/modeler UI are not implemented. | BE-004, FE-005, INT-001 |
| Source upload | User uploads CSV/Excel and sees the source in the list. | FAIL | Upload/list API and source UI are P0 in the backlog/API contract, but no implementation exists. | BE-006, FE-006, INT-001 |
| Source status display | Source list shows `SourceStatus` and `SourcePreviewStatus` separately. | FAIL | UI is not implemented. PRD now states `SourceStatus=UPLOADED` and `SourcePreviewStatus=READY` separately. | PM-005, INT-002, FE-006 |
| Preview confirmation | User opens source detail and sees columns, sample rows, and warnings. | FAIL | Preview API/UI are P0 in the backlog/API contract, but no implementation exists. | BE-007, FE-007, INT-001 |
| Enum consistency | API/UI enum strings match `docs/pm/GLOSSARY.md`. | BLOCKED | No OpenAPI schema or frontend types/mocks exist to compare. Document-level enum source of truth is now fixed. | PM-005, BE-010, FE-009, INT-002, INT-003 |

## Contract Review

### Backend OpenAPI

Status: **FAIL / MISSING**

Expected P0 surfaces from `docs/api/API_CONTRACT_PRIORITY_MVP1.md`:

| Domain | Required endpoints | Status | Linked backlog IDs |
|---|---|---:|---|
| Health / Dev Auth | `GET /health`, `GET /api/v1/me` | Missing | BE-001, BE-009, BE-010 |
| Project | `GET/POST /api/v1/projects`, `GET/PATCH/DELETE /api/v1/projects/{project_id}` | Missing | BE-003, BE-010 |
| Ontology Version | `GET/POST /api/v1/projects/{project_id}/ontology/versions`, `POST /api/v1/ontology/versions/{version_id}/publish` | Missing | BE-004, BE-005, BE-010 |
| Ontology Class | `GET/POST /api/v1/ontology/versions/{version_id}/classes`, `PATCH/DELETE /api/v1/ontology/classes/{class_id}` | Missing | BE-004, BE-010 |
| Ontology Property | `GET/POST /api/v1/ontology/versions/{version_id}/properties`, `PATCH/DELETE /api/v1/ontology/properties/{property_id}` | Missing | BE-005, BE-010 |
| Ontology Relation | `GET/POST /api/v1/ontology/versions/{version_id}/relations`, `PATCH/DELETE /api/v1/ontology/relations/{relation_id}` | Missing | BE-004, BE-010 |
| Ontology Graph | `GET /api/v1/ontology/versions/{version_id}/graph` | Missing | BE-004, BE-010 |
| Source | `GET /api/v1/projects/{project_id}/sources`, `POST /api/v1/projects/{project_id}/sources/upload`, `GET/DELETE /api/v1/sources/{source_id}` | Missing | BE-006, BE-010 |
| Source Preview | `GET /api/v1/sources/{source_id}/preview` | Missing | BE-007, BE-010 |

### Frontend Mock / API Types

Status: **FAIL / MISSING**

Expected frontend contract surfaces:

| Surface | Expected owner | Status | Linked backlog IDs |
|---|---|---:|---|
| Vite/React/TypeScript app shell | Frontend | Missing | FE-001, FE-002 |
| `src/shared/api` API client/type boundary | Frontend | Missing | FE-009, INT-003 |
| `src/shared/mocks` fixtures for Project/Ontology/Source | Frontend | Missing | FE-009, INT-001 |
| Project list/detail screens | Frontend | Missing | FE-004 |
| Ontology modeler with graph canvas | Frontend | Missing | FE-005 |
| Source upload/list screen | Frontend | Missing | FE-006 |
| Source detail/preview screen | Frontend | Missing | FE-007 |
| Loading/empty/error/permission states | Frontend | Missing | FE-004, FE-005, FE-006, FE-007 |

## Enum / DTO / API Findings

| ID | Type | Finding | Impact | Linked backlog IDs | Recommended action |
|---|---|---|---|---|---|
| QA-INT-001-01 | Missing API | Backend OpenAPI is not available, so no generated or manual contract comparison can run. | Blocks INT-001 and INT-003. | BE-001, BE-010, INT-003 | Scaffold FastAPI, expose `/docs`, and export OpenAPI before frontend contract freeze. |
| QA-INT-001-02 | Missing FE type surface | Frontend `shared/api` and `shared/mocks` do not exist. | Blocks FE mock/API comparison and UI acceptance. | FE-001, FE-009, INT-003 | Scaffold frontend app and create API DTO/mocks from the API priority document. |
| QA-INT-001-03 | Resolved enum wording mismatch | PRD now states `SourceStatus=UPLOADED` and `SourcePreviewStatus=READY` separately. | Implementation can now bind distinct badges/fields. | PM-005, INT-002, FE-006, BE-006 | Verify during INT-002. |
| QA-INT-001-04 | Resolved DTO ambiguity | `OntologyGraph` now uses `nodes[]`, `edges[]`, and `properties[]` with explicit graph node/edge DTOs. | Backend and frontend graph payload shape is clear. | BE-004, BE-010, FE-005, INT-003 | Verify during OpenAPI review. |
| QA-INT-001-05 | Resolved mock response gap | API contract now includes P0 happy-path examples for project detail, graph, source data, and source preview. | Frontend can seed `shared/mocks` from examples. | PM-003, BE-010, FE-009, INT-003 | Keep OpenAPI examples and FE mocks aligned. |

## Next QA Gate

Rerun INT-001 after the following minimum surfaces exist:

1. BE-001 exposes runnable FastAPI app and `/health`.
2. BE-010 exposes OpenAPI with P0 DTO schemas and examples.
3. FE-001/FE-002 expose a runnable app shell.
4. FE-009 provides `shared/api` types and `shared/mocks` fixtures.
5. PM-003/PM-005 decisions remain aligned with ADR 0002 while implementation proceeds.

When those are ready, the next pass should execute the full flow:

```text
GET /health
GET /api/v1/me
POST /api/v1/projects
GET /api/v1/projects/{project_id}
POST /api/v1/projects/{project_id}/ontology/versions
POST /api/v1/ontology/versions/{version_id}/classes
POST /api/v1/ontology/versions/{version_id}/properties
POST /api/v1/ontology/versions/{version_id}/relations
GET /api/v1/ontology/versions/{version_id}/graph
POST /api/v1/projects/{project_id}/sources/upload
GET /api/v1/sources/{source_id}
GET /api/v1/sources/{source_id}/preview
```
