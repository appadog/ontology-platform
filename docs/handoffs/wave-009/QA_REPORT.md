# QA Report - Wave 9

## 담당 범위
- backlog ID: `INT2-002`, support `FE-005`, support `FE-014`, support `BE-004`, support `BE-005`
- 작업 경로: `docs/handoffs/wave-009/`, `docs/api/openapi-mvp2-draft.json`, `apps/backend/`, `apps/frontend/`

## 완료한 작업
- PM/Backend/Frontend Wave 9 보고서를 먼저 읽고, Wave 9가 full sync가 아닌 targeted regression wave임을 기준으로 검증했다.
- MVP 1 regression gate를 actual backend smoke로 재확인했다.
  - `/health`, `/api/v1/me`, project create/list/detail
  - ontology draft version 생성, class/property/relation 생성, graph 조회
  - CSV/Excel upload 및 READY preview
  - TXT/PDF upload 및 `preview_status=NOT_AVAILABLE`
- Wave 7 contract sync 유지 여부를 재확인했다.
  - `provider=mock`: extraction run raw request에 mock provider payload 유지
  - `SourceParseResponse`: `source_id`, `profile`, `segments`, `sample_rows`, `truncated` 유지
  - `PromptVersion`: OpenAPI/FE type/client/mock shape 유지
  - `CandidateEvidence`: nullable locator fields 유지
  - `invalid_evidence_reference` hook: invalid fixture job에서 `INVALID_EVIDENCE_REFERENCE` candidate 및 broken evidence route 확인
- Targeted ontology delete regression을 수행했다.
  - class/property/relation 생성 후 class delete 실행
  - graph refetch에서 삭제 class, orphan property, connected relation 미노출 확인
  - list API에서 deleted class에 연결된 property/relation 미노출 확인
  - extraction input raw request에서 deleted class/relation이 제외됨을 확인
  - deleted ontology element 기반 candidate count가 0임을 확인
- Frontend actual API mode smoke를 수행했다.
  - `VITE_USE_MOCK_API=false`, `VITE_API_BASE_URL=http://127.0.0.1:8030`
  - project-scoped ontology/source/extraction/candidate/evidence routes가 실제 backend data ID로 렌더링됨을 확인
- Frontend delete confirmation smoke를 실제 브라우저 클릭으로 수행했다.
  - class confirm: class name, affected property count, inbound/outbound relation count, draft-only copy 확인
  - property confirm: property name, draft-only copy 확인
  - relation confirm: relation name, draft-only copy 확인
- Evidence fallback/breadcrumb smoke를 수행했다.
  - normal evidence route에서 source, segment, validation code, locator highlight, evidence text 확인
  - broken evidence route에서 source id, source segment placeholder, validation code, candidate context, parent 복귀 action 확인
  - broken evidence backend 404는 fallback UI 진입 조건으로 의도된 동작으로 확인
- LNB/drilldown targeted smoke를 수행했다.
  - LNB는 top-level menu만 노출하고 ID 기반 detail page를 평면 메뉴로 노출하지 않음
  - job/candidate/evidence detail은 parent screen의 contextual action 및 breadcrumb/path로 연결됨

## 변경 파일
- `docs/handoffs/wave-009/QA_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `docker --version`
  - `git diff --check -- apps/backend apps/frontend docs/api/openapi-mvp2-draft.json`
  - `cd apps/backend && .venv/bin/pytest tests/test_project_ontology_api.py -k "class_delete or deleted_ontology" -q`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && .venv/bin/pytest -q`
  - `cd apps/backend && .venv/bin/python scripts/export_openapi.py --output "$tmpfile" && cmp -s "$tmpfile" ../../docs/api/openapi-mvp2-draft.json`
  - `DATABASE_URL=sqlite+pysqlite:////private/tmp/ontology-platform-wave9-qa.sqlite LOCAL_STORAGE_PATH=/private/tmp/ontology-platform-wave9-qa-storage .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8030`
  - backend actual API smoke script: `/private/tmp/wave9-qa-api-smoke.json` 생성
  - `cd apps/frontend && npm run build`
  - `VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8030 npm run dev -- --host 127.0.0.1 --port 5199 --strictPort`
  - frontend route smoke script: project/source/profile/job/candidates/evidence routes 15개 HTTP 200 SPA 응답 확인
  - Browser evidence capture: `/private/tmp/ontology-wave9-qa-screenshots/`
  - `NODE_PATH=/Users/hanati/.npm/_npx/365efcc0fbef4592/node_modules node /Users/hanati/.npm/_npx/365efcc0fbef4592/node_modules/@playwright/test/cli.js test wave9-confirm.spec.js --config=/private/tmp/wave9-playwright.config.js --browser=chromium --reporter=line`
