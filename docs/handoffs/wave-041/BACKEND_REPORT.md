# Backend Report - Wave 41

## 담당 범위
- backlog ID: `BE6-036`~`BE6-039` (theme `PM6-023`, MVP6.5 Governance)
- 작업 경로: `docs/api/MVP6_5_GOVERNANCE_API_CONTRACT_DRAFT.md`,
  `docs/api/openapi-mvp6-5-draft.json` (planning docs only — no `apps/`/`infra/`)

## 완료한 작업
- MVP6.5 거버넌스 추가형 API 계약 초안 작성. 온톨로지 change-request 라이프사이클
  (propose → submit → reviewer COMMENT/REQUEST_CHANGES → approver APPROVE/REJECT
  → APPROVED = QUEUED intent, nothing applied → audit trail) 정의.
- PM 동결 enum을 그대로 사용: `OntologyChangeRequestStatus`
  (DRAFT/OPEN/IN_REVIEW/APPROVED/REJECTED/WITHDRAWN), `GovernanceReviewAction`
  (COMMENT/REQUEST_CHANGES/APPROVE/REJECT — MVP3 `ReviewDecisionType` 리터럴
  재사용, MODIFY_AND_APPROVE 제외), `GovernanceApplicationState`
  (NOT_APPLICABLE/QUEUED + 예약 APPLIED/SUPERSEDED, P0에서 절대 생성 안 함),
  `ChangeRequestTargetKind` (CLASS/PROPERTY/RELATION), `ChangeRequestChangeType`
  (ADD/MODIFY/DEPRECATE), `GovernanceAuditAction` (9종).
- 계약에 안전 규칙 명시: REJECT/REQUEST_CHANGES/APPROVE reason 필수(422),
  approver != proposer(403 SELF_APPROVAL_FORBIDDEN), wrong-state 결정 → 409,
  모든 write 응답에 all-false 7-flag `GovernanceMutationGuard`, APPROVE는
  `application_state=QUEUED` 설정 + 온톨로지/게시 그래프에 아무것도 적용 안 함.
- shipped `Role` enum 재사용(approve/reject = ONTOLOGY_MANAGER/PROJECT_ADMIN/
  SYSTEM_ADMIN), MVP3/MVP5 audit shape는 참조로 재사용(리네임 없음).
- `docs/api/openapi-mvp6-5-draft.json` 생성 — OpenAPI 3.1.0, version `0.6.5-draft`,
  MVP1–MVP6.4에 대해 disjoint/additive (`/api/v1/.../ontology-change-requests` 계열).

## 변경 파일
- `docs/api/MVP6_5_GOVERNANCE_API_CONTRACT_DRAFT.md` (신규)
- `docs/api/openapi-mvp6-5-draft.json` (신규)
- `docs/handoffs/wave-041/BACKEND_REPORT.md` (본 보고서)

## 실행/검증
- 실행한 명령:
  - `python3 -m json.tool docs/api/openapi-mvp6-5-draft.json > /dev/null && echo PARSE_OK`
  - 스키마/참조 카운트 스크립트(python)
  - `git diff --check`
  - `git status --short`
- 결과:
  - `PARSE_OK`; openapi 3.1.0, info.version `0.6.5-draft`.
  - paths 9, operations 12, schemas 24, parameters 8, responses 4.
  - dangling schema/param/response ref 없음; unreferenced schema 없음 (모두 도달 가능).
  - `git diff --check` 통과 (`DIFF_CHECK_OK`), whitespace 오류 없음.
  - 변경은 `docs/` 하위 신규 파일뿐. `apps/`/`infra/` 미변경.
- 실행하지 못한 검증: 없음 (planning-only; 런타임 실행/테스트는 Wave42).

