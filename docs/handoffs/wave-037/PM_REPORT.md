# PM / Design Report - Wave 37

## 담당 범위
- backlog ID: `PM6-020` (reference-driven design direction); spawns `FE6-038`~`FE6-048`
- 작업 경로: `docs/pm/DESIGN_DIRECTION_REFERENCE_UPGRADE.md`, `docs/backlog/MVP6_DRAFT_BACKLOG.md`
- 역할: PM / Product Designer. 순서상 FIRST이며 Frontend를 BLOCK함.

## 완료한 작업
- 두 레퍼런스(`wwit.design`, `ai.codle.io/kr`)의 PRINCIPLES를 내부 운영 콘솔
  맥락으로 번역한 design-direction 문서 작성. 마케팅 랜딩 구조는 채택하지 않음.
- 실제 토큰 시스템(`apps/frontend/src/shared/styles/theme.ts`)·공유 프리미티브
  (`HanaCard`/`HanaButton`/`HanaBadge`, `PageState`/`MetricCard`/`StatusBadge`,
  `AppShell`/`PageHeader`/`Breadcrumbs`)·대표 화면(Dashboard/Review Workbench/
  Benchmark Comparison)을 직접 읽고, 실제 토큰명/파일경로에 grounding함.
- 채택 원칙 7개(3-tier hierarchy, one card module, whitespace scale, one primary
  action, restrained single accent, progressive disclosure, outcome-first KO copy)를
  각각 레퍼런스 출처 + "우리에게 어떻게 적용되는가" 한 줄로 매핑.
- 기존 토큰 대비 refined token spec 작성: 실제로 빠져 있던 medium weight(현재
  `medium`이 700)와 type 중간 단계(18→28 점프)를 보강, 스타일가이드가 전제하는
  semantic surface role을 추가. 기존 토큰명은 rename 최소화.
- canonical Section+Card 모듈 spec: `HanaCard` 확장(additive props) + 중복된
  레이아웃 헬퍼 통합 방안.
- 화면 유형별 가이드(Dashboard/list/workbench/empty·loading·error) + D3 일관
  outcome-first 한국어 마이크로카피(Dashboard·Review Workbench before→after).
- P0/P1/P2 우선순위 변경 목록(FE6-038+) 각 항목에 측정가능한 완료기준 + 명시적
  out-of-scope.
- 백로그에 `PM6-020` 및 `FE6-038`~`FE6-048` 기록.

## 변경 파일
- `docs/pm/DESIGN_DIRECTION_REFERENCE_UPGRADE.md` (신규)
- `docs/backlog/MVP6_DRAFT_BACKLOG.md` (PM6-020 + FE6-038~048 행 추가)
- `docs/handoffs/wave-037/PM_REPORT.md` (본 보고서)

## 실행/검증
- 실행한 명령: `git diff --check`
- 결과: PASS (whitespace 오류 없음). 변경 파일은 docs only; `apps/` 미변경 확인
  (`git status --porcelain` 결과 docs 3개만).
- 실행하지 못한 검증: 없음. 본 역할은 문서 작성이므로 test/build 대상 아님(다음
  Frontend 단계에서 수행).

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세: 제시안은 presentation/IA/copy/token only. `ReviewDecisionType` 등 enum
  값은 그대로이고 KO 표시 라벨만 변경. 라우트/엔드포인트/DTO 무변경.
- 영향받는 역할: 없음(Backend NOT RUN).

## Blocker
- 없음.

## 남은 TODO
- Frontend가 P0(토큰·HanaCard·공유 Section 모듈) → P1(Dashboard/Review Workbench/
  list/Benchmark/empty) 순으로 구현. P2 optional.

## 다른 역할에 전달할 내용
- PM: D1-D6 frozen 결정은 재오픈하지 않음. 본 문서는 그 위에서 토큰으로 구현
  가능하게 만든 것.
- Backend: 변경 없음(NOT RUN).
- Frontend: 아래 token spec 요약 + P0/P1 변경 목록대로 구현. 모든 변경은 additive,
  token-centralized. Wave35/36 불변식 유지: 1440/1366/1280/768에서 0 horizontal
  overflow, KO page titles, D6 status badges, single active LNB.
  - Token 변경(FE6-038): `fontWeight.medium=500`/`semibold=600`/`bold=700`(현재
    medium=700/bold=800에서 재매핑), `fontSize.xl=22px` 추가 + 기존 `xl`(28px)을
    `xxl`로 rename, `spacing.section/page`, color roles `accent/accentSoft/
    surfaceInfo/Success/Warning/Danger/surfaceSelected/surfaceStrong/textOnStrong`,
    `shadow.card/none`.
  - Card 결정(FE6-039/040): `HanaCard`에 optional `eyebrow`/`action`(단일)/
    `emphasis` 추가로 확장(fork 금지); `mvp2/3/4Shared`의 중복
    `ScreenGrid/Split/Stack/CardBody/Muted/BadgeRow`를 `ui/platform/Section.tsx`+
    `Layout.tsx`로 단일화.
  - P0: FE6-038 토큰, FE6-039 HanaCard 확장, FE6-040 공유 Section/Layout.
  - P1: FE6-041 Dashboard, FE6-042 Review Workbench, FE6-043 list pages,
    FE6-044 Benchmark, FE6-045 empty states.
- QA: §6 각 완료기준 + §7 검증(test/build/5 mock smokes/0 overflow/git diff
  --check)로 검수. 원칙이 "주장만"이 아니라 실제 렌더에 적용됐는지 desktop+tablet
  spot-check.

## 총괄에게 요청하는 결정
- `fontSize.xl`(28px)→`xxl` rename vs. 무-rename 대안(`lgPlus:22px` 추가하고
  `xl:28px` 유지) 중 택일. 문서 §2.1에 두 경로 모두 명시했고 Frontend 재량으로
  두되, 어느 쪽을 택했는지 FE 보고서에 기록하도록 요청. 추가 결정 불필요.

## 현재 판정
- PASS (design-direction 문서 + 백로그 기록 완료, git diff --check PASS, apps/
  미변경). Frontend 진행 가능.
