# PM/Architecture Report - Wave 7

## 담당 범위
- backlog ID: PM2-003, PM2-004, PM2-005, support INT2-001~INT2-003
- 작업 경로:
  - `docs/pm/GLOSSARY.md`
  - `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
  - `docs/backlog/MVP2_DRAFT_BACKLOG.md`
  - `docs/handoffs/wave-007/PM_REPORT.md`

## 완료한 작업
- Wave 7 필수 문서와 handoff-reporting skill을 확인했다.
- Wave 6 QA report 기준 FE actual API contract blocker를 PM 관점에서 정리했다.
- Provider literal/display split을 문서에 고정했다.
  - API request/response value: `mock`
  - UI display label: `MockProvider`
  - Backend는 `MockProvider` alias를 추가하지 않는다.
- `POST /api/v1/sources/{source_id}/parse` 응답 형태를 `SourceParseResponse`로 고정했다.
  - `SourceSegment[]` 단독 반환이 아니다.
  - segment list는 `GET /api/v1/sources/{source_id}/segments`로 조회한다.
- Retry no-duplicate natural key 범위를 retry chain 전체로 결정했다.
  - 같은 job 내부만이 아니라 root retry job과 descendants 전체가 dedupe scope다.
- `INVALID_EVIDENCE_REFERENCE`는 deterministic fixture 또는 backend test hook이 필요하다고 결정했다.
  - preferred fixture id: `invalid_evidence_reference`
  - QA smoke 전용이며 product workflow/UI scope가 아니다.
- Candidate pagination/list response shape는 현재 OpenAPI plain array를 유지하기로 결정했다.
  - `CandidateEntity[]`, `CandidateRelation[]`
  - `total_count`, cursor, list wrapper DTO는 이번 wave에서 추가하지 않는다.
- API draft에 FE sync에 필요한 DTO 기준을 보강했다.
  - `SourceProfile.id`
  - `SourceProfileColumn.nullable`
  - `SourceProfileColumn.distinct_count_sampled`
  - `SourceSegment.sequence`
  - `PromptTemplate`/`PromptVersion`
  - `ExtractionJobCreateRequest`

## 변경 파일
- `docs/pm/GLOSSARY.md`
- `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
- `docs/backlog/MVP2_DRAFT_BACKLOG.md`
- `docs/handoffs/wave-007/PM_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `sed -n '1,260p' AGENTS.md`
  - `sed -n '1,260p' .agents/skills/handoff-reporting/SKILL.md`
  - `sed -n '1,320p' docs/handoffs/CURRENT_STATE.md`
  - `sed -n '1,320p' docs/handoffs/wave-006/NEXT_ORDERS.md`
  - `sed -n '1,360p' docs/handoffs/wave-006/QA_REPORT.md`
  - `sed -n '1,320p' docs/pm/GLOSSARY.md`
  - `sed -n '1,420p' docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
  - `sed -n '1,220p' docs/backlog/MVP2_DRAFT_BACKLOG.md`
  - `python3` OpenAPI schema inspection for parse, candidate list, extraction job, source/profile, prompt, candidate/evidence schemas
  - `rg -n 'API value: mock|UI display label: MockProvider|provider: "mock"|SourceParseResponse|retry chain|invalid_evidence_reference|CandidateEntityListResponse|CandidateRelationListResponse|plain arrays|total_count|cursor|SourceProfileColumn|distinct_count_sampled|PromptVersion' ...`
  - `git diff --check`
- 결과:
  - Provider split, SourceParseResponse, retry-chain dedupe, invalid evidence fixture/test hook, candidate plain array list shape가 문서에 반영된 것을 확인했다.
  - `docs/api/openapi-mvp2-draft.json`은 이미 `POST /parse -> SourceParseResponse`, candidate list plain arrays, provider default `mock` 형태임을 확인했다.
  - `git diff --check` 통과.
- 실행하지 못한 검증:
  - PM contract 문서 작업이므로 backend tests, frontend build, actual FE-to-BE smoke, Docker Compose는 실행하지 않았다.

## API/Enum/DTO 변경
- 변경 여부: 있음
- 상세:
  - Provider API literal: `mock`
  - Provider UI display label: `MockProvider`
  - `SourceParseResponse`를 parse POST canonical response로 명시.
  - `SourceSegment.sequence`, `SourceProfile.id`, `SourceProfileColumn.nullable`, `SourceProfileColumn.distinct_count_sampled`를 API draft에 반영.
  - `PromptTemplate`/`PromptVersion` DTO 기준을 OpenAPI와 맞춰 명시.
  - Retry no-duplicate scope를 retry chain 전체로 확정.
  - `INVALID_EVIDENCE_REFERENCE` deterministic fixture/test hook 필요성을 확정.
  - Candidate list response는 `CandidateEntity[]`/`CandidateRelation[]` plain array 유지.
- 영향받는 역할:
  - Backend: `MockProvider` alias를 추가하지 않고 `mock`만 API value로 유지. `invalid_evidence_reference` fixture/test hook 제공 필요.
  - Frontend: UI label과 API value를 분리하고, `parseSource()` return type을 `SourceParseResponse`로 맞춘다.
  - QA: Wave 7 smoke에서 provider payload `mock`, parse response shape, invalid evidence fixture/test hook, candidate list plain array를 확인한다.

## Blocker
- PM/Architecture blocker 없음.
- MVP 2 Wave 7 closeout blocker는 FE actual API contract sync 완료 여부다.

## 남은 TODO
- Backend:
  - `invalid_evidence_reference` deterministic fixture 또는 backend test hook을 추가/보고한다.
  - OpenAPI examples가 FE sync에 충분한지 유지한다.
- Frontend:
  - `docs/api/openapi-mvp2-draft.json` 기준으로 types/client/fixtures/screens를 재동기화한다.
  - job creation payload는 `provider: "mock"`으로 보낸다.
  - `parseSource()`는 `SourceParseResponse`를 반환하고, segment list는 `GET /segments`를 사용한다.
  - candidate list response를 wrapper가 아닌 array로 처리한다.
- QA:
  - INT2-001~INT2-003 actual FE-to-BE smoke를 재수행한다.
  - `invalid_evidence_reference` hook이 제공되면 runtime smoke에 포함한다.

## 다른 역할에 전달할 내용
- PM:
  - PM2-003/PM2-004/PM2-005 관련 Wave 7 contract decisions는 문서화 완료.
- Backend:
  - Provider alias는 추가하지 않는다. API value는 `mock`만 허용한다.
  - Retry dedupe는 retry chain 전체 기준으로 설계한다.
  - `INVALID_EVIDENCE_REFERENCE`는 deterministic QA fixture/test hook이 필요하다.
- Frontend:
  - `MockProvider`는 표시명이고 API payload가 아니다.
  - `SourceParseResponse`와 `SourceSegment[]`를 분리한다.
  - Candidate list는 array response로 유지한다.
- QA:
  - Candidate list wrapper 미도입을 확인한다.
  - `total_count`/cursor가 없는 것은 이번 wave의 의도된 계약이다.

## 총괄에게 요청하는 결정
- 없음.

## 현재 판정
- PASS
