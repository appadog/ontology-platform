# PM / Architecture Report - Wave 45

## 담당 범위
- backlog ID:
  - `PM6-027` MVP6.7 Impact Simulation (read-only impact analysis of a governance
    change request) P0 scope freeze
  - (생성한 후속 ID: `BE6-052`~`BE6-055`, `FE6-073`~`FE6-076`,
    `INT6-059`~`INT6-062`)
- 작업 경로:
  - `docs/pm/MVP6_7_IMPACT_SIMULATION_BRIEF.md`
  - `docs/adr/0014-mvp6-7-impact-simulation-read-only-analysis-boundary.md`
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
  - `docs/handoffs/wave-045/PM_REPORT.md`

## 완료한 작업
- ADR 0013에서 **deferred된 impact-simulation theme**(roadmap §7 Theme 4)를 다음
  MVP6 theme P0로 확정하고 contract-first planning으로 freeze했다: 사람이 MVP6.6
  apply(또는 이후 MVP3 publish)를 commit하기 **전에**, 기존 governance change
  request에 대해 **read-only impact simulation**을 실행하고 무엇이 영향받는지
  보고서로 읽는다. runtime/route/component/model/migration/seed/smoke/test는 열지
  않았다(Wave46 대기).
- 가장 작은 coherent impact P0만 확정했다:
  - **INPUT**: primary P0 = **기존 change-request id**(MVP6.5/6.6 shape 재사용).
    hypothetical free-form change set(target_kind × change_type + element ref, 저장
    request 미연동)은 **P1**로 분리 — P0 데모 가치를 더하지 않고 입력면만 늘리므로
    제외.
  - **DIMENSIONS**(minimal-but-useful): (1) affected ontology elements = 직접
    target(s) + **bounded transitive dependents**(max depth 2); (2) dependent
    candidate entities/relations = exact `count` + capped ref list; (3) dependent
    published elements = exact `count` + capped ref list; (4) affected MVP3
    validations(`ValidationRuleCode`) + MVP4 quality(`QualityMetricGroup`) by
    reference; (5) severity/summary rollup.
  - **SEVERITY**: 신규 `ImpactSeverity`(`NONE`/`LOW`/`MEDIUM`/`HIGH`/`BREAKING`),
    counted dimension에서 **deterministic**하게 계산 — BREAKING=dependent
    **published** 있는 element의 DEPRECATE/MODIFY; HIGH=dependent **candidate**
    있는 element의 DEPRECATE/MODIFY 또는 affected `FAILED` validation; MEDIUM=
    transitive ontology dependents 또는 affected `WARNING` validation/quality
    group; LOW=직접 element만; NONE=dependent 없는 ADD. rollup = max item severity
    + per-severity counts.
  - **BOUNDING**: max transitive dependent **depth = 2**(직접 + 1 hop); dimension별
    ref **cap**(예: 50) + cap 도달 시 `truncated=true` + **exact `count`**(count는
    항상 정확, ref list만 cap). unbounded walk 없음 → deterministic + cheap +
    byte-stable.
- **CRITICAL boundary 결정**(ADR 0014에 durable 기록): (1) **READ-ONLY / NO
  MUTATION** — ontology(draft/published)·candidates·prompts·extraction·evaluation·
  **governance state**·published graph 무엇도 mutate하지 않음; **모든** 응답이
  **all-false** `ImpactSimulationMutationGuard`를 노출(**어떤 flag도 true가 되지
  않음**; MVP6.6 `GovernanceApplicationMutationGuard`와 명확히 구분 — MVP6.7은
  단일 mutation surface조차 없음). (2) **ADVISORY ONLY** — MVP6.6 apply / MVP3
  publish 이전 사람 판단용; block/gate/pre-authorize/auto-trigger 안 함, change
  request의 `status`/`application_state`를 flip 안 함, `SUPERSEDED` set 안 함
  (staleness는 MVP6.6 apply 시점 authority로 유지). (3) **DETERMINISTIC +
  BOUNDED**. (4) **ADR 0010 IA 재사용** — Governance change-request detail의
  contextual "영향도(Impact)" 패널로 소비, **신규 global LNB item 없음**, Analyze
  zone 신규 destination 없음.
- **authorization 결정**: read-only이므로 change request를 볼 수 있는 project
  member면 impact report도 볼 수 있음(MVP6.6 apply와 달리 elevated role 불필요).
  MVP5 `Role` project read check 재사용, 신규 role literal 없음. 미인가 →
  `403 PERMISSION_DENIED`, 없는 request → `404 CHANGE_REQUEST_NOT_FOUND`.
- exclusion을 명시했다: 모든 종류의 mutation; report 기반 apply/publish/enforce/
  gate; apply/publish auto-trigger; hypothetical free-form change set(P1);
  depth cap 초과 unbounded transitive closure; migration/release-note 생성;
  automated remediation/auto-fix; post-apply re-validation/re-extraction; cost/
  perf impact modelling; multi-request/cross-project impact; real LLM; agents;
  connectors; multi-tenant. durable DB/Alembic는 P0 미요구·P1/P2(process-local
  store `reset_runtime_store()` 허용).
