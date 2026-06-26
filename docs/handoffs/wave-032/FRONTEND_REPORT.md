# Frontend Report - Wave 32

## 담당 범위
- backlog ID:
  - `FE6-018` Learning Insights route and IA
  - `FE6-019` Learning Insights API types/client/mocks
  - `FE6-020` Product Showcase style application
  - `FE6-021` Mock and actual smoke
- 작업 경로:
  - `apps/frontend/src/pages/LearningInsightsPage.tsx` (생성)
  - `apps/frontend/src/shared/api/types.ts` (MVP6.2 타입 추가)
  - `apps/frontend/src/shared/api/client.ts` (learning client + decision error)
  - `apps/frontend/src/shared/api/queries.ts` (learning query/mutation hooks)
  - `apps/frontend/src/shared/mocks/mvp6LearningFixtures.ts` (생성)
  - `apps/frontend/src/shared/api/mvp6LearningMock.test.ts` (생성)
  - `apps/frontend/src/app/router.tsx`, `apps/frontend/src/pages/ProjectDetailPage.tsx`
  - `apps/frontend/scripts/mvp6-learning-mock-route-smoke.mjs`, `apps/frontend/scripts/mvp6-learning-actual-api-smoke.mjs` (생성)
  - `apps/frontend/package.json` (smoke scripts)

## 완료한 작업
- 필수 시작 문서(AGENTS.md, handoff-reporting SKILL, CURRENT_STATE, Wave32 NEXT_ORDERS/PM_REPORT,
  02_FRONTEND_AGENT_SKILL, frontend README, MVP6.2 API contract draft + openapi-mvp6-2-draft.json,
  MVP6.2 FE UX requirements, MVP6 UI style guide, REPORT_TEMPLATE)을 읽고, 기존 MVP6.1 Evaluation
  types/client/mocks/page/smoke 패턴을 따라 구현했다.
- **MVP6.2 frozen contract 정합**: Backend가 병렬로 구현한 `apps/backend/app/modules/learning/`
  (schemas/service/router)와 OpenAPI를 직접 대조해 Frontend TypeScript 타입/필드/enum을 정확히 맞췄다.
  draft 문서와 실제 Backend 구현이 다른 부분(아래 API/Enum/DTO 섹션)을 실제 런타임 기준으로 정렬했다.
- types: `LearningSignalType`, `LearningSourceArtifactType`, `PromptSuggestionKind`,
  `PromptSuggestionState`(SUGGESTED/ACCEPTED/DISMISSED/SUPERSEDED), `SuggestionDecisionType`(ACCEPT/DISMISS),
  `SuggestionDismissReasonCode`, `SuggestionIntendedNextAction`, `LearningConfidenceLabel`,
  `LearningRiskLabel`, `AutoApprovalPreviewStatus`, `AutoApprovalHistoricalMatchOutcome`,
  그리고 `LearningSignalSummaryResponse`, `CorrectionPattern`, `PromptSuggestion`,
  `AutoApprovalCandidatePreview`, `SuggestionDecisionRequest/Response`, `SuggestionDecisionAuditNote`,
  `MutationGuard`, `LearningSourceArtifactRef` 등 DTO를 추가했다.
- client: `getLearningSummary`, `listLearningCorrectionPatterns`, `listLearningPromptSuggestions`,
  `listLearningAutoApprovalCandidates`, `decideLearningSuggestion`를 mock/actual 양쪽으로 구현했다.
  mock store는 결정 트랜지션(SUGGESTED→ACCEPTED/DISMISSED), DISMISS reason 필수, non-`SUGGESTED` 409
  conflict를 재현하고, mutation_guard를 모두 false로 반환한다. actual 경로는 Backend `{error:{code,...}}`
  envelope를 파싱하는 `SuggestionDecisionError`로 conflict/상태를 surface한다.
- queries: `useLearningSummary`, `useLearningCorrectionPatterns`, `useLearningPromptSuggestions`,
  `useLearningAutoApprovalCandidates`, `useDecideLearningSuggestion` 훅 추가.
