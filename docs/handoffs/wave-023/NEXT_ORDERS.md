# Next Orders - Wave 23

Status: `MVP 5 CONTRACT-FIRST PLANNING`
Date: 2026-06-19

Wave 22 closed MVP4 product P0. Wave 23 opens MVP5, but only as a
contract-first planning wave. Do not begin broad runtime implementation until
PM freezes the enterprise/governance P0 thin slice and QA has a runnable
acceptance checklist.

## Common Rules

- Read `AGENTS.md` first.
- Read `.agents/skills/handoff-reporting/SKILL.md` before work.
- Read `docs/handoffs/CURRENT_STATE.md`.
- Read this file before making changes.
- Read Wave22 reports:
  - `docs/handoffs/wave-022/PM_REPORT.md`
  - `docs/handoffs/wave-022/BACKEND_REPORT.md`
  - `docs/handoffs/wave-022/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-022/QA_REPORT.md`
- Read MVP5 roadmap section in `00_PROJECT_ROADMAP_MVP_1_TO_5.md`.
- Preserve product rules:
  - candidate graph and published graph remain separated;
  - evidence/audit lineage remains mandatory for candidate/review/publish flows;
  - enterprise features must not weaken existing MVP1~MVP4 demo flows;
  - production SSO/provider integrations require explicit PM promotion.
- Use `docs/handoffs/REPORT_TEMPLATE.md`.
- Finish by writing your role report in `docs/handoffs/wave-023/{ROLE}_REPORT.md`.

## Execution Sequence

1. PM defines MVP5 P0 scope, exclusions, backlog, acceptance matrix, and ADR.
2. Backend drafts API/DTO/enum contract after PM report.
3. Frontend reviews IA/UX/API needs after PM report and Backend draft.
4. QA creates INT5 acceptance checklist after PM, Backend, and Frontend reports.

## MVP5 P0 Candidate Areas

PM must choose the smallest coherent P0 slice from these roadmap areas:

- Admin console and organization/project administration.
- RBAC/ABAC policy surface.
- API key/service account lifecycle and external API production-readiness path.
- Automatic approval policy in safe/dry-run-first form.
- Ontology import/export, starting with JSON and documenting RDF/Turtle/OWL/SHACL boundaries.
- Operations dashboard for jobs, retries, dead-letter queue, costs, logs, metrics, and traces.
- Backup/restore, retention/deletion policy, and governance documentation.
- Large graph performance guardrails and operator-facing monitoring.

Default recommendation for Wave23 planning:

- Treat SSO/OIDC as contract/documentation only unless PM explicitly promotes a
  runnable local stub.
- Treat API key/service account as local/dev contract plus masked-secret UX;
  production secret storage and rotation can be P1 unless PM promotes it.
- Treat automatic approval as policy definition plus dry-run evaluation first;
  direct publish without review must remain gated by evidence, validation, and
  audit policy.
- Treat import/export as contract-first with JSON as the first runnable thin
  slice candidate for Wave24. RDF/Turtle/OWL/SHACL can be planned with
  compatibility checks before broad parser/exporter implementation.
- Treat observability as local seed/runtime surfaces first: job status, retry,
  DLQ, cost budget, and structured event examples.

## PM Agent Order

Role: PM / MVP5 Scope and Governance Architect

Write report:

- `docs/handoffs/wave-023/PM_REPORT.md`

Primary backlog:

- `PM5-001` MVP5 prep brief and scope boundary
- `PM5-002` enterprise role/permission model
- `PM5-003` API key/service account policy
- `PM5-004` automatic approval policy
- `PM5-005` ontology import/export scope
- `PM5-006` operations/observability scope
- `PM5-007` retention/backup/governance policy
- `PM5-008` release/incident/admin training notes
- `PM5-009` MVP5 draft backlog
- `PM5-010` ADR for MVP5 enterprise boundary

Tasks:

- Create or update:
  - `docs/pm/MVP5_PREP_BRIEF.md`
  - `docs/backlog/MVP5_DRAFT_BACKLOG.md`
  - `docs/adr/0008-mvp5-enterprise-governance-boundary.md`
- Define MVP5 P0 demo flow. It should be operator/admin oriented, not another
  search/RAG demo.
- Freeze P0 vs P1 for:
  - RBAC/ABAC;
  - SSO/OIDC;
  - API keys/service accounts;
  - automatic approval;
  - ontology import/export formats;
  - query console;
  - worker scale-out/DLQ/retry;
  - cost limits;
  - observability;
  - backup/restore;
  - retention/deletion.
- Define canonical roles and permission dimensions. Include at least:
  - organization admin;
  - project admin;
  - ontology editor;
  - source manager;
  - reviewer;
  - publisher;
  - analyst/viewer;
  - external API consumer/service account.
- Define security invariants:
  - dev auth may remain for local MVP5 thin slices;
  - production SSO/OIDC is not implemented unless explicitly promoted;
  - secrets are masked and never stored or shown in reports/logs;
  - policy changes create audit records;
  - automatic approval cannot publish candidate facts without evidence,
    validation pass, version context, and auditable policy decision.
- Define P0 acceptance criteria and P1 exclusions.
- Give Backend and Frontend exact contract/UX questions to answer.

Validation:

- `git diff --check` for changed PM/backlog/ADR/report files.

## Backend Agent Order

Role: Backend / MVP5 API Contract Draft

Start condition:

- Read `docs/handoffs/wave-023/PM_REPORT.md`.

Write report:

- `docs/handoffs/wave-023/BACKEND_REPORT.md`

Primary backlog:

