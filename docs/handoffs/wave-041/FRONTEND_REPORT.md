# Frontend Report - Wave 41

## 담당 범위
- backlog ID: `FE6-057`~`FE6-060` (MVP6.5 Governance workflow UX/API requirements)
- 작업 경로:
  - `docs/pm/MVP6_5_FRONTEND_UX_REQUIREMENTS.md` (생성)
  - `docs/handoffs/wave-041/FRONTEND_REPORT.md` (생성)

## 완료한 작업
- MVP6.5 Governance workflow(ontology change-request lifecycle: propose → review
  → approve/reject → audit)의 Frontend UX/API 요구사항을 contract-first planning으로
  작성했다. route/component/type/mock/smoke 코드는 이번 wave에 열지 않았다.
- **Route/IA 결정**: Governance는 project-scoped 화면이며 기존 **Review 그룹**의
  세 번째 LNB 항목(`Governance` → `/projects/:p/governance`)으로 배치. global LNB에는
  신규 항목 없음(Dashboard/Projects/Admin 유지). change-request detail
  (`/governance/:changeRequestId`)은 board 행/breadcrumb에서 도달하는 contextual
  ID-bound 라우트로, LNB 항목이 아님(ADR 0010 Note C). Active-LNB 파생은 D1 §1.6을
  확장해 `path contains /governance`, `Review`(`/review`) 뒤에 해소. breadcrumb는
  `프로젝트명 > Governance > 변경 요청 #<id>` (D4, 섹션 세그먼트=EN LNB 라벨).
  - 참고로 MVP6.4(Gold Set를 Evaluation 하위에 숨김)와 달리 Governance는 자체 작업
    큐/보드 성격이라 Review 그룹의 독립 LNB 항목으로 두는 것을 권고했다(PM brief +
    ADR 0012가 "under the Review group"으로 명시). commander가 신규 LNB 0개를
    선호하면 Review inbox 랜딩에서 진입하는 fallback을 문서에 함께 기재했다.
- **화면 플로우 + 상태**: (1) Governance Board(state별 그룹/필터, primary=`변경 요청 생성`),
  (2) Propose(`/new`: title/summary + change items = `ChangeRequestTargetKind` ×
  `ChangeRequestChangeType` + element ref[ADD는 null] + `ontology_version_id` +
  `proposed_change` intent, primary=`제출`), (3) Detail(요약 + change items +
  review thread(collapsed) + decision panel + audit trail(collapsed)). 각 화면 DTO
  필드를 Backend draft에 매핑.
- **Permission-boundary UX(일급)**: 4개 actor mode(proposer/reviewer/approver/
  read-only)를 `GovernanceCapabilities` 힌트로 사전 렌더. approve/reject는
  `ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN` 한정, **approver ≠ proposer**
  (본인 요청 `승인` 버튼 사전 비활성 + 직무분리 카피, 서버 `403 SELF_APPROVAL_FORBIDDEN`
  backstop). 비인가 actor는 board/detail/thread/audit 전부 read-only +
  `PERMISSION_LIMITED` 배지(D6). reason 규칙 client-side 강제
  (`REQUEST_CHANGES`/`APPROVE`/`REJECT` non-empty 필수, `COMMENT`/`WITHDRAW` 선택).
