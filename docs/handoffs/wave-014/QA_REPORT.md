# QA Report - Wave 14

## 담당 범위
- backlog ID: `INT3-001`, `INT3-002`, `INT3-003`, `INT3-004`, `INT3-005`, `INT3-006`, `INT3-007`
- 작업 경로:
  - `docs/backlog/INT3_MVP3_ACCEPTANCE.md`
  - `docs/backlog/MVP3_DRAFT_BACKLOG.md`
  - `docs/handoffs/wave-014/QA_REPORT.md`

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-014/NEXT_ORDERS.md`
  - `docs/handoffs/wave-014/PM_REPORT.md`
  - `docs/handoffs/wave-014/BACKEND_REPORT.md`
  - `docs/handoffs/wave-014/FRONTEND_REPORT.md`
  - `docs/pm/MVP3_PREP_BRIEF.md`
  - `docs/backlog/MVP3_DRAFT_BACKLOG.md`
  - `docs/api/MVP3_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp3-draft.json`
  - `docs/pm/MVP3_FRONTEND_UX_REQUIREMENTS.md`
  - `docs/adr/0006-mvp3-published-graph-boundary-and-versioning.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`
- `INT3-001`~`INT3-007`을 Wave 15+ 구현자가 바로 실행 기준으로 사용할 수 있는 acceptance checklist로 구체화했다.
- Validation contract review 기준을 API/OpenAPI field, validation severity, publish impact, published graph non-mutation 기준으로 정리했다.
- Review decision flow smoke 기준을 `APPROVE`, `REJECT`, `REQUEST_CHANGES`, `MODIFY_AND_APPROVE`와 `CandidateReviewStatus` mapping 기준으로 정리했다.
- Publish-only-approved smoke 기준을 positive/negative fixture matrix로 정리했다.
- Published graph separation/current snapshot 검증 기준을 relational canonical snapshot, current pointer, candidate leakage 방지 기준으로 정리했다.
- Audit trail verification 기준을 original snapshot, corrected snapshot, reviewer, reason, timestamp, publish job/version id 기준으로 정리했다.
- Quality dashboard consistency 기준을 count/rate 공식과 underlying data recomputation 기준으로 정리했다.
- MVP 2 regression 기준을 source/profile/parse, prompt/job, candidate/evidence, retry dedupe, actual API browser smoke 유지 기준으로 정리했다.
- PM decisions, Backend draft/OpenAPI, Frontend field asks 간 contract mismatch review를 작성했다.
- Backend open QA question에 명시적으로 답했다:
  - negative publish cases must cover pending, rejected, needs-discussion, failed-validation, missing-evidence, and warning-without-reason.
- `ValidationResultSeverity` naming을 검토했다:
  - QA는 `INFO` / `WARNING` / `FAILED`를 MVP 3 contract-ready로 수용한다.
  - 단, 오래된 Backend skill의 `ERROR` / `CRITICAL` 계열 wording과 다르므로 PM confirmation before code freeze로 non-blocking follow-up을 남긴다.
- `docs/backlog/MVP3_DRAFT_BACKLOG.md`에 상세 INT3 checklist 링크를 추가했다.

## 변경 파일
- `docs/backlog/INT3_MVP3_ACCEPTANCE.md`
- `docs/backlog/MVP3_DRAFT_BACKLOG.md`
- `docs/handoffs/wave-014/QA_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `node -e "const fs=require('fs'); const o=JSON.parse(fs.readFileSync('docs/api/openapi-mvp3-draft.json','utf8')); console.log(o.openapi, o.info.version); console.log(Object.keys(o.paths).length + ' paths'); console.log(Object.keys(o.components.schemas).length + ' schemas');"`
  - `git diff --check -- docs/backlog/INT3_MVP3_ACCEPTANCE.md docs/backlog/MVP3_DRAFT_BACKLOG.md docs/handoffs/wave-014/QA_REPORT.md`
  - `for f in docs/backlog/INT3_MVP3_ACCEPTANCE.md docs/backlog/MVP3_DRAFT_BACKLOG.md docs/handoffs/wave-014/QA_REPORT.md; do git diff --no-index --check /dev/null "$f"; rc=$?; if [ "$rc" -ne 0 ] && [ "$rc" -ne 1 ]; then exit "$rc"; fi; done`
- 결과:
  - OpenAPI JSON parse PASS: `3.1.0 0.3.0-draft`, `21 paths`, `37 schemas`.
  - `git diff --check` PASS.
  - `git diff --no-index --check` PASS for new/untracked QA docs.
