# PM / Architecture Report - Wave 49

## 담당 범위
- backlog ID:
  - `PM6-031` MVP6.9 Connectors / Plugin SDK P0 scope freeze (contract-first
    planning only)
  - (생성한 후속 ID: `BE6-068`~`BE6-069`, `FE6-089`, `INT6-075`)
- 작업 경로:
  - `docs/pm/MVP6_9_CONNECTORS_BRIEF.md`
  - `docs/adr/0016-mvp6-9-connectors-read-only-catalog-dry-run-preview-no-external-write-no-real-network-masked-secret-boundary.md`
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
  - `docs/handoffs/wave-049/PM_REPORT.md`

## 완료한 작업
- MVP6.9 Connectors / Plugin SDK(roadmap §10 Theme 7)을 **가장 작고 SAFE한,
  read-only catalog + dry-run preview** P0로 contract-first planning freeze했다.
  runtime/route/component/model/migration/seed/smoke/test는 열지 않았다(Wave50 대기).
- **P0 flow 확정**: `select project -> open Connectors(Analyze/Sources area) ->
  view catalog(3 deterministic mock kinds) -> open a kind -> masked config schema
  -> fill mock config + run dry-run import PREVIEW -> compatibility + summary counts
  + capped would-be candidate items -> explicit "preview only, nothing imported;
  real run routes through the existing extraction->candidate->review->publish gate"`.
  아무것도 연결/import/write하지 않는다.
- **Catalog 모델(3 kind 상한, `ConnectorKind`)**: `FILE_SOURCE`(CSV/JSON),
  `REST_SOURCE`(generic REST-ish), `KNOWLEDGE_BASE_SOURCE`(KB/doc). 각 kind는
  masked config schema(`ConnectorConfigField[]`: `name`/`label`/`field_kind`/
  `required`/`secret`/`placeholder`/`help_text`)를 가진다.
  `ConnectorConfigFieldKind` = `STRING`/`URL`/`ENUM`/`INTEGER`/`BOOLEAN`/`SECRET`.
  `SECRET`(또는 `secret:true`)는 어디서나 masked. 실제 연결 없음.
- **Dry-run preview 모델(bounded, deterministic)**: `connector_kind` + mock config
  -> fixture 데이터에서 deterministic preview. source record를 **would-be
  candidate-layer item**으로 매핑(counts + capped sample refs) + compatibility/
  summary rollup. `preview_only:true`, `routing_note`, `raw_secret_present:false`,
  all-false guard 포함. cap(P0 e.g. 50) + `truncated` + exact `total_item_count`로
  bound. same kind + non-secret config + same fixture -> byte-stable.
- **Preview enums 확정**: `ConnectorPreviewStatus`(`READY`/`BLOCKED`),
  `ConnectorPreviewCompatibility`(`COMPATIBLE`/`WARNING`/`INCOMPATIBLE`; MVP5/
  MVP6.4 dry-run 선례 미러), `ConnectorPreviewTargetLayer`(`CANDIDATE` 단일 리터럴
  — preview item은 candidate layer로만 매핑, published 절대 아님).
- **Credential/no-secret 규칙(MVP5 미러)**: raw secret은 print/persist/log/return
  안 함, masked/placeholder만, `raw_secret_present:false`. P0에는 credential
  create/reveal조차 없다. preview는 `connector_kind`(+non-secret config)로 fixture에서
  계산되어 **secret 값과 무관** — no-real-network를 강화. 모든 문서 예시는
  **non-secret placeholder**(`SECRET_PLACEHOLDER_NOT_A_REAL_SECRET`,
  `https://example.invalid/api`)만 사용.
- **read-only + no-external-write + no-real-network 경계 + all-false guard 확정**:
  deterministic mock connector + fixture. socket/외부연결/credential 실행 없음.
  preview는 candidate/entity/relation/source/extraction job을 생성하지 않고
  published graph를 건드리지 않으며 기존 candidate-review gate를 우회하지 않는다.
  9-flag `ConnectorMutationGuard`(`external_system_read`/`external_system_write`/
  `real_network_call_made`/`credential_persisted`/`connector_instance_persisted`/
  `source_created`/`candidate_graph_mutated`/`published_graph_mutated`/
  `extraction_job_started`) 모두 false — 모든 응답.
- **authorization 결정**: read-only, mutate/grant 없음 → 프로젝트 읽기 가능한 project
  member면 catalog view + config schema + dry-run preview 가능(elevated role 불필요).
  MVP5 `Role` 재사용, 신규 role literal 없음. 실제 ingestion(P1)은 ingest-capable
  role(e.g. `SOURCE_MANAGER`) 필요 — P0 밖. 미인가 → `403 PERMISSION_DENIED`,
  없는 project/kind → `404 PROJECT_NOT_FOUND`/`404 CONNECTOR_KIND_NOT_FOUND`.
