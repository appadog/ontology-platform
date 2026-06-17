# Next Orders - Wave 6

## 현재 단계 판정

- Overall: `MVP 1 APP ACCEPTANCE CLOSED / MVP 2 IMPLEMENTATION KICKOFF READY`
- `INT-001`: PASS with Docker environment exception
- `INT-003`: PASS
- `INT-005`: PASS with Headless Chrome/manual evidence; click automation follow-up

## 총괄 결정

- Docker CLI 부재는 MVP 1 closeout 환경 예외로 승인한다. Docker Compose smoke는 Docker가 있는 환경에서 후속 수행한다.
- Headless Chrome render evidence와 actual API write smoke를 `INT-005` UAT evidence로 수용한다.
- MVP 2 구현은 Wave 6부터 시작할 수 있다.
- Wave 6은 MVP 2 전체 구현이 아니라 `contract hardening + first thin slice`다.
- MVP 2 제외 범위는 유지한다: expert review, publish graph, RAG, automatic approval, large distributed processing.

## 모든 역할 공통 지시

- 작업 시작 전 반드시 `.agents/skills/handoff-reporting/SKILL.md`를 읽는다.
- 작업 종료 전 반드시 `docs/handoffs/REPORT_TEMPLATE.md` 형식으로 지정된 report path에 완료 보고서를 작성한다.
- 보고서가 없으면 작업 미완료로 판정한다.
- MVP 2 작업 중 MVP 1 회귀가 생기면 즉시 중단하고 보고한다.

## PM 지시

- Report path: `docs/handoffs/wave-006/PM_REPORT.md`
- Backlog IDs: `PM2-001`, `PM2-002`, `PM2-003`, `PM2-004`, `PM2-005`
- 해야 할 일:
  - MVP 2 extraction user flow를 확정한다.
  - `SourceSegment.segment_type`, `SourceProfileColumn.inferred_type`, `ExtractionJob.status`, candidate validation/review/publish status의 enum source를 확정한다.
  - Evidence policy를 확정한다.
    - candidate는 어떤 evidence를 반드시 가져야 하는가.
    - evidence 없는 candidate를 저장할 수 있다면 어떤 validation warning/error가 필요한가.
  - MockProvider deterministic fixture 기준을 정의한다.
  - `ModelRun.raw_request`/`raw_response` masking policy를 정의한다.
  - 필요한 경우 `docs/pm/GLOSSARY.md`, `docs/pm/MVP2_PREP_BRIEF.md`, `docs/backlog/MVP2_DRAFT_BACKLOG.md`, `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`를 갱신한다.
- 완료 기준:
  - Backend/Frontend/QA가 같은 enum/status/evidence 정책을 기준으로 구현할 수 있다.
  - `docs/handoffs/wave-006/PM_REPORT.md`가 작성되어 있다.

## Backend 지시

- Report path: `docs/handoffs/wave-006/BACKEND_REPORT.md`
- Backlog IDs: `BE2-001`, `BE2-002`, `BE2-003`, `BE2-004`, `BE2-005`, `BE2-006`, `BE2-007`, `BE2-009`
- 해야 할 일:
  - SourceSegment 모델과 migration을 추가한다.
  - CSV/Excel profiling API의 얇은 구현을 추가한다.
  - TXT/PDF parse/chunk API의 얇은 구현을 추가한다. 실제 고급 PDF parsing은 후속으로 두고 deterministic local behavior를 우선한다.
  - PromptTemplate/PromptVersion scaffold를 추가한다.
  - ExtractionJob/ModelRun scaffold를 추가한다.
  - LLM provider interface와 MockProvider를 추가한다.
  - CandidateEntity/CandidateRelation/CandidateEvidence persistence scaffold를 추가한다.
  - OpenAPI export를 갱신한다.
  - pytest로 deterministic fixture 기반 smoke를 추가한다.
- 제한:
  - 실제 외부 LLM provider 연동은 하지 않는다.
  - expert review/publish graph/RAG API는 추가하지 않는다.
  - 범위가 커지면 PM/총괄에게 먼저 report로 결정 요청한다.
- 완료 기준:
  - MVP 1 regression test가 계속 PASS다.
  - MVP 2 thin backend flow가 테스트로 검증된다.
  - `docs/handoffs/wave-006/BACKEND_REPORT.md`가 작성되어 있다.

## Frontend 지시

- Report path: `docs/handoffs/wave-006/FRONTEND_REPORT.md`
- Backlog IDs: `FE2-001`, `FE2-002`, `FE2-003`, `FE2-004`, `FE2-005`, `FE2-006`
- 해야 할 일:
  - MVP 2 navigation/route 초안을 추가한다.
    - source profiling
    - document chunk viewer
    - extraction job creation
    - extraction job monitor
    - candidate result view
    - evidence viewer
  - `shared/api`와 `shared/mocks`에 MVP 2 DTO/API boundary를 추가한다.
  - Backend 구현 전에도 mock으로 화면이 동작하게 하되, actual API mode 전환 지점을 명확히 둔다.
  - Wave 5 style foundation을 유지하고 새 화면을 과도한 리디자인 없이 확장한다.
  - `npm run build`를 수행한다.
- 제한:
  - expert review, publish graph, RAG 화면은 만들지 않는다.
  - 실제 LLM credential이나 외부 provider 설정 UI는 만들지 않는다.
- 완료 기준:
  - MVP 2 주요 화면이 mock/API boundary 기준으로 탐색 가능하다.
  - Backend Wave 6 OpenAPI가 준비되면 실제 API 전환 지점이 명확하다.
  - `docs/handoffs/wave-006/FRONTEND_REPORT.md`가 작성되어 있다.

## QA 지시

- Report path: `docs/handoffs/wave-006/QA_REPORT.md`
- Backlog IDs: `INT2-001`, `INT2-002`, `INT2-003`, `INT2-004`
- 선행 조건:
  - PM/Backend/Frontend wave-006 report를 먼저 읽는다.
- 해야 할 일:
  - MVP 1 regression gate를 재확인한다.
  - MVP 2 profiling contract review를 수행한다.
  - Chunk/evidence traceability 검증 항목을 만든다.
  - MockProvider deterministic fixture 검증을 수행한다.
  - ExtractionJob status transition smoke를 수행한다.
  - Docker CLI가 있으면 Compose smoke를 재시도하고, 없으면 기존 환경 예외를 유지한다.
- 완료 기준:
  - Wave 6 MVP 2 thin slice가 PASS/PARTIAL/FAIL로 명확히 판정된다.
  - `docs/handoffs/wave-006/QA_REPORT.md`가 작성되어 있다.

## 다음 보고 위치

- PM: `docs/handoffs/wave-006/PM_REPORT.md`
- Backend: `docs/handoffs/wave-006/BACKEND_REPORT.md`
- Frontend: `docs/handoffs/wave-006/FRONTEND_REPORT.md`
- QA: `docs/handoffs/wave-006/QA_REPORT.md`
