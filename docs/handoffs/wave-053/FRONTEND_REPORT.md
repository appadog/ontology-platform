# Frontend Report - Wave 53

## 담당 범위
- backlog ID: `FE6-099` — MVP6.11 Ontology Packs UX/API 요구사항 (contract-first
  planning only; route/component/type/mock/smoke 코드 없음).
- 작업 경로:
  - `docs/pm/MVP6_11_FRONTEND_UX_REQUIREMENTS.md` (생성)
  - `docs/handoffs/wave-053/FRONTEND_REPORT.md` (생성)

## 완료한 작업
- MVP6.11 Ontology Packs P0(read-only pack catalog + deterministic dry-run
  apply-preview; no apply/install; no published-write; no draft-mutation; no
  external fetch; all-false 8-flag guard)의 프론트엔드 UX/API 요구사항을
  `docs/pm/MVP6_11_FRONTEND_UX_REQUIREMENTS.md`에 문서화했다.
- **Placement/IA (ADR 0010, G5)**: `BUILD` 그룹 LNB 항목 **`Ontology Packs`**를
  `Ontology` 바로 뒤에 두는 project-zone 단일 destination으로 제안·정당화. pack
  detail/apply-preview는 catalog에서 진입하는 contextual sub-view
  (`/projects/:p/ontology-packs`, `/projects/:p/ontology-packs/:packId`) — 신규
  ID-bound global LNB page 없음(3개 고정 pack = bounded enumerable set). tab-in-modeler
  와 Analyze-group 대안은 boundary 명확성/의미 불일치로 기각. PM/총괄 ratify 대상.
- **Catalog UX**: 정확히 3개 카드(`name`/`domain` 배지/`version` 칩/`description` +
  `class_count`/`property_count`/`relation_count`/`element_count` count row +
  DETERMINISTIC_MOCK 마커). 유일한 액션은 "상세 보기". install/apply/추가/"설치"/"적용"
  affordance 전무.
- **Pack detail**: 메타 + 번들 요소를 `PackElementKind`(CLASS/PROPERTY/RELATION)로
  그룹핑(MVP1 ontology element + `OntologyElementRef` `$ref` 재사용). per-element
  apply 컨트롤 없음.
- **Dry-run apply-preview 결과 레이아웃**: result header(`PackApplyPreviewStatus` +
  `PackApplyCompatibility` D6 배지, `preview_only:true`, `generated_at`) → summary
  rollup(`would_add_count`/`would_modify_count`/`conflict_count`/`duplicate_count`/
  `total_element_count`, "추가/수정 예정" 라벨) → capped `items[]`(각 항목
  `preview_ref` opaque·`element_kind`·`disposition` NEW/CONFLICT/DUPLICATE D6 배지·
  `target_layer` DRAFT·`mapped_ontology_ref`·`pack_element_label`/
  `existing_element_label`·`note`) → truncation notice(`item_cap`/`total_item_count`,
  counts는 exact) → `warnings[]`/`blocked_reasons[]`(`PackPreviewNotice{code,message}`
  D6 배지) → `routing_note` verbatim → live all-false 8-flag guard proof line.
  confirm-apply/install/add CTA 전무.
- **PREVIEW-ONLY boundary banner**: 상시 비-dismiss 배너(헤드라인+지원 문구+경계 chips
  PREVIEW_ONLY/NOTHING_INSTALLED/NOTHING_APPLIED/NO_DRAFT_WRITE/NO_PUBLISHED_WRITE)
  + 응답에서 읽는(하드코딩 아님) all-false 8-flag `OntologyPackMutationGuard` proof
  block. `ontology_draft_mutated`+`published_graph_mutated`를 headline assertion으로
  명시(MVP6.6 apply guard와 대비: MVP6.11은 어떤 flag도 true로 바꾸지 않음).
- **States 일급**: loading(catalog/detail/preview)/empty(catalog/bundled/preview
  sample)/null-mapped-ref/error(transport vs 200 결과 상태 구분)/permission-limited
  (project member 누구나 preview 가능, `403`/`404` 매핑)/INCOMPATIBLE-BLOCKED(비-crash,
  fabrication 0, recovery)/WARNING(non-blocking)/truncated/guard-violation(방어적).
- **Design language**: Section+Card, KO H1(`온톨로지 팩` 제안), D6 배지 표(status/
  disposition/compat/element-kind/notice-code/domain chip 토큰+KO gloss; PM confirm).
- **DTO gap 분석(§8)**: Backend draft 부재로 **reconciliation PENDING**. PM brief
  frozen 필드 기준 FE need-list로 G1~G12 기록(§11 Wave54 gate와 매핑).

## 변경 파일
- 생성: `docs/pm/MVP6_11_FRONTEND_UX_REQUIREMENTS.md`,
  `docs/handoffs/wave-053/FRONTEND_REPORT.md`
