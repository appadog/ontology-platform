# Frontend Report - Wave 48 (MVP6.8 Copilot THIN IMPLEMENTATION)

## 담당 범위
- backlog ID: `FE6-085` (route/IA + types/client/mocks), `FE6-086` (suggestion list + detail), `FE6-087` (accept-routing + dismiss + audit note + advisory/"executes nothing" copy), `FE6-088` (mock + actual smoke).
- 작업 경로: `apps/frontend/` only. Additive; no MVP1–MVP6.7 route/enum/smoke break; no rename of reused shapes; hana only via `src/shared/ui/hana` adapter.

## 완료한 작업
- Read AGENTS.md, handoff-reporting SKILL, CURRENT_STATE, Wave48 NEXT_ORDERS, PM_REPORT (G1–G3 freeze), the FROZEN contract (`MVP6_8_COPILOT_API_CONTRACT_DRAFT` + `openapi-mvp6-8-draft.json`, 4 paths / 24 schemas), `MVP6_8_FRONTEND_UX_REQUIREMENTS.md`, ADR 0015, D1/D3/D6 design decisions, and the MVP6.2 Learning + MVP6.7 Impact + governance precedents by reference.
- **FE6-085 — types/client/query/mocks + route/IA (exact frozen contract):**
  - `types.ts`: added the full MVP6.8 copilot type block matching the frozen OpenAPI EXACTLY — `CopilotSuggestionKind/State/DecisionCommand/DismissReasonCode/RoutingTargetKind/ConfidenceLabel/RiskLabel/SourceArtifactType`, the 14-flag `CopilotMutationGuard` (all `false` literal types incl. `copilot_executed_action`/`real_model_invoked`), `CopilotEvidenceRef`, `CopilotSourceArtifactRef`, `CopilotGovernanceChangeRequestDraftPrefill` (target_kind reuses the REAL `ChangeRequestTargetKind` = `CLASS`/`PROPERTY`/`RELATION`), `CopilotRoutingTarget` (`executes_nothing: true`), `CopilotSuggestion`, `CopilotSuggestionKindCount`, `CopilotSummaryResponse`, list/detail responses, `CopilotSuggestionDecisionRequest/Response`, `CopilotDecisionAuditNote`, `CopilotSuggestionSnapshot`. `CopilotDismissReasonCode` aliases the MVP6.2 `SuggestionDismissReasonCode` (no rename).
  - `client.ts`: `CopilotDecisionError` (code/status/state) + deterministic process-local suggestion store + reset-by-clone; 4 methods (`getCopilotSummary`, `listCopilotSuggestions` w/ kind/state/risk filters, `getCopilotSuggestion`, `createCopilotSuggestionDecision`). ACCEPT returns the suggestion's routing target and mutates ONLY the state + audit note; DISMISS requires a reason (422/`DISMISS_REASON_REQUIRED`, OTHER→`DECISION_NOTE_REQUIRED`); non-SUGGESTED → `409 COPILOT_SUGGESTION_DECISION_CONFLICT`; every response carries the all-false 14-flag guard.
  - `queries.ts`: `copilotKeys` + `useCopilotSummary`, `useCopilotSuggestions`, `useCopilotSuggestion`, `useDecideCopilotSuggestion`.
  - `mvp6CopilotFixtures.ts`: deterministic, source-grounded suggestions across all 4 kinds and every state (SUGGESTED×3 + ACCEPTED + DISMISSED + SUPERSEDED). Governance draft pre-fill uses the corrected real literal `CLASS` (NOT `ONTOLOGY_CLASS`).
  - IA: `Copilot` added as the **first** item of the `ANALYZE` LNB group (ADR 0010 / D1), route `/projects/:p/copilot` (+ `/copilot/suggestions/:suggestionId`), active-state resolver extended, breadcrumb `프로젝트명 > Copilot`. Single active LNB item preserved.
- **FE6-086/087 — `CopilotPage.tsx` (Section + Card, KO titles, D6 badges):** persistent advisory banner ("코파일럿은 제안만 합니다. 아무것도 실행하지 않습니다.") + 4 boundary chips (`NO_AUTO_APPLY/PUBLISH/APPROVE/REAL_LLM`); a **live all-false 14-flag guard proof line read FROM the response** (with `copilot_executed_action`/`real_model_invoked` visually emphasized; any true flag → guard-violation state that disables all decisions); Summary sub-view (open-SUGGESTED headline, by-kind/by-state/high-risk counts, `DETERMINISTIC_MOCK` marker, grounding scope, advisory notes); Suggestions queue (state/kind→target-flow/confidence/risk D6 badges + non-empty grounding chip) → contextual detail (why / expected next step / routing-target-as-destination "실행 아님 · 게이트 미통과" / full grounding); ACCEPT modal that states it **records intent + routes into the existing gate** (never executes) then transitions to `ACCEPTED` read-only + routing CTA (navigation link, no execute button); DISMISS modal requiring one reason code; Decision History timeline with audit note + routing target + per-note all-false guard proof. All loading/empty/error/permission/non-SUGGESTED-conflict states present.
- **FE6-088:** `mvp6CopilotMock.test.ts` (9 tests) + `smoke:mvp6:copilot:mock` (Playwright route/render) + `smoke:mvp6:copilot:actual` (backend API) + package.json scripts.

