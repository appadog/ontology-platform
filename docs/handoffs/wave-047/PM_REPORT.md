# PM / Architecture Report - Wave 47

## 담당 범위
- backlog ID:
  - `PM6-029` MVP6.8 Agents / Copilot P0 scope freeze (contract-first planning
    only)
  - (생성한 후속 ID: `BE6-060`~`BE6-063`, `FE6-081`~`FE6-084`,
    `INT6-067`~`INT6-070`)
- 작업 경로:
  - `docs/pm/MVP6_8_COPILOT_BRIEF.md`
  - `docs/adr/0015-mvp6-8-copilot-advisory-only-non-autonomous-audit-only-accept-routes-not-executes-no-real-llm-boundary.md`
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
  - `docs/handoffs/wave-047/PM_REPORT.md`

## 완료한 작업
- MVP6.8 Agents / Copilot(roadmap Theme 5)을 **가장 작고 SAFE한, human-in-the-loop,
  non-autonomous** P0로 contract-first planning freeze했다. runtime/route/
  component/model/migration/seed/smoke/test는 열지 않았다(Wave48 대기).
- **P0 flow 확정**: `open project copilot -> view deterministic suggested actions
  (what / why / source grounding / target gated flow) -> accept (routes human into
  that EXISTING gated flow, pre-filled/deep-linked — copilot executes NOTHING) or
  dismiss (reason) -> decision audit note`. copilot는 아무것도 실행하지 않는다.
- **Suggestion taxonomy(4 kinds, `CopilotSuggestionKind`)**: 각 kind가 target
  기존 gated flow를 명시하고 source artifact를 인용:
  - `DRAFT_GOVERNANCE_CHANGE_REQUEST` → MVP6.5 change-request create/propose
    (pre-filled draft; copilot은 생성하지 않음).
  - `REVIEW_THESE_CANDIDATES` → MVP3 candidate review inbox/workbench(deep-link).
  - `INSPECT_QUALITY_OR_VALIDATION_SIGNAL` → MVP4 quality / MVP3 validation
    drilldown(read-only destination).
  - `RUN_IMPACT_SIMULATION` → MVP6.7 impact-report panel(read-only).
- **States + decision(MVP6.2 vocabulary mirror, MVP6.2 enum rename 없음)**:
  `CopilotSuggestionState` = `SUGGESTED`→{`ACCEPTED`|`DISMISSED`|`SUPERSEDED`},
  `SUPERSEDED`는 read-side only. request command `ACCEPT`/`DISMISS`(resulting
  state `ACCEPTED`/`DISMISSED`와 구분). `DISMISS`는 reason code 필수(MVP6.2 set
  그대로 재사용: `NOT_RELEVANT`/`INSUFFICIENT_EVIDENCE`/`DUPLICATE`/`OUT_OF_SCOPE`/
  `RISK_TOO_HIGH`/`OTHER`). non-`SUGGESTED` decision →
  `409 COPILOT_SUGGESTION_DECISION_CONFLICT`.
- **Accept-routes-not-executes 모델 정밀 정의**: `ACCEPT`는 **routing-target
  descriptor**를 반환한다(`CopilotRoutingTargetKind`:
  `GOVERNANCE_CHANGE_REQUEST_DRAFT`/`CANDIDATE_REVIEW_LOCATION`/
  `QUALITY_OR_VALIDATION_LOCATION`/`IMPACT_REPORT_LOCATION`) = deep-link + optional
  pre-fill payload로, **어떤 authority도 없다**(change request 생성/candidate
  approve/apply/publish 무엇도 하지 않음). accept 시 copilot은 (1) state 전이
  (`SUGGESTED`→`ACCEPTED`), (2) decision audit record, (3) 반환된 routing-target
  descriptor만 기록한다. QA가 "accept does not execute"를 3계층으로 검증 가능하게
  설계: response guard all-false / copilot module이 gated-flow write path 미import /
  accept 후 candidate·published·prompt·ontology·governance·extraction·evaluation
  테이블 불변.
- **Source-grounding 요구**: 모든 suggestion은 파생 근거(evidence/version/candidate/
  validation/quality/governance/learning refs; MVP6.2 `LearningSourceArtifactType`
  + 기존 shape을 by reference 재사용)를 인용해야 하며, source-artifact refs가 없는
  suggestion은 **display 불가·생성 불가**. ungrounded generation 금지. suggestion은
  **deterministic**(same project state → byte-stable list).
- **No-real-LLM boundary**: P0에 real LLM/external model call 없음 — deterministic
  mock only(MockProvider 선례).
- **All-false mutation guard**: 모든 copilot 응답(summary/list/detail/decision
  accept·dismiss)에 all-false `CopilotMutationGuard`. accept 포함 어떤 응답에서도
  어떤 flag도 true가 되지 않는다(MVP6.6 단일 apply guard와 구분). copilot-specific
  flag `copilot_executed_action`/`real_model_invoked`를 포함해 14개 flag 모두 false.
