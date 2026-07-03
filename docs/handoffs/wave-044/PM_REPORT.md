# PM / Architecture Report - Wave 44

## 담당 범위
- backlog ID: `PM6-026` (MVP6.6 Wave44 gate freeze + thin-implementation scope guard)
  - 생성한 후속 구현 ID: Backend `BE6-048`~`BE6-051`, Frontend `FE6-069`~`FE6-072`,
    QA `INT6-055`~`INT6-058`
- 작업 경로 (docs-only; `apps/`·`infra/` 미변경):
  - `docs/pm/MVP6_6_GOVERNANCE_APPLICATION_BRIEF.md` (§9 Wave44 gate freeze 추가)
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md` (PM6-026 + BE6-048~051 / FE6-069~072 / INT6-055~058)
  - `docs/handoffs/wave-044/PM_REPORT.md` (신규)

## 완료한 작업
- Wave43 contract-first planning(PASS)의 open gate 6건을 Backend/Frontend를
  BLOCK하는 첫 순서로 **구현 가능한 단일 규칙**으로 freeze했다. 각 규칙은 §3 +
  ADR 0013 boundary를 좁게 refine하며(확장 금지), Wave43 Backend draft가 이미 권고한
  가장 단순한 옵션을 채택했으므로 `openapi-mvp6-6-draft.json`은 불변이다.
- **G1 target-draft default** — omitted target은 프로젝트의 **단일 current DRAFT**로
  해석; DRAFT가 0개면 `409 APPLY_TARGET_NOT_DRAFT`(auto-create 금지); 명시 id는
  존재(`404 ONTOLOGY_VERSION_NOT_FOUND`) + `OntologyVersionStatus=DRAFT`
  (`409 APPLY_TARGET_NOT_DRAFT`) 이어야 함. apply는 version을 cut하지 않음.
- **G2 per-`change_type` staleness key** — `ADD`(before-state 없음): `ontology_version_id`
  컨텍스트가 resolved target draft로 더 이상 resolve 안 되면 stale
  (`VERSION_CONTEXT_DIVERGED`). `MODIFY`/`DEPRECATE`: 대상 element 부재
  (`TARGET_ELEMENT_DELETED`) OR 현재 `OntologyElementStatus` ≠ 캡처 status
  (`TARGET_ELEMENT_ARCHIVED`/`TARGET_ELEMENT_MODIFIED`) OR 캡처 content fingerprint ≠ 현재.
  fingerprint = (`target_kind`, element id, `OntologyElementStatus`, 승인시점
  payload/`proposed_change`의 stable hash) tuple의 정확 일치 비교.
- **G3 approved-snapshot capture point** — before-state 스냅샷은 **APPROVE 시점**에
  캡처되어 QUEUED request에 저장; apply는 그 저장본과 비교(audit history 재계산 아님).
- **G4 partial-apply** — **ALL-OR-NOTHING**: 한 item이라도 stale/invalid면 아무것도
  변경 안 하고 `QUEUED→SUPERSEDED`(terminal) + `409 CHANGE_REQUEST_SUPERSEDED`;
  per-item partial apply 없음. target 해석 실패(`404`/`409 APPLY_TARGET_NOT_DRAFT`)도
  변경 없음(상태 전이 없음).
- **G5 pre-check side-effects** — `GET .../application-status`는 **순수 advisory**:
  상태를 변경하지 않고 `QUEUED→SUPERSEDED`로 flip하지 않음. `would_supersede`/`stale`는
  힌트일 뿐; **오직 `POST .../apply`만** authoritative하며 SUPERSEDED를 설정 가능.
- **G6 post-apply capabilities** — `ApplicationCapabilities{can_view, can_apply}`.
  `can_apply=true`는 actor가 apply 권한 보유 AND `status==APPROVED` AND
  `application_state==QUEUED`일 때만. terminal `APPLIED`/`SUPERSEDED` 이후
  `can_apply=false`; `can_view`는 프로젝트 멤버에게 계속 true.
- **G7 (FE, 확인)** — `APPLIED` `StatusBadge` 토큰 추가(tone `success`, KO
  `초안에 적용됨 (미게시)`) + `SUPERSEDED`를 현재 `neutral`→`warning` tone으로 override
  (KO `대체됨 (미적용)`, terminal). MVP6.5 `ApplicationStateBadge` unexpected-state
  가드를 실제 렌더로 교체.
- **G8 (FE, 확인)** — 성공 apply 응답의 `GovernanceApplicationMutationGuard` 7키
  (`ontology_draft_mutated`=true, 나머지 `published_graph_mutated`/
  `candidate_graph_mutated`/`prompt_version_mutated`/`publish_job_started`/
  `extraction_job_started`/`evaluation_run_started`=false). MVP6.5 all-false
  `GovernanceMutationGuard`(키가 `ontology_definition_mutated`/`change_auto_applied`)와
  **구별**됨. FE는 apply 응답에서 one-true-flag proof line을, read/lifecycle/blocked-apply
  에서 all-false 가드를 렌더.
- 코드 grounding: `apps/backend/app/modules/governance/`는 아직 ontology DB write
  경로가 없고 process-local store + `_KNOWN_ONTOLOGY_VERSION_IDS={"ontology-v7","ontology-v1"}`
  로 refs를 검증한다. `OntologyChangeItem`은 element ref ids + `ontology_version_id`
  + `proposed_change`를 보유 → G2 fingerprint/G3 snapshot이 store 안에서 구현 가능.
  FE `StatusBadge.tsx`는 `SUPERSEDED`가 neutral tone이고 `APPLIED` 토큰이 없음 → G7 확인.

## 변경 파일
- `docs/pm/MVP6_6_GOVERNANCE_APPLICATION_BRIEF.md` (§9 + status line)
- `docs/backlog/MVP6_DRAFT_BACKLOG.md` (PM6-026 + BE6-048~051 / FE6-069~072 / INT6-055~058 + status line)
- `docs/handoffs/wave-044/PM_REPORT.md` (신규)
- `apps/`·`infra/` 미변경.

## 실행/검증
- 실행한 명령: `git diff --check`
- 결과: clean (whitespace/충돌 마커 경고 없음).
- 실행하지 못한 검증: 없음 (runtime 미해당 — PM은 코드 미작성).

## API/Enum/DTO 변경
- 변경 여부: 없음.
- 상세: G1-G8은 Wave43 draft의 6개 open question을 확정하고 2개 FE gap을 확인할 뿐,
  frozen endpoint set / DTO field 이름 / enum literal / `openapi-mvp6-6-draft.json`을
  바꾸지 않는다. G1-G6은 draft가 이미 권고한 옵션을 채택.
- 영향받는 역할: Backend(G1-G6 구현), Frontend(G7/G8 렌더 + G1-G6 표시), QA(R1-R9 검증).

## Blocker
- 없음. Backend/Frontend는 이 보고서(G1-G6 frozen + G7/G8 confirmed)로 진행 가능.

## 남은 TODO
- Backend: `BE6-048`~`BE6-051` 구현(pre-check advisory / apply all-or-nothing DRAFT
  mutation / staleness+idempotency+authz+one-true-flag / audit+OpenAPI align+regression).
- Frontend: `FE6-069`~`FE6-072`(types/client/mocks + G7/G8 badge / pre-check panel /
  apply confirm + banner / mock+actual smoke).
- QA: `INT6-055`~`INT6-058`(R1-R9, 특히 data-level published-graph-untouched + one-true-flag).

## 다른 역할에 전달할 내용
- **Backend** — EXACT frozen 규칙 (한 줄):
  - G1: omitted target = 프로젝트 단일 current DRAFT; DRAFT 0개 → `409 APPLY_TARGET_NOT_DRAFT`(auto-create 금지); 명시 id는 존재+DRAFT 필수(아니면 404/409).
  - G2: ADD=`ontology_version_id` 컨텍스트 미해결시만 stale; MODIFY/DEPRECATE=대상 부재 OR 현재 status≠캡처 status OR content fingerprint(target_kind+id+status+payload hash) 불일치.
  - G3: before-state 스냅샷은 APPROVE 시점 캡처+QUEUED request에 저장; apply는 그 저장본과 비교(재계산 아님).
  - G4: ALL-OR-NOTHING — 하나라도 stale/invalid면 아무것도 안 바꾸고 `QUEUED→SUPERSEDED` + `409 CHANGE_REQUEST_SUPERSEDED`; partial 없음.
  - G5: pre-check GET은 순수 advisory — 절대 mutate/`QUEUED→SUPERSEDED` flip 안 함; apply POST만 authoritative.
  - G6: `can_apply=true`는 apply권한 AND APPROVED AND QUEUED일 때만; terminal(APPLIED/SUPERSEDED) 후 `can_apply=false`; `can_view`는 멤버에게 항상 true.
- **Frontend** — G7 confirmed: `APPLIED` StatusBadge 토큰(success, `초안에 적용됨 (미게시)`) 추가 + `SUPERSEDED` neutral→`warning`(`대체됨 (미적용)`). G8 confirmed: apply 응답 가드 7키(`ontology_draft_mutated` 등, MVP6.5 가드와 구별)로 proof line 렌더.
- **QA** — R1-R9는 위 G1-G6 그대로 검증; R2/one-true-flag는 data-level(apply 후 published/candidate/prompt/publish-job/extraction/evaluation UNCHANGED, guard 정확히 하나 true) 독립 검증. `INT6_6_GOVERNANCE_APPLICATION_ACCEPTANCE.md` R1-R9 verdict 갱신.
- **PM**: 후속 없음(Wave44 freeze 완료).

## 총괄에게 요청하는 결정
- 없음. Scope 불변(frozen apply P0 + 3 endpoint family만; publish/auto-apply/partial-apply 없음),
  G1-G6 frozen, G7/G8 confirmed. Backend∥Frontend 착수 승인만 필요.

## 현재 판정
- PASS (Wave44 gate freeze 완료; Backend/Frontend BLOCK 해제).
