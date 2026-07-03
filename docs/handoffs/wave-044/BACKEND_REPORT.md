# Backend Report — Wave 44 (MVP6.6 Governance Change Application THIN IMPLEMENTATION)

## 담당 범위
- `BE6-048` application-status pre-check (advisory)
- `BE6-049` apply action + DRAFT ontology mutation + state transitions
- `BE6-050` staleness / idempotency / authz + one-true-flag guard
- `BE6-051` application audit + OpenAPI export/alignment + no-published-mutation guard

## 완료한 작업
- 기존 MVP6.5 `apps/backend/app/modules/governance/` 모듈을 **additive**하게 확장.
  MVP6.6 로직 전체를 신규 `application.py` 서브모듈에 배치(스키마 + 서비스 co-located,
  thin slice). 3개 엔드포인트 패밀리를 governance router에 additive 등록.
- **G1 target-draft default**: omitted target = 프로젝트 단일 current DRAFT.
  DRAFT 0개 → `409 APPLY_TARGET_NOT_DRAFT` (auto-create 없음). 명시 id 부재 →
  `404 ONTOLOGY_VERSION_NOT_FOUND`; 존재하나 non-DRAFT → `409 APPLY_TARGET_NOT_DRAFT`.
  apply는 version을 cut하지 않음(성공 후에도 target version status는 DRAFT 그대로).
- **G2 staleness**: ADD = 캡처된 `ontology_version_id` 컨텍스트가 resolved target draft로
  resolve 안 되면 `VERSION_CONTEXT_DIVERGED`. MODIFY/DEPRECATE = 대상 부재/DELETED →
  `TARGET_ELEMENT_DELETED`; 현재 `OntologyElementStatus` ≠ 캡처 status →
  `TARGET_ELEMENT_ARCHIVED`/`TARGET_ELEMENT_MODIFIED`; content fingerprint 불일치 →
  `TARGET_ELEMENT_MODIFIED`. fingerprint = (target_kind, element id, status,
  proposed_change/payload의 stable sha256 hash) tuple.
- **G3 snapshot**: before-state 스냅샷은 **APPROVE 시점**에 캡처. MVP6.5
  `record_review_decision`의 APPROVE 분기에 additive 훅(`capture_approval_snapshot`)을
  추가 — MVP6.5 외부 동작/응답은 불변(28/28 회귀 통과). apply는 저장 스냅샷과 비교.
- **G4 all-or-nothing**: 모든 item staleness를 mutate 이전에 계산; 하나라도 stale이면
  아무것도 변경 안 하고 `QUEUED→SUPERSEDED`(terminal) + `409 CHANGE_REQUEST_SUPERSEDED`.
  partial apply 없음(테스트로 fresh ADD가 stale DEPRECATE와 함께 있을 때 element가
  생성되지 않음을 검증).
- **G5 pre-check advisory**: `GET .../application-status`는 절대 mutate/flip 안 함.
  `would_supersede=true`여도 request는 QUEUED 유지(테스트로 검증).
- **G6 capabilities**: `ApplicationCapabilities{can_view, can_apply}`. `can_apply=true`는
  actor apply권한 AND APPROVED AND QUEUED일 때만; terminal(APPLIED/SUPERSEDED) 후 false.
- **Idempotency**: 이미 APPLIED → `409 CHANGE_ALREADY_APPLIED`; not APPROVED/QUEUED →
  `409 CHANGE_NOT_APPLICABLE`. **Authz**: `ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`만
  apply; applier ≠ approver 허용(테스트); 그 외 `403 PERMISSION_DENIED`, mutate 없음.
- **One-true-flag guard**: 성공 apply 응답만 `GovernanceApplicationMutationGuard`
  (`ontology_draft_mutated=true`, 나머지 6키 false). pre-check/audit/blocked-apply는
  MVP6.5 all-false `GovernanceMutationGuard` 유지.
- MVP6.5 모듈은 실제 ontology DB write 경로가 없으므로(ADR 0013가 process-local store를
  허용) `application.py`에 self-contained deterministic DRAFT ontology-version element
  store를 두어 apply가 ADD=create / MODIFY=update / DEPRECATE=ARCHIVED(never DELETED)로
  mutate. reset은 MVP6.5 `reset_runtime_store()`에 additive 연결.

## 변경 파일
- `apps/backend/app/modules/governance/application.py` (신규 — 스키마+서비스)
- `apps/backend/app/modules/governance/router.py` (3 라우트 additive)
- `apps/backend/app/modules/governance/service.py` (APPROVE 훅 + reset 연결, additive)
- `apps/backend/tests/test_mvp6_6_governance_application_api.py` (신규, 21 테스트)

## 실행/검증 (정확한 명령 + 결과)
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_6_governance_application_api.py -q`
  → **21 passed in 5.94s**
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_5_governance_api.py -q`
  → **28 passed in 6.43s** (MVP6.5 회귀 무손상)
