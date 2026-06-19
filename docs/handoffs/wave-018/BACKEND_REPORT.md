# Backend Report - Wave 18

## 담당 범위
- backlog ID: `BE3-001`~`BE3-010`, support initial `BE4-001`~`BE4-010`
- 작업 경로:
  - `apps/backend/README.md`
  - `docs/handoffs/wave-018/BACKEND_REPORT.md`

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `01_BACKEND_AGENT_SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-018/NEXT_ORDERS.md`
  - `docs/handoffs/wave-018/PM_REPORT.md`
  - `docs/pm/MVP3_CLOSEOUT_CHECKLIST.md`
  - `docs/pm/MVP4_PREP_BRIEF.md`
  - `docs/backlog/MVP4_DRAFT_BACKLOG.md`
  - `apps/backend/README.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`
- MVP3 backend closeout regression을 실행했다.
  - focused MVP3 tests PASS.
  - full backend tests PASS.
  - ruff PASS.
  - OpenAPI export compare PASS against `docs/api/openapi-mvp3-draft.json`.
  - fresh SQLite migration plus `seed_mvp3.py` smoke PASS.
  - seeded MVP3 API sanity reads PASS for review tasks, review detail, publish candidates, published graph current, and quality summary.
- `apps/backend/README.md`에 MVP3 deterministic seed command와 focused closeout smoke/OpenAPI compare command를 짧게 추가했다.
- MVP4 backend contract implications를 runtime 구현 없이 검토했다.

