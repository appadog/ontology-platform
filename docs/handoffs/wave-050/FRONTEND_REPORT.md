# Frontend Report - Wave 50 (MVP6.9 Connectors THIN IMPLEMENTATION)

## 담당 범위
- backlog ID: `FE6-090` (LNB + route/IA + types/client/mocks), `FE6-091` (catalog + masked config form), `FE6-092` (dry-run preview result + states + "nothing imported" banner + live guard proof), `FE6-093` (mock + actual smoke).
- 작업 경로: `apps/frontend/` only. Built MOCK-FIRST against the frozen OpenAPI (`docs/api/openapi-mvp6-9-draft.json`, 3 paths / 17 schemas), then wired + ran the actual smoke against the parallel Backend on SQLite. Additive; no MVP1–MVP6.8 route/enum/smoke touched.

## 완료한 작업 (per FE6-090..093)
- **FE6-090 — IA / types / client / query / mocks.** Added the `Connectors` LNB item in the **BUILD** group **immediately after `Sources`** (single active LNB preserved; `Cable` icon). Added `connectors` `NavSection` + active-state rule (`/connectors`). Routes `/projects/:projectId/connectors` (catalog) and `/projects/:projectId/connectors/:connectorKind` (contextual detail, frozen enum, ADR 0010 non-ID-bound). Types match the OpenAPI EXACTLY (5 enums, `ConnectorMutationGuard` 9 all-`false`-literal flags, `ConnectorConfigField`, catalog/config-schema/preview DTOs, `ConnectorPreviewNotice{code,message}`); `mapped_ontology_class_ref` reuses the MVP6.8 `CopilotOntologyElementRef` shape `{element_kind, element_id, label}` BY REFERENCE (no rename — the file's other `OntologyElementRef` has a different governance-target shape). Client methods `getConnectorCatalog` / `getConnectorConfigSchema` / `runConnectorImportPreview` + `ConnectorError` (403/404); deterministic mock fixtures + preview builder (G5 per-kind: FILE=6→COMPATIBLE, REST=5 with 1 unmapped→WARNING, KB=4→COMPATIBLE; `source_locator = fixture:<file|rest|kb>/<resource>#row=<n>`). Query hooks `useConnectorCatalog` / `useConnectorConfigSchema` / `useRunConnectorImportPreview`.
- **FE6-091 — catalog + masked config form.** Catalog = 3 `ConnectorKind` cards (kind badge + description + config-field summary + "SECRET 필드 있음" marker), `DETERMINISTIC_MOCK` marker, primary card action **`설정 및 미리보기`** → detail. **No add / register / connect affordance.** Detail renders the masked config schema as a form: control per `ConnectorConfigFieldKind` (STRING/URL/INTEGER text, ENUM select from `enum_values`, BOOLEAN toggle, **SECRET = disabled `type=password` non-secret placeholder — never required, never entered**). Optional `item_cap` control (≤50). Only actionable button = **`미리보기 실행`**.
- **FE6-092 — preview result + states + banner + guard proof.** Persistent non-dismissible preview-only banner + 4 boundary chips (`PREVIEW_ONLY`/`NO_EXTERNAL_CALL`/`NO_SECRET_STORED`/`NOTHING_IMPORTED`). Live all-false **9-flag** `ConnectorMutationGuard` proof block read FROM the response (guard-violation state disables preview if any flag were ever true). Preview result: `ConnectorPreviewStatus` + `ConnectorPreviewCompatibility` + `CANDIDATE` **D6 badges**, `preview_only:true` + `raw_secret_present:false` proof markers, would-be summary counts (labelled "would-be"), capped `sample_items[]` rows (`preview_ref` shown as opaque "생성된 후보 ID 아님", `CANDIDATE` badge, `mapped_ontology_class_ref` chip → ontology link / explicit "미매핑" for null, per-item compatibility, `source_locator`, note), truncation notice, `warnings[]`/`blocked_reasons[]` (`ConnectorPreviewNotice` code badge + message), verbatim `routing_note` + KO gloss. First-class states: loading (skeletons) / empty (0 items) / error (retry) / permission-limited (403) / not-found (404) / INCOMPATIBLE-BLOCKED (zero fabricated items + edit-and-re-run) / WARNING (non-blocking) / truncated. **No connect/import/sync/apply/execute/confirm affordance anywhere.**
- **FE6-093 — smoke.** Added `npm run smoke:mvp6:connectors:mock` and `:actual`. Extended the D6 `StatusBadge` table with `BLOCKED`/`COMPATIBLE`/`INCOMPATIBLE`/`CANDIDATE` (same rule: tone + icon + KO gloss). Added `mvp6ConnectorsMock.test.ts` (10 tests).

## 변경 파일 (frontend, additive)
- `src/shared/api/types.ts` — MVP6.9 Connectors block (enums + DTOs; matches OpenAPI exactly).
- `src/shared/mocks/mvp6ConnectorsFixtures.ts` — NEW: catalog, per-kind masked config schemas, deterministic secret-independent preview builder, all-false guard.
- `src/shared/api/client.ts` — 3 client methods + `ConnectorError`; mock branch + real-API branch.
- `src/shared/api/queries.ts` — `connectorKeys` + 3 hooks.
- `src/shared/layout/navigation.ts` — `Connectors` item (BUILD, after Sources) + `connectors` section + active-state.
- `src/app/router.tsx` — 2 routes + page import.
- `src/pages/ConnectorsPage.tsx` — NEW: the Connectors surface.
- `src/shared/ui/platform/StatusBadge.tsx` — 4 new D6 tokens.
- `src/shared/api/mvp6ConnectorsMock.test.ts` — NEW: mock contract test (10).
- `scripts/mvp6-connectors-mock-route-smoke.mjs`, `scripts/mvp6-connectors-actual-api-smoke.mjs` — NEW.
- `package.json` — 2 smoke scripts.

## 실행/검증 (EXACT outputs)
- `npm run test` → **Test Files 14 passed (14) · Tests 85 passed (85)** (incl. 10 new `MVP6.9 Connectors mock contract`).
- `npm run build` → `tsc --noEmit` (app + node) clean; `vite build` → **✓ built in 2.15s** (no type errors).
- `npm run smoke:mvp6:connectors:mock` → **`{"status":"PASS","routeCount":3,"screenshotCount":3}`** (catalog banner + 9-flag guard proof + single active LNB + 3 cards; masked config + `미리보기 실행` + no import/sync/connect/apply/execute button; dry-run preview result + would-be counts + `preview_ref` not-a-candidate-id + routing note).
- `npm run smoke:mvp6:connectors:actual` → **`{"status":"PASS","checks":4}`** — RAN against the parallel Backend booted on in-memory SQLite (`seed_mvp3`, port 8000). Catalog(3 kinds)+all-false guard, masked config-schema (`raw_secret_present:false`), byte-stable (excl. `generated_at`) preview (`preview_only:true`, `target_layer:CANDIDATE`, constant `routing_note`, guard all-false), unknown-kind 404. Note: read role is `VIEWER` (`app.core.enums.Role`), not `PROJECT_MEMBER` — smoke default set accordingly.
- Responsive re-check (wave35 method, scratchpad) at 1440/1366/1280/768 on `connectors-catalog` + `connectors-detail` (incl. preview rendered): **0 horizontal overflow on all routes/resolutions** (overflowX=0 for all 8).
- `git diff --check` → **CLEAN**.
- 실행하지 못한 검증: none (both smokes ran).

## API/Enum/DTO 변경
- 변경 여부: **없음**. FE consumed the frozen contract verbatim; introduced NO new API/enum/DTO and renamed NO reused shape.
- 상세: types mirror `openapi-mvp6-9-draft.json` (5 enums, 9-flag guard, `ConnectorPreviewNotice{code,message}`). `mapped_ontology_class_ref` reuses the existing `{element_kind, element_id, label}` shape by reference.
- 영향받는 역할: 없음 (consume-only).

## Blocker
- 없음.

## 남은 TODO
- QA (`INT6-077`/`INT6-079`): re-run FE mock + actual with the QA seed harness; confirm no regression across MVP1–MVP6.8 smokes.
- P1 (later): deep-link/persist preview only if Backend ever moves off G1 compute-on-read (currently `preview_id` always null — FE treats preview as ephemeral view state).

## 다른 역할에 전달할 내용
- PM: G12 copy implemented as frozen (H1 `커넥터`, LNB `Connectors`, button `미리보기 실행`, KO glosses). No copy deviations.
- Backend: **contract alignment CONFIRMED** against the live SQLite server — response field names/enums/9-flag guard/`{element_kind,element_id,label}` ref/`fixture:rest/items#row=n` locator/`preview_id:null`/`preview_only:true`/`routing_note` all match FE types byte-for-byte; REST fixture semantics (5 records, 1 unmapped → WARNING) match. One env note: the read role is `VIEWER` (not `PROJECT_MEMBER`).
- Frontend: single-active-LNB rule extended cleanly; D6 table extended with 4 connector tokens.
- QA: actual smoke boots via `seed_mvp3` on `sqlite+pysqlite:///:memory:`, port 8000, `actor_role=VIEWER`.

## 총괄에게 요청하는 결정
- None required. Recommend closeout: FE surface complete, mock+actual green, contract aligned with Backend, no regression, no connect/import/execute affordance, single active LNB with the new `Connectors` BUILD item.

## 현재 판정
- **PASS** — FE6-090..093 complete; test/build/mock+actual smoke all green; 0 responsive overflow; contract matches Backend; additive-only, no API/enum/DTO change, no renames, candidate/published separation intact.