- exclusion 명시: external write-back; live/scheduled/background sync;
  confirm-and-apply real import; real network/credential execution/external
  connection; credential storage/encryption/vault/rotation; connector instance
  persistence; autonomous/auto-confirmed ingestion; **plugin code execution + 전체
  Plugin\* family**(Parser/Chunker/Extractor/Validator/Exporter/Visualization/
  Agent-Tool; `PluginDefinition`/`PluginVersion`/`PluginExecution`/
  `PluginPermission`); real Database/S3-MinIO/Web-Crawler/Notion-Confluence/Git
  connector; setup wizard write; sync job monitor; plugin management/execution log;
  direct candidate/published-graph mutation; source create/extraction trigger from
  preview; multi-tenant/cross-project connector runtime; real LLM; frozen 3 kind
  초과 신규 kind. durable DB/Alembic는 P0 미요구·P1/P2(process-local
  `reset_runtime_store()` 허용).
- backlog에 Wave49 freeze summary + `PM6-031`/`BE6-068`~`069`/`FE6-089`/`INT6-075`을
  기존 번호 체계를 이어 추가하고 상단 status를 갱신했다. QA ID는 지시대로 `INT6-075`부터
  (INT6는 INT6-074까지 사용됨).
- 새 durable boundary(read-only catalog + dry-run preview / no-external-write /
  no-real-network / masked-secret / all-false guard)이므로 ADR `0016`을 기존 per-MVP
  boundary 패턴(0006~0015)으로 추가했다.

## 변경 파일
- 생성:
  - `docs/pm/MVP6_9_CONNECTORS_BRIEF.md`
  - `docs/adr/0016-mvp6-9-connectors-read-only-catalog-dry-run-preview-no-external-write-no-real-network-masked-secret-boundary.md`
  - `docs/handoffs/wave-049/PM_REPORT.md`
