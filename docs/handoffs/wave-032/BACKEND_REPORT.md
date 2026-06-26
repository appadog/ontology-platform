# Backend Report - Wave 32

## 담당 범위
- backlog ID:
  - `BE6-019` Learning signal runtime endpoints
  - `BE6-020` Suggestion decision audit runtime
  - `BE6-021` MVP6.2 OpenAPI export/runtime alignment
  - `BE6-022` No-mutation regression guard
- 작업 경로:
  - `apps/backend/app/modules/learning/` (schemas, service, router)
  - `apps/backend/tests/test_mvp6_2_learning_api.py`
  - `docs/handoffs/wave-032/BACKEND_REPORT.md`

## 완료한 작업
- 필수 시작 문서(AGENTS.md, handoff-reporting SKILL, CURRENT_STATE, Wave32
  NEXT_ORDERS, Wave32 PM_REPORT, REPORT_TEMPLATE, backend README, MVP6.2 API
  contract draft + frozen OpenAPI draft)를 읽고, MVP6.1 evaluation 모듈
  (`app/modules/evaluation/`) 패턴을 확인했다.
- 기존에 commit `e38fe9d`("mvp6 작업 진행중")에 포함되어 있던 MVP6.2
  learning thin slice를 frozen contract 기준으로 검증/하드닝했다. 5개
  `/api/v1` 엔드포인트, deterministic process-local store, decision audit
  runtime, mutation guard, router 등록은 이미 존재했고 기본 동작은 통과했다.
- frozen OpenAPI draft(`docs/api/openapi-mvp6-2-draft.json`, `0.6.2-draft`,
  5 paths)와 runtime schema를 비교해 **frozen freeze field-name 위반 3건을
  수정**했다:
  - `OntologyClassRef.class_id` -> `ontology_class_id`
  - `OntologyRelationRef.relation_id` -> `ontology_relation_id`
  - `AutoApprovalHistoricalOutcomeItem.explanation` -> `reason`
  - `LearningEvidenceRef`에서 frozen draft에 없는 `evidence_id` 필드 제거
- decision contract 규칙을 추가로 보강했다: `DISMISS` + `dismiss_reason_code
  == OTHER`일 때 `note`가 비어 있으면 `DECISION_NOTE_REQUIRED`(400)를
  반환한다(계약서 Error Contract의 코드와 정렬).
- focused 테스트를 3건 -> 7건으로 확장했다: OTHER 사유 note 강제,
  unknown suggestion 404, unknown project summary 404, DTO 필드명/enum이
  frozen draft와 정확히 일치하는지 비교(runtime OpenAPI vs draft).
- additive only. MVP1~MVP6.1 surface, prompt version, extraction job,
  candidate, candidate review, auto-approval policy, publish job, published
  graph는 변경하지 않았다.

## 변경 파일
- 수정:
  - `apps/backend/app/modules/learning/schemas.py` (필드명 3종 정렬,
    `evidence_id` 제거)
  - `apps/backend/app/modules/learning/service.py` (필드명 정렬,
    `DECISION_NOTE_REQUIRED` 규칙, import 추가)
  - `apps/backend/tests/test_mvp6_2_learning_api.py` (테스트 4건 추가,
    `json` import)
- 생성:
  - `docs/handoffs/wave-032/BACKEND_REPORT.md`
- 변경하지 않음(주의):
  - `apps/frontend/src/shared/api/types.ts` 는 작업 시작 시 이미
    uncommitted modified 상태였다(Frontend WIP). Backend ownership 밖이라
    편집하지 않았다. 단, 이 파일이 내 백엔드 필드명 수정과 어긋난다 →
    아래 Frontend 전달사항 참고.
  - `docs/api/openapi-mvp2-draft.json`(전체 runtime export 스냅샷)은
    learning path를 포함하지 않은 stale 상태였고, 통째로 재생성하면 MVP6.2
    범위를 넘는 대규모 diff가 발생하므로 건드리지 않았다. MVP6.2 canonical
    planning artifact는 `docs/api/openapi-mvp6-2-draft.json`이며 runtime과
    필드명/enum이 정확히 정렬됨을 확인했다.

## 실행/검증
- 실행한 명령 / 결과:
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp6_2_learning_api.py -q`
    -> `7 passed in 2.65s` (PASS)
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp6_evaluation_api.py -q`
    -> `4 passed in 1.51s` (PASS)
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
    -> `All checks passed!` (PASS)
  - OpenAPI export + compare:
    `.venv/bin/python scripts/export_openapi.py --output /tmp/runtime-final2.json`
    이후 runtime vs `docs/api/openapi-mvp6-2-draft.json` 비교:
    - 5개 MVP6.2 path 모두 runtime에 존재 (PASS)
    - 공유 schema 34개 **field-name mismatch 0건** (PASS)
    - `required` 차이는 `affected_classes`/`affected_relations`/
      `prompt_suggestion_ids`/`denominator`/`safety_notes` 등 default 보유
      필드의 optional 모델링 차이뿐이며, runtime이 항상 채워 응답한다.
      runtime-required 중 draft에 없는 필드는 0건이라 freeze 위반 아님.
  - `git diff --check` -> 출력 없음 (CLEAN, PASS)
  - dev 서버 listener 확인: `lsof -nP -iTCP:8000/-iTCP:5173 -sTCP:LISTEN`
    -> 없음 (PASS)
