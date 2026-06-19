# ADR 0006: MVP 3 Published Graph Boundary and Versioning

## Status

Accepted

## Context

MVP 3 introduces validation, expert review, audit, publish jobs, and a published graph. The roadmap lists Graph DB integration and published version creation, but the project rule remains that LLM candidates must never be written directly to the published graph. Backend, Frontend, and QA need one P0 persistence boundary that works in local development and does not make Neo4j availability a product acceptance blocker.

The platform already separates candidate graph state from published graph state. MVP 3 must preserve that separation while allowing later graph database writes, rollback UX, and graph-oriented query improvements.

## Decision

- P0 canonical published graph storage is relational:
  - `PublishedEntity`
  - `PublishedRelation`
  - publish job history
  - published graph snapshot/version metadata
- Neo4j write is P1/optional adapter behavior for MVP 3. Backend may implement an adapter boundary and optionally write to Neo4j when local graph DB is available, but P0 APIs and QA acceptance must pass using relational canonical data.
- Each successful `PublishJob` creates an immutable published graph snapshot/version.
- Each project has a current published graph version pointer. Published graph query APIs default to the project current version.
- A published graph snapshot records enough source context to audit and later roll back or replace facts:
  - project id
  - publish job id
  - published graph version id or version number
  - ontology version id used for validation/publish
  - included candidate ids and candidate kind
  - original LLM value reference or snapshot
  - corrected value snapshot when applicable
  - reviewer decision and reason
  - created timestamp
- Full rollback UI is outside MVP 3 P0, but publish history and snapshot data must not prevent future rollback or replacement design.

## Consequences

- Backend can implement publish and query semantics without depending on Neo4j uptime or Docker Compose availability.
- Frontend can build the published graph explorer against stable API semantics: candidate graph and published graph are visually and contractually separate.
- QA can verify that pending, rejected, and needs-discussion candidates never appear in the project current published graph snapshot.
- Neo4j integration remains aligned with the product roadmap, but it is not required to close MVP 3 P0.
- Versioning is coarse-grained per successful publish job in MVP 3, not per individual fact mutation. Later MVPs may add richer graph diff, rollback, or partial replacement workflows on top of the snapshot history.
