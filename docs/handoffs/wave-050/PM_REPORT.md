# PM Report - Wave 50 (MVP6.9 Connectors THIN IMPLEMENTATION — G1/G5/G6/G7 freeze + G12 copy + scope guard)

## 담당 범위
- backlog ID: `PM6-032` (Wave50 gate freeze + implementation scope guard); records impl IDs `BE6-070`~`BE6-073`, `FE6-090`~`FE6-093`, `INT6-076`~`INT6-079`.
- 작업 경로: `docs/pm/MVP6_9_CONNECTORS_BRIEF.md` (added §12 Wave50 Implementation Freeze), `docs/api/openapi-mvp6-9-draft.json` (G6 refinement), `docs/api/MVP6_9_CONNECTORS_API_CONTRACT_DRAFT.md`, `docs/backlog/MVP6_DRAFT_BACKLOG.md`, `docs/backlog/INT6_9_CONNECTORS_ACCEPTANCE.md` (Wave50 gates marked frozen), this report. No `apps/`/`infra/`.

## 완료한 작업
- Read AGENTS-loop context: Wave50 `NEXT_ORDERS.md`, `CURRENT_STATE.md`, and all Wave49 artifacts (brief, ADR 0016, contract draft + `openapi-mvp6-9-draft.json`, FE UX requirements, INT6.9 acceptance C1-C8/R1-R8/G1-G12) + REPORT_TEMPLATE + wave-048 PM report format.
- Grounded rulings against the **source-of-truth OpenAPI** (not just the prose): confirmed `generated_at` is already present + required and `source_locator` is already a nullable string — so the Wave49 FE §8 / checklist "missing `generated_at`" notes were STALE.
- Froze **G1/G5/G6/G7** as one precise, deterministic, implementable rule each in brief §12, and **finalized G12** (H1 + KO glosses) on top of the ratified commander IA ruling.
- **One contract refinement (G6 only):** changed `warnings[]`/`blocked_reasons[]` from `array<string>` to `ConnectorPreviewNotice{code,message}` in the OpenAPI (added the schema; 16→17 schemas) + updated the example + the contract MD. All other 16 schemas / 3 endpoints / 5 enums / 9-flag guard are exactly the Wave49 frozen contract.
- Confirmed scope UNCHANGED (ADR 0016): read-only catalog + dry-run preview, creates nothing, no external write/network/credential execution, masked secrets only (`raw_secret_present:false`), all-false 9-flag `ConnectorMutationGuard` on every response, 3 endpoints, 3 kinds.
- Recorded Wave50 implementation IDs in the backlog + updated brief/checklist status headers.

## 변경 파일
- `docs/pm/MVP6_9_CONNECTORS_BRIEF.md` — added §12 "Wave50 Implementation Freeze — G1/G5/G6/G7/G12 (PM6-032)"; status header → Wave50; added Wave50 impl IDs.
- `docs/api/openapi-mvp6-9-draft.json` — added `ConnectorPreviewNotice` schema; `warnings[]`/`blocked_reasons[]` now `$ref` it; example updated. Parses (3.1.0, `0.6.9-draft`, 3 paths / 17 schemas), disjoint-additive.
- `docs/api/MVP6_9_CONNECTORS_API_CONTRACT_DRAFT.md` — 16→17 schemas; added `ConnectorPreviewNotice` DTO; noted `generated_at`/`preview_id` excluded from determinism; rewrote "Open questions → Wave50 gates" as FROZEN.
- `docs/backlog/MVP6_DRAFT_BACKLOG.md` — added "Wave50 MVP6.9 Connectors THIN IMPLEMENTATION — Gate Freeze (PM6-032)" with G-freeze summary + rows PM6-032, BE6-070~073, FE6-090~093, INT6-076~079.
- `docs/backlog/INT6_9_CONNECTORS_ACCEPTANCE.md` — Wave50 Gates section marked FROZEN with the exact rules; noted C2 "16 schemas" superseded by 17.
- `docs/handoffs/wave-050/PM_REPORT.md` — this report.

## 실행/검증
- 실행한 명령: `python3 -c json.load` on the OpenAPI → `PARSE_OK 0.6.9-draft 3 paths 17 schemas`; disjointness scan vs all other `openapi-mvp*.json` → no path overlap; `git diff --check` → clean; `git status --porcelain | grep apps/\|infra/` → no leak.
- 결과: PASS. No `apps/`/`infra/` change; no runtime code written; non-secret placeholders only.
- 실행하지 못한 검증: none required for PM scope (runtime R1-R8 belong to BE/FE/QA this wave).

## API/Enum/DTO 변경
- 변경 여부: 있음 (한 건, G6).
- 상세: added DTO `ConnectorPreviewNotice {code:string (stable UPPER_SNAKE), message:string}`; `ConnectorImportPreviewResponse.warnings[]` and `.blocked_reasons[]` element type changed `string` → `ConnectorPreviewNotice` (schema count 16→17). No endpoint/enum/guard change. `generated_at` (already required) and `preview_id` (frozen `null`) are unchanged in shape.
- 영향받는 역할: Backend (implement/export the `{code,message}` notice with the frozen code vocabulary; align exported OpenAPI to 17 schemas), Frontend (render notice `code` as D6 badge + `message`), QA (assert notice shape + stable codes; assert byte-stability EXCLUDING `generated_at`).

