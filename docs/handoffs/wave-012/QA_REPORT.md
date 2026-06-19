# QA Report - Wave 12

## 담당 범위
- backlog ID: `INT2-003`, support `FE-012`, `FE2-001`, `FE2-002`, `FE2-003`, `FE2-004`, `FE2-005`, `FE2-006`
- 작업 경로: `docs/handoffs/wave-012/QA_REPORT.md`
- 수정 범위: `docs/handoffs/wave-012/QA_REPORT.md` only

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-011/NEXT_ORDERS.md`
  - `docs/handoffs/wave-012/PM_REPORT.md`
  - `docs/handoffs/wave-012/FRONTEND_REPORT.md`
  - `docs/pm/MVP2_PREP_BRIEF.md`의 `Wave 12 Frontend Productization Acceptance`
  - `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md`의 `Wave 12 Productization Overlay`
  - `docs/backlog/MVP2_DRAFT_BACKLOG.md`의 Wave 12 scope
  - `apps/frontend/README.md`
- PM/Frontend 자체 판정 확인:
  - PM: Wave 12 acceptance 정의 `PASS`, 신규 Backend/API scope 없음.
  - Frontend: productization 구현 자체 판정 `PASS`, 신규 API/Enum/DTO 없음.
- QA 독립 검증:
  - Frontend build/test 재실행.
  - SQLite actual backend와 actual API mode frontend를 직접 실행.
  - `npm run smoke:mvp2:actual`로 project/source/profile/chunk/job/candidate/evidence 흐름을 actual API + headless browser로 재현.
  - mobile-ish viewport DOM/screenshot 보강 검증 수행.
  - normal evidence, broken evidence, direct missing evidence fallback 확인.
  - MVP 2 closeout selected backend regression 재실행.
- QA responsive fix 재검증:
  - Frontend가 같은 wave에서 갱신한 responsive fix evidence를 확인했다.
  - fresh frontend test/build를 재실행했다.
  - 별도 SQLite actual backend와 actual API mode frontend를 직접 실행해 `npm run smoke:mvp2:actual`을 재실행했다.
  - `390x900` viewport에서 candidates/source/profile/chunks/job/evidence의 document-level horizontal overflow가 해소됐는지 독립 DOM/screenshot 체크를 수행했다.

## 변경 파일
- `docs/handoffs/wave-012/QA_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `cd apps/frontend && npm run test`
  - `cd apps/frontend && npm run build`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave12-qa-smoke.sqlite LOCAL_STORAGE_PATH=/tmp/ontology-wave12-qa-smoke-storage CORS_ORIGINS='["http://127.0.0.1:5173","http://localhost:5173","http://127.0.0.1:5175","http://localhost:5175"]' .venv/bin/alembic upgrade head`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave12-qa-smoke.sqlite LOCAL_STORAGE_PATH=/tmp/ontology-wave12-qa-smoke-storage CORS_ORIGINS='["http://127.0.0.1:5173","http://localhost:5173","http://127.0.0.1:5175","http://localhost:5175"]' .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8012`
  - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8012 npm run dev -- --host 127.0.0.1 --port 5175 --strictPort`
  - `cd apps/frontend && MVP2_API_BASE_URL=http://127.0.0.1:8012 MVP2_FRONTEND_BASE_URL=http://127.0.0.1:5175 MVP2_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave12-qa-smoke npm run smoke:mvp2:actual`
  - mobile-ish Playwright DOM/screenshot checks for projects, project detail, ontology, source detail/profile/chunks, job create/monitor, candidates, normal evidence, broken evidence, direct missing evidence.
  - `cd apps/backend && .venv/bin/pytest tests/test_project_ontology_api.py -k "wave11_mvp2_closeout_fixture_catalog or wave10_source_profile or wave10_source_parse"`
  - `command -v docker || true`
  - QA responsive fix recheck:
    - `cd apps/frontend && npm run test`
    - `cd apps/frontend && npm run build`
    - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave12-qa-recheck.sqlite LOCAL_STORAGE_PATH=/tmp/ontology-wave12-qa-recheck-storage CORS_ORIGINS='["http://127.0.0.1:5177","http://localhost:5177"]' .venv/bin/alembic upgrade head`
    - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave12-qa-recheck.sqlite LOCAL_STORAGE_PATH=/tmp/ontology-wave12-qa-recheck-storage CORS_ORIGINS='["http://127.0.0.1:5177","http://localhost:5177"]' .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8023`
    - `cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8023 npm run dev -- --host 127.0.0.1 --port 5177 --strictPort`
    - `cd apps/frontend && MVP2_API_BASE_URL=http://127.0.0.1:8023 MVP2_FRONTEND_BASE_URL=http://127.0.0.1:5177 MVP2_SMOKE_ARTIFACT_DIR=/tmp/ontology-wave12-qa-recheck npm run smoke:mvp2:actual`
    - 390x900 Playwright DOM/screenshot checks for candidates, source, profile, chunks, job, evidence.
  - `git diff --check -- docs/handoffs/wave-012/QA_REPORT.md`
