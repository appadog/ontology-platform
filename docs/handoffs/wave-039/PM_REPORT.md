# PM / Architecture Report - Wave 39

## 담당 범위
- backlog ID:
  - `PM6-021` MVP6.4 Gold Set Authoring + dataset revisioning P0 scope freeze
  - (생성한 후속 ID: `BE6-028`~`BE6-031`, `FE6-049`~`FE6-052`, `INT6-026`~`INT6-029`)
- 작업 경로:
  - `docs/pm/MVP6_4_GOLD_SET_AUTHORING_BRIEF.md`
  - `docs/adr/0011-mvp6-4-gold-set-authoring-revision-immutability-boundary.md`
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`
  - `docs/handoffs/wave-039/PM_REPORT.md`

## 완료한 작업
- 다음 MVP6 theme P0로 **Gold Set authoring policy + dataset revisioning**
  (commander default; `PM6-005`/`BE6-006`/`FE6-007`)을 선택하고 contract-first
  planning으로 freeze했다. Runtime API/route/component/model/migration/seed/
  smoke/test는 열지 않았다 (Wave40 대기).
- 선택 근거를 명시했다: 이미 닫힌 MVP6.1 evaluation surface의 **마지막 미완
  P1 cluster**(전문가 ownership + edit/archive, dataset revision, standalone
  gold-evidence, import/export; `MVP6_PREP_BRIEF.md` §P1)이며 MVP6.3가 나머지
  P1(comparison/confusion/class accuracy)을 이미 닫았다. 결정적으로, 닫힌
  surface에 **hook이 이미 존재**한다 — shipped `EvaluationDataset.owner_id`/
  `active_version_id`, `EvaluationRun.dataset_version_id`(코드/`schemas.py`에서
  확인). 이 P0는 그 필드 뒤에 revision 객체 + ownership/lifecycle 정책을
  채우는 가장 작은 additive delta다. Theme-3+는 각각 새 mutation/automation
  surface와 별도 boundary가 필요해 더 크므로 제외했다.
- P0 demo flow를 확정했다: `select project -> open Gold Set Manager -> open a
  dataset as its expert owner -> edit/archive gold item -> attach/edit standalone
  Gold Evidence -> cut new dataset revision (prior becomes immutable) -> export
  bundle -> import (dry-run -> confirm as new dataset/revision) -> confirm an
  existing run still points at the revision it used`.
- 신규 enum/state를 확정했다(신규 metric name 없음, MVP6.1 shape `$ref` 재사용,
  rename 없음): `GoldItemStatus`(`DRAFT`/`ACTIVE`/`ARCHIVED`),
  `DatasetRevisionStatus`(`DRAFT`/`ACTIVE`/`FROZEN`/`ARCHIVED`),
  `GoldAuthoringAction`(9개 audit action), `GoldSetImportCompatibility`
  (`COMPATIBLE`/`WARNING`/`CONFLICT`/`INCOMPATIBLE`).
- **재현성/추적성 결정**을 freeze했다(테마의 핵심): `EvaluationRun.dataset_version_id`는
  어떤 authoring action에도 rewrite되지 않는다. gold 편집/revision cut/archive/
  import는 기존 run의 metric이나 pin을 retro-mutate하지 않는다. revision은
  newer revision activate 시점 또는 run이 pin하는 시점에 `FROZEN`(immutable)이
  되고, edit은 `DRAFT`/새 revision에만 들어가므로 옛 run은 항상 채점 당시의
  immutable snapshot으로 resolve된다. gold item/evidence는 hard delete 없이
  archive/freeze만 하므로 evidence/version traceability가 보존된다. standalone
  `GoldEvidence`는 기존 `GoldEvidenceRef`의 모든 context(sample/source/segment/
  locator/offset/quote)를 유지하고 embedded `evidence` 필드는 back-compat로 남긴다.
- safety boundary를 freeze했다: candidate/analysis-layer authoring only.
  published graph/candidate/prompt/ontology-definition mutation 없음, extraction/
  evaluation run 시작 없음, prior-run pin rewrite 없음, hard delete 없음, import은
  explicit confirm 후에만. 모든 authoring/import 응답은 all-false
  `GoldAuthoringMutationGuard`(7개 플래그)를 노출한다. authoring은 expert-owner
  (`owner_id`)/admin 한정이며 그 외 role은 read + permission state다.
- exclusion을 명시했다(real LLM, run 실행, 새 metric, MVP3/4/6.2 join, governance/
  impact/agent/connector/tenant/pack/advanced viz, concurrent-edit lock/merge,
  cross-project sharing; durable DB/Alembic는 P0 미요구·P1/P2).
- backlog에 Wave39 freeze summary + `PM6-021`/`BE6-028`~`031`/`FE6-049`~`052`/
  `INT6-026`~`029`를 기존 번호 체계를 이어 추가하고, 상단 status도 갱신했다.
- 새 durable boundary 결정(revision immutability + run-pinning)이므로 ADR
  `0011`을 기존 per-MVP boundary 패턴(0006~0010)으로 추가했다.

## 변경 파일
- 생성:
  - `docs/pm/MVP6_4_GOLD_SET_AUTHORING_BRIEF.md`
  - `docs/adr/0011-mvp6-4-gold-set-authoring-revision-immutability-boundary.md`
  - `docs/handoffs/wave-039/PM_REPORT.md`
- 수정:
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md`

## 실행/검증
- 실행한 명령:
  - `git diff --check`
  - 닫힌 MVP6.1 surface 근거 확인: `apps/backend/app/modules/evaluation/schemas.py`
    및 `docs/api/openapi-mvp6-draft.json` 조회 (read-only, 변경 없음).
