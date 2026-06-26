# QA / Integration Report - Wave 32

## 담당 범위
- backlog ID:
  - `INT6-017` MVP6.2 backend runtime acceptance
  - `INT6-018` MVP6.2 frontend mock/API acceptance
  - `INT6-019` MVP6.2 no-mutation guard
  - `INT6-020` Wave32 closeout recommendation
- 작업 경로:
  - `docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md` (Wave32 runtime gates 추가)
  - `docs/handoffs/wave-032/QA_REPORT.md`

## 완료한 작업
- 필수 시작 문서(AGENTS.md, handoff-reporting SKILL, CURRENT_STATE, Wave32
  NEXT_ORDERS, Wave32 PM/Backend/Frontend reports, INT6.2 acceptance, MVP6
  draft backlog, MVP6.2 API contract draft + openapi-mvp6-2-draft.json,
  REPORT_TEMPLATE)을 읽었다.
- 역할 보고를 신뢰하지 않고 backend 코드(schemas/service/router), frontend
  타입/fixtures를 직접 읽어 frozen contract 정합을 독립 검증했다.
- backend 테스트/ruff, frontend test/build, mock/actual smoke, OpenAPI 비교,
  live 결정 매트릭스(curl), DB 레벨 no-mutation 증거, 회귀 테스트를 모두 직접
  실행했다.
- commander-flagged FE/BE field-name drift가 실제로 닫혔는지 backend
  `schemas.py`와 frontend `types.ts`/`mvp6LearningFixtures.ts`를 grep+육안
  대조로 독립 확인했다.
- `docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md`에 Wave32 runtime gates
  (INT6-017..INT6-020) 섹션과 verdict, 검증 커맨드를 추가했다.
- dev server를 직접 부팅/종료하고 8000/5173 listener가 남지 않음을 확인했다.

## 변경 파일
- 수정:
  - `docs/backlog/INT6_2_ACTIVE_LEARNING_ACCEPTANCE.md`
- 생성:
  - `docs/handoffs/wave-032/QA_REPORT.md`
- Runtime code 변경: 없음 (QA 검증만 수행).

## 실행/검증