- 결과:
  - `npm run test`: PASS, `src/pages/visibleCopy.test.ts` 1 passed.
  - `npm run build`: PASS, TypeScript and Vite build passed.
  - Alembic SQLite migration: PASS.
  - actual API smoke: PASS.
    - artifact: `/tmp/ontology-wave12-qa-smoke/mvp2-actual-api-smoke.json`
    - desktop screenshots:
      - `/tmp/ontology-wave12-qa-smoke/source-profile.png`
      - `/tmp/ontology-wave12-qa-smoke/source-chunks.png`
      - `/tmp/ontology-wave12-qa-smoke/job-monitor.png`
      - `/tmp/ontology-wave12-qa-smoke/candidate-filters.png`
      - `/tmp/ontology-wave12-qa-smoke/evidence-normal.png`
      - `/tmp/ontology-wave12-qa-smoke/evidence-direct-missing.png`
    - route coverage: `/dashboard`, `/projects`, project detail, source detail/profile/chunks, extraction list/create/job monitor, candidates, normal evidence, broken evidence, direct missing evidence.
  - mobile-ish evidence:
    - `/tmp/ontology-wave12-qa-smoke/qa-mobile-projects.png`
    - `/tmp/ontology-wave12-qa-smoke/qa-mobile-project-detail.png`
    - `/tmp/ontology-wave12-qa-smoke/qa-mobile-ontology.png`
    - `/tmp/ontology-wave12-qa-smoke/qa-mobile-source-detail.png`
    - `/tmp/ontology-wave12-qa-smoke/qa-mobile-source-profile.png`
    - `/tmp/ontology-wave12-qa-smoke/qa-mobile-source-chunks.png`
    - `/tmp/ontology-wave12-qa-smoke/qa-mobile-job-create.png`
    - `/tmp/ontology-wave12-qa-smoke/qa-mobile-job-monitor.png`
    - `/tmp/ontology-wave12-qa-smoke/qa-mobile-candidates.png`
    - `/tmp/ontology-wave12-qa-smoke/qa-mobile-evidence-normal.png`
    - `/tmp/ontology-wave12-qa-smoke/qa-mobile-evidence-broken.png`
    - `/tmp/ontology-wave12-qa-smoke/qa-mobile-evidence-direct-missing-final.png`
    - DOM artifact: `/tmp/ontology-wave12-qa-smoke/qa-mobile-dom-check.json`
    - Direct missing final artifact: `/tmp/ontology-wave12-qa-smoke/qa-direct-missing-final.json`
  - Backend selected closeout regression: PASS, 3 selected tests passed.
  - Visible copy check: PASS. No `API boundary`, `endpoint boundary`, or `debug` main-copy hit in checked user screens.
  - Docker CLI: not found. This matches the existing Wave 11/Wave 12 environment exception and was not treated as a blocker.
