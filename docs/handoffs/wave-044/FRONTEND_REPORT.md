# Frontend Report - Wave 44 (MVP6.6 Governance Change Application — Apply UI)

## 담당 범위
- Backlog IDs: `FE6-069` (types/client/mocks + StatusBadge APPLIED/SUPERSEDED G7/G8),
  `FE6-070` (pre-check panel), `FE6-071` (apply confirm + APPLIED/SUPERSEDED/conflict
  states + applied-not-published banner), `FE6-072` (mock + actual smoke).
- Extend the existing MVP6.5 Governance detail page (`GovernanceDetailPage.tsx`) —
  NO new LNB item, NO new route. Additive; MOCK-FIRST against the frozen contract;
  actual smoke wired + run.

## 완료한 작업

### FE6-069 — types / client / query / mocks + G7/G8 badges
- `src/shared/api/types.ts`: added MVP6.6 DTOs matching `openapi-mvp6-6-draft.json`
  EXACTLY — `GovernanceApplicationMutationGuard` (one-true-flag `ontology_draft_mutated`,
  7 keys incl. `evaluation_run_started`), `OntologyElementRef`, `ApplicationItemPreview`,
  `ApplicationCapabilities` (`{can_view, can_apply}`), `GovernanceApplicationStatusResponse`,
  `GovernanceApplyRequest`, `ApplicationBeforeAfterRef`, `GovernanceApplicationAuditEntry`,
  `GovernanceApplyResponse`, `GovernanceApplicationAuditListResponse`,
  `GovernanceApplicationAuditAction`. Reused MVP6.5 `GovernanceApplicationState` /
  `ChangeRequestChangeType` / `ChangeRequestTargetKind` and MVP1 `OntologyElementStatus`
  / `OntologyVersionStatus` by reference (no renames, no re-declaration).
- `src/shared/api/client.ts`: added `getChangeRequestApplicationStatus`,
  `applyOntologyChangeRequest`, `listChangeRequestApplicationAudit` (mock + actual paths).
  Mock apply mutates the process-local request store to APPLIED, writes the
  application-audit entry, enforces idempotency (`CHANGE_ALREADY_APPLIED`),
  precondition (`CHANGE_NOT_APPLICABLE`), and staleness (`CHANGE_REQUEST_SUPERSEDED`,
  flips QUEUED→SUPERSEDED terminal). Read carries the all-false MVP6.5 guard.
- `src/shared/api/queries.ts`: `useChangeRequestApplicationStatus`,
  `useChangeRequestApplicationAudit`, `useApplyOntologyChangeRequest`; extended the
  governance invalidation set.
- `src/shared/mocks/mvp6GovernanceFixtures.ts`: target DRAFT `onto-v7-draft`, the
  one-true-flag `applyMutationGuard`, application capabilities, `buildItemPreviews`,
  `buildApplicationAudit`, and a stale-hint fixture (`ocr-approved-stale-007`).
- **G7** `src/shared/ui/platform/StatusBadge.tsx`: added `APPLIED` token
  (success / `CheckCircle2` / `초안에 적용됨 (미게시)`). `SUPERSEDED` warning tone is
  applied at the call site.
- **G7** `src/pages/governanceShared.tsx`: `ApplicationStateBadge` now renders real
  `APPLIED` (success `초안에 적용됨 (미게시)`) + `SUPERSEDED` (warning `대체됨 (미적용)`);
  any *other* unexpected literal still degrades to the P0-unsupported danger notice.

### FE6-070 — read-only application-status pre-check panel
- Shown only on APPROVED + QUEUED. Renders the resolved target DRAFT version +
  `OntologyVersionStatus` D6 badge, per-item before/after (`ADD`/`MODIFY`/`DEPRECATE`
  intended-effect KO copy), advisory `STALE` would-supersede hint, and the read-only
  reassurance line. loading/error(per-panel)/empty states.

### FE6-071 — apply action + confirmation + states + banner + G8 proof line
- Primary `초안에 적용`, gated on APPROVED+QUEUED AND `capabilities.can_apply`
  (never guessed from a 403), disabled if target not DRAFT. Behind a REQUIRED
  human-confirmation modal (no single-click, no auto-apply) that restates
  draft-only + publish-is-separate, shows the resolved target + item count, and
  repeats the would-supersede warning; `취소` is non-destructive.
- APPLIED → applied-not-published banner + `APPLIED` badge + **G8 one-true-flag
  proof line** (`ontology_draft_mutated=true`, others false), apply control absent.
- SUPERSEDED → warning badge + terminal non-destructive conflict notice.
- 409 (`CHANGE_REQUEST_SUPERSEDED` / `CHANGE_ALREADY_APPLIED` / `CHANGE_NOT_APPLICABLE`
  / `APPLY_TARGET_NOT_DRAFT`) + `403 PERMISSION_DENIED` → non-destructive notices with
  `새로고침`; nothing applied. No `게시`/`배포`/apply-and-publish affordance anywhere.

