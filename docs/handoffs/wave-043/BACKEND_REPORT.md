# Backend Report - Wave 43

## 담당 범위
- backlog ID: `BE6-044`~`BE6-047` (theme `PM6-025` MVP6.6 Governance Change
  Application, contract-first planning only)
- 작업 경로:
  - `docs/api/MVP6_6_GOVERNANCE_APPLICATION_API_CONTRACT_DRAFT.md` (신규)
  - `docs/api/openapi-mvp6-6-draft.json` (신규)
  - `docs/handoffs/wave-043/BACKEND_REPORT.md` (신규)

## 완료한 작업
- ADR 0012에서 deferred된 application slice를 additive contract로 draft했다:
  `APPROVED` + `application_state==QUEUED` 변경 요청을 사람이 명시적으로 **DRAFT
  ontology version**에 적용(QUEUED→APPLIED)하는 apply action + 사전점검 read +
  application audit read. runtime/route/model/migration/test는 열지 않았다(Wave44
  대기).
- 3개 additive·disjoint 엔드포인트 family를 MVP6.5 change-request 리소스 위에 확정:
  1. `GET .../application-status` (read-only 사전점검: 유효 DRAFT target 해석 +
     per-item before/after preview + `would_supersede` staleness hint + `can_apply`,
     all-false guard, 절대 `QUEUED→SUPERSEDED`로 flip하지 않음 — advisory only).
  2. `POST .../apply` (apply action; optional body `target_ontology_version_id`/`note`).
  3. `GET .../application-audit` (`CHANGE_REQUEST_APPLIED`/`CHANGE_REQUEST_SUPERSEDED`
     감사, chronological ASC, limit/cursor).
- Frozen enum/rule을 정확히 인코딩: apply는 `APPROVED`+`QUEUED`에서만 → 성공 시
  `APPLIED` + DRAFT ontology version만 변경(ADD=create, MODIFY=update,
  DEPRECATE=`OntologyElementStatus=ARCHIVED`), published graph는 절대 미변경;
  staleness auto-detect → `409 CHANGE_REQUEST_SUPERSEDED` + `application_state=
  SUPERSEDED` + no mutation; idempotency `409 CHANGE_ALREADY_APPLIED` /
  `409 CHANGE_NOT_APPLICABLE`; non-DRAFT target `409 APPLY_TARGET_NOT_DRAFT`;
  authz = approver 권한(`ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`), applier
  ≠ approver 허용, self-apply 금지 없음, 미인가 `403 PERMISSION_DENIED`.
- redefined mutation-guard를 인코딩: 성공 apply만 `GovernanceApplicationMutationGuard`
  (`ontology_draft_mutated=true`, 나머지 6개 false); read/precheck/blocked-apply은
  기존 all-false `GovernanceMutationGuard`(7-flag, `change_auto_applied` 포함) 유지.
- application audit content 확정: actor+role, timestamp, source request id +
  applied item ids, 결과 DRAFT `target_ontology_version_id`, per-item before/after
  element ref(`ApplicationBeforeAfterRef`/`OntologyElementRef`), staleness block 시
  `stale_detail`. 신규 `GovernanceApplicationAuditAction`.
- MVP6.5 governance(`GovernanceApplicationState`/`ChangeRequestChangeType`/
  `ChangeRequestTargetKind`), MVP1(`OntologyElementStatus`/`OntologyVersionStatus`/
  ontology version), MVP5 `Role`를 by reference 재사용, rename 없음(standalone
  parse용으로만 mirror).
- FE/QA/Wave44 PM용 open question 6건 기록(target-draft 기본값, change_type별
  staleness 비교 key, pre-check flip 권한, partial-apply 여부, snapshot 캡처 시점,
  apply 후 `can_apply`).

## 변경 파일
- 신규: `docs/api/MVP6_6_GOVERNANCE_APPLICATION_API_CONTRACT_DRAFT.md`,
  `docs/api/openapi-mvp6-6-draft.json`, `docs/handoffs/wave-043/BACKEND_REPORT.md`
- `apps/`·`infra/` 미변경.

## 실행/검증
- 실행한 명령:
  - `python3 -m json.tool docs/api/openapi-mvp6-6-draft.json > /dev/null` → `PARSE_OK`
  - schema/path count + reachability(python json): openapi `3.1.0`, version
    `0.6.6-draft`, **paths 3 / operations 3 / schemas 19 / parameters 5 /
    responses 3**; defined-not-referenced `[]`, referenced-not-defined `[]`.
  - disjointness: 신규 3 path를 모든 `docs/api/openapi-mvp*.json`와 비교 → **0 overlap**.
  - `git diff --check` → `DIFF_CHECK_OK` (whitespace/충돌 경고 없음).
  - `apps/`·`infra/`에 apply/application-status/application-audit/mvp6-6 runtime
    leakage 검색 → `NO_RUNTIME_LEAK`.
- 결과: 위 모두 PASS.
- 실행하지 못한 검증: contract-first planning 범위라 FastAPI runtime OpenAPI export
  대비 compare는 없음(Wave44 몫). 실제 apply/staleness 동작 런타임 검증도 Wave44.

## API/Enum/DTO 변경
- 변경 여부: 있음 — **문서 계약(planning) 한정, additive**. runtime API/DB/route
  변경 없음.
