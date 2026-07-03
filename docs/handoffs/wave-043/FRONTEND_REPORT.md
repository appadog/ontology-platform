# Frontend Report - Wave 43

## 담당 범위
- backlog ID: `FE6-065`~`FE6-068` (MVP6.6 Governance Change Application UX/API
  requirements — contract-first planning only)
- 작업 경로:
  - `docs/pm/MVP6_6_FRONTEND_UX_REQUIREMENTS.md` (생성)
  - `docs/handoffs/wave-043/FRONTEND_REPORT.md` (생성)

## 완료한 작업
- MVP6.6 apply 액션의 UX/API 요구사항을 planning-only로 작성했다. runtime route/
  component/type/mock/smoke/test 코드는 전혀 추가하지 않았다 (Wave44 대기).
- **IA 결정**: 신규 LNB item·신규 route 없음. apply 액션·application-status
  pre-check·applied-not-published 배너·application audit는 모두 기존 MVP6.5 detail
  (`/projects/:p/governance/:changeRequestId`, `GovernanceDetailPage.tsx`) 안의
  contextual 패널로, `status==APPROVED`일 때만 나타난다. apply는 detail에서 쏘는
  `POST` 액션이고 pre-check/audit는 read 패널(progressive disclosure)이라 route를
  추가하지 않는다.
- apply 액션 배치를 확정했다: `APPROVED`+`application_state==QUEUED` + 권한 role
  (`can_apply` capability hint; `ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`)
  일 때만 단일 primary action `초안에 적용`을 노출하고, 반드시 human-confirmation
  모달(draft-only·not-published 재확인, cancel 비파괴)을 거친 뒤 발사한다.
  single-click auto-apply 없음, 승인 시 자동 apply 없음.
- read-only application-status pre-check 패널을 정의했다: target DRAFT version(+
  `OntologyVersionStatus` 배지), per-item before/after preview(ADD=생성/MODIFY=갱신/
  DEPRECATE=ARCHIVED), staleness/would-supersede advisory hint(`STALE` 배지), 읽기
  전용 mutation 안심 문구.
- states를 확정했다: `APPLIED` D6 배지(success·`초안에 적용됨 (미게시)` — "게시"로
  안 읽히게), `SUPERSEDED` D6 배지(warning·`대체됨 (미적용)`·terminal),
  staleness/`409 CHANGE_REQUEST_SUPERSEDED` 비파괴 충돌 UX(no mutation·재적용 없음),
  idempotency 409(`CHANGE_ALREADY_APPLIED`/`CHANGE_NOT_APPLICABLE`/
  `APPLY_TARGET_NOT_DRAFT`) 명확한 notice, `403 PERMISSION_DENIED` degrade,
  applied-not-published 배너, application audit 뷰(before/after·resulting draft).
- **one-true-flag mutation-guard**를 trust/proof line으로 명시했다: 성공 apply만
  `ontology_draft_mutated=true`(그 외 6개 false), read/lifecycle/blocked-apply은
  all-false 유지.
- loading/empty(not-APPROVED)/ready/applied/superseded/permission-limited/conflict/
  error 상태를 일급으로 정의하고 기존 `PageState`+MVP6.5 notice/conflict band 재사용.
- 닫힌 design language 적용(KO title, Section+HanaCard, one primary action
  `초안에 적용`, progressive disclosure, D6 badge). auto-apply/auto-publish/게시
  copy 금지 가드.
