# QA Report - Wave 17

## 담당 범위
- backlog ID: `INT3-003`, `INT3-004`, `INT3-006`, regression `INT3-001`~`INT3-007`
- 작업 경로:
  - `docs/handoffs/wave-017/QA_REPORT.md`
  - verification-only reads/checks across `docs/handoffs/wave-017/*_REPORT.md`, `docs/backlog/INT3_MVP3_ACCEPTANCE.md`, `apps/backend`, and `apps/frontend`
  - temp artifacts under `/tmp/ontology-wave17-qa-*`

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-017/NEXT_ORDERS.md`
  - `docs/handoffs/wave-017/PM_REPORT.md`
  - `docs/handoffs/wave-017/BACKEND_REPORT.md`
  - `docs/handoffs/wave-017/FRONTEND_REPORT.md`
  - `docs/backlog/INT3_MVP3_ACCEPTANCE.md`
  - `/tmp/ontology-wave17-mvp3-seed.json`
  - `/tmp/ontology-wave17-mvp3-actual-smoke/mvp3-actual-api-smoke.json`
  - `docs/handoffs/REPORT_TEMPLATE.md`
- Backend seed reproducibility를 fresh SQLite DB에서 독립 검증했다.
- MVP3 actual API smoke artifact를 확인하고, QA fresh seed/backend/frontend로 `npm run smoke:mvp3:actual`을 재실행했다.
- Actual route evidence가 PM 기준 6개 항목을 모두 덮는지 확인했다:
  - seeded project exists
  - review inbox has tasks
  - workbench opens a seeded task
  - publish queue shows eligibility reason codes
  - published graph current renders only published facts
  - quality dashboard renders typed metrics / published ratio
- Backend focused MVP3 tests, Frontend tests/build, MVP2 actual API regression guard를 재실행했다.
- 첫 MVP3 smoke 재실행은 frontend port `5174`에서 CORS allowlist 불일치로 실패했고, 동일 backend/seed를 `5173`에서 재실행해 PASS했다. 제품 라우트 실패가 아니라 supported local origin 조건으로 분리 판정했다.

## 변경 파일
- `docs/handoffs/wave-017/QA_REPORT.md`
- 앱 코드, Backend/Frontend 구현 파일, API artifact는 수정하지 않았다.

## 실행/검증
- 실행한 명령:
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp3_api.py -q`
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/backend && rm -f /tmp/ontology-wave17-qa-mvp3-seed.db /tmp/ontology-wave17-qa-mvp3-seed.json && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave17-qa-mvp3-seed.db .venv/bin/alembic upgrade head && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave17-qa-mvp3-seed.db .venv/bin/python scripts/seed_mvp3.py --output /tmp/ontology-wave17-qa-mvp3-seed.json`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave17-qa-mvp3-seed.db .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8018`
  - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8018 npm run dev -- --host 127.0.0.1 --port 5174 --strictPort`
  - `cd apps/frontend && MVP3_API_BASE_URL=http://127.0.0.1:8018 MVP3_FRONTEND_BASE_URL=http://127.0.0.1:5174 MVP3_SEED_JSON=/tmp/ontology-wave17-qa-mvp3-seed.json MVP3_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave17-qa-mvp3-actual-smoke npm run smoke:mvp3:actual`
  - Browser console debug for the `5174` failure.
  - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8018 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - `cd apps/frontend && MVP3_API_BASE_URL=http://127.0.0.1:8018 MVP3_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP3_SEED_JSON=/tmp/ontology-wave17-qa-mvp3-seed.json MVP3_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave17-qa-mvp3-actual-smoke npm run smoke:mvp3:actual`
  - `cd apps/frontend && MVP2_API_BASE_URL=http://127.0.0.1:8018 MVP2_FRONTEND_BASE_URL=http://127.0.0.1:5173 MVP2_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave17-qa-mvp2-regression-smoke npm run smoke:mvp2:actual`
