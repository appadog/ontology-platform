# Design Direction — 테이블 디자인 개선 (Wave 60)

Status: `FROZEN — 구현 완료 (commander 직접 구현)`
Date: 2026-07-15
Owner: 총괄(commander) / Product Designer
Backlog ID: `PM6-040`
근거: `/deep-research` 워크플로우(세션 한도로 일부 검증 단계 실패, synthesize 이전 확정 근거 10건 확보 — 재실행 없이 그 결과로 진행)

## 0. 발견 사실

24개 이상 페이지가 raw `<table>`을 쓰고 있었지만, 그중 **15개 페이지·40회 이상**이 이미 `mvp3Shared.tsx`의 공용 `CompactTable` 래퍼를 재사용 중이었다. 즉 진짜 공용화 지점은 이미 있었고, **`CompactTable` 하나만 업그레이드하면 15개 페이지 전체가 즉시 개선**된다(wave-037/059와 동일한 토큰/프리미티브 전략).

## 1. 채택 근거 (research confirmed, high-vote)

| 값 | 출처 | 반영 |
|---|---|---|
| 표준 행 높이 44px / 헤더 36px (Supabase Data Grid) | supabase.com 디자인 시스템 | 셀 패딩 13px→14px로 소폭 상향(기존 레이아웃 유지, 과격한 변경 회피) |
| 고정(sticky) 헤더: `position:sticky; top:0; z-index:2` | Stanford ITS a11y 가이드, dev.to | `$stickyHeader` opt-in prop |
| 숫자 우측정렬/텍스트 좌측정렬 + tabular-nums | shadcn/ui DataTable, pencilandpaper.io | `[data-align="right"]` opt-in 속성 |
| 액션은 마지막 열, 주 액션 노출 + 나머지 오버플로 메뉴 | Supabase 디자인 시스템 | 기존 액션 열 위치가 이미 이 규칙과 일치 — 변경 불필요 |
| 열 너비는 콘텐츠 기준 자연폭, 반응형은 열 숨김 대신 가로 스크롤 | Supabase 디자인 시스템 | 기존 `overflow-x: auto` 유지(이미 이 패턴) |

**반박되어 채택하지 않은 것**: 특정 토큰명(`border-secondary`/`bg-surface-200`) 단정, 고정 행높이 40/48/56px 표 단정 — 대신 우리 기존 토큰(`surfaceOverlay`, `border`)과 조화되는 값을 자체 판단으로 사용.

## 2. 변경 내역 (additive, 기존 40개 사용처 회귀 없음)

`CompactTable`(`apps/frontend/src/pages/mvp3Shared.tsx`)에 항상 적용되는 변경(모든 기존 사용처에 안전):
- **행 호버 강조** — 이전엔 전무했던 가장 큰 가독성 공백. `tbody tr:hover td { background: surfaceOverlay }`.
- **헤더 톤 강화** — 배경 틴트(`surfaceOverlay`) + `font-weight: semibold(600)`.
- **컨테이너 radius** — `theme.radius.md`.
- **숫자 정렬 지원** — `[data-align="right"]`(opt-in, 기본 동작 불변).
- **고정 헤더 + 높이 제한** — `$stickyHeader`/`$maxHeight` transient prop(opt-in, 기본값 없음 → 기존 40개 사용처는 100% 동일하게 렌더).

쇼케이스 적용(3개 페이지, opt-in 속성만 추가·기존 컬럼/데이터/기능 100% 동일):
- `ReviewInboxPage.tsx` — `$stickyHeader $maxHeight="640px"` (검수 대상 목록, 길어질 수 있는 큐).
- `PublishQueuePage.tsx` — `$stickyHeader $maxHeight="640px"` (게시 후보 목록).
- `QualityDashboardPage.tsx` — `data-align="right"`을 Value/Rate(숫자) 컬럼에 적용.

## 3. 검증

```text
npm run build   -> PASS (tsc + vite)
npm run test    -> PASS (17 files / 116 tests)
git diff --check -> clean
```

실제 화면(라이브 프리뷰) 확인:
- `th` computed style: `background: rgb(238,242,247)`(surfaceOverlay) / `font-weight: 600` / `position: sticky; top:0; z-index:2` — 설계대로 적용.
- 검수 인박스: 내부 스크롤(scrollTop 200 이동)에도 헤더가 뷰포트 내 같은 위치에 고정 — 스티키 헤더 정상 동작.
- 품질 대시보드: Value/Rate 셀 `text-align: right` 확인.
- 거버넌스 보드(opt-in 속성 미적용 페이지)도 새 헤더 톤/hover/radius가 자동 적용되어 정상 렌더, 콘솔 에러 없음.
- 모바일 375px: 가로 overflow 0 유지(테이블 자체 스크롤 박스 안에 격리).

## 4. 범위 밖

- 24개 raw-table 전체를 `CompactTable`로 이관(아직 이관 안 된 나머지 raw `<table>` 페이지, 예: `SourceManagerPage`, admin 페이지들 일부)은 이번 wave 범위 밖 — 다음 하드닝 wave 후보로 기록.
- 체크박스 대량 작업 툴바(bulk action toolbar)는 `PublishQueuePage`에 이미 유사 패턴(Select eligible)이 존재해 신규 추가 없음.
- 가상화(virtualization)는 현재 데이터 규모(수십 행)에서 불필요 — 확인된 임계값(1,000행) 근처가 되면 재검토.
