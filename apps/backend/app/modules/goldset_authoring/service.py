from __future__ import annotations

import itertools
from datetime import datetime, timezone

from app.core.enums import EvaluationDatasetStatus
from app.core.errors import ApiException
from app.modules.evaluation.schemas import (
    EvaluationDataset,
    EvaluationSample,
    EvaluationSampleKind,
    GoldEvidenceRef,
)

from .schemas import (
    AuditTargetKind,
    DatasetAuthoringOverview,
    DatasetRevision,
    DatasetRevisionCutRequest,
    DatasetRevisionListResponse,
    DatasetRevisionMutationResponse,
    DatasetRevisionStatus,
    DatasetRevisionSummary,
    GoldAuthoringAction,
    GoldAuthoringAuditEntry,
    GoldAuthoringAuditListResponse,
    GoldAuthoringCapabilities,
    GoldAuthoringMutationGuard,
    GoldEntityAuthoringView,
    GoldEntityEditRequest,
    GoldEntityMutationResponse,
    GoldEvidence,
    GoldEvidenceAttachRequest,
    GoldEvidenceEditRequest,
    GoldEvidenceListResponse,
    GoldEvidenceMutationResponse,
    GoldItemArchiveRequest,
    GoldItemStatus,
    GoldRelationAuthoringView,
    GoldRelationEditRequest,
    GoldRelationMutationResponse,
    GoldSetBundleSummary,
    GoldSetExportBundle,
    GoldSetImportCompatibility,
    GoldSetImportConfirmRequest,
    GoldSetImportConfirmResponse,
    GoldSetImportDryRunRequest,
    GoldSetImportIssue,
    GoldSetImportReport,
    GoldSetImportStrategy,
    ImportedCounts,
    RevisionFrozenReason,
    RunRevisionPin,
)

# Admin/PM actor token: authoring allowed regardless of dataset ownership.
ADMIN_ACTOR_ID = "admin"
DEFAULT_OWNER_ID = "dev-user"

# Ontology refs known to resolve in the seeded demo project (import resolution).
_KNOWN_ONTOLOGY_CLASS_IDS = {"class-clause", "class-company", "class-extra"}
_KNOWN_ONTOLOGY_RELATION_IDS = {"relation-has-clause", "relation-extra"}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Process-local store
# ---------------------------------------------------------------------------

_datasets: dict[str, EvaluationDataset] = {}
_samples: dict[str, EvaluationSample] = {}
_entities: dict[str, GoldEntityAuthoringView] = {}
_relations: dict[str, GoldRelationAuthoringView] = {}
_evidence: dict[str, GoldEvidence] = {}
_revisions: dict[str, DatasetRevision] = {}
_audit: list[GoldAuthoringAuditEntry] = []
# run pins: run_id -> dataset_version_id (revision id). NEVER rewritten.
_run_pins: dict[str, str] = {}
_imports: dict[str, GoldSetImportReport] = {}

_seeded = False
_audit_counter = itertools.count(1)
_id_counter = itertools.count(1)


def reset_runtime_store() -> None:
    global _seeded, _audit_counter, _id_counter
    _datasets.clear()
    _samples.clear()
    _entities.clear()
    _relations.clear()
    _evidence.clear()
    _revisions.clear()
    _audit.clear()
    _run_pins.clear()
    _imports.clear()
    _seeded = False
    _audit_counter = itertools.count(1)
    _id_counter = itertools.count(1)


def _next_audit_id() -> str:
    return f"gold-audit-{next(_audit_counter):05d}"


def _next_id(prefix: str) -> str:
    return f"{prefix}-{next(_id_counter):05d}"


# ---------------------------------------------------------------------------
# Deterministic seed (an expert-owned authoring dataset + a pinned run)
# ---------------------------------------------------------------------------

SEED_PROJECT_ID = "project-corp-knowledge"


def _ensure_seed() -> None:
    global _seeded
    if _seeded:
        return
    _seeded = True
    project_id = SEED_PROJECT_ID
    now = utc_now()
    dataset_id = f"{project_id}-authoring-dataset"

    sample = EvaluationSample(
        id=f"{dataset_id}-sample-1",
        project_id=project_id,
        dataset_id=dataset_id,
        sample_kind=EvaluationSampleKind.SOURCE_SEGMENT,
        source_id="doc-12",
        source_segment_id="seg-4",
        source_locator="p.3/para.2",
        title="청구 기한 조항",
        content_text="청구는 사고일로부터 3년 이내에 접수해야 한다.",
        created_at=now,
    )
    _samples[sample.id] = sample

    # v1 (parent, will become FROZEN by a run pin).
    rev1_id = f"{dataset_id}-v1"
    rev2_id = f"{dataset_id}-v2"

    entity = GoldEntityAuthoringView(
        id=f"{dataset_id}-gold-entity-1",
        project_id=project_id,
        dataset_id=dataset_id,
        sample_id=sample.id,
        ontology_class_id="class-clause",
        label="청구 기한",
        normalized_value="claim filing deadline",
        evidence=GoldEvidenceRef(
            sample_id=sample.id,
            source_id="doc-12",
            source_segment_id="seg-4",
            locator="p.3/para.2",
            offset_start=120,
            offset_end=188,
            quote="청구는 사고일로부터 3년 이내에...",
        ),
        created_at=now,
        status=GoldItemStatus.ACTIVE,
        revision_id=rev2_id,
    )
    _entities[entity.id] = entity

    relation = GoldRelationAuthoringView(
        id=f"{dataset_id}-gold-relation-1",
        project_id=project_id,
        dataset_id=dataset_id,
        sample_id=sample.id,
        ontology_relation_id="relation-has-clause",
        source_gold_entity_id=entity.id,
        target_gold_entity_id=entity.id,
        evidence=GoldEvidenceRef(
            sample_id=sample.id,
            source_id="doc-12",
            locator="p.3/para.2",
        ),
        created_at=now,
        status=GoldItemStatus.ACTIVE,
        revision_id=rev2_id,
    )
    _relations[relation.id] = relation

    dataset = EvaluationDataset(
        id=dataset_id,
        project_id=project_id,
        name="Authoring Gold Set",
        description="Expert-owned authoring dataset (MVP6.4).",
        status=EvaluationDatasetStatus.ACTIVE,
        sample_count=1,
        gold_entity_count=1,
        gold_relation_count=1,
        owner_id=DEFAULT_OWNER_ID,
        active_version_id=rev2_id,
        created_at=now,
        updated_at=now,
    )
    _datasets[dataset_id] = dataset

    # v1: a prior revision, pinned by an existing EvaluationRun -> FROZEN.
    _revisions[rev1_id] = DatasetRevision(
        id=rev1_id,
        dataset_id=dataset_id,
        project_id=project_id,
        revision_number=1,
        status=DatasetRevisionStatus.FROZEN,
        is_immutable=True,
        frozen_reason=RevisionFrozenReason.PINNED_BY_RUN,
        sample_count=1,
        gold_entity_count=1,
        gold_relation_count=1,
        gold_evidence_count=0,
        pinned_run_count=1,
        ontology_version_id="ontology-v7",
        created_at=now,
        frozen_at=now,
        created_by=DEFAULT_OWNER_ID,
    )
    # v2: the current ACTIVE revision.
    _revisions[rev2_id] = DatasetRevision(
        id=rev2_id,
        dataset_id=dataset_id,
        project_id=project_id,
        revision_number=2,
        status=DatasetRevisionStatus.ACTIVE,
        is_immutable=False,
        frozen_reason=None,
        sample_count=1,
        gold_entity_count=1,
        gold_relation_count=1,
        gold_evidence_count=0,
        pinned_run_count=0,
        parent_revision_id=rev1_id,
        ontology_version_id="ontology-v7",
        created_at=now,
        activated_at=now,
        created_by=DEFAULT_OWNER_ID,
    )
    # An existing evaluation run pins v1 (reproducibility anchor). Never rewritten.
    _run_pins[f"{project_id}-eval-run-pinned-v1"] = rev1_id


