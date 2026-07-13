# PM / Architecture Report - Wave 53

## 담당 범위
- backlog ID:
  - `PM6-035` MVP6.11 Ontology Packs P0 scope freeze (contract-first planning only)
  - (생성한 후속 ID: `BE6-080`~`BE6-081`, `FE6-099`, `INT6-094`)
- 작업 경로:
  - `docs/pm/MVP6_11_ONTOLOGY_PACKS_BRIEF.md`
  - `docs/adr/0018-mvp6-11-ontology-packs-read-only-catalog-dry-run-apply-preview-no-apply-no-published-write-no-draft-mutation-boundary.md`
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
  - `docs/handoffs/wave-053/PM_REPORT.md`

## 완료한 작업
- MVP6.11 Ontology Packs(roadmap §11 Theme 8)을 **가장 작고 SAFE한 read-only
  pack catalog + deterministic dry-run apply-preview** P0로 contract-first planning
  freeze했다. runtime/route/component/model/migration/seed/smoke/test는 열지 않았다
  (Wave54 대기).
- **P0 flow 확정**: `프로젝트 선택 -> Ontology Packs(Build/Ontology) 열기 -> 팩 카탈로그
  (3개 deterministic mock pack: 메타 + element 수) -> 팩 상세(번들 클래스/속성/관계) ->
  이 프로젝트의 현재 DRAFT 온톨로지에 대해 dry-run APPLY-PREVIEW 실행 -> compatibility
  rollup + summary counts + would-add/would-modify capped sample(각 항목 NEW/CONFLICT/
  DUPLICATE disposition) -> "preview only — nothing applied; 실제 apply는 기존 MVP1
  ontology-edit / MVP6.6 governance-application 경로로" boundary 읽기`. 아무것도
  install/apply/write하지 않는다.
- **pack catalog 모델 확정(최소)**: 정확히 3개 deterministic in-repo mock pack —
  `pack-insurance-core`, `pack-manufacturing-equipment`, `pack-legal-compliance`
  (roadmap §11.2 예시 도메인). 각 pack = **ontology element만**(classes/properties/
  relations) 번들 + 메타(`pack_id`/`name`/`domain`/`version` 단일 고정/`description`/
  element counts). catalog는 global read-only, byte-stable. 상세는 MVP1 ontology
  element + `OntologyElementRef`(`target_kind`)를 `$ref`로 재사용. PromptPack/
  ValidationRulePack/SampleDatasetPack/constraint/sample-doc/dashboard/viz-preset
  payload는 P0 제외.
- **dry-run apply-preview 모델 확정(bounded/deterministic)**: pack + target project의
  현재 DRAFT 온톨로지가 주어지면, pack이 WOULD add/WOULD modify할 것을 DRAFT 레이어에
  매핑해 deterministic preview로 반환 + per-item disposition + compatibility/summary
  rollup. `preview_only:true`, opaque `preview_ref`(생성 id 아님), item cap +
  `truncated` + exact `total_item_count`. 같은 pack + 같은 DRAFT면 byte-stable
  (modulo `generated_at`/`preview_id`). BLOCKED은 crash/fabrication 없이 이유 반환.
- **enum/state 확정(문서 계약)**: `PackElementKind`(CLASS/PROPERTY/RELATION,
  `OntologyElementRef.target_kind`와 정렬); `PackApplyPreviewStatus`(READY/BLOCKED);
  `PackPreviewItemDisposition`(NEW/CONFLICT/DUPLICATE); `PackApplyCompatibility`
  (COMPATIBLE/WARNING/INCOMPATIBLE); `PackApplyTargetLayer`(DRAFT 단일 리터럴 —
  후보/게시 아님을 assert); `PackPreviewNotice {code, message}`(MVP6.9 패턴).
  disposition 의미: NEW=DRAFT에 없음→추가 대상; CONFLICT=동일 identity 존재하나
  정의 상이→human 해소 필요, 절대 auto-overwrite 안 함; DUPLICATE=동일 요소 존재→no-op.
