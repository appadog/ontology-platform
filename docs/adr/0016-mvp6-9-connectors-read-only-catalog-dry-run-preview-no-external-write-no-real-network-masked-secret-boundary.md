# ADR 0016: MVP6.9 Connectors / Plugin SDK — Read-Only Catalog + Dry-Run Import Preview, No-External-Write, No-Real-Network, Masked-Secret, All-False Mutation Guard Boundary

## Status

Accepted

## Context

MVP6.8 (ADR 0015) shipped the advisory-only, non-autonomous copilot: it suggests,
routes a human into an existing gated flow, and executes nothing (all-false
14-flag guard, no real LLM). MVP6.7 (ADR 0014) returned the platform to the
read-only, all-false posture after the single sanctioned MVP6.6 apply. MVP6.9 is
the next user-directed theme — roadmap §10 Theme 7 **Connector & Plugin SDK** —
kept to its smallest coherent, SAFE form.

The roadmap theme is broad and dangerous if taken whole: real Local File / S3 /
Database / REST / Web Crawler / Notion connectors, encrypted credentials, sync
jobs, and executable Parser/Extractor/Validator/Agent-Tool **plugins**. All of
that means external network calls, credential execution, background sync, and —
worst of all for this platform — a new path by which external-origin data could
reach the graph without the candidate/review gate, plus arbitrary plugin code
execution. None of that is acceptable in a first thin slice.

The product need at P0 is modest and safe: let a user **see which connector
kinds exist**, **inspect their (masked) config shape**, and **preview what a
connector import WOULD ingest** — deterministically, from fixture data, with
**nothing connected, nothing written, and nothing imported**. This mirrors two
already-shipped, trusted precedents: the MVP5 admin JSON import **dry-run**
(compatibility report, `confirmation_required`, no apply) with its
**masked-secret / one-time-reveal / never-log-raw** credential safety, and the
MVP6.4 gold-set import **dry-run compatibility** states. It also reuses the MVP2
source → candidate ingestion vocabulary by reference: any real ingestion is,
and remains, a `source → parse → extraction → candidate → review → publish`
pipeline. This ADR fixes the boundary so the connector surface cannot be
mistaken for a live sync, an external write path, a credential store, a plugin
runtime, or a second (ungated) way into the candidate/published graph.

Surfaces reused **by reference, no renames**:
- MVP5 masked-secret credential safety (`masked_secret`, `raw_secret` exists
  only at create — here **not even that**; `raw_secret_present:false`), the
  import **dry-run** shape (`compatibility_status`, `summary` counts,
  `confirmation_required`), and MVP5 `Role` for read authorization.
- MVP6.4 `GoldSetImportCompatibility` dry-run precedent (COMPATIBLE / WARNING /
  INCOMPATIBLE style states + strategy-gated confirm).
- MVP2 candidate pipeline (`CandidateEntity` / `CandidateRelation`,
  `source_segment`, `SourceParseResponse`, extraction-job) and MVP1
  `OntologyElementRef` / ontology version context — as the **would-be** target
  shapes a preview item maps to, never as created rows.

## Decision

- **MVP6.9 P0 is a project-scoped, read-only connector CATALOG + a deterministic
  DRY-RUN import PREVIEW.** Three surfaces only: (1) list the registered
  deterministic **mock** connector kinds; (2) get a connector kind's **masked**
  config schema; (3) run a **dry-run import preview** for a connector kind + mock
  config that returns a deterministic, bounded report of what WOULD be ingested
  as candidate-layer items plus a compatibility/summary rollup. Nothing is
  connected, persisted, or imported.

- **NO EXTERNAL WRITE / NO REAL NETWORK / NO CREDENTIAL EXECUTION — the
  load-bearing rule.** P0 connectors are **deterministic mock connectors backed
  by fixture sample data**. The platform makes **no real network call**, opens no
  socket, executes no credential, connects to no external system, and writes
  **nothing** to any external system. The dry-run preview is computed from
  fixture data keyed by `connector_kind` (+ non-secret config), so it is
  independent of any secret value — reinforcing that no credential is ever used.
  There is no connector **instance** persistence and no credential **storage** in
  P0.