## Blocker
- 없음. Backend and Frontend are unblocked.

## 남은 TODO
- Backend: 3 endpoints in new `apps/backend/app/modules/connectors/` per §12 + frozen OpenAPI; process-local + reset hook; G5 fixtures; G6 notices; `preview_id:null`; all-false guard; no-secret; DATA-LEVEL creates-nothing.
- Frontend: `Connectors` LNB (BUILD, after Sources) + catalog + contextual detail; masked config form; dry-run preview result + states + "nothing imported" banner + live guard proof line; mock (+ actual) smoke.
- QA: R1-R8 incl. DATA-LEVEL no-mutation proof + all-false guard + no-raw-secret + byte-stability excluding `generated_at`.

## 다른 역할에 전달할 내용 (EXACT frozen rules)
- **G1 (`preview_id`):** COMPUTE-ON-READ / EPHEMERAL — `preview_id` is ALWAYS `null`; persist nothing; NO `GET .../import-preview/{preview_id}` and NO list endpoint (3 endpoints total); re-run = byte-identical (modulo `generated_at`).
- **G5 (fixtures + `source_locator`):** fixed byte-stable per-kind fixtures `FILE_SOURCE`=6 (→COMPATIBLE) / `REST_SOURCE`=5 (≥1 unmapped →WARNING) / `KNOWLEDGE_BASE_SOURCE`=4 (→COMPATIBLE), `source_record_count`=fixture size (no external read); `source_locator` = opaque deterministic STRING `fixture:<file|rest|kb>/<resource>#row=<n>` derived from NON-SECRET config only (FE renders it opaque; do not parse).
- **G6 (`warnings[]`/`blocked_reasons[]`):** element = `ConnectorPreviewNotice {code, message}`; `code` ∈ frozen vocab — WARNING `UNMAPPED_FIELDS`/`MISSING_EVIDENCE_LOCATOR`/`PARTIAL_RECORD_MAPPING`, BLOCKED `MISSING_REQUIRED_FIELD`/`INVALID_CONFIG_VALUE`/`INCOMPATIBLE_SOURCE_SHAPE`; `blocked_reasons[]` non-empty ONLY when `status=BLOCKED`; OpenAPI now 17 schemas.
- **G7 (`generated_at`):** KEEP (already present + required); set at response time; the ONLY field allowed to vary between two identical previews; MUST be EXCLUDED (with `preview_id:null`) from the byte-stable determinism assertion.
- **G12 (copy/IA):** LNB item `Connectors` in **BUILD group immediately after `Sources`**; catalog `/projects/:p/connectors`, contextual detail `/projects/:p/connectors/:connectorKind` (frozen enum, not ID-bound, ADR 0010); **H1 = `커넥터`** (KO primary), LNB label stays EN `Connectors`; KO glosses finalized in brief §12; primary preview button = **`미리보기 실행`** (never 가져오기/동기화/연결/실행).
- **Gates BE/FE/QA must hit:** R1 catalog (3 kinds, secret masked, `raw_secret_present:false`) + config-schema ordered fields; R2 byte-stable (excl. `generated_at`) + secret-independent preview, counts exact, `sample_items[]`≤`item_cap`(≤50) + `truncated` + exact `total_item_count`; R3 DATA-LEVEL creates-nothing (candidate/source/extraction/published before==after) + no network; R4 all-false 9-flag guard + `preview_only:true` + constant `routing_note` on every response; R5 no raw secret anywhere + `target_layer:CANDIDATE`/`preview_ref` opaque; R6 BLOCKED/INCOMPATIBLE non-crash 200 with `ConnectorPreviewNotice[]` + zero fabricated items, malformed body → `400 INVALID_CONNECTOR_CONFIG`, authz `403`/`404`; R7 FE flow (catalog→masked config→preview→would-be mapping) mock+actual, no connect/import/sync/apply/execute affordance, live guard proof line, D6 badges, all states; R8 MVP1–MVP6.8 regression + additive-only + no renames + candidate/published separation intact.

## 총괄에게 요청하는 결정
- Confirm the single contract refinement **G6**: `warnings[]`/`blocked_reasons[]` element `string` → `ConnectorPreviewNotice{code,message}` (16→17 schemas). Recommended: accept — it gives FE stable i18n/D6 codes and QA a stable assertion target, frozen before Backend builds so there is zero FE/BE drift. Everything else is unchanged from the Wave49 contract.

## 현재 판정
- PASS (PM freeze complete; G1/G5/G6/G7 frozen deterministically, G12 copy finalized; scope unchanged; contract refined minimally for G6 only + parses/disjoint; Backend and Frontend unblocked; QA gates R1-R8 restated).
