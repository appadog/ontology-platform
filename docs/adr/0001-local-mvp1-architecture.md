# ADR 0001: Local MVP 1 Architecture

## Status

Proposed

## Context

MVP 1은 온톨로지 기반 데이터 구축 플랫폼의 로컬 실행 가능한 기반을 만드는 단계다. 후속 MVP에서 LLM 추출, 후보 그래프, evidence, 전문가 검수, 게시 그래프가 추가될 예정이므로 초기부터 도메인 경계와 데이터 흐름을 분리해야 한다.

## Decision

- 모노레포 구조를 사용한다.
- Frontend는 `apps/frontend`에 두고 React, TypeScript, Vite, styled-components를 사용한다.
- Backend는 `apps/backend`에 두고 Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic을 사용한다.
- Local infra는 `infra/local`에 두고 PostgreSQL, Redis, MinIO, Neo4j 또는 임시 graph adapter를 Docker Compose로 제공한다.
- MVP 1에서는 실제 LLM 추출과 전문가 검수 구현을 제외한다.
- Project, Ontology, Source API를 contract-first로 먼저 만든다.
- 후보 그래프와 게시 그래프 분리 원칙은 MVP 1 데이터 모델 naming과 모듈 경계에 미리 반영한다.

## Consequences

- 초기 개발자는 앱 구현보다 contract와 domain naming을 먼저 맞춘다.
- 프론트엔드는 mock fixture로 백엔드 완료 전 화면 개발이 가능하다.
- 백엔드는 OpenAPI를 프론트엔드 계약의 중심으로 유지해야 한다.
- graph DB 연동이 늦어져도 adapter 경계를 통해 MVP 1 모델러 그래프는 진행할 수 있다.

## Follow-up

- BE-002에서 실제 Docker Compose 구성을 작성한다.
- BE-010에서 OpenAPI export 또는 타입 생성 방식을 결정한다.
- FE-003에서 `hana-style-component` 실제 export와 adapter 방식을 확인한다.