- 결과:
  - Docker CLI: `command not found`
  - diff whitespace check: PASS
  - backend targeted pytest: `2 passed, 7 deselected`
  - backend ruff: PASS
  - backend full pytest: `9 passed`
  - OpenAPI export freshness: `OPENAPI_MVP2_DRAFT_FRESH`
  - frontend build: PASS
  - frontend route smoke: PASS
  - delete confirmation Playwright smoke: `1 passed`
  - browser evidence checks: PASS
    - `/private/tmp/ontology-wave9-qa-screenshots/ontology_modeler.png`
    - `/private/tmp/ontology-wave9-qa-screenshots/candidate_results.png`
    - `/private/tmp/ontology-wave9-qa-screenshots/candidate_results_invalid.png`
    - `/private/tmp/ontology-wave9-qa-screenshots/evidence_normal.png`
    - `/private/tmp/ontology-wave9-qa-screenshots/evidence_broken.png`
    - `/private/tmp/ontology-wave9-qa-screenshots/browser-checks.json`
  - delete confirmation captured messages:
    - `Delete draft class`, `Class: Keep Class (KeepClass)`, `Affected properties: 1`, `Inbound relations: 0`, `Outbound relations: 1`, draft-only copy
    - `Delete draft property`, `Property: Keep Name (keep_name)`, draft-only copy
    - `Delete draft relation`, `Relation: Keep To Source (KEEP_TO_SOURCE)`, draft-only copy
- 실행하지 못한 검증:
  - Docker Compose smoke: Docker CLI가 없어 실행 불가. 기존 환경 예외 유지.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - Wave 9에서 신규 endpoint, enum, DTO 변경은 발견되지 않았다.
  - `docs/api/openapi-mvp2-draft.json` export fresh.
  - Wave 7 sync 항목인 `SourceParseResponse`, `PromptVersion`, `CandidateEvidence`, `OntologyGraph` compatibility가 유지된다.
- 영향받는 역할:
  - Backend: 추가 contract 작업 없음
  - Frontend: 추가 type/client/mock sync 작업 없음
  - PM: source segment가 없는 broken evidence fixture의 표시 정책만 참고 가능

## Blocker
- Docker CLI가 현재 환경에 없어 Compose smoke는 `NOT RUNNABLE`.
- 제품/계약 blocker는 발견되지 않았다.

## 남은 TODO
- Compose smoke는 Docker CLI가 제공되는 환경에서 재시도한다.
- PM이 broken evidence fixture에서도 non-null `source_segment_id`가 반드시 필요하다고 판단하면 `PM/BE`에서 fixture 정책을 별도 결정한다. 현재 UI는 `Source segment` 항목을 표시하고 값이 없을 때 `-`로 fallback 처리하므로 Wave 9 blocker는 아니다.

## 다른 역할에 전달할 내용
- PM:
  - Wave 9 targeted hardening은 PASS.
  - Wave 10에서 더 넓은 MVP 2 기능 확장을 열어도 된다.
  - Docker Compose 검증은 환경 예외로 유지한다.
- Backend:
  - `BE-004`, `BE-005` 관련 delete cascade/filter/extraction exclusion은 actual smoke 기준 PASS.
  - broken evidence 404는 fallback UI 진입 조건으로 정상 동작 확인.
- Frontend:
  - `FE-005` LNB/drilldown residual gap은 이번 targeted smoke 기준 PASS.
  - `FE-014` delete confirmation 및 evidence fallback context는 PASS.
- QA:
  - 다음 wave에서는 Docker 가능 환경이 주어지면 Compose smoke를 최우선 재시도한다.
  - 넓은 MVP 2 확장 검증에서는 candidate/evidence 화면의 다중 fixture와 source profile/parse edge case를 확대하면 된다.

## 총괄에게 요청하는 결정
- Wave 10에서 더 넓은 MVP 2 기능 확장을 진행하는 것으로 승인 가능.
- 추가 contract sync wave는 현재 필요하지 않다.
- Docker CLI 부재는 계속 환경 예외로 인정할지 결정 필요.

## 현재 판정
- MVP 1 regression gate: PASS
- Wave 7 contract sync 유지: PASS
- Wave 9 targeted hardening: PASS
- Ontology delete orphan issue 해소 여부: PASS
- Delete confirmation UX 충분성: PASS
- Evidence fallback/breadcrumb context 충분성: PASS
- LNB/drilldown residual gap 해소 여부: PASS
- `INT2-002`: PASS
- support `FE-005`: PASS
- support `FE-014`: PASS
- support `BE-004`: PASS
- support `BE-005`: PASS
