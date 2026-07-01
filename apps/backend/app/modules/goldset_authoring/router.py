from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.errors import ApiErrorResponse
from app.db.session import get_db
from app.modules.evaluation import service as evaluation_service
from app.modules.goldset_authoring import service
from app.modules.goldset_authoring.schemas import (
    DatasetAuthoringOverview,
    DatasetRevision,
    DatasetRevisionCutRequest,
    DatasetRevisionListResponse,
    DatasetRevisionMutationResponse,
    DatasetRevisionStatus,
    GoldAuthoringAction,
    GoldAuthoringAuditListResponse,
    GoldEntityEditRequest,
    GoldEntityMutationResponse,
    GoldEvidence,
    GoldEvidenceAttachRequest,
    GoldEvidenceEditRequest,
    GoldEvidenceListResponse,
    GoldEvidenceMutationResponse,
    GoldItemArchiveRequest,
    GoldItemStatus,
    GoldRelationEditRequest,
    GoldRelationMutationResponse,
    GoldSetExportBundle,
    GoldSetImportConfirmRequest,
    GoldSetImportConfirmResponse,
    GoldSetImportDryRunRequest,
    GoldSetImportReport,
)

router = APIRouter(tags=["MVP6.4 Gold Set Authoring"])

_ERRORS = {
    400: {"model": ApiErrorResponse},
    403: {"model": ApiErrorResponse},
    404: {"model": ApiErrorResponse},
    409: {"model": ApiErrorResponse},
}

ActorId = Query(
    "dev-user",
    description="Acting user id (dev auth). Owner/admin only for authoring.",
)


# --- A. Gold item authoring -------------------------------------------------


@router.get(
    "/projects/{project_id}/evaluation-datasets/{dataset_id}/authoring",
    response_model=DatasetAuthoringOverview,
    summary="Open a dataset for authoring (overview)",
    responses=_ERRORS,
)
def get_authoring_overview(
    project_id: str,
    dataset_id: str,
    actor_id: str = ActorId,
    status_filter: GoldItemStatus | None = Query(None, alias="status"),
    db: Session = Depends(get_db),
) -> DatasetAuthoringOverview:
    evaluation_service.project_or_404(db, project_id)
    return service.authoring_overview(dataset_id, actor_id, status_filter)


@router.patch(
    "/evaluation-datasets/{dataset_id}/gold-entities/{gold_entity_id}",
    response_model=GoldEntityMutationResponse,
    summary="Edit a gold entity",
    responses=_ERRORS,
)
def edit_gold_entity(
    dataset_id: str,
    gold_entity_id: str,
    payload: GoldEntityEditRequest,
    actor_id: str = ActorId,
) -> GoldEntityMutationResponse:
    return service.edit_gold_entity(dataset_id, gold_entity_id, payload, actor_id)


@router.post(
    "/evaluation-datasets/{dataset_id}/gold-entities/{gold_entity_id}/archive",
    response_model=GoldEntityMutationResponse,
    summary="Archive a gold entity (soft)",
    responses=_ERRORS,
)
def archive_gold_entity(
    dataset_id: str,
    gold_entity_id: str,
    payload: GoldItemArchiveRequest | None = None,
    actor_id: str = ActorId,
) -> GoldEntityMutationResponse:
    return service.archive_gold_entity(
        dataset_id, gold_entity_id, payload or GoldItemArchiveRequest(), actor_id
    )


@router.post(
    "/evaluation-datasets/{dataset_id}/gold-entities/{gold_entity_id}/restore",
    response_model=GoldEntityMutationResponse,
    summary="Restore an archived gold entity",
    responses=_ERRORS,
)
def restore_gold_entity(
    dataset_id: str,
    gold_entity_id: str,
    payload: GoldItemArchiveRequest | None = None,
    actor_id: str = ActorId,
) -> GoldEntityMutationResponse:
    return service.restore_gold_entity(
        dataset_id, gold_entity_id, payload or GoldItemArchiveRequest(), actor_id
    )


@router.patch(
    "/evaluation-datasets/{dataset_id}/gold-relations/{gold_relation_id}",
    response_model=GoldRelationMutationResponse,
    summary="Edit a gold relation",
    responses=_ERRORS,
)
def edit_gold_relation(
    dataset_id: str,
    gold_relation_id: str,
    payload: GoldRelationEditRequest,
    actor_id: str = ActorId,
) -> GoldRelationMutationResponse:
    return service.edit_gold_relation(dataset_id, gold_relation_id, payload, actor_id)


@router.post(
    "/evaluation-datasets/{dataset_id}/gold-relations/{gold_relation_id}/archive",
    response_model=GoldRelationMutationResponse,
    summary="Archive a gold relation (soft)",
    responses=_ERRORS,
)
def archive_gold_relation(
    dataset_id: str,
    gold_relation_id: str,
    payload: GoldItemArchiveRequest | None = None,
    actor_id: str = ActorId,
) -> GoldRelationMutationResponse:
    return service.archive_gold_relation(
        dataset_id, gold_relation_id, payload or GoldItemArchiveRequest(), actor_id
    )


@router.post(
    "/evaluation-datasets/{dataset_id}/gold-relations/{gold_relation_id}/restore",
    response_model=GoldRelationMutationResponse,
    summary="Restore an archived gold relation",
    responses=_ERRORS,
)
def restore_gold_relation(
    dataset_id: str,
    gold_relation_id: str,
    payload: GoldItemArchiveRequest | None = None,
    actor_id: str = ActorId,
) -> GoldRelationMutationResponse:
    return service.restore_gold_relation(
        dataset_id, gold_relation_id, payload or GoldItemArchiveRequest(), actor_id
    )


