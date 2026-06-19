# Frontend Report - Wave 15

## 담당 범위
- backlog ID: `FE3-001`, `FE3-002`, `FE3-003`, `FE3-004`, `FE3-005`, `FE3-006`, `FE3-007`; support `FE3-008`, `INT3-001`~`INT3-007`
- 작업 경로:
  - `apps/frontend/**`
  - `docs/handoffs/wave-015/FRONTEND_REPORT.md`

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-015/NEXT_ORDERS.md`
  - `docs/handoffs/wave-015/PM_REPORT.md`
  - `docs/handoffs/wave-014/FRONTEND_REPORT.md`
  - `docs/pm/MVP3_FRONTEND_UX_REQUIREMENTS.md`
  - `docs/api/MVP3_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp3-draft.json`
  - `docs/backlog/INT3_MVP3_ACCEPTANCE.md`
  - `docs/backlog/MVP3_DRAFT_BACKLOG.md`
  - `02_FRONTEND_AGENT_SKILL.md`
  - `apps/frontend/README.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`
- MVP 3 shared API types, fixtures, mock client, and query hooks를 추가했다.
- Review workflow routes/screens를 추가했다:
  - review inbox: `/projects/:projectId/review`
  - review workbench: `/projects/:projectId/review/:reviewTaskId`
  - publish queue/job: `/projects/:projectId/publish`, `/projects/:projectId/publish-jobs/:publishJobId`
  - published graph explorer: `/projects/:projectId/published-graph`
  - quality dashboard v0.1: `/projects/:projectId/quality`
- Project detail에 MVP 3 contextual entry cards를 추가했다. ID-bound workbench/job pages는 global LNB에 추가하지 않았다.
- Review inbox는 assigned-to-me, unassigned, status, validation, confidence filters와 source/job/evidence/priority context를 보여준다.
- Workbench는 evidence/source, candidate context, original vs corrected snapshot, correction diff, validation results, decision history, decision disabled reasons를 한 흐름에 배치했다.
- Decision actions는 `APPROVE`, `REJECT`, `REQUEST_CHANGES`, `MODIFY_AND_APPROVE` 기준으로 reason, failed validation, missing evidence, no correction diff, already published, permission/read-only disabled states를 표시한다.
- Publish queue는 frozen `PublishEligibilityReasonCode`를 표시하고 eligible selection, publish job progress/result summary를 제공한다.
- Published graph explorer는 project current snapshot을 기본으로 하며 `PUBLISHED FACTS` label, version metadata, lineage detail로 candidate graph와 분리했다.
- Quality dashboard는 typed `QualitySummary` count/rate groups와 review/publish/published graph drilldown links를 표시한다.
- 주요 화면에 loading, empty, error, read-only/permission state를 추가했다.
- TDD guard로 MVP3 mock contract test를 추가했고, red 확인 후 mock client/types/fixtures를 구현했다.

## 변경 파일
- `apps/frontend/src/app/router.tsx`
- `apps/frontend/src/pages/ProjectDetailPage.tsx`
- `apps/frontend/src/pages/ReviewInboxPage.tsx`
- `apps/frontend/src/pages/ReviewWorkbenchPage.tsx`
- `apps/frontend/src/pages/PublishQueuePage.tsx`
- `apps/frontend/src/pages/PublishedGraphExplorerPage.tsx`
- `apps/frontend/src/pages/QualityDashboardPage.tsx`
- `apps/frontend/src/pages/mvp3Shared.tsx`
- `apps/frontend/src/pages/visibleCopy.test.ts`
- `apps/frontend/src/shared/api/client.ts`
- `apps/frontend/src/shared/api/mvp3Mock.test.ts`
- `apps/frontend/src/shared/api/queries.ts`
- `apps/frontend/src/shared/api/types.ts`
- `apps/frontend/src/shared/mocks/mvp3Fixtures.ts`
- `docs/handoffs/wave-015/FRONTEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `npm run test -- src/shared/api/mvp3Mock.test.ts` red 확인: initial failure `apiClient.listReviewTasks is not a function` 등 4건.
  - `npm run test -- src/shared/api/mvp3Mock.test.ts`
  - `npm run test`
  - `npm run build`
  - `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - Playwright route smoke:
    - `/projects/project-corp-knowledge/review`
    - `/projects/project-corp-knowledge/review/review-task-clean-entity`
    - `/projects/project-corp-knowledge/publish`
    - `/projects/project-corp-knowledge/published-graph`
    - `/projects/project-corp-knowledge/quality`
  - `git diff --check -- apps/frontend docs/handoffs/wave-015/FRONTEND_REPORT.md`
- 결과:
  - Focused red test PASS after implementation: `src/shared/api/mvp3Mock.test.ts (4 tests)`.
  - Full frontend test PASS: `2 passed`, `6 tests`.
  - Build PASS: `tsc --noEmit` + Vite production build completed.
  - Route smoke PASS: all 5 MVP3 routes rendered expected page title and `Review to published facts` workflow marker.
  - `git diff --check` PASS.
- 실행하지 못한 검증:
  - MVP3 actual API smoke는 Backend Wave 15 runtime slice/report가 아직 이 작업 범위에 없어서 실행하지 않았다.
  - Docker Compose smoke는 Frontend Wave 15 범위 밖이다.

## API/Enum/DTO 변경
- 변경 여부: 있음, Frontend type/mock/client boundary only.
- 상세:
  - Added frozen Frontend literals:
    - `ValidationResultSeverity`: `INFO`, `WARNING`, `FAILED`
    - `ReviewDecisionType`: `APPROVE`, `REJECT`, `REQUEST_CHANGES`, `MODIFY_AND_APPROVE`
    - `PublishEligibilityReasonCode`: `ELIGIBLE`, `NOT_APPROVED_OR_MODIFIED`, `PENDING`, `REJECTED`, `NEEDS_DISCUSSION`, `MISSING_EVIDENCE`, `BROKEN_EVIDENCE`, `FAILED_VALIDATION`, `WARNING_REASON_REQUIRED`, `ALREADY_PUBLISHED`, `ONTOLOGY_VERSION_MISMATCH`, `PUBLISH_PERMISSION_REQUIRED`, `CORRECTION_DIFF_REQUIRED`
  - Added typed `ReviewTaskListResponse` with `{ items, total_count, limit, offset }`.
  - Added typed `ValidationResult.field_path`, `blocking`, `suggested_fix`.
  - Added typed correction, decision, publish eligibility, publish job, published graph snapshot/lineage, and `QualitySummary` DTOs.
  - Added mock client methods for review tasks, review task detail, publish candidates/jobs, current published graph, and quality summary.
  - Actual API paths are mapped to the Wave 15 OpenAPI draft where possible, but runtime verification is pending Backend implementation.
- 영향받는 역할:
  - Backend: should keep DTOs aligned with `apps/frontend/src/shared/api/types.ts` and frozen OpenAPI fields.
  - QA: can use `apps/frontend/src/shared/api/mvp3Mock.test.ts` and route smoke paths as frontend assertion anchors.

## Blocker
- Product blocker 없음 for mock-first frontend slice.
- Actual API integration blocker: Backend MVP3 runtime endpoints are not verified in this report.

## 남은 TODO
- Frontend:
  - Connect MVP3 screens to actual Backend once Wave 15 Backend slice lands and compare response fields against frozen mock DTOs.
  - Consider formalizing the Playwright route smoke as an npm script if QA wants repeatable MVP3 browser evidence.
- Backend:
  - Confirm actual response shape for review task detail, publish candidates, published graph lineage, and typed quality summary.
- QA:
  - Run `INT3-001`~`INT3-007` against mock-first frontend routes now; rerun actual API mode after Backend report.

## 다른 역할에 전달할 내용
- PM:
  - No PM/backlog docs were edited. MVP4/5 RAG/search/enterprise features were not exposed.
- Backend:
  - Frontend consumes eligibility `reasons[]` directly and does not infer publish policy from scattered fields.
  - Review inbox expects wrapped response `{ items, total_count, limit, offset }`.
  - Published graph detail expects lineage with original/corrected snapshots, evidence refs, reviewer, reason, decision, and publish version fields.
  - Quality dashboard expects typed metric groups with count/rate metric shapes and drilldown hints.
- Frontend:
  - `hana-style-component` remains behind `src/shared/ui/hana`; business screens import the adapter only.
  - MVP3 ID-bound pages are contextual project routes, not flat global LNB entries.
- QA:
  - Suggested smoke paths are the five project routes listed above.
  - Negative publish reason codes are visible in Publish Queue mock data: warning reason required, failed validation, missing evidence, needs discussion, already published.

## 총괄에게 요청하는 결정
- 없음.

## 현재 판정
- PASS / MOCK-FIRST FRONTEND READY
