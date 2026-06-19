# Backend Report - Wave 17

## 담당 범위
- backlog ID: support `BE3-006`, `BE3-007`, `BE3-008`, `BE3-010`, `INT3-003`, `INT3-004`, `INT3-006`
- 작업 경로:
  - `apps/backend/scripts/seed_mvp3.py`
  - `apps/backend/tests/test_mvp3_api.py`
  - `docs/handoffs/wave-017/BACKEND_REPORT.md`

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-017/NEXT_ORDERS.md`
  - `docs/handoffs/wave-016/QA_REPORT.md`
  - `docs/handoffs/wave-015/BACKEND_REPORT.md`
  - `apps/backend/tests/test_mvp3_api.py`
  - `apps/backend/scripts/seed_mvp1.py`
  - `apps/backend/README.md`
  - `docs/api/openapi-mvp3-draft.json`
  - `docs/backlog/INT3_MVP3_ACCEPTANCE.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`
- `apps/backend/tests/test_mvp3_api.py`의 deterministic MVP3 fixture flow를 재사용 가능한 script로 추출했다.
- `apps/backend/scripts/seed_mvp3.py`를 추가했다.
  - fixed project id: `project-corp-knowledge`
  - 기본 실행은 기존 smoke project data를 지우고 다시 seed한다.
  - `--no-reset`으로 append 실행도 가능하다.
  - `--output`으로 JSON 파일을 저장하고 stdout에도 같은 JSON을 출력한다.
- Seed data가 실제 frontend MVP3 actual API route smoke에 필요한 상태를 만든다.
  - review inbox: `review_task_count=9`
  - workbench: stable output `review_task_id`
  - publish queue: `ELIGIBLE` plus blocked reason codes
  - published graph current: relational published graph snapshot with published entity/relation facts
  - quality summary: typed metric groups and rates
- OpenAPI contract, enum, DTO, product policy는 변경하지 않았다.
- TDD red 확인 후 구현했다.
  - 처음 실행한 `tests/test_mvp3_api.py`는 `ModuleNotFoundError: No module named 'scripts.seed_mvp3'`로 실패했다.
  - helper 구현 후 focused MVP3 tests가 PASS했다.

## 변경 파일
- `apps/backend/scripts/seed_mvp3.py`
- `apps/backend/tests/test_mvp3_api.py`
- `docs/handoffs/wave-017/BACKEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp3_api.py -q`
  - `cd apps/backend && .venv/bin/ruff check scripts/seed_mvp3.py tests/test_mvp3_api.py`
  - `cd apps/backend && rm -f /tmp/ontology-wave17-mvp3-seed.db /tmp/ontology-wave17-mvp3-seed.json && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave17-mvp3-seed.db .venv/bin/alembic upgrade head && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave17-mvp3-seed.db .venv/bin/python scripts/seed_mvp3.py --output /tmp/ontology-wave17-mvp3-seed.json`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave17-mvp3-seed.db .venv/bin/python - <<'PY' ... TestClient selected API checks ... PY`
- 결과:
  - Focused MVP3 tests PASS: `4 passed in 1.60s`.
  - Ruff PASS: `All checks passed!`.
  - Fresh SQLite Alembic smoke PASS through `20260619_0004`.
  - Seed script PASS against fresh SQLite DB.
  - Selected API checks PASS:
    - `GET /api/v1/projects/project-corp-knowledge/review-tasks`: `200`, `total_count=9`
    - `GET /api/v1/review-tasks/{review_task_id}`: `200`, `candidate_kind=RELATION`
    - `GET /api/v1/projects/project-corp-knowledge/publish-candidates`: `200`, `count=14`
    - reason codes: `ALREADY_PUBLISHED`, `BROKEN_EVIDENCE`, `ELIGIBLE`, `FAILED_VALIDATION`, `MISSING_EVIDENCE`, `NEEDS_DISCUSSION`, `PENDING`, `REJECTED`, `WARNING_REASON_REQUIRED`
    - `GET /api/v1/projects/project-corp-knowledge/published-graph/current`: `200`, `entities=2`, `relations=1`
    - `GET /api/v1/projects/project-corp-knowledge/quality/summary`: `200`, `candidate_total=14`, `published_ratio=0.2143`
