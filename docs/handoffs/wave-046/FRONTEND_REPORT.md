# Frontend Report - Wave 46 (MVP6.7 Impact Simulation — read-only Impact panel)

## 담당 범위
- backlog ID: `FE6-077` (types/client/mocks), `FE6-078` (impact panel: 5 dimensions + severity badges + truncation), `FE6-079` (states + read-only copy), `FE6-080` (mock + actual smoke).
- 작업 경로: `apps/frontend/src` (types, client, queries, StatusBadge, governance detail + new impact panel, mock fixtures, mock test), `apps/frontend/scripts` (mock + actual smoke), `package.json`.
- 범위 원칙: additive; hana only via `src/shared/ui/hana` adapter; NO API/DTO/enum change; extend the existing MVP6.5/6.6 Governance detail (no new LNB/route).

## 완료한 작업
- Read AGENTS.md, handoff-reporting SKILL, CURRENT_STATE, Wave46 NEXT_ORDERS, PM_REPORT (frozen G1-G3, `ref_cap`=20), the FROZEN contract (`MVP6_7_..._API_CONTRACT_DRAFT.md` + `openapi-mvp6-7-draft.json`), the FE UX requirements, and the existing GovernanceDetailPage/governanceShared/StatusBadge/governance client-query-mocks.
- **FE6-077** Added the MVP6.7 types to `types.ts` matching the frozen OpenAPI EXACTLY: `ImpactSeverity`, `ImpactSeverityReason`, `DependencyRelation`, `ImpactSimulationMutationGuard` (all-false literal), `AffectedOntologyElement`, `DependentRefBucket`, `AffectedValidationRef`, `ImpactItem`, `ImpactSeverityCounts`, `ImpactSummary`, `ImpactBounding`, `ImpactSimulationCapabilities`, `ImpactSimulationReport`. Reused `OntologyElementRef`, `ChangeRequestTargetKind/ChangeRequestChangeType`, `ValidationRuleCode/ValidationResultSeverity`, `QualityMetricGroup`, `GovernanceRole` by reference (no rename). Added the client method `getChangeRequestImpactSimulation` (GET `.../{id}/impact-simulation`, mock + actual branch, `ref_cap`/`target_ontology_version_id` query params) and the `useChangeRequestImpactSimulation` query hook (trigger-gated, `staleTime: Infinity` for byte-stability). Added deterministic mock fixtures (`mvp6ImpactFixtures.ts`) keyed by change-request id: BREAKING (published dependents + 128→20 truncated candidates), HIGH (candidate-only DEPRECATE), NONE/LOW (ADD + direct-only), plus an empty-`NONE` fallback.
- **FE6-078** Added the contextual "영향도(Impact)" `Section`+`HanaCard` panel (`governanceImpact.tsx`) into the detail `SectionStack`, placed after `변경 항목` and before the MVP6.6 `ApplicationBlock` (advisory for ANY lifecycle state; not gated on APPROVED). Renders all 5 dimensions: (5) severity rollup first (max `ImpactSeverity` D6 badge + per-severity counts + exact totals), (1) affected ontology elements with depth 0/1/2 + `relation_to_target` + "최대 깊이 2" copy, (2) dependent candidate bucket (exact count + capped list + layer label), (3) dependent published bucket (same, layer label), (4) affected `ValidationRuleCode`(+severity badge) / `QualityMetricGroup` by reference. Added the five `ImpactSeverity` D6 rows to the `StatusBadge` `tokenTable` (BREAKING=danger/XCircle, HIGH=warning, MEDIUM=warning, LOW=info, NONE=neutral) — FE-owned gap #8.
- **FE6-079** First-class states: collapsed (read-only `영향도 분석 실행` trigger, NOT a primary/apply-styled button) → loading ("분석 실행 중…", never "applying") → ready → empty(`NONE`/no-dependents, benign success) → error (`다시 분석` retry, degrades in-panel, never a crash/mutation) → permission-limited (`403`→`PERMISSION_LIMITED` badge). Read-only/advisory banner + all-false mutation-guard proof line always shown; a true flag would render an unexpected-state danger notice. Truncation UX: exact `count` headline + "총 <count>개 중 처음 <N>개 표시". Copy guard: no `적용`/`게시`/`시행`/지금-적용/자동-수정 affordance anywhere; advisory-not-a-block copy on BREAKING/HIGH.
- **FE6-080** Added `npm run smoke:mvp6:impact:mock` and `:actual`. Actual smoke self-creates propose→submit→approve then asserts the report shape (5 dims), summary rollup, bounding (depth 2 + ref_cap), byte-stable idempotency, VIEWER read authz, and the all-false guard.

