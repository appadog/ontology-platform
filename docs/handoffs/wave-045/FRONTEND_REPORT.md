# Frontend Report - Wave 45

## 담당 범위
- backlog ID: `FE6-073`~`FE6-076` (MVP6.7 Impact Simulation — Impact panel UX/API
  requirements, contract-first planning only)
- 작업 경로:
  - `docs/pm/MVP6_7_FRONTEND_UX_REQUIREMENTS.md` (생성)
  - `docs/handoffs/wave-045/FRONTEND_REPORT.md` (생성)

## 완료한 작업
- MVP6.7 Impact Simulation의 Frontend UX/API 요구사항을
  `docs/pm/MVP6_7_FRONTEND_UX_REQUIREMENTS.md`로 확정했다 (planning only). route/
  component/type/mock/smoke/test 코드는 열지 않았다 (Wave46 대기).
- **Impact 패널 배치**: Governance change-request detail
  (`/projects/:p/governance/:changeRequestId`, `GovernanceDetailPage.tsx`)의
  contextual "영향도(Impact)" Section으로 소비. **신규 global LNB item/route 없음,
  Analyze zone 신규 destination 없음** (ADR 0010). MVP6.6 `ApplicationBlock`(APPROVED
  전용)과 달리 **lifecycle state와 무관하게 advisory**이므로 status gating 없이,
  `변경 항목`(ChangeItemsSection)과 MVP6.6 `ApplicationBlock` 사이에 삽입.
- **5개 dimension layout**을 확정: (5) 심각도 요약 rollup(먼저 표시: max
  `ImpactSeverity` D6 badge + per-severity counts) → (1) 영향받는 온톨로지 요소 +
  bounded transitive dependents(깊이 0/1/2, "최대 깊이 2" 명시) → (2) 의존 후보
  요소(exact count + capped list + truncated) → (3) 의존 게시 요소(exact count +
  capped list + truncated) → (4) 영향받는 MVP3 `ValidationRuleCode`(+`ValidationResultSeverity`)
  / MVP4 `QualityMetricGroup` by reference.
- **Severity D6 badges** 확정: `ImpactSeverity`
  (`NONE`/`LOW`/`MEDIUM`/`HIGH`/`BREAKING`) → `BREAKING`=danger/`XCircle`/`심각(파손 가능)`,
  `HIGH`=warning/`AlertTriangle`/`높음`, `MEDIUM`=warning/`중간`, `LOW`=info/`낮음`,
  `NONE`=neutral/`영향 없음`. per-item + report rollup. FE가 재계산하지 않음
  (Backend deterministic 값 그대로).
- **States 일급화**: collapsed(미실행) / loading(분석 실행 중) / ready / empty(`NONE`
  · 의존 없음, 유효 성공) / error(재분석 retry) / permission-limited(`403`, elevated
  role 불필요) / truncated. **read-only이므로 applied/superseded/409/idempotency
  상태 없음.**
- **Truncation UX**: `count`는 항상 정확, `truncated===true`일 때
  `총 <count>개 중 처음 <N>개 표시`; unbounded client paging 없음; cap 값 hardcode
  안 함.
- **read-only/advisory copy + all-false proof line**: 읽기 전용 배너 + 모든 응답
  all-false `ImpactSimulationMutationGuard` proof line. `BREAKING`/`HIGH`는 참고
  정보이며 apply/publish를 막지 않음을 명시. `적용`/`게시`/`시행`/apply-now/
  publish-now/auto-fix affordance 전면 부재; 유일한 control은 read-only
  `영향도 분석 실행` trigger.
- **DTO gap 분석** 11건을 Backend draft(부재) 대비 기록(§DTO / State Gap Analysis).
- 닫힌 design language 적용: KO title, `Section`+`HanaCard`, progressive disclosure
  (실행 전 collapse; per-item dimension expand), D6 badge, mutating primary action
  없음.

## 변경 파일
- 생성:
  - `docs/pm/MVP6_7_FRONTEND_UX_REQUIREMENTS.md`
  - `docs/handoffs/wave-045/FRONTEND_REPORT.md`
- `apps/` 변경 없음 (planning only).

## 실행/검증
- 실행한 명령:
  - `git diff --check` → PASS (whitespace/충돌 경고 없음).
  - 재사용 대상 grounding(read-only 확인, 변경 없음): `GovernanceDetailPage.tsx`
    (`SectionStack` order ~L179–228, MVP6.6 `ApplicationBlock` ~L486–850),
    `StatusBadge.tsx` D6 `tokenTable`(~L55–114 — `ImpactSeverity` row 부재 확인),
    `types.ts`(`ValidationRuleCode`/`ValidationResultSeverity` ~L53–67,
    `QualityMetricGroup` ~L823, governance/`OntologyElementRef` ~L2935–3230).
- 결과:
  - `git diff --check`: PASS.
  - 신규 tracked 파일은 상기 2건, `apps/` 미변경.
- 실행하지 못한 검증:
  - Frontend/UIUX 문서 범위라 build/test/smoke/OpenAPI export는 수행하지 않는다
    (Wave46 runtime 몫).