# --- B. Standalone GoldEvidence CRUD ---------------------------------------


@router.post(
    "/evaluation-datasets/{dataset_id}/gold-evidence",
    response_model=GoldEvidenceMutationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Attach standalone gold evidence",
    responses=_ERRORS,
)
def attach_gold_evidence(
    dataset_id: str,
    payload: GoldEvidenceAttachRequest,
    actor_id: str = ActorId,
) -> GoldEvidenceMutationResponse:
    return service.attach_gold_evidence(dataset_id, payload, actor_id)


@router.get(
    "/evaluation-datasets/{dataset_id}/gold-evidence",
    response_model=GoldEvidenceListResponse,
    summary="List standalone gold evidence",
    responses=_ERRORS,
)
def list_gold_evidence(
    dataset_id: str,
    status_filter: GoldItemStatus | None = Query(None, alias="status"),
) -> GoldEvidenceListResponse:
    return service.list_gold_evidence(dataset_id, status_filter)


@router.get(
    "/gold-evidence/{evidence_id}",
    response_model=GoldEvidence,
    summary="Get one gold evidence",
    responses=_ERRORS,
)
def get_gold_evidence(evidence_id: str) -> GoldEvidence:
    return service.get_gold_evidence(evidence_id)


@router.patch(
    "/gold-evidence/{evidence_id}",
    response_model=GoldEvidenceMutationResponse,
    summary="Edit gold evidence",
    responses=_ERRORS,
)
def edit_gold_evidence(
    evidence_id: str,
    payload: GoldEvidenceEditRequest,
    actor_id: str = ActorId,
) -> GoldEvidenceMutationResponse:
    return service.edit_gold_evidence(evidence_id, payload, actor_id)


@router.post(
    "/gold-evidence/{evidence_id}/archive",
    response_model=GoldEvidenceMutationResponse,
    summary="Archive gold evidence (soft)",
    responses=_ERRORS,
)
def archive_gold_evidence(
    evidence_id: str,
    payload: GoldItemArchiveRequest | None = None,
    actor_id: str = ActorId,
) -> GoldEvidenceMutationResponse:
    return service.archive_gold_evidence(
        evidence_id, payload or GoldItemArchiveRequest(), actor_id
    )


# --- C. Dataset revisions ---------------------------------------------------


@router.post(
    "/evaluation-datasets/{dataset_id}/revisions",
    response_model=DatasetRevisionMutationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cut a new dataset revision",
    responses=_ERRORS,
)
def cut_revision(
    dataset_id: str,
    payload: DatasetRevisionCutRequest | None = None,
    actor_id: str = ActorId,
) -> DatasetRevisionMutationResponse:
    return service.cut_revision(
        dataset_id, payload or DatasetRevisionCutRequest(), actor_id
    )


@router.get(
    "/evaluation-datasets/{dataset_id}/revisions",
    response_model=DatasetRevisionListResponse,
    summary="List dataset revisions",
    responses=_ERRORS,
)
def list_revisions(
    dataset_id: str,
    revision_status: DatasetRevisionStatus | None = Query(None),
) -> DatasetRevisionListResponse:
    return service.list_revisions(dataset_id, revision_status)


@router.get(
    "/dataset-revisions/{revision_id}",
    response_model=DatasetRevision,
    summary="Get one dataset revision",
    responses=_ERRORS,
)
def get_revision(revision_id: str) -> DatasetRevision:
    return service.get_revision(revision_id)


@router.post(
    "/dataset-revisions/{revision_id}/activate",
    response_model=DatasetRevisionMutationResponse,
    summary="Activate a DRAFT revision",
    responses=_ERRORS,
)
def activate_revision(
    revision_id: str,
    actor_id: str = ActorId,
) -> DatasetRevisionMutationResponse:
    return service.activate_revision(revision_id, actor_id)


# --- D. Export / Import -----------------------------------------------------


@router.get(
    "/dataset-revisions/{revision_id}/export",
    response_model=GoldSetExportBundle,
    summary="Export a revision as a portable bundle",
    responses=_ERRORS,
)
def export_revision(revision_id: str) -> GoldSetExportBundle:
    return service.export_revision(revision_id)


@router.post(
    "/projects/{project_id}/gold-set-imports",
    response_model=GoldSetImportReport,
    summary="Dry-run a gold-set import (mutates nothing)",
    responses=_ERRORS,
)
def import_dry_run(
    project_id: str,
    payload: GoldSetImportDryRunRequest,
    actor_id: str = ActorId,
    db: Session = Depends(get_db),
) -> GoldSetImportReport:
    evaluation_service.project_or_404(db, project_id)
    return service.import_dry_run(project_id, payload, actor_id)


@router.post(
    "/projects/{project_id}/gold-set-imports/{import_id}/confirm",
    response_model=GoldSetImportConfirmResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Confirm a gold-set import with a strategy",
    responses=_ERRORS,
)
def import_confirm(
    project_id: str,
    import_id: str,
    payload: GoldSetImportConfirmRequest,
    actor_id: str = ActorId,
    db: Session = Depends(get_db),
) -> GoldSetImportConfirmResponse:
    evaluation_service.project_or_404(db, project_id)
    return service.import_confirm(project_id, import_id, payload, actor_id)


# --- E. Authoring audit log -------------------------------------------------


@router.get(
    "/evaluation-datasets/{dataset_id}/authoring-audit",
    response_model=GoldAuthoringAuditListResponse,
    summary="List authoring audit entries",
    responses=_ERRORS,
)
def list_authoring_audit(
    dataset_id: str,
    action: GoldAuthoringAction | None = Query(None),
) -> GoldAuthoringAuditListResponse:
    return service.list_audit(dataset_id, action)
