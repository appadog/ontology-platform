# QA / Integration Report - Wave 41

## 담당 범위
- backlog ID: `INT6-043`~`INT6-046` (theme `PM6-023`, MVP6.5 Governance workflow)
- 작업 경로:
  - `docs/backlog/INT6_5_GOVERNANCE_ACCEPTANCE.md` (생성)
  - `docs/handoffs/wave-041/QA_REPORT.md` (본 보고서)
  - `apps/`, `infra/` 미변경 (planning-only wave)

## 완료한 작업
- MVP6.5 Governance workflow contract-first planning의 executable acceptance
  checklist(`INT6_5_GOVERNANCE_ACCEPTANCE.md`)를 작성했다. 표준 verdict
  semantics(PASS/PARTIAL/FAIL/NOT RUNNABLE) + C1–C12 planning gate + R1–R12
  NOT-RUNNABLE runtime gate로 구성했다.
- PM brief / ADR 0012 / Backend contract+OpenAPI / Frontend UX 요구사항이 P0 flow·
  states/enums·decision command+reason rules·RBAC+직무분리·approval-≠-auto-apply
  boundary·audit content·safety boundary·exclusion에 합의하는지 대조하고 모두 일치
  확인했다(0 DTO mismatch, 재사용 shape rename 없음).
- OpenAPI planning artifact를 parse + 스키마/enum/guard/DTO assertion + additivity로
  검증했다.
- `apps/`/`infra/`에 MVP6.5 governance runtime leakage가 없음을 확인했다.
- Wave42 gate 4건을 명시적으로 기록했다(G1 auto-advance trigger, G2 approve
  justification vs application_note, G3 COMMANDER IA ruling, G4 FE non-blocking
  confirms).

## 변경 파일
- 생성: `docs/backlog/INT6_5_GOVERNANCE_ACCEPTANCE.md`,
  `docs/handoffs/wave-041/QA_REPORT.md`
- `apps/`/`infra/` 미변경.

## 실행/검증
- 실행한 명령 + 결과:
  ```text
  python3 -m json.tool docs/api/openapi-mvp6-5-draft.json > /dev/null && echo PARSE_OK
  # -> PARSE_OK

  python3 <assertion script>
  # -> openapi 3.1.0 ; info.version 0.6.5-draft
  # -> path_objects 9 ; operations 12 ; schemas 24 ; parameters 8 ; responses 4
  # -> 9 paths all present (CRUD / items / submit / withdraw / reviews / audit x2)
  # -> enums OK exact literals: OntologyChangeRequestStatus / GovernanceReviewAction /
  #      GovernanceApplicationState / ChangeRequestTargetKind / ChangeRequestChangeType /
  #      GovernanceAuditAction(9)
  # -> GovernanceReviewAction excludes MODIFY_AND_APPROVE: True
  # -> GovernanceMutationGuard: 7 flags, every flag const/default false
  # -> GovernanceCapabilities: 8 can_* flags
  # -> key DTOs present (OntologyChangeRequest[Detail], OntologyChangeItem,
  #      GovernanceReviewDecisionRequest/Decision, GovernanceMutationResponse,
  #      GovernanceAuditEntry, GovernanceApplicationBanner, Role)
  # -> error codes present: SELF_APPROVAL_FORBIDDEN / CHANGE_REQUEST_STATE_CONFLICT /
  #      CHANGE_REQUEST_NO_ITEMS / REASON_REQUIRED / PERMISSION_DENIED

  python3 <additivity vs 8 prior openapi-mvp*-draft.json>
  # -> OVERLAP: NONE (all 9 MVP6.5 paths disjoint from MVP1–MVP6.4)

  rg -n 'ontology-change-request|OntologyChangeRequest|GovernanceReview|GovernanceMutation|governance-audit|MVP6.5|mvp6.5' apps infra --glob '!**/node_modules/**'
  # -> no matches (exit 1): no MVP6.5 runtime leaked

  git diff --check
  # -> clean (exit 0)
  ```
- 실행하지 못한 검증: 런타임 acceptance(R1–R12)는 MVP6.5 구현이 존재하지 않으므로
  설계상 `NOT RUNNABLE`. Wave42 thin-implementation에서 실행한다.

## API/Enum/DTO 변경
- 변경 여부: 없음 (QA는 planning checklist + 보고서만 작성). runtime/OpenAPI/route
  변경 없음.
