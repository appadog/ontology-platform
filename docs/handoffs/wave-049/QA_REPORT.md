# QA / Integration Report - Wave 49

## 담당 범위
- backlog ID: `INT6-075` (MVP6.9 Connectors acceptance checklist — contract-first planning only), gates `INT6-075`~`INT6-082`.
- 작업 경로:
  - `docs/backlog/INT6_9_CONNECTORS_ACCEPTANCE.md` (생성)
  - `docs/handoffs/wave-049/QA_REPORT.md` (생성)
- MVP6.9 planning-only verification. No runtime/UI/test/seed. `apps/`, `infra/` 미변경.

## 완료한 작업
- `docs/backlog/INT6_9_CONNECTORS_ACCEPTANCE.md` 작성: C1–C8 planning gates (all PASS) +
  R1–R8 NOT-RUNNABLE runtime gates + Wave50 gates (G1/G5/G6/G7 + G12 IA ruling) +
  PM/BE/FE agreement/gap reconciliation + exact validation commands/output +
  Wave50 recommendation. INT6 numbering continued (`INT6-075`~`INT6-082`).
- PM(`MVP6_9_CONNECTORS_BRIEF.md`+ADR 0016), Backend(`MVP6_9_CONNECTORS_API_CONTRACT_DRAFT.md`
  +`openapi-mvp6-9-draft.json`), Frontend(`MVP6_9_FRONTEND_UX_REQUIREMENTS.md`) 3자 정합 검증.
- OpenAPI parse + 구조 assertion (3 path / 5 enum verbatim / 9-flag all-false guard on
  all 3 responses) + additive-disjoint + runtime-leak scan + no-raw-secret scan 실행.

## 실행/검증 (exact commands + output)
```text
$ python3 -m json.tool docs/api/openapi-mvp6-9-draft.json > /dev/null && echo PARSE_OK
PARSE_OK

# structural assertion
openapi 3.1.0 | version 0.6.9-draft | paths 3 | schemas 16
GET  /api/v1/projects/{project_id}/connectors
GET  /api/v1/projects/{project_id}/connectors/{connector_kind}/config-schema
POST /api/v1/projects/{project_id}/connectors/{connector_kind}/import-preview
ConnectorKind OK | ConnectorConfigFieldKind OK | ConnectorPreviewStatus OK
ConnectorPreviewCompatibility OK | ConnectorPreviewTargetLayer OK (CANDIDATE const)
ConnectorMutationGuard: 9 flags, all const:false, all required -> GUARD_ALL_FALSE_9: True
mutation_guard $ref present on all 3 response schemas
DISJOINT_ADDITIVE: True (3 new paths clash with none of openapi-mvp*.json)

$ rg -n 'connector|Connector|import-preview|ConnectorMutationGuard|mvp6.9' apps infra --glob '!**/node_modules/**'
(0 matches; EXIT=1 -> no runtime leaked)

# no-raw-secret scan of the 5 planning artifacts + wave-049 reports
(only non-secret placeholders: SECRET_PLACEHOLDER_NOT_A_REAL_SECRET, https://example.invalid/api;
 no realistic secret/token/key literal)

$ git diff --check
CHECK_OK
$ git status --porcelain   # docs-only; no apps/ or infra/
?? docs/handoffs/wave-049/BACKEND_REPORT.md
?? docs/handoffs/wave-049/FRONTEND_REPORT.md
?? docs/pm/MVP6_9_FRONTEND_UX_REQUIREMENTS.md
(+ QA files added this step; no apps/infra changes)
```
- 실행하지 못한 검증: R1–R8 runtime gates — NOT RUNNABLE by design (no runtime until Wave50).

## 역할별 findings
- **PM**: P0 = read-only catalog + deterministic dry-run preview, 3-kind cap, masked
  secrets, all-false 9-flag guard, exclusions (Plugin* family / external write / live
  sync / real network / credential storage 전부 P1+). ADR 0016 durable boundary 명확. PASS.
- **Backend**: 3 additive endpoints, 5 enums verbatim, 16 schemas, `preview_only:true`,
  `raw_secret_present:false`, constant `routing_note`, exact counts + `item_cap`/`truncated`/
  `total_item_count`, `OntologyElementRef` locally defined (same shape, no rename).
  PARSE_OK, disjoint-additive. PASS.
