# Frontend Report - Wave 2

## 담당 범위

- Backlog IDs:
  - `FE-001`
  - `FE-002`
  - `FE-003`
  - `FE-004`
  - `FE-005`
  - `FE-009` 일부
- 작업 경로:
  - `apps/frontend`

## 완료한 작업

- `apps/frontend`에 Vite + React + TypeScript scaffold 완료.
- sidebar, topbar, project selector, page header 포함 app shell 구성.
- MVP 1 route 구성:
  - `/dashboard`
  - `/projects`
  - `/projects/:projectId`
  - `/ontology`
  - `/sources`
  - `/sources/:sourceId`
- `hana-style-component` dependency 추가.
- `src/shared/ui/hana` adapter 구성.
- 업무 화면에서는 `hana-style-component` 직접 import 없음.
- `shared/api`, `shared/mocks`, `shared/constants` 경계 구성.
- Project list/detail mock 화면 구현.
- Ontology modeler mock 초안 구현.
  - React Flow 기반 class node / relation edge 표시.
- Source list/detail + CSV/Excel preview mock 화면 구현.
- 모든 주요 화면에 loading / empty / error 상태 반영.

## 변경 파일

- `apps/frontend/package.json`
- `apps/frontend/package-lock.json`
- `apps/frontend/index.html`
- `apps/frontend/vite.config.ts`
- `apps/frontend/tsconfig.json`
- `apps/frontend/tsconfig.app.json`
- `apps/frontend/tsconfig.node.json`
- `apps/frontend/src/main.tsx`
- `apps/frontend/src/app/App.tsx`
- `apps/frontend/src/app/router.tsx`
- `apps/frontend/src/app/providers/*`
- `apps/frontend/src/pages/*`
- `apps/frontend/src/shared/api/*`
- `apps/frontend/src/shared/constants/*`
- `apps/frontend/src/shared/layout/*`
- `apps/frontend/src/shared/lib/*`
- `apps/frontend/src/shared/mocks/*`
- `apps/frontend/src/shared/styles/*`
- `apps/frontend/src/shared/ui/hana/*`
- `apps/frontend/src/shared/ui/platform/*`

## 실행/검증

- 실행한 명령:
  - `npm install --ignore-scripts`
  - `npm ls hana-style-component --depth=0`
  - `npm run build`
- 결과:
  - build 성공.
  - dev server 실행 확인: `http://127.0.0.1:5173/`
  - route smoke check:
    - `/dashboard` 200
    - `/projects` 200
    - `/ontology` 200
    - `/sources/source-policy-csv` 200
- 실행하지 못한 검증:
  - Backend OpenAPI가 아직 없어 실제 API 연동 검증은 미수행.
  - 총괄/QA 독립 재검증은 아직 미수행.

## API/Enum/DTO 변경

- Backend API 변경 없음.
- Frontend `shared/api/types.ts`에 Project/Ontology/Source DTO 경계 추가.
- enum/status는 `docs/pm/GLOSSARY.md` 문자열 기준으로 맞춤.
- Backend OpenAPI 준비 후 `shared/api/client.ts` mock을 실제 API로 전환 필요.

## 주의 사항

- `hana-style-component` GitHub dependency의 prepare/build script가 오래 걸려 `--ignore-scripts`로 설치함.
- 패키지 dist/export는 확인했고, Button은 adapter 내부에서 `hana-style-component/input` subpath로 사용 중.
- `npm audit` 기준 취약점 5건 보고됨. 현재는 upstream dependency 영역으로 판단해 MVP scaffold 범위에서는 미조치.

## Blocker

- 기능 blocker 없음.
- 운영상 주의:
  - `hana-style-component` install script 이슈.
  - Backend OpenAPI 부재로 실제 API 전환 대기.

## 남은 TODO

- Project create/edit mutation.
- Source 실제 upload input/API 연결.
- Ontology class/relation/property 생성·수정 form.
- `FE-006`, `FE-007` Source upload/preview 확장.
- `FE-010` smoke test 또는 Storybook.
- Backend OpenAPI 준비 후 `shared/api/client.ts` mock을 실제 API로 전환.

## 다른 역할에 전달할 내용

- PM:
  - MVP 1에서는 LLM extraction, candidate review, RAG 화면을 노출하지 않는 방향으로 구현됨.
- Backend:
  - `API_CONTRACT_PRIORITY_MVP1`의 Project/Ontology/Source endpoint shape 유지 요청.
- QA:
  - dev server에서 app shell과 Project/Ontology/Source mock 흐름 수용 확인 가능.
- 총괄:
  - Frontend는 mock 기반 P0 UI surface가 준비됐다고 보고함.

## 총괄에게 요청하는 결정

- `hana-style-component` install script 지연 문제를 MVP 1 risk로만 기록할지, 별도 dependency 안정화 task로 분리할지 결정 필요.
- Backend OpenAPI 타입 공유 방식 확정 후 frontend mock/type 경계 조정 필요.

## 현재 판정

- `PARTIAL`
- `FE-001`, `FE-002`, `FE-003`, `FE-004`, `FE-005`는 보고 기준 완료.
- `FE-009`는 mock/API boundary가 구성됐으나 Backend OpenAPI 부재로 contract diff 전 단계.
- `FE-006`, `FE-007`은 mock 화면은 있으나 실제 upload/API 연결 확장 TODO가 남음.
