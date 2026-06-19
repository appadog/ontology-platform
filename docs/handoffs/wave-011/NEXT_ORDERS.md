# Next Orders - Wave 12

## 현재 단계 판정

- Overall: `MVP 2 WAVE 11 CLOSEOUT PASS WITH EXCEPTION / FINALIZATION READY`
- MVP 1 regression gate: PASS
- Wave 7 contract sync 유지: PASS
- Wave 9 targeted hardening 유지: PASS
- Wave 10 broader local demo 유지: PASS
- Wave 11 closeout matrix:
  - `CO-01` Source profile: PASS
  - `CO-02` Source parse/chunk: PASS
  - `CO-03` Prompt version selection: PASS
  - `CO-04` Extraction job lifecycle: PASS
  - `CO-05` Fixture catalog: PASS
  - `CO-06` Retry/dedupe: PASS
  - `CO-07` Candidate/evidence browsing: PASS
  - `CO-08` Evidence traceability/fallback: PASS
  - `CO-09` Frontend navigation/browser smoke: PASS
- `INT2-001`, `INT2-002`, `INT2-003`, `INT2-004`: PASS
- Docker Compose smoke: Docker CLI 부재로 `NOT RUNNABLE`; approved P1 environment exception
- Browser smoke harness: `npm run smoke:mvp2:actual` PASS; Playwright Test suite formalization remains P1 tooling follow-up

## 총괄 결정

- MVP 2 product closeout은 `PASS WITH EXCEPTION`으로 승인한다.
- Wave 12는 신규 PM/Backend/Frontend/QA product wave가 아니다.
- Wave 12가 필요하다면 commander finalization만 수행한다.
  - `CURRENT_STATE.md` 최종화
  - closeout report/index 링크 확인
  - Docker/browser P1 follow-up 분리
  - MVP 3 planning 시작 여부를 사용자에게 확인

## 모든 역할 공통 지시

- 신규 product feature를 시작하지 않는다.
- External LLM provider, review/publish workflow, RAG, advanced PDF parsing, production auth/RBAC는 MVP 2 closeout 이후 범위다.
- Docker Compose smoke는 Docker CLI가 있는 환경에서만 재시도한다.
- Browser harness formalization은 product blocker가 아니라 follow-up이다.

## 권장 Wave 12 범위

### Commander

- Report path: `docs/handoffs/wave-012/COMMANDER_REPORT.md` 또는 총괄 final response
- 해야 할 일:
  - Wave 11 보고서와 `docs/pm/MVP2_CLOSEOUT_CHECKLIST.md`를 최종 링크한다.
  - MVP 2 closeout status를 `PASS WITH EXCEPTION`으로 고정한다.
  - P1 follow-up을 분리한다.
    - Docker Compose smoke: `BE-002`, `INT2-003`
    - Browser smoke harness formalization: `FE2-006`, `INT2-003`
  - 사용자에게 다음 선택지를 제안한다.
    - MVP 3 planning 시작
    - P1 infra/tooling hardening 먼저 수행
    - 현재 상태에서 pause/commit/review 준비

### PM

- 신규 PM 작업 없음.
- 사용자가 MVP 3 planning을 명시하면 별도 Wave 12/13 PM planning으로 시작한다.

### Backend

- 신규 Backend product hardening 없음.
- Docker CLI가 제공되는 환경에서 Compose smoke를 재시도하는 경우만 수행한다.

### Frontend

- 신규 Frontend product hardening 없음.
- Browser harness를 Playwright Test suite로 정규화하라는 별도 지시가 있을 때만 수행한다.

### QA

- 신규 QA regression 없음.
- Docker CLI가 제공되는 환경에서만 Compose smoke를 재시도한다.

## 다음 보고 위치

Wave 12는 기본적으로 commander finalization이다. 역할별 subagent를 다시 실행할 경우에만 아래 placeholder를 사용한다.

- PM: `docs/handoffs/wave-012/PM_REPORT.md`
- Backend: `docs/handoffs/wave-012/BACKEND_REPORT.md`
- Frontend: `docs/handoffs/wave-012/FRONTEND_REPORT.md`
- QA: `docs/handoffs/wave-012/QA_REPORT.md`
