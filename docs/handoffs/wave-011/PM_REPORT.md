# PM/Architecture Report - Wave 11

## 담당 범위
- backlog ID: `PM2-001`, `PM2-002`, `PM2-003`, `PM2-004`, `PM2-005`, support `INT2-001`~`INT2-004`
- 작업 경로: `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md`, `docs/pm/MVP2_PREP_BRIEF.md`, `docs/backlog/MVP2_DRAFT_BACKLOG.md`, `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`, `docs/handoffs/wave-011/PM_REPORT.md`

## 완료한 작업
- MVP 2 closeout checklist를 신규 문서 `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md`로 작성했다.
- Closeout acceptance matrix를 확정했다.
  - source profile
  - source parse/chunk
  - prompt version selection
  - extraction job lifecycle
  - fixture catalog
  - retry/dedupe
  - candidate/evidence browsing
  - evidence traceability/fallback
  - frontend navigation/browser smoke
- MVP 2 demo script를 작성했다.
  - local backend/frontend run prerequisites
  - sample data path 또는 생성 절차
  - project/draft ontology/source/profile/parse/prompt/job/candidate/evidence/retry demo steps
  - expected outcomes
- MVP 2 release-note exclusions를 정리했다.
  - external LLM provider integration
  - expert review/publish workflow
  - RAG/search over published graph
  - advanced PDF/OCR/layout parsing
  - production auth/RBAC
  - new candidate detail endpoint
  - active prompt-version mutation workflow
- Docker CLI 부재 closeout exception 정책을 확정했다.
  - Docker Compose smoke는 P1 environment gate다.
  - Docker CLI가 없으면 `PASS WITH EXCEPTION` 가능 조건을 문서화했다.
- Browser smoke tooling 임시성 exception 정책을 확정했다.
  - 임시 Playwright/headless smoke는 명령, route coverage, screenshot/log artifact가 보고되면 closeout blocker가 아니다.
- 기존 MVP 2 backlog/API/prep brief에 Wave 11 closeout 기준과 새 checklist 문서 참조를 추가했다.
- 신규 runtime endpoint/enum/DTO를 요구하지 않았다.

## 변경 파일
- `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md`
- `docs/pm/MVP2_PREP_BRIEF.md`
- `docs/backlog/MVP2_DRAFT_BACKLOG.md`
- `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
- `docs/handoffs/wave-011/PM_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `sed -n '1,220p' AGENTS.md`
  - `sed -n '1,260p' .agents/skills/handoff-reporting/SKILL.md`
  - `sed -n '1,220p' docs/handoffs/CURRENT_STATE.md`
  - `sed -n '1,220p' docs/handoffs/wave-010/NEXT_ORDERS.md`
  - `sed -n '1,260p' docs/handoffs/wave-010/PM_REPORT.md`
  - `sed -n '1,260p' docs/handoffs/wave-010/BACKEND_REPORT.md`
  - `sed -n '1,260p' docs/handoffs/wave-010/FRONTEND_REPORT.md`
  - `sed -n '1,260p' docs/handoffs/wave-010/QA_REPORT.md`
  - `sed -n '1,260p' 03_PM_AGENT_SKILL.md`
  - `sed -n '1,420p' docs/backlog/MVP2_DRAFT_BACKLOG.md`
  - `sed -n '1,560p' docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
  - `sed -n '1,420p' docs/pm/MVP2_PREP_BRIEF.md`
  - `sed -n '1,220p' docs/handoffs/REPORT_TEMPLATE.md`
  - `git diff --check -- docs/pm/MVP2_PREP_BRIEF.md docs/backlog/MVP2_DRAFT_BACKLOG.md docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
  - `git diff --check --no-index /dev/null docs/pm/MVP2_CLOSEOUT_CHECKLIST.md; code=$?; if [ "$code" -eq 1 ]; then exit 0; else exit "$code"; fi`
  - `git diff --check --no-index /dev/null docs/handoffs/wave-011/PM_REPORT.md; code=$?; if [ "$code" -eq 1 ]; then exit 0; else exit "$code"; fi`
- 결과:
  - 필수 문서와 Wave 10 보고서 확인 완료.
  - closeout checklist, acceptance matrix, demo script, release-note exclusions, exception policy 작성 완료.
  - `git diff --check` PASS for tracked edits and new files.
- 실행하지 못한 검증:
  - PM/Architecture 문서 작업이므로 backend/frontend runtime test는 실행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - 신규 runtime endpoint, enum, DTO/schema 요구 없음.
  - `docs/api/openapi-mvp2-draft.json` artifact는 수정하지 않았다.
  - closeout 기준은 기존 MVP 2 endpoint draft, fixture catalog, candidate list/evidence detail contract 위에서 동작하도록 제한했다.
  - external LLM provider, review/publish workflow, RAG, advanced PDF parsing, 신규 candidate detail endpoint, active prompt-version mutation API는 closeout 제외 범위로 명시했다.
- 영향받는 역할:
  - Backend: closeout matrix 기준으로 tests/OpenAPI/fixture/local API smoke를 안정화한다.
  - Frontend: closeout matrix 기준으로 actual API mode UX/browser smoke를 안정화한다.
  - QA: `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md` 기준으로 MVP 2 closeout verdict를 판정한다.

## Blocker
- PM/Architecture blocker 없음.
- Docker CLI 부재는 closeout exception 정책으로 분리했다.
- Browser smoke tooling 임시성은 closeout exception 정책으로 분리했다.

## 남은 TODO
- Backend:
  - closeout matrix의 backend evidence 항목을 기준으로 full pytest, ruff, OpenAPI freshness, actual API smoke를 보고한다.
  - 가능하면 demo sample/seed/helper 경로를 명확히 보고한다.
- Frontend:
  - closeout matrix의 frontend evidence 항목을 기준으로 build, actual API browser smoke, route/screenshot/log artifact를 보고한다.
  - endpoint/debug 중심 문구가 사용자 주 화면에 다시 올라오지 않는지 확인한다.
- QA:
  - `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md`의 `CO-01`~`CO-09` matrix 기준으로 closeout regression을 수행한다.
  - Docker CLI가 있으면 Compose smoke를 재시도하고, 없으면 exception 조건 충족 여부를 판정한다.

## 다른 역할에 전달할 내용
- PM:
  - Wave 11 closeout 기준 문서는 `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md`다.
- Backend:
  - 새 endpoint/enum/DTO 추가는 요구하지 않는다.
  - `docs/api/openapi-mvp2-draft.json` freshness와 fixture catalog 재현성이 closeout 핵심이다.
  - Docker 부재는 product blocker가 아니지만, local API regression은 반드시 PASS해야 한다.
- Frontend:
  - Browser smoke tooling은 임시 방식이어도 허용되지만 명령, route coverage, screenshot/log artifact를 남겨야 한다.
  - Candidate/evidence UI는 기존 list/evidence detail contract로 구성한다. 신규 candidate detail endpoint를 요구하지 않는다.
- QA:
  - closeout verdict는 `PASS`, `PASS WITH EXCEPTION`, `PARTIAL`, `FAIL` 중 하나로 판정한다.
  - Docker exception과 browser tooling exception은 product failure와 분리해 보고한다.

## 총괄에게 요청하는 결정
- QA Wave 11 결과가 모든 P0 closeout matrix를 통과하고 Docker/browser tooling만 예외로 남으면 `PASS WITH EXCEPTION`으로 MVP 2 closeout을 허용할지 최종 결정 요청.

## 현재 판정
- PASS