- 실행하지 못한 검증:
  - Frontend test/build/smoke는 Backend 범위 밖이라 수행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 있음 (frozen contract 정렬 목적의 필드명 수정)
- 상세:
  - DTO field rename (frozen OpenAPI draft와 일치시키기 위함):
    - `OntologyClassRef.class_id` -> `ontology_class_id`
    - `OntologyRelationRef.relation_id` -> `ontology_relation_id`
    - `AutoApprovalHistoricalOutcomeItem.explanation` -> `reason`
  - DTO field 제거: `LearningEvidenceRef.evidence_id` (frozen draft에 없음)
  - 신규 error 코드 사용: `DECISION_NOTE_REQUIRED` (400, DISMISS+OTHER에서
    note 누락 시). 계약서 Error Contract에 이미 정의됨.
  - enum/엔드포인트/상태머신 추가·삭제 없음. 5개 endpoint family 그대로.
- 영향받는 역할:
  - Frontend: 위 필드명 변경에 맞춰 `types.ts`/mock/client/UI를 동기화해야
    한다(아래 상세).

## Blocker
- 없음.
- 주의: `apps/frontend/src/shared/api/types.ts` (Frontend WIP, uncommitted)는
  내 백엔드 필드명 수정 이전의 옛 이름을 사용 중이라 현재 backend와 어긋난다.
  Backend ownership 밖이라 수정하지 않았고 Frontend에 위임한다.

## 남은 TODO
- Frontend: MVP6.2 `types.ts`/mock/client를 새 backend 필드명으로 동기화.
- (선택) Backend P1: frozen draft의 `required` 목록과 완전 일치시키려면
  `affected_classes`/`affected_relations`/`prompt_suggestion_ids`/
  `safety_notes` 등을 required로 승격 가능. 현재는 default 보유 + 항상 채움
  으로 동작상 동일하며 freeze 위반 아님. 굳이 필요치 않음.
- (선택) Backend P1: `docs/api/openapi-mvp2-draft.json` 전체 runtime 스냅샷이
  오래되어 learning path 미포함. 별도 export-artifact 정리 wave에서 일괄
  재생성 권장.

## 다른 역할에 전달할 내용
- PM:
  - scope 변경 없음. frozen P0 loop 안에서 deterministic thin slice만 구현.
    real LLM/fine-tuning/retraining 없음. prompt/candidate/published
    graph/policy/extraction/evaluation mutation 없음.
- Frontend:
  - 다음 4개 MVP6.2 DTO 필드명을 backend(=frozen contract)에 맞춰 수정 필요:
    1. `OntologyClassRef`: `class_id` -> `ontology_class_id`
    2. `OntologyRelationRef`: `relation_id` -> `ontology_relation_id`
    3. `LearningEvidenceRef`: `evidence_id` 필드 제거
       (`source_id`/`source_segment_id`/`locator`/`quote`만 사용)
    4. auto-approval historical outcome item: `explanation` -> `reason`
  - decision API: `DISMISS`이면 `dismiss_reason_code` 필수, `OTHER`이면
    `note`도 필수(미입력 시 400 `DECISION_NOTE_REQUIRED`). `ACCEPT`에는
    `dismiss_reason_code` 금지(400 `DISMISS_REASON_NOT_ALLOWED`).
  - non-`SUGGESTED` 상태 suggestion에 decision 시 409
    `PROMPT_SUGGESTION_DECISION_CONFLICT`. unknown suggestion은 404
    `PROMPT_SUGGESTION_NOT_FOUND`.
  - decision response의 `decision_audit_note.mutation_guard`는 6개 플래그
    모두 false(prompt_version/candidate_graph/published_graph/
    auto_approval_policy/extraction_job_started/evaluation_run_started).
    accepted suggestion을 "적용된 prompt 변경"으로 표시하지 말 것.
  - auto-approval preview는 recommendation only / not enforced / requires
    later policy approval / blocked_actions 노출(계약 그대로).
- QA:
  - acceptance gate: 5개 endpoint 200, decision 전이(ACCEPT->ACCEPTED,
    DISMISS->DISMISSED), non-SUGGESTED 409, mutation guard all-false,
    DTO/enum 필드명이 frozen draft와 일치. backend 테스트 11건(learning 7 +
    evaluation 4) 전부 PASS이며 재현 가능.
  - process-local store라 `learning_service.reset_runtime_store()` +
    `seed_mvp3(reset=True)`로 deterministic 시드된다(테스트에서 동일 패턴).

## 총괄에게 요청하는 결정
- Wave32 Backend thin slice를 `PASS`로 수용해 달라.
- Frontend WIP `types.ts`의 옛 필드명 정렬을 Frontend order로 명시해 달라
  (backend는 frozen contract에 맞춰 `ontology_class_id`/`ontology_relation_id`/
  `reason`로 정렬했고 `evidence_id`는 제거함).

## 현재 판정
- PASS
