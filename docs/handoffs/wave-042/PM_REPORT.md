# PM Report - Wave 42

## 담당 범위
- backlog ID: `PM6-024` (MVP6.5 Governance THIN IMPLEMENTATION 게이트 동결 + 스코프 가드)
- 작업 경로: `docs/pm/MVP6_5_GOVERNANCE_BRIEF.md` (§10 신설),
  `docs/backlog/MVP6_DRAFT_BACKLOG.md` (Wave42 게이트 동결 요약 + 구현 ID 등록).
  런타임 코드 변경 없음(`apps/`/`infra/` 미변경).

## 완료한 작업
Wave41 오픈 게이트 G1/G2/G4를 정확히 하나의 규칙으로 동결하고 G3(총괄 IA 재정)를
기록했다. 스코프 불변 + 수용 게이트를 재명시했다. Backend/Frontend를 차단하는 PM 선행
작업 완료.

- **G1 (OPEN→IN_REVIEW auto-advance) 동결 = first-touch.** 별도 "start review"
  액션 없음. `OPEN` 요청에 첫 review 액션(`COMMENT` 또는 `REQUEST_CHANGES`)이
  기록될 때 그 write가 원자적으로 `status=IN_REVIEW`로 전이하고, 해당 액션의 감사
  이벤트(`COMMENT_ADDED`/`CHANGES_REQUESTED`)보다 **먼저** `REVIEW_STARTED`를
  감사한다. `APPROVE`/`REJECT`는 `OPEN`에서 직접 유효(IN_REVIEW 선행조건 없음)하며
  `REVIEW_STARTED`를 발생시키지 않는다. `REQUEST_CHANGES`로 `OPEN` 복귀 시 다음
  reviewer touch에서 `REVIEW_STARTED` 재발생(OPEN 에피소드당 1회). 단순성 근거로
  first-touch 채택.
- **G2 (approve justification) 동결 = 단일 `reason` 필드.** 별도 `application_note`
  없음. `APPROVE`는 `GovernanceReviewDecisionRequest`의 단일 `reason`(필수·비어있으면
  `422 REASON_REQUIRED`)을 `REJECT`/`REQUEST_CHANGES`와 동일하게 사용.
- **G4 (FE 필드 shape) 확정:**
  - 감사 정렬/페이지네이션: 두 audit read 모두 **시간 오름차순**(oldest→newest),
    `limit`/`cursor` opaque-cursor(기본 50, 최대 100). UI는 로드된 페이지를 뒤집어
    newest-first 렌더 가능하나 wire order는 asc.
  - 보드 리스트 페이지네이션: `limit`/`cursor` opaque-cursor(기본 50, 최대 100);
    상태 그룹핑은 로드된 페이지 내 **client-side**.
  - 리스트 DTO에 현재 reviewer 필드 추가: **아니오(NO)**. `OntologyChangeRequest`는
    draft 그대로. 보드는 detail의 최신 `GovernanceReviewDecision`에서 파생. 최소 DTO
    유지 + denormalize/stale 회피.
- **G3 (IA) 재정(총괄 룰 확정).** Governance = Review 그룹 아래 신규 project-zone LNB
  항목(`/projects/:p/governance`); detail(`/governance/:id`)은 contextual ID-bound
  라우트(ADR 0010), LNB 항목 아님. 활성 LNB 1개 유지. (zero-new-item fallback 아님.)
- 스코프 불변 확인 + 수용 게이트 재명시(아래 §다른 역할에 전달).

## 변경 파일
- `docs/pm/MVP6_5_GOVERNANCE_BRIEF.md` (§10 Wave42 Gate Freeze 신설)
- `docs/backlog/MVP6_DRAFT_BACKLOG.md` (Status 갱신, Wave42 게이트 동결 요약 +
  구현 ID `BE6-040`~`BE6-043`/`FE6-061`~`FE6-064`/`INT6-047`~`INT6-050` 등록)
- `docs/handoffs/wave-042/PM_REPORT.md` (본 보고서)

## 실행/검증
- 실행한 명령: `git diff --check`
- 결과: PASS (whitespace 오류 없음, 출력 없음). 변경은 `docs/` 하위 3개 파일뿐;
  `apps/`/`infra/` 미변경.
- 실행하지 못한 검증: 없음 (PM 문서 동결 범위; 런타임/테스트는 Backend/Frontend/QA).

## API/Enum/DTO 변경
- 변경 여부: 없음 (신규/리네임 없음).
- 상세: G1/G2/G4 동결은 기존 draft의 open question 기본안을 확정한 것으로, enum/DTO
  추가·리네임 없음. `OntologyChangeRequest`는 draft 그대로(G4 current-reviewer=NO).
  `openapi-mvp6-5-draft.json`의 필드/enum 이름은 현행 동결 — Backend가 구현 시 그대로
  일치시킨다.
