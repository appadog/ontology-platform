# PM Report - Wave 15

## 담당 범위
- backlog ID: `PM3-001`, `PM3-002`, `PM3-003`, `PM3-004`, `PM3-005`
- 작업 경로:
  - `docs/pm/MVP3_PREP_BRIEF.md`
  - `docs/api/MVP3_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp3-draft.json`
  - `docs/backlog/MVP3_DRAFT_BACKLOG.md`
  - `docs/backlog/INT3_MVP3_ACCEPTANCE.md`
  - `docs/handoffs/wave-015/PM_REPORT.md`

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-015/NEXT_ORDERS.md`
  - `docs/handoffs/wave-014/PM_REPORT.md`
  - `docs/handoffs/wave-014/BACKEND_REPORT.md`
  - `docs/handoffs/wave-014/FRONTEND_REPORT.md`
  - `docs/handoffs/wave-014/QA_REPORT.md`
  - `docs/pm/MVP3_PREP_BRIEF.md`
  - `docs/api/MVP3_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp3-draft.json`
  - `docs/pm/MVP3_FRONTEND_UX_REQUIREMENTS.md`
  - `docs/backlog/INT3_MVP3_ACCEPTANCE.md`
  - `docs/backlog/MVP3_DRAFT_BACKLOG.md`
  - `03_PM_AGENT_SKILL.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`
- Wave 15 implementation contract freeze를 문서화했다.
- `ValidationResultSeverity`를 `INFO`, `WARNING`, `FAILED`로 최종 freeze했다.
- publish eligibility reason code enum/literal을 확정했다.
- review inbox list response shape를 `{ items, total_count, limit, offset }`로 확정했다.
- `ValidationResult` UI fields를 `field_path`, `blocking`, `suggested_fix`로 확정했다.
- published graph entity/relation lineage fields를 확정했다.
- `QualitySummary` typed metric groups, metric value shape, and drilldown hints를 확정했다.
- Backend/Frontend가 eligibility code가 있을 때 scattered fields에서 publish policy를 추론하지 말아야 한다는 규칙을 명시했다.
- ADR 신규 작성은 하지 않았다. ADR 0006의 published graph boundary/versioning 결정으로 충분하고, 이번 작업은 literal/schema freeze다.

## 변경 파일
- `docs/pm/MVP3_PREP_BRIEF.md`
- `docs/api/MVP3_API_CONTRACT_DRAFT.md`
- `docs/api/openapi-mvp3-draft.json`
- `docs/backlog/MVP3_DRAFT_BACKLOG.md`
- `docs/backlog/INT3_MVP3_ACCEPTANCE.md`
- `docs/handoffs/wave-015/PM_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `node -e "const fs=require('fs'); const o=JSON.parse(fs.readFileSync('docs/api/openapi-mvp3-draft.json','utf8')); console.log(o.openapi, o.info.version); console.log(Object.keys(o.paths).length + ' paths'); console.log(Object.keys(o.components.schemas).length + ' schemas'); console.log(o.components.schemas.ValidationResultSeverity.enum.join(',')); console.log(o.components.schemas.PublishEligibilityReasonCode.enum.join(','));"`
  - `git diff --check -- docs/pm/MVP3_PREP_BRIEF.md docs/api/MVP3_API_CONTRACT_DRAFT.md docs/api/openapi-mvp3-draft.json docs/backlog/MVP3_DRAFT_BACKLOG.md docs/backlog/INT3_MVP3_ACCEPTANCE.md docs/handoffs/wave-015/PM_REPORT.md`
  - `for f in docs/pm/MVP3_PREP_BRIEF.md docs/api/MVP3_API_CONTRACT_DRAFT.md docs/api/openapi-mvp3-draft.json docs/backlog/MVP3_DRAFT_BACKLOG.md docs/backlog/INT3_MVP3_ACCEPTANCE.md docs/handoffs/wave-015/PM_REPORT.md; do git diff --no-index --check /dev/null "$f"; rc=$?; if [ "$rc" -ne 0 ] && [ "$rc" -ne 1 ]; then exit "$rc"; fi; done`
