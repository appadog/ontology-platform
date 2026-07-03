# PM / Architecture Report - Wave 43

## 담당 범위
- backlog ID:
  - `PM6-025` MVP6.6 Governance Change Application (APPROVED+QUEUED → APPLIED into
    a DRAFT ontology version) P0 scope freeze
  - (생성한 후속 ID: `BE6-044`~`BE6-047`, `FE6-065`~`FE6-068`,
    `INT6-051`~`INT6-054`)
- 작업 경로:
  - `docs/pm/MVP6_6_GOVERNANCE_APPLICATION_BRIEF.md`
  - `docs/adr/0013-mvp6-6-governance-application-draft-only-human-initiated-boundary.md`
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
  - `docs/handoffs/wave-043/PM_REPORT.md`

## 완료한 작업
- ADR 0012에서 **deferred된 application slice**를 다음 MVP6 theme P0로 확정하고
  contract-first planning으로 freeze했다: `APPROVED` + `application_state==QUEUED`
  변경 요청을 사람이 명시적으로 **DRAFT ontology version**에 적용(QUEUED→APPLIED)
  하는 것. runtime/route/component/model/migration/seed/smoke/test는 열지 않았다
  (Wave44 대기).
- 가장 작은 coherent apply P0만 확정했다: **apply-to-DRAFT 절반만** 열고,
  applied draft의 **publish는 기존 MVP3 publish 경로**(이후 별도 사람 단계)로
  분리했다. application은 새 mutation engine 없이 **기존 MVP1 ontology-edit
  semantics를 by reference 재사용**(ADD=create, MODIFY=update, DEPRECATE=archive,
  DRAFT version에만).
- P0 demo flow를 확정했다: `open APPROVED(QUEUED) request -> read-only
  application-status pre-check(target DRAFT version + per-item before/after +
  staleness warning) -> 권한 role이 "Apply to draft" + human-confirmation ->
  items를 DRAFT version에 적용 -> application_state=APPLIED -> "applied to DRAFT,
  NOT published — publish separately" 배너 -> application audit(before/after) ->
  재적용 시 409 -> stale이면 SUPERSEDED + no mutation`.
- **CRITICAL boundary 결정**(ADR 0013에 durable 기록): (1) application ≠ publish,
  **draft-only** — published graph는 절대 건드리지 않음; (2) **human-initiated
  only** — approval은 apply를 트리거하지 않음; (3) apply는 `APPROVED`+`QUEUED`
  에서만; (4) **idempotent** — already-APPLIED→`409 CHANGE_ALREADY_APPLIED`,
  non-APPROVED/QUEUED→`409 CHANGE_NOT_APPLICABLE`; (5) **staleness→SUPERSEDED** —
  apply 시점 auto-detect(approved snapshot ≠ 현재 draft target: target draft가
  전진/발산해 대상 element가 바뀌었거나, MODIFY/DEPRECATE 대상 element가 승인 이후
  수정/archive/삭제됨), block + no mutation + `application_state=SUPERSEDED` +
  `409 CHANGE_REQUEST_SUPERSEDED`(ADR-0012 예약 상태가 실제가 됨); non-DRAFT
  target→`409 APPLY_TARGET_NOT_DRAFT`.
- **authorization 결정**: apply 권한 = **approver 권한과 동일**
  (`ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`), MVP5 `Role` 재사용, 신규
  role 리터럴 없음. applier는 approver/proposer와 **달라도 됨**(권고 + audit).
  self-apply 금지 없음(SoD는 approve 단계에서 approver≠proposer로 이미 강제).
  미인가→`403 PERMISSION_DENIED`.
- **mutation-guard를 재정의**했다: 성공한 apply 응답은
  `GovernanceApplicationMutationGuard`를 노출하고 **정확히 하나의 플래그만**
  legitimately true — `ontology_draft_mutated: true`; 나머지
  (`published_graph_mutated`/`candidate_graph_mutated`/`prompt_version_mutated`/
  `publish_job_started`/`extraction_job_started`/`evaluation_run_started`)는 false.
  모든 read/lifecycle governance endpoint(MVP6.5 + MVP6.6 pre-check/audit read)와
  **blocked apply**는 기존 **all-false** `GovernanceMutationGuard`를 유지한다. QA가
  검증할 sanctioned mutation surface는 정확히 하나(성공 apply의
  `ontology_draft_mutated=true`)뿐이다.
- application audit content를 확정했다: actor+role, timestamp, source request id +
  applied item ids, 결과 DRAFT `target_ontology_version_id`, per-item before/after
  element refs. 신규 `GovernanceApplicationAuditAction`(`CHANGE_REQUEST_APPLIED`,
  `CHANGE_REQUEST_SUPERSEDED`), MVP3/MVP5 audit shape by reference 재사용.
- exclusion을 명시했다: publish(별도 MVP3), auto-apply/auto-publish, enforcement,
  autonomous/agent apply, rollback/undo, impact simulation, migration/release-note,
  post-apply re-validation/re-extraction, bulk/batch apply, conflict auto-merge,
  real LLM, agents, connectors, multi-tenant; durable DB/Alembic는 P0 미요구·P1/P2.
