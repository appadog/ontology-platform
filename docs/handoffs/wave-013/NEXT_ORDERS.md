# Next Orders - After Wave 13

## 현재 단계 판정

- Completed wave: `wave-013`
- Status: `MVP 2 WAVE 13 UIUX PRODUCT POLISH PASS`
- QA verdict: `PASS`
- Backend/API scope: unchanged, no blocker.
- Remaining exceptions:
  - Docker Compose smoke remains P1 environment follow-up because Docker CLI is unavailable.
  - Browser smoke harness is reproducible but still script-based; Playwright Test formalization remains P1 tooling follow-up.

## 총괄 결정

- Wave 13은 닫는다.
- Wave 12에서 크게 개선된 UI/UX를 Wave 13에서 상품 수준에 더 가깝게 다듬었다.
- `UX13-01`~`UX13-08`은 모두 PASS다.
- 특히 candidate mobile review, evidence-first reading order, source readiness, workflow stage, visible copy cleanup이 닫혔다.
- Backend는 이번 wave에서 미실행이 맞다. 신규 endpoint/DTO/enum 요구가 없었다.

## 다음 선택지

### Option A: MVP 3 Planning

- PM이 review/publish workflow, candidate decision, audit, published graph boundary를 설계한다.
- Backend/Frontend는 PM contract 확정 후 시작한다.
- 적합한 경우:
  - 제품 기능을 다음 MVP로 전진시키고 싶을 때.

### Option B: P1 Tooling Cleanup

- Frontend/QA가 `npm run smoke:mvp2:actual`을 Playwright Test suite로 정규화한다.
- Infra/Backend가 Docker CLI 가능한 환경에서 Compose smoke를 재검증한다.
- 적합한 경우:
  - 다음 MVP 전 안정적인 반복 검증/시연 루틴을 더 단단히 만들고 싶을 때.

## 권장 순서

1. PM: MVP 3 범위 결정을 먼저 한다.
2. If MVP 3 opens: PM contract-first wave를 시작한다.
3. If stability wave opens: Frontend/QA smoke harness formalization과 Docker Compose 재검증을 먼저 한다.

## 다음 보고 위치 제안

- 다음 기능 wave: `docs/handoffs/wave-014/`
- PM: `docs/handoffs/wave-014/PM_REPORT.md`
- Frontend: `docs/handoffs/wave-014/FRONTEND_REPORT.md`
- Backend: `docs/handoffs/wave-014/BACKEND_REPORT.md`
- QA: `docs/handoffs/wave-014/QA_REPORT.md`