- Backend draft 대비 DTO/field/state gap analysis를 작성했다(gap #1~#11). Backend
  contract draft/OpenAPI가 아직 없어서 blocking gap은 `AWAITING-BACKEND`로 표시.

## 변경 파일
- 생성:
  - `docs/pm/MVP6_6_FRONTEND_UX_REQUIREMENTS.md`
  - `docs/handoffs/wave-043/FRONTEND_REPORT.md`
- 수정: 없음 (apps/ 미변경)

## 실행/검증
- 실행한 명령:
  - `git diff --check` → PASS (whitespace/충돌 경고 없음).
  - 재사용 대상 read-only 확인(변경 없음): `apps/frontend/src/pages/GovernanceDetailPage.tsx`,
    `governanceShared.tsx`(`ApplicationStateBadge`가 현재 APPLIED/SUPERSEDED를
    unexpected-state로 렌더 — Wave44에서 실제 렌더로 교체 필요), `GovernanceBoardPage.tsx`,
    `shared/ui/platform/StatusBadge.tsx`(`SUPERSEDED`/`STALE` 토큰 존재, `APPLIED` 토큰
    부재 → gap #8), `shared/api/types.ts`(governance DTO/enum, `GovernanceApplicationState`에
    APPLIED/SUPERSEDED 이미 존재, `GovernanceCapabilities`에 `can_apply` 부재 → gap #3).
- 결과:
  - `git diff --check`: PASS.
  - apps/ 코드 무변경(요구사항 문서만).
- 실행하지 못한 검증:
  - Backend contract draft(`docs/api/MVP6_6_GOVERNANCE_APPLICATION_API_CONTRACT_DRAFT.md`)
    + `openapi-mvp6-6-draft.json`이 아직 없어 exact field name 대조/OpenAPI parse는
    수행 불가. Wave44 전 재대조 필요.

## API/Enum/DTO 변경
- 변경 여부: 없음 (문서 요구사항 한정; runtime type/OpenAPI/route 변경 없음).
- 상세:
  - FE가 Backend에 요구하는 신규(문서상): enum `GovernanceApplicationState`의
    APPLIED/SUPERSEDED 실제 생성, `GovernanceApplicationAuditAction`
    (`CHANGE_REQUEST_APPLIED`/`CHANGE_REQUEST_SUPERSEDED`); DTO apply request
    (optional `target_ontology_version_id`), application-status pre-check response,
    application audit entry, `GovernanceApplicationMutationGuard`(one-true-flag),
    `GovernanceCapabilities.can_apply`.
  - MVP1 ontology-version / MVP3 publish(미사용) / MVP5 `Role` / MVP3–MVP5 audit /
    MVP6.5 governance shape는 재사용·rename 없음.
- 영향받는 역할: Backend(계약 확정), QA(acceptance).

## Blocker
- 하드 blocker 없음(planning 산출물 완료).
- **의존성 1건**: Backend contract draft + `openapi-mvp6-6-draft.json` 부재.
  gap #1~#7, #9~#11이 `AWAITING-BACKEND`. Wave44 구현 전 필드명/pre-check
  staleness 동작(특히 pre-check GET가 QUEUED→SUPERSEDED flip 가능한지)/audit 병합
  여부/guard 키 7개를 반드시 대조해야 함.

## 남은 TODO (DTO gaps)
- gap #1: apply/pre-check/audit endpoint 경로 + DTO 필드명 확정 (Blocking, AWAITING-BACKEND).
- gap #2: target-draft default(현재 DRAFT vs 명시) 및 resolved target 노출 확인.
- gap #3: `GovernanceCapabilities.can_apply` 추가 확인 — 없으면 apply 컨트롤을
  비-optimistic하게 gate할 방법 없음 → 잠재 blocker.
- gap #4: 非-DRAFT target을 pre-check가 보고하는지(제출 전 disable).
- gap #5: pre-check staleness가 advisory인지 + pre-check GET가 스스로 SUPERSEDED로
  flip하는지(ADR 0013 open question) — copy가 이에 맞아야 함.
- gap #6: application audit이 MVP6.5 audit GET에 병합되는지 별도 GET인지 + before/after
  필드명.
- gap #7: `GovernanceApplicationMutationGuard` 7개 키 verbatim(`ontology_draft_mutated`,
  `evaluation_run_started` 등 MVP6.5 guard와 다름).
- gap #8(FE-owned, no BE dep): `StatusBadge` tokenTable에 `APPLIED` 추가 +
  `SUPERSEDED` governance-apply용 warning tone override, `ApplicationStateBadge`
  unexpected-state 가드 교체.
- gap #9~#11: applied_by/applied_at, board APPLIED/SUPERSEDED 렌더, OpenAPI additivity(QA).

## 다른 역할에 전달할 내용
- PM: MVP6.6 FE는 신규 LNB/route 0개 — 기존 detail 안의 contextual 패널로만 확장.
  application ≠ publish 경계를 confirmation 모달·applied-not-published 배너·
  one-true-flag proof line 3중으로 copy에 고정. 승인은 apply를 트리거하지 않음(모달
  필수).
- Backend: gap #1~#7이 blocking. 특히 (a) `GovernanceCapabilities.can_apply`
  display-only hint 추가(gap #3), (b) pre-check가 resolved `target_ontology_version_id`
  + `OntologyVersionStatus` + advisory `stale`/`would_supersede`를 반환(gap #2/#4/#5),
  (c) pre-check GET가 상태를 flip하는지 명시(gap #5), (d) `GovernanceApplicationMutationGuard`
  7키 verbatim + read/blocked-apply은 all-false 유지(gap #7), (e) application audit의
  before/after element ref 필드명 + 병합/분리 여부(gap #6). rename 금지.
- Frontend(Wave44 self): gap #8 — `StatusBadge`에 `APPLIED` 토큰 추가,
  `SUPERSEDED` warning override, `ApplicationStateBadge`의 unexpected-state 가드를
  실제 APPLIED/SUPERSEDED 렌더로 교체(단 그 외 예상외 리터럴은 unexpected 유지).
- QA(`INT6-051`~`054`): checklist에 넣을 것 — apply는 APPROVED+QUEUED에서만; 성공
  apply만 `ontology_draft_mutated=true`(그 외 all false), 非-apply/blocked-apply은
  all-false; published graph data-level 불변; idempotency 409·staleness→SUPERSEDED
  시 mutation 0; authz 403; confirmation 모달 없이는 apply 발사 안 됨; `게시`/`배포`
  affordance 부재; applied-not-published 배너 존재; OpenAPI parse/additivity.

## 총괄에게 요청하는 결정
- Wave43 Frontend planning 산출물(`MVP6_6_FRONTEND_UX_REQUIREMENTS.md`)을 PASS로
  승인 요청.
- Backend contract draft + `openapi-mvp6-6-draft.json`가 랜딩하면 Frontend가
  gap #1~#7/#9~#11을 재대조하도록 짧은 reconciliation 후 Wave44 thin-implementation
  진입 승인 요청.
- 확인 요청: apply UX가 신규 LNB/route 없이 기존 detail contextual 패널로만
  확장되는 것, 그리고 application ≠ publish(draft-only) 경계를 3중 copy로 고정하는
  방향 승인.

## 현재 판정
- PASS (planning-only 산출물 완료; apps/ 미변경; `git diff --check` PASS; Backend
  contract 부재는 `AWAITING-BACKEND` 의존성으로 명시, 하드 blocker 아님).