- `BE5-001` admin/org/project API draft
- `BE5-002` RBAC/ABAC DTO and policy draft
- `BE5-003` API key/service account API draft
- `BE5-004` automatic approval policy/evaluation API draft
- `BE5-005` ontology import/export job API draft
- `BE5-006` operations/job/DLQ/cost API draft
- `BE5-007` retention/backup governance API draft
- `BE5-008` audit/security event extension draft
- `BE5-009` deterministic seed/smoke plan
- `BE5-010` OpenAPI planning artifact

Tasks:

- Create or update:
  - `docs/api/MVP5_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp5-draft.json`
- Draft additive API/DTO/enum contract only. Do not implement runtime endpoints
  in Wave23 unless PM explicitly narrowed and requested it.
- Include endpoint groups aligned to PM P0:
  - admin organization/project settings;
  - role assignments and permission checks;
  - policy documents and policy evaluation preview;
  - API key/service account list/create/revoke with masked secret semantics;
  - import/export job create/status/download;
  - operations job dashboard, retry, DLQ, cost budget, observability summary;
  - backup/restore/retention policy read or dry-run endpoints if PM keeps them P0.
- Define enums and DTO names in PascalCase, JSON fields in snake_case, enum
  literals in UPPER_SNAKE_CASE.
- Preserve MVP4 external read-only API boundary. Production write/external API
  auth must not become implicit.
- Include examples for P0 demo responses.
- Include deterministic seed/smoke expectations for Wave24.
- Run JSON parse for `openapi-mvp5-draft.json`.

Validation:

- `python3 -m json.tool docs/api/openapi-mvp5-draft.json >/tmp/openapi-mvp5-draft.pretty.json`
- `git diff --check` for changed backend API docs/report files.

## Frontend Agent Order

Role: Frontend / MVP5 Admin UX Requirements

Start condition:

- Read `docs/handoffs/wave-023/PM_REPORT.md`.
- Read `docs/handoffs/wave-023/BACKEND_REPORT.md` if available.

Write report:

- `docs/handoffs/wave-023/FRONTEND_REPORT.md`

Primary backlog:

- `FE5-001` admin shell IA and navigation model
- `FE5-002` role/permission management UX
- `FE5-003` API key/service account UX
- `FE5-004` automatic approval policy UX
- `FE5-005` ontology import/export UX
- `FE5-006` operations dashboard UX
- `FE5-007` retention/backup governance UX
- `FE5-008` frontend API/DTO field review

Tasks:

- Create or update:
  - `docs/pm/MVP5_FRONTEND_UX_REQUIREMENTS.md`
- Do not implement broad UI routes in Wave23.
- Define MVP5 admin/operator IA:
  - where admin console lives in project/global navigation;
  - which pages are global organization scope vs project scope;
  - how permission-denied/read-only states appear;
  - how policy preview/dry-run states avoid accidental destructive action.
- Review Backend draft fields and list blocking/non-blocking DTO gaps.
- Define loading/empty/error/permission states for every P0 screen.
- Define visible security UX:
  - masked secrets;
  - one-time secret reveal;
  - revoke confirmation;
  - audit trail link;
  - policy change diff;
  - dry-run vs enforce markers.
- Define smoke-testable markers for Wave24 frontend implementation.

Validation:

- `git diff --check` for changed frontend requirements/report files.

## QA Agent Order

Role: Integration / QA

Start condition:

- Read Wave23 PM, Backend, and Frontend reports first.

Write report:

- `docs/handoffs/wave-023/QA_REPORT.md`

Primary backlog:

- `INT5-001` MVP5 contract review
- `INT5-002` authorization matrix review
- `INT5-003` API key/service account safety checklist
- `INT5-004` automatic approval policy safety checklist
- `INT5-005` ontology import/export acceptance checklist
- `INT5-006` operations/DLQ/cost observability checklist
- `INT5-007` retention/backup governance checklist
- `INT5-008` frontend admin UX state checklist
- `INT5-009` MVP1~MVP4 regression guard plan
- `INT5-010` local seed/smoke runnable plan

Tasks:

- Create or update:
  - `docs/backlog/INT5_MVP5_ACCEPTANCE.md`
- Verify Wave23 artifacts exist and are internally consistent:
  - `docs/pm/MVP5_PREP_BRIEF.md`
  - `docs/backlog/MVP5_DRAFT_BACKLOG.md`
  - `docs/adr/0008-mvp5-enterprise-governance-boundary.md`
  - `docs/api/MVP5_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp5-draft.json`
  - `docs/pm/MVP5_FRONTEND_UX_REQUIREMENTS.md`
- Parse `docs/api/openapi-mvp5-draft.json`.
- Check that P0/P1 boundaries are not contradictory across PM, Backend, and
  Frontend docs.
- Check security-sensitive boundaries:
  - no raw secret persistence or logging;
  - no implicit production SSO/OIDC implementation;
  - automatic approval remains evidence/validation/audit gated;
  - destructive admin operations require confirmation and auditability;
  - service accounts have explicit scope and revocation.
- Define Wave24 runnable acceptance gates for the first MVP5 thin slice.
- Recommend:
  - Wave24 thin implementation if contract is ready;
  - another planning hardening wave if P0 boundaries are ambiguous.

Validation:

- `python3 -m json.tool docs/api/openapi-mvp5-draft.json >/tmp/openapi-mvp5-draft.qa.pretty.json`
- `git diff --check` for changed QA/report files.

## Commander Notes

- Wave23 is successful when the MVP5 P0 thin slice is unambiguous and
  implementation can be split cleanly for Wave24.
- If PM cannot narrow MVP5, do not let Backend/Frontend implement broad
  enterprise features. Create a focused Wave24 planning-hardening wave instead.
- If Wave23 passes, Wave24 should implement the first runnable MVP5 slice with
  Backend and Frontend in parallel, then QA actual smoke last.