# ---------------------------------------------------------------------------
# Lookups + authorization
# ---------------------------------------------------------------------------


def _guard() -> GoldAuthoringMutationGuard:
    return GoldAuthoringMutationGuard()


def dataset_or_404(dataset_id: str) -> EvaluationDataset:
    _ensure_seed()
    dataset = _datasets.get(dataset_id)
    if dataset is None:
        raise ApiException(
            status_code=404,
            code="DATASET_NOT_FOUND",
            message="Evaluation dataset was not found.",
            details={"dataset_id": dataset_id},
        )
    return dataset


def revision_or_404(revision_id: str) -> DatasetRevision:
    _ensure_seed()
    revision = _revisions.get(revision_id)
    if revision is None:
        raise ApiException(
            status_code=404,
            code="REVISION_NOT_FOUND",
            message="Dataset revision was not found.",
            details={"revision_id": revision_id},
        )
    return revision


def _is_owner(dataset: EvaluationDataset, actor_id: str) -> bool:
    return actor_id == ADMIN_ACTOR_ID or actor_id == dataset.owner_id


def capabilities_for(dataset: EvaluationDataset, actor_id: str) -> GoldAuthoringCapabilities:
    owner = _is_owner(dataset, actor_id)
    return GoldAuthoringCapabilities(
        can_view=True,
        can_edit_gold_item=owner,
        can_archive_gold_item=owner,
        can_author_evidence=owner,
        can_cut_revision=owner,
        can_activate_revision=owner,
        can_import=owner,
    )


def _require_owner(dataset: EvaluationDataset, actor_id: str) -> None:
    if not _is_owner(dataset, actor_id):
        raise ApiException(
            status_code=403,
            code="PERMISSION_DENIED",
            message="Only the dataset owner or an admin may author this gold set.",
            details={"dataset_id": dataset.id, "actor_id": actor_id},
        )


def _entity_or_404(dataset_id: str, entity_id: str) -> GoldEntityAuthoringView:
    entity = _entities.get(entity_id)
    if entity is None or entity.dataset_id != dataset_id:
        raise ApiException(
            status_code=404,
            code="GOLD_ITEM_NOT_FOUND",
            message="Gold entity was not found in the dataset.",
            details={"dataset_id": dataset_id, "gold_entity_id": entity_id},
        )
    return entity


def _relation_or_404(dataset_id: str, relation_id: str) -> GoldRelationAuthoringView:
    relation = _relations.get(relation_id)
    if relation is None or relation.dataset_id != dataset_id:
        raise ApiException(
            status_code=404,
            code="GOLD_ITEM_NOT_FOUND",
            message="Gold relation was not found in the dataset.",
            details={"dataset_id": dataset_id, "gold_relation_id": relation_id},
        )
    return relation


def _evidence_or_404(evidence_id: str) -> GoldEvidence:
    _ensure_seed()
    evidence = _evidence.get(evidence_id)
    if evidence is None:
        raise ApiException(
            status_code=404,
            code="GOLD_EVIDENCE_NOT_FOUND",
            message="Gold evidence was not found.",
            details={"evidence_id": evidence_id},
        )
    return evidence


def _is_frozen_revision(revision_id: str | None) -> bool:
    if revision_id is None:
        return False
    revision = _revisions.get(revision_id)
    if revision is None:
        return False
    # Derive the freeze-on-pin transition before inspecting immutability.
    revision = _apply_freeze_on_pin(revision)
    return revision.status in {
        DatasetRevisionStatus.FROZEN,
        DatasetRevisionStatus.ARCHIVED,
    }


def _assert_item_mutable(revision_id: str | None) -> None:
    if _is_frozen_revision(revision_id):
        raise ApiException(
            status_code=409,
            code="GOLD_ITEM_IMMUTABLE",
            message="Gold item belongs to a FROZEN revision and is immutable.",
            details={"revision_id": revision_id},
        )


def _audit_entry(
    *,
    project_id: str,
    dataset_id: str,
    action: GoldAuthoringAction,
    actor_id: str,
    is_owner: bool,
    target_kind: AuditTargetKind,
    target_id: str,
    revision_id: str | None = None,
    before: dict | None = None,
    after: dict | None = None,
    reason: str | None = None,
) -> GoldAuthoringAuditEntry:
    entry = GoldAuthoringAuditEntry(
        id=_next_audit_id(),
        project_id=project_id,
        dataset_id=dataset_id,
        revision_id=revision_id,
        action=action,
        actor_id=actor_id,
        is_owner=is_owner,
        target_kind=target_kind,
        target_id=target_id,
        before=before,
        after=after,
        reason=reason,
        created_at=utc_now(),
    )
    _audit.append(entry)
    return entry


