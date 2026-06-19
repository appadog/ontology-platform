# PM Report - Wave 14

## 담당 범위
- backlog ID: `PM3-001`, `PM3-002`, `PM3-003`, `PM3-004`, `PM3-005`; support `BE3-*`, `FE3-*`, `INT3-*`
- 작업 경로:
  - `docs/pm/MVP3_PREP_BRIEF.md`
  - `docs/backlog/MVP3_DRAFT_BACKLOG.md`
  - `docs/adr/0006-mvp3-published-graph-boundary-and-versioning.md`
  - `docs/handoffs/wave-014/PM_REPORT.md`

## 완료한 작업
- 필수 문서 확인 완료:
  - `AGENTS.md`
  - `.agents/skills/handoff-reporting/SKILL.md`
  - `docs/handoffs/CURRENT_STATE.md`
  - `docs/handoffs/wave-014/NEXT_ORDERS.md`
  - `docs/pm/MVP3_PREP_BRIEF.md`
  - `docs/backlog/MVP3_DRAFT_BACKLOG.md`
  - `00_PROJECT_ROADMAP_MVP_1_TO_5.md` MVP 3 section
  - `03_PM_AGENT_SKILL.md`
  - `docs/handoffs/REPORT_TEMPLATE.md`
- Wave 14 PM open decisions를 닫고 `docs/pm/MVP3_PREP_BRIEF.md`에 결정표를 추가했다.
- `ReviewDecision` enum과 `CandidateReviewStatus` mapping을 확정했다.
- `WARNING` candidate publish 정책을 확정했다.
- MVP 3 P0 published graph persistence boundary를 relational canonical tables + graph adapter boundary로 확정했다.
- published graph versioning을 successful publish job snapshot + project current pointer로 확정했다.
- review task assignment policy를 manual P0, automatic P1/MVP4+로 확정했다.
- persistence/publish boundary 결정을 ADR로 남겼다.
- `docs/backlog/MVP3_DRAFT_BACKLOG.md`의 Backend/Frontend/QA acceptance 문구를 PM 결정에 맞게 정렬했다.

## 변경 파일
- `docs/pm/MVP3_PREP_BRIEF.md`
- `docs/backlog/MVP3_DRAFT_BACKLOG.md`
- `docs/adr/0006-mvp3-published-graph-boundary-and-versioning.md`
- `docs/handoffs/wave-014/PM_REPORT.md`

## 실행/검증
- 실행한 명령:
  - `git diff --check -- docs/pm/MVP3_PREP_BRIEF.md docs/backlog/MVP3_DRAFT_BACKLOG.md docs/adr/0006-mvp3-published-graph-boundary-and-versioning.md docs/handoffs/wave-014/PM_REPORT.md`
  - `for f in docs/pm/MVP3_PREP_BRIEF.md docs/backlog/MVP3_DRAFT_BACKLOG.md docs/adr/0006-mvp3-published-graph-boundary-and-versioning.md docs/handoffs/wave-014/PM_REPORT.md; do git diff --no-index --check /dev/null "$f"; rc=$?; if [ "$rc" -ne 0 ] && [ "$rc" -ne 1 ]; then exit "$rc"; fi; done`
- 결과:
  - PASS. 출력 없음.
  - Note: MVP 3 docs are currently untracked in the worktree, so the no-index check was used to cover new markdown files.
- 실행하지 못한 검증:
  - 앱 build/test/smoke는 PM/Architecture 문서 범위 밖이다.

## API/Enum/DTO 변경
- 변경 여부: 있음, contract decision only.
- 상세:
  - 신규 구현은 하지 않았다.
  - MVP 3 `ReviewDecision` enum contract:
    - `APPROVE`
    - `REJECT`
    - `REQUEST_CHANGES`
    - `MODIFY_AND_APPROVE`
  - Mapping:
    - `APPROVE` -> `CandidateReviewStatus.APPROVED`
    - `REJECT` -> `CandidateReviewStatus.REJECTED`
    - `REQUEST_CHANGES` -> `CandidateReviewStatus.NEEDS_DISCUSSION`
    - `MODIFY_AND_APPROVE` -> `CandidateReviewStatus.MODIFIED`
  - Required reason:
    - `REJECT`, `REQUEST_CHANGES`, `MODIFY_AND_APPROVE` require reason.
    - `APPROVE` requires reason only when non-blocking `WARNING` validation exists.
  - Publish eligibility:
    - `review_status=APPROVED` or `MODIFIED`
    - evidence present
    - no `FAILED` validation
    - warning reviewer reason present when validation status is `WARNING`
    - `publish_status=NOT_PUBLISHED`
  - Published graph P0:
    - relational `PublishedEntity` / `PublishedRelation` canonical tables
    - Neo4j write P1/optional adapter
    - successful `PublishJob` creates immutable snapshot/version
    - project current published graph pointer defaults query target
- 영향받는 역할:
  - Backend: `BE3-001`~`BE3-010` draft should use the above enum, eligibility, versioning, and relational canonical boundary.
  - Frontend: `FE3-001`~`FE3-007` UI actions and filters should use canonical decision/status terms and manual assignment state.
  - QA: `INT3-001`~`INT3-007` checklists should cover warning publish, failed block, missing evidence block, request changes non-publishable state, and current snapshot query.

## Blocker
- Product blocker 없음.
- Environment blocker 없음 for PM docs.

## 남은 TODO
- Backend:
  - Draft Validation/Review/Publish/Audit/PublishedGraph API and data model against the closed PM decisions.
  - Decide exact OpenAPI artifact strategy for MVP 3, expected `docs/api/openapi-mvp3-draft.json` or equivalent.
- Frontend:
  - Review Backend draft for field/state/error needs and review workbench UX risks.
- QA:
  - Convert `INT3-001`~`INT3-007` into concrete acceptance checklists after Backend/Frontend contract draft.

## 다른 역할에 전달할 내용
- PM:
  - Wave 14 open decisions are closed; next PM role should only arbitrate mismatch if Backend/Frontend contract review finds one.
- Backend:
  - Do not make Neo4j availability a P0 dependency. Relational published tables are canonical for MVP 3.
  - Do not publish `NEEDS_DISCUSSION`, `REJECTED`, missing-evidence, failed-validation, or warning-without-reason candidates.
  - Create immutable snapshot/version per successful publish job and update the project current pointer.
- Frontend:
  - Use `REQUEST_CHANGES` as the API decision enum even if the UI label says "Needs discussion".
  - Show manual assignment state: assigned-to-me, unassigned, and assignee where available.
  - Published graph explorer should default to project current published graph snapshot and remain visually separate from candidate graph.
- QA:
  - Add explicit negative tests for rejected, needs-discussion, failed validation, missing evidence, and warning-without-reason candidates.
  - Add positive test for warning-with-reason candidate when evidence is present and no failed validation exists.

## 총괄에게 요청하는 결정
- 없음. Wave 14 PM open decisions are closed and ready for Backend/Frontend/QA follow-on work.

## 현재 판정
- PASS
