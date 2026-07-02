# PM / Architecture Report - Wave 41

## 담당 범위
- backlog ID:
  - `PM6-023` MVP6.5 Governance workflow (ontology change-request lifecycle) P0 scope freeze
  - (생성한 후속 ID: `BE6-036`~`BE6-039`, `FE6-057`~`FE6-060`, `INT6-043`~`INT6-046`)
- 작업 경로:
  - `docs/pm/MVP6_5_GOVERNANCE_BRIEF.md`
  - `docs/adr/0012-mvp6-5-governance-approval-not-auto-apply-boundary.md`
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
  - `docs/handoffs/wave-041/PM_REPORT.md`

## 완료한 작업
- 다음 MVP6 theme P0로 **auditable ontology change-request lifecycle**
  (propose → review → approve/reject → audit)를 선택하고 contract-first
  planning으로 freeze했다. Runtime API/route/component/model/migration/seed/
  smoke/test는 열지 않았다 (Wave42 대기).
- 가장 작은 coherent governance P0로 **lifecycle spine만** 확정하고, 로드맵
  Theme 3(`§6`)의 위험한 부분(`.../publish`, `.../rollback`, 자동 impact
  analysis, migration plan, release note, 변경 후 re-validation/re-extraction)을
  전부 P0에서 제외했다.
- P0 demo flow를 확정했다: `select project -> open Governance (Review group) ->
  propose change request (change items: target_kind × change_type + element ref
  + ontology_version_id + intent-only payload) -> submit (DRAFT→OPEN) ->
  reviewer COMMENT / REQUEST_CHANGES (reason, →OPEN) -> approver APPROVE(justify)
  / REJECT(reason) -> APPROVED면 application_state=QUEUED (아무것도 적용 안 함) ->
  audit trail 확인 -> "approved = queued intent, not yet applied" 배너 확인`.
- 신규 enum/state를 확정했다(MVP3 review-decision/RBAC/audit `$ref` 재사용,
  rename 없음):
  - `OntologyChangeRequestStatus`(`DRAFT`/`OPEN`/`IN_REVIEW`/`APPROVED`/
    `REJECTED`/`WITHDRAWN`)
  - `GovernanceReviewAction`(`COMMENT`/`REQUEST_CHANGES`/`APPROVE`/`REJECT` —
    MVP3 `ReviewDecisionType` 리터럴 재사용, `MODIFY_AND_APPROVE` 의도적 제외)
  - `GovernanceApplicationState`(`NOT_APPLICABLE`/`QUEUED`; `APPLIED`/
    `SUPERSEDED`는 later slice 예약, P0 미생성)
  - `ChangeRequestTargetKind`(CLASS/PROPERTY/RELATION),
    `ChangeRequestChangeType`(ADD/MODIFY/DEPRECATE)
  - `GovernanceAuditAction`(9개 audit event)
- **CRITICAL boundary 결정**(테마의 핵심, ADR 0012에 durable 기록): approval은
  intent + audit만 기록한다. `APPROVED`는 `application_state=QUEUED`로 큐잉될
  뿐, P0에서는 ontology definition/candidate/published graph에 아무것도 적용하지
  않고 publish/extraction job도 시작하지 않는다. "approved"의 의미 =
  actor+role+reason+timestamp+target element(s)+ontology_version_id를 담은
  decision of record이며 아직 일어나지 않은 미래 적용을 승인하는 것. 실제 적용은
  기존 MVP1 ontology-edit + MVP3 publish 경로를 통해 사람이 별도로 개시/감사하는
  later slice이다.
- RBAC를 확정했다(shipped `Role` verbatim 재사용, 신규 role 리터럴 없음):
  propose = 모든 project member; review/comment/request-changes = `REVIEWER`+상위;
  approve/reject = `ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`. proposer는
  자기 요청을 승인 불가(segregation of duties). 미인가 `403`, 잘못된 상태 `409`.
- reason 규칙: `REJECT`/`REQUEST_CHANGES`/`APPROVE`는 non-empty reason 필수,
  `COMMENT`/`WITHDRAW`는 선택.
- safety boundary를 freeze했다: governance는 decision-record layer only.
  ontology definition/published/candidate/prompt mutation 없음, publish/
  extraction job 시작 없음, auto-apply 없음(`change_auto_applied` 항상 false),
  hard delete 없음. 모든 governance write 응답은 all-false 7-flag
  `GovernanceMutationGuard`를 노출한다.
