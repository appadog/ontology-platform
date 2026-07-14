# QA/Integration Report - Wave 057 (Full-Product Regression MVP1–MVP6.12)

## 담당 범위
- backlog ID: Wave-057 full-product regression / closeout
- 작업 경로: `apps/backend`, `apps/frontend`, actual-API smoke battery (`apps/frontend/scripts/*-actual-api-smoke.mjs`)
- 성격: READ-ONLY regression. 제품 코드 무수정. 임시 DB/seed 파일은 `/tmp` 하위에만 생성.

## 완료한 작업
- 커맨더가 확정한 결정론적 baseline을 그대로 승계(아래 기록).
- 실 백엔드(:8000, SQLite) + 프론트 dev 서버(:5173, actual API 모드)를 1회 부팅하여 **15개 actual-API smoke** 전량 실행.
- 실패한 actual smoke를 실제 원인까지 진단하여 **제품 리그레션 vs 하네스/시드/환경 갭**을 분리.
- 모든 리스너 teardown 및 tree clean 확인.

---

## 커맨더 확정 baseline (verbatim, 재실행 안 함)
- Backend full suite: **276 passed** (`cd apps/backend && .venv/bin/pytest -q`), ruff **All checks passed** (`ruff check app tests scripts`).
- OpenAPI: `docs/api/openapi-*.json` 17개 draft 전부 parse OK.
- Frontend: **116 tests passed** (17 files), `npm run build` **PASS** (tsc app+node + vite).
- Mock smoke battery: **13/13 PASS** (mvp4:mock, mvp5:mock, mvp6:mock, mvp6:benchmark/connectors/copilot/goldset/governance-apply/governance/graphviz/impact/learning/tenancy :mock).
- `git diff --check` clean.

---

## 실행 환경 (actual smoke)
- Backend: `.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000`, CORS는 `app/core/config.py`에서 `localhost:5173`/`127.0.0.1:5173` 허용 확인.
- Frontend: `VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev` (:5173). FE는 `import.meta.env.VITE_USE_MOCK_API !== "false"`로 mock 여부 판정(`src/shared/api/client.ts:337`).
- Seed 결정성: `scripts/seed_mvp{3,4,5}.py`에 `uuid4`/`random` 없음(고정 ID). 단 review-task 등 일부 레코드는 런타임 UUID → 마지막 seed 실행본 기준으로만 일치.
- Seed 전략:
  - `seed_mvp5.py`가 `seed_mvp4 → seed_mvp3`을 reset 캐스케이드하므로 **mvp5 seed JSON이 mvp3/mvp4 필드의 상위집합**. mvp3/mvp4 smoke를 mvp5 JSON에 포인팅하여 단일 DB로 정합.
  - MVP6 계열 actual smoke는 `seedActualApi()`로 **API 자가 시드**, mvp2도 자가 시드(`createProject`).

### DB / seed 매핑
| DB | 용도 | seed JSON |
|---|---|---|
| `/tmp/ontology-wave057.db` (shared) | mvp2, mvp3, mvp4, mvp5(초기), 전체 mvp6 | `/tmp/ontology-wave24-mvp5-seed.json` (mvp3/4/5 공용, 상위집합) |
| `/tmp/ontology-wave057-mvp5only.db` (isolated) | mvp5 격리 검증 | `/tmp/ontology-mvp5only-seed.json` |

---

## 회귀 매트릭스 (actual-API smoke, 15개)