- backlog에 Wave43 freeze summary + `PM6-025`/`BE6-044`~`047`/`FE6-065`~`068`/
  `INT6-051`~`054`을 기존 번호 체계를 이어 추가하고, 상단 status도 갱신했다.
  QA IDs는 지시대로 `INT6-051`부터 시작(INT6는 INT6-050까지 사용됨).
- 새 durable boundary 결정(application ≠ publish / draft-only / human-initiated /
  staleness→SUPERSEDED)이므로 ADR `0013`을 기존 per-MVP boundary 패턴(0006~0012)으로
  추가했다.

## 변경 파일
- 생성:
  - `docs/pm/MVP6_6_GOVERNANCE_APPLICATION_BRIEF.md`
  - `docs/adr/0013-mvp6-6-governance-application-draft-only-human-initiated-boundary.md`
  - `docs/handoffs/wave-043/PM_REPORT.md`
- 수정:
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`

## 실행/검증
- 실행한 명령:
  - `git diff --check`
  - 재사용 대상 확인(read-only, 변경 없음): `apps/backend/app/core/enums.py`
    (`Role`, `OntologyElementStatus`, `OntologyVersionStatus`,
    `ReviewDecisionType`), MVP6.5 `apps/backend/app/modules/governance/schemas.py`
    (`GovernanceApplicationState` QUEUED + 예약된 APPLIED/SUPERSEDED, change
    request/item/audit shape), MVP1 ontology-edit 경로
    (`apps/backend/app/modules/ontology/router.py`: `create_version` DRAFT,
    class/property/relation create/update/delete on DRAFT), MVP3 publish 경로
    (`apps/backend/app/modules/publish/router.py`, `publish-jobs`), ADR 0012.
  - `apps/`/`infra/`에 change-application/apply runtime leakage 부재 확인.
- 결과:
  - `git diff --check`: PASS (whitespace/충돌 경고 없음).
  - 재사용 근거 확인: MVP1 ontology-edit은 DRAFT version에 대해서만 편집을
    허용(`_draft_version_or_error`)하고, DEPRECATE는 `OntologyElementStatus.ARCHIVED`
    로 매핑됨을 확인 — brief/ADR가 이 semantics를 by reference로 재사용하도록
    작성. published graph write는 MVP3 `publish-jobs` 경로로만 발생하며 MVP6.6은
    이를 건드리지 않음.
  - runtime leakage: `NO change-application runtime leakage in apps/ or infra/`.
- 실행하지 못한 검증:
  - PM/Architecture 문서 범위라 backend/frontend runtime/test/OpenAPI export는
    수행하지 않는다. OpenAPI planning artifact(`openapi-mvp6-6-draft.json`)
    작성/parse는 Backend(`BE6-047`) 몫.

## API/Enum/DTO 변경
- 변경 여부: 있음, **문서 계약 한정** (runtime/OpenAPI/DB/route 변경 없음)
- 상세:
  - Runtime API, `docs/api/openapi-*.json`, DB model/migration, frontend
    route/component는 변경하지 않았다.
  - 신규 enum 후보(문서 계약): `GovernanceApplicationAuditAction`
    (`CHANGE_REQUEST_APPLIED`, `CHANGE_REQUEST_SUPERSEDED`). 기존
    `GovernanceApplicationState`의 예약값 `APPLIED`/`SUPERSEDED`가 이 slice에서
    처음으로 실제 생성된다.
  - 신규 DTO 후보(문서 계약): apply request(optional `target_ontology_version_id`),
    application-status pre-check response, application-audit entry,
    `GovernanceApplicationMutationGuard`(one-true-flag: `ontology_draft_mutated`).
    Backend가 `BE6-044`~`047`에서 최종 필드/이름/경로를 확정한다.
  - MVP1 ontology-version / MVP3 publish(미사용) / MVP5 `Role` / MVP3–MVP5 audit /
    MVP6.5 governance shape는 `$ref`로 재사용, rename 없음.
- 영향받는 역할: Backend/Frontend/QA (아래 전달 내용 참조).

## Blocker
- 없음.
- 주의: 작업트리에 이전 wave의 미커밋 변경(MVP6.5 governance 모듈, wave-041/042
  handoff 등)이 있다. PM은 지정된 PM/backlog/ADR/handoff 문서만 편집했고 다른
  변경을 되돌리거나 덮어쓰지 않았다.

## 남은 TODO
- Backend(`BE6-044`~`BE6-047`): contract draft
  (`docs/api/MVP6_6_GOVERNANCE_APPLICATION_API_CONTRACT_DRAFT.md`) +
  `docs/api/openapi-mvp6-6-draft.json`(additive, OpenAPI 3.1.0, `0.6.6-draft`).
  open question: target-draft 기본값 = 프로젝트 current DRAFT vs 명시 필수;
  change_type별 정확한 staleness 비교 key; read-only pre-check가 스스로
  QUEUED→SUPERSEDED로 flip할 수 있는지 아니면 apply 시도만 authoritative인지.
- Frontend(`FE6-065`~`FE6-068`): apply action UX(APPROVED+QUEUED + 권한 + 확인),
  APPLIED 배지, staleness/SUPERSEDED 충돌 UX, applied-not-published 배너,
  application audit, DTO gap. route/component/type/mock/smoke 코드 없음.
- QA(`INT6-051`~`INT6-054`):
  `docs/backlog/INT6_6_GOVERNANCE_APPLICATION_ACCEPTANCE.md`(C planning + R
  NOT-RUNNABLE) + apply-only-from-QUEUED/draft-only/idempotency/staleness guard +
  redefined-guard/audit guard + Wave44 권고.

## 다른 역할에 전달할 내용
- PM:
  - MVP6.6 P0는 **apply-to-DRAFT까지만**이다. publish는 기존 MVP3 경로로 분리한
    이후 사람 단계다. approval은 apply를 트리거하지 않는다(human-initiated only).
    `APPLIED`/`SUPERSEDED`는 이 slice에서만 생성된다.
- Backend:
  - **draft할 contract**: change request에 대한 `apply` action(`APPROVED`+`QUEUED`
    에서만; optional `target_ontology_version_id`), read-only application-status
    pre-check(target DRAFT + per-item before/after + staleness hint),
    application-audit read. MVP6.5 governance + MVP1 ontology-version + MVP3/MVP5
    audit/`Role`을 `$ref`로만 재사용(rename 금지). ontology-edit semantics는
    ADD=create/MODIFY=update/DEPRECATE=archive, **DRAFT version에만**.
  - **검토할 필드/상태**: `application_state` QUEUED→APPLIED(성공)/QUEUED→SUPERSEDED
    (stale); `409 CHANGE_ALREADY_APPLIED`/`CHANGE_NOT_APPLICABLE`/
    `CHANGE_REQUEST_SUPERSEDED`/`APPLY_TARGET_NOT_DRAFT`; `403 PERMISSION_DENIED`;
    redefined `GovernanceApplicationMutationGuard`(one true flag
    `ontology_draft_mutated`; read/lifecycle/blocked-apply은 all-false 유지);
    `GovernanceApplicationAuditAction`; before/after element ref.
  - **checklist에 넣을 것**: apply는 published graph/candidate/prompt/extraction을
    mutate하지 않음; publish job 미시작; DRAFT ontology version만 변경; 재적용 0;
    stale이면 mutation 0; hard delete 금지.
- Frontend:
  - **검토할 fields+states**: apply action은 기존 MVP6.5 Governance detail에서
    `APPROVED`+`QUEUED` + 권한 role에게만, human-confirmation 뒤에 노출. APPLIED
    D6 배지; staleness/SUPERSEDED 충돌 UX(pre-check 경고 + transition 시 block/
    설명/미변경 표시/terminal); **"applied to DRAFT, NOT published — publish
    separately" 배너**; application-status pre-check 패널(target draft + per-item
    before/after); application-audit view. loading/empty/error/permission 상태
    일급. 닫힌 design language(token, Section+Card, KO title, D6 badge, one
    primary action) 적용. auto-apply/auto-publish copy 금지. DTO gap을 Backend
    draft 대비 기록. route/component/type/mock/smoke 코드 없음.
- QA:
  - **checklist에 넣을 것**: PM/BE/FE가 apply P0·states(APPLIED/SUPERSEDED는 여기
    서만 생성)·application-≠-publish + draft-only boundary·staleness→SUPERSEDED·
    idempotency·authz·redefined guard(one true flag)·application audit content·
    exclusion에 합의하는지; apply-only-from-QUEUED·draft-only(published graph
    data-level 불변)·idempotency 409·staleness 시 mutation 0·authz 403;
    성공 apply에서 `ontology_draft_mutated=true` 외 모두 false, 비-apply/blocked-apply은
    all-false; full application audit(before/after); OpenAPI parse/additivity;
    `apps/`/`infra/` runtime leakage 부재. Wave44 권고.

## 총괄에게 요청하는 결정
- Wave43 PM freeze를 PASS로 승인하고 Backend/Frontend/QA가 contract-first
  planning(`BE6-044`~`047`/`FE6-065`~`068`/`INT6-051`~`054`)을 이어가도록 허용해
  달라.
- MVP6.6 P0를 **apply-to-DRAFT까지**로 유지하고(application ≠ publish, draft-only,
  human-initiated, staleness→SUPERSEDED), publish/rollback·auto-apply·enforcement·
  impact simulation·이후 governance 확장은 별도 wave로 분리해 달라.
- redefined mutation-guard 결정 확인 요청: 성공 apply만 `ontology_draft_mutated=true`
  (그 외 all-false), read/lifecycle/blocked-apply은 all-false `GovernanceMutationGuard`
  유지 — QA에게 sanctioned mutation surface를 정확히 하나로 준다.

## 현재 판정
- PASS
