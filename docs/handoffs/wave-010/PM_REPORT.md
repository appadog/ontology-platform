# PM/Architecture Report - Wave 10

## 담당 범위

- backlog ID: `PM2-001`, `PM2-002`, `PM2-003`, `PM2-004`, `PM2-005`, support `INT2-001`~`INT2-004`
- 작업 경로: `docs/backlog/MVP2_DRAFT_BACKLOG.md`, `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`, `docs/pm/MVP2_PREP_BRIEF.md`

## 완료한 작업

- Wave 10 MVP 2 broader local demo acceptance를 확정했다.
- Source upload/profile/parse/chunk → prompt version 선택 → extraction job 생성/실행/retry → candidate/evidence 확인 end-to-end path를 문서화했다.
- Fixture catalog 기준을 확정했다.
  - `default`: `SUCCESS`, normal candidate/evidence.
  - `partial_invalid`: `PARTIAL_FAILED`, missing evidence warning candidate 포함.
  - `invalid_evidence_reference`: `PARTIAL_FAILED`, broken evidence fallback candidate 포함.
  - `missing`: `FAILED`, `MOCK_FIXTURE_NOT_FOUND`.
- Broken evidence fixture 정책을 결정했다.
  - `invalid_evidence_reference` fixture는 non-null `source_id`와 non-null `source_segment_id`를 가진 broken reference를 포함해야 한다.
  - UI는 null/absent locator와 direct-route fallback도 계속 방어해야 한다.
- Prompt lifecycle 범위를 결정했다.
  - Wave 10은 active version 표시와 explicit prompt version 선택까지만 연다.
  - 별도 active version 변경 API/UI, prompt publish/review workflow는 열지 않는다.
- Source profile/parse acceptance를 확정했다.
  - CSV/Excel empty, header-only, small, mixed type, null-heavy sample.
  - TXT/PDF deterministic parse/chunk warnings.
  - 반복 profile/parse에서 duplicate visible rows 금지.
- Frontend visible copy 기준을 정리했다.
  - endpoint/debug 설명은 최소화하고 CTA/status/breadcrumb/row action/empty-error state 중심으로 흐름을 전달한다.
  - fixture id와 error code는 QA/dev 재현에 필요한 보조 정보로 낮춰 표시한다.

## 변경 파일

- `docs/backlog/MVP2_DRAFT_BACKLOG.md`
- `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
- `docs/pm/MVP2_PREP_BRIEF.md`
- `docs/handoffs/wave-010/PM_REPORT.md`

## 실행/검증

- 실행한 명령:
  - `sed -n '1,240p' AGENTS.md`
  - `sed -n '1,240p' .agents/skills/handoff-reporting/SKILL.md`
  - `sed -n '1,300p' docs/handoffs/CURRENT_STATE.md`
  - `sed -n '1,320p' docs/handoffs/wave-009/NEXT_ORDERS.md`
  - `sed -n '1,260p' 03_PM_AGENT_SKILL.md`
  - `sed -n '1,360p' docs/backlog/MVP2_DRAFT_BACKLOG.md`
  - `sed -n '1,500p' docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
  - `sed -n '1,240p' docs/pm/MVP2_PREP_BRIEF.md`
  - `rg -n "Wave 10 Local Demo Acceptance Decisions|End-to-end local demo path|Fixture catalog|Broken evidence fixture decision|Prompt lifecycle|Source profile acceptance|Source parse/chunk acceptance|Frontend visible copy" docs/backlog/MVP2_DRAFT_BACKLOG.md`
  - `rg -n "Wave 10 broadens|Wave 10 Local Demo Contract Notes|Fixture catalog is canonical|invalid_evidence_reference.*non-null|Prompt lifecycle remains|Source profile edge cases|Source parse/chunk edge cases" docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
  - `rg -n "Wave 10 broader|Wave 10 Local Demo Acceptance|Source profile/parse|Prompt lifecycle|Fixture catalog|Candidate/evidence browsing|Visible copy|non-null" docs/pm/MVP2_PREP_BRIEF.md`
  - `git diff --check -- docs/backlog/MVP2_DRAFT_BACKLOG.md docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md docs/pm/MVP2_PREP_BRIEF.md`
- 결과:
  - 필수 문서 확인 완료.
  - Wave 10 local demo acceptance, fixture catalog, broken evidence policy, prompt lifecycle, source profile/parse, visible copy 기준 문구 확인 완료.
  - `git diff --check` PASS.
- 실행하지 못한 검증:
  - PM/Architecture 문서 결정 작업이라 backend/frontend runtime test는 실행하지 않았다.

## API/Enum/DTO 변경

- 변경 여부: 있음, 문서 계약 보완. 신규 runtime endpoint/enum/DTO 추가는 없음.
- 상세:
  - Fixture catalog의 expected job/candidate/evidence 상태를 API draft에 명시했다.
  - `invalid_evidence_reference` fixture는 non-null `source_id`/`source_segment_id` broken reference를 포함해야 한다고 결정했다.
  - Prompt active version 변경 API/UI는 열지 않는다. `PromptVersion.is_active` 표시와 explicit `prompt_version_id` 선택만 사용한다.
  - Source profile/parse edge-case acceptance를 추가했다.
  - 신규 candidate detail endpoint, external LLM provider, review/publish workflow, RAG, advanced PDF parsing은 열지 않는다.
- 영향받는 역할:
  - Backend: fixture catalog, source profile/parse edge cases, prompt/job lifecycle, retry/failure tests.
  - Frontend: fixture selection UI, source-to-evidence workflow, visible copy, candidate/evidence browsing.
  - QA: broader local demo regression 기준.

## Blocker

- PM/Architecture blocker는 없음.
- Docker CLI 부재는 기존 environment exception 유지.

## 남은 TODO

- Backend:
  - `default`, `partial_invalid`, `invalid_evidence_reference`, `missing` fixture catalog를 actual API에서 안정 재현.
  - Source profile/parse edge-case regression과 OpenAPI freshness 유지.
- Frontend:
  - Fixture 선택, job lifecycle, candidate/evidence browsing, visible copy 기준 반영.
  - Actual API mode smoke와 browser evidence 준비.
- QA:
  - Wave 10 broader MVP 2 local demo regression 수행.
  - 다음 wave가 MVP 2 closeout 준비인지 추가 hardening인지 판정.

## 다른 역할에 전달할 내용

- PM:
  - Wave 10 acceptance는 PASS다. 더 넓은 범위는 여전히 local demo에 한정한다.
- Backend:
  - `invalid_evidence_reference`는 non-null `source_segment_id`가 있는 broken reference를 포함해야 한다.
  - `partial_invalid`은 `PARTIAL_FAILED`와 `MISSING_EVIDENCE` warning candidate를 재현해야 한다.
  - Active prompt version 변경 API는 추가하지 않는다.
- Frontend:
  - 사용자 화면은 endpoint/debug 설명보다 CTA/status/breadcrumb/row action으로 흐름을 전달한다.
  - Fixture id는 QA 재현성을 위해 선택 가능해야 하지만 primary label은 결과 중심으로 보여준다.
- QA:
  - `default`, `partial_invalid`, `invalid_evidence_reference`, `missing` fixture를 모두 local demo regression에 포함한다.
  - Broken evidence fixture에서 non-null `source_segment_id` traceability와 null/absent locator UI fallback을 모두 확인한다.

## 총괄에게 요청하는 결정

- 추가 결정 요청 없음.

## 현재 판정

- PASS