- `cd apps/backend && .venv/bin/pytest -q` → **126 passed in 20.52s** (전체 회귀)
- `cd apps/backend && .venv/bin/ruff check app tests scripts` → **All checks passed!**
- OpenAPI export/compare (runtime `app.openapi()` vs `openapi-mvp6-6-draft.json`):
  3/3 paths present; **0 field/enum mismatches** across 10 schemas +
  4 reused enums (`GovernanceApplicationAuditAction`/`GovernanceApplicationState`/
  `OntologyElementStatus`/`OntologyVersionStatus`).
- `git diff --check` → clean (exit 0).

### Data-level published-graph-untouched 증거
- `test_apply_leaves_all_other_surfaces_unchanged`: apply(ADD+DEPRECATE) 전/후
  `published_entities`/`published_relations`/`candidates`/`prompts`/`publish_jobs`/
  `extraction_jobs` COUNT before==after; 응답 guard는 정확히 1개 true 플래그
  (`ontology_draft_mutated`)뿐.
- `test_apply_only_mutates_draft_version_status_unchanged`: apply 후 target version
  status는 DRAFT 그대로(cut/publish 없음), published version은 PUBLISHED 그대로.

## API/Enum/DTO 변경 여부
- 신규 additive만: `GovernanceApplicationAuditAction`(enum),
  `GovernanceApplicationMutationGuard`, `ApplicationCapabilities`, `OntologyElementRef`,
  `ApplicationItemPreview`, `ApplicationBeforeAfterRef`,
  `GovernanceApplicationStatusResponse`, `GovernanceApplyRequest`,
  `GovernanceApplyResponse`, `GovernanceApplicationAuditEntry`,
  `GovernanceApplicationAuditListResponse`. 이름/필드/enum literal은
  `openapi-mvp6-6-draft.json`과 정확 일치. MVP1-MVP6.5 rename 없음(`core/enums.py` 무변경).

## Blocker
- 없음.

## 남은 TODO
- 없음(P0 slice 완료). P1/P2: durable DB/Alembic persistence(현재 process-local store),
  실제 MVP1 ontology-edit DB 경로와의 통합(현 슬라이스는 semantic-level 재사용 + 자체 store).

## Frontend contract notes
- **apply 성공(200 `GovernanceApplyResponse`)**: `application_state="APPLIED"`,
  `target_ontology_version_id`, `applied_item_ids[]`, `before_after_refs[]`
  (ADD → before null / after status DRAFT; MODIFY → after status ACTIVE;
  DEPRECATE → after status ARCHIVED), `audit_entry`(action `CHANGE_REQUEST_APPLIED`),
  `capabilities={can_view:true, can_apply:false}`, **one-true-flag proof line**:
  `mutation_guard.ontology_draft_mutated=true` + 나머지 6키 false
  (`published_graph_mutated`/`candidate_graph_mutated`/`prompt_version_mutated`/
  `publish_job_started`/`extraction_job_started`/`evaluation_run_started`).
- **pre-check(200 `GovernanceApplicationStatusResponse`)**: `target_ontology_version_id`,
  `target_version_status`, `target_is_draft`, `applicable`, `would_supersede`(advisory),
  `item_previews[]`(`stale`/`stale_reason`), `capabilities`, all-false
  `GovernanceMutationGuard`(키: `ontology_definition_mutated`.../`change_auto_applied`).
- **409 codes**: `CHANGE_ALREADY_APPLIED`, `CHANGE_NOT_APPLICABLE`,
  `APPLY_TARGET_NOT_DRAFT`, `CHANGE_REQUEST_SUPERSEDED`(응답 details에
  `application_state=SUPERSEDED` + `stale_items[]{change_item_id, stale_reason}`).
  **404**: `ONTOLOGY_VERSION_NOT_FOUND`/`CHANGE_REQUEST_NOT_FOUND`. **403**:
  `PERMISSION_DENIED`. blocked-apply/read guard는 all-false MVP6.5 guard와 구별 필요.
- FE는 apply 응답 가드(7키, `ontology_draft_mutated`)와 MVP6.5 가드(7키,
  `ontology_definition_mutated`/`change_auto_applied`)를 **키 이름으로** 구분.

## 총괄에게 요청하는 결정
- 없음. Scope 불변(3 endpoint family, DRAFT-only mutation, publish 무접촉). QA(R1-R9)
  독립 검증 착수 승인만 필요.

## Verdict
- **PASS**. 3 endpoint family 구현, G1-G6 준수, one-true-flag guard, all-or-nothing
  staleness→SUPERSEDED, idempotency/target/authz 409·403, data-level published-graph-
  untouched 증거 확보. MVP6.5 및 전체 회귀 무손상, ruff clean, OpenAPI 0 mismatch,
  git clean.
