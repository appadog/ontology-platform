# PM/Architecture Report - Wave 8

## 담당 범위

- backlog ID: `PM2-004`, support `FE2-004`~`FE2-006`, support `INT2-004`, support `FE-005`, `FE-014`
- 작업 경로: `docs/backlog/MVP2_DRAFT_BACKLOG.md`, `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`, `docs/pm/MVP2_PREP_BRIEF.md`

## 완료한 작업

- Wave 8 focused expansion acceptance를 문서화했다.
- Primary ontology-building workflow를 project 선택/생성부터 candidate/evidence 확인까지 end-to-end로 확정했다.
- Frontend가 긴 설명문 대신 화면 구조, selected project context, breadcrumb/path, primary action, empty/error state, row/action link로 흐름을 보여야 한다는 acceptance를 추가했다.
- Ontology modeler edit/delete 기준을 확정했다. Draft version은 class/property/relation 생성/수정/삭제 가능, published/archived version은 read-only와 새 draft CTA 기준이다.
- Delete는 물리 삭제가 아니라 element `status=DELETED` 처리로 이해하며, class 삭제 시 연결 property/relation 영향 표시와 selection 안정성 기준을 추가했다.
- LNB와 drilldown IA 기준을 확정했다. LNB는 전역 최상위 업무 영역만 두고 ID 기반 화면은 parent row/action/context link와 breadcrumb/compact path로 진입한다.
- Retry-chain dedupe acceptance를 retry root, duplicate candidate natural key, duplicate evidence natural key, user-facing retry/dedupe status 기준으로 구체화했다.
- Candidate detail drawer/panel 범위를 기존 candidate list DTO와 evidence detail endpoint 기반으로 확정했다.
- Evidence highlight 범위를 structured table row/cell, text chunk/paragraph/span, missing/broken evidence fallback으로 확정했다.
- Selected/recent project/job navigation 기준을 product primary path와 QA/dev fixture shortcut 분리 기준으로 정리했다.
- Browser smoke tooling은 Playwright를 Frontend/QA dev dependency 기본값으로 두고, 환경 제약 시 manual UAT/headless fallback을 증적 조건으로 허용하는 것으로 결정했다.

## 변경 파일

- `docs/backlog/MVP2_DRAFT_BACKLOG.md`
- `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
- `docs/pm/MVP2_PREP_BRIEF.md`
- `docs/handoffs/wave-008/PM_REPORT.md`

## 실행/검증

- 실행한 명령:
  - `rg -n "Wave 8 Focused Expansion Acceptance|Primary Ontology-Building Workflow|status=DELETED|LNB and Drilldown|Selected/Recent|Retry-Chain Dedupe|Candidate Detail|Evidence Highlight|Browser Smoke Tooling" docs/backlog/MVP2_DRAFT_BACKLOG.md`
  - `rg -n "Wave 8 opens|candidate detail drawer|evidence highlight|dedupe summary|new candidate detail endpoint|Missing or broken locators" docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
  - `rg -n "Wave 8 focused|Wave 8 Primary|status=DELETED|LNB|candidate result view|drawer/panel" docs/pm/MVP2_PREP_BRIEF.md`
  - `git diff --check -- docs/backlog/MVP2_DRAFT_BACKLOG.md docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md docs/pm/MVP2_PREP_BRIEF.md`
- 결과:
  - Wave 8 acceptance, API contract note, prep brief workflow 문구 확인 완료.
  - `git diff --check` PASS.
- 실행하지 못한 검증:
  - PM 문서 작업이라 backend/frontend runtime test는 실행하지 않았다.

## API/Enum/DTO 변경

- 변경 여부: 있음, 문서 계약 보완. 신규 endpoint/enum/DTO 추가는 없음.
- 상세:
  - Candidate detail drawer/panel은 Wave 8에서 새 `GET /api/v1/candidates/{candidate_id}` endpoint를 요구하지 않는다.
  - Existing `CandidateEntity[]`, `CandidateRelation[]`, `CandidateEvidence`, `GET /api/v1/candidate-evidence/{evidence_id}`, `GET /api/v1/extraction-jobs/{job_id}` 조합을 사용한다.
  - Evidence highlight는 existing `CandidateEvidence` locator field를 사용한다.
  - Retry-chain dedupe는 기존 retry natural key 기준을 유지하되, Wave 8 list/query에서 duplicate row를 노출하지 않는 acceptance를 추가했다.
  - Browser smoke tooling 결정은 API/enum/DTO에 영향 없음.
- 영향받는 역할:
  - Backend: retry-chain dedupe persistence/list behavior 구현 시 같은 natural key 기준 사용.
  - Frontend: candidate detail/evidence highlight를 신규 endpoint 없이 existing DTO로 구성.
  - QA: retry duplicate row, missing/broken evidence fallback, browser smoke fallback 증적 기준 검증.

## Blocker

- PM/Architecture 문서 blocker는 없음.
- 구현 blocker 후보:
  - Backend retry-chain dedupe 구현 시 reused/skipped count를 노출할지 여부는 optional이다. Wave 8은 새 DTO 필드를 요구하지 않는다.
  - Playwright browser install/certificate/local runtime 이슈가 재발하면 manual UAT/headless fallback 증적이 필요하다.

## 남은 TODO

- Backend: retry-chain dedupe 구현 및 list/query duplicate suppression 검증.
- Frontend: ontology modeler edit/delete, selected/recent navigation, LNB/drilldown, candidate detail drawer/panel, evidence highlight 구현.
- QA: Wave 8 acceptance 기준으로 browser smoke/manual fallback, retry dedupe, modeler delete impact, candidate/evidence fallback 검증.

## 다른 역할에 전달할 내용

- PM:
  - Wave 8은 focused feature expansion으로 승인 가능하다. 외부 LLM provider, review/publish, RAG, advanced PDF parsing, 대규모 리디자인은 계속 제외한다.
- Backend:
  - Retry dedupe scope는 retry chain 전체이며 retry root는 `retry_of_job_id`가 null인 최초 ancestor다.
  - Wave 8은 dedupe summary 신규 DTO 필드를 요구하지 않지만, list/query에서 duplicate candidate/evidence row는 보이지 않아야 한다.
  - Candidate detail 전용 endpoint는 Wave 8 범위가 아니다.
- Frontend:
  - LNB에는 전역 top-level 영역만 둔다. ID 기반 route는 parent row/action/context link와 breadcrumb/compact path로 진입한다.
  - Draft modeler edit/delete는 `status=DELETED` soft delete semantics로 UX를 구성한다.
  - Candidate detail drawer/panel과 evidence highlight는 existing DTO/endpoint로 구성한다.
- QA:
  - 긴 설명문이 아니라 화면 구조, next action, 상태, navigation path가 workflow를 전달하는지 확인한다.
  - Missing/broken evidence fallback과 delete 후 graph/list/detail selection 안정성을 필수로 본다.
  - Browser smoke는 Playwright 기준, 환경 제약 시 manual/headless fallback 증적을 요구한다.

## 총괄에게 요청하는 결정

- 추가 결정 요청 없음.

## 현재 판정

- PASS
