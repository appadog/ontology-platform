# Frontend App

Ontology platform frontend app입니다. Vite + React + TypeScript 기반으로 app shell, routing, mock-first API boundary, Project/Ontology/Source 화면과 MVP 2 source profiling, chunk, extraction, candidate, evidence demo path를 제공합니다.

## Target Stack

- React
- TypeScript
- Vite
- styled-components
- React Router
- TanStack Query
- React Flow
- Storybook
- Vitest / Testing Library

## Required UI Package Rule

초기 UI 컴포넌트는 로컬 ZIP 복사가 아니라 `hana-style-component`를 npm dependency로 설치해서 사용합니다.

```bash
cd apps/frontend
npm install github:appadog/hana-style-component
```

업무 화면에서는 외부 패키지를 직접 import하지 않고, `src/shared/ui/hana` adapter만 import합니다.

현재 adapter는 `src/shared/ui/hana`에 있으며 업무 화면은 이 경계만 import합니다. 패키지 export 조사는 `node_modules/hana-style-component` 설치 후 adapter 내부에서만 반영합니다.

## Local Development

```bash
cd apps/frontend
npm install
npm run dev
```

기본 dev server는 `http://127.0.0.1:5173`에서 실행됩니다.

mock API가 기본값입니다. 실제 backend API로 전환할 때는 `.env`에 아래 값을 설정합니다.

```bash
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## MVP 2 Actual API Smoke

Backend와 frontend dev server를 각각 실행한 뒤 actual API browser smoke를 실행합니다. 이 smoke는 backend API에 demo data를 생성하고, 실제 frontend route를 headless browser로 열어 source profile, chunks, extraction monitor, candidate filters, normal evidence, direct missing evidence fallback을 확인합니다.

```bash
cd apps/frontend
VITE_USE_MOCK_API=false \
VITE_API_BASE_URL=http://127.0.0.1:8000 \
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

다른 터미널에서:

```bash
cd apps/frontend
MVP2_API_BASE_URL=http://127.0.0.1:8000 \
MVP2_FRONTEND_BASE_URL=http://127.0.0.1:5173 \
MVP2_SMOKE_ARTIFACT_DIR=/tmp/ontology-mvp2-frontend-smoke \
npm run smoke:mvp2:actual
```

산출물:

- `/tmp/ontology-mvp2-frontend-smoke/mvp2-actual-api-smoke.json`
- `/tmp/ontology-mvp2-frontend-smoke/source-profile.png`
- `/tmp/ontology-mvp2-frontend-smoke/source-chunks.png`
- `/tmp/ontology-mvp2-frontend-smoke/job-monitor.png`
- `/tmp/ontology-mvp2-frontend-smoke/candidate-filters.png`
- `/tmp/ontology-mvp2-frontend-smoke/evidence-normal.png`
- `/tmp/ontology-mvp2-frontend-smoke/evidence-direct-missing.png`

## Planned Structure

```text
src/
  main.tsx
  app/
    App.tsx
    router.tsx
    providers/
  pages/
  features/
    project/
    ontology/
    source/
  shared/
    api/
    ui/
      hana/
      platform/
    layout/
    hooks/
    lib/
    constants/
    styles/
    mocks/
  assets/
```

## MVP 1 Frontend Scope

- 기본 라우팅
- 앱 레이아웃: 사이드바, 상단바, 프로젝트 선택기, 페이지 헤더
- 대시보드
- 프로젝트 목록/상세
- 온톨로지 모델러 초안
- 데이터 소스 업로드/목록/미리보기
- 온톨로지 그래프 기본 시각화
- loading / empty / error 상태

현재 노출 route:

```text
/dashboard
/projects
/projects/:projectId
/ontology
/sources
/sources/:sourceId
```

## First Frontend Tasks

1. Vite + React + TypeScript 프로젝트를 생성한다.
2. styled-components ThemeProvider를 설정한다.
3. `hana-style-component` 설치와 export 조사를 수행한다.
4. `src/shared/ui/hana` adapter를 만든다.
5. OpenAPI 또는 mock fixture 기반 API client 경계를 만든다.
6. MVP 1 화면 shell과 routing을 만든다.

상세 작업은 `docs/backlog/MVP1_BACKLOG.md`를 따른다.