- 상세: Backend가 확정한 6개 신규 enum + DTO를 checklist가 참조·검증만 했다. MVP3
  `ReviewDecisionType`/`Role`/audit shape는 verbatim 재사용 확인(rename 없음).
- 영향받는 역할: PM/Backend/Frontend (Wave42 gate 참조).

## 남긴 판정 — 영역별 findings
- **PM (brief §1–§9, ADR 0012)**: P0를 lifecycle spine으로 최소화하고 위험한
  publish/rollback/impact/migration/re-validation을 전부 제외. approval =
  QUEUED intent, auto-apply 없음이 durable ADR로 기록됨. PASS.
- **Backend (contract + openapi-mvp6-5-draft.json)**: 9 path/12 op/24 schema,
  6 enum exact, all-false 7-flag guard, RBAC + self-approval + reason + 409/422
  전부 계약에 명시. OpenAPI parse/assert/additivity 통과. PASS.
- **Frontend (UX 요구사항)**: Review 그룹 하위 project-scoped Governance,
  application_state=QUEUED warning 배지, approver≠proposer 사전 disable,
  4-mode capability 렌더, D6 배지, 8 Blocking gap RESOLVED(0 mismatch). PASS.
- **합의 여부**: PM/BE/FE 완전 일치. 상충 없음.

## Wave42 Gates (기록)
- **G1 (Backend Open Q2, PM freeze)**: `OPEN→IN_REVIEW` auto-advance trigger —
  first reviewer touch(draft) vs 명시적 "start review" 액션. R3가 이 규칙을 검증.
- **G2 (Backend Open Q1, PM/FE freeze)**: approve justification을 단일 `reason`으로
  둘지(draft) vs 별도 optional `application_note`를 둘지. R11이 검증.
- **G3 (COMMANDER IA RULING — 이미 결정, 기록)**: Governance는 Review 그룹 하위
  **신규 project-zone LNB 항목**(`/projects/:p/governance`)으로 추가한다(zero-new-item
  fallback 아님). change-request detail은 board/breadcrumb에서 도달하는 contextual
  ID-bound route로 유지(ADR 0010). FE가 문서화한 (A)안 채택, (B) Review-inbox
  fallback 미채택. R12가 활성 LNB 1개(Governance) 검증.
- **G4 (FE non-blocking confirms, Wave42)**: audit 정렬/pagination(#9),
  board pagination(#10), 현재 reviewer/approver 필드 필요 여부(#11). boundary
  불변, blocking 아님.

## Blocker
- 없음. (작업트리에 다른 wave의 미커밋 변경(MVP6.4 등)이 있으나 QA는 지정 문서 2개만
  생성했고 다른 변경을 되돌리거나 덮어쓰지 않았다.)

## 남은 TODO
- Wave42 thin-implementation 착수 시: PM/FE가 G1·G2 먼저 freeze, G4 필드 확정 →
  Backend/FE/QA가 단일 규칙으로 구현·테스트. R1–R12 실행.

## 다른 역할에 전달할 내용
- PM: Wave42 착수 전 G1(auto-advance)·G2(approve reason vs application_note) freeze
  요청. G3 IA ruling은 기록 완료.
- Backend: draft 필드/enum 이름 그대로 구현. all-false guard + `change_auto_applied`
  + `APPLIED`/`SUPERSEDED` 미생성 + no hard-delete 유지.
- Frontend: draft 필드명 유지(`proposer_id`/`item_count`/`can_edit_request`/
  `resulting_application_state`/opaque `proposed_change`/별도 `.../items`). G3대로
  Review 그룹 LNB 1개 추가. G4 확정.
- QA(Wave42 self): R1–R12 실행. R3=G1 규칙, R11=G2 규칙, R12=G3 LNB 검증. runtime
  data-level no-mutation(approve 후 ontology/candidate/published/prompt/publish/
  extraction 0 변경) 독립 확인.

## 총괄에게 요청하는 결정
- Wave41 planning을 PASS로 승인하고 Wave42 MVP6.5 thin implementation을 개시해 달라.
- G1/G2를 Wave42 착수 전 PM/FE freeze 항목으로 확정해 달라. G3(신규 Review-그룹
  LNB 항목)은 이미 결정된 것으로 기록했다.

## 현재 판정
- PASS (contract-first planning). C1–C12 all PASS; runtime R1–R12 `NOT RUNNABLE`
  by design. Recommendation: **Wave42 MVP6.5 Governance thin implementation**.
