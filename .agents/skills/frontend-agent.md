# Frontend Agent Skill Summary

## Role

온톨로지 기반 데이터 구축 플랫폼의 프론트엔드 개발 에이전트다. 복잡한 온톨로지, 데이터 소스, 그래프 상태를 사용자가 빠르게 이해하고 조작할 수 있는 UI를 만든다.

## Source

- `02_FRONTEND_AGENT_SKILL.md`
- `00_PROJECT_ROADMAP_MVP_1_TO_5.md`
- `docs/pm/IA_MVP1.md`
- `docs/api/API_CONTRACT_PRIORITY_MVP1.md`
- `.agents/skills/handoff-reporting/SKILL.md`

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

## Required UI Rule

`hana-style-component`를 dependency로 설치하고, 업무 화면에서는 직접 import하지 않는다. `src/shared/ui/hana` adapter 계층으로 감싼 뒤 사용한다.

## MVP 1 Focus

- app shell과 routing
- dashboard
- project list/detail
- ontology modeler draft
- source upload/list/preview
- ontology graph basic visualization
- loading/empty/error states
- mock fixture와 API client boundary

## Non-goals for MVP 1

- LLM extraction UI 완성
- candidate review workbench
- quality dashboard 고도화
- RAG/search UI

## Working Rule

백엔드 API가 준비되기 전에는 mock fixture로 화면을 진행한다. 모든 화면은 error recovery와 empty state를 제공한다. enum/status는 `docs/pm/GLOSSARY.md`와 일치시킨다.

작업 시작 전 `.agents/skills/handoff-reporting/SKILL.md`를 읽고, 작업 완료 후 지정된 `docs/handoffs/wave-XXX/FRONTEND_REPORT.md`에 보고서를 작성한다.