# ---------------------------------------------------------------------------
# A. Gold item edit / archive / restore
# ---------------------------------------------------------------------------


def edit_gold_entity(
    dataset_id: str, entity_id: str, payload: GoldEntityEditRequest, actor_id: str
) -> GoldEntityMutationResponse:
    dataset = dataset_or_404(dataset_id)
    _require_owner(dataset, actor_id)
    entity = _entity_or_404(dataset_id, entity_id)
    _assert_item_mutable(entity.revision_id)

    update = payload.model_dump(exclude_unset=True, exclude={"reason"})
    if not update:
        raise ApiException(
            status_code=400,
            code="GOLD_ITEM_INVALID_TRANSITION",
            message="At least one mutating field is required.",
            details={"gold_entity_id": entity_id},
        )
    before = {k: getattr(entity, k) for k in update if hasattr(entity, k)}
    new = entity.model_copy(update={**update, "updated_at": utc_now()})
    _entities[entity_id] = new
    entry = _audit_entry(
        project_id=dataset.project_id,
        dataset_id=dataset_id,
        action=GoldAuthoringAction.EDIT,
        actor_id=actor_id,
        is_owner=_is_owner(dataset, actor_id),
        target_kind=AuditTargetKind.GOLD_ENTITY,
        target_id=entity_id,
        revision_id=new.revision_id,
        before=_jsonable(before),
        after=_jsonable({k: getattr(new, k) for k in update if hasattr(new, k)}),
        reason=payload.reason,
    )
    return GoldEntityMutationResponse(
        gold_entity=new,
        audit_entry=entry,
        mutation_guard=_guard(),
        capabilities=capabilities_for(dataset, actor_id),
    )


def _set_entity_status(
    dataset_id: str,
    entity_id: str,
    actor_id: str,
    *,
    action: GoldAuthoringAction,
    target_status: GoldItemStatus,
    reason: str | None,
    require_archived: bool,
) -> GoldEntityMutationResponse:
    dataset = dataset_or_404(dataset_id)
    _require_owner(dataset, actor_id)
    entity = _entity_or_404(dataset_id, entity_id)
    _assert_item_mutable(entity.revision_id)
    if require_archived and entity.status != GoldItemStatus.ARCHIVED:
        raise ApiException(
            status_code=409,
            code="GOLD_ITEM_INVALID_TRANSITION",
            message="Only an ARCHIVED gold item can be restored.",
            details={"gold_entity_id": entity_id, "status": entity.status.value},
        )
    now = utc_now()
    new = entity.model_copy(
        update={
            "status": target_status,
            "updated_at": now,
            "archived_at": now if target_status == GoldItemStatus.ARCHIVED else None,
        }
    )
    _entities[entity_id] = new
    entry = _audit_entry(
        project_id=dataset.project_id,
        dataset_id=dataset_id,
        action=action,
        actor_id=actor_id,
        is_owner=_is_owner(dataset, actor_id),
        target_kind=AuditTargetKind.GOLD_ENTITY,
        target_id=entity_id,
        revision_id=new.revision_id,
        before={"status": entity.status.value},
        after={"status": new.status.value},
        reason=reason,
    )
    return GoldEntityMutationResponse(
        gold_entity=new,
        audit_entry=entry,
        mutation_guard=_guard(),
        capabilities=capabilities_for(dataset, actor_id),
    )


def archive_gold_entity(
    dataset_id: str, entity_id: str, payload: GoldItemArchiveRequest, actor_id: str
) -> GoldEntityMutationResponse:
    return _set_entity_status(
        dataset_id,
        entity_id,
        actor_id,
        action=GoldAuthoringAction.ARCHIVE,
        target_status=GoldItemStatus.ARCHIVED,
        reason=payload.reason,
        require_archived=False,
    )


def restore_gold_entity(
    dataset_id: str, entity_id: str, payload: GoldItemArchiveRequest, actor_id: str
) -> GoldEntityMutationResponse:
    return _set_entity_status(
        dataset_id,
        entity_id,
        actor_id,
        action=GoldAuthoringAction.RESTORE,
        target_status=GoldItemStatus.ACTIVE,
        reason=payload.reason,
        require_archived=True,
    )


def edit_gold_relation(
    dataset_id: str, relation_id: str, payload: GoldRelationEditRequest, actor_id: str
) -> GoldRelationMutationResponse:
    dataset = dataset_or_404(dataset_id)
    _require_owner(dataset, actor_id)
    relation = _relation_or_404(dataset_id, relation_id)
    _assert_item_mutable(relation.revision_id)
    update = payload.model_dump(exclude_unset=True, exclude={"reason"})
    if not update:
        raise ApiException(
            status_code=400,
            code="GOLD_ITEM_INVALID_TRANSITION",
            message="At least one mutating field is required.",
            details={"gold_relation_id": relation_id},
        )
    before = {k: getattr(relation, k) for k in update if hasattr(relation, k)}
    new = relation.model_copy(update={**update, "updated_at": utc_now()})
    _relations[relation_id] = new
    entry = _audit_entry(
        project_id=dataset.project_id,
        dataset_id=dataset_id,
        action=GoldAuthoringAction.EDIT,
        actor_id=actor_id,
        is_owner=_is_owner(dataset, actor_id),
        target_kind=AuditTargetKind.GOLD_RELATION,
        target_id=relation_id,
        revision_id=new.revision_id,
        before=_jsonable(before),
        after=_jsonable({k: getattr(new, k) for k in update if hasattr(new, k)}),
        reason=payload.reason,
    )
    return GoldRelationMutationResponse(
        gold_relation=new,
        audit_entry=entry,
        mutation_guard=_guard(),
        capabilities=capabilities_for(dataset, actor_id),
    )


