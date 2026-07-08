# Frontend Report - Wave 49

## 담당 범위
- backlog ID: `FE6-089` (MVP6.9 Connectors Frontend UX/API requirements — contract-first planning only)
- 작업 경로:
  - `docs/pm/MVP6_9_FRONTEND_UX_REQUIREMENTS.md` (생성)
  - `docs/handoffs/wave-049/FRONTEND_REPORT.md` (생성)

## 완료한 작업
- MVP6.9 Connectors P0(read-only catalog + deterministic dry-run import preview)의
  Frontend UX/API 요구사항을 **planning only**로 작성했다. route/component/type/
  mock/smoke 코드는 만들지 않았다(Wave50 대기).
- **Placement 결정(ADR 0010)**: `Connectors`를 프로젝트 존 **`BUILD` 그룹의
  `Sources` 바로 다음** 단일 LNB 항목으로 배치. 근거: dry-run preview의 would-be
  산출물(`ConnectorPreviewTargetLayer.CANDIDATE` → `mapped_ontology_class_ref`)이
  `Ontology → Sources → (Connectors preview) → Extraction → Candidates` ingestion
  funnel을 먹이므로 `Sources`(Build)와 인접이 가장 정직. Analyze 그룹은 검토 후
  기각(사후 read/insight 성격이라 upstream ingestion과 semantic mismatch)하되 PM이
  release consistency 위해 Analyze를 원하면 group heading만 바뀐다고 명시. per-kind
  config/preview는 contextual sub-view(`/projects/:p/connectors/:connectorKind`,
  frozen enum literal — ID-bound global page 아님).
- **Catalog UX**: 3 frozen `ConnectorKind` 카드(add/register 어포던스 없음),
  config-field 요약 + "secret field present" 마커, 유일 액션 "설정 및 미리보기".
- **Masked-secret config-form UX**: `ConnectorConfigField[]` → 컨트롤 매핑,
  `SECRET`/`secret:true`는 어디서나 마스킹(`type=password`, echo/log/persist 금지).
  **P0에서 raw secret 입력·요구 없음** — preview는 secret 값과 무관하게 fixture로
  계산되므로 SECRET 필드는 non-secret placeholder로 disabled 시연 처리, secret 없이
  preview 실행 가능.
- **Dry-run preview 결과 layout**: status/compatibility 헤더 → summary rollup(exact
  would-be counts) → capped `sample_items[]`(`preview_ref` opaque/후보ID 아님,
  `target_layer=CANDIDATE`, `mapped_ontology_class_ref`, `source_locator`, `note`) →
  truncation notice(`item_cap`/`total_item_count`) → `warnings[]`/`blocked_reasons[]`
  → `routing_note` verbatim → live all-false guard proof. confirm/import/apply CTA 없음.
- **"nothing imported" boundary**: 상단 persistent 비닫힘 배너 +
  `PREVIEW_ONLY/NO_EXTERNAL_CALL/NO_SECRET_STORED/NOTHING_IMPORTED` 칩 + 9-flag
  `ConnectorMutationGuard` all-false proof line + `raw_secret_present:false` +
  `preview_only:true`(응답에서 읽음, 하드코딩 아님; true면 guard-violation state).
- **States 일급**: loading(catalog/schema/preview) / empty(catalog·preview sample) /
  error(transport vs BLOCKED result 구분) / permission-limited(project member면 preview
  가능; `403`/`404` 매핑; 다운스트림 ingest 권한 없음 명시) / INCOMPATIBLE·BLOCKED(비-crash
  result, 0 fabricated items, edit-and-re-run) / WARNING / truncated / guard-violation.
- **Design language**: Section+Card, KO H1(`커넥터`), D6 badge 테이블 확장
  (`READY`/`BLOCKED`/`COMPATIBLE`/`WARNING`/`INCOMPATIBLE`/`CANDIDATE` + `ConnectorKind`
  칩 + boundary 칩; tone/icon/한국어 gloss).
