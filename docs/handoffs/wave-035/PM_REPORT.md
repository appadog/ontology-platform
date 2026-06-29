# PM Report - Wave 35

## 담당 범위
- backlog ID: `PM6-019` (UI/UX review decision set). Recorded Frontend items
  `FE6-027`..`FE6-036`.
- 작업 경로: `docs/pm/UIUX_REMEDIATION_DECISIONS.md`,
  `docs/adr/0010-lnb-project-context-information-architecture.md`,
  `docs/backlog/MVP6_DRAFT_BACKLOG.md`, `docs/handoffs/wave-035/PM_REPORT.md`.
- 역할: PM/Architect, runs FIRST and BLOCKS Frontend. Every Frontend decision is
  finalized here with exact labels/order/copy so Frontend needs no follow-up.

## 완료한 작업
Produced the single decision doc `docs/pm/UIUX_REMEDIATION_DECISIONS.md` covering
every PM Action Item (P1->P3), grounded against the real routes in
`apps/frontend/src/app/router.tsx` and the current `navigation.ts` / `AppShell.tsx`:

- **D1 (P1) LNB IA** — two-zone model. Global zone = Dashboard / Projects / Admin.
  Project zone (only when a project is selected) = four ordered groups
  **Build / Review / Publish / Analyze** with exact items, display labels, and
  real routes:
  - Build: Ontology, Sources, Extraction, Candidates
  - Review: Review, Quality
  - Publish: Publish, Published Graph
  - Analyze: Search, RAG, Evaluation, Learning Insights, Benchmark, External API
  Defined no-project behavior (global zone + single muted hint, no redirect, no
  greyed groups), the single source-of-location rule (LNB = section/destination,
  one active item; in-screen tabs = sub-views; breadcrumb = authoritative path),
  per-route active-state derivation, the Candidates->`/extraction-jobs` mapping
  (no standalone candidate route exists), and the ID-bound-detail-stays-out rule.
- **D2 (P1) Dashboard value copy** — final Korean Hero headline + subline, exactly
  3 value points (후보/게시 분리, 근거 보존, 품질·개선 추적), and the first-action
  CTA `프로젝트 시작하기` -> `/projects` (+ optional 최근 프로젝트 열기).
- **D3 (P2) Copy language policy** — Korean primary; intentional-English scope =
  status enums/tokens (with Korean secondary labels) + a small set of domain nav
  terms; frozen glossary table resolving the flagged ko/en mixes (Dashboard,
  Recent activity, Ontology, RAG, etc.) with a "LNB label EN / page title KO"
  convention and a no-intra-screen-mismatch rule.
- **D4 (P2) Breadcrumb rule** — frozen `프로젝트명 > 섹션 > 항목` with a full
  per-screen mapping table; section segment == active LNB label.
- **D5 (P2) Quality priority** — 5 always-visible summary-strip KPIs (published
  readiness/freshness, Completeness, Consistency, Traceability, Validation pass
  rate); per-metric tables and class/relation breakdowns collapse into accordions
  while keeping formula/numerator/denominator evidence.
- **D6 (P3) Status-token guide** — badge = tone + icon + UPPER_SNAKE token +
  Korean secondary label; frozen tone vocabulary and a 25-row token table
  (NOT_AVAILABLE, NOT_PUBLISHED, NOT_APPLICABLE, __NONE__, etc.); also drives the
  Dashboard recent-activity badge item.

Recorded the durable LNB IA as **ADR 0010** (LNB project-context two-zone IA).
Recorded `PM6-019` and `FE6-027`..`FE6-036` in `docs/backlog/MVP6_DRAFT_BACKLOG.md`.

## 변경 파일
- `docs/pm/UIUX_REMEDIATION_DECISIONS.md` (new — the decision doc Frontend implements against)
- `docs/adr/0010-lnb-project-context-information-architecture.md` (new — durable LNB IA boundary)
- `docs/backlog/MVP6_DRAFT_BACKLOG.md` (added PM6-019 + FE6-027..FE6-036 rows)
- `docs/handoffs/wave-035/PM_REPORT.md` (this report)

## 실행/검증
- 실행한 명령: `git diff --check`
- 결과: clean (0 whitespace/conflict errors).
- `apps/` 미변경 확인 (docs만 변경).
- 실행하지 못한 검증: 없음 (PM 단계는 문서/결정만; 런타임 검증은 Frontend/QA 단계).

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세: IA + 카피 + 표현(presentation) 결정만. 모든 참조 라우트는 현재 존재함.
  상태 토큰은 API가 내보내는 enum 문자열 그대로 유지(영어 + 한국어 보조라벨).
- 영향받는 역할: Frontend (구현 참조), QA (검증 기준).

## Blocker
- 없음.

## 남은 TODO
- Frontend: `docs/pm/UIUX_REMEDIATION_DECISIONS.md`를 그대로 구현
  (FE6-027..FE6-036), 6개 해상도 반응형 재검증.
- QA: 각 P1/P2/P3 완료기준 독립 검증, LNB가 선택 프로젝트에서 MVP4-6 화면에
  도달하는지 재스크린샷, PM 결정 반영 여부 확인.

## 다른 역할에 전달할 내용
- PM: 본 결정 doc은 FROZEN. 변경 필요 시 ADR/백로그로만.
- Backend: NOT RUN. 백엔드/API/DTO/enum 변경 불필요. (해당 없음)
- Frontend: 시작 조건 충족 — `docs/pm/UIUX_REMEDIATION_DECISIONS.md`와 본 보고서를
  읽고 그대로 구현. 핵심: (1) LNB 2-zone IA = 전역(Dashboard/Projects/Admin) +
  프로젝트(Build/Review/Publish/Analyze, 정확한 항목·라벨·라우트는 §1.3); 활성
  항목 1개/라우트, 화면 내 탭은 하위뷰. (2) Dashboard Hero =
  헤드라인 "문서에서 추출한 지식을 검수·게시하고, 품질을 추적하는 온톨로지 운영
  플랫폼" + 3 value points + CTA `프로젝트 시작하기`->`/projects`. (3) 카피 1차 한국어,
  토큰은 영어+한국어 보조라벨. (4) Breadcrumb `프로젝트명 > 섹션 > 항목`. (5) Quality
  요약 5종 상단 고정 + 상세 접기. (6) 상태 토큰 badge 규칙.
- QA: 검증 기준은 결정 doc §8 요약 참조.

## 총괄에게 요청하는 결정
- 없음. 모든 항목 PM 권한 내에서 확정. ADR 0010(LNB IA)을 durable boundary로
  승인 등재. 향후 옵션(프로젝트 Admin을 5번째 "Govern" 그룹으로)은 범위 외로 남김.

## 현재 판정
- PASS (PM decision set complete; Frontend unblocked).