- 결과:
  - `git diff --check`: PASS (출력 없음, whitespace/conflict 에러 없음).
  - 근거 확인: `EvaluationDataset`에 `owner_id`/`active_version_id`,
    `EvaluationRun`에 `dataset_version_id`가 이미 존재함을 확인하고 brief/ADR가
    이를 정확히 hook으로 재사용하도록 작성했다. `EvaluationDatasetStatus`
    (`DRAFT`/`ACTIVE`/`ARCHIVED`)와 `GoldEvidenceRef` 필드도 verbatim 재사용.
- 실행하지 못한 검증:
  - PM/Architecture 문서 범위라 backend/frontend runtime/test/OpenAPI export는
    수행하지 않는다. OpenAPI planning artifact 작성/parse는 Backend(`BE6-028`) 몫이다.

## API/Enum/DTO 변경
- 변경 여부: 있음, **문서 계약 한정** (runtime/OpenAPI/DB/route 변경 없음)
- 상세:
  - Runtime API, `docs/api/openapi-*.json`, DB model/migration, frontend
    route/component는 변경하지 않았다.
  - 신규 enum 후보를 문서상 확정: `GoldItemStatus`, `DatasetRevisionStatus`,
    `GoldAuthoringAction`, `GoldSetImportCompatibility` (+ import 전략 값
    `CREATE_NEW_DATASET`/`NEW_REVISION_OF_EXISTING`). 신규 `EvaluationMetricName`
    없음, MVP6.1 shape rename 없음.
  - 신규 DTO 후보(문서 계약): `DatasetRevision`, standalone `GoldEvidence`,
    gold edit/archive request, export bundle, import dry-run report,
    `GoldAuthoringMutationGuard`(all-false), authoring audit entry. Backend가
    `BE6-028`에서 최종 필드/이름을 확정한다.
- 영향받는 역할: Backend/Frontend/QA (아래 전달 내용 참조).

## Blocker
- 없음.
- 주의: 작업트리에 다른 wave/역할 변경이 있을 수 있다. PM은 지정된 PM/backlog/
  ADR/handoff 문서만 편집했고 다른 변경을 되돌리거나 덮어쓰지 않았다.

## 남은 TODO
- Backend(`BE6-028`~`BE6-031`): contract draft + `openapi-mvp6-4-draft.json`
  (additive, OpenAPI 3.1.0). revision freeze trigger 정확한 시점, import 전략
  enum 이름 등 open question 명시.
- Frontend(`FE6-049`~`FE6-052`): Gold Set Manager route/IA, 편집/archive/evidence/
  revision/import/export/run-pin 상태 요구사항, DTO gap. route/component/type/
  mock/smoke 코드 없음.
- QA(`INT6-026`~`INT6-029`): executable acceptance checklist + 재현성/immutability
  guard + no-mutation/ownership guard + Wave40 권고.

## 다른 역할에 전달할 내용
- PM:
  - MVP6.4 P0는 candidate/analysis-layer authoring까지다. published/candidate/
    prompt/ontology-definition mutation, run 실행, prior-run pin rewrite, hard
    delete는 별도 freeze 전까지 열지 않는다.
- Backend:
  - **draft할 contract**: gold-item edit/archive/restore, standalone `GoldEvidence`
    CRUD, `DatasetRevision` create/list/activate(freeze-on-pin/freeze-on-activate),
    export bundle GET, import dry-run + confirm(strategy 포함). MVP6.1 shape는
    `$ref`로만 재사용(rename 금지). epsilon/metric은 건드리지 않는다.
  - **검토할 필드/상태**: revision FROZEN 전이의 정확한 트리거(run pin 시점 vs
    activate 시점) 동시성 처리, import 전략 enum 최종 이름, `owner_id` 권한 체크
    실패 응답(403 vs 409), all-false `GoldAuthoringMutationGuard` 7개 플래그.
  - **checklist에 넣을 것**: `EvaluationRun.dataset_version_id` 불변,
    FROZEN immutability, hard-delete 금지(archive/freeze), import 미확정 시
    무변경.
- Frontend:
  - **검토할 fields+states**: Gold Set Manager는 Evaluation/Gold Set area에
    contextual한 project-scoped 화면, global LNB에 ID-bound page 노출 금지(ADR
    0010). 편집/archive/restore, evidence attach/edit, revision cut/activate
    (FROZEN/ARCHIVED는 read-only 배지), one-ACTIVE-per-dataset, run 카드에 pin한
    revision + FROZEN 표시(basis drift 없음 가시화), import dry-run 4-state +
    strategy 선택 + INCOMPATIBLE 차단, export. loading/empty/error/permission/
    not-owner 상태 일급. 닫힌 design language(token, Section+Card, KO title,
    status badge) 적용. DTO gap을 Backend draft 대비 기록.
- QA:
  - **checklist에 넣을 것**: PM/BE/FE가 P0 flow·enum/state·source artifact·
    safety boundary·exclusion에 합의하는지; 재현성(prior run pin/metric 불변)·
    revision immutability·all-false mutation guard·ownership 게이트·import dry-run/
    confirm 게이트; OpenAPI parse/additivity; `apps/`/`infra/`에 runtime leakage
    부재. Wave40 권고.

## 총괄에게 요청하는 결정
- Wave39 PM freeze를 PASS로 승인하고 Backend/Frontend/QA가 contract-first
  planning(`BE6-028`~`031`/`FE6-049`~`052`/`INT6-026`~`029`)을 이어가도록 허용해
  달라.
- MVP6.4 P0를 expert-owned Gold Set authoring + dataset revisioning(read/write가
  evaluation/analysis layer에 국한)으로 유지하고, run 실행·real LLM·governance
  이후 테마는 별도 wave로 분리해 달라.

## 현재 판정
- PASS