- **authorization 결정**: 프로젝트를 읽을 수 있는 project member면 copilot view +
  audit-only accept/dismiss 가능(decision은 아무것도 mutate하지 않고 권한도 부여하지
  않으므로 elevated role 불필요). **downstream** gated flow는 자기 RBAC 유지(예:
  governance approve는 approver만). MVP5 `Role` 재사용, 신규 role literal 없음.
  미인가 → `403 PERMISSION_DENIED`, 없는 project/suggestion →
  `404 PROJECT_NOT_FOUND`/`404 COPILOT_SUGGESTION_NOT_FOUND`.
- exclusion을 명시했다: autonomous action; auto-apply/publish/approve/create;
  policy enforcement/gating; real LLM/non-deterministic generation; tool-calling
  runtime; multi-step agent execution; agent planning/orchestration; background/
  scheduled/always-on agents; 모든 graph/prompt/governance/policy state의 direct
  mutation; ungrounded generation; frozen 4 kind/4 routing-target 초과 신규 kind;
  multi-/cross-project copilot; connector/plugin SDK; multi-tenant runtime.
  durable DB/Alembic는 P0 미요구·P1/P2(process-local `reset_runtime_store()` 허용).
- backlog에 Wave47 freeze summary + `PM6-029`/`BE6-060`~`063`/`FE6-081`~`084`/
  `INT6-067`~`070`을 기존 번호 체계를 이어 추가하고, 상단 status도 갱신했다. QA
  IDs는 지시대로 `INT6-067`부터 시작(INT6는 INT6-066까지 사용됨).
- 새 durable boundary(advisory-only / non-autonomous / audit-only /
  accept-routes-not-executes / no-real-LLM)이므로 ADR `0015`를 기존 per-MVP boundary
  패턴(0006~0014)으로 추가했다.

## 변경 파일
- 생성:
  - `docs/pm/MVP6_8_COPILOT_BRIEF.md`
  - `docs/adr/0015-mvp6-8-copilot-advisory-only-non-autonomous-audit-only-accept-routes-not-executes-no-real-llm-boundary.md`
  - `docs/handoffs/wave-047/PM_REPORT.md`