- 수정: 없음. `apps/`/`infra/` 무변경.

## 실행/검증
- `git diff --check` → PASS (CHECK-CLEAN, whitespace/충돌 경고 없음).
- runtime leakage 스캔 → `apps/`/`infra/` 무변경(NO-RUNTIME-LEAK). route/component/
  type/mock/smoke 코드 생성 없음.
- 문서 범위이므로 build/test/smoke/OpenAPI export는 수행하지 않음.

## API/Enum/DTO 변경 여부
- 없음. 문서(요구사항)만 작성. 신규 enum/DTO 정의·rename·runtime/OpenAPI 변경 없음.
  PM-frozen enum/DTO 이름(`PackElementKind`/`PackApplyPreviewStatus`/
  `PackPreviewItemDisposition`/`PackApplyCompatibility`/`PackApplyTargetLayer`/
  `OntologyPackMutationGuard`(8)/`PackPreviewNotice{code,message}`)을 verbatim 참조만.

## Blocker
- **Backend contract draft 부재(비차단, 문서 의존성)**:
  `docs/api/MVP6_11_ONTOLOGY_PACKS_API_CONTRACT_DRAFT.md` +
  `docs/api/openapi-mvp6-11-draft.json`이 본 문서 작성 시점에 없었다. planning
  deliverable은 PM brief 기반으로 완료했으나, §8 DTO gap은 **reconciliation PENDING**
  — Backend draft가 랜딩하면 field-by-field 재대조 후 §8 갱신 필요(Wave54 착수 전
  선행 조건).

## 남은 TODO (DTO gaps)
- G1 `preview_id` persist-vs-compute(ephemeral 권고) — Backend 확정.
- G3 apply-preview 요청 바디(path params + optional `item_cap`, secret/config payload
  없음 예상) — Backend 확정.
- G4 element-identity match rule(NEW/CONFLICT/DUPLICATE) + fixture matrix — Backend 확정.
- G5 `mapped_ontology_ref` shape + nullability — Backend 확정.
- G6 `PackPreviewNotice` code vocabulary 최종 — Backend 확정.
- G7 `generated_at` 존재 여부 — Backend 확정(비차단).
- G9 invalid/empty target: `404`(unknown pack/missing project) vs `200` BLOCKED/
  INCOMPATIBLE(nothing-applyable/no-DRAFT) transport 분리 — Backend 확정.
- G8/G10/G11(guard 8-flag const:false/required; catalog counts on list; counts-exact-
  under-truncation) — frozen, Backend draft에서 confirm.
- G12 KO gloss + H1(`온톨로지 팩` vs `Ontology Packs`) + LNB group/slot(Build,
  Ontology 뒤; own-item vs tab) — **PM/총괄 결정**.

## 다른 역할에 전달할 내용
- Backend: §6 필드/§7 enum/§8 gap을 draft에 반영·확정(G1/G3/G4/G5/G6/G7/G9). 특히
  apply-preview 요청 바디에 secret/config payload 없음, `mapped_ontology_ref`
  nullability, `PackPreviewNotice.code` 어휘, invalid vs empty transport 분리를 명시.
  모든 응답 all-false 8-flag `OntologyPackMutationGuard`(const:false/required),
  summary counts exact + `items[]` cap/`truncated`/`total_item_count`.
- QA: FE는 NO install/apply/execute/add CTA, `target_layer=DRAFT` only, preview
  items = would-be(생성 id 아님), all-false 8-flag guard live proof, BLOCKED
  fabrication 0, counts exact-under-truncation을 acceptance criterion으로 제안.
  Backend draft 랜딩 후 §8 재대조가 FE-side 선행 게이트.
- PM/총괄: G12(H1 wording, LNB Build-slot/own-item-vs-tab ratify), D6 KO gloss 확정.

## 총괄에게 요청하는 결정
- FE UX/API 요구사항(§1 Build/`Ontology Packs` LNB placement, §2 catalog+detail+
  apply-preview layout, §2.1 PREVIEW-ONLY banner + all-false 8-flag proof, §3 states,
  §4 D6 badges, §8 gap)을 planning PASS로 승인해 달라.
- G5 IA 제안(Build 그룹, `Ontology` 바로 뒤, 신규 LNB 항목 `Ontology Packs`,
  detail/preview는 contextual sub-view)과 G12(H1 `온톨로지 팩`, D6 KO gloss)를
  ratify해 달라.
- MVP6.11 P0를 read-only catalog + dry-run apply-preview까지로 유지(install/apply/
  add CTA 전무, `ontology_draft_mutated`+`published_graph_mutated` 항상 false).

## 현재 판정
- PASS (planning). 비차단 의존성: Backend draft 부재로 §8 DTO gap은 PENDING —
  draft 랜딩 시 재대조 필요.
