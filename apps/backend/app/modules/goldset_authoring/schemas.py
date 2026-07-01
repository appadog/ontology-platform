from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

from app.modules.evaluation.schemas import (
    EvaluationDataset,
    EvaluationSample,
    GoldEntity,
    GoldEvidenceRef,
    GoldRelation,
)

# ---------------------------------------------------------------------------
# Frozen MVP6.4 enums (verbatim from openapi-mvp6-4-draft.json)
# ---------------------------------------------------------------------------


class GoldItemStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"


class DatasetRevisionStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    FROZEN = "FROZEN"
    ARCHIVED = "ARCHIVED"


class GoldAuthoringAction(str, Enum):
    CREATE = "CREATE"
    EDIT = "EDIT"
    ARCHIVE = "ARCHIVE"
    RESTORE = "RESTORE"
    EVIDENCE_ATTACH = "EVIDENCE_ATTACH"
    EVIDENCE_EDIT = "EVIDENCE_EDIT"
    REVISION_CUT = "REVISION_CUT"
    REVISION_ACTIVATE = "REVISION_ACTIVATE"
    IMPORT = "IMPORT"


class GoldSetImportCompatibility(str, Enum):
    COMPATIBLE = "COMPATIBLE"
    WARNING = "WARNING"
    CONFLICT = "CONFLICT"
    INCOMPATIBLE = "INCOMPATIBLE"


class GoldSetImportStrategy(str, Enum):
    CREATE_NEW_DATASET = "CREATE_NEW_DATASET"
    NEW_REVISION_OF_EXISTING = "NEW_REVISION_OF_EXISTING"


class RevisionFrozenReason(str, Enum):
    NEWER_REVISION_ACTIVATED = "NEWER_REVISION_ACTIVATED"
    PINNED_BY_RUN = "PINNED_BY_RUN"


class AuditTargetKind(str, Enum):
    GOLD_ENTITY = "GOLD_ENTITY"
    GOLD_RELATION = "GOLD_RELATION"
    GOLD_EVIDENCE = "GOLD_EVIDENCE"
    DATASET_REVISION = "DATASET_REVISION"
    DATASET = "DATASET"


# ---------------------------------------------------------------------------
# Guard + capability hint
# ---------------------------------------------------------------------------


class GoldAuthoringMutationGuard(BaseModel):
    published_graph_mutated: bool = False
    candidate_graph_mutated: bool = False
    prompt_version_mutated: bool = False
    ontology_definition_mutated: bool = False
    extraction_job_started: bool = False
    evaluation_run_started: bool = False
    prior_run_pin_rewritten: bool = False


class GoldAuthoringCapabilities(BaseModel):
    can_view: bool = True
    can_edit_gold_item: bool = False
    can_archive_gold_item: bool = False
    can_author_evidence: bool = False
    can_cut_revision: bool = False
    can_activate_revision: bool = False
    can_import: bool = False


# ---------------------------------------------------------------------------
# Reused MVP6.1 shapes + additive overlay (no rename)
# ---------------------------------------------------------------------------


class GoldItemAuthoringOverlay(BaseModel):
    status: GoldItemStatus = GoldItemStatus.ACTIVE
    revision_id: str | None = None
    evidence_id: str | None = None
    updated_at: datetime | None = None
    archived_at: datetime | None = None


class GoldEntityAuthoringView(GoldEntity, GoldItemAuthoringOverlay):
    pass


class GoldRelationAuthoringView(GoldRelation, GoldItemAuthoringOverlay):
    pass


# ---------------------------------------------------------------------------
# Standalone GoldEvidence (first-class) — GoldEvidenceRef fields preserved
# ---------------------------------------------------------------------------


class GoldEvidence(BaseModel):
    id: str
    project_id: str
    dataset_id: str
    revision_id: str | None = None
    gold_entity_id: str | None = None
    gold_relation_id: str | None = None
    status: GoldItemStatus = GoldItemStatus.ACTIVE
    sample_id: str
    source_id: str | None = None
    source_segment_id: str | None = None
    locator: str | None = None
    offset_start: int | None = None
    offset_end: int | None = None
    quote: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
    archived_at: datetime | None = None