- 수정:
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`

## 실행/검증
- 실행한 명령:
  - `git diff --check` → PASS (whitespace/충돌 경고 없음).
  - `git status --porcelain` → PM/backlog/ADR/handoff 문서만 변경.
  - `grep -rIl -i copilot apps/ infra/` → 프로젝트 소스에는 copilot runtime 없음
    (매치는 `apps/frontend/node_modules/`의 무관한 third-party 파일뿐).
- 결과:
  - `git diff --check`: PASS.
  - runtime leakage: NO copilot runtime leakage in project `apps/`/`infra/` source.
- 실행하지 못한 검증:
  - PM/Architecture 문서 범위라 backend/frontend runtime/test/OpenAPI export는
    수행하지 않는다. OpenAPI planning artifact(`openapi-mvp6-8-draft.json`)
    작성/parse는 Backend(`BE6-063`) 몫.

## API/Enum/DTO 변경 (planning only)
- 변경 여부: 있음, **문서 계약 한정** (runtime/OpenAPI/DB/route 변경 없음)
- 신규 enum 후보(문서 계약): `CopilotSuggestionKind`(4),
  `CopilotSuggestionState`(`SUGGESTED`/`ACCEPTED`/`DISMISSED`/`SUPERSEDED`),
  `CopilotRoutingTargetKind`(4). request command `ACCEPT`/`DISMISS`; dismiss
  reason code set은 MVP6.2 재사용(rename 없음).
- 신규 DTO 후보(문서 계약): copilot summary; suggestion(kind/state/title/rationale/
  routing-target descriptor + pre-fill payload/source-artifact refs(required)/
  confidence/risk/audit note); decision request/response(accept 시 routing target);
  all-false `CopilotMutationGuard`(14 flags incl. `copilot_executed_action`/
  `real_model_invoked`). Backend가 `BE6-060`~`063`에서 최종 필드/이름/경로/
  persist-vs-compute를 확정한다.
- 재사용(by `$ref`, rename 없음): MVP6.2 learning-decision + `LearningSourceArtifactType`,
  MVP3 candidate/evidence/review + `ValidationRuleCode`, MVP4 `QualityMetricGroup`,
  MVP6.5/6.6 governance(`ChangeRequestTargetKind`/`ChangeRequestChangeType`/
  `OntologyElementRef`/lifecycle), MVP6.7 impact, MVP1 ontology/version + prompt/
  model-run context, MVP5 `Role`.
- 영향받는 역할: Backend/Frontend/QA (아래 전달 내용 참조).

## Blocker
- 없음.

## 남은 TODO
- Backend(`BE6-060`~`063`): `docs/api/MVP6_8_COPILOT_API_CONTRACT_DRAFT.md`
  (additive endpoint families + enums/DTOs + all-false guard + accept-routes-
  not-executes) + `docs/api/openapi-mvp6-8-draft.json`(additive, OpenAPI 3.1.0,
  `0.6.8-draft`, disjoint-additive). open question: persist-vs-compute
  (`suggestion_id` list+GET-by-id, MVP6.3/6.7 패턴); kind별 pre-fill payload shape
  (특히 governance change-request draft); deep-link locator shape per routing kind.
- Frontend(`FE6-081`~`084`): `docs/pm/MVP6_8_FRONTEND_UX_REQUIREMENTS.md`
  (project-scoped placement per ADR 0010, suggestion list layout, accept-routes-
  into-existing-flow UX, dismiss+reason, decision audit note, loading/empty/error/
  permission 상태, advisory/executes-nothing copy, DTO gap). route/component/type/
  mock/smoke 코드 없음.
- QA(`INT6-067`~`070`): `docs/backlog/INT6_8_COPILOT_ACCEPTANCE.md`(C planning +
  R NOT-RUNNABLE) + accept-routes-not-executes 3계층 guard + all-false/audit/
  grounding/determinism guard + Wave48 권고.

## 다른 역할에 전달할 내용
- Backend:
  - **draft할 contract**: 4개 endpoint family(`GET .../copilot/summary`,
    `GET .../copilot/suggestions`, `GET /copilot-suggestions/{id}`,
    `POST /copilot-suggestions/{id}/decisions`). read-mostly, project-scoped; 유일한
    write-like는 audit-only decision capture(accept 시 routing-target descriptor +
    state 전이 + audit만 기록). MVP6.2/MVP3/MVP4/MVP6.5/6.6/6.7/MVP1/MVP5를 `$ref`로만
    재사용(rename 금지); gated-flow write path 미import.
  - **검토할 필드/상태**: `CopilotSuggestionKind`(4, 각 target gated flow 명시),
    `CopilotSuggestionState`, `CopilotRoutingTargetKind`(4); suggestion 필수 content
    (source-artifact refs **non-empty**, routing-target descriptor + pre-fill
    payload, confidence/risk, audit note); decision request(`ACCEPT`/`DISMISS`+
    reason) + response(accept 시 routing target); **모든** 응답에 all-false
    `CopilotMutationGuard`(14 flags incl. `copilot_executed_action`/
    `real_model_invoked` false); `409 COPILOT_SUGGESTION_DECISION_CONFLICT`/`403`/
    `404`.
  - **checklist에 넣을 것**: accept가 routing target만 반환하고 아무것도 실행하지
    않음(3계층); suggestion list byte-stable deterministic; source-artifact refs 없는
    suggestion 생성 불가; no real LLM(`real_model_invoked=false`); persist-vs-compute/
    pre-fill/deep-link open question 해소.
- Frontend:
  - **검토할 fields+states**: project-scoped copilot placement(ADR 0010 — Analyze
    group destination 또는 contextual panel, ID-bound global LNB page 없음);
    suggestion list(what/why/source grounding/target flow); accept-routes-into-
    existing-flow UX로 **human gate를 명시적으로** 노출(copilot never acts);
    dismiss+reason; decision audit note; loading/empty/error/permission 일급.
    "advisory — no execution / no auto-apply / no auto-publish / no auto-approve"
    배너 + reassurance. 닫힌 design language(Section+Card, KO title, confidence/risk
    D6 badge). autonomous/agent-acts copy 금지. DTO gap을 Backend draft 대비 기록.
    route/component/type/mock/smoke 코드 없음.
- QA:
  - **checklist에 넣을 것**: PM/BE/FE가 P0 flow·4-kind taxonomy(각 target gated flow
    명시)·states/commands/reason rules·accept-routes-not-executes 모델·source-
    grounding 요구·advisory-only/non-autonomous/audit-only/no-real-LLM boundary·
    exclusion에 합의하는지; accept executes NOTHING(response all-false guard incl.
    `copilot_executed_action`/`real_model_invoked` / code-level gated-flow write
    path 미import / data-level candidate·published·prompt·ontology·governance·
    extraction·evaluation 불변); routing target에 authority 없음; all-false
    `CopilotMutationGuard` 모든 응답; audit content 완비; 모든 suggestion source-refs
    non-empty(no ungrounded); byte-stable determinism; non-`SUGGESTED` decision
    `409`; `DISMISS` reason 필수; command≠state; authz `403`/`404`; MVP6.2 enum
    rename 부재; OpenAPI parse/additivity; `apps/`/`infra/` runtime leakage 부재.
    Wave48 권고.

## 총괄에게 요청하는 결정
- Wave47 PM freeze를 PASS로 승인하고 Backend/Frontend/QA가 contract-first
  planning(`BE6-060`~`063`/`FE6-081`~`084`/`INT6-067`~`070`)을 이어가도록 허용해
  달라.
- MVP6.8 P0를 **advisory-only, non-autonomous copilot suggestion loop까지**로
  유지하고(copilot executes NOTHING; accept는 기존 gated flow로 route만 함;
  audit-only; no real LLM; 모든 응답 all-false guard), autonomous action·
  auto-apply/publish/approve/create·policy enforcement·real LLM·tool-calling/
  multi-step/orchestration/background agent runtime·모든 direct mutation은 별도
  wave(P1+)로 분리해 달라.
- 4-kind suggestion taxonomy + 4-kind routing-target을 P0 상한으로 승인해 달라
  (신규 kind는 이후 PM freeze로만 추가).

## 현재 판정
- PASS