def _set_relation_status(
    dataset_id: str,
    relation_id: str,
    actor_id: str,
    *,
    action: GoldAuthoringAction,
    target_status: GoldItemStatus,
    reason: str | None,
    require_archived: bool,
) -> GoldRelationMutationResponse:
    dataset = dataset_or_404(dataset_id)
    _require_owner(dataset, actor_id)
    relation = _relation_or_404(dataset_id, relation_id)
    _assert_item_mutable(relation.revision_id)
    if require_archived and relation.status != GoldItemStatus.ARCHIVED:
        raise ApiException(
            status_code=409,
            code="GOLD_ITEM_INVALID_TRANSITION",
            message="Only an ARCHIVED gold item can be restored.",
            details={"gold_relation_id": relation_id, "status": relation.status.value},
        )
    now = utc_now()
    new = relation.model_copy(
        update={
            "status": target_status,
            "updated_at": now,
            "archived_at": now if target_status == GoldItemStatus.ARCHIVED else None,
        }
    )
    _relations[relation_id] = new
    entry = _audit_entry(
        project_id=dataset.project_id,
        dataset_id=dataset_id,
        action=action,
        actor_id=actor_id,
        is_owner=_is_owner(dataset, actor_id),
        target_kind=AuditTargetKind.GOLD_RELATION,
        target_id=relation_id,
        revision_id=new.revision_id,
        before={"status": relation.status.value},
        after={"status": new.status.value},
        reason=reason,
    )
    return GoldRelationMutationResponse(
        gold_relation=new,
        audit_entry=entry,
        mutation_guard=_guard(),
        capabilities=capabilities_for(dataset, actor_id),
    )


def archive_gold_relation(
    dataset_id: str, relation_id: str, payload: GoldItemArchiveRequest, actor_id: str
) -> GoldRelationMutationResponse:
    return _set_relation_status(
        dataset_id,
        relation_id,
        actor_id,
        action=GoldAuthoringAction.ARCHIVE,
        target_status=GoldItemStatus.ARCHIVED,
        reason=payload.reason,
        require_archived=False,
    )


def restore_gold_relation(
    dataset_id: str, relation_id: str, payload: GoldItemArchiveRequest, actor_id: str
) -> GoldRelationMutationResponse:
    return _set_relation_status(
        dataset_id,
        relation_id,
        actor_id,
        action=GoldAuthoringAction.RESTORE,
        target_status=GoldItemStatus.ACTIVE,
        reason=payload.reason,
        require_archived=True,
    )


# ---------------------------------------------------------------------------
# B. Standalone GoldEvidence CRUD
# ---------------------------------------------------------------------------


def _resolve_target_revision(
    dataset_id: str, gold_entity_id: str | None, gold_relation_id: str | None
) -> str | None:
    if gold_entity_id is not None:
        return _entity_or_404(dataset_id, gold_entity_id).revision_id
    if gold_relation_id is not None:
        return _relation_or_404(dataset_id, gold_relation_id).revision_id
    return None


def attach_gold_evidence(
    dataset_id: str, payload: GoldEvidenceAttachRequest, actor_id: str
) -> GoldEvidenceMutationResponse:
    dataset = dataset_or_404(dataset_id)
    _require_owner(dataset, actor_id)
    has_entity = payload.gold_entity_id is not None
    has_relation = payload.gold_relation_id is not None
    if has_entity == has_relation:
        raise ApiException(
            status_code=400,
            code="GOLD_EVIDENCE_TARGET_INVALID",
            message="Exactly one of gold_entity_id/gold_relation_id is required.",
            details={
                "gold_entity_id": payload.gold_entity_id,
                "gold_relation_id": payload.gold_relation_id,
            },
        )
    revision_id = _resolve_target_revision(
        dataset_id, payload.gold_entity_id, payload.gold_relation_id
    )
    _assert_item_mutable(revision_id)
    now = utc_now()
    evidence = GoldEvidence(
        id=_next_id("gold-evidence"),
        project_id=dataset.project_id,
        dataset_id=dataset_id,
        revision_id=revision_id,
        gold_entity_id=payload.gold_entity_id,
        gold_relation_id=payload.gold_relation_id,
        status=GoldItemStatus.ACTIVE,
        sample_id=payload.sample_id,
        source_id=payload.source_id,
        source_segment_id=payload.source_segment_id,
        locator=payload.locator,
        offset_start=payload.offset_start,
        offset_end=payload.offset_end,
        quote=payload.quote,
        created_at=now,
        updated_at=now,
    )
    _evidence[evidence.id] = evidence
    # Mirror the standalone evidence id onto the target gold item (back-compat).
    if has_entity:
        target = _entities[payload.gold_entity_id]
        _entities[payload.gold_entity_id] = target.model_copy(update={"evidence_id": evidence.id})
    else:
        target = _relations[payload.gold_relation_id]
        _relations[payload.gold_relation_id] = target.model_copy(
            update={"evidence_id": evidence.id}
        )
    entry = _audit_entry(
        project_id=dataset.project_id,
        dataset_id=dataset_id,
        action=GoldAuthoringAction.EVIDENCE_ATTACH,
        actor_id=actor_id,
        is_owner=_is_owner(dataset, actor_id),
        target_kind=AuditTargetKind.GOLD_EVIDENCE,
        target_id=evidence.id,
        revision_id=revision_id,
        after={"evidence_id": evidence.id},
        reason=payload.reason,
    )
    return GoldEvidenceMutationResponse(
        gold_evidence=evidence,
        audit_entry=entry,
        mutation_guard=_guard(),
        capabilities=capabilities_for(dataset, actor_id),
    )


def list_gold_evidence(
    dataset_id: str, status: GoldItemStatus | None = None
) -> GoldEvidenceListResponse:
    dataset_or_404(dataset_id)
    items = [
        ev
        for ev in _evidence.values()
        if ev.dataset_id == dataset_id and (status is None or ev.status == status)
    ]
    return GoldEvidenceListResponse(items=items)


def get_gold_evidence(evidence_id: str) -> GoldEvidence:
    return _evidence_or_404(evidence_id)


