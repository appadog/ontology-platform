# QA Report - Wave 42

## 담당 범위
- backlog ID: `INT6-047` (backend runtime), `INT6-048` (frontend mock/API),
  `INT6-049` (approval-!=-auto-apply + no-mutation), `INT6-050` (Wave42 closeout)
- 작업 경로: 독립 검증 스크립트 (scratchpad), `docs/backlog/INT6_5_GOVERNANCE_ACCEPTANCE.md`
  (R-series verdicts 갱신), `docs/handoffs/wave-042/QA_REPORT.md`. `apps/` 미변경.

## 완료한 작업
Backend/Frontend PASS 보고를 신뢰하지 않고 독립적으로 재현·검증했다. MVP6.5 Governance
thin slice의 12개 런타임 게이트(R1–R12)를 전부 PASS로 확인했고, 핵심 불변식
(approval != auto-apply)을 응답 레벨 + **데이터 레벨** 양쪽에서 독립 증명했다.

## 실행/검증 (정확한 명령 + 결과)

### INT6-047 Backend 런타임
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_5_governance_api.py -q` → **28 passed in 7.25s**
- `.venv/bin/pytest tests/test_mvp6_4_goldset_authoring_api.py -q` → **21 passed in 5.74s**
- `.venv/bin/pytest -q` (전체 회귀) → **105 passed in 20.00s**
- `.venv/bin/ruff check app tests scripts` → **All checks passed!**
- 독립 OpenAPI 정합 스크립트 (runtime `app.openapi()` vs `openapi-mvp6-5-draft.json`):
  `governance paths 9/9`, `draft ops 12 | runtime 12 | missing set()`,
  guard 7 flags 전부 default false, `GovernanceReviewAction={APPROVE,REJECT,REQUEST_CHANGES,COMMENT}`
  (MODIFY_AND_APPROVE 제외), 16개 governance schema 필드/enum **0 mismatch**.
- 5개 endpoint family(CRUD/items/submit-withdraw/reviews/audit) 모두 러닝 앱에 노출·응답 확인.
- 라우터: `governance_router`가 `app/api/router.py`에 goldset 다음 등록됨(additive, +2 lines).

### INT6-048 Frontend mock/actual
- `cd apps/frontend && npm run test` → **53 passed (11 files)** (governance mock 계약 10 포함).
- `npm run build` → **PASS** (`tsc --noEmit` + `vite build ✓ built in 2.11s`).
- `npm run smoke:mvp6:governance:mock` → **{"status":"PASS","routeCount":6,"screenshotCount":6}**
  (dev 서버 mock 모드 5173 부팅). board(거버넌스 KO title + MVP6.5 marker + 상시 approval-is-intent
  배너 + primary 변경 요청 생성 + `큐잉됨(미적용)` warning 배지 + 단일 활성 LNB + no 적용/게시 CTA)
  → propose(ADD ref 숨김 + 제출) → detail(approver band + reason gating + mutation-guard proof line)
  → APPROVE→QUEUED 확인 → audit disclosure. 스크린샷(`governance-approved.png`)을 직접 육안 확인:
  APPROVED + `큐잉됨(미적용)` warning 배지, approval-is-intent 배너, Review 그룹 Governance 단일 활성,
  변경 항목 EN+KO D6 배지, 적용/게시 CTA 없음.
- `npm run smoke:mvp6:governance:actual` (backend SQLite 부팅 8000) →
  **{"status":"PASS","apiCheckCount":10}**. propose(DRAFT)→submit(OPEN); 0-item→409; G1 first-touch;
  reason 422; self-approval 403; 비권한 role 403; APPROVE→QUEUED/all-false guard; terminal→409;
  audit asc + APPLIED/SUPERSEDED 미생성. actual smoke는 자체적으로 `POST /api/v1/projects`로 프로젝트 생성.
- 회귀 mock smoke: goldset/benchmark/learning 전부 **PASS**.
- responsive: `scripts/wave35-responsive-check.mjs` → governance board/propose/detail
  1920/1440/1366/1280/1024/768 전부 `overflowX=0`, `RESULT: 0 horizontal overflow on all routes/resolutions`.

### INT6-049 approval-!=-auto-apply + no-mutation (독립 재현)
독립 스크립트로 앱을 in-process(TestClient, file-backed SQLite) 부팅 + 전체 lifecycle 실행 후
15개 mutable 테이블 count를 before/after 비교:
- APPROVE → `status=APPROVED`, `application_state=QUEUED`, `change_auto_applied=false`,
  all-false 7-flag `GovernanceMutationGuard`, `review_decision.resulting_application_state=QUEUED`.
- **데이터 레벨 무변경**: `candidate_entities/relations/evidence`, `published_entities/relations/graph_versions`,
  `publish_jobs`, `prompt_versions/templates`, `ontology_classes/properties/relations/versions`,
  `extraction_jobs`, `review_decisions` — **before == after (전부 0 rows)**. 라이브 actual-smoke DB에서도
  동일 확인(프로젝트 1행 외 mutable 테이블 0 rows).
- `APPLIED`/`SUPERSEDED`는 application_state에도 audit action에도 **미생성**.
- 코드 레벨: governance service는 DB write 경로가 없음(전부 process-local dict). 라우터의
  `Session`/`get_db`는 `evaluation_service.project_or_404`(read-only 존재확인)에만 사용.
  모듈이 candidate/publish/prompt/extraction/ontology write path를 import하지 않음.

### 회귀 / 불변식
- Backend 105 tests, FE 53 tests + build, 4개 mock smoke(governance+goldset+benchmark+learning) PASS.
- 변경 additive-only: `git diff --stat` — router.py +2/-0, types.ts +209/-0(삭제 0),
  `app/core/enums.py` 미변경(MVP3 `ReviewDecisionType`/MVP5 `Role` 리네임 없음).
- Wave35-40 UI 불변식 유지: KO titles, D6 EN+KO 배지, 단일 활성 LNB(신규 Governance 포함, resolver
  `/governance`→"governance"), 0 horizontal overflow.
- `git diff --check` → **CLEAN**. 종료 후 8000/5173 리스너 **없음**(확인 완료).

- 실행하지 못한 검증: 없음.

## 두 flagged behavior 판정
1. **authz `actor_role` 쿼리(기본 REVIEWER) + `actor_id` segregation** — **ACCEPTABLE (thin slice).**
   결정적 dev-auth 슬라이스로 타당. role 게이팅(APPROVE/REJECT는 approver role만) + segregation
   (proposer != approver)이 서버에서 독립 강제됨을 403 두 종류로 확인. `GovernanceCapabilities`는
   display-only hint로 boundary를 넓히지 않음. 프로덕션 실제 인증 바인딩은 기존 로드맵대로 P1 후속.
2. **change-item ref/`ontology_version_id`가 고정 seeded known-id 집합에만 resolve** — **ACCEPTABLE
   (thin slice), 문서화 권장.** deterministic 데모 재현성 목적. ADD 항목은 ref 불필요, MODIFY/DEPRECATE는
   `ONTOLOGY_REF_INVALID`(409)로 정직하게 거부. 실제 ontology 레지스트리 연동은 P1 후속.

두 항목 모두 **회귀/불변식 위반 아님**, blocker 아님.

## API/Enum/DTO 변경
- 변경 여부: 없음(QA 검증 전용). 스코프 이탈/리네임 0.

## Blocker
- 없음.

## 남은 TODO (P1/P2, non-blocking)
- 실제 인증 주체 바인딩(현재 dev-auth query) — P1.
- change-item ref를 실제 ontology 레지스트리에 resolve — P1.
- durable DB/Alembic persistence(현재 process-local + reset hook) — P1/P2.
- `openapi-mvp6-5-draft.json`은 standalone 계획 산출물 유지(BE 요청대로) — 러닝 앱과 0 mismatch 확인됨.

## 다른 역할에 전달할 내용
- PM: 프로즌 G1 first-touch / G2 단일 reason / G4 audit-asc+cursor 규칙이 런타임에서 정확히 구현됨.
  approval-!=-auto-apply 불변식 데이터 레벨 확정. Wave42 thin closeout 권고.
- Backend: 0 mismatch. router의 read-only project 검증 외 DB write 없음 확인. 이상 없음.
- Frontend: mock+actual 모두 재현 PASS. QUEUED warning 배지 / no 적용·게시 CTA / 단일 활성 LNB /
  0 overflow 확인. 이상 없음.
- QA: R1–R12 전부 PASS 기록됨(`INT6_5_GOVERNANCE_ACCEPTANCE.md`).

## 총괄에게 요청하는 결정
- **MVP6.5 Governance thin slice CLOSEOUT** 승인 요청. 별도 Wave43 하드닝 불필요(P1 후속만 남음).

## 현재 판정
- **PASS** (R1–R12 all PASS; approval-!=-auto-apply 데이터 레벨 확정; actual smoke PASS;
  회귀 clean; additive-only; 두 flagged behavior thin-slice 수용; git clean; 리스너 없음).
- 권고: **MVP6.5 GOVERNANCE THIN CLOSEOUT**.