- **PREVIEW-ONLY — nothing imported; the candidate/review gate is never
  bypassed.** An import preview creates **no** candidate entities/relations, **no**
  source, **no** extraction job; it does **not** touch the published graph and
  does **not** bypass the existing extraction/candidate-review gates. Preview
  items are **would-be** candidate-layer items (opaque `preview_ref`, mapped to an
  `OntologyElementRef`-style target by reference) — never created rows. Every
  response carries an explicit boundary note: *"preview only — nothing imported;
  a real run would route through the existing extraction → candidate → review →
  publish gate."* Any real ingestion in a later wave MUST route through that
  existing gated pipeline; external-origin data lands only in the candidate layer.

- **MASKED-SECRET / NO-RAW-SECRET — mirror MVP5.** No raw secret is ever printed,
  persisted, logged, or returned. Connector config schemas mark secret fields
  (`ConnectorConfigFieldKind = SECRET` or a `secret:true` flag); the catalog and
  schema surfaces expose **only** non-secret placeholders and masked values. A
  dry-run request may carry config values, but secret-field values are **never**
  echoed, persisted, or logged; the response surfaces masked values only and
  asserts `raw_secret_present:false`. All example values in every planning
  artifact are **non-secret placeholders** (e.g. `SECRET_PLACEHOLDER_NOT_A_REAL_SECRET`,
  `https://example.invalid/api`) — no realistic-looking secret literals.

- **ALL-FALSE mutation guard (frozen flags).** Every connector response
  (catalog list, config schema, import preview) carries an all-false
  `ConnectorMutationGuard`; every flag false, no exceptions:
  - `external_system_read: false`
  - `external_system_write: false`
  - `real_network_call_made: false`
  - `credential_persisted: false`
  - `connector_instance_persisted: false`
  - `source_created: false`
  - `candidate_graph_mutated: false`
  - `published_graph_mutated: false`
  - `extraction_job_started: false`

  This is the ADR 0016 core and the mirror of the MVP6.1–6.5 / 6.7 / 6.8 /
  benchmark all-false pattern (distinct from the single MVP6.6 apply guard, which
  turns one flag true; MVP6.9 turns **no** flag true, ever).

- **Connector catalog model (frozen, minimal).** `ConnectorKind` = exactly three
  deterministic mock kinds — `FILE_SOURCE` (CSV/JSON file-style source),
  `REST_SOURCE` (generic REST-ish API source), `KNOWLEDGE_BASE_SOURCE` (a
  knowledge-base/doc source). Each kind has a masked config schema: an ordered
  list of `ConnectorConfigField` descriptors (`name`, `label`,
  `field_kind`, `required`, `secret`, `placeholder`, `help_text`).
  `ConnectorConfigFieldKind` = `STRING` / `URL` / `ENUM` / `INTEGER` / `BOOLEAN`
  / `SECRET`. A `SECRET` field (or `secret:true`) is masked everywhere. No real
  connection is ever attempted.

- **Dry-run preview model (frozen, bounded, deterministic).** The preview returns
  a `ConnectorPreviewStatus` (`READY` / `BLOCKED`), a `ConnectorPreviewCompatibility`
  rollup (`COMPATIBLE` / `WARNING` / `INCOMPATIBLE`), a summary of counts
  (source records read from fixture, would-be candidate entities, would-be
  candidate relations, unmapped records, warnings), and a **capped** list of
  would-be candidate-layer preview items each targeting `ConnectorPreviewTargetLayer
  = CANDIDATE` only (never published). Bounding is deterministic and cheap: a max
  returned-items cap (P0, e.g. `50`) with a `truncated:true` flag + exact total
  count when the cap is hit; counts are always exact, only the item list is
  capped. Given the same connector kind + non-secret config against the same
  fixture, the preview is byte-stable. `INCOMPATIBLE` / invalid config →
  `BLOCKED` with reasons; never a crash, never fabricated items.

