# Docs

프로젝트 운영과 개발 의사결정을 관리하는 문서 영역입니다.

## Map

| 경로 | 목적 |
|---|---|
| `pm/PRD_MVP1.md` | MVP 1차 제품 요구사항 초안 |
| `pm/IA_MVP1.md` | MVP 1차 정보구조와 화면 흐름 |
| `pm/GLOSSARY.md` | PM/Backend/Frontend 공통 용어집 |
| `pm/ROLE_POLICY_MVP1.md` | MVP 1차 사용자 역할과 개발용 권한 정책 |
| `api/API_CONTRACT_PRIORITY_MVP1.md` | API contract-first 우선순위 |
| `backlog/MVP1_BACKLOG.md` | MVP 1차 백로그 |
| `backlog/ISSUE_TEMPLATE.md` | 에이전트 작업 이슈 템플릿 |
| `handoffs/` | 역할별 완료 보고, 총괄 상태판, 다음 지시 |
| `adr/` | Architecture Decision Records |

## 문서 관리 원칙

- PM 산출물은 백엔드/프론트엔드 작업 전에 먼저 갱신한다.
- API나 enum 변경은 `docs/api`와 구현을 함께 갱신한다.
- 아키텍처 선택이 바뀌면 `docs/adr`에 기록한다.
- 작업 단위는 독립적으로 맡길 수 있게 owner, dependency, acceptance criteria를 명시한다.
- 각 에이전트는 작업 wave가 끝나면 `docs/handoffs/`에 보고서를 남기고, 총괄은 이를 읽어 다음 지시를 작성한다.