- Seed command:
  - `cd apps/backend`
  - `DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave17-mvp3-seed.db .venv/bin/alembic upgrade head`
  - `DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave17-mvp3-seed.db .venv/bin/python scripts/seed_mvp3.py --output /tmp/ontology-wave17-mvp3-seed.json`
- Output example:
  ```json
  {
    "project_id": "project-corp-knowledge",
    "review_task_id": "155b3597-b6a3-4e45-b75d-4b1cfeba34be",
    "publish_job_id": "fab99484-da76-4a48-b746-0871c0dbccda",
    "published_graph_version_id": "e8ad28a5-2e2d-4713-b503-6c1d193ad6f5",
    "recommended_frontend_routes": [
      "/projects/project-corp-knowledge/review",
      "/projects/project-corp-knowledge/review/155b3597-b6a3-4e45-b75d-4b1cfeba34be",
      "/projects/project-corp-knowledge/publish",
      "/projects/project-corp-knowledge/published-graph",
      "/projects/project-corp-knowledge/quality"
    ],
    "api_checks": {
      "review_task_count": 9,
      "publish_candidate_count": 14,
      "published_entity_count": 2,
      "published_relation_count": 1,
      "quality_total_candidates": 14
    }
  }
  ```
- 실행하지 못한 검증:
  - Frontend actual API route smoke는 Backend ownership 밖이라 실행하지 않았다.
  - Docker Compose/PostgreSQL smoke는 Wave17 Backend seed helper 범위 밖이며 기존 환경 예외를 유지한다.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - Product endpoint, OpenAPI artifact, enum, DTO는 변경하지 않았다.
  - `seed_mvp3.py`는 existing MVP3 API와 DB model을 사용해 deterministic smoke data만 만든다.
- 영향받는 역할:
  - Frontend: script JSON의 `project_id`, `review_task_id`, `publish_job_id`, `published_graph_version_id`, `recommended_frontend_routes`를 actual API mode smoke에 사용할 수 있다.
  - QA: script를 fresh SQLite 또는 local `DATABASE_URL`에 반복 실행해 deterministic actual API route smoke 전제조건을 만들 수 있다.

## Blocker
- Backend blocker 없음.
- 남은 cross-role blocker:
  - Frontend/QA가 이 seed output을 사용해 actual frontend route smoke를 실행해야 `INT3-003`, `INT3-004`, `INT3-006` actual API route evidence까지 닫을 수 있다.

## 남은 TODO
- Frontend:
  - `VITE_USE_MOCK_API=false`에서 seed output의 route를 사용해 MVP3 actual API route smoke를 실행한다.
- QA:
  - Fresh DB seed reproducibility와 frontend route smoke evidence를 재현한다.
- Backend:
  - 추가 제품 기능 TODO 없음.

## 다른 역할에 전달할 내용
- PM:
  - Seed/harness는 QA/dev support이며 제품 정책 변경은 없다.
- Backend:
  - `seed_mvp3.py` 기본 실행은 fixed project `project-corp-knowledge`를 reset 후 재생성한다.
  - Existing local DB에서 데이터를 누적하고 싶으면 `--no-reset`을 사용할 수 있다.
- Frontend:
  - Smoke는 JSON의 `recommended_frontend_routes`를 그대로 사용하면 된다.
  - Publish route에는 `ELIGIBLE`과 blocked reason codes가 같이 존재한다.
  - Published graph route는 published graph current API에서 `entities=2`, `relations=1`을 받는다.
- QA:
  - `/tmp/ontology-wave17-mvp3-seed.json`에 최종 seed output 예시가 남아 있다.
  - Actual API checks는 TestClient 기준 모두 `200`으로 통과했다.

## 총괄에게 요청하는 결정
- Backend seed/smoke helper를 Wave17 Backend PASS로 승인하고 Frontend/QA actual API route smoke 선행조건이 충족된 것으로 판단해도 된다.

## 현재 판정
- PASS
