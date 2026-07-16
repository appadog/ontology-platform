# Design Direction — AI SaaS 레퍼런스 기반 디자인 시스템 업그레이드 (Wave 59)

Status: `FROZEN — Frontend implements against this doc`
Date: 2026-07-15
Owner: 총괄(commander) / Product Designer
Backlog ID: `PM6-039`
근거: `/deep-research` 워크플로우 결과(108 서브에이전트, 출처: Vercel·Linear·shadcn/ui·Supabase·PatternFly·NN/g 공식 문서/블로그, refuted 항목 제외)

## 0. 목적과 경계

사용자 목표: "AI를 서비스하는 여러 플랫폼(참고: Vercel, Linear, shadcn 생태계, Supabase, 개발자 도구 SaaS)의 화면을 리서치해서 그대로 카피하는 형태로" 프론트엔드 디자인을 업그레이드한다. **단, 지금 있는 기능은 전부 그대로 있어야 한다.**

이 문서는 wave-037(참고사이트 2곳 기반 업그레이드)과 동일한 전략을 따른다:

- **토큰 + 공용 프리미티브만 교체한다.** 개별 페이지(50개 라우트) 코드를 다시 쓰지 않는다. `theme.ts`, `GlobalStyle.ts`, `hana/*` 어댑터, `platform/*`(PageState, StatusBadge), `layout/AppShell.tsx`를 바꾸면 이를 소비하는 모든 페이지의 룩이 일괄 갱신된다 — **라우트/API/기능 삭제 없음.**
- **Additive-only.** 기존 토큰 키(`color.primary`, `radius.md`, `shadow.soft` 등)는 값만 다듬고 이름은 유지하거나, 새 토큰을 추가한다. 기존 컴포넌트의 props/동작은 유지한다.
- 백엔드/API/DTO/enum 변경 없음.

## 1. 채택하는 원칙 (출처별 매핑)

