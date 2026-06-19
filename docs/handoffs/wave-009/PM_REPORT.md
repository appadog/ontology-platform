# PM/Architecture Report - Wave 9

## 담당 범위

- backlog ID: support `BE-004`, `BE-005`, `FE-005`, `FE-014`, `FE2-006`, `INT2-002`
- 작업 경로: `docs/backlog/MVP2_DRAFT_BACKLOG.md`, `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`, `docs/pm/MVP2_PREP_BRIEF.md`

## 완료한 작업

- Wave 8 QA findings와 Wave 9 next orders를 기준으로 targeted hardening decision을 확정했다.
- Ontology class delete semantics를 결정했다.
  - Draft class delete는 cascade soft delete다.
  - 삭제 class는 `status=DELETED`가 되고 직접 연결 property/relation도 같은 draft에서 `status=DELETED` 처리한다.
  - Graph/extraction read path는 defensive filter를 적용해 deleted class에 연결된 property/relation을 노출하지 않는다.
- Delete confirmation copy acceptance를 확정했다.
  - Class name, affected property count, inbound relation count, outbound relation count, draft-only 적용 사실을 분리 표시한다.
  - Count는 이미 `DELETED`인 element를 제외한 현재 draft graph 기준이다.
  - Property/relation delete confirm도 target name과 draft-only 적용 사실을 표시한다.
- Evidence broken/direct route fallback acceptance를 확정했다.
  - App-generated evidence link는 parent project/source/job/candidate context를 유지해야 한다.
  - Broken/direct fallback은 evidence id, source id, source segment id, validation code를 보여준다.
  - Parent context가 있으면 candidate/job 복귀 action을 제공하고, 임의 direct URL이면 context-unavailable recovery action을 제공한다.
- LNB/drilldown targeted acceptance를 재확인했다.
  - ID 기반 detail page는 LNB에 평면 노출하지 않는다.
  - Project/source/job/candidate/evidence detail은 parent row/action/context link에서 진입한다.
  - Breadcrumb/compact path는 현재 맥락을 잃지 않아야 한다.
- Scope guard를 재확인했다.
  - External LLM provider, review/publish workflow, RAG, advanced PDF parsing, 대규모 리디자인, 신규 candidate detail endpoint, 신규 evidence status enum은 열지 않는다.

## 변경 파일

- `docs/backlog/MVP2_DRAFT_BACKLOG.md`
- `docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
- `docs/pm/MVP2_PREP_BRIEF.md`
- `docs/handoffs/wave-009/PM_REPORT.md`

## 실행/검증

- 실행한 명령:
  - `sed -n '1,220p' AGENTS.md`
  - `sed -n '1,240p' .agents/skills/handoff-reporting/SKILL.md`
  - `sed -n '1,260p' docs/handoffs/CURRENT_STATE.md`
  - `sed -n '1,260p' docs/handoffs/wave-008/NEXT_ORDERS.md`
  - `sed -n '1,280p' docs/handoffs/wave-008/QA_REPORT.md`
  - `sed -n '1,280p' docs/backlog/MVP2_DRAFT_BACKLOG.md`
  - `sed -n '1,460p' docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
  - `sed -n '1,220p' docs/pm/MVP2_PREP_BRIEF.md`
  - `rg -n 'Wave 9 Targeted Hardening Decisions|cascade soft delete|Read invariant|Delete confirmation copy acceptance|Evidence broken/direct route fallback acceptance|LNB/drilldown targeted acceptance|draft-only' docs/backlog/MVP2_DRAFT_BACKLOG.md`
  - `rg -n 'Wave 9 is targeted hardening|Wave 9 Ontology / Evidence Hardening|soft-delete|Extraction input builders|Delete confirmation counts|Evidence broken/direct' docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md`
  - `rg -n 'Wave 9 targeted hardening|Wave 9 Targeted Hardening Decisions|Class delete semantics|Delete confirmation|Evidence fallback|LNB/drilldown' docs/pm/MVP2_PREP_BRIEF.md`
  - `git diff --check -- docs/backlog/MVP2_DRAFT_BACKLOG.md docs/api/API_CONTRACT_PRIORITY_MVP2_DRAFT.md docs/pm/MVP2_PREP_BRIEF.md docs/handoffs/wave-009/PM_REPORT.md`
- 결과:
  - 필수 문서와 Wave 8 QA findings 확인 완료.
  - Wave 9 class delete, delete confirm, evidence fallback, LNB/drilldown 결정 문구 확인 완료.
  - `git diff --check` PASS.
- 실행하지 못한 검증:
  - PM/Architecture 문서 결정 작업이라 backend/frontend runtime test는 실행하지 않았다.

## API/Enum/DTO 변경

- 변경 여부: 있음, 문서 계약 보완. 신규 runtime endpoint/enum/DTO 추가는 없음.
- 상세:
  - `DELETE /api/v1/ontology/classes/{class_id}`는 soft delete로 유지한다.
  - Class delete 시 연결 property/relation cascade `status=DELETED`와 graph/extraction defensive filter를 계약 note로 추가했다.
  - Delete confirmation counts는 새 API response가 아니라 UI acceptance로 둔다.
  - Evidence fallback은 기존 `CandidateEvidence` field와 candidate `validation_codes[]`를 사용한다.
  - 신규 candidate detail endpoint, 신규 evidence status enum, review/publish/RAG/external LLM 범위는 열지 않는다.
- 영향받는 역할:
  - Backend: class delete cascade soft delete와 graph/extraction active-only invariant 구현/검증.
  - Frontend: delete confirm counts/copy, evidence route context/fallback, LNB/drilldown smoke 반영.
  - QA: orphan property, delete confirm, evidence fallback, LNB/drilldown targeted regression.

## Blocker

- PM/Architecture blocker는 없음.
- 구현 측 남은 blocker:
  - Backend class delete orphan graph property issue가 Wave 8 QA에서 재현됨.
  - Frontend delete confirmation copy/counts와 evidence fallback context가 Wave 8 QA에서 PARTIAL.
  - Docker CLI 부재는 기존 environment exception 유지.

## 남은 TODO

- Backend:
  - Class soft delete cascade와 graph/extraction defensive filtering 구현.
  - Deleted class 연결 property/relation이 graph/extraction input에 남지 않는 regression test 추가.
- Frontend:
  - Delete confirm에 class name, affected property count, inbound/outbound relation count, draft-only copy 표시.
  - Evidence fallback에 source id, source segment id, validation code, parent candidate/job recovery action 표시.
  - LNB/detail route/breadcrumb targeted smoke 유지.
- QA:
  - Wave 9 targeted regression으로 orphan property, delete confirm, evidence fallback, LNB/drilldown을 검증.

## 다른 역할에 전달할 내용

- PM:
  - Wave 9 PM decision은 PASS다. 더 넓은 MVP 2 확장은 QA targeted regression 이후 판단한다.
- Backend:
  - Cascade soft delete가 primary semantics다. Defensive graph/extraction filter도 필수 invariant다.
  - Physical delete로 바꾸지 않는다.
- Frontend:
  - Delete count는 현재 draft graph에서 이미 `DELETED`인 element를 제외하고 계산한다.
  - App-generated evidence link는 parent context를 전달해야 하며, 임의 direct URL은 context-unavailable recovery를 제공한다.
- QA:
  - Full sync wave가 아니라 targeted regression으로 충분하다.
  - App-generated evidence link에서 parent action이 빠지면 FAIL로 본다.

## 총괄에게 요청하는 결정

- 추가 결정 요청 없음.

## 현재 판정

- PASS