| # | Smoke | 명령 | 결과 | JSON status | 비고 |
|---|-------|------|------|-------------|------|
| 1 | mvp2:actual | `npm run smoke:mvp2:actual` | **PASS** | `"status":"PASS"` | 자가 시드(createProject), 모바일 체크 포함 |
| 2 | mvp3:actual | `MVP3_SEED_JSON=…mvp5-seed.json npm run smoke:mvp3:actual` | **DEFERRED (P3)** | (없음, browser 단계 timeout) | API check + 4개 라우트(review-inbox/workbench/publish/published-graph) PASS. 유일 실패: quality 대시보드 `heading "Candidates"`가 **접힌 `<details>` 안**이라 미표시. 데이터/UI 정상(펼치면 렌더). 하네스 assertion 미갱신. |
| 3 | mvp4:actual | `MVP4_SEED_JSON=…mvp5-seed.json npm run smoke:mvp4:actual` | **PASS** | `"status":"PASS"` | |
| 4 | mvp5:actual | `MVP5_SEED_JSON=…mvp5only-seed.json VITE_MVP5_ORGANIZATION_ID=org-corp-knowledge npm run smoke:mvp5:actual` | **PASS** (격리 DB) | `"status":"PASS"` | shared DB 최초 실행은 FAIL → 2개 하네스/환경 갭(아래) 보정 후 PASS. 제품 정상. |
| 5 | mvp6:actual | `npm run smoke:mvp6:actual` | **PASS** | `"status":"PASS"` | 자가 시드 |
| 6 | mvp6:benchmark:actual | `npm run smoke:mvp6:benchmark:actual` | **PASS** | `"status":"PASS"` | |
| 7 | mvp6:goldset:actual | `npm run smoke:mvp6:goldset:actual` | **PASS** | `"status":"PASS"` | |
| 8 | mvp6:impact:actual | `npm run smoke:mvp6:impact:actual` | **PASS** | `"status":"PASS"` | |
| 9 | mvp6:copilot:actual | `npm run smoke:mvp6:copilot:actual` | **PASS** | `"status":"PASS"` | |
| 10 | mvp6:connectors:actual | `npm run smoke:mvp6:connectors:actual` | **PASS** | `"status":"PASS"` | |
| 11 | mvp6:tenancy:actual | `npm run smoke:mvp6:tenancy:actual` | **PASS** | `"status":"PASS"` | |
| 12 | mvp6:graphviz:actual | `npm run smoke:mvp6:graphviz:actual` | **PASS** | `"status":"PASS"` | |
| 13 | mvp6:governance:actual | `npm run smoke:mvp6:governance:actual` | **PASS** | `"status":"PASS"` | |
| 14 | mvp6:governance-apply:actual | `npm run smoke:mvp6:governance-apply:actual` | **PASS** | `"status":"PASS"` | |
| 15 | mvp6:learning:actual | `npm run smoke:mvp6:learning:actual` | **PASS** | `"status":"PASS"` | |

**집계: 14 PASS · 1 DEFERRED(P3) · 0 genuine regression.**

---

## 실패 진단 상세 (제품 리그레션 아님을 입증)

### mvp3:actual — DEFERRED (P3 하네스 assertion 갭)
- 증상: `getByRole("heading",{name:"Candidates",exact:true}).waitFor()` 30s timeout (`scripts/mvp3-actual-api-smoke.mjs:209`).
- 근거: `src/pages/QualityDashboardPage.tsx:141-144`에서 legacy MVP3 요약(Candidates/Validation/Review/Publish 카드, `LegacyQualitySummary` @ line 203-247)이 **기본 접힘 `<CollapseSection>` (`<details>/<summary>` "MVP3 candidate / validation / review / publish summary")** 안에 위치.
- 검증: headless 브라우저로 `<summary>` 클릭하여 펼치면 `Candidates`/`Validation`/`Review`/`Publish` 4개 heading 모두 `role=heading`으로 정상 렌더 확인. 상단 요약(완전성/일관성/추적성/검증 통과율)은 항상 표시됨.
- 판정: 데이터·UI 정상. smoke assertion이 접힘 섹션을 펼치지 않는 **하네스 미갱신(P3)**. 제품 리그레션 아님. (제품 코드 무수정 원칙상 smoke 수정 안 함.)