| # | 원칙 | 출처 | 우리 프로젝트 적용 |
|---|---|---|---|
| P1 | 서페이스 레이어링(깊이 표현) | Supabase 디자인 시스템(surface-100~400) | 배경을 단일 색이 아니라 4단계(base→card→hover/modal→강조 패널)로 분리 |
| P2 | 단일 절제된 accent + 명암 대비 원칙 | Linear(accent #5e6ad2류, 다크모드 charcoal) | 기존 accent(#1d4ed8, wave-37 P5)를 유지·정제하고 페이지당 accent는 1개만 사용하는 규칙을 명문화. 다크모드는 순검정 대신 charcoal(#0f172a류) |
| P3 | base 토큰에서 파생되는 radius 스케일 | shadcn/ui(`--radius` 배수 스케일) | 단일 base(10px)에서 sm/md/lg/xl을 배수로 파생, 버튼=sm/md·카드=lg·모달=xl로 매핑 |
| P4 | 콘텐츠 폭 3단계(용도별) | Supabase 디자인 시스템 | 설정/폼=small(~720px), 리스트/테이블=default(~1200px), 그래프/코드/로그=full |
| P5 | 헤딩/본문 폰트 위계 분리 | Linear(Inter Display + Inter) | 시스템 폰트 폴백 대신 Inter를 실제 로드(self-host)하고 헤딩엔 굵기/자간으로 위계 강화 |
| P6 | 빈 상태 크기 변형(맥락별) | PatternFly(xs/small/large/xl) | `PageState`에 size variant 추가 — 카드 내부(xs), 테이블/모달(small), 풀페이지(large), 온보딩/성공(xl) |
| P7 | 대기시간 기준 로딩 차등화 + 레이아웃 모사 스켈레톤 | NN/g(1s/2-10s/10s+ 기준) | 신규 `Skeleton` 컴포넌트: 실제 테이블/카드 형태를 모사. 진행률 바는 게시/추출처럼 긴 작업에 한정 |
| P8 | 사이드바 collapse(아이콘 레일) | Vercel/Linear 계열 관행 | 데스크톱에서도 아이콘 전용 축소 모드 추가(모바일 드로어는 wave-058에서 이미 완료 — 유지) |

**반박되어 채택하지 않는 것**(리서치 검증에서 탈락): 사이드바 고정폭 16rem/18rem 단정, Linear의 특정 dark bg hex(#010102) 단정, radius 값의 고정 px 표 단정, PatternFly 4요소 고정 배치 단정. → 우리는 **스케일의 구조**만 채택하고 구체 수치는 현재 토�큰과의 정합성(기존 톤 유지)을 우선한다.

## 2. 토큰 변경 (`theme.ts`) — additive

기존 키는 값 유지(회귀 방지), 아래를 **추가**한다:

```ts
color: {
  // ...기존 유지...
  // P1 서페이스 레이어링 (surface 100~400 아이디어의 additive 버전)
  surfaceBase: "#f7f9fb",     // = 기존 surface (별칭)
  surfaceCard: "#ffffff",     // = 기존 surfaceRaised (별칭)
  surfaceOverlay: "#eef2f7",  // 호버/모달 배경 (= 기존 surfaceMuted 별칭)
  surfaceAccentPanel: "#eef4ff", // 강조 패널(단일 accent 톤과 조화되는 옅은 틴트)
},
radius: {
  // 기존 sm(6px)/md(8px) 유지 + base 파생 스케일 추가
  base: "10px",
  sm: "6px",     // 유지 (버튼 등)
  md: "8px",     // 유지 (기존 카드 등 회귀 없음)
  lg: "14px",    // = base * 1.4, 신규 대형 카드/패널용
  xl: "18px",    // = base * 1.8, 모달/시트용
},
layout: {
  contentWidth: {
    small: "720px",   // 설정/폼
    default: "1200px",// 리스트/테이블/상세
    full: "none",     // 그래프/코드/로그 — 사이드바 제외 전체 폭
  },
  sidebarWidthCollapsed: "72px", // 아이콘 레일 폭 (기존 sidebarWidth=248px 유지)
},
```

## 3. 타이포그래피 — Inter 실제 로드

- 현재 `fontFamily: "Inter, ui-sans-serif, system-ui, ..."` 이지만 **Inter 웹폰트가 실제로 로드되지 않아** 대부분 브라우저에서 system-ui로 폴백되고 있었다(확인됨: `index.html`/`GlobalStyle`에 폰트 링크/@font-face 없음).
- `@fontsource/inter`(오프라인 빌드·프록시 걱정 없는 self-hosted npm 패키지)를 추가해 실제 Inter를 로드한다. AWS 배포와도 호환(외부 CDN 의존 없음, `docs/DEPLOYMENT.md`의 빌드 안정성과 부합).
- 헤딩(h1~h3, PageHeader 타이틀)은 `font-weight: 700` + `letter-spacing: -0.01em`로 위계를 강화한다(Inter Display 별도 폰트 대신 자간/굵기로 근사 — 추가 폰트 파일 없이 동일 효과, 빌드 크기 최소화).

## 4. 컴포넌트 변경 (hana 어댑터 + platform)

- **HanaButton**: radius `sm`, 활성 accent 1개 원칙 재확인(2차 accent 금지 — 이미 wave-37 P5 규칙, 위반 없는지 재점검).
- **HanaCard**: `lg` radius 옵션 추가(기존 `md` 유지), P1 서페이스 토큰 반영.
- **PageState**(빈 상태/에러/로딩): `size` prop 추가 — `xs | sm | lg | xl` (기본값은 기존 동작과 동일하게 `sm`로 매핑해 회귀 없음).
- **신규 `Skeleton` 컴포넌트** (`src/shared/ui/platform/Skeleton.tsx`): 테이블 행/카드 형태를 모사하는 회색 블록. 리스트/테이블 로딩에서 스피너 대신 사용(단, 로딩 300ms 미만이면 표시 안 함 — NN/g 기준).
- **신규 `PageContainer`** 프리미티브: `width: small|default|full` prop으로 §2 `layout.contentWidth` 적용.

## 5. AppShell — 데스크톱 사이드바 축소(아이콘 레일)

- 데스크톱에 접기 토글 추가: 펼침(248px, 라벨+아이콘) ↔ 축소(72px, 아이콘만 + 툴팁). 상태는 `localStorage`에 저장(새로고침 유지).
- **모바일 드로어(wave-058)는 그대로 유지** — 이 변경은 데스크톱 전용 추가 기능이며 모바일 동작을 바꾸지 않는다.
- 단일 활성 LNB, 그룹 헤더(BUILD/REVIEW/PUBLISH/ANALYZE), 라우트 전체는 변경 없음.

## 6. 적용 범위 (파일 단위)

| 파일 | 변경 종류 |
|---|---|
| `apps/frontend/package.json` | `@fontsource/inter` 추가 |
| `src/shared/styles/theme.ts` | §2 토큰 additive 추가 |
| `src/shared/styles/GlobalStyle.ts` | Inter import, heading 자간/굵기 |
| `src/shared/ui/hana/HanaCard.tsx` | `lg` radius 배리언트 추가 |
| `src/shared/ui/platform/PageState.tsx` | `size` prop 추가(기존 기본값 유지) |
| `src/shared/ui/platform/Skeleton.tsx` | 신규 |
| `src/shared/layout/PageContainer.tsx` | 신규 |
| `src/shared/layout/AppShell.tsx` | 데스크톱 접기 토글(아이콘 레일), localStorage 저장 |
| 고빈도 페이지 2~3개(Dashboard, 검수 인박스 또는 후보 리스트, 게시 그래프) | `PageContainer` 폭 적용 + `Skeleton` 도입 시범 적용 (전면 롤아웃 아님 — wave-37과 동일하게 "센터피스 적용 + 프리미티브 완비") |

## 7. 범위 밖 (Out of scope)

- 다크 모드 **전체 토글 기능**(ThemeProvider가 라이트 단일 테마 — 다크 테마 전환 UI 자체는 이번 wave 범위 밖. 다크모드 관련 원칙(charcoal 배경, 단일 accent)은 향후 다크 테마 도입 시 그대로 재사용 가능하도록 토큰 이름만 준비해둔다).
- 50개 페이지 전수 리스킨(각 페이지 개별 재작성) — 프리미티브 적용으로 자동 상속되는 부분(카드/배지/버튼/여백)은 즉시 반영되지만, 페이지별 커스텀 레이아웃까지 손대지 않는다.
- 사이드바 드래그 리사이즈(가변폭) — 채택한 것은 "접기/펼치기 2단(고정폭 248/72px)"이며 자유 리사이즈는 반박된 근거(고정폭 단정)와 별개로 이번 스코프에서 제외(복잡도 대비 효용 낮음).

## 8. 완료 기준

- `npm run test`/`npm run build` PASS, `git diff --check` clean.
- 기존 라우트 50개 전부 그대로 렌더(스모크 배터리로 확인).
- 데스크톱 사이드바 접기/펼치기 동작 + 새로고침 후 상태 유지.
- 모바일 드로어(wave-058) 동작 회귀 없음, overflow 0 유지.
- Dashboard/검수/게시 그래프 등 대표 화면에서 Inter 폰트 실제 적용 확인(devtools computed font-family).
