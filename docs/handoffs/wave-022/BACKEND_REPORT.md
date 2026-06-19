# Backend Report - Wave 22

## 담당 범위
- backlog ID:
  - `BE4-001`
  - `INT4-002`
  - Regression guard for `INT4-001`, `INT4-003`~`INT4-008`
- 작업 경로:
  - `apps/backend/app/modules/mvp4/quality_proof.py`
  - `apps/backend/scripts/seed_mvp4.py`
  - `apps/backend/scripts/verify_mvp4_quality_metrics.py`
  - `apps/backend/tests/test_mvp4_api.py`
  - `docs/handoffs/wave-022/BACKEND_REPORT.md`

## 완료한 작업
- MVP4 advanced quality metrics의 Backend-owned deterministic recomputation proof를 추가했다.
- Preferred QA artifact `/tmp/ontology-wave22-quality-proof.json`을 생성하는 `scripts/verify_mvp4_quality_metrics.py`를 추가했다.
- `scripts/seed_mvp4.py` 출력에 accepted-equivalent section인 `mvp4.quality_recompute_proof`를 추가했다.
- proof rows가 7개 P0 group을 모두 포함하도록 했다.
  - `COMPLETENESS`
  - `CONSISTENCY`
  - `TRACEABILITY`
  - `VALIDATION`
  - `REVIEW`
  - `DUPLICATE`
  - `RELATION_DENSITY`
- 각 row에 `metric_id`, `group`, `api_rate`, `recomputed_rate`, `numerator`, `denominator`, `numerator_source`, `denominator_source`, `formula_metadata`, `scope`, `time_window`, `breakdown_dimension`, `drilldown_target`, `required_evidence_artifact`, `passed`, `tolerance`를 포함했다.
- recomputed numerator/denominator는 API 값을 복사하지 않고 DB seed state에서 별도 계산한다.
  - candidate evidence coverage
  - validation status
  - published fact lineage/evidence refs
  - review status
  - duplicate candidate bucket indicator
  - published entity/relation counts
- focused tests가 API metric rates와 independently recomputed rates를 absolute tolerance `0.0001`로 비교하도록 추가했다.
- weighted composite quality score는 추가하지 않았다.

## 변경 파일
- `apps/backend/app/modules/mvp4/quality_proof.py`
  - MVP4 quality recomputation proof builder 추가.
- `apps/backend/scripts/seed_mvp4.py`
  - `mvp4.quality_recompute_proof` 출력 section 추가.
- `apps/backend/scripts/verify_mvp4_quality_metrics.py`
  - `/tmp/ontology-wave22-quality-proof.json` 생성 스크립트 추가.
- `apps/backend/tests/test_mvp4_api.py`
  - proof schema, 7 group coverage, row pass status, API-vs-recomputed tolerance, seed proof section 테스트 추가.
- `docs/handoffs/wave-022/BACKEND_REPORT.md`
  - 본 보고서 작성.

## 실행/검증
- 실행한 명령:
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp4_api.py -q`
  - `cd apps/backend && .venv/bin/pytest tests/test_mvp3_api.py -q`
  - `cd apps/backend && .venv/bin/ruff check app tests scripts`
  - `cd apps/backend && rm -f /tmp/ontology-wave22-backend-seed.db /tmp/ontology-wave22-backend-seed.json /tmp/ontology-wave22-backend-seed.pretty.json && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave22-backend-seed.db .venv/bin/alembic upgrade head && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave22-backend-seed.db .venv/bin/python scripts/seed_mvp4.py --output /tmp/ontology-wave22-backend-seed.json && python3 -m json.tool /tmp/ontology-wave22-backend-seed.json >/tmp/ontology-wave22-backend-seed.pretty.json`
  - `cd apps/backend && rm -f /tmp/ontology-wave22-quality-proof.json /tmp/ontology-wave22-quality-proof.pretty.json && DATABASE_URL=sqlite+pysqlite:////tmp/ontology-wave22-backend-seed.db .venv/bin/python scripts/verify_mvp4_quality_metrics.py --output /tmp/ontology-wave22-quality-proof.json && python3 -m json.tool /tmp/ontology-wave22-quality-proof.json >/tmp/ontology-wave22-quality-proof.pretty.json`
  - `cd apps/backend && rm -f /tmp/ontology-wave22-backend-openapi.json /tmp/ontology-wave22-backend-openapi.pretty.json /tmp/ontology-wave22-backend-openapi-compare.json && .venv/bin/python scripts/export_openapi.py --output /tmp/ontology-wave22-backend-openapi.json && python3 -m json.tool /tmp/ontology-wave22-backend-openapi.json >/tmp/ontology-wave22-backend-openapi.pretty.json && .venv/bin/python - <<'PY' ... PY && python3 -m json.tool /tmp/ontology-wave22-backend-openapi-compare.json >/tmp/ontology-wave22-backend-openapi-compare.pretty.json`
  - `git diff --check -- apps/backend/app/modules/mvp4 apps/backend/scripts/seed_mvp4.py apps/backend/scripts/verify_mvp4_quality_metrics.py apps/backend/tests/test_mvp4_api.py docs/handoffs/wave-022/BACKEND_REPORT.md`
  - `for file in apps/backend/app/modules/mvp4/quality_proof.py apps/backend/scripts/seed_mvp4.py apps/backend/scripts/verify_mvp4_quality_metrics.py apps/backend/tests/test_mvp4_api.py docs/handoffs/wave-022/BACKEND_REPORT.md; do output=$(git diff --no-index --check /dev/null "$file" 2>&1 || true); if [ -n "$output" ]; then printf '%s\n' "$output"; exit 1; fi; done`