## 변경 파일
- `apps/frontend/src/shared/api/types.ts` (add copilot types)
- `apps/frontend/src/shared/api/client.ts` (error + store + 4 methods)
- `apps/frontend/src/shared/api/queries.ts` (copilot hooks)
- `apps/frontend/src/shared/mocks/mvp6CopilotFixtures.ts` (NEW)
- `apps/frontend/src/pages/CopilotPage.tsx` (NEW)
- `apps/frontend/src/app/router.tsx` (2 routes)
- `apps/frontend/src/shared/layout/navigation.ts` (Copilot LNB item + active-state)
- `apps/frontend/src/shared/api/mvp6CopilotMock.test.ts` (NEW)
- `apps/frontend/scripts/mvp6-copilot-mock-route-smoke.mjs` (NEW)
- `apps/frontend/scripts/mvp6-copilot-actual-api-smoke.mjs` (NEW)
- `apps/frontend/package.json` (2 smoke scripts)

## 실행/검증 (EXACT)
- `npm run test` → **Test Files 13 passed (13), Tests 75 passed (75)** (incl. 9 new MVP6.8 copilot tests: deterministic/grounded summary + list, filter by kind/state/risk, detail-by-id, 404, ACCEPT-returns-routing/executes-nothing, non-SUGGESTED 409, DISMISS-reason-required + no-routing).
- `npm run build` → tsc (strict, both tsconfigs) + vite → **✓ built in ~2.3s**, no type errors.
- `npm run smoke:mvp6:copilot:mock` → `{"status":"PASS","routeCount":4,"screenshotCount":5}` (summary+banner+guard proof+single-active-LNB; queue→detail with routing-target-not-execute label + grounding + NO execute/apply/publish/approve button; ACCEPT-routes modal → ACCEPTED read-only; Decision History audit note + all-false guard).
- `npm run smoke:mvp6:copilot:actual` → **NOT RUN**. Reason: the backend endpoint requires a reachable PostgreSQL + the QA seed harness (uvicorn boot alone returns `500` on DB connect to port 5432; script reports `NOT RUN`, not FAIL). This is the standing Docker/Postgres compose environment exception (P1) documented across prior waves; the mock path fully exercises the frozen contract and the actual script is ready for QA's seeded runtime.
- Responsive 0-overflow re-check on `/projects/:p/copilot` (Summary + Suggestions split layout) at **1440 / 1366 / 1280 / 768 → 0 overflow at all four** (scrollW==clientW; screenshots in scratchpad). Mock-smoke screenshots in `/tmp/ontology-mvp6-copilot-mock-smoke/`.
- `git diff --check` → **CLEAN**. No leftover listeners on 5173/8000.
- 실행하지 못한 검증: `npm run lint` — `eslint` binary is not installed in this environment (`sh: eslint: command not found`); lint is not in the Wave48 required validation set and the enforced type gate (tsc strict via `npm run build`) passed clean.

## API/Enum/DTO 변경
- 변경 여부: **없음** (no API/DTO/enum change). All copilot types are additive and match the frozen `openapi-mvp6-8-draft.json` exactly; reused shapes referenced without rename.
- 상세: FE renders the PM6-030-corrected governance pre-fill literal `CLASS` (not the Wave47 example bug `ONTOLOGY_CLASS`). Confirmed the exported backend OpenAPI now uses `CLASS` (0 `ONTOLOGY_CLASS` occurrences) — no FE/BE drift.
- 영향받는 역할: none (contract-clean).

## Blocker
- 없음. FE is contract-clean against the frozen OpenAPI. Actual-API verification is deferred to QA's seeded runtime (env exception only).

## 남은 TODO
- QA: run `smoke:mvp6:copilot:actual` against the seeded backend (Postgres + seed) to close the actual-flow gate; DATA-level no-mutation proof (before==after incl. ACCEPT) is a backend/QA responsibility.

## 다른 역할에 전달할 내용
- PM: G1–G3 implemented as specified; H1 confirmed as `코파일럿`; kind/routing/reason Korean glosses used per §4 proposals.
- Backend: FE/BE contract-clean; FE consumes `CopilotMutationGuard` (14 flags), `routing_target.executes_nothing`, per-suggestion `source_artifacts` (non-empty), and the `409`/`422`/`404` error codes exactly. Actual smoke ready once Postgres+seed reachable.
- Frontend: —
- QA: mock smoke = `smoke:mvp6:copilot:mock`; actual = `smoke:mvp6:copilot:actual` (currently NOT RUN — env). The UI reads the guard live and has NO execute/apply/publish/approve affordance anywhere (asserted in the mock smoke).

## 총괄에게 요청하는 결정
- Accept FE Wave48 as PASS for the mock path; treat actual-API copilot smoke as the standing Postgres/seed environment exception (P1), to be closed by QA against the seeded runtime — consistent with every prior wave's actual-smoke handling.

## 현재 판정
- **PASS (mock path)**; actual-API smoke NOT RUN (environment: no reachable Postgres/seed). Build/tests/mock-smoke/responsive all pass; no regression; no API/Enum/DTO change; no execute affordance.