### Backend (exact commands + results)
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_2_learning_api.py -q`
  -> `7 passed in 2.06s` (PASS)
- `cd apps/backend && .venv/bin/pytest tests/test_mvp6_evaluation_api.py -q`
  -> `4 passed in 1.38s` (PASS)
- `cd apps/backend && .venv/bin/ruff check app tests scripts`
  -> `All checks passed!` (PASS)
- 회귀(additive 확인):
  - `pytest tests/test_mvp3_api.py tests/test_project_ontology_api.py -q`
    -> `15 passed` (PASS)
  - `pytest tests/test_mvp4_api.py tests/test_mvp5_api.py -q`
    -> `17 passed` (PASS)

### OpenAPI alignment
- 런타임 export: `.venv/bin/python scripts/export_openapi.py --output
  /tmp/qa-runtime-openapi.json` -> 128 paths. 5개 MVP6.2 path 모두 존재.
- draft parse: `docs/api/openapi-mvp6-2-draft.json` = OpenAPI 3.1.0,
  `0.6.2-draft`, 5 paths.
- draft 필드/enum 검증: `OntologyClassRef.ontology_class_id`,
  `OntologyRelationRef.ontology_relation_id`,
  `LearningEvidenceRef`=[locator,quote,source_id,source_segment_id] (no
  evidence_id), `AutoApprovalHistoricalOutcomeItem`=[artifact_id,outcome,reason],
  `MutationGuard` 6필드, `PromptSuggestionState`=SUGGESTED/ACCEPTED/DISMISSED/
  SUPERSEDED, `SuggestionDecisionType`=ACCEPT/DISMISS.
- runtime vs draft 34개 공유 schema 비교 -> **field-name mismatch 0건**.

### Live decision matrix (curl, against SQLite-booted backend)
- summary 200; unknown project summary 404.
- DISMISS without reason -> 400 (`DISMISS_REASON_REQUIRED`).
- ACCEPT -> 201, `SUGGESTED -> ACCEPTED`, mutation_guard **6 flags all false**.
- re-decide ACCEPTED -> 409; decide SUPERSEDED -> 409
  (`PROMPT_SUGGESTION_DECISION_CONFLICT`).
- unknown suggestion -> 404 (`PROMPT_SUGGESTION_NOT_FOUND`).

### Frontend (exact commands + results)
- `cd apps/frontend && npm run test` -> `Test Files 7 passed, Tests 19 passed`
  (6 MVP6.2 learning mock tests 포함) (PASS).
- `cd apps/frontend && npm run build` -> `✓ built in 2.13s` (PASS).
- `cd apps/frontend && npm run smoke:mvp6:learning:mock` (mock-mode Vite 부팅 후)
  -> `{status: PASS, routeCount: 6, screenshotCount: 6}`.
  artifact: `/tmp/ontology-mvp6-learning-mock-smoke/`.
- `cd apps/frontend && npm run smoke:mvp6:learning:actual` (SQLite backend +
  actual-mode Vite 부팅 후) -> `{status: PASS, apiCheckCount: 7, routeCount: 1}`.
  artifact: `/tmp/ontology-mvp6-learning-actual-smoke/`.

### No-mutation evidence (INT6-019)
- 코드 레벨: `app/modules/learning/`는 `Project`(read-only 404 guard),
  `CandidateKind` enum, errors, db session만 import. prompt/candidate/publish/
  extraction/evaluation/policy model·service import 없음. 결정 write는
  in-memory `_suggestions_by_project`만 변경.
- 런타임 데이터 레벨: live summary/list/ACCEPT/DISMISS 수행 후 SQLite의
  `published_entities`/`published_relations`/`candidate_entities`/
  `candidate_relations`/`prompt_versions` 모두 `0 rows`.
- decision response mutation_guard 6플래그 all-false (위 매트릭스).

### Housekeeping
- `git diff --check` -> 출력 없음 (exit 0, CLEAN).
- teardown 후 `lsof -nP -iTCP:8000/-iTCP:5173 -sTCP:LISTEN` -> listener 없음.

- 실행하지 못한 검증:
  - Docker/PostgreSQL Compose smoke (환경 예외, P1 follow-up 유지).

## API/Enum/DTO 변경
- 변경 여부: 없음 (QA는 검증만; runtime/contract 변경 없음).
- Findings:
  - DTO/enum/path가 frozen `openapi-mvp6-2-draft.json`과 정확히 일치
    (mismatch 0).
  - Backend가 Wave32에서 rename한 `ontology_class_id`/`ontology_relation_id`/
    `reason` 및 `LearningEvidenceRef.evidence_id` 제거가 frontend에 완전 반영됨.
  - draft의 일부 always-populated 필드가 optional로 모델링됨(required 차이).
    런타임이 항상 채워 응답하므로 freeze 위반 아님 — P1 정리 후보.

## Blocker
- 없음.

## 남은 TODO
- (P1, non-blocking) always-populated optional 필드를 draft에서 required로
  승격하여 strict-match 정렬.
- (P1, non-blocking) 전체 runtime 스냅샷 `docs/api/openapi-mvp2-draft.json`이
  learning path 미포함 stale 상태 — 별도 export-cleanup wave에서 재생성.
- (선택) permission-limited / stale-signal 실제 신호 wiring.

## 다른 역할에 전달할 내용
- PM:
  - frozen P0 loop 밖 scope leakage 없음. mutation guard all-false, non-
    SUGGESTED conflict가 runtime/UI 양쪽에서 확인됨. MVP6.2 thin slice closeout
    승인 가능.
- Backend:
  - runtime/OpenAPI/테스트 모두 PASS. P1: required 승격, mvp2 snapshot 재생성.
- Frontend:
  - mock/actual smoke, build, test 모두 PASS. FE/BE drift 0건 확인됨.
- QA:
  - 본 결과로 INT6-017..INT6-020 PASS 기록 완료.

## 총괄에게 요청하는 결정
- Wave32 MVP6.2 Active Learning thin slice를 `(a) thin-slice closeout`으로
  승인 요청. Wave33 targeted hardening은 P0 보호 목적상 불필요.
- 위 P1 follow-up(필드 required 승격, mvp2 OpenAPI 스냅샷 재생성)은 별도
  cleanup wave로 분류 요청.

## 현재 판정
- PASS
- OVERALL: `PASS` — MVP6.2 thin slice closeout 권고. INT6-017/018/019/020 모두
  PASS, blocker 없음, FE/BE drift 완전 종료, 회귀 additive-only.