- QA responsive fix recheck:
  - Frontend follow-up evidence reviewed:
    - `/tmp/ontology-wave12-responsive-fix-smoke/mobile-dom-check.json`
    - `/tmp/ontology-wave12-responsive-fix-smoke/mobile-candidates-final.png`
    - `/tmp/ontology-wave12-responsive-fix-smoke/mobile-source-final.png`
    - `/tmp/ontology-wave12-responsive-fix-smoke/mobile-profile-final.png`
    - `/tmp/ontology-wave12-responsive-fix-smoke/mobile-chunks-final.png`
    - `/tmp/ontology-wave12-responsive-fix-smoke/mobile-job-final.png`
    - `/tmp/ontology-wave12-responsive-fix-smoke/mobile-evidence-final.png`
  - Frontend follow-up DOM artifact showed candidates/source/profile/chunks/job/evidence all at `innerWidth=390`, `scrollWidth=390`, `bodyScrollWidth=390`, `hasPageOverflow=false`.
  - Fresh `npm run test`: PASS, `src/pages/visibleCopy.test.ts` 1 passed.
  - Fresh `npm run build`: PASS, TypeScript and Vite build passed.
  - Fresh Alembic SQLite migration: PASS.
  - Fresh actual API smoke: PASS.
    - artifact: `/tmp/ontology-wave12-qa-recheck/mvp2-actual-api-smoke.json`
    - screenshots:
      - `/tmp/ontology-wave12-qa-recheck/source-profile.png`
      - `/tmp/ontology-wave12-qa-recheck/source-chunks.png`
      - `/tmp/ontology-wave12-qa-recheck/job-monitor.png`
      - `/tmp/ontology-wave12-qa-recheck/candidate-filters.png`
      - `/tmp/ontology-wave12-qa-recheck/evidence-normal.png`
      - `/tmp/ontology-wave12-qa-recheck/evidence-direct-missing.png`
  - Fresh mobile DOM artifact: `/tmp/ontology-wave12-qa-recheck/qa-recheck-mobile-dom-check.json`
  - Fresh mobile screenshots:
    - `/tmp/ontology-wave12-qa-recheck/qa-recheck-mobile-candidates.png`
    - `/tmp/ontology-wave12-qa-recheck/qa-recheck-mobile-source.png`
    - `/tmp/ontology-wave12-qa-recheck/qa-recheck-mobile-profile.png`
    - `/tmp/ontology-wave12-qa-recheck/qa-recheck-mobile-chunks.png`
    - `/tmp/ontology-wave12-qa-recheck/qa-recheck-mobile-job.png`
    - `/tmp/ontology-wave12-qa-recheck/qa-recheck-mobile-evidence.png`
  - Fresh 390x900 DOM results:
    - candidates: `scrollWidth=390`, `bodyScrollWidth=390`, `hasPageOverflow=false`
    - source: `scrollWidth=390`, `bodyScrollWidth=390`, `hasPageOverflow=false`
    - profile: `scrollWidth=390`, `bodyScrollWidth=390`, `hasPageOverflow=false`
    - chunks: `scrollWidth=390`, `bodyScrollWidth=390`, `hasPageOverflow=false`
    - job: `scrollWidth=390`, `bodyScrollWidth=390`, `hasPageOverflow=false`
    - evidence: `scrollWidth=390`, `bodyScrollWidth=390`, `hasPageOverflow=false`
- 실행하지 못한 검증:
  - Docker Compose smoke는 범위 밖이며 Docker CLI 부재로 기존 `NOT RUNNABLE` environment exception 유지.