- **approval-≠-auto-apply**: board+detail에 상시 배너("승인은 큐잉된 의도이며 아직
  적용되지 않았습니다"), `application_state=QUEUED`를 **warning 톤** `큐잉됨(미적용)`
  배지로 노출(success 아님 — "완료/적용"으로 오독 방지), 어디에도 `적용`/`게시` CTA
  없음, `APPLIED`/`SUPERSEDED`는 P0 미렌더 예약.
- **State-machine 배지(D6)**: `OntologyChangeRequestStatus`(DRAFT/OPEN/IN_REVIEW/
  APPROVED/REJECTED/WITHDRAWN) + `GovernanceApplicationState`(NOT_APPLICABLE/QUEUED)를
  각각 EN token + icon + KO 보조 라벨로 D6 §6.3 규칙 확장. 일부(DRAFT/APPROVED/
  REJECTED/NOT_APPLICABLE)는 기존 D6 행 재사용.
- 디자인 언어 적용: KO 페이지 타이틀 `거버넌스`, `Section`+`HanaCard`, 화면당 primary
  action 1개, progressive disclosure(thread/audit collapsed), restrained accent.
- loading/empty(무프로젝트·무요청·무활동)/error/permission-limited/409-conflict/
  approval-queued/reason-required 상태를 일급으로 정의.
- **Backend draft 반영**: 문서 작성 중 `docs/api/MVP6_5_GOVERNANCE_API_CONTRACT_DRAFT.md`가
  landing되어 즉시 reconcile했다. 모든 PM-frozen enum/DTO 이름이 verbatim 확인되었고
  Blocking gap 8건 전부 RESOLVED. 필드명 차이 반영: `proposer_id`(not `proposer`
  object), `item_count`, `can_edit_request`(not `can_edit`), `proposed_change`는
  opaque object, change item은 별도 `.../items` 엔드포인트 패밀리, review 응답에
  `resulting_status`/`resulting_application_state`.

## 변경 파일
- 생성:
  - `docs/pm/MVP6_5_FRONTEND_UX_REQUIREMENTS.md`
  - `docs/handoffs/wave-041/FRONTEND_REPORT.md`
- `apps/` 및 `infra/`는 변경하지 않았다(planning-only).

## 실행/검증
- 실행한 명령:
  - `git diff --check` → PASS(출력 없음, `DIFF-CHECK-CLEAN`).
  - runtime leakage 확인: `apps/`/`infra/` 소스(.ts/.tsx/.py, dist 제외)에 신규
    governance/change-request 런타임 코드 없음. hit은 기존 MVP5 admin governance
    control plane + prebuilt `dist/` 번들뿐(이번 wave 신규 아님).
  - Backend draft 대조: `docs/api/MVP6_5_GOVERNANCE_API_CONTRACT_DRAFT.md`의 enum/DTO
    이름·RBAC·reason 규칙·mutation guard 7키·capabilities 필드를 문서에 verbatim 반영.
- 결과: 위 3건 PASS.
- 실행하지 못한 검증: planning 문서 범위라 FE 빌드/test/smoke/OpenAPI export는 수행하지
  않는다. `docs/api/openapi-mvp6-5-draft.json` parse/additivity는 QA 몫.

## API/Enum/DTO 변경
- 변경 여부: 없음(런타임/타입/OpenAPI/route 변경 없음). 요구사항 문서만 작성.
- 상세: Backend가 확정한 enum(`OntologyChangeRequestStatus`,
  `GovernanceApplicationState`, `GovernanceReviewAction`, `ChangeRequestTargetKind`,
  `ChangeRequestChangeType`, `GovernanceAuditAction`)과 DTO(`OntologyChangeRequest`,
  `OntologyChangeRequestDetail`, `OntologyChangeItem`, review action/response,
  audit entry, `GovernanceMutationGuard`, `GovernanceCapabilities`)를 Frontend
  요구 필드로 매핑만 했다. MVP3 `ReviewDecisionType`/`Role`/`AuditEventType`/
  ontology-element 필드는 verbatim 재사용, rename 요구 없음.
- 영향받는 역할: Backend(Wave42 구현 시 필드명 그대로 유지), QA(수용 체크리스트).

## Blocker
- 없음.
- 주의: 작업트리에 다른 wave/역할의 미커밋 변경(MVP6.4 등)이 있다. Frontend는 지정된
  요구사항/보고 문서 2개만 생성했고 다른 변경을 되돌리거나 덮어쓰지 않았다.

## 남은 TODO (DTO gaps)
- Blocking gap: 없음(8건 모두 Backend draft에서 RESOLVED).
- Non-blocking(Wave42 확인):
  - #9 audit 리스트 정렬(newest-first)/pagination 확정.
  - #10 board 리스트 pagination vs client 그룹핑 확정.
  - #11 board 행의 현재 reviewer/approver 컬럼을 review thread/latest decision에서
    파생할지, `OntologyChangeRequest`에 필드 추가가 필요한지 확정(`proposer_id`/
    `item_count`만 노출됨).
  - #12 `docs/api/openapi-mvp6-5-draft.json` parse/additivity(QA) 후 FE가 필드명
    최종 재확인.

## 다른 역할에 전달할 내용
- PM:
  - Governance LNB 배치는 Review 그룹 독립 항목으로 권고했다(신규 project-zone LNB
    1개). global LNB 0개 유지. commander가 신규 LNB 0개를 원하면 Review inbox 진입
    fallback을 택할 수 있음 — 결정 요청(아래).
- Backend(Wave42):
  - draft의 필드명을 그대로 유지해 달라(`proposer_id`, `item_count`,
    `can_edit_request`, `resulting_application_state`, opaque `proposed_change`,
    별도 `.../items` 패밀리). rename 시 FE 요구사항과 mismatch.
  - board 행의 현재 reviewer/approver 노출 여부(gap #11)와 audit/board pagination
    (#9/#10)을 Wave42 구현 전 확정해 달라.
- Frontend(Wave42 self):
  - 요구사항대로 route(`/projects/:p/governance[/new|/:id]`) + Review 그룹 LNB 항목
    (`navigation.ts` §1.6 파생 확장) + 화면 3종 + 4-mode permission 렌더 +
    approval-is-intent 배너 + D6 상태 배지 + all-false guard proof 라인을 구현.
    mock-first 후 `*:actual` smoke.
- QA(`INT6-043`~`046`):
  - LNB 활성 1개(Governance)·approver≠proposer·reason-required·409 상태충돌·
    approval 후 application_state=QUEUED + 적용 0·all-false `GovernanceMutationGuard`·
    `APPLIED`/`SUPERSEDED` 미생성·full audit trail·OpenAPI parse/additivity·runtime
    leakage 부재를 체크리스트에 포함.

## 총괄에게 요청하는 결정
- Wave41 Frontend planning을 PASS로 승인해 달라.
- **LNB 배치 결정 요청**: Governance를 (A) Review 그룹의 독립 LNB 항목
  (`/projects/:p/governance`, Frontend 권고안) vs (B) 신규 LNB 0개 + Review inbox
  진입 fallback 중 무엇으로 확정할지. 문서는 (A)를 primary로, (B)를 fallback으로
  기재했다.

## 현재 판정
- PASS (contract-first planning; Backend draft와 0 enum/DTO mismatch, Blocking gap
  0건).