- **Authorization (frozen).** Read-only and mutates nothing and grants nothing,
  so any project member who can view the project may list the catalog, read a
  config schema, and run a dry-run preview; no elevated role is required. Reuse
  MVP5 `Role`; no new role literal. Later real ingestion (P1) would require an
  ingest-capable role (e.g. `SOURCE_MANAGER`) — out of P0. Unauthorized →
  `403 PERMISSION_DENIED`; missing project / unknown kind →
  `404 PROJECT_NOT_FOUND` / `404 CONNECTOR_KIND_NOT_FOUND`.

- **Persist-vs-compute (deferred to Backend/Wave50).** Whether a preview is
  computed on demand or persisted (keyed by a `preview_id`, mirroring the
  MVP6.3/6.7 record pattern for list + GET-by-id) is a Backend contract decision;
  either way it is read-only and carries the all-false guard. Durable DB/Alembic
  persistence is **not** required for the P0 thin slice; the proven deterministic
  process-local store (`reset_runtime_store()`, MVP6.1–6.8 pattern) is acceptable.

- **Out of scope (P1 or later unless explicitly promoted):** external write-back;
  live / scheduled / background / always-on connector sync; real network calls;
  real credential execution or connection to any external system; credential
  **storage** / encryption / vault / rotation; connector **instance** persistence;
  autonomous / auto-confirmed ingestion; a confirm-and-apply real import (any real
  ingestion must route through the existing gated pipeline in a later wave);
  **plugin code execution** and the entire Plugin* object family (Parser/Chunker/
  Extractor/Validator/Exporter/Visualization/Agent-Tool plugins,
  `PluginDefinition`/`PluginVersion`/`PluginExecution`/`PluginPermission`); real
  Database / S3-MinIO / Web-Crawler / Notion-Confluence-SharePoint / Git
  connectors; connector setup wizard write, sync job monitor, plugin management /
  execution log; direct candidate or published-graph mutation; source creation or
  extraction-job trigger from the preview; multi-tenant / cross-project connector
  runtime; real LLM execution.

## Consequences

- Backend can draft additive endpoint(s) — list connector catalog, get masked
  config schema, run dry-run import preview (compute and/or read a persisted
  preview) — reusing MVP5 masked-secret + import-dry-run shapes, MVP6.4
  compatibility precedent, and MVP2 candidate / MVP1 ontology-ref shapes **by
  reference (no renames)**, importing **no** external-network / candidate-write /
  extraction-trigger / credential-store path. It models `ConnectorKind`,
  `ConnectorConfigFieldKind`, `ConnectorPreviewStatus`,
  `ConnectorPreviewCompatibility`, `ConnectorPreviewTargetLayer`, the all-false
  `ConnectorMutationGuard`, bounded preview shapes (exact counts + capped
  `truncated` items), `raw_secret_present:false`, and `403`/`404`.
- Frontend can add a project-scoped connector catalog + dry-run preview surface
  in the Analyze/Sources area (ADR 0010: no new ID-bound global LNB item), with
  masked-secret config UX (no raw secret shown or required in P0), a persistent
  "preview only — nothing imported; routes through candidate review when actually
  run later" boundary banner, compatibility/summary + capped-sample states, a
  live all-false-guard proof line, and first-class loading/empty/error/permission
  states in the closed design language.
- QA can build deterministic local acceptance: catalog + schema are stable and
  mask secrets; the preview is byte-stable for a fixed kind + non-secret config;
  it is independent of secret value; counts are exact and items are cap+`truncated`
  bounded; `ConnectorMutationGuard` is all-false and no external call is made and
  no candidate/source/published/extraction row changes at the data level after a
  preview; a no-raw-secret scan of artifacts passes; authz `403`/`404`; and
  MVP1–MVP6.8 regression + smokes are green.
- The platform preserves candidate/published separation (the preview only maps to
  would-be candidate items; it writes nothing), evidence/version/audit
  traceability, no autonomous or ungated ingestion, no external write, no real
  network/credential execution, no plugin code execution, no raw-secret exposure,
  and no real LLM. The change is additive and does not alter MVP1–MVP6.8 paths,
  enums, or smokes. MVP6.9 keeps the all-false mutation-guard posture; it turns
  **no** mutation flag true.