- **Frontend**: Build-group `Connectors` (Sources 인접) placement, masked-secret config
  UX (P0 secret 불요·secret-independent preview), preview-only 배너 + live all-false guard
  proof line, would-be candidate sample (opaque `preview_ref`, `CANDIDATE` only), no
  connect/import/sync/apply affordance, D6 badges, first-class states. §8 gap 재조정 완료. PASS.
- **Agreement**: 3자 모순 없음. FE DTO gaps **RESOLVED** by BE draft: G2/G3/G4/G8/G9/G10/G11.
  Remaining **OPEN** (Wave50 gates): G1 (persist-vs-compute), G5 (per-kind fixture/`source_locator`),
  G6 (`warnings`/`blocked_reasons` element shape), G7 (optional `generated_at`). G12 = PM copy/IA confirm.

## Wave50 gates (recorded)
- **G1** `preview_id` persist-vs-compute (ephemeral null vs persisted process-local + GET-by-id/list, MVP6.3/6.7 패턴).
- **G5** per-kind fixture / `source_locator` shape (deterministic byte-stable; source_segment locator semantics).
- **G6** `warnings[]`/`blocked_reasons[]` element shape (string vs `{code,message}`; FE는 `code` 선호).
- **G7** optional freshness timestamp (`generated_at`) — non-blocking; 없으면 stale marker drop.
- **G12 = COMMANDER IA RULING (recorded):** `Connectors` LNB item은 **BUILD 그룹, `Sources` 바로 다음**
  (ingestion-funnel adjacency: `Ontology → Sources → (Connectors preview) → Extraction → Candidates`).
  Analyze placement은 **기각** (upstream ingestion이지 downstream read/insight가 아님). per-kind
  config/preview는 **contextual sub-view** (`/projects/:p/connectors/:connectorKind`, frozen-enum
  route — ID-bound global page 아님, ADR 0010). PM은 Wave50에서 H1 copy (`커넥터` vs `Connectors`) +
  KO gloss 확정.

## API/Enum/DTO 변경
- 변경 여부: 없음 (QA checklist/report 문서만; runtime/OpenAPI/route/enum 변경 없음).

## Blocker
- 없음.

## 남은 TODO
- Wave50 thin implementation에서 R1–R8 독립 검증 (특히 R3 data-level "preview creates nothing" +
  R4 all-false guard + R5 no-raw-secret + R2 secret-independent byte-stable).
- G1/G5/G6/G7 Backend Wave50 gate 종료, G12 PM copy 확정.

## 다른 역할에 전달할 내용
- PM: G12 IA ruling 기록됨 (Build/Sources 인접, Analyze 기각). Wave50에서 H1 (`커넥터` vs
  `Connectors`) + KO gloss 확정. G1/G5/G6/G7는 Backend gate.
- Backend: R3(preview creates nothing, data-level before==after) + R4(all-false 9-flag) +
  R2(secret-independent byte-stable) + R5(no-raw-secret)가 Wave50 핵심 acceptance. G1/G5/G6/G7 해소.
- Frontend: R7 mock+actual smoke는 backend 모듈 존재 후 실행 (Wave34 parallel-wave gap 재발 방지 —
  QA가 actual backend boot 후 검증). no connect/import/sync/apply affordance 유지.

## 총괄에게 요청하는 결정
- Wave49 QA를 PASS (planning)로 승인하고 Wave50 MVP6.9 thin implementation 진입을 허용해 달라.
- G12 commander IA ruling (Build/Sources 인접, Analyze 기각, contextual sub-view)을 확정으로 기록.

## 현재 판정
- **PASS (planning)** — C1–C8 PASS; PM/BE/FE agree; PARSE_OK (3 paths / 16 schemas,
  disjoint-additive); 9-flag all-false guard on all 3 responses; no runtime leaked; no raw
  secret; `git diff --check` clean. R1–R8 NOT RUNNABLE by design until Wave50.
- **Recommendation: Wave50 thin implementation** (not hardening, not redesign — the
  planning contract is coherent).
