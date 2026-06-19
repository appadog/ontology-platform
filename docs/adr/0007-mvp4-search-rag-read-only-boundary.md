# ADR 0007: MVP 4 Search and RAG Read-Only Boundary

## Status

Accepted

## Context

MVP 4 adds integrated search, similar evidence search, grounded RAG answers,
advanced graph exploration, and external read-only graph/source/evidence APIs.
MVP 3 already established that candidate graph data and published graph data
are separate, and that published graph snapshots are the canonical P0 read
surface for approved facts.

Search and RAG now need their own durable boundary because they can make graph
facts visible to users and external consumers. Without a clear boundary,
candidate facts could leak into answers before review/publish, or vector search
could become an implicit product dependency before local keyword/RAG smoke is
stable.

## Decision

- MVP4 search and RAG are read-only. They must not create candidates, modify
  review decisions, or publish facts.
- Keyword search P0 covers:
  - published graph facts;
  - source records and source chunks;
  - evidence chunks;
  - review/audit lineage context when useful for traceability.
- Grounded RAG answer facts come only from published graph facts plus
  evidence/source chunks.
- Candidate graph facts are excluded from RAG answer generation and citations,
  even when those candidates have evidence or high confidence.
- Vector/similar evidence is a P0 contract and adapter boundary, not a
  production vector DB hardening requirement:
  - DTOs must expose embedding target, adapter status, similar evidence result
    shape, and fallback state.
  - Local MVP4 smoke may use keyword-backed similar evidence or an explicit
    vector-unavailable state.
  - Production vector DB operations, tuning, and scaling remain P1.
- External graph/source/evidence APIs are read-only in MVP4 and use development
  auth only. API keys, service accounts, quotas, and production security are
  MVP5 unless explicitly opened early.

## Consequences

- Backend can draft search, vector, RAG, and external API contracts without
  depending on a production vector database.
- Frontend can show result provenance, insufficient-evidence states, and
  vector-unavailable states without implying candidate facts are approved.
- QA can assert that RAG answers cite evidence/source chunks and linked
  published facts, and that candidate-only facts do not appear in answers.
- MVP4 remains compatible with ADR 0006: published graph snapshots are the
  canonical approved fact surface, while candidate data remains pre-publication
  workflow data.