def edit_gold_evidence(
    evidence_id: str, payload: GoldEvidenceEditRequest, actor_id: str
) -> GoldEvidenceMutationResponse:
    evidence = _evidence_or_404(evidence_id)
    dataset = dataset_or_404(evidence.dataset_id)
    _require_owner(dataset, actor_id)
    _assert_item_mutable(evidence.revision_id)
    update = payload.model_dump(exclude_unset=True, exclude={"reason"})
    if not update:
        raise ApiException(
            status_code=400,
            code="GOLD_ITEM_INVALID_TRANSITION",
            message="At least one mutating field is required.",
            details={"evidence_id": evidence_id},
        )
    before = {k: getattr(evidence, k) for k in update if hasattr(evidence, k)}
    new = evidence.model_copy(update={**update, "updated_at": utc_now()})
    _evidence[evidence_id] = new
    entry = _audit_entry(
        project_id=dataset.project_id,
        dataset_id=dataset.id,
        action=GoldAuthoringAction.EVIDENCE_EDIT,
        actor_id=actor_id,
        is_owner=_is_owner(dataset, actor_id),
        target_kind=AuditTargetKind.GOLD_EVIDENCE,
        target_id=evidence_id,
        revision_id=new.revision_id,
        before=_jsonable(before),
        after=_jsonable({k: getattr(new, k) for k in update if hasattr(new, k)}),
        reason=payload.reason,
    )
    return GoldEvidenceMutationResponse(
        gold_evidence=new,
        audit_entry=entry,
        mutation_guard=_guard(),
        capabilities=capabilities_for(dataset, actor_id),
    )


def archive_gold_evidence(
    evidence_id: str, payload: GoldItemArchiveRequest, actor_id: str
) -> GoldEvidenceMutationResponse:
    evidence = _evidence_or_404(evidence_id)
    dataset = dataset_or_404(evidence.dataset_id)
    _require_owner(dataset, actor_id)
    _assert_item_mutable(evidence.revision_id)
    now = utc_now()
    new = evidence.model_copy(
        update={"status": GoldItemStatus.ARCHIVED, "updated_at": now, "archived_at": now}
    )
    _evidence[evidence_id] = new
    entry = _audit_entry(
        project_id=dataset.project_id,
        dataset_id=dataset.id,
        action=GoldAuthoringAction.ARCHIVE,
        actor_id=actor_id,
        is_owner=_is_owner(dataset, actor_id),
        target_kind=AuditTargetKind.GOLD_EVIDENCE,
        target_id=evidence_id,
        revision_id=new.revision_id,
        before={"status": evidence.status.value},
        after={"status": new.status.value},
        reason=payload.reason,
    )
    return GoldEvidenceMutationResponse(
        gold_evidence=new,
        audit_entry=entry,
        mutation_guard=_guard(),
        capabilities=capabilities_for(dataset, actor_id),
    )


# ---------------------------------------------------------------------------
# Freeze-on-pin (frozen rule) + revision helpers
# ---------------------------------------------------------------------------


def _pinned_run_count(revision_id: str) -> int:
    return sum(1 for pinned in _run_pins.values() if pinned == revision_id)


def _apply_freeze_on_pin(revision: DatasetRevision) -> DatasetRevision:
    """Frozen rule: pinned_run_count > 0 -> transition to FROZEN(PINNED_BY_RUN)."""
    count = _pinned_run_count(revision.id)
    if count > 0 and revision.status == DatasetRevisionStatus.ACTIVE:
        now = utc_now()
        frozen = revision.model_copy(
            update={
                "status": DatasetRevisionStatus.FROZEN,
                "is_immutable": True,
                "frozen_reason": RevisionFrozenReason.PINNED_BY_RUN,
                "frozen_at": now,
                "pinned_run_count": count,
            }
        )
        _revisions[revision.id] = frozen
        # Vacate the ACTIVE slot on the dataset (active_version_id may be null).
        dataset = _datasets.get(revision.dataset_id)
        if dataset is not None and dataset.active_version_id == revision.id:
            _datasets[revision.dataset_id] = dataset.model_copy(
                update={"active_version_id": None}
            )
        return frozen
    if count != revision.pinned_run_count:
        synced = revision.model_copy(update={"pinned_run_count": count})
        _revisions[revision.id] = synced
        return synced
    return revision


def _resolved_revision(revision_id: str) -> DatasetRevision:
    return _apply_freeze_on_pin(revision_or_404(revision_id))


def _next_revision_number(dataset_id: str) -> int:
    existing = [r.revision_number for r in _revisions.values() if r.dataset_id == dataset_id]
    return (max(existing) + 1) if existing else 1


# ---------------------------------------------------------------------------
# C. Revisions: cut / list / get / activate
# ---------------------------------------------------------------------------


def _snapshot_counts(dataset_id: str) -> tuple[int, int, int, int]:
    samples = sum(1 for s in _samples.values() if s.dataset_id == dataset_id)
    entities = sum(
        1
        for e in _entities.values()
        if e.dataset_id == dataset_id and e.status != GoldItemStatus.ARCHIVED
    )
    relations = sum(
        1
        for r in _relations.values()
        if r.dataset_id == dataset_id and r.status != GoldItemStatus.ARCHIVED
    )
    evidence = sum(
        1
        for ev in _evidence.values()
        if ev.dataset_id == dataset_id and ev.status != GoldItemStatus.ARCHIVED
    )
    return samples, entities, relations, evidence


