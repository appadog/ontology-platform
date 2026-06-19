# MVP 2 Completion Review

Status: `PASS WITH P1 TOOLING/ENVIRONMENT EXCEPTIONS`
Date: 2026-06-19

## 총괄 판정

MVP 2의 제품 P0 범위는 완료로 본다. Wave 6~13 동안 source profiling/chunking, prompt/job/model run, MockProvider, candidate/evidence persistence, retry/dedupe, actual API contract sync, candidate/evidence browsing, evidence fallback, productized UX, responsive/mobile QA까지 모두 통과했다.

남은 것은 제품 기능 blocker가 아니라 P1 환경/툴링 follow-up이다.

- Docker Compose smoke: 현재 환경에 Docker CLI가 없어 `NOT RUNNABLE`. 이미 product closeout exception으로 승인됨.
- Browser smoke harness: `npm run smoke:mvp2:actual`은 재현 가능하지만 Playwright Test suite로 정규화하면 더 좋음.

따라서 MVP 3로 진입해도 된다.

## 완료율 요약

| 영역 | 판정 | 근거 |
|---|---|---|
| PM scope/contract | 100% P0 PASS | `PM2-001`~`PM2-005`, Wave 11 closeout, Wave 12/13 productization 기준 완료 |
| Backend MVP 2 thin slice | 100% P0 PASS | Source profile/parse, prompt, extraction job, model run, MockProvider, candidate/evidence, retry/dedupe smoke PASS |
| Frontend MVP 2 UI | 100% P0 PASS | Source profile/chunks, extraction job, candidate/evidence, responsive/mobile product polish PASS |
| QA integration | 100% P0 PASS | `INT2-001`~`INT2-004`, `CO-01`~`CO-09`, `PX-01`~`PX-08`, `UX13-01`~`UX13-08` PASS |
| Product readiness | PASS | Source-to-evidence workflow, evidence fallback, candidate mobile review, copy cleanup PASS |
| Local infra | PASS WITH EXCEPTION | Docker CLI 부재로 Compose smoke만 P1 exception |
| Tooling | PASS WITH EXCEPTION | actual API smoke script는 동작, Playwright Test formalization은 P1 |

## MVP 2 Done Criteria Check

| Done criteria | 상태 | Notes |
|---|---|---|
| CSV/Excel에서 컬럼 프로파일링 결과를 볼 수 있다 | PASS | Empty/header-only/mixed/null-heavy edge cases 포함 |
| 문서를 chunk 단위로 볼 수 있다 | PASS | TXT/PDF best-effort, warning fallback 포함 |
| Mock LLM으로 후보 엔티티/관계를 생성할 수 있다 | PASS | External LLM은 제외 범위, MockProvider deterministic fixtures 통과 |
| 모든 정상 후보에는 source/evidence 참조가 있다 | PASS | Missing/broken evidence는 warning/failure candidate로 분리 |
| 추출 작업 실행 상태를 UI에서 확인할 수 있다 | PASS | job lifecycle, retry, model run metadata, failure paths 포함 |
| 후보/evidence를 탐색할 수 있다 | PASS | desktop/mobile candidate review, normal/broken/direct missing evidence PASS |
| 제품 UI로 따라갈 수 있다 | PASS | Wave 12/13 productization + UIUX polish PASS |

## Closeout Evidence

- Wave 11 QA: `PASS WITH EXCEPTION`, `CO-01`~`CO-09` PASS.
- Wave 12 QA: `PASS`, `PX-01`~`PX-08` PASS.
- Wave 13 QA: `PASS`, `UX13-01`~`UX13-08` PASS.
- Fresh Wave 13 QA artifact: `/tmp/ontology-wave13-copy-qa-smoke`.

## MVP 3 Readiness

MVP 2가 남긴 MVP 3 준비 기반:

- Candidate entity/relation/evidence persistence exists.
- Candidate `validation_status`, `validation_codes`, `review_status`, `publish_status` fields exist.
- Evidence traceability and fallback UX exist.
- Ontology version, prompt version, model run, extraction job links exist.
- MockProvider fixture catalog can generate reviewable candidates repeatedly.
- UI already has candidate/evidence work surfaces that can evolve into a review workbench.

MVP 3에서 새로 열어야 할 핵심:

- `ValidationJob`, `ValidationResult`
- `ReviewTask`, `ReviewDecision`
- Candidate edit/correction layer
- Audit log for original LLM value and expert correction
- `PublishJob`, `PublishedEntity`, `PublishedRelation`
- Published graph query/explorer
- Quality dashboard v0.1

## Remaining Follow-ups

| Follow-up | Type | MVP 3 blocker? | Owner |
|---|---|---|---|
| Docker Compose smoke in Docker-capable environment | P1 environment | No | Infra/QA |
| Convert actual API smoke script to Playwright Test suite | P1 tooling | No | Frontend/QA |
| External LLM provider | Later feature | No, excluded from MVP 2 | MVP 3+ decision |
| Advanced PDF/OCR parsing | Later feature | No | Later parsing hardening |
| Production RBAC/SSO | Later feature | No | MVP 5 |

## Decision

MVP 2 is closed for product scope. Start MVP 3 with PM contract-first Wave 14.
