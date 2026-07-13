# Backend Report - Wave 53

## 담당 범위
- backlog ID: `BE6-080` (Ontology Packs contract draft), `BE6-081` (OpenAPI planning artifact)
- 작업 경로:
  - `docs/api/MVP6_11_ONTOLOGY_PACKS_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp6-11-draft.json`
  - `docs/handoffs/wave-053/BACKEND_REPORT.md`

## 완료한 작업
- MVP6.11 Ontology Packs P0(read-only pack catalog + deterministic dry-run
  apply-preview)를 **contract-first planning only**로 draft했다. runtime/model/
  migration/test/seed 코드 없음(Wave54 대기). `apps/`·`infra/` 미접촉.
- **3 additive endpoint**을 확정했다:
  - `GET /api/v1/ontology-packs` — GLOBAL 카탈로그(3개 mock pack) -> `OntologyPackCatalogListResponse`
  - `GET /api/v1/ontology-packs/{pack_id}` — pack detail(메타 + bundled elements) -> `OntologyPackDetailResponse`
  - `POST /api/v1/projects/{project_id}/ontology-packs/{pack_id}/apply-preview` — project-scoped dry-run(body optional) -> `PackApplyPreviewResponse`
- **PM이 고정한 enum 5종을 verbatim**으로 넣었다: `PackElementKind`(CLASS/PROPERTY/
  RELATION), `PackApplyPreviewStatus`(READY/BLOCKED), `PackPreviewItemDisposition`
  (NEW/CONFLICT/DUPLICATE), `PackApplyCompatibility`(COMPATIBLE/WARNING/
  INCOMPATIBLE), `PackApplyTargetLayer`(DRAFT `const`).
- **catalog 모델**: 3개 deterministic in-repo mock pack(pack-insurance-core /
  pack-manufacturing-equipment / pack-legal-compliance), 각 pack = ontology element
  번들 + 메타(pack_id/name/domain/version/description/`OntologyPackElementCounts`).
  detail은 `PackElementDescriptor[]`(element_key/element_kind/label/description)로
  bundled element를 나열. catalog/detail은 GLOBAL·byte-stable.
- **apply-preview 모델**: pack + project DRAFT -> deterministic would-add/would-modify
  items, per-item `PackPreviewItemDisposition`, `PackApplyCompatibility` rollup,
  exact summary counts(`would_add_count`/`would_modify_count`/`conflict_count`/
  `duplicate_count`/`total_element_count`), bounded(`item_cap`<=50 + `truncated` +
  exact `total_item_count`), `preview_only:true`, constant `routing_note`, opaque
  `preview_ref`(생성 id 아님). `generated_at`/`preview_id`는 byte-stable 단정에서
  제외. **아무것도 생성하지 않음**(DRAFT는 diff용 read-only).
- **all-false 8-flag `OntologyPackMutationGuard`**를 모든 응답(catalog/detail/
  preview)에 필수로 넣었다(전 flag `const:false` + `required`): pack_installed,
  ontology_draft_mutated, ontology_class_created, ontology_property_created,
  ontology_relation_created, candidate_graph_mutated, published_graph_mutated,
  change_request_created.
- **재사용(by reference, no rename)**: `OntologyElementRef`(target_kind 계열) +
  `OntologyElementStatus`를 MVP1/MVP6.5-6.7과 동일 shape/name으로 self-contained
  하게 로컬 정의. `PackPreviewNotice {code, message}`는 MVP6.9 패턴. MVP5 `Role`
  read authz(신규 role literal 없음).
- authz/error: 임의의 project viewer 허용; `403 PERMISSION_DENIED` /
  `404 PROJECT_NOT_FOUND` / `404 ONTOLOGY_PACK_NOT_FOUND`. invalid apply-preview
  target(no DRAFT 등)은 200 + `status=BLOCKED` + `blocked_reasons[]`(crash/fabricate
  없음).
- OpenAPI open question(G1 persist-vs-compute / G3 draft-diff basis + fixture matrix
  / G4 element-identity match rule / G5 LNB placement)을 contract + report에 캡처.