def cut_revision(
    dataset_id: str, payload: DatasetRevisionCutRequest, actor_id: str
) -> DatasetRevisionMutationResponse:
    dataset = dataset_or_404(dataset_id)
    _require_owner(dataset, actor_id)
    if dataset.status == EvaluationDatasetStatus.ARCHIVED:
        raise ApiException(
            status_code=409,
            code="DATASET_ARCHIVED",
            message="Cannot cut a revision of an archived dataset.",
            details={"dataset_id": dataset_id},
        )
    now = utc_now()
    samples, entities, relations, evidence = _snapshot_counts(dataset_id)
    number = _next_revision_number(dataset_id)
    new_id = f"{dataset_id}-v{number}"
    parent_id = dataset.active_version_id
    frozen_revision_id: str | None = None

    new_status = (
        DatasetRevisionStatus.ACTIVE if payload.activate else DatasetRevisionStatus.DRAFT
    )
    revision = DatasetRevision(
        id=new_id,
        dataset_id=dataset_id,
        project_id=dataset.project_id,
        revision_number=number,
        status=new_status,
        is_immutable=False,
        frozen_reason=None,
        sample_count=samples,
        gold_entity_count=entities,
        gold_relation_count=relations,
        gold_evidence_count=evidence,
        pinned_run_count=0,
        parent_revision_id=parent_id,
        ontology_version_id="ontology-v7",
        created_at=now,
        activated_at=now if payload.activate else None,
        created_by=actor_id,
    )
    _revisions[new_id] = revision

    if payload.activate:
        if parent_id and parent_id in _revisions:
            prior = _revisions[parent_id]
            if prior.status == DatasetRevisionStatus.ACTIVE:
                _revisions[parent_id] = prior.model_copy(
                    update={
                        "status": DatasetRevisionStatus.FROZEN,
                        "is_immutable": True,
                        "frozen_reason": RevisionFrozenReason.NEWER_REVISION_ACTIVATED,
                        "frozen_at": now,
                    }
                )
                frozen_revision_id = parent_id
        dataset = dataset.model_copy(update={"active_version_id": new_id, "updated_at": now})
        _datasets[dataset_id] = dataset

    entry = _audit_entry(
        project_id=dataset.project_id,
        dataset_id=dataset_id,
        action=GoldAuthoringAction.REVISION_CUT,
        actor_id=actor_id,
        is_owner=_is_owner(dataset, actor_id),
        target_kind=AuditTargetKind.DATASET_REVISION,
        target_id=new_id,
        revision_id=new_id,
        reason=payload.note,
    )
    return DatasetRevisionMutationResponse(
        revision=revision,
        dataset=dataset,
        frozen_revision_id=frozen_revision_id,
        audit_entry=entry,
        mutation_guard=_guard(),
        capabilities=capabilities_for(dataset, actor_id),
    )


def list_revisions(
    dataset_id: str, revision_status: DatasetRevisionStatus | None = None
) -> DatasetRevisionListResponse:
    dataset_or_404(dataset_id)
    items: list[DatasetRevisionSummary] = []
    for rev in sorted(
        (r for r in _revisions.values() if r.dataset_id == dataset_id),
        key=lambda r: r.revision_number,
    ):
        rev = _apply_freeze_on_pin(rev)
        if revision_status is not None and rev.status != revision_status:
            continue
        items.append(
            DatasetRevisionSummary(
                id=rev.id,
                dataset_id=rev.dataset_id,
                revision_number=rev.revision_number,
                status=rev.status,
                is_immutable=rev.is_immutable,
                frozen_reason=rev.frozen_reason,
                pinned_run_count=rev.pinned_run_count,
                created_at=rev.created_at,
            )
        )
    return DatasetRevisionListResponse(items=items)


def get_revision(revision_id: str) -> DatasetRevision:
    return _resolved_revision(revision_id)


def activate_revision(revision_id: str, actor_id: str) -> DatasetRevisionMutationResponse:
    revision = _resolved_revision(revision_id)
    dataset = dataset_or_404(revision.dataset_id)
    _require_owner(dataset, actor_id)
    if revision.status in {DatasetRevisionStatus.FROZEN, DatasetRevisionStatus.ARCHIVED}:
        raise ApiException(
            status_code=409,
            code="REVISION_FROZEN",
            message="A frozen or archived revision cannot be activated.",
            details={"revision_id": revision_id, "status": revision.status.value},
        )
    if revision.status != DatasetRevisionStatus.DRAFT:
        raise ApiException(
            status_code=409,
            code="REVISION_NOT_DRAFT",
            message="Only a DRAFT revision may be activated.",
            details={"revision_id": revision_id, "status": revision.status.value},
        )
    now = utc_now()
    frozen_revision_id: str | None = None
    prior_id = dataset.active_version_id
    if prior_id and prior_id in _revisions and prior_id != revision_id:
        prior = _revisions[prior_id]
        if prior.status == DatasetRevisionStatus.ACTIVE:
            _revisions[prior_id] = prior.model_copy(
                update={
                    "status": DatasetRevisionStatus.FROZEN,
                    "is_immutable": True,
                    "frozen_reason": RevisionFrozenReason.NEWER_REVISION_ACTIVATED,
                    "frozen_at": now,
                }
            )
            frozen_revision_id = prior_id
    activated = revision.model_copy(
        update={"status": DatasetRevisionStatus.ACTIVE, "activated_at": now, "is_immutable": False}
    )
    _revisions[revision_id] = activated
    dataset = dataset.model_copy(update={"active_version_id": revision_id, "updated_at": now})
    _datasets[dataset.id] = dataset
    entry = _audit_entry(
        project_id=dataset.project_id,
        dataset_id=dataset.id,
        action=GoldAuthoringAction.REVISION_ACTIVATE,
        actor_id=actor_id,
        is_owner=_is_owner(dataset, actor_id),
        target_kind=AuditTargetKind.DATASET_REVISION,
        target_id=revision_id,
        revision_id=revision_id,
    )
    return DatasetRevisionMutationResponse(
        revision=activated,
        dataset=dataset,
        frozen_revision_id=frozen_revision_id,
        audit_entry=entry,
        mutation_guard=_guard(),
        capabilities=capabilities_for(dataset, actor_id),
    )


# ---------------------------------------------------------------------------
# Authoring overview + audit
# ---------------------------------------------------------------------------


def authoring_overview(
    dataset_id: str, actor_id: str, status: GoldItemStatus | None = None
) -> DatasetAuthoringOverview:
    dataset = dataset_or_404(dataset_id)
    revisions = [
        _apply_freeze_on_pin(r) for r in _revisions.values() if r.dataset_id == dataset_id
    ]
    dataset = _datasets[dataset_id]  # active slot may have been vacated by freeze
    active = next(
        (r for r in revisions if r.status == DatasetRevisionStatus.ACTIVE), None
    )
    counts: dict[str, int] = {s.value: 0 for s in GoldItemStatus}
    for e in _entities.values():
        if e.dataset_id == dataset_id and (status is None or e.status == status):
            counts[e.status.value] += 1
    for r in _relations.values():
        if r.dataset_id == dataset_id and (status is None or r.status == status):
            counts[r.status.value] += 1
    pinned_runs = [
        RunRevisionPin(
            run_id=run_id,
            dataset_version_id=rev_id,
            revision_status=(
                _revisions[rev_id].status if rev_id in _revisions else None
            ),
            pin_immutable=_is_frozen_revision(rev_id),
        )
        for run_id, rev_id in _run_pins.items()
        if rev_id in _revisions and _revisions[rev_id].dataset_id == dataset_id
    ]
    return DatasetAuthoringOverview(
        dataset=dataset,
        active_revision=active,
        revision_count=len(revisions),
        gold_status_counts=counts,
        pinned_runs=pinned_runs,
        capabilities=capabilities_for(dataset, actor_id),
        mutation_guard=_guard(),
    )


