# Frontend Report - Wave 39

## 담당 범위
- backlog ID: `FE6-049` (MVP6.4 Gold Set authoring + dataset revisioning —
  Frontend UX/API requirements, contract-first planning only)
- 작업 경로:
  - `docs/pm/MVP6_4_FRONTEND_UX_REQUIREMENTS.md`
  - `docs/handoffs/wave-039/FRONTEND_REPORT.md`

## 완료한 작업
- MVP6.4 Gold Set authoring UX/API 요구사항을 작성했다. route/component/type/
  mock/smoke 코드는 추가하지 않았다(planning only, Wave40 대기).
- **Route/IA placement (ADR 0010 준수)**: Gold Set Manager는 global LNB는 물론
  project-zone LNB에도 새 항목을 추가하지 않는다. 기존 `Evaluation` 항목 하위의
  contextual sub-view로 둔다. 부모 라우트
  `/projects/:p/evaluation-datasets/:datasetId/gold-set` + items/revisions/import
  contextual 라우트·패널. 모든 라우트에서 active LNB 항목은 `Evaluation` 유지
  (D1 §1.6). breadcrumb 섹션 세그먼트는 영문 `Evaluation`, 이후 KO
  `정답셋 관리 > 정답 항목/리비전/가져오기`.
- **Screen flow + key states**: 소유자로 데이터셋 열기 → gold item 편집/보관/복원
  → standalone Gold Evidence attach/edit → 리비전 cut(이전 리비전 FROZEN) →
  export JSON → import dry-run 호환성 리포트 → strategy 선택 후 confirm →
  기존 run의 revision pin 확인. screen별 required field를 Backend DTO에 매핑.
- **Permission boundary UX**: `owner_id`+admin만 authoring, 그 외는 read-only +
  `PERMISSION_LIMITED` 배지(D6). optimistic write 금지, capability hint로 사전
  렌더, 403은 permission-limited로 degrade.
- **Revision immutability UX**: `DatasetRevisionStatus`
  DRAFT/ACTIVE/FROZEN/ARCHIVED를 D6 배지로 표기, FROZEN/ARCHIVED는 전체
  read-only + immutable 배너 + "새 리비전 생성" 경로, 데이터셋당 ACTIVE 1개.
- **Import compatibility UX**: `GoldSetImportCompatibility`
  COMPATIBLE/WARNING/CONFLICT/INCOMPATIBLE 4-state, honest dry-run-before-confirm
  (리포트 먼저 → confirm 활성), INCOMPATIBLE은 confirm 차단, CONFLICT은 strategy
  필수, 자동 병합/자동 confirm 금지.
- **No-mutation / reproducibility 가시화**: 모든 authoring/import 응답에
  all-false `GoldAuthoringMutationGuard`(7개 플래그), run 카드에 pin한 revision +
  FROZEN 표시, "편집·리비전·보관·가져오기는 기존 실행 지표/pin을 변경하지 않는다"
  명시 copy. 게시/실행/평가/삭제 함의 copy 전면 금지.
- 닫힌 design language 적용: KO title `정답셋 관리`, Section+Card module,
  one primary action per screen, progressive disclosure, D6 status badge.
- Backend draft가 병렬 wave에서 **본 문서 작성 중 도착**하여 즉시 reconcile했다.
  draft가 신규 enum/DTO 이름 전부를 verbatim 확정(mismatch 0)하고 Blocking 8건을
  pre-answer함을 확인했다(`GoldAuthoringCapabilities` hint, `403 PERMISSION_DENIED`,
  `GoldItemAuthoringOverlay` allOf additive, `evidence_id`, `GoldSetImportStrategy`+
  `target_dataset_id`, `GoldSetImportIssue` dry-run, mutation guard 7키, FROZEN
  `409 GOLD_ITEM_IMMUTABLE`/`REVISION_FROZEN`). 잔여는 Optional 3건 + QA OpenAPI
  검증 1건.

