# QA Report - Wave 18

## 담당 범위
- backlog ID: `INT3-001`~`INT3-007`, initial `INT4-*`
- 작업 경로:
  - `docs/handoffs/wave-018/QA_REPORT.md`
  - QA verification-only reads across Wave18 PM/Backend/Frontend evidence
  - no app code edits

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-018/NEXT_ORDERS.md`
  - `docs/handoffs/wave-018/PM_REPORT.md`
  - `docs/handoffs/wave-018/BACKEND_REPORT.md`
  - `docs/handoffs/wave-018/FRONTEND_REPORT.md`
  - `docs/pm/MVP3_CLOSEOUT_CHECKLIST.md`
  - `docs/pm/MVP4_PREP_BRIEF.md`
  - `docs/backlog/MVP4_DRAFT_BACKLOG.md`
  - `docs/handoffs/wave-017/QA_REPORT.md`
  - `docs/backlog/INT3_MVP3_ACCEPTANCE.md`
  - `docs/backlog/MVP3_DRAFT_BACKLOG.md`
  - `00_PROJECT_ROADMAP_MVP_1_TO_5.md`
  - `docs/api/openapi-mvp3-draft.json`
  - `docs/handoffs/REPORT_TEMPLATE.md`
- MVP3 closeout checklist의 P0 matrix를 PM/Backend/Frontend/Wave17 QA evidence로 대조했다.
- Backend closeout evidence를 확인했다:
  - focused MVP3 tests PASS: `4 passed in 1.35s`
  - full backend tests PASS: `15 passed in 1.47s`
  - ruff PASS: `All checks passed!`
  - OpenAPI export compare PASS against `docs/api/openapi-mvp3-draft.json`
  - fresh SQLite migration, `seed_mvp3.py`, and selected API sanity reads PASS
- Frontend closeout evidence를 확인했다:
  - `npm run test` PASS: `3 passed`, `8 tests`
  - `npm run build` PASS
  - fresh MVP3 actual API route smoke PASS on `8018/5173`
  - MVP2 actual API regression smoke PASS on the same backend/frontend combination
- `/tmp/ontology-wave18-frontend-mvp3-actual-smoke/mvp3-actual-api-smoke.json`,
  `/tmp/ontology-wave18-frontend-mvp2-regression-smoke/mvp2-actual-api-smoke.json`,
  and `/tmp/ontology-wave18-mvp3-seed.json` existence/content were spot-checked.
- MVP4 prep brief and draft backlog were reviewed for Wave19 contract-first readiness.
- Separate `INT4` skeleton doc was not created because `docs/backlog/MVP4_DRAFT_BACKLOG.md`
  already contains a concise `INT4-001`~`INT4-009` QA acceptance skeleton. A fuller
  `INT4` checklist should be written in Wave19 after PM freeze, Backend contract
  draft, and Frontend field/state review.

## 변경 파일
- `docs/handoffs/wave-018/QA_REPORT.md`
- 앱 코드, Backend/Frontend 구현 파일, OpenAPI artifact는 수정하지 않았다.
- 별도 `INT4` acceptance skeleton doc는 생성하지 않았다.

## 실행/검증
- 실행한 명령:
  - `python3 -m json.tool docs/api/openapi-mvp3-draft.json >/tmp/openapi-mvp3-draft-json-check.txt`
  - `test -f /tmp/ontology-wave18-frontend-mvp3-actual-smoke/mvp3-actual-api-smoke.json && sed -n '1,120p' /tmp/ontology-wave18-frontend-mvp3-actual-smoke/mvp3-actual-api-smoke.json`
  - `test -f /tmp/ontology-wave18-frontend-mvp2-regression-smoke/mvp2-actual-api-smoke.json && sed -n '1,100p' /tmp/ontology-wave18-frontend-mvp2-regression-smoke/mvp2-actual-api-smoke.json`
  - `test -f /tmp/ontology-wave18-mvp3-seed.json && sed -n '1,100p' /tmp/ontology-wave18-mvp3-seed.json`
  - `git diff --check -- docs/handoffs/wave-018/QA_REPORT.md`
  - `git diff --check --no-index /dev/null docs/handoffs/wave-018/QA_REPORT.md`
- 결과:
  - MVP3 OpenAPI JSON parse PASS with `python3`.
  - MVP3 actual smoke artifact confirms:
    - review inbox `total_count=9`
    - publish queue `candidate_count=14`
    - frozen reason codes present: `ALREADY_PUBLISHED`, `BROKEN_EVIDENCE`, `ELIGIBLE`, `FAILED_VALIDATION`, `MISSING_EVIDENCE`, `NEEDS_DISCUSSION`, `PENDING`, `REJECTED`, `WARNING_REASON_REQUIRED`
    - published graph current `entities=2`, `relations=1`
    - quality published ratio `3/14 = 0.2143`
  - MVP2 actual smoke artifact confirms source/profile/chunk/job/candidate/evidence routes and `390px` mobile overflow checks.
  - Backend seed artifact confirms publish candidate count, reason codes, current published graph counts, and quality ratio.
  - `git diff --check -- docs/handoffs/wave-018/QA_REPORT.md` PASS with no whitespace error output.
  - `git diff --check --no-index /dev/null docs/handoffs/wave-018/QA_REPORT.md` PASS with no whitespace error output for the new untracked report file.
- 실행하지 못한 검증:
  - QA did not rerun backend/frontend test suites directly because Wave18 role reports already provide fresh closeout command evidence, and this task requested QA report/doc verification.
  - Docker/PostgreSQL Compose smoke remains an accepted P1 environment follow-up.

## MVP3 Closeout Matrix Verification
| Area | QA verdict | 근거 |
|---|---|---|
| Validation | PASS | Wave15/16/17 QA chain plus Backend Wave18 focused tests confirm severity, failed-blocking, warning-with-reason policy, and OpenAPI stability. |
| Expert review | PASS | Canonical decisions and review status mapping are documented in PM closeout and covered by Backend tests plus actual workbench route smoke. |
| Correction | PASS | Original and corrected snapshots remain separated in backend lineage/audit evidence; actual workbench route renders seeded review/correction context. |
| Audit | PASS | Wave15 Backend/QA evidence covers original snapshot, corrected snapshot, reviewer, decision, reason, timestamp, validation, review, and publish lifecycle reconstruction. |
| Publish eligibility | PASS | Backend tests and Wave18 seed/smoke evidence cover eligible, pending, rejected, needs-discussion, failed-validation, missing-evidence, broken-evidence, warning-without-reason, and already-published reason codes. |
| Published graph | PASS | Actual published graph route and API sanity reads show current snapshot from published graph APIs with `entities=2`, `relations=1`; candidate-only facts do not leak. |
| Published graph versioning | PASS | Backend tests and seed evidence confirm immutable version/current pointer behavior for successful publish. |
| Quality dashboard v0.1 | PASS | DTO sync closed in Wave16; Wave18 actual smoke confirms typed groups and published ratio `0.2143`. |
| Actual API route smoke | PASS | Frontend Wave18 actual smoke covers review inbox, review workbench, publish queue, published graph, and quality dashboard against deterministic seed. |
| MVP2 regression | PASS | Frontend Wave18 MVP2 actual smoke remains passing, including source/profile/chunk/job/candidate/evidence routes and mobile overflow checks. |

## MVP3 Product P0 Verdict
- Verdict: `PASS WITH P1 FOLLOW-UPS`
- Rationale:
  - All MVP3 product P0 rows in `docs/pm/MVP3_CLOSEOUT_CHECKLIST.md` have accepted evidence.
  - Backend and Frontend Wave18 reports show fresh closeout regressions with no API/enum/DTO blocker.
  - MVP2 actual API regression remains PASS.
  - Remaining items are accepted P1 environment/tooling/product-expansion follow-ups, not product blockers.

## P1 Follow-Up Classification
| Follow-up | QA classification | Product P0 blocker? |
|---|---|---|
| Docker/PostgreSQL Compose smoke | P1 environment/tooling; run in Docker-capable environment. | No |
| Formal Playwright suite | P1 tooling; current actual smoke commands are accepted closeout evidence. | No |
| Optional CORS expansion | P1 local developer experience; supported `5173` actual smoke passes. | No |
| Neo4j adapter write | P1 product expansion; relational published graph remains P0 canonical. | No |
| Broader rollback UI | P1 product expansion; MVP3 has version/audit history without full rollback UI. | No |

## MVP4 Readiness Recommendation
- Recommendation: Wave19 may open MVP4 contract-first planning.
- Conditions for Wave19:
  - PM freezes remaining MVP4 P0/P1 decisions from `docs/pm/MVP4_PREP_BRIEF.md`.
  - Backend drafts endpoint families, DTOs, formula metadata, enums, and OpenAPI artifact before runtime implementation.
  - Frontend performs field/state/IA review against Backend draft before broad screens.
  - QA writes a dedicated `INT4-*` acceptance checklist with deterministic seed requirements, metric recomputation assertions, search/RAG grounding assertions, published graph separation checks, and MVP3 regression guard.
- Do not open broad MVP4 runtime/UI implementation until those contract-first artifacts align.

## API/Enum/DTO 변경
- 변경 여부: 없음 by QA.
- 상세:
  - QA did not modify app code, API artifacts, enums, DTOs, migrations, or frontend types.
  - `docs/api/openapi-mvp3-draft.json` remains the MVP3 source of truth.
  - MVP4 draft backlog is a planning artifact, not an implementation contract freeze.
- 영향받는 역할:
  - PM: freeze MVP4 formula, dataset/golden set, search/RAG, graph explorer, and external API decisions before implementation.
  - Backend: produce MVP4 OpenAPI/DTO draft first in Wave19.
  - Frontend: review field/state/IA requirements after Backend draft.
  - QA: convert draft `INT4-*` rows into executable acceptance checklist in Wave19.

## Blocker
- MVP3 product P0 blocker: 없음.
- MVP4 contract-first entry blocker: 없음.
- MVP4 broad implementation blocker:
  - MVP4 PM freeze, Backend contract draft, Frontend field/state review, and QA executable acceptance checklist are not complete yet by design.

## 남은 TODO
- Wave19 QA:
  - Write the dedicated `INT4-*` acceptance checklist.
  - Define deterministic MVP4 seed requirements for advanced quality metrics, evaluation datasets/golden sets, search/RAG, graph explorer overlays, and MVP3 regression.
  - Keep `npm run smoke:mvp3:actual` and MVP2 actual smoke as regression guards.
- P1:
  - Run Docker/PostgreSQL Compose smoke in a Docker-capable environment.
  - Formalize actual route smokes into a broader Playwright Test suite when prioritized.

## 다른 역할에 전달할 내용
- PM:
  - QA accepts MVP3 product P0 closeout as `PASS WITH P1 FOLLOW-UPS`.
  - Wave19 can open as MVP4 contract-first planning, not broad implementation.
- Backend:
  - Backend Wave18 closeout evidence is accepted.
  - MVP4 contract should include formula metadata, deterministic seedability, RAG grounding/citation shape, search result groups, graph expansion limits, published graph version context, and external read-only API boundaries.
- Frontend:
  - Frontend Wave18 test/build/MVP3 actual smoke/MVP2 smoke evidence is accepted.
  - Keep current MVP3 routes stable as regression anchors while MVP4 contracts are drafted.
- QA:
  - No separate INT4 skeleton doc was necessary in Wave18 because `docs/backlog/MVP4_DRAFT_BACKLOG.md` already contains a concise draft.
  - Next QA work is a fuller executable `INT4` checklist after Wave19 contract inputs exist.

## 총괄에게 요청하는 결정
- Close MVP3 product P0 as `PASS WITH P1 FOLLOW-UPS`.
- Open Wave19 as MVP4 contract-first planning.
- Keep Docker/PostgreSQL Compose smoke, formal Playwright suite, optional CORS expansion, Neo4j adapter write, and broader rollback UI as P1/non-blocking follow-ups.

## 현재 판정
- PASS WITH P1 FOLLOW-UPS