- 결과:
  - OpenAPI JSON parse PASS: `3.1.0 0.3.0-draft`, `21 paths`, `50 schemas`, severity enum `INFO,WARNING,FAILED`, eligibility enum frozen.
  - `git diff --check` PASS.
  - `git diff --no-index --check` PASS for the untracked MVP3 docs/report files.
- 실행하지 못한 검증:
  - 앱 build/test/smoke는 PM/Architecture 문서 freeze 범위 밖이라 실행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 있음, contract freeze only.
- 상세:
  - `ValidationResultSeverity`: `INFO`, `WARNING`, `FAILED`.
  - `PublishEligibilityReasonCode`:
    - `ELIGIBLE`
    - `NOT_APPROVED_OR_MODIFIED`
    - `PENDING`
    - `REJECTED`
    - `NEEDS_DISCUSSION`
    - `MISSING_EVIDENCE`
    - `BROKEN_EVIDENCE`
    - `FAILED_VALIDATION`
    - `WARNING_REASON_REQUIRED`
    - `ALREADY_PUBLISHED`
    - `ONTOLOGY_VERSION_MISMATCH`
    - `PUBLISH_PERMISSION_REQUIRED`
    - `CORRECTION_DIFF_REQUIRED`
  - Review inbox list response: `{ items, total_count, limit, offset }`.
  - `ValidationResult`: `field_path`, `blocking`, `suggested_fix`.
  - Published graph lineage object: publish job id, graph version id/number, ontology version id, candidate id/kind, original/corrected snapshot, evidence refs, reviewer id/display name, decision id/type, reason, reviewed timestamp, published timestamp.
  - `QualitySummary`: typed `candidate_counts`, `validation_counts`, `review_counts`, `publish_counts`, and `rates`; count metrics use `value`, rate metrics use `numerator`, `denominator`, `rate`; both may include drilldown hints.
- 영향받는 역할:
  - Backend: implement schemas/routes from the frozen OpenAPI/prose contract; do not use older severity or review decision wording.
  - Frontend: consume eligibility reason codes and validation/lineage/quality fields directly; do not duplicate backend publish policy.
  - QA: assert frozen literals and response shapes in `INT3-001`~`INT3-007`.

## Blocker
- Product blocker 없음.
- Environment blocker 없음 for PM docs.
- Runtime blocker는 기존과 동일: MVP 3 implementation이 아직 없어 runtime QA는 Backend/Frontend implementation 이후 가능하다.

## 남은 TODO
- Backend:
  - Wave 15 implementation should read this report before changing app code.
  - Replace the hand-authored draft with exported FastAPI OpenAPI once runtime routes exist, preserving frozen literals/shapes.
- Frontend:
  - Mock-first implementation can proceed against frozen OpenAPI/prose contract.
  - Actual API integration should verify review inbox wrapper and typed quality metrics before broad UI polish.
- QA:
  - Use frozen literals and typed schemas as assertion baseline.
  - Keep MVP 2 regression as a guard when MVP 3 runtime lands.

## 다른 역할에 전달할 내용
- PM:
  - No new ADR was created; ADR 0006 still owns published graph architecture.
- Backend:
  - `PublishEligibility.reasons[]` must use frozen reason codes. Return `ELIGIBLE` for eligible rows and blocking codes for ineligible rows.
  - `ValidationResult.field_path`, `blocking`, and `suggested_fix` are first-class schema fields.
  - Review inbox list response must be wrapped with `items`, `total_count`, `limit`, `offset`.
  - Published graph entity/relation responses must expose lineage for audit-friendly detail panels.
  - Quality summary must return typed metric groups, not free-form objects.
- Frontend:
  - Do not infer publish policy from `review_status`, `validation_status`, evidence fields, or permissions when eligibility reason codes are available.
  - Candidate graph and published graph remain separate routes/view models.
- QA:
  - Negative publish checks should assert exact frozen reason codes.
  - `INT3-006` should recompute metrics from typed quality metric values and drilldown hints.

## 총괄에게 요청하는 결정
- 없음. Wave 15 PM freeze is complete and ready for Backend/Frontend implementation.

## 현재 판정
- PASS
