# Next Orders - Wave 11

## 현재 단계 판정

- Overall: `MVP 2 WAVE 10 BROADER LOCAL DEMO PASS / WAVE 11 CLOSEOUT PREPARATION READY`
- MVP 1 regression gate: PASS
- Wave 7 contract sync 유지: PASS
- Wave 9 targeted hardening 유지: PASS
- Wave 10 broader MVP 2 local demo: PASS
- `INT2-001`, `INT2-002`, `INT2-003`, `INT2-004`: PASS
- Docker Compose smoke: Docker CLI 부재로 `NOT RUNNABLE`, 기존 environment exception 유지

## 총괄 결정

- Wave 11은 신규 기능 확장이 아니라 MVP 2 closeout preparation wave다.
- 목표는 MVP 2를 닫기 위한 체크리스트, 회귀 매트릭스, 데모 스크립트, 로컬 실행/검증 절차, release notes, 마지막 gap list를 고정하는 것이다.
- External LLM provider, review/publish workflow, RAG, advanced PDF parsing, 신규 candidate detail endpoint, 대규모 리디자인은 열지 않는다.
- 이번 wave는 subagent 운영 리듬 검증을 겸한다.
  - PM subagent 먼저 실행
  - Backend/Frontend subagent 병렬 실행
  - QA subagent 마지막 실행
  - 총괄은 보고서 통합과 다음 wave 판단을 담당

## 모든 역할 공통 지시

- 작업 시작 전 반드시 `.agents/skills/handoff-reporting/SKILL.md`를 읽는다.
- `AGENTS.md`, `docs/handoffs/CURRENT_STATE.md`, 이 문서를 먼저 확인한다.
- 작업 종료 전 반드시 `docs/handoffs/REPORT_TEMPLATE.md` 형식으로 지정된 report path에 완료 보고서를 작성한다.
- 보고서가 없으면 작업 미완료로 판정한다.
- MVP 1 regression, Wave 7 contract sync, Wave 9 targeted hardening, Wave 10 local demo가 깨지면 즉시 중단하고 보고한다.

## 진행 순서

1. PM이 Wave 11 closeout checklist와 acceptance matrix를 확정한다.
2. Backend와 Frontend는 PM report를 읽은 뒤 병렬로 closeout 안정화 작업을 한다.
3. QA는 PM/Backend/Frontend report를 모두 읽은 뒤 closeout regression matrix를 수행한다.
4. 총괄은 QA 판정 후 MVP 2 closeout 가능 여부와 Wave 12 필요 여부를 결정한다.

## PM 지시