- 상세:
  - 신규 enum: `GovernanceApplicationAuditAction`(`CHANGE_REQUEST_APPLIED`,
    `CHANGE_REQUEST_SUPERSEDED`). 기존 `GovernanceApplicationState`의 예약값
    `APPLIED`/`SUPERSEDED`가 이 slice에서 처음 실제 생성.
  - 신규 DTO: `GovernanceApplyRequest`, `GovernanceApplyResponse`,
    `GovernanceApplicationStatusResponse`, `GovernanceApplicationAuditEntry`,
    `GovernanceApplicationAuditListResponse`, `GovernanceApplicationMutationGuard`
    (one-true-flag), `OntologyElementRef`, `ApplicationBeforeAfterRef`,
    `ApplicationItemPreview`, `ApplicationCapabilities`.
  - 재사용(by `$ref`/mirror, rename 없음): MVP6.5 `GovernanceApplicationState`/
    `ChangeRequestChangeType`/`ChangeRequestTargetKind`/`GovernanceMutationGuard`,
    MVP1 `OntologyElementStatus`/`OntologyVersionStatus`/ontology-version, MVP5 `Role`.
- 영향받는 역할: Frontend/QA(아래).

## Blocker
- 없음.
- 주의: 작업트리에 이전 wave 미커밋 변경(MVP6.5 governance 모듈, wave-041/042
  handoff 등)이 있다. Backend는 지정 문서 3개만 추가했고 다른 변경을 되돌리거나
  덮어쓰지 않았다.

## 남은 TODO
- Frontend(`FE6-065`~`FE6-068`): DTO gap 분석 + apply UX 문서
  (`docs/pm/MVP6_6_FRONTEND_UX_REQUIREMENTS.md`).
- QA(`INT6-051`~`INT6-054`): `docs/backlog/INT6_6_GOVERNANCE_APPLICATION_ACCEPTANCE.md`.
- Wave44 PM freeze 필요(open question): target-draft 기본값 규칙, change_type별
  staleness 비교 fingerprint, snapshot 캡처 시점(approve-time), partial-apply 배제 확인.

## 다른 역할에 전달할 내용
- PM:
  - contract는 brief/ADR 0013 그대로 인코딩됨. 이름 refine은 Backend 위임분만
    (`GovernanceApplyRequest/Response`, `ApplicationBeforeAfterRef`,
    `OntologyElementRef`, `ApplicationItemPreview`, `ApplicationCapabilities`,
    `GovernanceApplicationStatusResponse`). Wave44 전 6개 open question freeze 요망.
- Frontend:
  - **apply endpoint shape**: `POST /api/v1/ontology-change-requests/{id}/apply`,
    optional body `{target_ontology_version_id?, note?}`; 성공 200
    `GovernanceApplyResponse`(`application_state=APPLIED`, `before_after_refs`,
    guard). 사전점검: `GET .../application-status`(`applicable`, `would_supersede`,
    `item_previews[].before_ref/after_ref/stale`, `capabilities.can_apply`).
    감사: `GET .../application-audit`.
  - **409 codes**: `CHANGE_ALREADY_APPLIED`, `CHANGE_NOT_APPLICABLE`,
    `CHANGE_REQUEST_SUPERSEDED`, `APPLY_TARGET_NOT_DRAFT`; 미인가 `403 PERMISSION_DENIED`.
    staleness 시 상태가 `SUPERSEDED`(terminal)로 전이됨을 UX가 block+설명해야 함.
  - **one-true-flag guard**: 성공 apply만 `ontology_draft_mutated=true`(나머지 false);
    read/blocked-apply은 all-false `GovernanceMutationGuard`. 성공 apply 후 `can_apply`
    false → apply CTA 숨기고 `APPLIED` D6 배지 + "applied to DRAFT, NOT published —
    publish separately" 배너.
  - **precheck shape**: `would_supersede`/`stale`는 advisory(경고용); 실제 전이는
    apply 시점. auto-apply/auto-publish copy 금지.
- QA:
  - apply-only-from-`APPROVED`+`QUEUED`; draft-only(published graph data-level 불변);
    idempotency 409 2종; staleness→SUPERSEDED 시 mutation 0; authz 403; 성공 apply만
    `ontology_draft_mutated=true`(그 외 all-false), 비-apply/blocked-apply은 all-false;
    per-item before/after + resulting DRAFT version id 감사; DEPRECATE=ARCHIVED(no
    hard delete); OpenAPI parse/additivity(3 path disjoint, 19 schema reachable).

## 총괄에게 요청하는 결정
- Wave43 Backend contract draft를 PASS로 승인하고 Frontend(`FE6-065`~`068`)/
  QA(`INT6-051`~`054`) planning 진행을 허용해 달라.
- redefined guard 결정 확인: 성공 apply만 `ontology_draft_mutated=true`, read/
  blocked-apply은 all-false `GovernanceMutationGuard` — QA에게 sanctioned mutation
  surface 정확히 하나.
- MVP6.6를 apply-to-DRAFT까지로 유지(application ≠ publish), publish/rollback/
  auto-apply/partial-apply는 별도 wave.

## 현재 판정
- PASS (contract-first planning only; runtime은 Wave44 대기 / NOT RUNNABLE by design)
