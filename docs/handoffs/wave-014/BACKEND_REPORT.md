# Backend Report - Wave 14

## 담당 범위
- backlog ID: `BE3-001`~`BE3-010`
- 작업 경로:
  - `docs/api/MVP3_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp3-draft.json`
  - `docs/handoffs/wave-014/BACKEND_REPORT.md`

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
  - `01_BACKEND_AGENT_SKILL.md`
  - `apps/backend/README.md`
  - `docs/api/API_CONTRACT_PRIORITY_MVP1.md`
  - `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
  - `docs/api/openapi-mvp2-draft.json`
- MVP 3 Backend contract-first draft를 작성했다.
- `ValidationJob` / `ValidationResult` model and endpoint draft를 정의했다.
- `ReviewTask` / `ReviewDecision` model and endpoint draft를 PM enum 기준으로 정의했다:
  - `APPROVE`
  - `REJECT`
  - `REQUEST_CHANGES`
  - `MODIFY_AND_APPROVE`
- Candidate correction API draft를 정의하고 original LLM output과 expert correction layer를 분리했다.
- Review status transition, required reason, correction diff, warning publish validation rules를 명시했다.
- `AuditLog` model/API draft를 정의했다.
- `PublishJob`, `PublishedGraphVersion`, `PublishedEntity`, `PublishedRelation` model/API draft를 정의했다.
- Published graph query API가 relational canonical tables를 P0 source로 읽도록 정의했다. Neo4j write는 P1/optional adapter로 유지했다.
- Quality summary API v0.1 field draft를 정의했다.
- MVP 3 OpenAPI draft artifact를 수동 작성했다:
  - `docs/api/openapi-mvp3-draft.json`
- Wave 15 migration impact와 예상 SQLAlchemy/Pydantic/router module touch list를 정리했다.

## 변경 파일
- `docs/api/MVP3_API_CONTRACT_DRAFT.md`
- `docs/api/openapi-mvp3-draft.json`
- `docs/handoffs/wave-014/BACKEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `node -e "const fs=require('fs'); const o=JSON.parse(fs.readFileSync('docs/api/openapi-mvp3-draft.json','utf8')); console.log(o.openapi, o.info.version); console.log(Object.keys(o.paths).length + ' paths'); console.log(Object.keys(o.components.schemas).length + ' schemas');"`
  - `git diff --check -- docs/api/MVP3_API_CONTRACT_DRAFT.md docs/api/openapi-mvp3-draft.json docs/handoffs/wave-014/BACKEND_REPORT.md`
  - `for f in docs/api/MVP3_API_CONTRACT_DRAFT.md docs/api/openapi-mvp3-draft.json docs/handoffs/wave-014/BACKEND_REPORT.md; do git diff --no-index --check /dev/null "$f"; rc=$?; if [ "$rc" -ne 0 ] && [ "$rc" -ne 1 ]; then exit "$rc"; fi; done`
- 결과:
  - OpenAPI JSON parse PASS: `3.1.0 0.3.0-draft`, `21 paths`, `37 schemas`.
  - `git diff --check` PASS after final validation.
  - `git diff --no-index --check` PASS for new untracked draft files.
- 실행하지 못한 검증:
  - FastAPI route export comparison was not run because Wave 14 intentionally does not implement MVP 3 app code.
  - Backend pytest/ruff were not run because this wave changed docs only.

## API/Enum/DTO 변경
- 변경 여부: 있음, contract draft only.
- 상세:
  - New enums proposed:
    - `CandidateKind`: `ENTITY`, `RELATION`, `PROPERTY_VALUE`
    - `ValidationJobStatus`: `PENDING`, `RUNNING`, `SUCCESS`, `FAILED`
    - `ValidationRuleCode`: `CLASS_EXISTS`, `RELATION_EXISTS`, `RELATION_DOMAIN_RANGE`, `RELATION_DIRECTION`, `REQUIRED_PROPERTY`, `DATATYPE`, `CARDINALITY`, `DUPLICATE_CANDIDATE`, `ORPHAN_NODE`, `EVIDENCE_MISSING`, `ONTOLOGY_VERSION_MISMATCH`, `LOW_CONFIDENCE`
    - `ValidationResultSeverity`: `INFO`, `WARNING`, `FAILED`
    - `ReviewTaskStatus`: `OPEN`, `ASSIGNED`, `IN_REVIEW`, `DECIDED`, `CANCELLED`
    - `ReviewDecisionType`: `APPROVE`, `REJECT`, `REQUEST_CHANGES`, `MODIFY_AND_APPROVE`
    - `CorrectionStatus`: `DRAFT`, `SUBMITTED`, `APPLIED`, `SUPERSEDED`
    - `AuditEventType`: validation/review/correction/publish/version/current-pointer event names
    - `PublishJobStatus`: `PENDING`, `RUNNING`, `SUCCESS`, `PARTIAL_FAILED`, `FAILED`
  - Existing MVP 2 enums reused:
    - `ValidationStatus`
    - `CandidateReviewStatus`
    - `PublishStatus`
  - New DTO families drafted:
    - `ValidationJob`, `ValidationResult`
    - `ReviewTask`, `ReviewTaskDetail`, `ReviewDecision`
    - `CandidateCorrection`
    - `AuditLog`
    - `PublishEligibility`, `PublishJob`
    - `PublishedGraphVersion`, `PublishedEntity`, `PublishedRelation`, `PublishedGraphSnapshot`
    - `QualitySummary`
  - New endpoint families drafted:
    - validation jobs/results
    - review tasks/assign/claim/decisions
    - candidate corrections
    - audit logs
    - publish eligibility/jobs/run
    - published graph versions/current/entities/relations
    - quality summary