## 변경 파일
- 생성:
  - `docs/pm/MVP6_4_FRONTEND_UX_REQUIREMENTS.md`
  - `docs/handoffs/wave-039/FRONTEND_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `git diff --check` → PASS (출력 없음).
  - 근거 확인(read-only, 변경 없음): `apps/frontend/src/shared/api/types.ts`에서
    `EvaluationDataset.owner_id`/`active_version_id`,
    `GoldEntity`/`GoldRelation`/`GoldEvidenceRef`/`EvaluationRun.dataset_version_id`
    필드명 verbatim 확인; `EvaluationDatasetStatus`=DRAFT/ACTIVE/ARCHIVED 확인.
    `EvaluationDatasetsPage.tsx`에서 기존 라우트/Breadcrumbs/PageHeader/HanaCard
    /StatusBadge 패턴 확인.
- 결과: PASS (문서 계약 한정, runtime/test/build 없음).
- 실행하지 못한 검증: Frontend requirements 문서 범위라 runtime route/component/
  type/mock/smoke/test/build는 수행하지 않는다(Wave40).

## API/Enum/DTO 변경
- 변경 여부: 없음 (runtime/OpenAPI/type 코드 변경 없음). 문서상 요구사항만 정리.
- 상세: 신규 enum 후보(`GoldItemStatus`, `DatasetRevisionStatus`,
  `GoldAuthoringAction`, `GoldSetImportCompatibility`, import strategy) 및 신규
  DTO 후보(`DatasetRevision`, standalone `GoldEvidence`, gold edit/archive/restore
  request, export bundle, import dry-run report, import confirm,
  `GoldAuthoringMutationGuard`, authoring audit entry, capability hint)는 모두 PM
  brief/ADR 0011 기준 provisional이며, MVP6.1 shape rename 0건. Backend가
  `BE6-028`에서 최종 확정.
- 영향받는 역할: Backend(`BE6-028`), QA(`INT6-026`).

## Blocker
- 없음(planning 범위 한정). Backend draft가 작성 중 도착해 reconcile 완료, Blocking
  gap 8건 모두 draft에서 해소됨(mismatch 0). Frontend 측 blocker 없음.

## 남은 TODO
Blocking 8건은 Backend draft에서 모두 RESOLVED(문서 §DTO Gap Analysis "Resolved by
the Backend draft" 참조). 잔여는 Wave40 확인용 비차단 항목:
- (Optional) gold item read/edit 응답의 kind discriminator(audit는 `target_kind`
  `GOLD_ENTITY`/`GOLD_RELATION` 사용 — 공유 라우트 편집 패널 선택용).
- (Optional) authoring-audit 정렬(newest-first)/페이지네이션.
- (Optional) export GET 다운로드 계약(JSON body+content-disposition vs signed URL).
- (QA, `INT6-026`) `docs/api/openapi-mvp6-4-draft.json` parse + MVP1–6.3 additive/
  disjoint 검증; Frontend는 Wave40 구현 전 export된 artifact로 필드명 최종 재확인.

## 다른 역할에 전달할 내용
- PM: route/IA를 기존 `Evaluation` 항목 하위 contextual sub-view로 확정함(신규 LNB
  항목 0). MVP6.4 P0가 authoring을 evaluation/analysis layer에 국한한다는 boundary를
  UI 전 화면 copy/state로 강제함.
- Backend: Blocking 8건은 draft에서 이미 RESOLVED(reconcile 확인). 남은 Optional
  3건(gold item kind discriminator, audit 정렬/페이지네이션, export 다운로드 계약)만
  Wave40 전 확정해 달라. MVP6.1 shape는 `$ref`+`GoldItemAuthoringOverlay` allOf로
  재사용(rename 0) 유지.
- Frontend: Wave40 구현 시 draft 도착 후 신규 enum/DTO 이름 재확인 → types/mock/
  query → owner-gated route는 기존 Evaluation 라우트 하위에만 추가, active LNB는
  Evaluation 유지.
- QA: PM/BE/FE가 P0 flow·enum/state·source artifact·safety boundary·exclusion에
  합의하는지; permission boundary(read-only/PERMISSION_LIMITED), revision
  immutability(FROZEN read-only), import dry-run/confirm gate(INCOMPATIBLE 차단/
  CONFLICT strategy), all-false mutation guard, run pin 불변을 acceptance에
  반영해 달라.

## 총괄에게 요청하는 결정
- Wave39 Frontend planning을 PASS로 승인해 달라. Backend draft와 reconcile 완료,
  Blocking DTO gap 8건 모두 draft에서 해소(mismatch 0)됨.
- Gold Set Manager를 신규 LNB 항목 없이 기존 `Evaluation` 하위 contextual
  sub-view로 두는 IA 결정을 확정해 달라(ADR 0010 일관).

## 현재 판정
- PASS (contract-first planning; runtime 미구현은 설계상 정상, Wave40 대기)