- 결과:
  - Backend focused MVP3 tests PASS: `4 passed in 1.96s`.
  - Frontend tests PASS: `3 passed`, `8 tests`.
  - Frontend build PASS: TypeScript and Vite production build completed.
  - Fresh SQLite migration + MVP3 seed PASS through `20260619_0004`.
  - QA seed output:
    - project `project-corp-knowledge`
    - review tasks `9`
    - publish candidates `14`
    - reason codes: `ALREADY_PUBLISHED`, `BROKEN_EVIDENCE`, `ELIGIBLE`, `FAILED_VALIDATION`, `MISSING_EVIDENCE`, `NEEDS_DISCUSSION`, `PENDING`, `REJECTED`, `WARNING_REASON_REQUIRED`
    - published graph current: `entities=2`, `relations=1`
    - quality published ratio: `3/14`, `0.2143`
  - MVP3 actual API route smoke PASS on `5173`:
    - artifact JSON: `/tmp/ontology-wave17-qa-mvp3-actual-smoke/mvp3-actual-api-smoke.json`
    - screenshots:
      - `/tmp/ontology-wave17-qa-mvp3-actual-smoke/review-inbox.png`
      - `/tmp/ontology-wave17-qa-mvp3-actual-smoke/review-workbench.png`
      - `/tmp/ontology-wave17-qa-mvp3-actual-smoke/publish-queue.png`
      - `/tmp/ontology-wave17-qa-mvp3-actual-smoke/published-graph.png`
      - `/tmp/ontology-wave17-qa-mvp3-actual-smoke/quality-dashboard.png`
    - route assertions passed for review inbox, review workbench, publish queue reason codes, published facts/current snapshot, typed quality metric groups, and seeded published ratio.
  - MVP2 actual API regression smoke PASS:
    - artifact JSON: `/tmp/ontology-wave17-qa-mvp2-regression-smoke/mvp2-actual-api-smoke.json`
    - project/source/profile/chunk/job/candidate/evidence routes, screenshots, and mobile overflow checks passed.
- 실행하지 못한 검증:
  - Docker Compose/PostgreSQL smoke remains outside Wave17 QA scope and within the existing environment/tooling exception.
- 주의:
  - `5174` actual smoke attempt failed before route assertions due browser CORS errors: backend returned no `Access-Control-Allow-Origin` for `http://127.0.0.1:5174`. Rerun on the supported dev frontend origin `http://127.0.0.1:5173` passed with the same QA seed/backend.

## INT3 판정
| ID | Verdict | 근거 |
|---|---|---|
| `INT3-003` Publish-only-approved smoke | PASS | Backend focused tests cover positive/negative publish rules. QA seed exposes eligible and blocked candidates with frozen reason codes. Actual publish route rendered all seeded reason codes and candidate eligibility. |
| `INT3-004` Published graph separation/current snapshot | PASS | Backend focused tests cover published graph separation/current behavior. Actual published graph route rendered `PUBLISHED FACTS`, current snapshot, and only seeded published facts from `/published-graph/current` with `entities=2`, `relations=1`. |
| `INT3-006` Quality dashboard consistency | PASS | Actual quality route rendered typed `candidate_counts`, `validation_counts`, `review_counts`, `publish_counts`, and `rates`; published ratio was `3/14 = 0.2143`. Frontend test/build and actual API route smoke passed. |
| Overall Wave17 actual API smoke | PASS | Deterministic seed is reproducible, actual API smoke passes on supported local origin, MVP2 regression guard remains green, and no product/API policy blocker remains. |

## API/Enum/DTO 변경
- 변경 여부: 없음 by QA.
- 상세:
  - QA did not modify API, enum, DTO, Backend, or Frontend implementation files.
  - Wave17 Backend/Frontend reports changed seed/harness and Frontend DTO/view alignment only; QA found no additional contract change request.
  - `docs/api/openapi-mvp3-draft.json` remains the MVP3 source of truth.
- 영향받는 역할:
  - Backend: seed helper is accepted as reproducible QA/development support.
  - Frontend: actual smoke command is accepted; keep documented dev origin `5173` unless backend CORS settings are intentionally expanded.
  - QA: future MVP3 closeout runs can reuse the seed + `smoke:mvp3:actual` flow.

## Blocker
- Wave17 blocker: 없음.

## 남은 TODO
- P1 tooling follow-up:
  - Formalize MVP3 mock route smoke and MVP3 actual API smoke into a fuller Playwright Test suite if desired.
- Environment/tooling follow-up:
  - Docker Compose/PostgreSQL smoke remains an approved environment exception until Docker CLI is available.
- Local run note:
  - MVP3 actual smoke should use frontend port `5173` or a backend CORS-approved origin. Port `5174` reproduces a CORS setup failure, not a product route failure.

## 다른 역할에 전달할 내용
- PM:
  - Wave17 actual API smoke boundary is satisfied. Harness remains QA/development support, not product scope.
- Backend:
  - `apps/backend/scripts/seed_mvp3.py` reproduces the fixed `project-corp-knowledge` seed on fresh SQLite and supports actual route smoke.
- Frontend:
  - `npm run smoke:mvp3:actual` passed against QA seed on `8018/5173`.
  - `npm run smoke:mvp2:actual` also passed as regression guard.
- QA:
  - Reuse `/tmp/ontology-wave17-qa-mvp3-seed.json`, `/tmp/ontology-wave17-qa-mvp3-actual-smoke/mvp3-actual-api-smoke.json`, and `/tmp/ontology-wave17-qa-mvp2-regression-smoke/mvp2-actual-api-smoke.json` for trace.

## 총괄에게 요청하는 결정
- Accept Wave17 as PASS and close the MVP3 actual frontend route smoke harness gate.
- Allow MVP3 closeout to proceed with only P1 tooling/environment follow-ups listed above.

## 현재 판정
- PASS
