# Frontend Report - Wave 14

## 담당 범위
- backlog ID: `FE3-001`, `FE3-002`, `FE3-003`, `FE3-004`, `FE3-005`, `FE3-006`, `FE3-007`, `FE3-008`; support `INT3-001`~`INT3-007`
- 작업 경로:
  - `docs/pm/MVP3_FRONTEND_UX_REQUIREMENTS.md`
  - `docs/handoffs/wave-014/FRONTEND_REPORT.md`

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-014/NEXT_ORDERS.md`
  - `docs/handoffs/wave-014/PM_REPORT.md`
  - `docs/pm/MVP3_PREP_BRIEF.md`
  - `docs/backlog/MVP3_DRAFT_BACKLOG.md`
  - `docs/adr/0006-mvp3-published-graph-boundary-and-versioning.md`
  - `02_FRONTEND_AGENT_SKILL.md`
  - `apps/frontend/README.md`
  - `docs/pm/IA_MVP1.md`
  - `docs/frontend/UI_STYLE_GUIDE_MVP1.md`
  - `docs/pm/WAVE13_UIUX_REVIEW.md`
  - `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
  - `docs/api/MVP3_API_CONTRACT_DRAFT.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`
- MVP 3 Frontend contract-first UX/API requirements 문서를 작성했다.
- Review inbox IA 요구를 정리했다:
  - assigned-to-me, unassigned, status, priority, validation error type, confidence, source/job context.
  - row/card field needs and loading/empty/error/permission states.
- Review workbench 요구를 정리했다:
  - evidence/source viewer, candidate list/graph context, editable detail panel, validation results, decision history.
  - evidence missing/fetch error, stale validation, assignee mismatch, already published states.
- Correction UI state를 정리했다:
  - original vs corrected snapshots.
  - dirty/diff/invalid/evidence-unconfirmed/saving/save-failed/saved states.
  - relation endpoint, relation type, and direction reversal requirements.
- Decision action UX를 정리했다:
  - canonical `APPROVE`, `REJECT`, `REQUEST_CHANGES`, `MODIFY_AND_APPROVE`.
  - required reason rules.
  - warning-with-reason UX.
  - disabled states for failed validation, missing/broken evidence, stale version, no diff, permission, assignment, already published.
- Publish queue/job UI 요구를 정리했다:
  - eligibility reasons, selected candidates, job status/progress/result fields.
  - stable eligibility reason code asks for Backend.
- Published graph explorer v0.1 요구를 정리했다:
  - project current snapshot default.
  - candidate graph / published graph visual and navigational separation.
  - version metadata affordance without exposing rollback/diff UI as P0.
- Quality dashboard v0.1 요구를 정리했다:
  - validation/review/publish/evidence metric cards.
  - drilldown links to filtered inbox, publish job, or published graph views.
- API field/status/error cases required from Backend and QA asks were documented.
- Backend MVP3 API contract draft was reviewed and concrete Frontend gaps were added.
- MVP 3 P0/P1 line and UX risks were documented to avoid overbuild.
- Wave 14 범위에 맞춰 app implementation, mock implementation, and backend files were not touched.

