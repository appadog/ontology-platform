# Handoffs

역할별 에이전트 완료 보고와 총괄 지시를 모으는 공간입니다.

## 목적

여러 에이전트가 동시에 작업할 때 총괄은 이 폴더만 읽어도 현재 단계, 완료 범위, blocker, 다음 지시를 판단할 수 있어야 합니다.

## 구조

```text
docs/handoffs/
  README.md
  REPORT_TEMPLATE.md
  NEXT_ORDER_TEMPLATE.md
  CURRENT_STATE.md
  wave-001/
    PM_REPORT.md
    BACKEND_REPORT.md
    FRONTEND_REPORT.md
    QA_REPORT.md
    NEXT_ORDERS.md
```

## 운영 규칙

1. 각 역할 에이전트는 작업 시작 전 `.agents/skills/handoff-reporting/SKILL.md`를 읽는다.
2. 각 역할 에이전트는 본인 작업이 끝나면 해당 wave 폴더에 보고서를 남긴다.
3. 파일명은 `{ROLE}_REPORT.md`를 사용한다.
4. 총괄은 모든 보고서를 읽고 `CURRENT_STATE.md`를 갱신한다.
5. 총괄은 다음 지시를 `wave-XXX/NEXT_ORDERS.md`에 작성한다.
6. 다음 wave가 시작되면 `wave-002`, `wave-003`처럼 새 폴더를 만든다.

작업 완료 판정은 보고서까지 작성된 시점이다. 코드/문서 변경만 끝내고 보고서를 남기지 않은 작업은 incomplete로 본다.

## Role Names

- `PM_REPORT.md`
- `BACKEND_REPORT.md`
- `FRONTEND_REPORT.md`
- `QA_REPORT.md`
- 필요 시 `INFRA_REPORT.md`, `FULLSTACK_REPORT.md`를 추가한다.

## 총괄 판정 기준

총괄은 다음 항목을 반드시 확인한다.

- backlog ID별 완료/미완료
- runtime runnable 여부
- OpenAPI/FE mock contract 일치 여부
- enum/DTO/status 변경 여부
- 다른 역할에 영향을 주는 변경
- blocker와 다음 gate
- MVP 1 scope guard 위반 여부