- 결과:
  - MVP4 focused tests: PASS, `7 passed in 2.74s`.
  - MVP3 regression tests: PASS, `4 passed in 1.85s`.
  - ruff: PASS, `All checks passed!`.
  - fresh SQLite Alembic upgrade: PASS.
  - `scripts/seed_mvp4.py` JSON parse: PASS, `/tmp/ontology-wave22-backend-seed.json`.
  - seed output proof section: PASS, `mvp4.quality_recompute_proof.metric_rows` has 7 rows and all `passed=true`.
  - standalone proof artifact JSON parse: PASS, `/tmp/ontology-wave22-quality-proof.json`.
  - standalone proof summary: project `project-corp-knowledge`, 7 metric rows, all `passed=true`.
  - Actual OpenAPI export/parse: PASS, `/tmp/ontology-wave22-backend-openapi.json`.
  - Actual OpenAPI critical compare: PASS.
    - OpenAPI `3.1.0`
    - path count `77`
    - schema count `171`
    - missing critical paths `[]`
    - missing critical schemas `[]`
    - enum mismatches `{}`
    - `QualityMetric` composite score present: `false`
  - `git diff --check`: PASS.
  - no-index whitespace check for untracked/new backend/report files: PASS.
- 실행하지 못한 검증:
  - Docker/PostgreSQL Compose smoke는 기존 P1 environment follow-up이고 이번 Backend order의 필수 실행 목록에 포함되지 않아 실행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 없음.
- 상세:
  - public FastAPI endpoint, response DTO, enum literal을 변경하지 않았다.
  - `QualityMetric`에 composite score를 추가하지 않았다.
  - proof는 seed output section과 backend QA script artifact로만 제공한다.
- 영향받는 역할:
  - PM: `INT4-002` Backend authoritative proof 기준을 충족하는 artifact가 생겼다.
  - Frontend: public API contract 변경 없음. UI는 기존 quality metric formula fields를 계속 사용하면 된다.
  - QA: `/tmp/ontology-wave22-quality-proof.json`를 preferred artifact로 검증할 수 있다.

## Blocker
- Backend blocker: 없음.
- 남은 외부 blocker:
  - Frontend Wave22 formula/numerator/denominator visible evidence와 QA 재판정은 별도 역할 완료가 필요하다.

## 남은 TODO
- QA가 `/tmp/ontology-wave22-quality-proof.json`와 seed output `mvp4.quality_recompute_proof`를 독립 검증한다.
- Frontend가 quality UI에서 numerator, denominator, formula metadata, version/drilldown context 노출을 완료하면 `INT4-002` 최종 PASS 재판정 가능성이 높다.

## 다른 역할에 전달할 내용
- PM:
  - Backend proof는 all seven P0 groups를 포함하고 no weighted composite boundary를 유지한다.
- Backend:
  - Proof builder는 API metric values를 복사하지 않고 DB seed state에서 numerator/denominator를 재계산한다.
  - Duplicate metric은 deterministic candidate duplicate bucket 존재 여부를 raw signal로 사용한다.
- Frontend:
  - API/DTO 변경은 없다. 기존 quality metrics 응답의 formula/drilldown/version context를 표시하면 된다.
- QA:
  - Preferred artifact: `/tmp/ontology-wave22-quality-proof.json`.
  - Accepted equivalent seed section: `/tmp/ontology-wave22-backend-seed.json`의 `mvp4.quality_recompute_proof`.
  - Proof tolerance: `0.0001`.

## 총괄에게 요청하는 결정
- 추가 Backend 결정 요청 없음.
- QA 검증 후 `INT4-002`를 Backend 측면 PASS 근거로 재판정해도 된다.

## 현재 판정
- PASS