- **all-false 8-flag guard 확정**: 모든 응답이 all-false `OntologyPackMutationGuard`
  (`pack_installed`/`ontology_draft_mutated`/`ontology_class_created`/
  `ontology_property_created`/`ontology_relation_created`/`candidate_graph_mutated`/
  `published_graph_mutated`/`change_request_created`) — 모두 false.
  `ontology_draft_mutated` + `published_graph_mutated`가 헤드라인 assertion(MVP6.6
  apply는 `ontology_draft_mutated`를 true로 바꾸지만 MVP6.11은 **어떤 flag도** true로
  바꾸지 않음).
- **read-only + no-apply + no-published-write + no-draft-mutation + no-external-fetch
  boundary 확정**: 실제 apply/install(`OntologyPackInstall`)·Pack Install Wizard
  write·auto-apply 없음; DRAFT에 대한 diff는 read-only(어떤 온톨로지 레이어도 mutate
  안 함); 외부 registry/gallery/fetch/download 없음(deterministic mock pack);
  게시 그래프 절대 미접촉. 실제 apply는 기존 MVP1 ontology-edit / MVP6.6
  governance-application(DRAFT-only, human-initiated) 경로로 deferral — pack은 절대
  두 번째 unreviewed ontology-write 경로가 아님.
- **authz 결정**: read-only·mutate 없음·grant 없음 → project view 가능한 아무 member가
  catalog list/pack detail/dry-run apply-preview 가능. 상위 role 불필요. MVP5 `Role`
  재사용, 신규 role literal 없음. 실제 apply(P1)는 ontology-edit/governance-approver
  권한(`ONTOLOGY_MANAGER`/`PROJECT_ADMIN`/`SYSTEM_ADMIN`) 필요 — P0 밖. Unauthorized →
  `403 PERMISSION_DENIED`; missing project/unknown pack → `404 PROJECT_NOT_FOUND`/
  `404 ONTOLOGY_PACK_NOT_FOUND`.
- **exclusion 명시**: 실제 apply/install; Pack Install Wizard write; auto-apply;
  published-graph write; ontology-draft mutation(preview only); 외부 pack registry/
  gallery/fetch/download; pack update notification; versioned dependency resolution;
  multi-version 관리(`OntologyPackVersion`); pack authoring/publishing; 비-온톨로지
  payload(`PromptPack`/`ValidationRulePack`/`SampleDatasetPack`/constraint/sample/
  dashboard/viz-preset); diff-and-apply 도구(preview diff는 read-only, apply는 아님);
  직접 candidate/published mutation; real LLM; 고정 3개 외 신규 pack.
- backlog에 Wave53 freeze summary + `PM6-035`/`BE6-080`~`081`/`FE6-099`/`INT6-094`를
  기존 번호 체계를 이어 추가하고 상단 status를 갱신했다. QA ID는 지시대로 `INT6-094`부터
  (INT6는 INT6-093까지 사용됨).
- 새 durable boundary(read-only catalog + dry-run apply-preview / no-apply /
  no-published-write / no-draft-mutation / no-external-fetch / all-false guard)이므로
  ADR `0018`을 기존 per-MVP boundary 패턴(0006~0017)으로 추가했다.

## 변경 파일
- 생성:
  - `docs/pm/MVP6_11_ONTOLOGY_PACKS_BRIEF.md`
  - `docs/adr/0018-mvp6-11-ontology-packs-read-only-catalog-dry-run-apply-preview-no-apply-no-published-write-no-draft-mutation-boundary.md`
  - `docs/handoffs/wave-053/PM_REPORT.md`
