# PM/Architecture Report - Wave 5

## 담당 범위
- backlog ID: PM-006, PM-007, INT-004, MVP2 prep
- 작업 경로:
  - `docs/api/API_CONTRACT_PRIORITY_MVP1.md`
  - `docs/backlog/MVP1_BACKLOG.md`
  - `docs/backlog/INT-001_MVP1_DEMO_ACCEPTANCE.md`
  - `docs/pm/MVP2_PREP_BRIEF.md`
  - `docs/backlog/MVP2_DRAFT_BACKLOG.md`
  - `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
  - `docs/adr/`
  - `docs/handoffs/wave-005/PM_REPORT.md`

## 완료한 작업
- Wave 5 필수 문서와 handoff-reporting skill을 확인했다.
- `/api/v1/dashboard` 제외 결정을 MVP 1 API contract와 acceptance 문서에 명확히 반영했다.
  - Backend endpoint 추가 대상이 아니다.
  - Frontend actual API boundary에서 P0 API 조합 계산 또는 mock-only/P1 boundary로 처리한다.
- INT-001 full pass 기준을 갱신했다.
  - `VITE_USE_MOCK_API=false` actual FE-to-BE smoke 필요.
  - Browser click smoke 선호.
  - browser automation 불가 시 manual UAT checklist, 실행 환경, 미수행 사유, PM 예외 판정 필요.
- MVP 1 acceptance closeout checklist를 갱신했다.
  - Backend API/OpenAPI PASS와 FE/QA 남은 blocker를 분리했다.
  - MVP 1 blocker와 MVP 2 entry conditions를 별도 섹션으로 분리했다.
- MVP 2 prep 문서 3개를 검토하고 설계 검토 전용 상태를 보강했다.
  - `DRAFT / DESIGN REVIEW ONLY / DO NOT IMPLEMENT UNTIL MVP 1 ACCEPTANCE CLOSEOUT`
  - MVP 2 구현 착수 조건과 draft risk를 명시했다.
- ADR 0004를 추가해 MVP 1 closeout gate와 MVP 2 entry gate를 결정 기록으로 남겼다.

## 변경 파일
- `docs/api/API_CONTRACT_PRIORITY_MVP1.md`
- `docs/backlog/MVP1_BACKLOG.md`
- `docs/backlog/INT-001_MVP1_DEMO_ACCEPTANCE.md`
- `docs/pm/MVP2_PREP_BRIEF.md`
- `docs/backlog/MVP2_DRAFT_BACKLOG.md`
- `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
- `docs/adr/0004-mvp1-closeout-and-mvp2-entry-gate.md`
- `docs/handoffs/wave-005/PM_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `sed -n '1,260p' ...` 필수 문서 확인
  - `rg -n "dashboard|/api/v1/dashboard|INT-004|PM-006|PM-007|MVP 2|MVP2|browser|manual|UAT|closeout|Acceptance Closeout|blocker|entry" ...`
  - `rg -n "DRAFT / DESIGN REVIEW ONLY|/api/v1/dashboard|Browser click smoke|manual UAT|MVP 2 Entry|MVP 1 Acceptance Closeout|SourceSegment\\.segment_type|Implementation Hold|MVP 2 API Entry Gate" ...`
  - `python3` OpenAPI inspection for `/api/v1/dashboard`, `SourceStatus`, `SourcePreviewStatus`, `OntologyGraph.required`
  - `git diff -- docs/api/API_CONTRACT_PRIORITY_MVP1.md docs/backlog/MVP1_BACKLOG.md docs/backlog/INT-001_MVP1_DEMO_ACCEPTANCE.md docs/pm/MVP2_PREP_BRIEF.md docs/backlog/MVP2_DRAFT_BACKLOG.md docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md docs/adr/0004-mvp1-closeout-and-mvp2-entry-gate.md`
- 결과:
  - 문서에 dashboard exclusion, browser/manual UAT, MVP 1 closeout, MVP 2 entry/implementation hold 문구가 반영된 것을 확인했다.
  - `docs/api/openapi-mvp1.json`에 `/api/v1/dashboard` 없음: `False`
  - `SourceStatus`: `UPLOADED`, `PARSING`, `PARSED`, `PROFILED`, `EXTRACTION_READY`, `FAILED`
  - `SourcePreviewStatus`: `PENDING`, `READY`, `NOT_AVAILABLE`, `FAILED`
  - `OntologyGraph.required`: `version_id`, `version_status`, `nodes`, `edges`, `properties`
- 실행하지 못한 검증:
  - PM 문서 작업이므로 frontend/browser UAT, backend pytest, Docker Compose smoke는 직접 실행하지 않았다.
  - Docker Compose는 Wave 5 Backend 보고 기준 Docker CLI 부재로 별도 환경 gate가 필요하다.

## API/Enum/DTO 변경
- 변경 여부: 문서 변경 있음, runtime API/Enum/DTO 변경 없음
- 상세:
  - `/api/v1/dashboard`는 MVP 1 actual API contract에서 제외한다고 명시했다.
  - `docs/api/openapi-mvp1.json`은 변경하지 않았다.
  - `SourceStatus`, `SourcePreviewStatus`, `Cardinality`, `OntologyGraph` canonical contract는 기존 결정을 유지했다.
  - MVP 2 draft에는 implementation 전 확정이 필요한 enum/DTO risk를 추가했다.
    - `SourceSegment.segment_type`
    - `SourceProfileColumn.inferred_type`
    - `ExtractionJob.status`
    - missing evidence validation policy
    - `ModelRun.raw_request`/`raw_response` masking
- 영향받는 역할:
  - Backend: MVP 1에 dashboard endpoint를 추가하지 않는다.
  - Frontend: actual API mode에서 `/api/v1/dashboard` 호출을 제거하거나 mock-only/P1 boundary로 분리한다.
  - QA: INT-001 full pass에는 actual FE-to-BE smoke와 browser/manual UAT evidence를 요구한다.
  - PM/Architecture: MVP 2 구현 지시는 MVP 1 closeout 전까지 보류한다.

## Blocker
- MVP 1 closeout blocker:
  - Frontend actual API mode dashboard boundary 미해결: `/api/v1/dashboard` 호출 제거 필요.
  - Frontend graph compatibility nullable precision 잔여: `OntologyGraph.classes`/`relations` compatibility type 정밀도 확인 필요.
  - Ontology authoring actual API smoke 미완료.
  - Browser click smoke 또는 manual UAT evidence 미완료.
  - Docker Compose/local infra smoke는 Docker CLI 부재로 환경 blocker.
  - Frontend/QA Wave 5 report는 아직 `PENDING` 상태.

## 남은 TODO
- Frontend:
  - `/api/v1/dashboard` actual call 제거 또는 mock-only/P1 boundary 처리.
  - `OntologyGraph.classes`/`relations` nullable optional compatibility type 확인.
  - `VITE_USE_MOCK_API=false` Source flow와 Ontology authoring smoke evidence 기록.
- QA:
  - Frontend Wave 5 결과 반영 후 INT-001/INT-002/INT-003 재판정.
  - Browser click smoke 또는 manual UAT checklist evidence 기록.
- PM:
  - Frontend/QA 보고가 완료되면 MVP 1 closeout PASS/PARTIAL/exception 최종 판정 갱신.
  - MVP 2 구현 착수 여부는 closeout 이후 별도 결정.

## 다른 역할에 전달할 내용
- PM:
  - MVP 1 acceptance closeout checklist와 MVP 2 entry conditions를 분리 완료했다.
  - MVP 2 prep은 설계 검토까지만 허용하며 구현 지시는 보류한다.
- Backend:
  - `/api/v1/dashboard`는 MVP 1에 추가하지 않는다.
  - OpenAPI canonical artifact는 계속 `docs/api/openapi-mvp1.json`이다.
- Frontend:
  - actual API mode에서 `/api/v1/dashboard` 호출이 남으면 INT-003 mismatch다.
  - Dashboard summary는 P0 Project/Ontology/Source APIs로 계산하거나 mock-only/P1 boundary로 둔다.
  - INT-001 full pass에는 Source flow와 Ontology authoring actual API evidence가 필요하다.
- QA:
  - Browser click smoke가 불가하면 manual UAT checklist, 환경, not-run reason을 남겨야 한다.
  - Backend API PASS만으로 INT-001 full pass 처리하지 않는다.

## 총괄에게 요청하는 결정
- Docker CLI 부재로 compose smoke가 계속 불가능한 경우, MVP 1 closeout blocker로 유지할지 환경 예외로 승인할지 결정 필요.
- Browser automation이 계속 불가능한 경우, manual UAT evidence로 INT-001 full pass 예외를 허용할지 결정 필요.

## 현재 판정
- PASS: PM/Architecture Wave 5 문서 반영 완료
- PARTIAL: MVP 1 acceptance closeout은 Frontend/QA evidence가 남아 있어 아직 미완료
