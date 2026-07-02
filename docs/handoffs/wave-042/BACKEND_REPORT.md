# Backend Report - Wave 42

## 담당 범위
- backlog ID: BE6-040 (change-request CRUD + items), BE6-041 (submit/withdraw + review-decision state machine), BE6-042 (audit + governance mutation guard + authz/segregation), BE6-043 (OpenAPI export/alignment + no-mutation regression guard)
- 작업 경로: `apps/backend/app/modules/governance/`, `apps/backend/app/api/router.py`, `apps/backend/tests/test_mvp6_5_governance_api.py`

## 완료한 작업
- 이전 세션이 만들어 둔 governance 모듈(`router.py`/`schemas.py`/`service.py`/`__init__.py`)을 검토·검증. 계약/enum/필드/G1·G2·G4 규칙과 정합함을 확인(재작성 없음).
- governance 라우터를 `app/api/router.py`에 **추가 등록**(goldset_authoring 다음, additive). 9개 path / 12 operation이 러닝 앱에 노출됨을 확인.
- `reset_runtime_store()` 훅 존재 확인(테스트 결정성 확보; goldset_authoring/evaluation 패턴과 동일).
- `tests/test_mvp6_5_governance_api.py` 신규 작성(28 케이스): propose/items/submit/withdraw, 각 리뷰 액션 + 전체 상태 전이, G1 first-touch REVIEW_STARTED 순서 + REQUEST_CHANGES 후 재발화, reason 422, self-approval 403, role 403, wrong-state 409, no-items 409, APPROVE=QUEUED-nothing-applied, all-false guard, audit ASC/pagination/filter, change-item target 검증, OpenAPI 필드/enum 정합.
- OpenAPI 런타임 vs `openapi-mvp6-5-draft.json` 정합 확인(9 path / 12 op / 22 governance schema, 누락 0). draft는 standalone 계획 산출물이므로 전체 앱 스키마로 덮어쓰지 않음(러닝 앱과 정합 유지).

## 변경 파일
- `apps/backend/app/api/router.py` — governance 라우터 import + `include_router` 등록 (additive, goldset_authoring 다음).
- `apps/backend/tests/test_mvp6_5_governance_api.py` — 신규 테스트 파일.
- (이전 세션 산출물, 검증만 함/재작성 없음) `apps/backend/app/modules/governance/{router,schemas,service,__init__}.py`.

## 실행/검증
- 실행한 명령 / 결과:
  - `.venv/bin/pytest tests/test_mvp6_5_governance_api.py -q` → **28 passed in 5.91s**
  - `.venv/bin/pytest tests/test_mvp6_4_goldset_authoring_api.py -q` → **21 passed in 4.47s**
  - `.venv/bin/pytest -q` (전체 회귀) → **105 passed in 16.59s**
  - `.venv/bin/ruff check app tests scripts` → **All checks passed!**
  - OpenAPI parse/compare(MVP6.5) → `draft paths: 9 | missing in runtime: []`, `runtime governance operations: 12`, `governance draft schemas: 22 | missing in runtime: []`, `OK`
  - `git diff --check` → exit 0 (whitespace 문제 없음)
- 실행하지 못한 검증: 없음.

## API/Enum/DTO 변경
- 변경 여부: 없음 (계약/스키마 신규 추가는 이전 세션에서 완료됨; 이번 웨이브는 등록·테스트·검증만).
- 상세: MVP3 `ReviewDecisionType`(APPROVE/REJECT/REQUEST_CHANGES) + MVP5 `Role`은 `app.core.enums`에서 by-reference 재사용, 리네임 없음. `GovernanceReviewAction`은 그 리터럴 + `COMMENT` 추가, `MODIFY_AND_APPROVE` 제외. 모든 write 응답은 all-false 7-flag `GovernanceMutationGuard`.
- 영향받는 역할: Frontend(계약 소비), QA(러ntime 게이트 검증).

## Blocker
- 없음.

## 남은 TODO
- 없음(Backend 범위). QA가 approval-!=-auto-apply 불변식을 데이터 레벨에서 독립 검증 예정.

## 다른 역할에 전달할 내용
- PM: 프로즌 규칙 G1/G2/G4 모두 코드·테스트로 검증됨. 스코프 이탈 없음(APPLIED/SUPERSEDED 미생성, all-false guard).
- Backend: 없음.
- Frontend (계약 상세):
  - **리뷰 엔드포인트**: `POST /api/v1/ontology-change-requests/{id}/reviews`, body `{ action, reason? }`. `action ∈ COMMENT|REQUEST_CHANGES|APPROVE|REJECT`. reason은 REQUEST_CHANGES/APPROVE/REJECT에 **필수(비어있으면 422 REASON_REQUIRED)**, COMMENT은 optional.
  - **403 코드**: 권한 부족 `PERMISSION_DENIED`(approve/reject는 ONTOLOGY_MANAGER/PROJECT_ADMIN/SYSTEM_ADMIN만; comment/request_changes는 REVIEWER 이상); 자기 승인 `SELF_APPROVAL_FORBIDDEN`(approve만, 제안자==승인자).
  - **409 코드**: `CHANGE_REQUEST_STATE_CONFLICT`(DRAFT/terminal 상태에서 결정·수정, 재submit); `CHANGE_REQUEST_NO_ITEMS`(0개 항목 submit); item 검증 `CHANGE_ITEM_TARGET_INVALID`/`ONTOLOGY_REF_INVALID`.
  - **422**: `REASON_REQUIRED`.
  - **QUEUED 동작**: APPROVE → `status=APPROVED`, `application_state=QUEUED`, `change_auto_applied=false`, 아무것도 적용 안 됨. `application_state`는 승인일 때만 QUEUED, 그 외 NOT_APPLICABLE. detail의 `application_banner.application_state`가 QUEUED로 표시됨 → 성공(초록)이 아닌 **경고 톤 `큐잉됨(미적용)`** 배지로 렌더링. APPLIED/SUPERSEDED는 절대 발생하지 않음.
  - **G1 first-touch**: OPEN 상태에서 첫 COMMENT/REQUEST_CHANGES가 원자적으로 IN_REVIEW로 전이하고 REVIEW_STARTED를 액션 감사보다 먼저 기록. REQUEST_CHANGES는 OPEN으로 복귀 → 다음 리뷰어 터치에서 REVIEW_STARTED 재발화(OPEN 에피소드당 1회). APPROVE/REJECT는 OPEN에서 직접 유효(REVIEW_STARTED 없음).
  - **audit pagination**: `GET .../{id}/audit`, `GET /projects/{p}/governance-audit` — 시간순 **ASC**, opaque `cursor`(base64 offset), `limit` 기본 50/최대 100, `action` 필터. 응답 `{ items, total_count, next_cursor }`.
  - **G4**: 리스트 DTO에 current-reviewer 필드 없음. board는 서버 페이지네이션 + 클라이언트측 status 그룹핑. 리스트 필터: `status`, `application_state`.
- QA: approval-!=-auto-apply / all-false guard / 상태머신 / 403·409·422 / audit 내용 검증용 러닝 게이트 준비 완료. `service.reset_runtime_store()` + `seed_mvp3(reset=True)`로 결정적 재현.

## 총괄에게 요청하는 결정
- `openapi-mvp6-5-draft.json`은 standalone 계획 산출물로 유지(전체 앱 export로 덮어쓰지 않음). 러닝 앱과 완전 정합(테스트로 강제). 이 정책 유지 확인 요청 — 별도 조치 불필요.

## 현재 판정
- PASS