- Report path: `docs/handoffs/wave-011/PM_REPORT.md`
- Backlog IDs: `PM2-001`, `PM2-002`, `PM2-003`, `PM2-004`, `PM2-005`, support `INT2-001`~`INT2-004`
- 해야 할 일:
  - MVP 2 closeout checklist를 작성한다.
  - Closeout acceptance matrix를 작성한다.
    - source profile
    - source parse/chunk
    - prompt version selection
    - extraction job lifecycle
    - fixture catalog
    - retry/dedupe
    - candidate/evidence browsing
    - evidence traceability/fallback
    - frontend navigation/browser smoke
  - MVP 2 demo script를 작성한다.
    - local run prerequisites
    - sample data path 또는 생성 절차
    - demo steps
    - expected outcomes
  - MVP 2 scope exclusions를 release note 수준으로 정리한다.
    - external LLM
    - review/publish
    - RAG
    - advanced PDF parsing
    - production auth/RBAC
  - Docker CLI 부재와 browser smoke tooling 임시성에 대한 closeout exception 정책을 확정한다.
  - 필요 시 아래 문서를 갱신한다.
    - `docs/backlog/MVP2_DRAFT_BACKLOG.md`
    - `docs/pm/MVP2_PREP_BRIEF.md`
    - `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
    - 신규 closeout 문서: `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md` 또는 적절한 위치
- 제한:
  - 신규 runtime endpoint/enum/DTO를 요구하지 않는다 unless closeout blocker로 명확히 필요하다.
- 완료 기준:
  - Backend/Frontend/QA가 같은 closeout checklist와 regression matrix를 기준으로 작업할 수 있다.
  - `docs/handoffs/wave-011/PM_REPORT.md`가 작성되어 있다.

## Backend 지시

- Report path: `docs/handoffs/wave-011/BACKEND_REPORT.md`
- Backlog IDs: `BE2-001`~`BE2-009`
- 선행 조건:
  - PM Wave 11 report를 먼저 읽는다.
- 해야 할 일:
  - PM closeout checklist 기준으로 backend closeout 안정화만 수행한다.
  - API regression 재현성을 높인다.
    - fixture catalog smoke helper 또는 test 명확화
    - source profile/parse edge case tests 유지
    - retry/dedupe tests 유지
    - OpenAPI freshness command 확인
  - local demo setup 문서/스크립트가 backend 관점에서 충분한지 확인하고 필요한 작은 보완을 한다.
  - `docs/api/openapi-mvp2-draft.json` freshness를 유지한다.
  - 신규 schema 변경이 발생하면 PM/Frontend/QA에 명확히 보고한다.
- 제한:
  - 새 product feature를 열지 않는다.
  - external LLM/review/publish/RAG/advanced PDF parsing/candidate detail endpoint를 추가하지 않는다.
- 완료 기준:
  - Backend full pytest PASS.
  - Ruff PASS.
  - OpenAPI MVP2 draft freshness PASS.
  - Closeout checklist의 backend 항목 대응 완료.
  - `docs/handoffs/wave-011/BACKEND_REPORT.md`가 작성되어 있다.

## Frontend 지시

- Report path: `docs/handoffs/wave-011/FRONTEND_REPORT.md`
- Backlog IDs: `FE2-001`~`FE2-006`
- 선행 조건:
  - PM Wave 11 report를 먼저 읽는다.
- 해야 할 일:
  - PM closeout checklist 기준으로 frontend closeout 안정화만 수행한다.
  - MVP 2 demo path를 polish한다.
    - source detail/profile/chunk
    - extraction job create/monitor
    - candidate results filters
    - evidence viewer normal/missing/broken
    - top-level LNB/contextual drilldown
  - visible copy를 최종 점검한다.
    - endpoint/debug 중심 문구가 다시 사용자 주 화면에 올라오지 않게 한다.
    - CTA/status/breadcrumb/row action 중심 흐름을 유지한다.
  - browser smoke 재현성을 높인다.
    - 임시 Playwright 경로를 보고서에 명확히 남기거나
    - 가능하면 작은 QA/browser smoke script 문서를 추가한다.
  - actual API mode smoke를 수행한다.
- 제한:
  - 대규모 visual redesign은 하지 않는다.
  - review/publish/external LLM/RAG UI는 추가하지 않는다.
- 완료 기준:
  - `npm run build` PASS.
  - actual API mode smoke PASS.
  - browser screenshot/click smoke PASS 또는 명확한 documented fallback.
  - Closeout checklist의 frontend 항목 대응 완료.
  - `docs/handoffs/wave-011/FRONTEND_REPORT.md`가 작성되어 있다.

## QA 지시

- Report path: `docs/handoffs/wave-011/QA_REPORT.md`
- Backlog IDs: `INT2-001`, `INT2-002`, `INT2-003`, `INT2-004`
- 선행 조건:
  - PM/Backend/Frontend wave-011 report를 먼저 읽는다.
- 해야 할 일:
  - PM closeout checklist와 acceptance matrix 기준으로 검증한다.
  - MVP 1 regression gate를 재확인한다.
  - Wave 7 contract sync 유지 확인.
  - Wave 9 targeted hardening 유지 확인.
  - Wave 10 broader local demo 유지 확인.
  - Closeout regression matrix 수행:
    - source profile
    - source parse/chunk
    - prompt version selection
    - fixture catalog
    - extraction job lifecycle
    - retry/dedupe
    - candidate/evidence browsing
    - evidence traceability/fallback
    - frontend navigation/browser smoke
  - Docker CLI가 있으면 Compose smoke를 재시도하고, 없으면 environment exception 유지 여부를 명확히 보고한다.
- 완료 기준:
  - MVP 2 closeout 가능 여부를 `PASS`, `PASS WITH EXCEPTION`, `PARTIAL`, `FAIL` 중 하나로 판정한다.
  - 남은 gap이 있으면 반드시 Backend/Frontend/PM backlog ID에 연결한다.
  - 다음 wave가 closeout 최종화인지, targeted hardening인지 제안한다.
  - `docs/handoffs/wave-011/QA_REPORT.md`가 작성되어 있다.

## 다음 보고 위치

- PM: `docs/handoffs/wave-011/PM_REPORT.md`
- Backend: `docs/handoffs/wave-011/BACKEND_REPORT.md`
- Frontend: `docs/handoffs/wave-011/FRONTEND_REPORT.md`
- QA: `docs/handoffs/wave-011/QA_REPORT.md`