- 영향받는 역할: Backend(G1 상태전이/감사 순서, G2 단일 reason, G4 audit asc + cursor),
  Frontend(G3 IA, G4 페이지네이션/그룹핑/현재 reviewer 파생), QA(수용 게이트).

## Blocker
- 없음.

## 남은 TODO
- Backend: 동결 게이트대로 endpoint families + process-local store +
  `reset_runtime_store()` + tests + OpenAPI 정합 구현(`BE6-040`~`BE6-043`).
- Frontend: G3 IA 라우트/LNB + 보드/propose/detail + 4-mode 권한 + QUEUED 배너 +
  D6 배지 + mock/actual smoke(`FE6-061`~`FE6-064`).
- QA: approval-≠-auto-apply 불변식 독립 검증 + 상태머신 + authz + 회귀(`INT6-047`~`INT6-050`).

## 다른 역할에 전달할 내용
- **Backend (`BE6-040`~`BE6-043`)** — 그대로 구현:
  - **G1 first-touch**: `OPEN`에 첫 `COMMENT`/`REQUEST_CHANGES` 기록 시 그 write가
    `status→IN_REVIEW` 전이 + `REVIEW_STARTED` 감사(액션 감사 이벤트보다 먼저).
    별도 start-review 액션 없음. `APPROVE`/`REJECT`는 `OPEN`에서 직접 유효,
    `REVIEW_STARTED` 미발생. `REQUEST_CHANGES`로 `OPEN` 복귀 후 다음 touch에서
    `REVIEW_STARTED` 재발생. 이미 `IN_REVIEW`면 재발생 없음.
  - **G2 단일 `reason`**: `APPROVE`는 `GovernanceReviewDecisionRequest.reason`
    (필수·비어있으면 `422 REASON_REQUIRED`). `application_note` 없음.
  - **G4 audit asc**: 두 audit read 모두 시간 오름차순 + `limit`/`cursor`(기본 50,
    최대 100). 보드 리스트도 `limit`/`cursor`. `OntologyChangeRequest`에 현재
    reviewer 필드 추가 금지(draft 그대로).
  - openapi-mvp6-5-draft.json 필드/enum 이름 정확히 일치. MVP3/MVP5 리네임 금지.
- **Frontend (`FE6-061`~`FE6-064`)**:
  - **G3 IA(확정)**: `/projects/:p/governance` = Review 그룹 신규 LNB 항목; detail
    `/governance/:id`은 contextual ID-bound(LNB 아님); 활성 LNB 1개;
    breadcrumb `프로젝트명 > Governance > 변경 요청 #<id>`.
  - **G4**: 보드는 로드 페이지 내 status client-side 그룹핑 + `limit`/`cursor`.
    audit는 wire asc(원하면 UI에서 뒤집어 newest-first 표시). 현재 reviewer는 리스트
    DTO에 없음 — 최신 `GovernanceReviewDecision`에서 파생.
  - QUEUED는 warning 톤 `큐잉됨(미적용)` 배지(success 아님) + 상시 approval-≠-apply
    배너, `적용`/`게시` CTA 없음.
- **QA (`INT6-047`~`INT6-050`)** — 반드시 검증할 게이트:
  - approval=QUEUED-not-applied: `APPROVE` 후 `application_state=QUEUED`,
    `change_auto_applied=false`, 데이터 레벨에서 ontology/published/candidate/prompt
    무변경; `APPLIED`/`SUPERSEDED` 미생성.
  - 모든 write 응답 all-false 7-flag `GovernanceMutationGuard`.
  - authz+segregation: approve/reject = ONTOLOGY_MANAGER/PROJECT_ADMIN/SYSTEM_ADMIN
    (else 403); approver!=proposer(403 SELF_APPROVAL_FORBIDDEN).
  - reason 필수(REJECT/REQUEST_CHANGES/APPROVE) → 422; wrong-state/terminal → 409
    CHANGE_REQUEST_STATE_CONFLICT; submit 0 items → 409 CHANGE_REQUEST_NO_ITEMS.
  - G1 first-touch 전이 + `REVIEW_STARTED` 순서; MVP3/MVP5 리네임 없음.

## 총괄에게 요청하는 결정
- G1=first-touch, G2=단일 `reason`, G4=audit asc + cursor + current-reviewer NO,
  G3=Review 그룹 신규 LNB 항목으로 동결/재정했다. 이견 없으면 Backend∥Frontend 착수
  승인 요청.

## 현재 판정
- PASS (G1/G2/G4 동결 + G3 재정 + 스코프/게이트 재명시 완료; `git diff --check` 통과;
  `apps/`/`infra/` 미변경; enum/DTO 변경 없음).