## 변경 파일
- `apps/backend/README.md`
- `docs/handoffs/wave-018/BACKEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp3_api.py -q`
  - `cd apps/backend && .venv/bin/pytest`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && .venv/bin/python scripts/export_openapi.py --output /tmp/ontology-wave18-openapi-mvp3.json`
  - `cd apps/backend && cmp -s /tmp/ontology-wave18-openapi-mvp3.json ../../docs/api/openapi-mvp3-draft.json`
  - `cd apps/backend && rm -f /tmp/ontology-wave18-mvp3-seed.db /tmp/ontology-wave18-mvp3-seed.json`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave18-mvp3-seed.db .venv/bin/alembic upgrade head`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave18-mvp3-seed.db .venv/bin/python scripts/seed_mvp3.py --output /tmp/ontology-wave18-mvp3-seed.json`
  - `cd apps/backend && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave18-mvp3-seed.db .venv/bin/python - <<'PY' ... selected TestClient API reads ... PY`
  - `git diff --check -- apps/backend/README.md docs/handoffs/wave-018/BACKEND_REPORT.md`
- 결과:
  - Focused MVP3 tests PASS: `4 passed in 1.35s`.
  - Full backend tests PASS: `15 passed in 1.47s`.
  - Ruff PASS: `All checks passed!`.
  - OpenAPI export compare PASS: exported MVP3 schema matched `docs/api/openapi-mvp3-draft.json`.
  - Fresh SQLite migration PASS through `20260619_0004`.
  - `seed_mvp3.py` PASS:
    - `project_id=project-corp-knowledge`
    - `review_task_count=9`
    - `publish_candidate_count=14`
    - reason codes: `ALREADY_PUBLISHED`, `BROKEN_EVIDENCE`, `ELIGIBLE`, `FAILED_VALIDATION`, `MISSING_EVIDENCE`, `NEEDS_DISCUSSION`, `PENDING`, `REJECTED`, `WARNING_REASON_REQUIRED`
    - `published_entity_count=2`
    - `published_relation_count=1`
    - `quality_published_ratio=0.2143`
  - Selected API sanity reads PASS:
    - `GET /api/v1/projects/project-corp-knowledge/review-tasks`: `200`, `total_count=9`
    - `GET /api/v1/review-tasks/{review_task_id}`: `200`, `candidate_kind=RELATION`, `validation_status=WARNING`
    - `GET /api/v1/projects/project-corp-knowledge/publish-candidates`: `200`, `count=14`, expected reason codes present
    - `GET /api/v1/projects/project-corp-knowledge/published-graph/current`: `200`, `entities=2`, `relations=1`
    - `GET /api/v1/projects/project-corp-knowledge/quality/summary`: `200`, `candidate_total=14`, `published_ratio=0.2143`
  - `git diff --check` PASS for changed Backend README/report files.
- 실행하지 못한 검증:
  - Docker/PostgreSQL Compose smoke는 기존 P1 environment follow-up으로 유지했다.
  - Frontend route smoke는 Backend ownership 밖이며, 이번 Backend closeout에서는 실행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세:
  - Backend runtime code, model, migration, endpoint, enum, DTO, OpenAPI artifact는 변경하지 않았다.
  - README와 handoff report만 변경했다.
- 영향받는 역할:
  - Frontend: 없음.
  - QA: README의 MVP3 seed/OpenAPI commands를 closeout 재현 절차로 참조할 수 있다.

## MVP4 Backend Contract Implications / Questions
- Advanced quality metrics:
  - P0 metric DTO는 `value/rate`, numerator, denominator, scope, time window, formula metadata, and drilldown target을 모두 포함해야 한다.
  - 질문: PM이 weighted composite score를 P0로 확정할지, 아니면 explainable metric groups only로 둘지 결정이 필요하다.
- Evaluation dataset/golden set:
  - Project-scoped dataset, version/status, golden item kind, evidence refs, expected fact payload, reviewer provenance, freeze/audit fields가 필요하다.
  - 질문: golden item kind는 PM default `ENTITY`, `RELATION`, `PROPERTY_VALUE`, `EVIDENCE_LINK`로 충분한지, source segment expected extraction까지 포함할지 확인이 필요하다.
- Prompt/model performance:
  - Review outcomes, validation outcomes, correction patterns, relation/class/source type dimensions를 집계할 endpoint family가 필요하다.
  - 질문: cost/latency/token metrics를 MVP4 P0 DTO에 nullable fields로 선반영할지, provider integration 이후 P1로 둘지 결정이 필요하다.
- Keyword/search/vector/RAG:
  - Keyword search can be P0 over published graph, source, evidence, and lineage context; vector search should be an adapter boundary with deterministic local fallback if vector DB is unavailable.
  - RAG answer API must be read-only and grounded in published graph plus evidence/source chunks, with cited evidence, linked published facts, and insufficient-evidence state.
  - 질문: MVP4 P0에서 vector persistence를 DB-backed mock/local table로 둘지, pgvector/Qdrant adapter contract만 둘지 결정이 필요하다.
- Advanced graph explorer:
  - Published graph API should support n-hop expansion, class/relation filters, quality overlay, source/evidence overlay, lineage panel, and current/version selection.
  - 질문: seed graph size and max hop/depth limits need PM/QA freeze before implementation to avoid accidental large-graph scope.
- External read-only APIs:
  - External graph/source/evidence/search/RAG endpoints should preserve published graph version context and evidence refs.
  - 질문: MVP4 local/dev auth remains current dev auth, or should a minimal service-token shape be drafted without production key management?

## Blocker
- Backend blocker 없음.
- MVP3 product P0 closeout blocker 없음 from backend regression.
- Remaining accepted P1 follow-ups:
  - Docker/PostgreSQL Compose smoke in Docker-capable environment.
  - Formal Playwright suite.
  - Optional CORS expansion beyond supported local frontend port.
  - Neo4j adapter write.

## 남은 TODO
- PM:
  - MVP4 formula, dataset/golden set, vector boundary, graph depth, and external auth decisions freeze.
- Backend:
  - Wave19에서 broad runtime 구현 전에 MVP4 endpoint families, DTOs, enums, formula metadata, and OpenAPI draft를 contract-first로 작성한다.
- Frontend:
  - Backend MVP4 draft 이후 field/state/IA review를 진행한다.
- QA:
  - Wave18 Backend evidence를 closeout matrix에 반영하고, Wave19 `INT4-*` acceptance skeleton에서 deterministic seed needs를 구체화한다.

## 다른 역할에 전달할 내용
- PM:
  - Backend closeout regression is PASS; MVP3 backend has no product blocker.
  - MVP4 implementation should wait for PM freezes listed above.
- Backend:
  - `scripts/export_openapi.py` must be called with `--output` for MVP3/MVP4 artifacts because its default still points to MVP2 draft.
  - `seed_mvp3.py` remains QA/development support and resets fixed project `project-corp-knowledge` by default.
- Frontend:
  - No frontend files were touched.
  - Existing actual smoke can reuse `/tmp/ontology-wave18-mvp3-seed.json` shape if needed.
- QA:
  - Backend selected API sanity reads confirm current response shapes: review detail uses top-level `candidate_kind`; publish candidates returns a direct list with `reasons[]`.

## 총괄에게 요청하는 결정
- Backend recommends accepting MVP3 Backend closeout as `PASS`.
- Wave19 should open MVP4 contract-first Backend work, not broad MVP4 runtime implementation.

## 현재 판정
- PASS