## API/Enum/DTO 변경
- 변경 여부: 있음 (계획 전용, additive)
- 상세:
  - Endpoint families (paths 9 / ops 12):
    A. change-request CRUD — `POST`/`GET /projects/{project_id}/ontology-change-requests`,
       `GET`/`PATCH /ontology-change-requests/{change_request_id}`
    B. change-item — `POST .../items`, `PATCH`/`DELETE .../items/{item_id}`
    C. lifecycle — `POST .../submit`, `POST .../withdraw`
    D. review+decision — `POST .../reviews` (단일 결정 엔드포인트, action 키)
    E. audit — `GET .../{id}/audit`, `GET /projects/{project_id}/governance-audit`
  - 핵심 DTO: `OntologyChangeRequest`, `OntologyChangeRequestDetail`,
    `OntologyChangeItem`(+Request), `GovernanceReviewDecisionRequest`,
    `GovernanceReviewDecision`, `GovernanceMutationResponse`(envelope),
    `GovernanceAuditEntry`, `GovernanceCapabilities`, `GovernanceApplicationBanner`,
    `GovernanceMutationGuard`(all-false 7-flag), list responses, `ApiError`.
  - Enum: 위 6종 신규 + `Role`(재사용, mirrored) + `GovernanceReviewAction`(MVP3 리터럴 재사용).
  - 모두 planning-only / additive. MVP1–MVP6.4 path/enum/schema 리네임·삭제 없음.
- 영향받는 역할: Frontend(IA/필드/상태/권한 UX), QA(수용 체크리스트).

## Blocker
- 없음.

## 남은 TODO
- Wave42 thin-implementation (FastAPI 라우트 + process-local store +
  `reset_runtime_store()` + smoke/test)은 FE 필드/상태/IA 리뷰와 QA 체크리스트
  확정 후 진행.
- 초안의 open questions 6건(§ Open Questions) FE/QA 확정 필요.

## 다른 역할에 전달할 내용
- PM: 동결 enum/boundary를 계약에 1:1 반영. `APPLIED`/`SUPERSEDED`는 예약만 하고
  P0 미생성. approve 정당화(justification)를 단일 `reason`로 처리(별도
  `application_note` 여부는 open question #2).
- Backend: 없음.
- Frontend:
  - 승인 == QUEUED-not-applied. detail 응답에 `application_banner`
    (`application_state` + KO 메시지) 제공 — "온톨로지/게시 그래프에 적용 안 됨" 배너로 노출.
  - RBAC: propose=모든 프로젝트 멤버; comment/request-changes=REVIEWER+상위;
    approve/reject=ONTOLOGY_MANAGER/PROJECT_ADMIN/SYSTEM_ADMIN; proposer는 self-APPROVE 불가.
    `GovernanceCapabilities`(8 bool 힌트)로 액션 disable 처리(서버가 최종 강제).
  - 결정 입력: REJECT/REQUEST_CHANGES/APPROVE는 reason 필수(빈값 422). COMMENT/withdraw는 선택.
  - 상태머신/에러: wrong-state 결정·mutation → 409 CHANGE_REQUEST_STATE_CONFLICT;
    submit 시 아이템 0개 → 409 CHANGE_REQUEST_NO_ITEMS; item ref 규칙 위반 → 409
    CHANGE_ITEM_TARGET_INVALID / ONTOLOGY_REF_INVALID. 아이템/제목 편집은 DRAFT/OPEN에서만.
  - DTO gap 있으면 FRONTEND_REPORT에 기록.
- QA:
  - all-false `GovernanceMutationGuard`(7-flag) 모든 write 응답 검증;
    특히 `change_auto_applied=false` + APPROVE 후 온톨로지/candidate/published/prompt/
    publish/extraction 무변경 데이터 레벨 확인.
  - 상태머신·reason 필수·409(terminal/wrong-state)·proposer!=approver(403) 검증.
  - audit 페이지네이션: per-request(`.../{id}/audit`) + project-scoped
    (`.../governance-audit`) 둘 다 limit/cursor. open question #3 확인.
  - 런타임 leakage(apps/infra) 없음 확인 — 본 wave는 docs 신규만.

## 총괄에게 요청하는 결정
- open question #2(approve justification vs 별도 `application_note`)와 #1(OPEN→IN_REVIEW
  auto-advance를 first COMMENT로 할지 명시 "start review" 액션을 둘지) — Wave42 착수 전
  FE/QA 합의로 확정 요청. Backend 기본안: 단일 `reason`, first reviewer touch에서 auto-advance.

## 현재 판정
- PASS (planning-only 산출물 완료: 계약 초안 + OpenAPI 파싱/카운트/ref 검증 통과,
  git diff --check 통과, apps/infra 미변경).