- 영향받는 역할:
  - PM: needs to arbitrate any Frontend/QA disagreement on endpoint grouping, quality metric names, or manual assignment semantics.
  - Backend: Wave 15 should implement from the contract draft, then replace the manual OpenAPI draft with exported FastAPI OpenAPI.
  - Frontend: can review fields for review inbox/workbench, correction UI, publish queue, graph explorer, quality dashboard.
  - QA: can turn the draft into INT3 checklists, especially negative publish eligibility cases.

## Blocker
- Product blocker 없음.
- Environment blocker 없음 for docs.
- Contract caveat:
  - `01_BACKEND_AGENT_SKILL.md` still contains older ReviewDecision wording `MODIFY` / `REQUEST_CHANGE`.
  - Wave 14 PM decision supersedes that wording. Backend implementation must use `MODIFY_AND_APPROVE` / `REQUEST_CHANGES`.

## 남은 TODO
- Wave 15 Backend implementation:
  - Add MVP 3 enums to `apps/backend/app/core/enums.py`.
  - Add modules:
    - `apps/backend/app/modules/validation/`
    - `apps/backend/app/modules/review/`
    - `apps/backend/app/modules/audit/`
    - `apps/backend/app/modules/publish/`
    - `apps/backend/app/modules/quality/`
  - Register routers in `apps/backend/app/api/router.py`.
  - Add Alembic migration for validation/review/correction/audit/publish/published graph tables.
  - Add project current published graph pointer, either on `projects` or a separate state table.
  - Add service-level eligibility checks before publishing.
  - Add tests for status transitions, reason requirements, correction diff, warning publish rule, failed/missing evidence block, and published graph separation.
  - Export FastAPI OpenAPI and compare with `docs/api/openapi-mvp3-draft.json`.

## 다른 역할에 전달할 내용
- PM:
  - Please confirm whether `ValidationResultSeverity` should remain `INFO` / `WARNING` / `FAILED`, or align to the older backend skill wording `INFO` / `WARNING` / `ERROR` / `CRITICAL`. I chose `FAILED` to mirror PM's publish-blocking vocabulary.
  - Please confirm whether `PROPERTY_VALUE` should stay in `CandidateKind` for forward compatibility even though MVP 2 currently exposes entity/relation candidates only.
- Backend:
  - Do not publish from candidate tables directly without review and publish eligibility checks.
  - Treat relational `PublishedEntity` / `PublishedRelation` as canonical P0; Neo4j write must be optional.
  - Preserve original LLM raw payload and write expert corrections in `CandidateCorrection` / `ReviewDecision` snapshots.
  - Successful publish job must create immutable `PublishedGraphVersion` and update project current pointer.
- Frontend:
  - Review whether review inbox needs wrapped list responses with `total_count`, or whether MVP 2-style arrays with `limit`/`offset` are sufficient for Wave 15/16.
  - Review whether `ReviewTaskDetail.candidate_snapshot` is enough for workbench composition, or if Backend should embed evidence/source summaries directly.
  - Review correction payload shape for entity and relation editing, especially relation direction reversal.
  - Review publish queue needs for `PublishEligibility.reasons` display.
- QA:
  - Add explicit negative cases for pending, rejected, needs-discussion, failed-validation, missing-evidence, and warning-without-reason candidates.
  - Add positive case for warning-with-reason when evidence exists and no failed validation exists.
  - Verify published graph current snapshot reads relational published tables only and excludes candidate leakage.
  - Verify audit history contains original snapshot, corrected snapshot when applicable, reviewer, reason, timestamp, and publish job/version ids.

## 총괄에게 요청하는 결정
- None required to continue Wave 15, but the PM/commander may want to confirm `ValidationResultSeverity` naming before code implementation.

## 현재 판정
- PASS