## Productization Overlay 독립 판정
| ID | 판정 | QA 근거 |
|---|---|---|
| `PX-01` App shell/navigation hierarchy | PASS | LNB visible labels are top-level work areas only: Dashboard, Projects, Ontology, Sources, Extraction, Candidates. Source/job/evidence detail routes are reached through row/action/breadcrumb paths in actual API smoke. Note: LNB top-level links are project-contextual URLs after project selection, but they are not source/job/candidate/evidence detail entries. |
| `PX-02` Project context/breadcrumb | PASS | Project selector/topbar, breadcrumbs, source/job/candidate/evidence context remained visible. Direct missing evidence preserved project/source/job/candidate context and recovery links after fallback resolved. |
| `PX-03` Page primary action/next action | PASS | Project, source detail/profile/chunks, job create/monitor, candidate, evidence screens all showed primary or recovery actions in browser smoke. |
| `PX-04` Source-to-evidence workflow comprehension | PASS | actual API smoke reproduced project -> source profile/chunks -> extraction job -> candidates -> evidence without endpoint/debug instructions or new API needs. Ontology draft route rendered in mobile-ish check. |
| `PX-05` Candidate/evidence inspection density | PASS | Candidate results expose kind, validation, evidence, confidence, source/job/segment context, detail panel, and evidence links. Evidence viewer exposes candidate context, locator, evidence text, validation context, and recovery. |
| `PX-06` Responsive layout | PASS | Frontend follow-up artifact and fresh QA recheck both show candidates/source/profile/chunks/job/evidence at `390x900` with `documentElement.scrollWidth=390`, `bodyScrollWidth=390`, and `hasPageOverflow=false`. The previous candidate document-level overflow (`scrollWidth=897`) is no longer reproducible; wide table/content behavior is contained inside local layout/scroller surfaces. |
| `PX-07` Visual style guardrail | PASS | Screens are operational SaaS style, information-dense, no landing/marketing hero, no decorative gradient/orb background, no endpoint/debug main copy. Raw payload/technical details are lowered behind detail affordances. |
| `PX-08` Regression preservation | PASS | `npm run build`, `npm run test`, actual API browser smoke, and selected backend closeout regression passed. `CO-01`~`CO-09` and `INT2-001`~`INT2-004` remain functionally preserved; Docker Compose remains the prior environment exception only. |

## MVP 2 Closeout Regression 확인
- `CO-01` Source profile: PASS. Actual profile route rendered and selected backend profile regression passed.
- `CO-02` Source parse/chunk: PASS. Actual chunk route rendered and selected backend parse regression passed.
- `CO-03` Prompt version selection: PASS. Actual smoke created prompt/version and job with explicit prompt version.
- `CO-04` Extraction job lifecycle: PASS. Actual job create/run/detail, status/progress/model run summary rendered.
- `CO-05` Fixture catalog: PASS. actual smoke created and ran `default`, `partial_invalid`, `invalid_evidence_reference`, `missing`; selected backend fixture catalog regression passed.
- `CO-06` Retry/dedupe: PASS. actual smoke created/reran retry and job/candidate UI preserved retry context; selected backend regression passed.
- `CO-07` Candidate/evidence browsing: PASS. Candidate filters/browse/detail/evidence links rendered in actual API mode.
- `CO-08` Evidence traceability/fallback: PASS. Normal evidence, broken evidence, and direct missing fallback were verified.
- `CO-09` Frontend navigation/browser smoke: PASS for runtime/navigation rendering and responsive containment after targeted recheck.
- `INT2-001`~`INT2-004`: PASS for runtime/contract behavior based on actual API smoke plus selected backend regression. `INT2-003` responsive UX follow-up is closed by the `PX-06` recheck.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - 신규 Backend endpoint, DTO, enum 요구 없음.
  - External LLM provider, review/publish workflow, RAG, advanced PDF parsing, production auth/RBAC, 신규 candidate detail endpoint는 열리지 않았다.
  - provider API literal `mock`와 MockProvider display label 정책 유지.
- 영향받는 역할:
  - Backend: 추가 작업 필요 없음.
  - Frontend: 추가 responsive blocker 없음.

## Blocker
- Runtime/API blocker 없음.
- Productization blocker 없음.
- UX maturity blocker 없음.

## 남은 TODO
- Frontend:
  - 추가 작업 없음. 기존 Docker Compose/browser harness formalization은 Wave 11부터 유지된 P1 tooling follow-up이다.
- QA:
  - 추가 Wave 12 productization recheck 없음.

## 다른 역할에 전달할 내용
- PM:
  - Wave 12 runtime product flow and productization overlay are both PASS after `PX-06` responsive containment recheck.
- Backend:
  - No API/Enum/DTO blocker found. Backend can remain idle.
- Frontend:
  - `PX-06` responsive containment follow-up is closed. No new Frontend work requested from QA.
- QA:
  - Recheck artifacts are in `/tmp/ontology-wave12-qa-recheck` and Frontend follow-up artifacts are in `/tmp/ontology-wave12-responsive-fix-smoke`.

## 총괄에게 요청하는 결정
- Wave 12 Frontend Productization을 `PASS`로 승인 요청.
- Docker Compose smoke는 기존 P1 environment exception으로 계속 유지 요청.

## 현재 판정
- PASS