- **DTO gap 분석(§8)**: G1–G12를 착륙한 Backend draft(3 paths/16 schemas)에 대해
  **재조정 완료**. RESOLVED: G2(`enum_values` 추가), G3(request는 non-secret only·
  secret-independent), G4(`OntologyElementRef`, **단 nullable**), G8(9-flag const:false),
  G9(malformed→`400 INVALID_CONNECTOR_CONFIG` vs invalid-but-wellformed→200 `BLOCKED`),
  G10(`ConnectorCatalogItem.has_secret_fields`/`config_field_count`), G11(counts exact).
  OPEN(Wave50 gate): G1(persist-vs-compute, `preview_id` nullable), G5(per-kind fixture/
  locator shape), G6(`warnings`/`blocked_reasons` element shape). GAP(missing field):
  G7(응답에 freshness timestamp 없음 — stale marker optional). PM decision: G12(KO gloss/
  H1/LNB group). 추가로 per-item `compatibility`·nullable `mapped_ontology_class_ref`
  (미매핑 state)·request `item_cap`(≤50)를 UX에 반영.

## 변경 파일
- 생성: `docs/pm/MVP6_9_FRONTEND_UX_REQUIREMENTS.md`
- 생성: `docs/handoffs/wave-049/FRONTEND_REPORT.md`
- `apps/`·`infra/` runtime 변경 없음.

## 실행/검증
- 실행한 명령:
  - `git diff --check` → PASS (whitespace/충돌 경고 없음).
  - no-raw-secret 스캔 → non-secret placeholder만(`SECRET_PLACEHOLDER_NOT_A_REAL_SECRET`,
    `https://example.invalid/api`); concrete raw secret 0.
  - `git status --porcelain` → 신규 문서 2개만; runtime leakage 없음.
- 결과: 모두 통과.
- 실행하지 못한 검증: planning-only 문서 범위라 build/test/smoke/OpenAPI export 없음.
  Backend draft가 wave 중 착륙하여 §8 gap을 실제 contract에 재조정 완료.

## API/Enum/DTO 변경
- 변경 여부: 없음 (요구사항 문서만; runtime/OpenAPI/route/enum 변경 없음).
- 상세: frozen enum/field 이름을 그대로 참조(`ConnectorKind`×3,
  `ConnectorConfigFieldKind`×6, `ConnectorPreviewStatus`, `ConnectorPreviewCompatibility`,
  `ConnectorPreviewTargetLayer`, 9-flag `ConnectorMutationGuard`). Backend가 최종 필드/
  경로/persist-vs-compute를 확정하면 §8 gap 재조정.
- 영향받는 역할: Backend(gap 응답), QA(acceptance).

## Blocker
- 없음. planning 산출물 완료, Backend draft에 재조정 완료.

## 남은 TODO (Wave50 gate로 이월된 OPEN gap만)
- G1 preview persist-vs-compute (`preview_id` nullable — 현재 ephemeral view state로 처리).
- G5 per-kind fixture/`source_locator` 필드 shape (Backend open question 2).
- G6 `warnings[]`/`blocked_reasons[]` element shape (string vs `{code,message}` — code 선호).
- G7 응답 freshness timestamp 부재 (stale marker optional; 필요 시 Backend `generated_at` 추가).
- G12 (PM copy/IA): LNB group(Build vs Analyze), H1 `커넥터` vs `Connectors`, KO gloss 승인.

## 다른 역할에 전달할 내용
- PM: `Connectors` LNB group(**Build/Sources 인접 권고** vs Analyze) 확정; H1 `커넥터` vs
  `Connectors` 및 KO gloss(§4) 승인.
- Backend: §8 G1–G11 필드 결정, 특히 **G2(ENUM options)**·**G9(invalid-config transport)**가
  FE 정확도에 가장 load-bearing. `ConnectorConfigField` 디스크립터에 ENUM options 추가 요망.
  preview 응답은 9-flag all-false guard + `preview_only:true` + `raw_secret_present:false` +
  `routing_note` 필수. SECRET은 request에서 omit/masked-only.
- QA: preview creates nothing / no external call / no secret stored를 (1)응답 all-false guard,
  (2)UI에 confirm/import/apply/sync 어포던스 부재, (3)would-be(`preview_ref` opaque·
  `target_layer=CANDIDATE`)로 검증. truncated 시 counts exact / BLOCKED 시 0 fabricated items.
  no-raw-secret 아티팩트 스캔.

## 총괄에게 요청하는 결정
- Wave49 Frontend planning(`FE6-089`)을 PASS로 승인.
- `Connectors` 배치를 **Build 그룹 `Sources` 다음**으로 확정(또는 PM이 Analyze로 override).
- Wave50 thin 구현 진입 허용 (OPEN gap G1/G5/G6/G7은 Backend Wave50 gate에서 종료).

## 현재 판정
- PASS (planning-only 산출물 완료; Backend draft에 §8 재조정 완료; blocker 없음).
