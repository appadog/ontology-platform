# QA / Integration Report - Wave 44 (MVP6.6 Governance Change Application)

## 담당 범위
- backlog ID: `INT6-055` (backend runtime), `INT6-056` (frontend mock/API),
  `INT6-057` (application-!=-publish + one-true-flag, DATA-LEVEL), `INT6-058` (Wave44 closeout).
- 작업 경로: 독립 검증 (BE runtime + 자체 data-level 스크립트 + FE mock/actual smoke +
  회귀). `docs/backlog/INT6_6_GOVERNANCE_APPLICATION_ACCEPTANCE.md` R1-R9 verdict 갱신.

## 완료한 작업
- Backend/Frontend 보고서를 신뢰하지 않고 R1-R9를 독립 재현했다. BE 테스트/ruff/OpenAPI를
  직접 실행하고, 자체 in-process data-level 스크립트로 published-graph-untouched +
  one-true-flag를 재검증하고, FE test/build/mock smoke + actual smoke(SQLite backend
  부팅)를 직접 돌렸으며, MVP6.5 governance mock+actual 회귀를 실행했다.

## 실행/검증 (정확한 명령 + 결과)

### INT6-055 Backend runtime
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_6_governance_application_api.py -q`
  → **21 passed in 4.84s**.
- `.venv/bin/pytest tests/test_mvp6_5_governance_api.py -q` → **28 passed in 5.54s** (MVP6.5 회귀 무손상).
- `.venv/bin/pytest -q` (전체) → **126 passed in 20.24s**.
- `.venv/bin/ruff check app tests scripts` → **All checks passed!**
- 독립 OpenAPI 정렬 (runtime `app.openapi()` vs `docs/api/openapi-mvp6-6-draft.json`):
  3/3 apply/pre-check/audit paths present; **schema field mismatches: 0**.
- 코드 리뷰 (`application.py`): 3 endpoint families, G1-G6 규칙, 에러 순서(precondition →
  authz → target → staleness), staleness all-or-nothing→SUPERSEDED, DEPRECATE→ARCHIVED
  (never DELETED), pre-check가 어떤 상태도 mutate하지 않음(순수 advisory) 확인.

### INT6-057 application-!=-publish + one-true-flag (DATA-LEVEL, 자체 스크립트)
- 자체 in-process 스크립트가 실제 FastAPI 앱을 구동, ADD+MODIFY+DEPRECATE 요청을
  propose→submit→approve→apply한 뒤 결과를 검사. 모든 체크 **ALL PASS**:
  - `apply returns 200`, `application_state == APPLIED`
  - **guard has exactly ONE true flag** `['ontology_draft_mutated']`; 7 keys 모두 존재; 나머지 6개 false
  - **target version stays DRAFT** (apply는 cut/publish 안 함)
  - MODIFY: payload 갱신 + status ACTIVE; DEPRECATE→**ARCHIVED (not DELETED)**;
    ADD→새 draft element 생성; **no element left DELETED**
  - **all other surface tables before == after** — 13개 테이블(candidate_corrections/
    candidate_entities/candidate_evidence/candidate_relations/extraction_jobs/
    prompt_templates/prompt_versions/publish_jobs/published_entities/
    published_graph_versions/published_relations/review_decisions/review_tasks) COUNT 불변
  - post-apply `can_apply == False`
  - Staleness: 승인 스냅샷 이후 draft element를 ARCHIVED로 바꿔 stale 유발 →
    `apply -> 409 CHANGE_REQUEST_SUPERSEDED`, request `SUPERSEDED`(terminal),
    **staleness mutated no surface tables**, 재-apply → 409.
- No MVP6.5/MVP1 rename: `git status apps/backend/app/core/enums.py` → **무변경**.

### INT6-056 Frontend mock/API
- `cd apps/frontend && npm run test` → **11 files / 59 tests passed** (governance 파일 16,
  MVP6.6 apply 6건 포함).
- `npm run build` → tsc clean + `vite build ✓ built in 1.92s`.
- `npm run smoke:mvp6:governance-apply:mock` (vite dev 부팅 후) →
  `{ "status": "PASS", "routeCount": 5, "screenshotCount": 5 }`.
- `npm run smoke:mvp6:governance-apply:actual` (SQLite backend 부팅) →
  `{ "status": "PASS", "checks": 6, "change_request_id": "ocr-00001" }`.
  6 checks: propose→approve QUEUED / pre-check DRAFT+all-false guard+can_apply /
  apply-403 PERMISSION_DENIED / apply→APPLIED one-true-flag / idempotency 409
  CHANGE_ALREADY_APPLIED / application-audit CHANGE_REQUEST_APPLIED.
- G7 badge 확인: `StatusBadge.tsx`에 `APPLIED`(success, `초안에 적용됨 (미게시)`) 토큰
  추가; `governanceShared.tsx`가 `SUPERSEDED`를 warning tone(`대체됨 (미적용)`)으로 렌더.

### Regression
- MVP6.5 governance mock smoke `npm run smoke:mvp6:governance:mock` → PASS (6 routes).
- MVP6.5 governance actual smoke `npm run smoke:mvp6:governance:actual` → PASS (10 checks).
- 전체 backend suite 126 passed. FE 59 tests pass. Additive-only; candidate/published
  분리 유지; core enums 무변경.
- 정리: 8000/5173 리스너 없음(확인). `git diff --check` → clean.

## R1-R9 판정
| ID | Gate | Verdict |
|---|---|---|
| R1 | apply→DRAFT + APPLIED + one-true-flag guard | PASS |
| R2 | published/candidate/prompt/publish-job 테이블 apply 후 불변 (data-level) | PASS |
| R3 | pre-check: resolved DRAFT target + per-item before/after + advisory staleness | PASS |
| R4 | staleness→409 SUPERSEDED, terminal, nothing mutated | PASS |
| R5 | idempotency 409 (already-applied/not-applicable/target-not-draft) | PASS |
| R6 | authz 403 (non-permitted); applier != approver 허용 + audited | PASS |
| R7 | application audit 완전 + chronological(ASC) | PASS |
| R8 | FE apply UX (pre-check panel + confirmation modal + APPLIED/SUPERSEDED badge + applied-not-published banner) mock+actual smoke | PASS |
| R9 | MVP1-MVP6.5 회귀, additive-only, no renames | PASS |

## Seed-coupling 판단 (FE가 플래그한 항목)
- FE 보고서는 actual smoke를 `seed_mvp1`만으로 부팅해 `project-corp-knowledge` DB
  행을 수동 insert했다고 기록. QA는 **`seed_mvp3`로 부팅** — 이 시드가 이미
  `project-corp-knowledge` 프로젝트 행을 생성하므로 수동 insert 없이 actual smoke가
  PASS했다(DB 확인: `projects` 테이블에 `project-corp-knowledge` 존재).
- 판단: **수용 가능한 deterministic-thin-slice 커플링**(P1 follow-up, non-blocking).
  application store가 draft target을 literal `project-corp-knowledge`/`ontology-v7`로
  키잉하지만 propose는 프로젝트를 DB에서 검증하므로, 공유 데모 시드(`seed_mvp3`)로
  부팅하면 두 identity space가 자연히 정렬된다. Mock path는 커플링 없음. 실제 MVP1
  ontology-edit DB 경로와의 통합은 P1(현 슬라이스는 semantic 재사용 + 자체 store).

## Blocker
- 없음.

## API/Enum/DTO 변경
- 변경 없음(QA는 코드 미작성; docs 갱신만). BE/FE 변경은 additive-only, no rename 확인.

## 남은 TODO / P1 hardening 후보 (non-blocking)
- application store와 실제 MVP1 ontology-edit DB 경로 통합(현 process-local self-store).
- durable DB/Alembic persistence(현 process-local + reset hook).
- FE actual smoke의 시드 정렬을 `seed_mvp3` 기준으로 문서화(수동 insert 불필요).

## 총괄에게 전달
- OVERALL **PASS**. R1-R9 9/9. published-graph-untouched + one-true-flag를 자체
  data-level 스크립트로 독립 재확인. actual smoke PASS. seed-coupling은 수용 가능.
  회귀 무손상. 권고: **MVP6.6 thin closeout**.

## 현재 판정
- **PASS** (MVP6.6 Governance Change Application thin slice — closeout 권고).