## 변경 파일
- 생성:
  - `docs/api/MVP6_11_ONTOLOGY_PACKS_API_CONTRACT_DRAFT.md`
  - `docs/api/openapi-mvp6-11-draft.json`
  - `docs/handoffs/wave-053/BACKEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `python3 -m json.tool docs/api/openapi-mvp6-11-draft.json > /dev/null && echo PARSE_OK` -> **PARSE_OK**
  - 카운트: version `0.6.11-draft`, **paths 3 / operations 3 / schemas 19**.
  - disjoint-additive: 기존 `docs/api/openapi-mvp*.json`와 path 충돌 0건.
  - `git diff --check` -> PASS(whitespace/충돌 경고 없음).
- 결과: PARSE_OK; 3 path / 3 op / 19 schema; 충돌 0; diff-check PASS.
- schema 목록: PackElementKind, PackApplyPreviewStatus, PackPreviewItemDisposition,
  PackApplyCompatibility, PackApplyTargetLayer, OntologyElementStatus,
  OntologyElementRef, PackPreviewNotice, OntologyPackMutationGuard,
  PackElementDescriptor, OntologyPackElementCounts, OntologyPackCatalogItem,
  OntologyPackCatalogListResponse, OntologyPackDetailResponse,
  PackApplyPreviewRequest, PackApplyPreviewSummary, PackPreviewItem,
  PackApplyPreviewResponse, ApiError.
- 실행하지 못한 검증: planning wave이므로 runtime export/FastAPI OpenAPI compare/
  test는 없음(Wave54 몫).

## API/Enum/DTO 변경
- 변경 여부: 있음 — **planning-only, additive**(runtime/DB/route 변경 없음).
- 상세: 위 3 endpoint + 5 enum + all-false 8-flag guard + catalog/detail/apply-preview
  DTO. MVP1-MVP6.10에 disjoint-additive(기존 path/스키마 재정의·rename 없음).
- 영향받는 역할: Frontend/QA(아래 전달).

## Blocker
- 없음.

## 남은 TODO
- Wave54 runtime(Backend): 3 endpoint 구현 + deterministic process-local pack
  registry/fixture + reset hook; G1(ephemeral 권고 확정), G3(DRAFT-diff basis +
  3-disposition/4-compatibility fixture matrix 확정), G4(element-identity match
  rule 확정); runtime OpenAPI vs draft 0-mismatch compare.
- Frontend(`FE6-099`): UX 요구사항 문서 + DTO gap 분석.
- QA(`INT6-094`): acceptance checklist + NO-MUTATION headline gate.

## 다른 역할에 전달할 내용
- PM: contract는 브리프/ADR0018을 그대로 반영했다. G1/G3/G4는 Wave54 Backend가
  freeze, G5는 Frontend 제안. 추가 결정 요청 없음.
- Frontend:
  - **catalog shape**: `OntologyPackCatalogListResponse{ items[]:
    OntologyPackCatalogItem(pack_id/name/domain/version/description/mock:true/
    element_counts), total_count, mutation_guard }`. GLOBAL(project 파라미터 없음).
  - **detail shape**: `OntologyPackDetailResponse{ ...메타, element_counts,
    elements[]: PackElementDescriptor(element_key/element_kind/label/description),
    mutation_guard }`.
  - **apply-preview shape**: `PackApplyPreviewResponse{ preview_id?, project_id,
    pack_id, pack_version, generated_at, preview_only:true, status, compatibility,
    target_layer:"DRAFT", summary(would_add/would_modify/conflict/duplicate/
    total_element counts), items[]: PackPreviewItem(preview_ref/element_kind/
    disposition/target_layer/mapped_ontology_ref/pack_element_label/
    existing_element_label/note), item_cap, truncated, total_item_count, warnings[],
    blocked_reasons[], routing_note, mutation_guard }`. request body는 optional
    (`item_cap`만).
  - **disposition/compat enum**: NEW/CONFLICT/DUPLICATE + COMPATIBLE/WARNING/
    INCOMPATIBLE — D6 badge + KO gloss 대상. `routing_note`는 persistent boundary
    banner copy로 사용; **install/apply CTA 금지**.
  - **all-false 8-flag guard**는 세 응답 모두에 존재 -> live proof line으로 노출.
  - LNB 배치(G5): `/projects/:p/ontology-packs` contextual sub-view 제안.
- QA:
  - **headline gate**: 모든 응답 `OntologyPackMutationGuard` all-false + data-level
    ontology draft/class/property/relation/candidate/published/change-request 무변화
    (before==after). apply/install/governance-write path 미import.
  - catalog/detail byte-stable; apply-preview는 같은 pack + 같은 project DRAFT면
    byte-stable(modulo `generated_at`/`preview_id`); counts 정확 + `item_cap`/
    `truncated`/`total_item_count` bounded; disposition + compatibility가 fixture에
    대해 정확; `403`/`404`; BLOCKED은 crash 없이 `blocked_reasons[]`.
  - OpenAPI parse/additivity; `apps/`·`infra/` runtime leakage 부재.

## 총괄에게 요청하는 결정
- Wave53 Backend 계약 draft(3 read-only endpoint + 5 enum + all-false 8-flag guard +
  bounded dry-run preview, additive `0.6.11-draft`)를 PASS로 승인하고 Frontend
  (`FE6-099`)·QA(`INT6-094`) planning을 이어가게 해달라. runtime은 Wave54.

## 현재 판정
- PASS
