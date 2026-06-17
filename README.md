# Ontology Platform Agent Skill Pack

이 패키지는 온톨로지 기반 데이터 구축 플랫폼을 개발하기 위한 에이전트 지시용 Markdown 파일 모음이다.

## 포함 파일

| 파일 | 용도 |
|---|---|
| `00_PROJECT_ROADMAP_MVP_1_TO_5.md` | MVP 1~5차 전체 개발 로드맵과 아키텍처 방향 |
| `01_BACKEND_AGENT_SKILL.md` | 백엔드 에이전트 지시문 |
| `02_FRONTEND_AGENT_SKILL.md` | 프론트엔드 에이전트 지시문 |
| `03_PM_AGENT_SKILL.md` | 프로젝트 PM 에이전트 지시문 |

## 권장 사용 방식

1. 먼저 `00_PROJECT_ROADMAP_MVP_1_TO_5.md`를 전체 프로젝트 기준 문서로 둔다.
2. 백엔드 에이전트에는 `01_BACKEND_AGENT_SKILL.md`를 등록한다.
3. 프론트엔드 에이전트에는 `02_FRONTEND_AGENT_SKILL.md`를 등록한다.
4. PM 에이전트에는 `03_PM_AGENT_SKILL.md`를 등록한다.
5. 실제 개발 중 결정사항은 PM 에이전트가 ADR로 관리한다.

## 프론트엔드 UI 컴포넌트 기준

프론트엔드는 로컬 ZIP 컴포넌트를 복사해서 사용하지 않는다. `hana-style-component` GitHub 저장소를 npm dependency로 설치한 뒤, `src/shared/ui/hana` adapter 계층으로 감싸서 사용한다.

```bash
cd apps/frontend
npm install github:appadog/hana-style-component
# 또는 HTTPS git URL 명시 방식
npm install git+https://github.com/appadog/hana-style-component.git
```

프론트엔드 에이전트는 설치 후 실제 package name, export path, TypeScript type 제공 여부, styled-components theme 연동 방식을 확인한다. 업무 화면에서는 외부 패키지를 직접 import하지 말고 adapter만 import한다.

## 초기 권장 진행 순서

```text
1. PM: MVP 1차 범위 확정, 샘플 도메인 선정
2. Backend: FastAPI 프로젝트와 Docker Compose 생성
3. Frontend: Vite/React 프로젝트 생성
4. Frontend: npm install github:appadog/hana-style-component 실행 및 디자인 시스템 adapter 구성
5. Backend: Project/Ontology/Source API 구현
6. Frontend: Dashboard/Project/Ontology/Source 화면 구현
7. PM: 데모 시나리오 기준으로 수용 테스트
```