def list_audit(
    dataset_id: str, action: GoldAuthoringAction | None = None
) -> GoldAuthoringAuditListResponse:
    dataset_or_404(dataset_id)
    items = [
        e
        for e in _audit
        if e.dataset_id == dataset_id and (action is None or e.action == action)
    ]
    return GoldAuthoringAuditListResponse(items=items)


# ---------------------------------------------------------------------------
# D. Export / Import
# ---------------------------------------------------------------------------


def export_revision(revision_id: str) -> GoldSetExportBundle:
    revision = _resolved_revision(revision_id)
    dataset_id = revision.dataset_id
    return GoldSetExportBundle(
        bundle_version="gold-set-bundle/1.0",
        source_project_id=revision.project_id,
        source_dataset_id=dataset_id,
        source_revision_id=revision_id,
        revision_status=revision.status,
        ontology_version_id=revision.ontology_version_id,
        exported_at=utc_now(),
        samples=[s for s in _samples.values() if s.dataset_id == dataset_id],
        gold_entities=[
            e
            for e in _entities.values()
            if e.dataset_id == dataset_id and e.status != GoldItemStatus.ARCHIVED
        ],
        gold_relations=[
            r
            for r in _relations.values()
            if r.dataset_id == dataset_id and r.status != GoldItemStatus.ARCHIVED
        ],
        gold_evidence=[
            ev
            for ev in _evidence.values()
            if ev.dataset_id == dataset_id and ev.status != GoldItemStatus.ARCHIVED
        ],
        mutation_guard=_guard(),
    )


def _assess_bundle(
    bundle: GoldSetExportBundle, project_id: str
) -> tuple[GoldSetImportCompatibility, list[GoldSetImportIssue]]:
    issues: list[GoldSetImportIssue] = []
    severities: set[GoldSetImportCompatibility] = set()

    for entity in bundle.gold_entities:
        if entity.ontology_class_id in _KNOWN_ONTOLOGY_CLASS_IDS:
            issues.append(
                GoldSetImportIssue(
                    code="ONTOLOGY_CLASS_RESOLVED",
                    severity=GoldSetImportCompatibility.COMPATIBLE,
                    ontology_class_id=entity.ontology_class_id,
                    message="class resolves in target ontology",
                )
            )
            severities.add(GoldSetImportCompatibility.COMPATIBLE)
        else:
            issues.append(
                GoldSetImportIssue(
                    code="ONTOLOGY_CLASS_MISSING",
                    severity=GoldSetImportCompatibility.INCOMPATIBLE,
                    ontology_class_id=entity.ontology_class_id,
                    message="class absent from target project; import blocked",
                )
            )
            severities.add(GoldSetImportCompatibility.INCOMPATIBLE)

    for relation in bundle.gold_relations:
        if relation.ontology_relation_id not in _KNOWN_ONTOLOGY_RELATION_IDS:
            issues.append(
                GoldSetImportIssue(
                    code="ONTOLOGY_RELATION_MISSING",
                    severity=GoldSetImportCompatibility.INCOMPATIBLE,
                    ontology_relation_id=relation.ontology_relation_id,
                    message="relation absent from target project; import blocked",
                )
            )
            severities.add(GoldSetImportCompatibility.INCOMPATIBLE)

    # CONFLICT: a bundle gold item id already exists in the target project
    # (duplicate gold item / id collision requiring an explicit strategy).
    for entity in bundle.gold_entities:
        existing = _entities.get(entity.id)
        if existing is not None and existing.project_id == project_id:
            issues.append(
                GoldSetImportIssue(
                    code="GOLD_ITEM_ID_COLLISION",
                    severity=GoldSetImportCompatibility.CONFLICT,
                    message="gold item id already exists in target; choose a strategy",
                )
            )
            severities.add(GoldSetImportCompatibility.CONFLICT)
            break

    # WARNING: samples without a local source segment.
    for sample in bundle.samples:
        if sample.source_segment_id is None:
            issues.append(
                GoldSetImportIssue(
                    code="SAMPLE_SOURCE_NOT_LOCAL",
                    severity=GoldSetImportCompatibility.WARNING,
                    sample_id=sample.id,
                    message="source segment not present locally; imported as locator-only",
                )
            )
            severities.add(GoldSetImportCompatibility.WARNING)

    for level in (
        GoldSetImportCompatibility.INCOMPATIBLE,
        GoldSetImportCompatibility.CONFLICT,
        GoldSetImportCompatibility.WARNING,
    ):
        if level in severities:
            return level, issues
    return GoldSetImportCompatibility.COMPATIBLE, issues


def import_dry_run(
    project_id: str, payload: GoldSetImportDryRunRequest, actor_id: str
) -> GoldSetImportReport:
    _ensure_seed()
    bundle = payload.bundle
    compatibility, issues = _assess_bundle(bundle, project_id)
    blocking = compatibility == GoldSetImportCompatibility.INCOMPATIBLE
    allowed = (
        []
        if blocking
        else [
            GoldSetImportStrategy.CREATE_NEW_DATASET,
            GoldSetImportStrategy.NEW_REVISION_OF_EXISTING,
        ]
    )
    import_id = _next_id("gold-set-import")
    report = GoldSetImportReport(
        import_id=import_id,
        project_id=project_id,
        compatibility=compatibility,
        bundle_summary=GoldSetBundleSummary(
            bundle_version=bundle.bundle_version,
            source_dataset_id=bundle.source_dataset_id,
            source_revision_id=bundle.source_revision_id,
            sample_count=len(bundle.samples),
            gold_entity_count=len(bundle.gold_entities),
            gold_relation_count=len(bundle.gold_relations),
            gold_evidence_count=len(bundle.gold_evidence),
        ),
        target_ontology_version_id="ontology-v7",
        issues=issues,
        allowed_strategies=allowed,
        blocking=blocking,
        mutation_guard=_guard(),
    )
    _imports[import_id] = report
    return report