## 변경 파일
- `docs/pm/MVP3_FRONTEND_UX_REQUIREMENTS.md`
- `docs/handoffs/wave-014/FRONTEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `git diff --check -- docs/pm/MVP3_FRONTEND_UX_REQUIREMENTS.md docs/handoffs/wave-014/FRONTEND_REPORT.md`
  - `for f in docs/pm/MVP3_FRONTEND_UX_REQUIREMENTS.md docs/handoffs/wave-014/FRONTEND_REPORT.md; do git diff --no-index --check /dev/null "$f"; rc=$?; if [ "$rc" -ne 0 ] && [ "$rc" -ne 1 ]; then exit "$rc"; fi; done`
- 결과:
  - PASS. 출력 없음.
  - Note: both Frontend wave artifacts are new/untracked files, so the no-index check was also run to cover whitespace in new markdown files.
- 실행하지 못한 검증:
  - 앱 build/test/smoke는 Wave 14 문서 리뷰 범위 밖이라 실행하지 않았다.
  - Backend handoff report was not present at review time.
  - `docs/api/openapi-mvp3-draft.json` was referenced by the Backend draft but was not present at review time.

## API/Enum/DTO 변경
- 변경 여부: 있음, contract requirement only.
- 상세:
  - Runtime API, enum, DTO implementation changes are not made in this wave.
  - Frontend requires the following Backend/API contract support before implementation:
    - review task list DTO optimized for inbox rows.
    - stable publish eligibility boolean and reason codes.
    - original and corrected candidate snapshots returned separately.
    - field-level validation errors for correction and decision mutations.
    - decision history and audit records with reviewer display labels and timestamps.
    - published graph current snapshot metadata.
    - quality summary values with numerator, denominator, rate, and drilldown-friendly dimensions.
    - MVP3 OpenAPI draft artifact, expected `docs/api/openapi-mvp3-draft.json` or equivalent.
  - Backend draft review gaps:
    - review inbox DTO needs display labels/context fields, evidence state, top validation message, last decision summary, and `priority_reason`.
    - validation result DTO should include `field_path`, `blocking`, and optional suggested fix summary.
    - publish candidate eligibility response needs per-candidate `eligible` and stable `eligibility_reasons[]`.
    - published graph DTOs need lineage fields for detail panels.
    - quality summary needs drilldown hints or canonical query params.
  - Canonical decision enum confirmed for UI/API:
    - `APPROVE`
    - `REJECT`
    - `REQUEST_CHANGES`
    - `MODIFY_AND_APPROVE`
  - UI copy may display `REQUEST_CHANGES` as "Needs discussion", but API payload must send `REQUEST_CHANGES`.
- 영향받는 역할:
  - Backend: use the documented field/status/error needs when drafting `BE3-001`~`BE3-010`.
  - PM: arbitrate if Backend cannot provide eligibility reason codes, correction snapshots, or current published snapshot metadata in P0.
  - QA: use the documented negative/positive cases for `INT3-001`~`INT3-007`.

## Blocker
- Product blocker 없음.
- Backend MVP3 API draft exists as `docs/api/MVP3_API_CONTRACT_DRAFT.md`.
- Backend handoff report and `docs/api/openapi-mvp3-draft.json` were not present during this Frontend review. This is not blocking Wave 14 Frontend documentation, but it means a second Frontend contract diff may be needed after Backend publishes the machine-readable artifact.

## 남은 TODO
- Backend:
  - Complete MVP3 OpenAPI artifact.
  - Confirm whether review task list includes all inbox row fields or whether Frontend must compose from candidate/evidence/job endpoints.
  - Confirm publish eligibility reason codes and correction snapshot shapes.
- Frontend:
  - In Wave 16+, implement mock-first UI using `src/shared/ui/hana` adapter only.
  - Keep candidate graph and published graph routes/view models separate.
  - Preserve loading, empty, error, permission, stale/conflict, and partial-result states for every P0 screen.
- QA:
  - Turn the documented field/state/error requirements into acceptance checks before implementation closeout.

## 다른 역할에 전달할 내용
- PM:
  - P0/P1 line is documented to prevent MVP3 overbuild.
  - Main PM arbitration candidate is whether Backend must return explicit eligibility reason codes instead of making Frontend infer publish policy.
- Backend:
  - Frontend should not reverse-engineer publish eligibility. Please return stable `eligibility_reasons[]` and display-safe messages or codes.
  - Please return original and corrected snapshots separately for correction/audit; do not expose only merged candidate values.
  - Published graph API should default to project current snapshot and include version metadata in the response.
  - Review inbox needs assignment, priority, validation code, confidence, evidence state, source/job, ontology version, and last-decision summary in list-friendly shape.
- Frontend:
  - Do not implement UI in Wave 14.
  - Future implementation must keep `hana-style-component` behind `src/shared/ui/hana`.
  - Use `REQUEST_CHANGES` as canonical API enum even when the label says "Needs discussion".
- QA:
  - Add tests for warning-with-reason publish success and warning-without-reason, failed validation, missing/broken evidence, rejected, and needs-discussion publish blocks.
  - Add separation test proving current published graph excludes pending/rejected/needs-discussion candidates.

## 총괄에게 요청하는 결정
- No immediate decision required.
- Optional Wave 15/16 coordination decision: require Backend to publish its MVP3 OpenAPI draft before Frontend starts mock-first implementation, then run a targeted Frontend contract diff review against the actual DTOs.

## 현재 판정
- PASS