## 변경 파일
- `apps/frontend/src/shared/api/types.ts` — MVP6.7 types (additive, end of file).
- `apps/frontend/src/shared/api/client.ts` — `getChangeRequestImpactSimulation` + fixture/type imports.
- `apps/frontend/src/shared/api/queries.ts` — `governanceKeys.impact` + `useChangeRequestImpactSimulation`.
- `apps/frontend/src/shared/ui/platform/StatusBadge.tsx` — 5 `ImpactSeverity` D6 token rows.
- `apps/frontend/src/pages/governanceImpact.tsx` — NEW impact panel component.
- `apps/frontend/src/pages/GovernanceDetailPage.tsx` — mount `ImpactSimulationSection` in the SectionStack.
- `apps/frontend/src/shared/mocks/mvp6ImpactFixtures.ts` — NEW deterministic reports + all-false guard + `MVP6_IMPACT_REF_CAP=20`.
- `apps/frontend/src/shared/api/mvp6ImpactMock.test.ts` — NEW mock contract test (7 cases).
- `apps/frontend/scripts/mvp6-impact-mock-route-smoke.mjs`, `mvp6-impact-actual-api-smoke.mjs` — NEW smokes.
- `apps/frontend/package.json` — `smoke:mvp6:impact:mock` + `:actual`.

## 실행/검증
- `npm run test` → **12 files, 66 tests passed** (incl. 7 new `mvp6ImpactMock` cases; MVP6.5/6.6 governance 16 cases still pass).
- `npm run build` → **PASS** (`tsc --noEmit` app+node + `vite build` ✓ built, 1882 modules, 0 type errors).
- `npm run smoke:mvp6:impact:mock` → **PASS** `{routeCount:3, screenshotCount:3}` (collapsed→run→BREAKING report w/ advisory banner + all-false proof + rollup + depth 0/1/2 + "총 128개 중 처음 …" truncation + no apply/publish/enforce CTA; empty `NONE` report).
- `npm run smoke:mvp6:impact:actual` → **PASS** `{checks:4}` — RAN against the real backend (uvicorn on file SQLite, `project-corp-knowledge` seeded, backend `impact.py` was implemented in-parallel this wave). Asserted: report with 5 dimensions, summary rollup, bounding depth=2/ref_cap, byte-stable idempotency, VIEWER read authz, and the all-false `ImpactSimulationMutationGuard`. **Zero FE/BE contract drift** (field names identical: `governance_state_mutated`, `ref_cap=20`, `max_dependent_depth=2`, `severity_reason`, `relation_to_target`, `analyzed_ontology_version_status`, all dimension names).
- Responsive 0-overflow re-check (governance detail, **impact panel expanded** = worst-case BREAKING+truncation): `1440×900 overflowX=0 OK · 1366×768 OK · 1280×800 OK · 768×1024 OK`. (Initial 768 overflow of 163px was fixed same-wave by adding `min-width:0` to the flex `ItemList`/`ItemCard`; the inner `CompactTable` scrolls internally.) Screenshots in scratchpad.
- Regression: `smoke:mvp6:governance:mock` PASS (6 routes), `smoke:mvp6:governance-apply:mock` PASS (5 routes) — neighboring flows unaffected by the shared-page/StatusBadge edits.
- `git diff --check` → clean.
- 실행하지 못한 검증: none. Both mock and actual smoke ran.

## API/Enum/DTO 변경
- 변경 여부: 없음 (frontend consumes the frozen contract verbatim; no API/DTO/enum change requested or made).
- 상세: All MVP6.7 FE types mirror `openapi-mvp6-7-draft.json` exactly; all reused shapes/enums referenced by name (no rename). The only additive UI-side item is the five `ImpactSeverity` `StatusBadge` `tokenTable` rows (FE-owned, gap #8) — not an API change.
- 영향받는 역할: none (contract unchanged).

## Blocker
- 없음.

## 남은 TODO
- QA: `INT6-063`~`INT6-066` — independent DATA-level no-mutation proof (before==after on all surface tables around the GET), FE mock + actual verification, MVP1-MVP6.6 regression breadth. FE actual smoke already booted the real backend and passed with 0 drift, so QA can re-use the same boot recipe (SQLite + seeded `project-corp-knowledge`).
- P1 (non-blocking): if Backend later persists reports (`impact_report_id`), a bounded "더 보기" beyond the ref cap could be added; not needed for P0 (capped list + exact count is the P0 contract).

## 다른 역할에 전달할 내용
- PM: `ref_cap` default = 20 is applied FE-side ("상한 20" + "처음 N개 표시"); no scope change.
- Backend: FE↔BE contract verified drift-free via `smoke:mvp6:impact:actual`. Boot recipe: create schema (`app.db.base.Base.metadata.create_all`), insert a `project-corp-knowledge` row, `uvicorn` on file SQLite; propose refs must be seeded (`property-name` etc.) — the smoke uses `property-name` MODIFY.
- Frontend: panel lives at `governanceImpact.tsx`, mounted in `GovernanceDetailPage.tsx` between `변경 항목` and `ApplicationBlock`.
- QA: assertion hooks — advisory banner text "이 분석은 읽기 전용입니다", proof line "모든 mutation 플래그 false", "심각도 요약", severity D6 badges, "총 <count>개 중 처음 <N>개 표시", and absence of any 적용/게시/시행/자동수정 button.

## 총괄에게 요청하는 결정
- 없음 (모든 게이트 PASS, contract drift-free, no-regression 확인). 다음 단계로 QA(INT6-063~066) 진행 권장.

## 현재 판정
- PASS (types/client/mocks + 5-dimension read-only impact panel + all states + all-false proof + truncation + D6 severity badges; test/build/mock smoke + actual smoke all PASS; 0 overflow at 1440/1366/1280/768; API/Enum/DTO=none; no regression to MVP1-MVP6.6).