- page: project-scoped `Learning Insights` 화면을 Product Showcase 스타일로 구현했다.
  - 강한 dark summary 카드 + KPI strip(open/high-risk/accepted/dismissed/superseded/auto-approval)
  - section action bar(Summary/Correction Patterns/Prompt Improvements/Auto-Approval Preview/Decision History)
  - correction pattern triage queue + 우측 detail panel(설명/support/examples/source artifacts/safety note)
  - prompt suggestion board(state badge) + detail(rationale/expected impact/preview text/source artifacts)
    + accept/dismiss 결정 modal(audit-only safety copy, DISMISS reason code, note) + 결정 후 audit note 표시
  - auto-approval preview 카드/리스트: "Recommendation only · Not enforced · Requires later policy approval"
    배너, blocked actions, historical match preview, supporting metrics (enforcement 컨트롤 없음)
  - decision history audit timeline
  - non-`SUGGESTED`(ACCEPTED/DISMISSED) 및 SUPERSEDED는 already-decided/historical conflict 상태로 표시,
    결정 버튼 비활성. mock에서 conflict 발생 시 modal에 conflict 메시지 노출.
- 상태 처리: loading / error(+retry) / empty(각 섹션별) / superseded(read-side, 비활성) / decided historical을
  UI와 mock fixture로 모두 보존했다. permission-limited는 audit-only safety copy + 비파괴 패턴으로 준비.
- IA: ID-bound 상세를 global LNB에 추가하지 않았다. Learning Insights는 ProjectDetail의 contextual 카드 +
  breadcrumbs로 진입하고, deep-link 상세 경로(`/learning-insights/patterns|suggestions|auto-approval-candidates/:id`)는
  같은 area 안에서 해당 섹션/항목을 자동 선택하도록 라우팅했다.
- copy: "applied/auto-approved/trained/policy enabled" 류 자동화 함의 문구를 쓰지 않고, "Accepted for future
  prompt drafting", "No prompt version was changed", "Not enforced" 등 audit-only/preview-only 문구만 사용했다.
- HARD CONSTRAINTS 준수: hana-style-component를 feature 화면에서 직접 import하지 않고 `src/shared/ui/hana`
  adapter만 사용했다. 추가는 additive로, 기존 MVP route/smoke를 건드리지 않았다. frozen contract 안에서만 작업했다.

## 변경 파일
- 수정:
  - `apps/frontend/src/shared/api/types.ts`
  - `apps/frontend/src/shared/api/client.ts`
  - `apps/frontend/src/shared/api/queries.ts`
  - `apps/frontend/src/app/router.tsx`
  - `apps/frontend/src/pages/ProjectDetailPage.tsx`
  - `apps/frontend/package.json`
- 생성:
  - `apps/frontend/src/pages/LearningInsightsPage.tsx`
  - `apps/frontend/src/shared/mocks/mvp6LearningFixtures.ts`
  - `apps/frontend/src/shared/api/mvp6LearningMock.test.ts`
  - `apps/frontend/scripts/mvp6-learning-mock-route-smoke.mjs`
  - `apps/frontend/scripts/mvp6-learning-actual-api-smoke.mjs`

## 실행/검증
- `cd apps/frontend && npm run test`
  - 결과: PASS. Test Files 7 passed, Tests 19 passed (신규 `mvp6LearningMock.test.ts` 6건 포함:
    summary taxonomy, correction patterns, auto-approval recommendation-only, ACCEPT + all-false
    mutation_guard, DISMISS reason 필수 + conflict, SUPERSEDED conflict).
- `cd apps/frontend && npm run build`
  - 결과: PASS. `tsc --noEmit`(app+node) 통과, vite build 성공(`✓ built in ~2s`).