- 실행하지 못한 검증:
  - MVP 3 runtime smoke는 실행하지 않았다. Wave 14는 contract-first planning이며 MVP 3 앱/API 구현이 아직 없다.
  - Backend pytest/Frontend build/browser smoke는 실행하지 않았다. 이번 QA 범위는 docs/API draft mismatch review와 acceptance checklist 작성이다.

## API/Enum/DTO 변경
- 변경 여부: 없음, runtime implementation 기준.
- 상세:
  - QA는 코드/API 구현을 변경하지 않았다.
  - Contract-only follow-up을 식별했다:
    - `ValidationResultSeverity` is accepted as `INFO` / `WARNING` / `FAILED`, with PM confirmation recommended before code freeze.
    - `PublishEligibility.reasons` should become stable documented reason literals or an enum before Frontend relies on it.
    - `ValidationResult` should either formalize `field_path`, `blocking`, and suggested fix summary, or Backend/Frontend should document how Frontend derives them from `details`.
    - `ReviewTask` list DTO may need display/context fields requested by Frontend, or Frontend must compose from detail APIs.
    - Published graph DTOs may need explicit reviewer/reason/evidence lineage fields for the detail panel.
    - `QualitySummary` free-form objects may need typed count/rate/drilldown schemas before UI implementation.
- 영향받는 역할:
  - PM: confirm `ValidationResultSeverity` naming and arbitrate schema field follow-ups if needed.
  - Backend: implement eligibility, validation, audit, and published graph APIs against the checklist; close stable reason code and field formalization risks.
  - Frontend: implement UI against stable DTOs only after Backend/OpenAPI follow-ups are settled or composition rules are agreed.
  - QA: use `docs/backlog/INT3_MVP3_ACCEPTANCE.md` as the Wave 15+ acceptance baseline.

## Blocker
- Contract checklist blocker: 없음.
- Runtime blocker:
  - MVP 3 runtime is not implemented yet, so `INT3-001`~`INT3-007` cannot be executed as runtime smoke.
- Non-blocking contract follow-ups:
  - `ValidationResultSeverity` PM confirmation before code freeze.
  - Stable publish eligibility reason literals.
  - OpenAPI formalization for Frontend validation fields, review inbox row fields, published graph lineage, and quality drilldown/typed metrics.

## 남은 TODO
- Wave 15 Backend:
  - Implement MVP 3 schemas/routes/models/migrations against PM decisions and the INT3 checklist.
  - Export actual FastAPI OpenAPI and compare with `docs/api/openapi-mvp3-draft.json`.
  - Add deterministic fixtures covering all positive/negative publish cases.
- Wave 16 Frontend:
  - Build mock-first review/publish/published graph/quality UI only after DTO stability is confirmed.
  - Keep candidate graph and published graph route/view model separation.
- QA:
  - Convert the checklist into runnable API/browser smoke once MVP 3 implementation exists.
  - Keep MVP 2 regression as a P1 gate during MVP 3 implementation.

## 다른 역할에 전달할 내용
- PM:
  - No blocking mismatch was found for Wave 14 contract readiness.
  - Please confirm whether `ValidationResultSeverity` remains `INFO` / `WARNING` / `FAILED` before implementation code freezes.
- Backend:
  - The publish negative suite must include pending, rejected, needs-discussion, failed-validation, missing-evidence, and warning-without-reason.
  - Warning-with-reason is a required positive publish case when evidence exists and no failed validation exists.
  - Published graph P0 acceptance must pass from relational canonical tables and current pointer; Neo4j cannot be a P0 dependency.
  - Please make publish eligibility reasons stable enough for UI and QA assertions.
- Frontend:
  - Treat `REQUEST_CHANGES` as the API enum even when displayed as "Needs discussion".
  - Do not infer publish policy from scattered fields if Backend can return eligibility reason codes.
  - Preserve visual and route separation between candidate graph and published graph.
- QA:
  - Use `docs/backlog/INT3_MVP3_ACCEPTANCE.md` as the authoritative Wave 15+ checklist unless PM changes policy.

## 총괄에게 요청하는 결정
- No blocking commander decision required to proceed to Wave 15.
- Optional coordination decision:
  - Require Backend to close the stable eligibility reason code and `ValidationResultSeverity` naming follow-ups before Frontend starts API-bound implementation.

## 현재 판정
- `PASS / CONTRACT CHECKLIST READY`
- `PARTIAL / NOT RUNNABLE` for runtime MVP 3 smoke because implementation does not exist yet.
