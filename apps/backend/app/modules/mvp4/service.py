from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import (
    CandidateKind,
    EvaluationDatasetStatus,
    GoldenSetItemKind,
    GraphExploreState,
    PromptExperimentStatus,
    QualityMetricGroup,
    QualityMetricUnit,
    RagAnswerState,
    RagCitationKind,
    SearchResultKind,
    VectorAdapterStatus,
    VectorFallbackReason,
)
from app.core.errors import ApiException
from app.modules.candidate.models import CandidateEntity, CandidateEvidence, CandidateRelation
from app.modules.project.models import Project
from app.modules.publish.models import PublishedEntity as PublishedEntityModel
from app.modules.publish.models import PublishedGraphVersion as PublishedGraphVersionModel
from app.modules.publish.models import PublishedRelation as PublishedRelationModel
from app.modules.publish.schemas import EvidenceRef as PublishEvidenceRef
from app.modules.publish.schemas import PublishedGraphSnapshot
from app.modules.publish.service import graph_snapshot, to_published_entity, to_published_relation
from app.modules.source.models import SourceData as SourceDataModel
from app.modules.source.models import SourceSegment
from app.modules.source.schemas import SourceData

from .schemas import (
    CandidateRef,
    EvaluationDataset,
    EvaluationDatasetVersion,
    EvaluationDimensions,
    EvaluationRun,
    EvaluationRunMetrics,
    EvidenceRead,
    EvidenceRef,
    GoldenSetItem,
    GraphExploreEdge,
    GraphExploreNode,
    GraphExploreResponse,
    GraphQualityOverlay,
    GraphSourceOverlay,
    GraphTooLargeState,
    InsufficientEvidenceState,
    PromptExperiment,
    PromptPerformanceRow,
    PromptPerformanceSummary,
    PublishedFactRef,
    PublishedGraphVersionRef,
    PublishedLineagePanel,
    QualityDrilldownHint,
    QualityFormulaMetadata,
    QualityMetric,
    QualityMetricBreakdown,
    QualityMetricGroupResult,
    QualityMetricsResponse,
    RagAnswerRequest,
    RagAnswerResponse,
    RagCitation,
    ReviewDecisionRef,
    RunWindow,
    SearchResponse,
    SearchResultGroup,
    SearchResultItem,
    SimilarEvidenceItem,
    SimilarEvidenceResponse,
    SourceRef,
    VectorAdapterState,
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def project_or_404(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise ApiException(
            status_code=404,
            code="PROJECT_NOT_FOUND",
            message="Project was not found.",
            details={"project_id": project_id},
        )
    return project


def current_graph_version(db: Session, project_id: str) -> PublishedGraphVersionModel:
    project_or_404(db, project_id)
    version = db.scalars(
        select(PublishedGraphVersionModel)
        .where(
            PublishedGraphVersionModel.project_id == project_id,
            PublishedGraphVersionModel.is_current.is_(True),
        )
        .order_by(PublishedGraphVersionModel.version.desc())
        .limit(1)
    ).first()
    if version is None:
        raise ApiException(
            status_code=404,
            code="PUBLISHED_GRAPH_CURRENT_NOT_FOUND",
            message="Project has no current published graph version.",
            details={"project_id": project_id},
        )
    return version


def graph_version_or_404(db: Session, version_id: str) -> PublishedGraphVersionModel:
    version = db.get(PublishedGraphVersionModel, version_id)
    if version is None:
        raise ApiException(
            status_code=404,
            code="PUBLISHED_GRAPH_VERSION_NOT_FOUND",
            message="Published graph version was not found.",
            details={"version_id": version_id},
        )
    return version


def version_ref(version: PublishedGraphVersionModel) -> PublishedGraphVersionRef:
    return PublishedGraphVersionRef(
        published_graph_version_id=version.id,
        published_graph_version=version.version,
        ontology_version_id=version.ontology_version_id,
        is_current=version.is_current,
        created_at=version.created_at,
    )


def _published_entities(db: Session, version_id: str) -> list[PublishedEntityModel]:
    return db.scalars(
        select(PublishedEntityModel)
        .where(PublishedEntityModel.published_graph_version_id == version_id)
        .order_by(PublishedEntityModel.created_at.asc())
    ).all()


def _published_relations(db: Session, version_id: str) -> list[PublishedRelationModel]:
    return db.scalars(
        select(PublishedRelationModel)
        .where(PublishedRelationModel.published_graph_version_id == version_id)
        .order_by(PublishedRelationModel.created_at.asc())
    ).all()


def _source_refs_from_lineage(lineage: dict[str, Any]) -> list[SourceRef]:
    refs = []
    for ref in lineage.get("evidence_refs", []):
        source_id = ref.get("source_id")
        if source_id:
            refs.append(
                SourceRef(
                    source_id=source_id,
                    source_segment_id=ref.get("source_segment_id"),
                    locator=ref.get("label"),
                    label=ref.get("label"),
                )
            )
    return refs


def _evidence_refs_from_lineage(lineage: dict[str, Any]) -> list[EvidenceRef]:
    return [
        EvidenceRef(
            evidence_id=ref.get("evidence_id", "evidence-unknown"),
            source_id=ref.get("source_id"),
            source_segment_id=ref.get("source_segment_id"),
            label=ref.get("label"),
        )
        for ref in lineage.get("evidence_refs", [])
    ]


def _first_source(db: Session, project_id: str) -> SourceDataModel | None:
    return db.scalars(
        select(SourceDataModel)
        .where(SourceDataModel.project_id == project_id)
        .order_by(SourceDataModel.uploaded_at.asc())
        .limit(1)
    ).first()


def _first_evidence(db: Session, project_id: str) -> CandidateEvidence | None:
    source_ids = db.scalars(select(SourceDataModel.id).where(SourceDataModel.project_id == project_id)).all()
    if not source_ids:
        return None
    return db.scalars(
        select(CandidateEvidence)
        .where(CandidateEvidence.source_id.in_(source_ids))
        .order_by(CandidateEvidence.created_at.asc())
        .limit(1)
    ).first()


def _first_source_ref(db: Session, project_id: str) -> SourceRef:
    source = _first_source(db, project_id)
    if source is None:
        return SourceRef(source_id="source-mvp4-demo", locator="seed:source", label="MVP4 demo source")
    segment = db.scalars(
        select(SourceSegment)
        .where(SourceSegment.source_id == source.id)
        .order_by(SourceSegment.sequence.asc())
        .limit(1)
    ).first()
    return SourceRef(
        source_id=source.id,
        source_segment_id=segment.id if segment else None,
        locator=(segment.metadata_ or {}).get("locator") if segment else None,
        label=source.file_name,
    )


def _first_evidence_ref(db: Session, project_id: str) -> EvidenceRef:
    evidence = _first_evidence(db, project_id)
    if evidence is None:
        return EvidenceRef(evidence_id="evidence-mvp4-demo", label="MVP4 demo evidence")
    return EvidenceRef(
        evidence_id=evidence.id,
        source_id=evidence.source_id,
        source_segment_id=evidence.source_segment_id,
        label=evidence.file_name,
    )


def quality_metrics(db: Session, project_id: str) -> QualityMetricsResponse:
    version = current_graph_version(db, project_id)
    entities = _published_entities(db, version.id)
    relations = _published_relations(db, version.id)
    candidates = [
        *db.scalars(select(CandidateEntity).where(CandidateEntity.project_id == project_id)).all(),
        *db.scalars(select(CandidateRelation).where(CandidateRelation.project_id == project_id)).all(),
    ]
    evidence_ref = _first_evidence_ref(db, project_id)
    published_ref = version_ref(version)
    entity_count = len(entities)
    relation_count = len(relations)
    total_candidates = len(candidates)
    reviewed = sum(1 for candidate in candidates if candidate.review_status.value != "PENDING")
    approved = sum(
        1 for candidate in candidates if candidate.review_status.value in {"APPROVED", "MODIFIED"}
    )
    missing_evidence = sum(1 for candidate in candidates if not candidate.evidence_ids)
    failed_validation = sum(1 for candidate in candidates if candidate.validation_status.value == "FAILED")

    definitions = [
        (
            QualityMetricGroup.COMPLETENESS,
            "completeness",
            "Required fact completeness",
            QualityMetricUnit.RATE,
            total_candidates - missing_evidence,
            max(total_candidates, 1),
        ),
        (
            QualityMetricGroup.CONSISTENCY,
            "consistency",
            "Ontology consistency checks",
            QualityMetricUnit.RATE,
            total_candidates - failed_validation,
            max(total_candidates, 1),
        ),
        (
            QualityMetricGroup.TRACEABILITY,
            "traceability",
            "Facts with evidence and review lineage",
            QualityMetricUnit.RATE,
            entity_count + relation_count,
            max(entity_count + relation_count, 1),
        ),
        (
            QualityMetricGroup.VALIDATION,
            "validation_pass_rate",
            "Validation pass rate",
            QualityMetricUnit.RATE,
            total_candidates - failed_validation,
            max(total_candidates, 1),
        ),
        (
            QualityMetricGroup.REVIEW,
            "review_approval_rate",
            "Approved or modified review decisions",
            QualityMetricUnit.RATE,
            approved,
            max(reviewed, 1),
        ),
        (
            QualityMetricGroup.DUPLICATE,
            "duplicate_rate",
            "Duplicate indicators",
            QualityMetricUnit.RATE,
            1,
            max(total_candidates, 1),
        ),
        (
            QualityMetricGroup.RELATION_DENSITY,
            "relation_density",
            "Published relations per published entity",
            QualityMetricUnit.RATIO,
            relation_count,
            max(entity_count, 1),
        ),
    ]
    groups: list[QualityMetricGroupResult] = []
    for group, metric_id, label, unit, numerator, denominator in definitions:
        rate = round(numerator / denominator, 4)
        metric = QualityMetric(
            metric_id=metric_id,
            group=group,
            label=label,
            description=f"Deterministic MVP4 {label.lower()} metric.",
            unit=unit,
            value=float(numerator) if unit == QualityMetricUnit.COUNT else None,
            rate=rate,
            formula=QualityFormulaMetadata(
                formula_id=f"mvp4_{metric_id}",
                numerator=f"{numerator} seeded matching records",
                denominator=f"{denominator} seeded records in scope",
                scope="current published graph plus reviewed candidate lineage",
                time_window="all seeded MVP4 smoke data",
                breakdown_dimension="class_type",
                drilldown_target="quality_metric_detail",
                unit=unit,
            ),
            drilldown=QualityDrilldownHint(
                target="quality_metric_detail",
                label=label,
                query={"metric_id": metric_id, "published_graph_version_id": version.id},
            ),
            evidence_refs=[evidence_ref],
            published_graph_version_ref=published_ref,
            breakdowns=[
                QualityMetricBreakdown(
                    dimension="class_type",
                    key="Company",
                    label="Company",
                    value=float(numerator),
                    rate=rate,
                    drilldown=QualityDrilldownHint(
                        target="published_graph",
                        query={"class_type": "Company", "metric_id": metric_id},
                    ),
                )
            ],
        )
        groups.append(
            QualityMetricGroupResult(
                group=group,
                label=group.value.replace("_", " ").title(),
                description=f"{group.value} metrics.",
                metrics=[metric],
            )
        )

    return QualityMetricsResponse(
        project_id=project_id,
        published_graph_version_ref=published_ref,
        generated_at=utc_now(),
        filters={"published_graph_version_id": version.id},
        metric_groups=groups,
    )


def quality_metric_detail(db: Session, project_id: str, metric_id: str) -> QualityMetric:
    for group in quality_metrics(db, project_id).metric_groups:
        for metric in group.metrics:
            if metric.metric_id == metric_id:
                return metric
    raise ApiException(
        status_code=404,
        code="QUALITY_METRIC_NOT_FOUND",
        message="Quality metric was not found.",
        details={"metric_id": metric_id},
    )


def evaluation_datasets(project_id: str) -> list[EvaluationDataset]:
    now = utc_now()
    return [
        EvaluationDataset(
            id=f"{project_id}-eval-dataset-draft",
            project_id=project_id,
            name="MVP4 Draft Golden Set",
            description="Editable draft dataset for MVP4 smoke.",
            status=EvaluationDatasetStatus.DRAFT,
            owner_id="dev-user",
            created_at=now,
            updated_at=now,
            notes="Draft dataset is intentionally editable.",
        ),
        EvaluationDataset(
            id=f"{project_id}-eval-dataset-active",
            project_id=project_id,
            name="MVP4 Active Golden Set",
            description="Active deterministic dataset.",
            status=EvaluationDatasetStatus.ACTIVE,
            owner_id="dev-user",
            active_version_id=f"{project_id}-eval-version-active-v1",
            created_at=now,
            updated_at=now,
            notes="Contains all four golden item kinds.",
        ),
        EvaluationDataset(
            id=f"{project_id}-eval-dataset-archived",
            project_id=project_id,
            name="MVP4 Archived Golden Set",
            status=EvaluationDatasetStatus.ARCHIVED,
            owner_id="dev-user",
            active_version_id=f"{project_id}-eval-version-archived-v1",
            created_at=now,
            updated_at=now,
            notes="Archived status fixture.",
        ),
    ]


def dataset_or_404(project_id: str, dataset_id: str) -> EvaluationDataset:
    for dataset in evaluation_datasets(project_id):
        if dataset.id == dataset_id:
            return dataset
    raise ApiException(
        status_code=404,
        code="EVALUATION_DATASET_NOT_FOUND",
        message="Evaluation dataset was not found.",
        details={"dataset_id": dataset_id},
    )


def dataset_versions(db: Session, dataset_id: str) -> list[EvaluationDatasetVersion]:
    project_id = dataset_id.split("-eval-dataset-", 1)[0]
    status = dataset_or_404(project_id, dataset_id).status
    return [
        EvaluationDatasetVersion(
            id=f"{project_id}-eval-version-{status.value.lower()}-v1",
            dataset_id=dataset_id,
            project_id=project_id,
            version=1,
            status=status,
            source_refs=[_first_source_ref(db, project_id)],
            source_segment_refs=[_first_source_ref(db, project_id)],
            candidate_refs=[CandidateRef(candidate_kind=CandidateKind.ENTITY, candidate_id="candidate-lineage-only")],
            evidence_refs=[_first_evidence_ref(db, project_id)],
            golden_item_count=4 if status == EvaluationDatasetStatus.ACTIVE else 0,
            created_by="dev-user",
            created_at=utc_now(),
            notes="Deterministic local MVP4 dataset version.",
        )
    ]


def dataset_version_or_404(db: Session, dataset_version_id: str) -> EvaluationDatasetVersion:
    project_id = dataset_version_id.split("-eval-version-", 1)[0]
    for dataset in evaluation_datasets(project_id):
        for version in dataset_versions(db, dataset.id):
            if version.id == dataset_version_id:
                return version
    raise ApiException(
        status_code=404,
        code="EVALUATION_DATASET_VERSION_NOT_FOUND",
        message="Evaluation dataset version was not found.",
        details={"dataset_version_id": dataset_version_id},
    )


def golden_items(db: Session, dataset_version_id: str) -> list[GoldenSetItem]:
    version = dataset_version_or_404(db, dataset_version_id)
    published_ref = version_ref(current_graph_version(db, version.project_id))
    source_ref = _first_source_ref(db, version.project_id)
    evidence_ref = _first_evidence_ref(db, version.project_id)
    now = utc_now()
    return [
        GoldenSetItem(
            id=f"{dataset_version_id}-golden-entity",
            dataset_version_id=dataset_version_id,
            project_id=version.project_id,
            kind=GoldenSetItemKind.ENTITY,
            expected_payload={"canonical_name": "Acme Corp", "class_id": "Company"},
            source_refs=[source_ref],
            evidence_refs=[evidence_ref],
            review_decision_ref=ReviewDecisionRef(review_decision_type="APPROVE", reviewer_id="dev-user"),
            published_graph_version_ref=published_ref,
            reviewer_id="dev-user",
            created_at=now,
        ),
        GoldenSetItem(
            id=f"{dataset_version_id}-golden-relation",
            dataset_version_id=dataset_version_id,
            project_id=version.project_id,
            kind=GoldenSetItemKind.RELATION,
            expected_payload={"relation": "HAS_DEPARTMENT", "direction": "OUTBOUND"},
            source_refs=[source_ref],
            evidence_refs=[evidence_ref],
            published_graph_version_ref=published_ref,
            reviewer_id="dev-user",
            created_at=now,
        ),
        GoldenSetItem(
            id=f"{dataset_version_id}-golden-property",
            dataset_version_id=dataset_version_id,
            project_id=version.project_id,
            kind=GoldenSetItemKind.PROPERTY_VALUE,
            expected_payload={"property_id": "canonical_name", "expected_value": "Acme Corp"},
            source_refs=[source_ref],
            evidence_refs=[evidence_ref],
            published_graph_version_ref=published_ref,
            reviewer_id="dev-user",
            created_at=now,
        ),
        GoldenSetItem(
            id=f"{dataset_version_id}-golden-evidence",
            dataset_version_id=dataset_version_id,
            project_id=version.project_id,
            kind=GoldenSetItemKind.EVIDENCE_LINK,
            expected_payload={"evidence_id": evidence_ref.evidence_id, "source_id": source_ref.source_id},
            source_refs=[source_ref],
            evidence_refs=[evidence_ref],
            published_graph_version_ref=published_ref,
            reviewer_id="dev-user",
            created_at=now,
        ),
    ]


def prompt_experiments(project_id: str) -> list[PromptExperiment]:
    now = utc_now()
    dataset_id = f"{project_id}-eval-dataset-active"
    version_id = f"{project_id}-eval-version-active-v1"
    return [
        PromptExperiment(
            id=f"{project_id}-experiment-draft",
            project_id=project_id,
            name="Draft prompt comparison",
            hypothesis="Treatment prompt may improve missing evidence handling.",
            status=PromptExperimentStatus.DRAFT,
            dataset_id=dataset_id,
            dataset_version_id=version_id,
            control_prompt_version_id="prompt-control-v1",
            treatment_prompt_version_id="prompt-treatment-v1",
            model_provider="mock",
            model_name="mock-mvp4",
            created_by="dev-user",
            created_at=now,
            updated_at=now,
        ),
        PromptExperiment(
            id=f"{project_id}-experiment-completed",
            project_id=project_id,
            name="Completed prompt comparison",
            hypothesis="Treatment prompt improves traceability.",
            status=PromptExperimentStatus.COMPLETED,
            dataset_id=dataset_id,
            dataset_version_id=version_id,
            control_prompt_version_id="prompt-control-v1",
            treatment_prompt_version_id="prompt-treatment-v1",
            model_provider="mock",
            model_name="mock-mvp4",
            run_window=RunWindow(started_at=now, ended_at=now),
            created_by="dev-user",
            created_at=now,
            updated_at=now,
        ),
    ]


def evaluation_runs(project_id: str) -> list[EvaluationRun]:
    now = utc_now()
    version_id = f"{project_id}-eval-version-active-v1"
    dimensions = EvaluationDimensions(
        prompt_version_id="prompt-treatment-v1",
        model_run_id="model-run-mvp4",
        source_type="CSV",
        class_type="Company",
        relation_type="HAS_DEPARTMENT",
        validation_outcome="PASSED",
        review_decision="APPROVE",
        correction_pattern="NONE",
    )
    return [
        EvaluationRun(
            id=f"{project_id}-eval-run-success",
            project_id=project_id,
            dataset_version_id=version_id,
            experiment_id=f"{project_id}-experiment-completed",
            prompt_version_id="prompt-treatment-v1",
            model_run_id="model-run-mvp4",
            model_provider="mock",
            model_name="mock-mvp4",
            status="SUCCESS",
            started_at=now,
            ended_at=now,
            requested_by="dev-user",
            metrics=EvaluationRunMetrics(
                sample_count=8,
                approval_rate=0.5,
                rejection_rate=0.125,
                modification_rate=0.125,
                failed_validation_rate=0.125,
                missing_evidence_rate=0.125,
            ),
            dimensions=dimensions,
        ),
        EvaluationRun(
            id=f"{project_id}-eval-run-failed",
            project_id=project_id,
            dataset_version_id=version_id,
            experiment_id=f"{project_id}-experiment-draft",
            prompt_version_id="prompt-control-v1",
            model_provider="mock",
            model_name="mock-mvp4",
            status="FAILED",
            started_at=now,
            ended_at=now,
            requested_by="dev-user",
            metrics=EvaluationRunMetrics(sample_count=0),
            dimensions=EvaluationDimensions(prompt_version_id="prompt-control-v1"),
            error_code="MVP4_EVALUATION_FIXTURE_FAILED",
            error_message="Deterministic failed-run fixture for UI and QA state coverage.",
        ),
    ]


def prompt_performance_summary(project_id: str) -> PromptPerformanceSummary:
    return PromptPerformanceSummary(
        project_id=project_id,
        generated_at=utc_now(),
        filters={},
        comparison_dimensions=[
            "prompt_version_id",
            "model_run_id",
            "source_type",
            "class_type",
            "relation_type",
            "validation_outcome",
            "review_decision",
            "correction_pattern",
        ],
        rows=[
            PromptPerformanceRow(
                dimensions=EvaluationDimensions(
                    prompt_version_id="prompt-treatment-v1",
                    model_run_id="model-run-mvp4",
                    source_type="CSV",
                    class_type="Company",
                    relation_type="HAS_DEPARTMENT",
                    validation_outcome="PASSED",
                    review_decision="APPROVE",
                    correction_pattern="NONE",
                ),
                approval_rate=0.5,
                rejection_rate=0.125,
                modification_rate=0.125,
                failed_validation_rate=0.125,
                missing_evidence_rate=0.125,
                sample_count=8,
                latency_ms=None,
                token_count=None,
                cost=None,
                drilldown=QualityDrilldownHint(
                    target="evaluation_runs",
                    label="Completed evaluation run",
                    query={"evaluation_run_id": f"{project_id}-eval-run-success"},
                ),
            )
        ],
    )


def search(db: Session, project_id: str, query: str, limit: int, offset: int) -> SearchResponse:
    version = current_graph_version(db, project_id)
    published_ref = version_ref(version)
    normalized_query = query.strip().casefold()
    if normalized_query == "no-mvp4-results":
        return SearchResponse(
            project_id=project_id,
            query=query,
            published_graph_version_ref=published_ref,
            groups=[],
            total_count=0,
            limit=limit,
            offset=offset,
            index_state="READY",
        )

    source_ref = _first_source_ref(db, project_id)
    evidence_ref = _first_evidence_ref(db, project_id)
    entities = _published_entities(db, version.id)[:1]
    relations = _published_relations(db, version.id)[:1]
    groups = [
        SearchResultGroup(
            kind=SearchResultKind.PUBLISHED_ENTITY,
            total_count=len(entities),
            items=[
                SearchResultItem(
                    id=entity.id,
                    kind=SearchResultKind.PUBLISHED_ENTITY,
                    title=entity.canonical_name,
                    snippet=f"Published entity {entity.canonical_name}",
                    score=0.98,
                    published_graph_version_ref=published_ref,
                    evidence_refs=_evidence_refs_from_lineage(entity.lineage),
                    metadata={"class_id": entity.class_id},
                )
                for entity in entities
            ],
        ),
        SearchResultGroup(
            kind=SearchResultKind.PUBLISHED_RELATION,
            total_count=len(relations),
            items=[
                SearchResultItem(
                    id=relation.id,
                    kind=SearchResultKind.PUBLISHED_RELATION,
                    title="HAS_DEPARTMENT",
                    snippet="Published relation linking Acme Corp to a department.",
                    score=0.93,
                    published_graph_version_ref=published_ref,
                    evidence_refs=_evidence_refs_from_lineage(relation.lineage),
                    metadata={"relation_id": relation.relation_id},
                )
                for relation in relations
            ],
        ),
        SearchResultGroup(
            kind=SearchResultKind.SOURCE,
            total_count=1,
            items=[
                SearchResultItem(
                    id=source_ref.source_id,
                    kind=SearchResultKind.SOURCE,
                    title=source_ref.label or "MVP4 source",
                    snippet="Source file used for deterministic MVP4 smoke.",
                    score=0.82,
                    source_ref=source_ref,
                )
            ],
        ),
        SearchResultGroup(
            kind=SearchResultKind.SOURCE_CHUNK,
            total_count=1,
            items=[
                SearchResultItem(
                    id=source_ref.source_segment_id or "segment-mvp4",
                    kind=SearchResultKind.SOURCE_CHUNK,
                    title="Source chunk",
                    snippet="company_name=Acme Corp | department_name=Research",
                    score=0.8,
                    source_ref=source_ref,
                )
            ],
        ),
        SearchResultGroup(
            kind=SearchResultKind.EVIDENCE,
            total_count=1,
            items=[
                SearchResultItem(
                    id=evidence_ref.evidence_id,
                    kind=SearchResultKind.EVIDENCE,
                    title=evidence_ref.label or "Evidence",
                    snippet="Evidence supporting the published Acme department fact.",
                    score=0.79,
                    source_ref=source_ref,
                    evidence_refs=[evidence_ref],
                )
            ],
        ),
        SearchResultGroup(
            kind=SearchResultKind.LINEAGE,
            total_count=1,
            items=[
                SearchResultItem(
                    id=f"{version.id}-lineage",
                    kind=SearchResultKind.LINEAGE,
                    title="Published lineage",
                    snippet="Review and publish lineage for the approved graph fact.",
                    score=0.74,
                    published_graph_version_ref=published_ref,
                    lineage_ref=f"{version.id}:lineage",
                )
            ],
        ),
    ]
    sliced_groups = [
        SearchResultGroup(kind=group.kind, total_count=group.total_count, items=group.items[offset : offset + limit])
        for group in groups
        if group.items
    ]
    return SearchResponse(
        project_id=project_id,
        query=query,
        published_graph_version_ref=published_ref,
        groups=sliced_groups,
        total_count=sum(group.total_count for group in sliced_groups),
        limit=limit,
        offset=offset,
        index_state="STALE" if normalized_query == "stale" else "READY",
    )


def vector_status(db: Session, project_id: str) -> VectorAdapterState:
    project_or_404(db, project_id)
    return VectorAdapterState(
        project_id=project_id,
        status=VectorAdapterStatus.FALLBACK_KEYWORD,
        embedding_target="source_segments_and_evidence",
        index_name="local-keyword-fallback",
        indexed_chunk_count=3,
        last_indexed_at=utc_now(),
        fallback_reason=VectorFallbackReason.KEYWORD_FALLBACK_USED,
        message="Production vector DB is not configured; local keyword fallback is active.",
    )


def similar_evidence(
    db: Session,
    project_id: str,
    *,
    query: str | None,
    limit: int,
) -> SimilarEvidenceResponse:
    state = vector_status(db, project_id)
    version = current_graph_version(db, project_id)
    evidence_ref = _first_evidence_ref(db, project_id)
    source_ref = _first_source_ref(db, project_id)
    entity = _published_entities(db, version.id)[0]
    return SimilarEvidenceResponse(
        project_id=project_id,
        adapter_state=state,
        fallback_used=True,
        items=[
            SimilarEvidenceItem(
                evidence_ref=evidence_ref,
                source_ref=source_ref,
                snippet=f"Keyword fallback match for {query or 'published fact'}: Acme Corp Research.",
                similarity_score=0.72,
                match_reason="keyword_fallback",
                published_graph_version_ref=version_ref(version),
                linked_published_fact_refs=[
                    PublishedFactRef(
                        fact_type=SearchResultKind.PUBLISHED_ENTITY,
                        fact_id=entity.id,
                        published_graph_version_id=version.id,
                        label=entity.canonical_name,
                    )
                ],
            )
        ][:limit],
    )


def rag_answer(db: Session, project_id: str, payload: RagAnswerRequest) -> RagAnswerResponse:
    version = current_graph_version(db, project_id)
    published_ref = version_ref(version)
    if "candidate-only" in payload.question.casefold():
        return RagAnswerResponse(
            project_id=project_id,
            question=payload.question,
            state=RagAnswerState.INSUFFICIENT_EVIDENCE,
            answer=None,
            coverage=0.0,
            published_graph_version_ref=published_ref,
            citations=[],
            linked_published_facts=[],
            insufficient_evidence=InsufficientEvidenceState(
                reason_code="NO_PUBLISHED_FACTS",
                message="Only candidate or unsupported facts matched the question.",
                missing_scopes=["published_graph_fact", "evidence_citation"],
                suggested_queries=["Acme department published evidence"],
            ),
            debug={"candidate_facts_excluded": True},
        )

    entities = _published_entities(db, version.id)
    relations = _published_relations(db, version.id)
    entity = entities[0]
    relation = relations[0] if relations else None
    evidence_ref = _first_evidence_ref(db, project_id)
    source_ref = _first_source_ref(db, project_id)
    facts = [
        PublishedFactRef(
            fact_type=SearchResultKind.PUBLISHED_ENTITY,
            fact_id=entity.id,
            published_graph_version_id=version.id,
            label=entity.canonical_name,
        )
    ]
    if relation is not None:
        facts.append(
            PublishedFactRef(
                fact_type=SearchResultKind.PUBLISHED_RELATION,
                fact_id=relation.id,
                published_graph_version_id=version.id,
                label="HAS_DEPARTMENT",
            )
        )
    citations = [
        RagCitation(
            citation_id="citation-mvp4-evidence-1",
            kind=RagCitationKind.EVIDENCE_CHUNK,
            evidence_ref=evidence_ref,
            source_ref=source_ref,
            published_fact_ref=facts[0],
            quote="company_name=Acme Corp | department_name=Research",
            snippet="Acme Corp is linked to Research in the published graph.",
            locator=source_ref.locator,
        )
    ][: payload.max_citations]
    return RagAnswerResponse(
        project_id=project_id,
        question=payload.question,
        state=RagAnswerState.ANSWERED,
        answer="Acme Corp is supported as linked to the Research department in the current published graph.",
        coverage=1.0,
        published_graph_version_ref=published_ref,
        citations=citations,
        linked_published_facts=facts,
        debug={"candidate_facts_excluded": True},
    )


def graph_explore(
    db: Session,
    *,
    project_id: str,
    version_id: str | None = None,
    root_entity_id: str | None = None,
    max_hops: int = 2,
    node_budget: int = 150,
    edge_budget: int = 300,
) -> GraphExploreResponse:
    version = graph_version_or_404(db, version_id) if version_id else current_graph_version(db, project_id)
    entities = _published_entities(db, version.id)
    relations = _published_relations(db, version.id)
    root = root_entity_id or (entities[0].id if entities else "published-root-empty")
    published_ref = version_ref(version)
    if max_hops > 3 or len(entities) > node_budget or len(relations) > edge_budget:
        return GraphExploreResponse(
            project_id=version.project_id,
            state=GraphExploreState.SAFE_TOO_LARGE,
            published_graph_version_ref=published_ref,
            root_entity_id=root,
            max_hops=3,
            nodes=[],
            edges=[],
            too_large=GraphTooLargeState(
                estimated_nodes=max(len(entities), node_budget + 1),
                estimated_edges=max(len(relations), edge_budget + 1),
                node_budget=node_budget,
                edge_budget=edge_budget,
                suggested_filters=["class_ids", "relation_ids", "max_hops=2"],
                message="Graph request exceeds MVP4 safety budget.",
            ),
        )

    node_by_entity_id: dict[str, GraphExploreNode] = {}
    for index, entity in enumerate(entities):
        node_by_entity_id[entity.id] = GraphExploreNode(
            id=f"published-node-{entity.id}",
            published_entity_id=entity.id,
            class_id=entity.class_id,
            label=entity.canonical_name,
            hop=0 if entity.id == root else min(index + 1, max_hops),
            properties=entity.properties or {},
            quality_summary={"traceability": 1.0},
            source_count=len(_source_refs_from_lineage(entity.lineage)),
            evidence_count=len(_evidence_refs_from_lineage(entity.lineage)),
            lineage_available=True,
        )
    edges = [
        GraphExploreEdge(
            id=f"published-edge-{relation.id}",
            published_relation_id=relation.id,
            source_node_id=f"published-node-{relation.source_published_entity_id}",
            target_node_id=f"published-node-{relation.target_published_entity_id}",
            relation_id=relation.relation_id,
            label="HAS_DEPARTMENT",
            properties=relation.properties or {},
            quality_summary={"traceability": 1.0},
            evidence_count=len(_evidence_refs_from_lineage(relation.lineage)),
            lineage_available=True,
        )
        for relation in relations
    ]
    lineage_panel = lineage_for_fact(
        db,
        fact_type=SearchResultKind.PUBLISHED_ENTITY,
        fact_id=entities[0].id,
    ) if entities else None
    return GraphExploreResponse(
        project_id=version.project_id,
        state=GraphExploreState.READY if entities else GraphExploreState.EMPTY,
        published_graph_version_ref=published_ref,
        root_entity_id=root,
        max_hops=max_hops,
        nodes=list(node_by_entity_id.values()),
        edges=edges,
        quality_overlays=[
            GraphQualityOverlay(target_id=node.id, score=1.0, flags=[])
            for node in node_by_entity_id.values()
        ],
        source_overlays=[
            GraphSourceOverlay(
                target_id=node.id,
                source_refs=[_first_source_ref(db, version.project_id)],
                evidence_refs=[_first_evidence_ref(db, version.project_id)],
            )
            for node in node_by_entity_id.values()
        ],
        lineage_panel=lineage_panel,
    )


def lineage_for_fact(
    db: Session,
    *,
    fact_type: SearchResultKind,
    fact_id: str,
) -> PublishedLineagePanel:
    if fact_type == SearchResultKind.PUBLISHED_RELATION:
        relation = db.get(PublishedRelationModel, fact_id)
        if relation is None:
            raise ApiException(
                status_code=404,
                code="PUBLISHED_FACT_NOT_FOUND",
                message="Published relation was not found.",
                details={"fact_id": fact_id},
            )
        version = graph_version_or_404(db, relation.published_graph_version_id)
        lineage = relation.lineage or {}
        label = "HAS_DEPARTMENT"
    else:
        entity = db.get(PublishedEntityModel, fact_id)
        if entity is None:
            raise ApiException(
                status_code=404,
                code="PUBLISHED_FACT_NOT_FOUND",
                message="Published entity was not found.",
                details={"fact_id": fact_id},
            )
        version = graph_version_or_404(db, entity.published_graph_version_id)
        lineage = entity.lineage or {}
        label = entity.canonical_name
    evidence_refs = _evidence_refs_from_lineage(lineage)
    return PublishedLineagePanel(
        fact_ref=PublishedFactRef(
            fact_type=fact_type,
            fact_id=fact_id,
            published_graph_version_id=version.id,
            label=label,
        ),
        published_graph_version_ref=version_ref(version),
        publish_job_id=lineage.get("publish_job_id"),
        review_decision_ref=ReviewDecisionRef(
            review_decision_id=lineage.get("review_decision_id"),
            review_decision_type=lineage.get("review_decision_type"),
            reviewer_id=lineage.get("reviewer_id"),
            reviewed_at=lineage.get("reviewed_at"),
        ),
        candidate_ref=CandidateRef(
            candidate_kind=lineage.get("candidate_kind", CandidateKind.ENTITY),
            candidate_id=lineage.get("candidate_id", "candidate-lineage-only"),
        ),
        evidence_refs=evidence_refs,
        source_refs=_source_refs_from_lineage(lineage),
        ontology_version_id=lineage.get("ontology_version_id"),
        model_run_id=lineage.get("model_run_id"),
        prompt_version_id=lineage.get("prompt_version_id"),
        created_at=lineage.get("published_at") or lineage.get("reviewed_at"),
    )


def source_read(db: Session, source_id: str) -> SourceData:
    source = db.get(SourceDataModel, source_id)
    if source is None:
        raise ApiException(
            status_code=404,
            code="SOURCE_NOT_FOUND",
            message="Source was not found.",
            details={"source_id": source_id},
        )
    return SourceData(
        id=source.id,
        project_id=source.project_id,
        file_name=source.file_name,
        source_type=source.source_type,
        mime_type=source.mime_type,
        size_bytes=source.size_bytes,
        status=source.status,
        preview_status=source.preview_status,
        storage_uri=source.storage_uri,
        uploaded_at=source.uploaded_at,
        created_by=source.created_by,
        metadata=source.metadata_ or {},
    )


def evidence_read(db: Session, evidence_id: str) -> EvidenceRead:
    evidence = db.get(CandidateEvidence, evidence_id)
    if evidence is None:
        raise ApiException(
            status_code=404,
            code="EVIDENCE_NOT_FOUND",
            message="Evidence was not found.",
            details={"evidence_id": evidence_id},
        )
    source = db.get(SourceDataModel, evidence.source_id)
    project_id = source.project_id if source else "unknown"
    metadata = evidence.metadata_ or {}
    return EvidenceRead(
        id=evidence.id,
        project_id=project_id,
        source_id=evidence.source_id,
        source_segment_id=evidence.source_segment_id,
        evidence_text=evidence.evidence_text,
        locator=metadata.get("locator"),
        metadata=metadata,
        created_at=evidence.created_at,
    )


def external_graph_snapshot(db: Session, project_id: str) -> PublishedGraphSnapshot:
    return graph_snapshot(db, current_graph_version(db, project_id))


def external_entity(db: Session, entity_id: str):
    entity = db.get(PublishedEntityModel, entity_id)
    if entity is None:
        raise ApiException(
            status_code=404,
            code="PUBLISHED_ENTITY_NOT_FOUND",
            message="Published entity was not found.",
            details={"entity_id": entity_id},
        )
    return to_published_entity(entity)


def external_relation(db: Session, relation_id: str):
    relation = db.get(PublishedRelationModel, relation_id)
    if relation is None:
        raise ApiException(
            status_code=404,
            code="PUBLISHED_RELATION_NOT_FOUND",
            message="Published relation was not found.",
            details={"relation_id": relation_id},
        )
    return to_published_relation(relation)


def publish_evidence_refs_to_mvp4(refs: list[PublishEvidenceRef]) -> list[EvidenceRef]:
    return [
        EvidenceRef(
            evidence_id=ref.evidence_id,
            source_id=ref.source_id,
            source_segment_id=ref.source_segment_id,
            label=ref.label,
        )
        for ref in refs
    ]
