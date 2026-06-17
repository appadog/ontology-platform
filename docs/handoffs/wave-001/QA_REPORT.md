# QA Report - Wave 1

## 담당 범위

- INT-001 MVP 1 데모 흐름 수용 테스트 체크리스트 작성
- Backend OpenAPI와 Frontend mock/API 타입 일치 여부 확인
- Project 생성 → Ontology 작성 → Source 업로드 → Preview 확인 흐름 검증
- 실패 항목을 BE/FE/PM backlog ID에 연결

## 완료한 작업

- `docs/backlog/INT-001_MVP1_DEMO_ACCEPTANCE.md` 신규 작성
- `docs/backlog/MVP1_BACKLOG.md`에 INT-001 수용 리포트 링크 추가

## 현재 판정

- `INT-001`: `FAIL / NOT RUNNABLE`

## 실패 사유

- backend/frontend 구현 surface가 아직 없음.
- `apps/backend`: `README.md`, `app/.gitkeep`만 존재.
- `apps/frontend`: `README.md`, `src/.gitkeep`만 존재.
- `pyproject.toml`, `package.json`, openapi json/yaml, local docker-compose 구현 파일 없음.

## 주요 Blocker

- `BE-001`, `BE-010` 미완료: FastAPI scaffold, `/health`, `/docs`, OpenAPI export 없음.
- `FE-001`, `FE-009` 미완료: Vite app, `shared/api`, `shared/mocks` 없음.
- OpenAPI와 FE 타입/mock이 없어서 contract diff 불가.
- 런타임 앱이 없어 Project → Ontology → Source → Preview 실제 흐름 검증 불가.

## 연결된 backlog

- Backend: `BE-001`, `BE-003`, `BE-004`, `BE-005`, `BE-006`, `BE-007`, `BE-009`, `BE-010`
- Frontend: `FE-001`, `FE-002`, `FE-004`, `FE-005`, `FE-006`, `FE-007`, `FE-009`
- PM: `PM-005`
- Integration: `INT-001`, `INT-002`, `INT-003`, `INT-004`

## API/Enum/DTO 리스크

- Source 상태 표현 정리 필요:
  - `UPLOADED`는 `SourceStatus`
  - `READY`는 `SourcePreviewStatus`
  - UI/API에서 `status`와 `preview_status`를 분리해야 함
- `OntologyGraph` DTO 모호성 있음:
  - API 문서에는 `OntologyGraph.classes[]/relations[]`와 `OntologyGraphNode/OntologyGraphEdge`가 함께 존재
  - `nodes/edges/properties` 형태로 확정하거나 `classes[]`가 graph node payload임을 명시 필요
- INT-001 happy path용 OpenAPI example/mock response 필요

## PM 결정으로 해소된 리스크

- `SourceStatus`와 `SourcePreviewStatus` 분리 확정.
- `OntologyGraph`는 `nodes[]`, `edges[]`, `properties[]`로 확정.

## 다음 Gate

1. `BE-001`: runnable FastAPI app + `/health`
2. `BE-010`: P0 DTO schema와 examples 포함 OpenAPI
3. `FE-001`, `FE-002`: runnable frontend shell
4. `FE-009`: `shared/api` types + `shared/mocks` fixtures
5. `PM-005`: source status/preview_status 문구 정리
6. 이후 `INT-001` 재검증 수행