- backlog에 Wave45 freeze summary + `PM6-027`/`BE6-052`~`055`/`FE6-073`~`076`/
  `INT6-059`~`062`을 기존 번호 체계를 이어 추가하고, 상단 status도 갱신했다. QA
  IDs는 지시대로 `INT6-059`부터 시작(INT6는 INT6-058까지 사용됨).
- 새 durable boundary 결정(read-only/no-mutation/advisory-only/deterministic-
  bounded impact analysis)이므로 ADR `0014`를 기존 per-MVP boundary 패턴(0006~0013)
  으로 추가했다.

## 변경 파일
- 생성:
  - `docs/pm/MVP6_7_IMPACT_SIMULATION_BRIEF.md`
  - `docs/adr/0014-mvp6-7-impact-simulation-read-only-analysis-boundary.md`
  - `docs/handoffs/wave-045/PM_REPORT.md`
- 수정:
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`

## 실행/검증
- 실행한 명령:
  - `git diff --check`
  - 재사용 대상 확인(read-only, 변경 없음): MVP6.6 `openapi-mvp6-6-draft.json`
    (`ChangeRequestTargetKind`, `ChangeRequestChangeType`, `OntologyElementRef`,
    `GovernanceApplicationState`, `GovernanceApplicationMutationGuard`), MVP4
    `openapi-mvp4-draft.json`(`QualityMetricGroup`={COMPLETENESS/CONSISTENCY/
    TRACEABILITY/VALIDATION/REVIEW/DUPLICATE/RELATION_DENSITY}), MVP3
    `openapi-mvp3-draft.json`(`ValidationRuleCode`×12, `ValidationResultSeverity`=
    {INFO/WARNING/FAILED}), ADR 0010/0012/0013.
  - `apps/`/`infra/`에 impact-simulation runtime leakage 부재 확인.
- 결과:
  - `git diff --check`: PASS (whitespace/충돌 경고 없음).
  - 재사용 근거 확인: validation은 MVP3 소유(`ValidationRuleCode`/
    `ValidationResultSeverity`), quality metric은 MVP4 소유(`QualityMetricGroup`,
    `VALIDATION` group 포함) — brief/ADR가 dimension 4를 이 두 surface에 by
    reference로 매핑하도록 작성. change request/item shape은 MVP6.6에서 그대로
    재사용(rename 없음).
  - runtime leakage: `NO impact-simulation runtime leakage in apps/ or infra/`.
- 실행하지 못한 검증:
  - PM/Architecture 문서 범위라 backend/frontend runtime/test/OpenAPI export는
    수행하지 않는다. OpenAPI planning artifact(`openapi-mvp6-7-draft.json`)
    작성/parse는 Backend(`BE6-055`) 몫.

## API/Enum/DTO 변경
- 변경 여부: 있음, **문서 계약 한정** (runtime/OpenAPI/DB/route 변경 없음)
- 상세:
  - Runtime API, `docs/api/openapi-*.json`, DB model/migration, frontend
    route/component는 변경하지 않았다.
  - 신규 enum 후보(문서 계약): `ImpactSeverity`
    (`NONE`/`LOW`/`MEDIUM`/`HIGH`/`BREAKING`).
  - 신규 DTO 후보(문서 계약): impact-report response(per-item + rollup),
    per-dimension shapes(affected ontology elements + transitive dependents;
    dependent candidate/published `count`+capped ref list+`truncated`; affected
    `ValidationRuleCode`/`QualityMetricGroup` refs), **all-false**
    `ImpactSimulationMutationGuard`. Backend가 `BE6-052`~`055`에서 최종 필드/
    이름/경로/persist-vs-compute를 확정한다.
  - MVP6.5/6.6 governance / MVP1 ontology / candidate + MVP3 published·validation /
    MVP4 quality / MVP5 `Role` / MVP6.3 persist-by-id 패턴은 `$ref`로 재사용,
    rename 없음.
- 영향받는 역할: Backend/Frontend/QA (아래 전달 내용 참조).

## Blocker
- 없음.
- 주의: 작업트리에 이전 wave의 미커밋 변경(MVP6.6 governance-application 문서/
  OpenAPI, wave-043 handoff 등)이 있다. PM은 지정된 PM/backlog/ADR/handoff 문서만
  편집했고 다른 변경을 되돌리거나 덮어쓰지 않았다.

## 남은 TODO
- Backend(`BE6-052`~`BE6-055`): contract draft
  (`docs/api/MVP6_7_IMPACT_SIMULATION_API_CONTRACT_DRAFT.md`) +
  `docs/api/openapi-mvp6-7-draft.json`(additive, OpenAPI 3.1.0, `0.6.7-draft`).
  open question: compute-on-demand vs persisted-report(`impact_report_id`, MVP6.3
  list+GET-by-id 패턴); target_kind별 정확한 transitive-dependent traversal 규칙;
  ref-cap 값 + per-dimension vs global cap; affected quality group을 live 계산할지
  group ref만 노출할지.
- Frontend(`FE6-073`~`FE6-076`): contextual "영향도(Impact)" 패널(Governance
  detail, 신규 LNB 없음), report layout + D6 severity badge, read-only/advisory
  copy + 상태, DTO gap. route/component/type/mock/smoke 코드 없음.
- QA(`INT6-059`~`INT6-062`):
  `docs/backlog/INT6_7_IMPACT_SIMULATION_ACCEPTANCE.md`(C planning + R
  NOT-RUNNABLE) + all-false-guard/no-mutation guard + determinism/bounding/
  severity guard + Wave46 권고.

## 다른 역할에 전달할 내용
- PM:
  - MVP6.7 P0는 **read-only impact analysis까지만**이다. report는 사람이 MVP6.6
    apply / MVP3 publish 전에 읽는 advisory이며, **어떤 것도 mutate하지 않는다**.
    hypothetical free-form change set은 P1. severity는 정보 제공용이며 apply/
    publish를 막거나 gate하지 않는다.
- Backend:
  - **draft할 contract**: change request에 대한 read-only impact simulation(compute
    and/or persisted read; 예 `POST/GET .../ontology-change-requests/{id}/
    impact-report`), persist 시 list + GET-by-id(MVP6.3 패턴). MVP6.5/6.6 +
    MVP1 ontology + candidate + MVP3 published/validation + MVP4 quality + MVP5
    `Role`을 `$ref`로만 재사용(rename 금지).
  - **검토할 필드/상태**: 5개 bounded dimension; `ImpactSeverity` per-item +
    rollup(deterministic); dependent candidate/published `count`+capped ref list+
    `truncated`; affected `ValidationRuleCode`/`QualityMetricGroup` ref; **모든**
    응답에 all-false `ImpactSimulationMutationGuard`; `403 PERMISSION_DENIED`/
    `404 CHANGE_REQUEST_NOT_FOUND`.
  - **checklist에 넣을 것**: simulation 실행이 ontology draft/published·candidate·
    prompt·extraction·evaluation·**governance state**를 mutate하지 않음; publish/
    extraction job 미시작; governance `status`/`application_state` 불변, `SUPERSEDED`
    미설정; report는 byte-stable, depth 2 bounded, ref cap + exact count.
- Frontend:
  - **검토할 fields+states**: Governance change-request detail의 contextual
    "영향도(Impact)" 패널/탭(**신규 global LNB item 없음**, ADR 0010; Analyze zone
    신규 destination 없음). 5개 dimension layout(affected ontology + transitive
    dependents; dependent candidate/published count + capped list + "truncated / N
    total"; affected validation/quality ref; `ImpactSeverity` rollup **D6 badge**).
    loading/empty/error/permission 상태 일급. "read-only analysis — no apply / no
    publish / no enforcement" 배너 + reassurance. severity는 정보 제공용이며 apply/
    publish를 막지 않음. 닫힌 design language(Section+Card, KO title, D6 badge)
    적용. auto-apply/gate/enforcement copy 금지. DTO gap을 Backend draft 대비 기록.
    route/component/type/mock/smoke 코드 없음.
- QA:
  - **checklist에 넣을 것**: PM/BE/FE가 impact P0(기존 change-request 입력;
    hypothetical=P1)·5개 dimension·`ImpactSeverity` + deterministic rollup·bounding
    (depth 2 + ref cap + exact count + `truncated`)·read-only/no-mutation +
    all-false guard·advisory-only(never-a-gate)·ADR 0010 consumption(신규 LNB 없음)·
    exclusion에 합의하는지; **모든** 응답 all-false `ImpactSimulationMutationGuard`
    (어떤 flag도 true 아님) + data-level 불변(governance state 포함, `SUPERSEDED`
    미설정); byte-stable determinism + bounding + severity 규칙; MVP1–MVP6.6 field/
    enum rename 부재; authz 403/404; OpenAPI parse/additivity; `apps/`/`infra/`
    runtime leakage 부재. Wave46 권고.

## 총괄에게 요청하는 결정
- Wave45 PM freeze를 PASS로 승인하고 Backend/Frontend/QA가 contract-first
  planning(`BE6-052`~`055`/`FE6-073`~`076`/`INT6-059`~`062`)을 이어가도록 허용해
  달라.
- MVP6.7 P0를 **read-only impact analysis까지**로 유지하고(no mutation of any kind,
  advisory-only never-a-gate, deterministic + bounded, existing change-request
  input만), hypothetical change set·apply/publish/enforce·migration/release-note·
  auto-remediation·이후 impact 확장은 별도 wave(P1+)로 분리해 달라.
- all-false mutation-guard 결정 확인 요청: MVP6.7은 MVP6.6의 단일 sanctioned
  mutation(apply의 `ontology_draft_mutated=true`) 이후 플랫폼을 **all-false posture로
  복귀**시킨다 — **모든** impact 응답이 all-false `ImpactSimulationMutationGuard`를
  노출하고 어떤 flag도 true가 되지 않는다.

## 현재 판정
- PASS
