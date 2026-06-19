# PM / Quality Closeout Criteria Report - Wave 22

## 담당 범위
- backlog ID:
  - `PM4-001`
  - `BE4-001`
  - `FE4-001`
  - `INT4-002`
- 작업 경로:
  - `docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  - `docs/handoffs/wave-022/PM_REPORT.md`

## 완료한 작업
- Wave22 첫 closeout target인 `INT4-002` advanced quality metric recomputation proof 기준을 정의했다.
- 7개 P0 metric group별로 numerator source, denominator source, scope, time window, breakdown dimension, precision/tolerance, drilldown target, required evidence artifact를 문서화했다.
  - `COMPLETENESS`
  - `CONSISTENCY`
  - `TRACEABILITY`
  - `VALIDATION`
  - `REVIEW`
  - `DUPLICATE`
  - `RELATION_DENSITY`
- recomputation proof 방식을 결정했다.
  - Backend가 deterministic seed/API/service data에서 authoritative JSON proof를 생성한다.
  - preferred artifact는 `/tmp/ontology-wave22-quality-proof.json`이다.
  - accepted equivalent로 `scripts/seed_mvp4.py --output ...`의 `mvp4.quality_recompute_proof` section을 허용하되, QA handoff는 standalone JSON을 preferred로 둔다.
  - Backend tests가 API metric values/rates와 independently recomputed values/rates를 비교해야 한다.
  - Frontend는 numerator, denominator, formula metadata, published graph version context, drilldown context를 가시화하지만 authoritative computation source가 아니다.
- precision/tolerance를 고정했다.
  - counts는 exact match.
  - rate/percent/ratio는 exact numerator/denominator에서 재계산한 값 기준 absolute tolerance `0.0001`.
  - deterministic P0 seed는 7개 group 모두 non-zero denominator를 포함해야 한다.
- no weighted composite quality score P0 boundary를 재확인했다.

## 변경 파일
- `docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  - `INT4-002` section에 Wave22 closeout proof standard와 P0 metric group closeout matrix를 추가했다.
- `docs/handoffs/wave-022/PM_REPORT.md`
  - 본 보고서를 작성했다.
- 수정하지 않음:
  - Backend 구현 파일
  - Frontend 구현 파일
  - `docs/pm/MVP4_PREP_BRIEF.md`

## 실행/검증
- 실행한 명령:
  - `git diff --check -- docs/backlog/INT4_MVP4_ACCEPTANCE.md docs/handoffs/wave-022/PM_REPORT.md`
  - `git diff --no-index --check /dev/null docs/backlog/INT4_MVP4_ACCEPTANCE.md`
  - `git diff --no-index --check /dev/null docs/handoffs/wave-022/PM_REPORT.md`
  - `check_output=$(git diff --no-index --check /dev/null docs/backlog/INT4_MVP4_ACCEPTANCE.md 2>&1 || true); if [ -n "$check_output" ]; then printf '%s\n' "$check_output"; exit 1; fi`
  - `check_output=$(git diff --no-index --check /dev/null docs/handoffs/wave-022/PM_REPORT.md 2>&1 || true); if [ -n "$check_output" ]; then printf '%s\n' "$check_output"; exit 1; fi`
- 결과:
  - PASS. `git diff --check` produced no whitespace errors.
  - PASS. Untracked-file `--no-index --check` wrappers produced no whitespace error output.
  - Note: direct `git diff --no-index --check /dev/null <file>` returns exit `1` for untracked files because `/dev/null` and the file differ, even when no whitespace error is printed. The wrapper above checks the actual whitespace error output.
- 실행하지 못한 검증:
  - Backend/Frontend runtime smoke는 PM criteria definition 범위가 아니어서 실행하지 않는다.

## API/Enum/DTO 변경
- 변경 여부: 없음.
- 상세:
  - API path, enum literal, DTO field를 변경하지 않았다.
  - `QualityFormulaMetadata` 필수 필드 계약은 유지했다.
  - `QualityMetricGroup` 7개 P0 literal은 유지했다.
  - `INT4-002` acceptance 기준과 proof artifact shape만 명확히 했다.
- 영향받는 역할:
  - Backend: `/tmp/ontology-wave22-quality-proof.json` 또는 동일 schema의 `mvp4.quality_recompute_proof`를 생성하고, tests로 API metric과 recomputed metric을 비교해야 한다.
  - Frontend: quality UI에 numerator/denominator/formula/version/drilldown context를 노출해야 하지만, metric recomputation의 authoritative source가 되면 안 된다.
  - QA: proof JSON parse, row completeness, tolerance comparison, drilldown context preservation, no-composite boundary를 기준으로 `INT4-002`를 재판정한다.

## Blocker
- PM criteria blocker: 없음.
- 남은 implementation blocker:
  - Backend recomputation proof artifact와 focused tests가 아직 필요하다.
  - Frontend formula/numerator/denominator/drilldown visible evidence 보강이 아직 필요하다.
  - QA rerun 전까지 `INT4-002`는 PARTIAL 상태로 유지한다.

## 남은 TODO
- Backend:
  - deterministic seed/API/service data 기반 recomputation proof 생성.
  - seven metric rows 모두 `passed=true`, exact counts, tolerance comparison 포함.
  - proof JSON parse와 backend tests를 보고서에 기록.
- Frontend:
  - UI에 numerator, denominator, formula metadata, published version, drilldown context를 visible marker/assertion으로 노출.
  - no weighted composite score marker/assertion 유지.
- QA:
  - `/tmp/ontology-wave22-quality-proof.json` 또는 seed output `mvp4.quality_recompute_proof`를 독립 검증.
  - Backend/Frontend regression guards와 함께 `INT4-002` 재판정.

## 다른 역할에 전달할 내용
- PM:
  - Scope expansion 없음. Weighted composite score, collaboration/SLA, production vector hardening, production API keys는 계속 P1/MVP5 boundary다.
- Backend:
  - Authoritative proof는 Backend 책임이다. Frontend output 또는 hand-written expected-only fixture는 `INT4-002` PASS 근거가 될 수 없다.
  - Proof row에는 numerator/denominator source, formula metadata, scope/time window, breakdown, drilldown target, required evidence artifact까지 포함해야 한다.
- Frontend:
  - UI는 recomputation proof를 계산하지 말고 사용자가 metric 신뢰성을 볼 수 있게 numerator/denominator/formula/drilldown/version context를 노출한다.
  - Composite score UI를 P0로 추가하지 않는다.
- QA:
  - Counts exact, rates/ratios tolerance `0.0001`, seven non-zero denominators, no-composite boundary, drilldown context preservation을 PASS 기준으로 사용한다.

## 총괄에게 요청하는 결정
- 추가 PM 결정 요청 없음.
- Backend/Frontend는 Wave22 `INT4-002` proof/support 구현을 진행해도 된다.

## 현재 판정
- PASS / CRITERIA READY
