# Next Orders - Wave 4

## 현재 단계 판정

- Overall: `PARTIAL / API FLOW PASSES, CONTRACT CLEANUP AND REAL FE-BE SMOKE REQUIRED`
- Backend: `PASS / SOURCE API AND OPENAPI EXPORT READY`
- Frontend: `PARTIAL / SOURCE UI READY, CONTRACT PRECISION FIXES REQUIRED`
- PM: `PASS / CONTRACT DECISIONS RECORDED`
- QA: `PARTIAL / BACKEND API FLOW PASS, INT-002/INT-003 FINDINGS REMAIN`

## 총괄 결정

- `docs/api/openapi-mvp1.json`을 MVP 1 canonical OpenAPI export artifact로 승인한다.
- Source delete는 MVP 1에서 `SourceStatus` enum을 늘리지 않고 internal `is_deleted` soft delete로 유지한다.
- Source archive/delete UI는 INT-001 필수 흐름에서 제외하고 FE-006 follow-up으로 둔다.
- Relation/edge cardinality는 MVP 1에서 Backend/OpenAPI의 전체 `Cardinality` enum을 FE가 수용한다. 별도 `RelationCardinality` enum은 만들지 않는다.
- `OntologyGraph.classes[]`, `relations[]`는 compatibility field이므로 Backend OpenAPI에서 optional/deprecated로 조정한다.
- INT-001 full pass에는 Backend API full flow와 Frontend mock route smoke만으로는 부족하다. 최소 `VITE_USE_MOCK_API=false` 실제 FE-to-BE smoke가 필요하다.
- Browser interaction smoke는 가능하면 수행하되, 도구/환경이 없으면 QA가 명확히 미수행 사유를 남긴다.
- `hana-style-component` install script 지연과 npm audit 5건은 MVP 1 release blocker가 아니다. `FE-011 Dependency hardening` P2 follow-up으로 추적한다.
- 화면이 더 커지기 전에 MVP 1 최소 UI style foundation을 잡는다. 이는 대규모 리디자인이 아니라 token/primitive/layout/status/hana adapter 기준을 고정하는 `FE-012` 작업이다.

## 모든 역할 공통 지시

- 작업 시작 전 반드시 `.agents/skills/handoff-reporting/SKILL.md`를 읽는다.
- 작업 범위는 MVP 1 P0 contract cleanup과 INT-001 통과 준비에 집중한다.
- 작업 종료 전 반드시 `docs/handoffs/REPORT_TEMPLATE.md` 형식으로 지정된 report path에 완료 보고서를 작성한다.
- 보고서가 없으면 작업 미완료로 판정한다.

## PM 지시

- Report path: `docs/handoffs/wave-004/PM_REPORT.md`
- Backlog IDs: `PM-005`, `PM-006`, `PM-007`
- 해야 할 일:
  - 위 총괄 결정을 `docs/api/API_CONTRACT_PRIORITY_MVP1.md`, `docs/backlog/MVP1_BACKLOG.md`, 필요 시 ADR에 반영한다.
  - `Cardinality`는 FE relation/edge에서도 full enum을 사용한다고 명시한다.
  - `OntologyGraph.classes[]`, `relations[]`는 compatibility field이며 canonical field가 아님을 명시한다.
  - INT-001 full pass 기준에 실제 FE-to-BE smoke 필요 조건을 명시한다.
  - `FE-011 Dependency hardening` P2 follow-up을 backlog에 추가하거나 기존 backlog에 note로 남긴다.
  - `FE-012 MVP 1 UI style foundation`을 backlog와 문서 맵에 반영하고, FE가 작성할 스타일 가이드 승인 기준을 명시한다.
- 완료 기준:
  - QA가 Wave 4에서 사용할 contract/pass 기준이 문서화되어 있다.
  - `docs/handoffs/wave-004/PM_REPORT.md`가 작성되어 있다.

## Backend 지시

- Report path: `docs/handoffs/wave-004/BACKEND_REPORT.md`
- Backlog IDs: `BE-010`, follow-up `BE-004`
- 해야 할 일:
  - `OntologyGraph.classes[]`, `relations[]`를 OpenAPI에서 optional/deprecated compatibility field로 조정한다.
  - canonical graph payload는 `nodes[]`, `edges[]`, `properties[]`만 required로 유지한다.
  - `docs/api/openapi-mvp1.json`을 재생성한다.
  - 변경 후 backend tests, OpenAPI freshness check를 수행한다.
  - Source API/OpenAPI export가 깨지지 않았는지 smoke 확인한다.
- 제한:
  - candidate/review/publish API는 추가하지 않는다.
  - SourceStatus enum에 delete/archive 값을 추가하지 않는다.
- 완료 기준:
  - OpenAPI `OntologyGraph.required`에서 `classes`, `relations`가 제거되어 있다.
  - `docs/api/openapi-mvp1.json`이 최신 backend export와 일치한다.
  - `docs/handoffs/wave-004/BACKEND_REPORT.md`가 작성되어 있다.

## Frontend 지시