## API/Enum/DTO 변경
- 변경 여부: 없음 (문서 요구사항만; runtime API/OpenAPI/DB/route/type 변경 없음)
- 상세:
  - 신규 enum 후보(문서): `ImpactSeverity`(`NONE`/`LOW`/`MEDIUM`/`HIGH`/`BREAKING`).
  - 신규 DTO 후보(문서): impact-report response(rollup + per-item), per-dimension
    shapes(affected ontology + transitive dependents w/ depth; dependent
    candidate/published `count`+capped ref list+`truncated`; affected
    `ValidationRuleCode`/`QualityMetricGroup` refs), **all-false**
    `ImpactSimulationMutationGuard`. Backend(`BE6-052`~`055`)가 최종 필드/이름/경로/
    persist-vs-compute 확정.
  - MVP6.5/6.6 governance / MVP1 ontology / candidate + MVP3 published·validation /
    MVP4 quality / MVP5 `Role`는 `$ref`/reference로 재사용, rename 없음.
  - FE-side 필요 변경(Wave46): `StatusBadge.tsx` `tokenTable`에 `ImpactSeverity` 5개
    row 추가 (gap #8, Backend 의존 없음).
- 영향받는 역할: Backend (contract 필드 확정), QA (all-false/truncation/severity
  게이트).

## Blocker
- 없음 (planning 완결).
- **주의 (single open dependency)**: Backend contract draft
  (`docs/api/MVP6_7_IMPACT_SIMULATION_API_CONTRACT_DRAFT.md`) + `openapi-mvp6-7-draft.json`
  + `docs/handoffs/wave-045/BACKEND_REPORT.md`가 **작성 시점에 부재**했다(Backend
  병렬 실행). 본 문서는 PM brief + ADR 0014 기준으로 작성했고 모든 backend-owned
  필드는 `AWAITING-BACKEND`로 표기 — Wave46 전 Backend draft와 대조 필요.
- 주의: 작업트리에 이전 wave의 미커밋 변경(MVP6.6 문서/OpenAPI, wave-043 handoff
  등)이 있다. Frontend는 지정된 2개 문서만 생성했고 다른 변경을 되돌리거나 덮어쓰지
  않았다.

## 남은 TODO (DTO gaps, Wave46 전 reconcile)
- gap #1 impact endpoint + response DTO 필드명 (Blocking, AWAITING-BACKEND)
- gap #2 compute-on-demand vs persisted(`impact_report_id`) — 패널 entry UX 결정 (Blocking)
- gap #4 target_kind별 transitive-dependent 구조 + `depth` 필드 (Blocking)
- gap #5 ref-cap 값/ per-dimension vs global / cursor 여부 (Blocking)
- gap #6 affected quality group live 계산 vs by-reference (Blocking)
- gap #7 `ImpactSimulationMutationGuard` key set(8키, `governance_state_mutated` 포함) 확정 (Blocking)
- gap #3 read capability hint(`can_view_impact`) 유무 (Optional)
- gap #9 per-item impact record ↔ `OntologyChangeItem` linkage (Optional)
- gap #10 `NONE`/zero-dependent를 explicit `count:0`+`severity:NONE`로 반환 확인 (Optional)
- gap #11 OpenAPI parse/additivity (QA)
- gap #8 (**FE-owned, Backend 의존 없음**) `StatusBadge.tsx` `tokenTable`에
  `ImpactSeverity` 5개 row 추가 — Wave46 구현 시.

## 다른 역할에 전달할 내용
- PM: MVP6.7 FE 요구사항은 **read-only impact 패널까지만**이다 — 어떤 mutating
  affordance도 없고 severity는 참고 정보(never-a-gate). ADR 0010 IA 유지(신규 LNB/
  route 없음). PM freeze와 정합.
- Backend: 위 gap #1/#2/#4/#5/#6/#7이 Blocking이다. 특히 (a) compute vs persist
  결정이 패널 entry UX(trigger vs auto-load)를 좌우, (b) transitive dependent에
  `depth`(0/1/2) 필드 필요, (c) dimension 2·3에 exact `count` + capped ref list +
  `truncated` boolean 필요, (d) **모든** 응답 all-false `ImpactSimulationMutationGuard`
  key set 확정. MVP6.5/6.6 + MVP1/candidate/MVP3/MVP4/MVP5 shape은 rename 없이 `$ref`
  재사용.
- Frontend(Wave46): `StatusBadge.tsx`에 `ImpactSeverity` 5개 D6 row 추가; 패널을
  `GovernanceDetailPage.tsx` `SectionStack`의 `ChangeItemsSection`과 `ApplicationBlock`
  사이에 삽입; severity 재계산 금지(Backend 값 사용); truncation은 `count`+`N`만 표시.
- QA: 검증 게이트로 (1) **모든** 응답 all-false `ImpactSimulationMutationGuard`(어떤
  flag도 true 아님) + data-level 불변(governance state 포함, `SUPERSEDED` 미설정),
  (2) byte-stable determinism + depth 2 bounding + ref cap `truncated` + exact
  `count`, (3) deterministic severity rollup 규칙, (4) 신규 LNB/route/mutating
  affordance 부재, (5) `403`/`404`, (6) MVP1–MVP6.6 rename 부재를 넣어 달라.

## 총괄에게 요청하는 결정
- Wave45 Frontend planning(`FE6-073`~`FE6-076`)을 PASS로 승인하고, single open
  dependency(Backend draft 부재)를 Wave46 전 reconcile 조건으로 기록해 달라.
- MVP6.7 FE 범위를 **read-only 영향도 패널까지**로 유지하고(no mutating affordance,
  advisory-only never-a-gate, contextual to Governance detail, 신규 LNB/route 없음),
  hypothetical change set·apply/publish/enforce·migration/release-note·auto-fix는
  별도 wave(P1+)로 분리해 달라.

## 현재 판정
- PASS (planning). Runtime 수용은 Wave46까지 NOT RUNNABLE (설계상). 단일 open
  dependency = Backend contract draft 부재(작성 시점) → Wave46 전 대조.