### FE6-072 — smokes
- Added `npm run smoke:mvp6:governance-apply:mock` (5 routes: pre-check → confirm
  modal → APPLIED banner+proof → audit → staleness SUPERSEDED notice) and
  `smoke:mvp6:governance-apply:actual` (propose→approve→pre-check→403→apply APPLIED
  one-true-flag→idempotency 409→application-audit).

## 변경 파일 (Frontend only)
- `src/shared/api/types.ts`, `src/shared/api/client.ts`, `src/shared/api/queries.ts`
- `src/shared/mocks/mvp6GovernanceFixtures.ts`
- `src/shared/ui/platform/StatusBadge.tsx`
- `src/pages/governanceShared.tsx`, `src/pages/GovernanceDetailPage.tsx`
- `src/shared/api/mvp6GovernanceMock.test.ts` (+6 MVP6.6 apply contract tests)
- `scripts/mvp6-governance-apply-mock-route-smoke.mjs`,
  `scripts/mvp6-governance-apply-actual-api-smoke.mjs`, `package.json`

## 실행 / 검증 결과 (exact output)

- `npm run test` → `Test Files  11 passed (11)` / `Tests  59 passed (59)`
  (16 in the governance file, incl. 6 new MVP6.6: pre-check read-only+all-false guard;
  apply→APPLIED one-true-flag; idempotency 409 CHANGE_ALREADY_APPLIED; staleness→409
  CHANGE_REQUEST_SUPERSEDED flip to terminal SUPERSEDED; non-APPROVED apply→409
  CHANGE_NOT_APPLICABLE; application-audit CHANGE_REQUEST_APPLIED).
- `npm run build` → `tsc --noEmit` clean + `vite build` `✓ built in 1.94s`.
- `npm run smoke:mvp6:governance-apply:mock` →
  `{ "status": "PASS", "routeCount": 5, "screenshotCount": 5 }`.
- `npm run smoke:mvp6:governance-apply:actual` (backend runnable — booted on SQLite:
  `alembic upgrade head` + `seed_mvp1` + inserted a `project-corp-knowledge` DB row) →
  `{ "status": "PASS", "checks": 6, "ids": { "change_request_id": "ocr-00002" } }`.
  Verified: apply→APPLIED, one-true-flag guard (`ontology_draft_mutated=true`, all six
  others false), staleness path unreachable in this fresh CR (covered in mock),
  403 PERMISSION_DENIED (non-destructive), idempotency 409 CHANGE_ALREADY_APPLIED,
  application-audit CHANGE_REQUEST_APPLIED. Read carries the all-false MVP6.5 guard
  (`ontology_definition_mutated`/`change_auto_applied`).
- Responsive 0-overflow re-check (`wave35-responsive-check.mjs`, governance detail
  = `ocr-approved-004` with the new application block): **0 horizontal overflow at
  1440/1366/1280/768** (and 1920/1024). Screenshots in scratchpad.
- `git diff --check` → CLEAN. No leftover listeners on 8000/5173.

## Backend contract mismatch
- **None.** Backend `application-status` / `apply` / `application-audit` responses
  match the frozen `openapi-mvp6-6-draft.json` field-for-field: `ApplicationCapabilities
  {can_view,can_apply}`, all-false MVP6.5 guard on reads, one-true-flag
  `GovernanceApplicationMutationGuard` on successful apply, error codes
  (`PERMISSION_DENIED`, `CHANGE_ALREADY_APPLIED`, `CHANGE_REQUEST_SUPERSEDED`,
  `APPLY_TARGET_NOT_DRAFT`, `CHANGE_NOT_APPLICABLE`).

## API / Enum / DTO 변경
- **None.** Additive types/client/query/mocks only; no rename of any MVP1–MVP6.5
  shape; no OpenAPI/enum change.

## Blocker
- None.

## 남은 TODO / QA 참고
- **환경 커플링 (QA):** the governance apply store keys the DRAFT target on the literal
  `project_id="project-corp-knowledge"` (`_SEED_PROJECT_ID` / `_DRAFT_VERSION_ID="ontology-v7"`),
  but `propose` validates the project against the DB. On a fresh SQLite boot the
  DB has no `project-corp-knowledge` row (MVP1 seed creates a UUID project), so the
  actual apply smoke required inserting a `project-corp-knowledge` DB project to line
  up the two identity spaces. QA should confirm the intended seed alignment (or run
  the actual smoke against whatever project the shared demo seed provides). Mock path
  has no such coupling.

## 총괄에게 요청하는 결정
- 없음. Scope 불변, additive-only, no regression.

## Verdict
- **PASS** — MVP6.6 apply UI implemented mock-first on the existing Governance detail
  (pre-check + human-confirmation apply + APPLIED/SUPERSEDED/conflict states +
  applied-not-published banner + G8 one-true-flag proof + application audit; G7 badges).
  test/build/mock-smoke/actual-smoke all green; 0 responsive overflow; no contract
  mismatch vs Backend; no MVP1–MVP6.5 / Wave35–42 regression.