# ---------------------------------------------------------------------------
# Revision shapes
# ---------------------------------------------------------------------------


class RunRevisionPin(BaseModel):
    run_id: str
    dataset_version_id: str | None = None
    revision_status: DatasetRevisionStatus | None = None
    pin_immutable: bool


class DatasetRevision(BaseModel):
    id: str
    dataset_id: str
    project_id: str
    revision_number: int
    status: DatasetRevisionStatus
    is_immutable: bool
    frozen_reason: RevisionFrozenReason | None = None
    sample_count: int = 0
    gold_entity_count: int = 0
    gold_relation_count: int = 0
    gold_evidence_count: int = 0
    pinned_run_count: int = 0
    parent_revision_id: str | None = None
    ontology_version_id: str | None = None
    created_at: datetime
    activated_at: datetime | None = None
    frozen_at: datetime | None = None
    created_by: str | None = None


class DatasetRevisionSummary(BaseModel):
    id: str
    dataset_id: str
    revision_number: int
    status: DatasetRevisionStatus
    is_immutable: bool
    frozen_reason: RevisionFrozenReason | None = None
    pinned_run_count: int = 0
    created_at: datetime


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------


class GoldEntityEditRequest(BaseModel):
    label: str | None = None
    normalized_value: str | None = None
    ontology_class_id: str | None = None
    evidence: GoldEvidenceRef | None = None
    reason: str | None = None


class GoldRelationEditRequest(BaseModel):
    ontology_relation_id: str | None = None
    source_gold_entity_id: str | None = None
    target_gold_entity_id: str | None = None
    evidence: GoldEvidenceRef | None = None
    reason: str | None = None


class GoldItemArchiveRequest(BaseModel):
    reason: str | None = None


class GoldEvidenceAttachRequest(BaseModel):
    gold_entity_id: str | None = None
    gold_relation_id: str | None = None
    sample_id: str
    source_id: str | None = None
    source_segment_id: str | None = None
    locator: str | None = None
    offset_start: int | None = None
    offset_end: int | None = None
    quote: str | None = None
    reason: str | None = None


class GoldEvidenceEditRequest(BaseModel):
    source_id: str | None = None
    source_segment_id: str | None = None
    locator: str | None = None
    offset_start: int | None = None
    offset_end: int | None = None
    quote: str | None = None
    reason: str | None = None


class DatasetRevisionCutRequest(BaseModel):
    note: str | None = None
    activate: bool = False


# ---------------------------------------------------------------------------
# Audit
# ---------------------------------------------------------------------------


class GoldAuthoringAuditEntry(BaseModel):
    id: str
    project_id: str
    dataset_id: str
    revision_id: str | None = None
    action: GoldAuthoringAction
    actor_id: str
    is_owner: bool = False
    target_kind: AuditTargetKind
    target_id: str
    before: dict[str, Any] | None = None
    after: dict[str, Any] | None = None
    reason: str | None = None
    created_at: datetime


# ---------------------------------------------------------------------------
# Mutation response envelopes
# ---------------------------------------------------------------------------


class GoldEntityMutationResponse(BaseModel):
    gold_entity: GoldEntityAuthoringView
    audit_entry: GoldAuthoringAuditEntry
    mutation_guard: GoldAuthoringMutationGuard = Field(default_factory=GoldAuthoringMutationGuard)
    capabilities: GoldAuthoringCapabilities | None = None


class GoldRelationMutationResponse(BaseModel):
    gold_relation: GoldRelationAuthoringView
    audit_entry: GoldAuthoringAuditEntry
    mutation_guard: GoldAuthoringMutationGuard = Field(default_factory=GoldAuthoringMutationGuard)
    capabilities: GoldAuthoringCapabilities | None = None


class GoldEvidenceMutationResponse(BaseModel):
    gold_evidence: GoldEvidence
    audit_entry: GoldAuthoringAuditEntry
    mutation_guard: GoldAuthoringMutationGuard = Field(default_factory=GoldAuthoringMutationGuard)
    capabilities: GoldAuthoringCapabilities | None = None


