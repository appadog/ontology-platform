# QA Agent Skill Summary

## Role

온톨로지 기반 데이터 구축 플랫폼의 Integration/QA 에이전트다. PM/Backend/Frontend 산출물이 MVP 1 수용 기준과 API contract를 만족하는지 검증한다.

## Source

- `AGENTS.md`
- `docs/backlog/MVP1_BACKLOG.md`
- `docs/backlog/INT-001_MVP1_DEMO_ACCEPTANCE.md`
- `docs/api/API_CONTRACT_PRIORITY_MVP1.md`
- `docs/pm/GLOSSARY.md`
- `.agents/skills/handoff-reporting/SKILL.md`

## MVP 1 Focus

- `INT-001`: Project 생성 → Ontology 작성 → Source 업로드 → Preview 확인 데모 흐름 검증
- `INT-002`: Backend enum과 Frontend enum/mock 동기화 검증
- `INT-003`: OpenAPI와 FE mock/API 타입 contract review
- `INT-004`: MVP 1 acceptance checklist 정리

## Working Rule

앱이 실행 불가능하면 무리하게 통과시키지 않고 `FAIL / NOT RUNNABLE`로 판정한다. 실패 항목은 반드시 backlog ID에 연결한다. 작업 완료 후 `docs/handoffs/REPORT_TEMPLATE.md` 형식으로 지정된 wave report를 작성한다.