- exclusion을 명시했다(auto-apply, enforcement, autonomous/agent publish+rollback,
  impact simulation, migration/release-note generation, re-validation/
  re-extraction, ontology diff viz, auto reviewer assignment, real LLM, agents,
  connectors, multi-tenant; durable DB/Alembic는 P0 미요구·P1/P2).
- backlog에 Wave41 freeze summary + `PM6-023`/`BE6-036`~`039`/`FE6-057`~`060`/
  `INT6-043`~`046`을 기존 번호 체계를 이어 추가하고, 상단 status도 갱신했다.
  QA IDs는 지시대로 `INT6-043`부터 시작(INT6는 INT6-042까지 사용됨).
- 새 durable boundary 결정(approval != auto-apply)이므로 ADR `0012`를 기존
  per-MVP boundary 패턴(0006~0011)으로 추가했다.

## 변경 파일
- 생성:
  - `docs/pm/MVP6_5_GOVERNANCE_BRIEF.md`
  - `docs/adr/0012-mvp6-5-governance-approval-not-auto-apply-boundary.md`
  - `docs/handoffs/wave-041/PM_REPORT.md`
- 수정:
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`

## 실행/검증
- 실행한 명령:
  - `git diff --check`
  - 재사용 vocabulary 근거 확인(read-only, 변경 없음):
    `apps/backend/app/core/enums.py`(`ReviewDecisionType`, `Role`,
    `ReviewTaskStatus`, `AuditEventType`, `OntologyElementStatus`),
    ADR 0006/0008/0011, 로드맵 `04_...md` §6.
  - `apps/`/`infra/`에 governance/change-request runtime leakage 부재 확인.
- 결과:
  - `git diff --check`: PASS (출력 없음, `DIFF-CHECK-CLEAN`).
  - 재사용 근거 확인: 실제 shipped `Role`은 `SYSTEM_ADMIN`/`PROJECT_ADMIN`/
    `ONTOLOGY_MANAGER`/`DATA_MANAGER`/`EXTRACTION_MANAGER`/`REVIEWER`/`VIEWER`/
    `API_CLIENT`이고(ADR 0008이 계획했던 canonical set과는 다름), brief/ADR는
    **런타임 코드의 실제 enum**을 verbatim 재사용하도록 작성했다.
    `ReviewDecisionType`(`APPROVE`/`REJECT`/`REQUEST_CHANGES`/
    `MODIFY_AND_APPROVE`)의 리터럴을 `GovernanceReviewAction`이 재사용하고
    `MODIFY_AND_APPROVE`만 제외.
  - runtime leakage: `NO governance runtime leakage in apps/ or infra/`.
- 실행하지 못한 검증:
  - PM/Architecture 문서 범위라 backend/frontend runtime/test/OpenAPI export는
    수행하지 않는다. OpenAPI planning artifact 작성/parse는 Backend(`BE6-039`) 몫.

## API/Enum/DTO 변경
- 변경 여부: 있음, **문서 계약 한정** (runtime/OpenAPI/DB/route 변경 없음)
- 상세:
  - Runtime API, `docs/api/openapi-*.json`, DB model/migration, frontend
    route/component는 변경하지 않았다.
  - 신규 enum 후보를 문서상 확정: `OntologyChangeRequestStatus`,
    `GovernanceReviewAction`, `GovernanceApplicationState`,
    `ChangeRequestTargetKind`, `ChangeRequestChangeType`, `GovernanceAuditAction`.
    MVP3 `ReviewDecisionType`/`Role`/audit shape는 `$ref`로 재사용, rename 없음.
  - 신규 DTO 후보(문서 계약): `OntologyChangeRequest`, `OntologyChangeItem`,
    review/decision request, audit entry, `GovernanceMutationGuard`(all-false
    7-flag). Backend가 `BE6-036`~`039`에서 최종 필드/이름을 확정한다.
- 영향받는 역할: Backend/Frontend/QA (아래 전달 내용 참조).

## Blocker
- 없음.
- 주의: 작업트리에 다른 wave/역할 변경(MVP6.4 미커밋분 등)이 있다. PM은 지정된
  PM/backlog/ADR/handoff 문서만 편집했고 다른 변경을 되돌리거나 덮어쓰지 않았다.

## 남은 TODO
- Backend(`BE6-036`~`BE6-039`): contract draft
  (`docs/api/MVP6_5_GOVERNANCE_API_CONTRACT_DRAFT.md`) +
  `docs/api/openapi-mvp6-5-draft.json`(additive, OpenAPI 3.1.0, `0.6.5-draft`).
  open question: OPEN→IN_REVIEW auto-advance 정확 시점, `approve`에 decision
  reason과 별개의 `application_note`가 필요한지.
- Frontend(`FE6-057`~`FE6-060`): Governance route/IA(Review group, ADR 0010),
  propose/detail/review/decision/audit/approval-is-intent 상태 요구사항, DTO gap.
  route/component/type/mock/smoke 코드 없음.
- QA(`INT6-043`~`INT6-046`): executable acceptance checklist + lifecycle/
  approval-is-intent guard + no-mutation/audit guard + Wave42 권고.

## 다른 역할에 전달할 내용
- PM:
  - MVP6.5 P0는 governance **decision-record** layer까지다. ontology definition/
    published/candidate/prompt mutation, publish/rollback, auto-apply,
    re-validation/re-extraction은 별도 freeze 전까지 열지 않는다. approval =
    intent(QUEUED)만.
- Backend:
  - **draft할 contract**: change-request CRUD(create/list/get + proposer update
    while DRAFT/OPEN), submit, withdraw, review(comment / request-changes),
    approve/reject(with reason), audit-log GET. MVP3 `ReviewDecisionType` 의미 +
    `Role` + MVP3/MVP5 audit shape를 `$ref`로만 재사용(rename 금지). ontology
    element ref는 read-only.
  - **검토할 필드/상태**: state machine(`DRAFT→OPEN→IN_REVIEW→{APPROVED|
    REJECTED}`+WITHDRAWN), `409 CHANGE_REQUEST_STATE_CONFLICT` 트리거,
    approver≠proposer(`403`), 미인가(`403`), orthogonal `GovernanceApplicationState`
    (`QUEUED` on approve; `APPLIED`/`SUPERSEDED` 예약·P0 미생성), all-false
    `GovernanceMutationGuard` 7개 플래그, OPEN→IN_REVIEW auto-advance 시점.
  - **checklist에 넣을 것**: 어떤 governance action도 ontology/published/candidate/
    prompt를 mutate하지 않음; publish/extraction job 미시작; approval 후에도
    적용 0; hard delete 금지.
- Frontend:
  - **검토할 fields+states**: Governance는 Review group에 contextual한
    project-scoped 화면, global LNB에 ID-bound page 노출 금지(ADR 0010).
    change-request board(state별), propose form(change items: target_kind ×
    change_type + element ref + version, ADD는 null ref), detail(change items +
    review thread + decision panel), reason-required decision input,
    reviewer/approver permission-boundary(비인가 read-only hint), audit-trail,
    **"approved = queued intent, not yet applied" 배너**(`application_state`
    가시화, D6 상태 배지). loading/empty/error/permission 상태 일급. 닫힌 design
    language(token, Section+Card, KO title, D6 badge, one primary action) 적용.
    DTO gap을 Backend draft 대비 기록.
- QA:
  - **checklist에 넣을 것**: PM/BE/FE가 P0 flow·states/enums·decision command +
    reason rules·RBAC + segregation of duties·approval-≠-auto-apply boundary +
    `application_state`·audit content·safety boundary·exclusion에 합의하는지;
    lifecycle state machine·`409`·approver≠proposer·approve 후 적용 0·
    `APPLIED`/`SUPERSEDED` 미생성; all-false `GovernanceMutationGuard`; full
    audit trail; OpenAPI parse/additivity; `apps/`/`infra/`에 runtime leakage
    부재. Wave42 권고.

## 총괄에게 요청하는 결정
- Wave41 PM freeze를 PASS로 승인하고 Backend/Frontend/QA가 contract-first
  planning(`BE6-036`~`039`/`FE6-057`~`060`/`INT6-043`~`046`)을 이어가도록 허용해
  달라.
- MVP6.5 P0를 auditable ontology change-request lifecycle(approval = 감사 가능한
  intent, auto-apply 없음)로 유지하고, publish/rollback·impact simulation·
  migration/release-note·이후 governance 확장은 별도 wave로 분리해 달라.

## 현재 판정
- PASS