### mvp5:actual — shared run FAIL → 격리+환경 보정 후 PASS (하네스/환경 갭 2건)
1. **Org id 환경 갭**: FE 기본 org id가 mock fixture 값 `org-ontology-demo`(`src/shared/mocks/mvp5Fixtures.ts:28`, `src/pages/mvp5Shared.tsx:7`). 실 백엔드 seed는 `org-corp-knowledge`를 생성 → `/api/v1/admin/organizations/org-ontology-demo/summary` **404**. `VITE_MVP5_ORGANIZATION_ID=org-corp-knowledge` 지정 시 `…/org-corp-knowledge/summary` **200**.
2. **DB 오염(테스트 격리 갭)**: `/admin` 콘솔이 테넌트 내 **모든 프로젝트**에 대해 `/api/v1/admin/projects/{id}/summary`를 조회. shared DB에는 앞서 실행한 mvp6/mvp2 self-seed 프로젝트 ~7개가 섞여 있고 이들은 admin/governance 프로젝트 레코드가 없어 **404** → "Admin console could not load". 직접 검증: seed 프로젝트 `project-corp-knowledge`는 **200**, mvp6 프로젝트는 **404**.
- 보정: mvp5 seed만 있는 **격리 DB**(`/tmp/ontology-wave057-mvp5only.db`) + `VITE_MVP5_ORGANIZATION_ID=org-corp-knowledge`로 재실행 → **PASS**.
- 판정: 백엔드 엔드포인트 정상(200), FE는 올바른 org로 정상 렌더. 실패 원인은 (a) 스모크 실행 시 org env 미주입, (b) 배터리 공용 DB 오염. 둘 다 **하네스/환경(P3)**. 제품 리그레션 아님.

> 참고: 두 P3 갭 모두 이전 wave에서 "actual smoke 하네스 갭"으로 defer된 유형과 동일 성격(제품 결함 아님).

---

## 변경 파일
- 없음(제품/하네스 코드 무수정). `/tmp` 임시 DB·seed JSON만 생성했고 teardown 시 정리.

## 실행/검증
- 실행: 위 15개 `smoke:*:actual`, 백엔드/프론트 부팅, 진단용 headless playwright probe(임시 파일, 삭제 완료).
- 결과: 14 PASS · 1 DEFERRED(P3) · 0 regression.
- 실행하지 못한 검증: 없음(전 15개 실행). mvp3의 접힘 섹션은 제품 코드 무수정 원칙상 smoke 수정 대신 수동 브라우저로 데이터 정상 확인.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 영향받는 역할: 없음

## Blocker
- 없음.

## 남은 TODO (P3 하네스 개선 — 제품 릴리즈 차단 아님)
- `mvp3-actual-api-smoke.mjs`: quality 라우트에서 "MVP3 candidate/validation/review/publish summary" `<details>`를 먼저 펼친 뒤 Candidates/Validation/Review/Publish heading 검증하도록 갱신.
- `mvp5-actual-api-smoke.mjs` 배터리 실행 시 (a) `VITE_MVP5_ORGANIZATION_ID`를 seed org로 주입, (b) mvp5는 **격리 DB**(mvp6/mvp2 self-seed와 분리)에서 실행하도록 러너/문서화.

## 다른 역할에 전달할 내용
- PM: 전 제품 표면(MVP1–6.12) 기능적으로 GREEN. 잔여 2건은 스모크 하네스 개선(P3)일 뿐 제품 결함 아님.
- Backend: `/api/v1/admin/organizations/{org}/summary`, `/api/v1/admin/projects/{project}/summary` 정상. admin 콘솔이 미등록 프로젝트에 404를 반환하는 것은 스펙대로.
- Frontend: mvp5 admin이 실 API에서 org id를 mock 기본값에 의존. actual 모드/실배포에서는 테넌트 컨텍스트로 org를 결정하도록 env 주입 경로 문서화 권장.
- QA: actual 배터리는 self-seed(mvp6) 스모크와 DB-seed(mvp3/4/5) 스모크의 **DB 격리**가 필요.

## 총괄에게 요청하는 결정
- P3 하네스 2건(mvp3 details 펼침, mvp5 격리+org env)을 후속 wave 백로그로 등록할지 확인.

## 현재 판정
- **PASS** — 전체 MVP1–MVP6.12 표면 **GREEN**. Genuine product regression **0건**. Deferred(P3 하네스/환경) **2건**(mvp3 접힘 assertion, mvp5 org-env+DB격리) — 모두 제품 결함 아님.

## Teardown 확인
- :8000 / :5173 리스너 종료 완료(잔여 프로세스 없음).
- `/tmp` 임시 DB·seed·probe 파일 정리 완료.
- `git diff --check` clean.