- 수정:
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md` (상단 status + Wave49 freeze summary + ID 표)

## 실행/검증
- 실행한 명령:
  - `git diff --check` → PASS (whitespace/충돌 경고 없음).
  - `git status --porcelain` → PM/backlog/ADR/handoff 문서만 변경.
  - runtime leakage 스캔(`apps/`/`infra/`에 connector runtime 부재).
  - no-raw-secret 스캔(문서 예시는 non-secret placeholder만).
- 결과: `git diff --check` PASS; runtime leakage 없음; no-secret 스캔 통과.
- 실행하지 못한 검증: PM/Architecture 문서 범위라 backend/frontend runtime/test/
  OpenAPI export는 수행하지 않는다. OpenAPI planning artifact
  (`openapi-mvp6-9-draft.json`) 작성/parse는 Backend(`BE6-069`) 몫.

## API/Enum/DTO 변경 (planning only)
- 변경 여부: 있음, **문서 계약 한정** (runtime/OpenAPI/DB/route 변경 없음)
- 신규 enum 후보(문서 계약): `ConnectorKind`(3),
  `ConnectorConfigFieldKind`(`STRING`/`URL`/`ENUM`/`INTEGER`/`BOOLEAN`/`SECRET`),
  `ConnectorPreviewStatus`(`READY`/`BLOCKED`),
  `ConnectorPreviewCompatibility`(`COMPATIBLE`/`WARNING`/`INCOMPATIBLE`),
  `ConnectorPreviewTargetLayer`(`CANDIDATE`).
- 신규 DTO 후보(문서 계약): connector catalog item; `ConnectorConfigField` +
  masked config schema; dry-run import preview(status/compatibility/summary counts/
  capped `sample_items[]` = would-be candidate refs with `preview_ref`+
  `mapped_ontology_class_ref`/`routing_note`/`raw_secret_present:false`/warnings/
  blocked_reasons); all-false `ConnectorMutationGuard`(9 flags). Backend가
  `BE6-068`~`069`에서 최종 필드/이름/경로/persist-vs-compute를 확정한다.
- 재사용(by `$ref`, rename 없음): MVP5 masked-secret credential safety + import
  dry-run(`compatibility_status`/`summary`/nothing-applied), MVP6.4
  `GoldSetImportCompatibility`, MVP2 candidate(`CandidateEntity`/`CandidateRelation`/
  `source_segment`/`SourceParseResponse`/extraction-job), MVP1 `OntologyElementRef`
  + version context, MVP5 `Role`.
- 영향받는 역할: Backend/Frontend/QA (아래 전달 내용 참조).

## Blocker
- 없음.

## 남은 TODO
- Backend(`BE6-068`~`069`): `docs/api/MVP6_9_CONNECTORS_API_CONTRACT_DRAFT.md`
  (additive endpoint families + enums/DTOs + all-false 9-flag guard + preview
  creates nothing + masked secrets) + `docs/api/openapi-mvp6-9-draft.json`
  (additive, OpenAPI 3.1.0, `0.6.9-draft`, disjoint-additive). open question:
  persist-vs-compute(`preview_id` list+GET-by-id, MVP6.3/6.7 패턴); fixture sample
  shape per connector kind; would-be candidate item ref shape(`preview_ref` opaque
  vs `OntologyElementRef` 재사용 범위).
- Frontend(`FE6-089`): `docs/pm/MVP6_9_FRONTEND_UX_REQUIREMENTS.md`
  (Analyze/Sources placement per ADR 0010, catalog + masked-secret config UX,
  dry-run preview 결과 layout, "preview only — nothing imported" boundary copy,
  live all-false-guard proof line, loading/empty/error/permission 상태, DTO gap).
  route/component/type/mock/smoke 코드 없음.
- QA(`INT6-075`): `docs/backlog/INT6_9_CONNECTORS_ACCEPTANCE.md`(C planning +
  R NOT-RUNNABLE) + boundary/all-false/no-secret/determinism guard + Wave50 권고.

## 다른 역할에 전달할 내용
- Backend:
  - **draft할 contract**: 3개 endpoint family(`GET .../connectors`,
    `GET .../connectors/{connector_kind}/config-schema`,
    `POST .../connectors/{connector_kind}/import-preview`). read-only + 유일한
    write-like는 dry-run preview(아무것도 생성 안 함). MVP5/MVP6.4/MVP2/MVP1을
    `$ref`로만 재사용(rename 금지); external-network/candidate-write/extraction-
    trigger/credential-store path 미import.
  - **검토할 필드/상태**: 5 enum(`ConnectorKind` x3, `ConnectorConfigFieldKind`,
    `ConnectorPreviewStatus`, `ConnectorPreviewCompatibility`,
    `ConnectorPreviewTargetLayer`); masked config schema(`SECRET` 필드 마스킹);
    preview(status/compatibility/summary exact counts/capped `truncated`
    items/`routing_note`/`raw_secret_present:false`); **모든** 응답에 all-false
    9-flag `ConnectorMutationGuard`; `403`/`404 PROJECT_NOT_FOUND`/
    `404 CONNECTOR_KIND_NOT_FOUND`.
  - **checklist에 넣을 것**: preview creates nothing(candidate/source/extraction);
    no real network(`real_network_call_made=false`); preview는 secret 값과 무관하게
    deterministic byte-stable; masked secrets only(no raw); persist-vs-compute/
    fixture-shape open question 해소.
- Frontend:
  - **검토할 fields+states**: Analyze/Sources area placement(ADR 0010 — global
    ID-bound LNB page 없음); catalog(3 kind) + kind별 masked config schema UX(raw
    secret 표시/입력 금지); dry-run preview 결과(compatibility/summary/capped
    would-be candidate items + truncated); **persistent "preview only — nothing
    imported; real import routes through candidate review later" boundary banner** +
    live all-false-guard proof line; loading/empty/error/permission 일급. 닫힌
    design language(Section+Card, KO title, D6 badge). autonomous-sync/external-
    write/imported copy 금지. DTO gap을 Backend draft 대비 기록. route/component/
    type/mock/smoke 코드 없음.
- QA:
  - **checklist에 넣을 것**: PM/BE/FE가 P0 flow·3-kind catalog·masked config
    schema·dry-run preview 모델·read-only + dry-run + no-external-write +
    no-real-network + masked-secret boundary·all-false 9-flag guard·exclusion에
    합의하는지; preview가 아무것도 import/write/connect하지 않음(response all-false
    guard / code-level external-network·candidate-write·extraction·credential-store
    path 미import / data-level candidate·source·published·extraction 불변);
    no real network(`real_network_call_made=false`); preview byte-stable
    deterministic + secret-무관; masked secrets only + no-raw-secret 아티팩트 스캔;
    authz `403`/`404`; MVP5/MVP6.4 shape rename 부재; OpenAPI parse/additivity;
    `apps/`/`infra/` runtime leakage 부재. Wave50 권고.

## 총괄에게 요청하는 결정
- Wave49 PM freeze를 PASS로 승인하고 Backend/Frontend/QA가 contract-first
  planning(`BE6-068`~`069`/`FE6-089`/`INT6-075`)을 이어가도록 허용해 달라.
- MVP6.9 P0를 **read-only catalog + deterministic dry-run import preview까지**로
  유지하고(nothing connected/imported/written; masked secrets only; no real
  network; 모든 응답 all-false 9-flag guard; frozen 3 connector kind), external
  write-back·live/scheduled sync·confirm-and-apply real import·real network/
  credential execution·credential storage·connector instance persistence·plugin
  code execution/Plugin\* family·모든 direct graph mutation은 별도 wave(P1+)로
  분리해 달라.
- 3-kind connector catalog(`FILE_SOURCE`/`REST_SOURCE`/`KNOWLEDGE_BASE_SOURCE`)을
  P0 상한으로 승인해 달라(신규 kind는 이후 PM freeze로만 추가).

## 현재 판정
- PASS
