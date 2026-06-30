# QA / Integration Report - Wave 39

## 담당 범위
- backlog ID: `INT6-035`~`INT6-038` (theme `PM6-021`; Backend `BE6-028`~`BE6-031`;
  Frontend `FE6-049`~`FE6-052`) — **QA ID correction from the PM-proposed
  `INT6-026`~`INT6-029`** (see below).
- 작업 경로 (편집한 문서만):
  - `docs/backlog/INT6_4_GOLD_SET_AUTHORING_ACCEPTANCE.md` (new — the checklist)
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md` (minimal edit — QA ID re-range)
  - `docs/handoffs/wave-039/QA_REPORT.md` (this report)
- Scope: CONTRACT-FIRST PLANNING QA ONLY for MVP6.4 Gold Set authoring + dataset
  revisioning. No `apps/`/`infra/` change. Runtime acceptance is `NOT RUNNABLE`
  by design.

## 완료한 작업
- Read all Wave39 planning artifacts (PM brief, ADR 0011, Backend API contract +
  `openapi-mvp6-4-draft.json`, Frontend UX requirements) and the three role
  reports (PM/Backend/Frontend, all PASS).
- Created the executable acceptance checklist
  `docs/backlog/INT6_4_GOLD_SET_AUTHORING_ACCEPTANCE.md` with the same verdict
  semantics as the MVP6.3 precedent (PASS/PARTIAL/FAIL/NOT RUNNABLE), a per-criterion
  table for **C1–C12 planning gates** and **R1–R12 NOT RUNNABLE runtime gates**,
  covering: the 5 endpoint families; the 5 frozen enums + 2 helper enums; the P0
  flow; reproducibility + revision immutability (`EvaluationRun.dataset_version_id`
  never rewritten); the all-false 7-flag `GoldAuthoringMutationGuard`;
  owner/admin-only authorization (`GoldAuthoringCapabilities` + `403`); import
  dry-run-first / `INCOMPATIBLE` blocked / no auto-merge; archive/freeze (no
  hard-delete); reuse of MVP6.1 shapes by `$ref`/overlay with no rename; and the
  durable invariants.
- **Recorded the Backend OPEN QUESTION (Q1, freeze-on-pin trigger timing) as an
  explicit Wave40 PM-freeze gate**, analogous to how MVP6.3's persist-vs-compute
  (C12) was a Wave34 gate. Noted the tension: the draft assumption
  (`pinned_run_count > 0 ⇒ immutable even while ACTIVE`) can yield a revision that
  is simultaneously `ACTIVE` and `is_immutable=true`, in mild tension with the
  otherwise-clean "at most one ACTIVE / FROZEN ⇒ immutable" model. It does not
  block Wave39 planning; it must be frozen before Wave40 runtime so gate R5 tests
  one rule.
- Verified PM/Backend/Frontend AGREE on the P0 flow, enums/states, source
  artifacts, safety boundary, and exclusions (C1–C11 all PASS).
- Validated the OpenAPI artifact parse + key paths/enums/mutation-guard
  assertions, and confirmed no runtime leaked under `apps/`/`infra/`.
- Applied + recorded the QA ID correction in the backlog.

## 변경 파일
- 생성:
  - `docs/backlog/INT6_4_GOLD_SET_AUTHORING_ACCEPTANCE.md`
  - `docs/handoffs/wave-039/QA_REPORT.md`
- 수정:
  - `docs/backlog/MVP6_DRAFT_BACKLOG.md` (QA ID re-range `INT6-026..029` →
    `INT6-035..038`; line 403 summary + the four QA rows + a correction note)

## ID Correction Note (backlog consistency)
- The PM report and the backlog QA rows proposed `INT6-026`~`INT6-029` for this
  theme, but `INT6-026`~`INT6-034` are **already consumed** by the closed UI/UX
  waves 35–38 (`CURRENT_STATE.md`: Wave35 `INT6-026..028`, Wave36 `INT6-029/030`,
  Wave37 `INT6-031/032`, Wave38 `INT6-033/034`).
- This theme's QA checklist therefore uses **`INT6-035`~`INT6-038`**. I edited
  `docs/backlog/MVP6_DRAFT_BACKLOG.md` (summary line + four QA rows + an explicit
  correction note) so the backlog stays consistent. PM/Backend/Frontend IDs
  (`PM6-021`, `BE6-028..031`, `FE6-049..052`) were unaffected and unchanged.

## 실행/검증
- 실행한 명령 + 결과:
  - `python3 -m json.tool docs/api/openapi-mvp6-4-draft.json > /dev/null && echo PARSE_OK`
    → `PARSE_OK`
  - schema/enum assertion (python over the draft) →
    `openapi 3.1.0 ; info.version 0.6.4-draft ; path_objects 17 ; operations 20 ;
    schemas 45 ; parameters 9`; all 5 endpoint families present; 5 frozen enums
    (`GoldItemStatus`/`DatasetRevisionStatus`/`GoldAuthoringAction`(9)/
    `GoldSetImportCompatibility`/`GoldSetImportStrategy`) exact; helper enums
    `RevisionFrozenReason`/`AuditTargetKind` exact; `GoldAuthoringMutationGuard`
    7 flags all `const:false`; `GoldAuthoringCapabilities` 7 `can_*` flags;
    key DTOs present (`DatasetRevision`, `GoldEvidence`, `DatasetAuthoringOverview`,
    `RunRevisionPin`, `GoldSetExportBundle`, `GoldSetImportReport`,
    `GoldSetImportConfirmResponse`, `GoldAuthoringAuditEntry`,
    `GoldItemAuthoringOverlay`, `GoldEntity/RelationAuthoringView`,
    `GoldSetImportIssue`); `GoldEvidenceRef` fields preserved verbatim; no new
    `EvaluationMetricName`; all 17 paths MVP6.4-additive (disjoint from MVP1–6.3).
  - `rg -n 'GoldAuthoring|DatasetRevision|GoldItemStatus|DatasetRevisionStatus|GoldSetImport|MVP6.4|mvp6.4|gold-set-author|gold-set-import|RevisionFrozenReason' apps infra --glob '!**/node_modules/**'`
    → no matches (exit 1): no MVP6.4 runtime leaked.
  - `rg -n 'GoldEvidence\b' apps --glob '!**/node_modules/**' | rg -v 'GoldEvidenceRef'`
    → no matches (exit 1): only pre-existing MVP6.1 `GoldEvidenceRef`; no
    standalone `GoldEvidence` runtime. (The broad order-specified search additionally
    matched only pre-existing MVP6.1 `GoldEvidenceRef` usages and one MVP6.3
    benchmark comment string "No run executed, no gold set authored, no graph
    mutated" — neither is MVP6.4 runtime.)
  - `git diff --check` → clean (exit 0). `git status` shows only the backlog edit
    (M) + Wave39 planning/checklist docs (untracked); no `apps/`/`infra/` change.
- 실행하지 못한 검증: all R1–R12 runtime gates are `NOT RUNNABLE` by design — no
  MVP6.4 FastAPI route / store / frontend route / seed / smoke / test exists in
  Wave39.

## API/Enum/DTO 변경
- 변경 여부: 없음 (QA는 checklist + backlog ID 정정 문서만 편집; runtime/OpenAPI/
  type 코드 변경 없음).
- 상세: planning artifacts의 enum/DTO 후보를 검증만 했다. 신규 enum 5개 + helper 2개,
  신규 DTO들, all-false 7-flag mutation guard가 OpenAPI에 존재하고 PM/BE/FE 합의와
  일치함을 확인. MVP6.1 shape rename 0건.
- 영향받는 역할: Wave40 PM/Backend/Frontend/QA.

## Blocker
- 없음 (planning 범위). 단 하나의 open item — freeze-on-pin trigger timing — 은
  Wave40 PM-freeze gate로 기록했고 Wave39 blocker가 아니다 (재현성 핵심 불변식은
  어느 ruling에서도 성립).

## 남은 TODO
- Wave40 시작 시 PM이 freeze-on-pin trigger timing을 먼저 freeze (R5가 한 규칙만
  테스트하도록).
- Wave40 thin implementation 후 R1–R12 runtime gate 실행 (ownership 403, gold
  lifecycle, revision immutability, reproducibility 불변, evidence CRUD, export/
  import dry-run/confirm gate, all-false guard data-level, audit, MVP1–6.3 regression).
- Frontend가 Wave40 구현 전 export된 OpenAPI로 필드명 최종 재확인; Optional 3건
  (gold-item kind discriminator, audit 정렬/페이지네이션, export 다운로드 계약) 확정.

## 다른 역할에 전달할 내용
- PM: freeze-on-pin trigger timing을 Wave40 시작에서 freeze해 달라 (ACTIVE-but-pinned가
  orthogonal `is_immutable` 플래그인지, 첫 pin에 FROZEN 전이인지, 또는 advisory인지).
  QA ID는 `INT6-035`~`INT6-038`로 정정됨 (backlog 반영).
- Backend: 모든 17 path가 additive/disjoint하고 enum/guard/DTO가 OpenAPI에 정확히
  존재함을 확인. Wave40에서 `EvaluationRun.dataset_version_id` write-frozen 유지,
  all-false 7-flag guard를 모든 authoring/import 응답에 노출, hard-delete 금지.
- Frontend: Blocking 8건 모두 draft에서 RESOLVED 확인; Optional 3건만 Wave40 전 확정.
  active LNB는 `Evaluation` 유지, ID-bound page를 LNB에 추가하지 말 것.
- QA(Wave40): R1–R12를 live backend(process-local store) + 실제 API mode frontend로
  실행, freeze-on-pin은 PM ruling에 맞춰 R5 단일 규칙으로 검증.

## 총괄에게 요청하는 결정
- Wave39 contract-first planning을 **PASS**로 승인하고 Wave40 thin implementation을
  열어 달라.
- Wave40 시작 게이트로 **freeze-on-pin trigger timing PM-freeze**를 명시해 달라.
- QA ID 정정(`INT6-026..029` → `INT6-035..038`)을 승인해 달라.

## 현재 판정
- **PASS** (planning). C1–C12 모두 PASS; R1–R12는 설계상 `NOT RUNNABLE` (Wave40).
  PM/Backend/Frontend 합의 일치; OpenAPI parse + 핵심 assertion OK; runtime leakage
  부재; `git diff --check` clean. 권고: **Wave40 thin implementation** (먼저
  freeze-on-pin PM-freeze gate 처리).