- `cd apps/frontend && npm run smoke:mvp6:learning:mock`
  - 결과: PASS (rename 수정 후 재실행). `{status: PASS, routeCount: 6, screenshotCount: 6}`.
    artifact: `/tmp/ontology-mvp6-learning-mock-smoke/`. summary→patterns(Affected classes/relations +
    "Insurance Product" 렌더 검증 포함)→suggestions(accept+audit note)→superseded read-side notice→
    auto-approval(preview-only/blocked actions)→history 검증.
- `cd apps/frontend && npm run smoke:mvp6:learning:actual`
  - 결과: PASS (RAN, rename 수정 후 재실행). `{status: PASS, apiCheckCount: 7, routeCount: 1}`.
    artifact: `/tmp/ontology-mvp6-learning-actual-smoke/`.
  - 실행 방법: Backend를 SQLite로 부팅(`DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave32-learning.db
    alembic upgrade head` 후 uvicorn :8000), Frontend를 actual 모드(`VITE_USE_MOCK_API=false
    VITE_API_BASE_URL=http://127.0.0.1:8000`, :5173)로 부팅 후 실행.
  - 검증 내용: project 생성 → summary(7 signal types, total 14) → **correction-patterns의 renamed nested
    필드 검증: `affected_classes[0].ontology_class_id`(=class-insurance-product, label "Insurance Product"),
    `affected_relations[0].ontology_relation_id`(=relation-includes)** → auto-approval `outcomes[0].reason`
    존재 확인(recommendation_only/not_enforced=true) → prompt-suggestions(SUGGESTED 존재) →
    DISMISS reason 누락 시 400 `DISMISS_REASON_REQUIRED` → ACCEPT시 SUGGESTED→ACCEPTED + mutation_guard
    전부 false → 재결정 409 `PROMPT_SUGGESTION_DECISION_CONFLICT` → SUPERSEDED 결정 409 →
    **actual UI Correction Patterns 섹션에서 "Affected classes"/"Affected relations" 및 renamed nested
    필드에서 나온 "Insurance Product"/"includes" 라벨 렌더 확인** → summary/ACCEPTED state/history 렌더 확인.
  - 백엔드 payload 직접 확인: `affected_classes[0]` keys = `[ontology_class_id, label]`,
    `affected_relations[0]` keys = `[ontology_relation_id, label]`, outcome keys = `[artifact_id, outcome, reason]`.
- `git diff --check`
  - 결과: PASS (whitespace 오류 없음).
- 로컬 dev server 정리: smoke 후 :5173, :8000 모두 종료 확인(둘 다 clear).

## API/Enum/DTO 변경
- 변경 여부: 없음 (frozen MVP6.2 contract 범위 내, Frontend 타입은 추가만 함).
- **Wave32 commander follow-up 반영 — FE/BE contract drift 수정**: Backend가 frozen contract
  (`docs/api/openapi-mvp6-2-draft.json` / `MVP6_2_API_CONTRACT_DRAFT.md`, source of truth)에 맞춰 런타임
  필드명을 rename했고, Frontend를 backend `app/modules/learning/schemas.py`에 field-by-field로 재정렬했다:
  - `OntologyClassRef`: `class_id` → **`ontology_class_id`** (schemas.py:144).
  - `OntologyRelationRef`: `relation_id` → **`ontology_relation_id`** (schemas.py:149).
  - `AutoApprovalHistoricalOutcomeItem`: `explanation` → **`reason`** (schemas.py:284).
  - `LearningEvidenceRef`: **`evidence_id` 필드 제거** — backend(schemas.py:117)는 `source_id`/
    `source_segment_id`/`locator`/`quote` 4개 필드만 가진다 (추가로 발견해 수정한 drift).
  - 반영 위치: `types.ts`, `mvp6LearningFixtures.ts`(affected_classes/relations, outcomes.reason, evidence_id 제거),
    `LearningInsightsPage.tsx`(`outcome.reason` 렌더). `CorrectionPattern.explanation`(schemas.py:174)은
    별개 정당 필드이므로 그대로 유지.
