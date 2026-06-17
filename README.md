# Ontology Data Platform

온톨로지 기반 데이터 구축 플랫폼의 로컬 개발 모노레포입니다.

이 프로젝트는 정형·비정형 데이터를 수집하고, LLM이 온톨로지 기준으로 엔티티·속성·관계 후보를 생성하며, 전문가 검수·품질평가·승인·게시를 통해 신뢰 가능한 지식그래프를 구축·관리·활용하는 웹 기반 플랫폼을 목표로 합니다.

## 기준 문서

- `00_PROJECT_ROADMAP_MVP_1_TO_5.md`: MVP 1~5차 로드맵과 전체 아키텍처 방향
- `03_PM_AGENT_SKILL.md`: PM/아키텍트 에이전트 운영 기준
- `01_BACKEND_AGENT_SKILL.md`: 백엔드 에이전트 작업 기준
- `02_FRONTEND_AGENT_SKILL.md`: 프론트엔드 에이전트 작업 기준

## 현재 초기화 범위

아직 대규모 구현은 하지 않습니다. 현재 레포는 MVP 1차를 시작하기 위한 프로젝트 골격, 문서, 작업 지시 구조를 먼저 제공합니다.

```text
apps/
  frontend/          React + TypeScript + Vite 앱 자리
  backend/           FastAPI 모듈러 모놀리스 앱 자리
docs/
  pm/                PRD, IA, glossary 등 PM 산출물
  api/               API contract 우선순위
  backlog/           MVP 1차 백로그와 이슈 템플릿
  adr/               아키텍처 의사결정 기록
infra/
  local/             로컬 Docker Compose/개발 인프라 자리
.agents/
  skills/            PM, Backend, Frontend 에이전트 작업 지시 요약
AGENTS.md           레포 전체 에이전트 운영 규칙
```

## MVP 1차 목표

로컬에서 실행 가능한 서비스 뼈대를 만들고, 사용자가 프로젝트를 생성하고, 온톨로지 클래스/속성/관계를 만들며, CSV/Excel 파일을 등록하고 미리볼 수 있는 기본 흐름을 완성합니다.

MVP 1차에서는 실제 LLM 추출, 전문가 검수 워크플로우, 복잡한 품질 점수, RAG, 실사용 SSO/RBAC는 제외합니다.

## 작업 시작 순서

1. PM 에이전트가 `docs/pm/PRD_MVP1.md`, `docs/pm/IA_MVP1.md`, `docs/api/API_CONTRACT_PRIORITY_MVP1.md`를 확정합니다.
2. 백엔드 에이전트가 `apps/backend`와 `infra/local`을 기반으로 FastAPI, Docker Compose, Project/Ontology/Source API를 스캐폴드합니다.
3. 프론트엔드 에이전트가 `apps/frontend`를 기반으로 Vite/React 앱, 레이아웃, mock fixture, `hana-style-component` adapter를 스캐폴드합니다.
4. 프론트/백엔드가 API contract-first 방식으로 병렬 개발합니다.
5. PM 에이전트가 `docs/backlog/MVP1_BACKLOG.md`의 수용 기준으로 데모 흐름을 검증합니다.