- Report path: `docs/handoffs/wave-004/FRONTEND_REPORT.md`
- Backlog IDs: `FE-009`, `FE-006`, `FE-007`, `FE-012`, partial `FE-005`
- 해야 할 일:
  - `OntologyVersionSummary`를 Backend `OntologyVersion`과 맞추거나 명시적 API-boundary mapper를 추가한다.
  - relation/edge `cardinality` type을 full `Cardinality` enum으로 넓힌다.
  - Backend nullable DTO 필드와 FE types/UI rendering을 맞춘다.
    - `ProjectSummary.description`
    - `ProjectDetail.description`
    - `OntologyClass.description`
    - `OntologyRelation.description`
    - `SourceData.mime_type`
  - `docs/api/openapi-mvp1.json`과 FE `shared/api/types.ts`, `shared/mocks/fixtures.ts` diff를 줄인다.
  - Backend가 준비되면 `VITE_USE_MOCK_API=false` 실제 Source list/detail/upload/preview smoke를 수행한다.
  - Source archive/delete UI는 INT-001 필수에서 제외하고 follow-up으로 남긴다.
  - `docs/frontend/UI_STYLE_GUIDE_MVP1.md`를 작성한다.
    - theme token: color, spacing, radius, shadow, typography
    - UI primitive: Button, Input, Select, Badge, Card, Table, PageState, MetricCard
    - hana adapter 정책: 업무 화면 직접 import 금지, `src/shared/ui/hana`와 `src/shared/ui/platform` 역할 구분
    - status tone matrix: Project/Ontology/Source/Preview/Validation/Publish 상태별 badge tone
    - layout 기준: app shell, page header, list/detail, form grid, table, ontology modeler 3-panel
    - 금지 규칙: 임의 색상 추가, enum별 임의 tone, 직접 hana import, 과도한 카드 중첩
  - 현재 주요 화면과 `theme.ts`, `statusToTone`, 공통 UI wrapper가 스타일 가이드와 크게 어긋나지 않도록 1차 정리한다.
- 완료 기준:
  - QA가 지적한 `OntologyVersionSummary`, cardinality, nullable mismatch가 해소되어 있다.
  - 실제 API mode smoke 결과 또는 미수행 사유가 보고서에 있다.
  - `docs/frontend/UI_STYLE_GUIDE_MVP1.md`가 있고, 현재 theme/UI/status tone과 연결되어 있다.
  - `docs/handoffs/wave-004/FRONTEND_REPORT.md`가 작성되어 있다.

## QA 지시

- Report path: `docs/handoffs/wave-004/QA_REPORT.md`
- Backlog IDs: `INT-002`, `INT-003`, `INT-001`
- 선행 조건:
  - Backend wave-004 report와 Frontend wave-004 report를 먼저 읽는다.
  - PM wave-004 contract 기준을 확인한다.
- 해야 할 일:
  - `docs/api/openapi-mvp1.json` vs FE `shared/api/types.ts`, `shared/api/client.ts`, `shared/mocks/fixtures.ts` contract review를 재실행한다.
  - `OntologyVersion`, `Cardinality`, nullable DTO field, `OntologyGraph` compatibility required cleanup을 집중 검증한다.
  - Backend API INT-001 full flow를 재실행한다.
  - 가능하면 `VITE_USE_MOCK_API=false`로 Frontend 실제 API mode smoke를 수행하거나 FE 보고의 결과를 재검증한다.
  - Docker Compose 검증은 Docker CLI가 없으면 계속 blocker로 남긴다.
- 완료 기준:
  - `INT-002`, `INT-003`가 PASS/PARTIAL/FAIL로 명확히 판정되어 있다.
  - `INT-001` full pass 여부가 명확히 판정되어 있다.
  - 남은 실패 항목은 backlog ID에 연결되어 있다.
  - `docs/handoffs/wave-004/QA_REPORT.md`가 작성되어 있다.

## Contract Freeze

- OpenAPI artifact: `docs/api/openapi-mvp1.json`
- Graph canonical payload: `nodes[]`, `edges[]`, `properties[]`
- Graph compatibility payload: optional/deprecated `classes[]`, `relations[]`
- Cardinality: Backend/OpenAPI full `Cardinality` enum을 FE relation/edge에서도 사용
- Source delete: internal `is_deleted` soft delete, SourceStatus enum 변경 없음
- Source preview:
  - CSV/Excel: `status=UPLOADED`, `preview_status=READY`
  - TXT/PDF: `status=UPLOADED`, `preview_status=NOT_AVAILABLE`
- INT-001 full pass: actual FE-to-BE smoke required
- UI style foundation: `docs/frontend/UI_STYLE_GUIDE_MVP1.md`를 기준으로 현재 MVP 1 화면을 유지

## 다음 보고 위치

- PM: `docs/handoffs/wave-004/PM_REPORT.md`
- Backend: `docs/handoffs/wave-004/BACKEND_REPORT.md`
- Frontend: `docs/handoffs/wave-004/FRONTEND_REPORT.md`
- QA: `docs/handoffs/wave-004/QA_REPORT.md`