- 전체 DTO field-by-field 재확인 완료(backend `schemas.py` 전수 대조): `LearningSignalSummaryResponse`,
  `LearningSignalTypeCount`, `LearningWindow`, `LearningPatternSummary`(pattern_id), `LearningSourceArtifactRef`,
  `LearningEvidenceRef`, `OntologyClassRef`, `OntologyRelationRef`, `CorrectionPattern`, `CorrectionPatternExample`,
  `PromptSuggestion`, `SuggestionDecisionRequest/Response`, `SuggestionDecisionAuditNote`, `SuggestionSnapshot`,
  `MutationGuard`, `AutoApprovalCandidatePreview`, `AutoApprovalRulePreview`, `AutoApprovalPreviewMetric`,
  `AutoApprovalHistoricalMatchPreview`, `AutoApprovalHistoricalOutcomeItem` — 필드명/enum 모두 일치, **남은 drift 0건**.
- list 엔드포인트는 bare array 반환, POST decisions는 201 반환(`unwrapItems`로 array/items 호환).
  에러 envelope는 `{error:{code,message,details}}`이며 client/actual smoke가 이 envelope를 파싱.
- 영향받는 역할: 없음(추가형). QA는 actual smoke에서 위 필드/enum/transition/conflict/mutation guard를 그대로 검증 가능.

## Blocker
- 없음.
- 주의: 작업 시작 시 Backend가 `learning/schemas.py`, `learning/service.py`를 같은 wave에서 수정 중이었고,
  repo에 다른 untracked/modified 문서가 있었다. Frontend는 Backend의 현재 구현 상태를 source of truth로
  삼아 정합했고, Backend 코드를 수정하지 않았다.

## 남은 TODO
- (선택) permission-limited 실제 권한 신호를 Backend가 노출하면 decision 버튼 disable에 권한 사유를 연결.
- (선택) summary `generated_at` 기반 stale 임계값을 product 정책으로 확정되면 stale 배지 임계 적용.
- 이번 thin slice 범위 밖이며 P0 flow에는 영향 없음.

## 다른 역할에 전달할 내용
- PM:
  - Learning Insights는 frozen P0 loop만 구현했고 자동 승인/적용 함의 문구는 사용하지 않았다.
    auto-approval은 recommendation-only/not-enforced/requires-later-policy-approval로 일관 표기.
- Backend:
  - Wave32 follow-up rename(`ontology_class_id`/`ontology_relation_id`/`reason`, `LearningEvidenceRef`에서
    `evidence_id` 제거)을 Frontend에 모두 반영해 남은 field-name drift는 0건이다. Frontend는 frozen contract와
    backend `schemas.py`를 정답으로 본다. 추후 추가 rename 시 사전 공유해 달라.
- Frontend:
  - 신규 smoke: `npm run smoke:mvp6:learning:mock`, `npm run smoke:mvp6:learning:actual`.
    actual은 SQLite 부팅 + actual 모드 Vite 필요(위 실행 방법 참조).
- QA:
  - acceptance gate(non-`SUGGESTED` conflict, mutation_guard all false)는 mock test와 actual smoke 양쪽에서
    재현/검증됨. `INT6-018`(mock/API flow), `INT6-019`(no-mutation guard) 검증에 바로 사용 가능.
  - actual smoke는 자기-생성 project를 사용하므로 deterministic seed 의존 없음. backend 학습 데이터는
    프로젝트별 process-local auto-seed.

## 총괄에게 요청하는 결정
- Wave32 Frontend Learning Insights thin UI를 `PASS`로 승인 요청.
- Wave32 commander follow-up(FE/BE contract drift) 처리 완료: `ontology_class_id`/`ontology_relation_id`/
  `reason` rename + `LearningEvidenceRef.evidence_id` 제거를 반영했고, backend `schemas.py` 전수 대조 결과
  남은 drift 0건. test/build/mock/actual 모두 재실행 PASS.

## 현재 판정
- PASS