def import_confirm(
    project_id: str,
    import_id: str,
    payload: GoldSetImportConfirmRequest,
    actor_id: str,
) -> GoldSetImportConfirmResponse:
    _ensure_seed()
    report = _imports.get(import_id)
    if report is None or report.project_id != project_id:
        raise ApiException(
            status_code=404,
            code="IMPORT_NOT_FOUND",
            message="Import dry-run was not found.",
            details={"import_id": import_id},
        )
    if report.compatibility == GoldSetImportCompatibility.INCOMPATIBLE:
        raise ApiException(
            status_code=409,
            code="IMPORT_INCOMPATIBLE",
            message="Incompatible bundle cannot be imported.",
            details={"import_id": import_id},
        )
    if (
        report.compatibility == GoldSetImportCompatibility.CONFLICT
        and payload.strategy is None
    ):
        raise ApiException(
            status_code=409,
            code="IMPORT_STRATEGY_REQUIRED",
            message="A conflicting bundle requires an explicit import strategy.",
            details={"import_id": import_id},
        )
    if (
        report.compatibility == GoldSetImportCompatibility.WARNING
        and not payload.acknowledge_warnings
    ):
        raise ApiException(
            status_code=409,
            code="IMPORT_WARNINGS_NOT_ACKNOWLEDGED",
            message="Warnings must be acknowledged before import.",
            details={"import_id": import_id},
        )

    now = utc_now()
    summary = report.bundle_summary
    if payload.strategy == GoldSetImportStrategy.NEW_REVISION_OF_EXISTING:
        if payload.target_dataset_id is None:
            raise ApiException(
                status_code=400,
                code="GOLD_ITEM_INVALID_TRANSITION",
                message="target_dataset_id is required for NEW_REVISION_OF_EXISTING.",
                details={"import_id": import_id},
            )
        target = dataset_or_404(payload.target_dataset_id)
        _require_owner(target, actor_id)
        number = _next_revision_number(target.id)
        created_dataset_id = target.id
        created_revision_id = f"{target.id}-import-v{number}"
        parent_id = target.active_version_id
    else:
        created_dataset_id = _next_id(f"{project_id}-imported-dataset")
        number = 1
        created_revision_id = f"{created_dataset_id}-v1"
        parent_id = None
        _datasets[created_dataset_id] = EvaluationDataset(
            id=created_dataset_id,
            project_id=project_id,
            name=f"Imported gold set ({summary.source_dataset_id})",
            status=EvaluationDatasetStatus.ACTIVE,
            sample_count=summary.sample_count,
            gold_entity_count=summary.gold_entity_count,
            gold_relation_count=summary.gold_relation_count,
            owner_id=DEFAULT_OWNER_ID if actor_id == ADMIN_ACTOR_ID else actor_id,
            active_version_id=created_revision_id if payload.activate else None,
            created_at=now,
            updated_at=now,
        )

    # Import ALWAYS creates a NEW revision; never edits a FROZEN one.
    created_status = (
        DatasetRevisionStatus.ACTIVE if payload.activate else DatasetRevisionStatus.DRAFT
    )
    _revisions[created_revision_id] = DatasetRevision(
        id=created_revision_id,
        dataset_id=created_dataset_id,
        project_id=project_id,
        revision_number=number,
        status=created_status,
        is_immutable=False,
        frozen_reason=None,
        sample_count=summary.sample_count,
        gold_entity_count=summary.gold_entity_count,
        gold_relation_count=summary.gold_relation_count,
        gold_evidence_count=summary.gold_evidence_count,
        pinned_run_count=0,
        parent_revision_id=parent_id,
        ontology_version_id="ontology-v7",
        created_at=now,
        activated_at=now if payload.activate else None,
        created_by=actor_id,
    )

    entry = _audit_entry(
        project_id=project_id,
        dataset_id=created_dataset_id,
        action=GoldAuthoringAction.IMPORT,
        actor_id=actor_id,
        is_owner=True,
        target_kind=AuditTargetKind.DATASET_REVISION,
        target_id=created_revision_id,
        revision_id=created_revision_id,
        reason=f"import {import_id} via {payload.strategy.value}",
    )
    return GoldSetImportConfirmResponse(
        import_id=import_id,
        strategy=payload.strategy,
        created_dataset_id=created_dataset_id,
        created_revision_id=created_revision_id,
        created_revision_status=created_status,
        imported_counts=ImportedCounts(
            samples=summary.sample_count,
            gold_entities=summary.gold_entity_count,
            gold_relations=summary.gold_relation_count,
            gold_evidence=summary.gold_evidence_count,
        ),
        audit_entry=entry,
        mutation_guard=_guard(),
    )


# ---------------------------------------------------------------------------
# Test helpers (deterministic run-pin manipulation; never rewrites existing)
# ---------------------------------------------------------------------------


def pin_run_to_revision(run_id: str, revision_id: str) -> None:
    """Register a NEW run pin (used to exercise freeze-on-pin). Never rewrites
    an existing pin: EvaluationRun.dataset_version_id is immutable."""
    _ensure_seed()
    revision_or_404(revision_id)
    if run_id in _run_pins and _run_pins[run_id] != revision_id:
        raise ApiException(
            status_code=409,
            code="GOLD_ITEM_INVALID_TRANSITION",
            message="A run pin is immutable and cannot be rewritten.",
            details={"run_id": run_id},
        )
    _run_pins[run_id] = revision_id


def run_pin(run_id: str) -> str | None:
    _ensure_seed()
    return _run_pins.get(run_id)


def _jsonable(data: dict) -> dict:
    out: dict = {}
    for key, value in data.items():
        if hasattr(value, "model_dump"):
            out[key] = value.model_dump(mode="json")
        else:
            out[key] = value
    return out