- 수정:
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md` (상단 status + Wave53 freeze summary + ID 표)

## 실행/검증
- 실행한 명령:
  - `git diff --check` → PASS (whitespace/충돌 경고 없음).
  - `git status --porcelain` → PM/backlog/ADR/handoff 문서만 변경.
  - runtime leakage 스캔(`apps/`/`infra/`에 ontology-pack runtime 부재).
- 결과: `git diff --check` PASS; runtime leakage 없음.
- 실행하지 못한 검증: PM/Architecture 문서 범위라 backend/frontend runtime/test/
  OpenAPI export는 수행하지 않는다. OpenAPI planning artifact
  (`openapi-mvp6-11-draft.json`) 작성/parse는 Backend(`BE6-081`) 몫.

## API/Enum/DTO 변경 (planning only)
- 변경 여부: 있음, **문서 계약 한정** (runtime/OpenAPI/DB/route 변경 없음)
- 신규 enum 후보(문서 계약): `PackElementKind`(CLASS/PROPERTY/RELATION);
  `PackApplyPreviewStatus`(READY/BLOCKED); `PackPreviewItemDisposition`
  (NEW/CONFLICT/DUPLICATE); `PackApplyCompatibility`(COMPATIBLE/WARNING/
  INCOMPATIBLE); `PackApplyTargetLayer`(DRAFT).
- 신규 DTO 후보(문서 계약): pack catalog item + pack detail(bundled elements);
  apply-preview response(status/compatibility/summary counts/`items[]` with
  `preview_ref`+disposition+`target_layer`+`mapped_ontology_ref`/cap+`truncated`+
  `total_item_count`/`routing_note`); `PackPreviewNotice {code, message}`;
  all-false 8-flag `OntologyPackMutationGuard`. Backend가 `BE6-080`~`081`에서 최종
  필드/이름/경로/persist-vs-compute(G1)를 확정한다.
- 재사용(by `$ref`, rename 없음): MVP1 ontology element + `OntologyElementRef`
  (`target_kind`) + ontology-version context, MVP5/MVP6.4 import dry-run
  compatibility + summary/nothing-applied 패턴, MVP6.9 catalog/preview/notice/
  bounding 패턴, MVP5 `Role`.
- 영향받는 역할: Backend/Frontend/QA (아래 전달 내용 참조).

## Blocker
- 없음.

## 남은 TODO
- Backend(`BE6-080`~`081`): `docs/api/MVP6_11_ONTOLOGY_PACKS_API_CONTRACT_DRAFT.md`
  (3 additive endpoint families + enums/DTOs + all-false 8-flag guard + bounded
  preview + `403`/`404`) + `docs/api/openapi-mvp6-11-draft.json`(additive, OpenAPI
  3.1.0, `0.6.11-draft`, disjoint-additive). open gate: G1 persist-vs-compute
  (ephemeral 권고), G2 catalog global/preview project-scoped(frozen — path 확인),
  G3 DRAFT-diff basis + fixture matrix(3 disposition/4 compatibility 커버), G4
  element-identity match rule.
- Frontend(`FE6-099`): `docs/pm/MVP6_11_FRONTEND_UX_REQUIREMENTS.md`(pack catalog +
  pack detail + dry-run apply-preview UX; ADR 0010 Build/Ontology contextual
  sub-view placement 제안(G5); would-add/would-modify + NEW/CONFLICT/DUPLICATE +
  compatibility/summary + capped sample layout; "preview only — nothing applied;
  real apply routes through ontology-edit/governance" boundary copy(install/apply
  CTA 금지); live all-false 8-flag guard proof line; loading/empty/error/permission
  일급; 닫힌 design language; DTO gap). route/component/type/mock/smoke 코드 없음.
- QA(`INT6-094`): `docs/backlog/INT6_11_ONTOLOGY_PACKS_ACCEPTANCE.md`(C planning +
  R NOT-RUNNABLE) + NO-MUTATION headline gate + all-false/no-draft/no-published/
  deterministic/byte-stable/disposition-correct guard + Wave54 권고.

## 다른 역할에 전달할 내용
- Backend:
  - **draft할 contract**: 3개 endpoint family — `GET /ontology-packs`(catalog,
    global), `GET /ontology-packs/{pack_id}`(detail), `POST /projects/{project_id}/
    ontology-packs/{pack_id}/apply-preview`(dry-run, creates nothing). mutation
    전무. MVP1 ontology element + `OntologyElementRef` + MVP5/MVP6.4 dry-run
    compatibility + MVP6.9 catalog/preview/notice 패턴 + MVP5 `Role`을 `$ref`로만
    재사용(rename 금지); ontology-write/install/governance-change/candidate-write/
    published-write path 미import.
  - **검토할 필드/상태**: 5 enum(`PackElementKind`/`PackApplyPreviewStatus`/
    `PackPreviewItemDisposition`/`PackApplyCompatibility`/`PackApplyTargetLayer`) +
    `PackPreviewNotice {code, message}`; pack catalog item + detail(bundled
    elements); apply-preview response(summary counts + `items[]` disposition +
    cap/`truncated`/`total_item_count` + `routing_note` + `preview_only:true`);
    **모든** 응답에 all-false 8-flag `OntologyPackMutationGuard`; `403`/`404`.
    G1(ephemeral 권고)/G2/G3(fixture matrix)/G4(match rule) 해소.
  - **checklist에 넣을 것**: catalog/detail byte-stable; apply-preview가 같은 pack +
    같은 project DRAFT면 byte-stable(modulo `generated_at`/`preview_id`); counts
    정확 + items cap+`truncated` bounded; disposition(NEW/CONFLICT/DUPLICATE) +
    compatibility가 fixture에 대해 정확; all-false 8-flag guard; DRAFT/published/
    candidate/change-request 무mutation; `403`/`404`.
- Frontend:
  - **검토할 fields+states**: pack catalog(메타+counts) + pack detail(bundled
    classes/properties/relations) + dry-run apply-preview 결과(would-add/
    would-modify + NEW/CONFLICT/DUPLICATE disposition + compatibility/summary +
    capped sample + `truncated`); ADR 0010 Build/Ontology-area **contextual
    sub-view** placement 제안(신규 ID-bound global LNB page 없음, G5); **persistent
    "preview only — nothing applied; real apply routes through ontology-edit/
    governance" boundary banner** + live all-false 8-flag guard proof line; NO
    install/apply/설치/적용 CTA; loading/empty/error/permission 일급. 닫힌 design
    language(Section+Card, KO title, D6 badge). D6 KO gloss 후보 제안(kind/status/
    disposition/compatibility/notice code). DTO gap을 Backend draft 대비 기록.
    route/component/type/mock/smoke 코드 없음.
- QA:
  - **checklist에 넣을 것**: PM/BE/FE가 P0 flow·catalog + apply-preview 모델·read-only
    + dry-run + no-apply + no-published-write + no-draft-mutation + no-external-fetch
    boundary·all-false 8-flag guard·exclusion에 합의하는지; **NO-MUTATION을 headline
    runtime gate로**(`OntologyPackMutationGuard` all-false 응답 + data-level ontology
    draft/class/property/relation/candidate/published/change-request row create/
    update/delete 없음, before==after; apply/install path 미import); apply-preview
    byte-stable(modulo `generated_at`/`preview_id`); disposition + compatibility가
    fixture에 대해 정확; counts 정확 + cap/`truncated` bounded; `403`/`404`; OpenAPI
    parse/additivity; `apps/`/`infra/` runtime leakage 부재. Wave54 권고.

## 총괄에게 요청하는 결정
- Wave53 PM freeze를 PASS로 승인하고 Backend/Frontend/QA가 contract-first
  planning(`BE6-080`~`081`/`FE6-099`/`INT6-094`)을 이어가도록 허용해 달라.
- MVP6.11 P0를 **read-only pack catalog + deterministic dry-run apply-preview까지**로
  유지하고(nothing installed/applied/written; catalog(global) + pack detail +
  project-scoped apply-preview 3개 read-only surface; NEW/CONFLICT/DUPLICATE
  disposition + COMPATIBLE/WARNING/INCOMPATIBLE rollup; 모든 응답 all-false 8-flag
  guard; `ontology_draft_mutated` + `published_graph_mutated` 항상 false), 실제
  apply/install·외부 registry/fetch·pack authoring·versioned dependency·
  non-ontology payload(prompt/validation/sample-dataset pack)·auto-apply는 별도
  wave(P1+)로 분리해 달라.
- 실제 apply가 필요해지면 신규 write 경로를 만들지 말고 기존 MVP1 ontology-edit /
  MVP6.6 governance-application(DRAFT-only, human-initiated) 경로로만 라우팅하도록
  ADR 0018 원칙을 유지해 달라.

## 현재 판정
- PASS