class DatasetRevisionMutationResponse(BaseModel):
    revision: DatasetRevision
    dataset: EvaluationDataset | None = None
    frozen_revision_id: str | None = None
    audit_entry: GoldAuthoringAuditEntry
    mutation_guard: GoldAuthoringMutationGuard = Field(default_factory=GoldAuthoringMutationGuard)
    capabilities: GoldAuthoringCapabilities | None = None


# ---------------------------------------------------------------------------
# Overview / list responses
# ---------------------------------------------------------------------------


class DatasetAuthoringOverview(BaseModel):
    dataset: EvaluationDataset
    active_revision: DatasetRevision | None = None
    revision_count: int = 0
    gold_status_counts: dict[str, int] = Field(default_factory=dict)
    pinned_runs: list[RunRevisionPin] = Field(default_factory=list)
    capabilities: GoldAuthoringCapabilities = Field(default_factory=GoldAuthoringCapabilities)
    mutation_guard: GoldAuthoringMutationGuard = Field(default_factory=GoldAuthoringMutationGuard)


class GoldEvidenceListResponse(BaseModel):
    items: list[GoldEvidence] = Field(default_factory=list)
    next_cursor: str | None = None


class DatasetRevisionListResponse(BaseModel):
    items: list[DatasetRevisionSummary] = Field(default_factory=list)
    next_cursor: str | None = None


class GoldAuthoringAuditListResponse(BaseModel):
    items: list[GoldAuthoringAuditEntry] = Field(default_factory=list)
    next_cursor: str | None = None


# ---------------------------------------------------------------------------
# Export / Import
# ---------------------------------------------------------------------------


class GoldSetExportBundle(BaseModel):
    bundle_version: str = "gold-set-bundle/1.0"
    source_project_id: str
    source_dataset_id: str
    source_revision_id: str
    revision_status: DatasetRevisionStatus | None = None
    ontology_version_id: str | None = None
    exported_at: datetime
    samples: list[EvaluationSample] = Field(default_factory=list)
    gold_entities: list[GoldEntityAuthoringView] = Field(default_factory=list)
    gold_relations: list[GoldRelationAuthoringView] = Field(default_factory=list)
    gold_evidence: list[GoldEvidence] = Field(default_factory=list)
    mutation_guard: GoldAuthoringMutationGuard = Field(default_factory=GoldAuthoringMutationGuard)


class GoldSetImportDryRunRequest(BaseModel):
    bundle: GoldSetExportBundle


class GoldSetImportIssue(BaseModel):
    code: str
    severity: GoldSetImportCompatibility
    ontology_class_id: str | None = None
    ontology_relation_id: str | None = None
    sample_id: str | None = None
    message: str


class GoldSetBundleSummary(BaseModel):
    bundle_version: str
    source_dataset_id: str | None = None
    source_revision_id: str | None = None
    sample_count: int = 0
    gold_entity_count: int = 0
    gold_relation_count: int = 0
    gold_evidence_count: int = 0


class GoldSetImportReport(BaseModel):
    import_id: str
    project_id: str
    compatibility: GoldSetImportCompatibility
    bundle_summary: GoldSetBundleSummary
    target_ontology_version_id: str | None = None
    issues: list[GoldSetImportIssue] = Field(default_factory=list)
    allowed_strategies: list[GoldSetImportStrategy] = Field(default_factory=list)
    blocking: bool = False
    mutation_guard: GoldAuthoringMutationGuard = Field(default_factory=GoldAuthoringMutationGuard)


class GoldSetImportConfirmRequest(BaseModel):
    strategy: GoldSetImportStrategy
    target_dataset_id: str | None = None
    activate: bool = False
    acknowledge_warnings: bool = False


class ImportedCounts(BaseModel):
    samples: int = 0
    gold_entities: int = 0
    gold_relations: int = 0
    gold_evidence: int = 0


class GoldSetImportConfirmResponse(BaseModel):
    import_id: str
    strategy: GoldSetImportStrategy
    created_dataset_id: str | None = None
    created_revision_id: str
    created_revision_status: DatasetRevisionStatus
    imported_counts: ImportedCounts
    audit_entry: GoldAuthoringAuditEntry
    mutation_guard: GoldAuthoringMutationGuard = Field(default_factory=GoldAuthoringMutationGuard)
