from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.enums import EvaluationDatasetStatus
from app.core.errors import ApiException
from app.modules.project.models import Project

from .schemas import (
    EvaluationCandidateRef,
    EvaluationDataset,
    EvaluationDatasetCreateRequest,
    EvaluationErrorCase,
    EvaluationErrorType,
    EvaluationMetric,
    EvaluationMetricName,
    EvaluationMetricStatus,
    EvaluationRun,
    EvaluationRunCreateRequest,
    EvaluationRunMode,
    EvaluationRunStatus,
    EvaluationSample,
    EvaluationSampleCreateRequest,
    GoldEntity,
    GoldEntityCreateRequest,
    GoldEvidenceRef,
    GoldRelation,
    GoldRelationCreateRequest,
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


_datasets: dict[str, EvaluationDataset] = {}
_samples: dict[str, EvaluationSample] = {}
_gold_entities: dict[str, GoldEntity] = {}
_gold_relations: dict[str, GoldRelation] = {}
_runs: dict[str, EvaluationRun] = {}
_metrics_by_run: dict[str, list[EvaluationMetric]] = {}
_errors_by_run: dict[str, list[EvaluationErrorCase]] = {}
_errors: dict[str, EvaluationErrorCase] = {}


def reset_runtime_store() -> None:
    _datasets.clear()
    _samples.clear()
    _gold_entities.clear()
    _gold_relations.clear()
    _runs.clear()
    _metrics_by_run.clear()
    _errors_by_run.clear()
    _errors.clear()


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


def _project_id_from_dataset_id(dataset_id: str) -> str:
    return dataset_id.split("-eval-dataset-", 1)[0]


def _project_id_from_run_id(run_id: str) -> str:
    return run_id.split("-eval-run-", 1)[0]


def _normalize(value: str | None) -> str:
    return " ".join((value or "").casefold().split())


def _dataset_counts(dataset: EvaluationDataset) -> EvaluationDataset:
    sample_count = sum(1 for sample in _samples.values() if sample.dataset_id == dataset.id)
    gold_entity_count = sum(
        1 for entity in _gold_entities.values() if entity.dataset_id == dataset.id
    )
    gold_relation_count = sum(
        1 for relation in _gold_relations.values() if relation.dataset_id == dataset.id
    )
    return dataset.model_copy(
        update={
            "sample_count": sample_count,
            "gold_entity_count": gold_entity_count,
            "gold_relation_count": gold_relation_count,
        }
    )


def _legacy_datasets(project_id: str) -> list[EvaluationDataset]:
    now = utc_now()
    return [
        EvaluationDataset(
            id=f"{project_id}-eval-dataset-draft",
            project_id=project_id,
            name="MVP4 Draft Golden Set",
            description="Editable draft dataset for MVP4 smoke.",
            status=EvaluationDatasetStatus.DRAFT,
            sample_count=0,
            gold_entity_count=0,
            gold_relation_count=0,
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
            sample_count=1,
            gold_entity_count=2,
            gold_relation_count=1,
            owner_id="dev-user",
            active_version_id=f"{project_id}-eval-version-active-v1",
            created_at=now,
            updated_at=now,
            notes="Contains deterministic compatibility fixtures.",
        ),
        EvaluationDataset(
            id=f"{project_id}-eval-dataset-archived",
            project_id=project_id,
            name="MVP4 Archived Golden Set",
            status=EvaluationDatasetStatus.ARCHIVED,
            sample_count=0,
            gold_entity_count=0,
            gold_relation_count=0,
            owner_id="dev-user",
            active_version_id=f"{project_id}-eval-version-archived-v1",
            created_at=now,
            updated_at=now,
            notes="Archived status fixture.",
        ),
    ]


def list_datasets(project_id: str) -> list[EvaluationDataset]:
    created = [
        _dataset_counts(dataset)
        for dataset in _datasets.values()
        if dataset.project_id == project_id
    ]
    return [*created, *_legacy_datasets(project_id)]


def create_dataset(project_id: str, payload: EvaluationDatasetCreateRequest) -> EvaluationDataset:
    now = utc_now()
    dataset_number = sum(1 for dataset in _datasets.values() if dataset.project_id == project_id) + 1
    dataset = EvaluationDataset(
        id=f"{project_id}-eval-dataset-mvp6-{dataset_number}",
        project_id=project_id,
        name=payload.name,
        description=payload.description,
        status=payload.status,
        sample_count=0,
        gold_entity_count=0,
        gold_relation_count=0,
        owner_id="dev-user",
        created_at=now,
        updated_at=now,
    )
    _datasets[dataset.id] = dataset
    return dataset


def dataset_or_404(dataset_id: str) -> EvaluationDataset:
    if dataset_id in _datasets:
        return _dataset_counts(_datasets[dataset_id])
    project_id = _project_id_from_dataset_id(dataset_id)
    for dataset in _legacy_datasets(project_id):
        if dataset.id == dataset_id:
            return dataset
    raise ApiException(
        status_code=404,
        code="EVALUATION_DATASET_NOT_FOUND",
        message="Evaluation dataset was not found.",
        details={"dataset_id": dataset_id},
    )


def list_samples(dataset_id: str) -> list[EvaluationSample]:
    dataset_or_404(dataset_id)
    return [sample for sample in _samples.values() if sample.dataset_id == dataset_id]


def create_sample(dataset_id: str, payload: EvaluationSampleCreateRequest) -> EvaluationSample:
    dataset = dataset_or_404(dataset_id)
    now = utc_now()
    sample_number = sum(1 for sample in _samples.values() if sample.dataset_id == dataset_id) + 1
    sample = EvaluationSample(
        id=f"{dataset_id}-sample-{sample_number}",
        project_id=dataset.project_id,
        dataset_id=dataset_id,
        sample_kind=payload.sample_kind,
        source_id=payload.source_id,
        source_segment_id=payload.source_segment_id,
        source_locator=payload.source_locator,
        title=payload.title,
        content_text=payload.content_text,
        metadata=payload.metadata,
        created_at=now,
    )
    _samples[sample.id] = sample
    _datasets[dataset_id] = dataset.model_copy(update={"updated_at": now})
    return sample


def _sample_or_404(dataset_id: str, sample_id: str) -> EvaluationSample:
    sample = _samples.get(sample_id)
    if sample is None or sample.dataset_id != dataset_id:
        raise ApiException(
            status_code=404,
            code="EVALUATION_SAMPLE_NOT_FOUND",
            message="Evaluation sample was not found in the dataset.",
            details={"dataset_id": dataset_id, "sample_id": sample_id},
        )
    return sample


def list_gold_entities(dataset_id: str) -> list[GoldEntity]:
    dataset_or_404(dataset_id)
    return [entity for entity in _gold_entities.values() if entity.dataset_id == dataset_id]


def create_gold_entity(dataset_id: str, payload: GoldEntityCreateRequest) -> GoldEntity:
    dataset = dataset_or_404(dataset_id)
    _sample_or_404(dataset_id, payload.sample_id)
    if payload.evidence.sample_id != payload.sample_id:
        raise ApiException(
            status_code=400,
            code="GOLD_EVIDENCE_SAMPLE_MISMATCH",
            message="Gold entity evidence sample_id must match the entity sample_id.",
            details={"sample_id": payload.sample_id, "evidence_sample_id": payload.evidence.sample_id},
        )
    now = utc_now()
    entity_number = (
        sum(1 for entity in _gold_entities.values() if entity.dataset_id == dataset_id) + 1
    )
    entity = GoldEntity(
        id=f"{dataset_id}-gold-entity-{entity_number}",
        project_id=dataset.project_id,
        dataset_id=dataset_id,
        sample_id=payload.sample_id,
        ontology_class_id=payload.ontology_class_id,
        label=payload.label,
        normalized_value=_normalize(payload.normalized_value or payload.label),
        evidence=payload.evidence,
        created_at=now,
    )
    _gold_entities[entity.id] = entity
    _datasets[dataset_id] = dataset.model_copy(update={"updated_at": now})
    return entity


def _gold_entity_or_404(dataset_id: str, entity_id: str) -> GoldEntity:
    entity = _gold_entities.get(entity_id)
    if entity is None or entity.dataset_id != dataset_id:
        raise ApiException(
            status_code=404,
            code="GOLD_ENTITY_NOT_FOUND",
            message="Gold entity was not found in the dataset.",
            details={"dataset_id": dataset_id, "gold_entity_id": entity_id},
        )
    return entity


def list_gold_relations(dataset_id: str) -> list[GoldRelation]:
    dataset_or_404(dataset_id)
    return [relation for relation in _gold_relations.values() if relation.dataset_id == dataset_id]


def create_gold_relation(dataset_id: str, payload: GoldRelationCreateRequest) -> GoldRelation:
    dataset = dataset_or_404(dataset_id)
    _sample_or_404(dataset_id, payload.sample_id)
    _gold_entity_or_404(dataset_id, payload.source_gold_entity_id)
    _gold_entity_or_404(dataset_id, payload.target_gold_entity_id)
    if payload.evidence.sample_id != payload.sample_id:
        raise ApiException(
            status_code=400,
            code="GOLD_EVIDENCE_SAMPLE_MISMATCH",
            message="Gold relation evidence sample_id must match the relation sample_id.",
            details={"sample_id": payload.sample_id, "evidence_sample_id": payload.evidence.sample_id},
        )
    now = utc_now()
    relation_number = (
        sum(1 for relation in _gold_relations.values() if relation.dataset_id == dataset_id) + 1
    )
    relation = GoldRelation(
        id=f"{dataset_id}-gold-relation-{relation_number}",
        project_id=dataset.project_id,
        dataset_id=dataset_id,
        sample_id=payload.sample_id,
        ontology_relation_id=payload.ontology_relation_id,
        source_gold_entity_id=payload.source_gold_entity_id,
        target_gold_entity_id=payload.target_gold_entity_id,
        evidence=payload.evidence,
        created_at=now,
    )
    _gold_relations[relation.id] = relation
    _datasets[dataset_id] = dataset.model_copy(update={"updated_at": now})
    return relation


def _legacy_runs(project_id: str) -> list[EvaluationRun]:
    now = utc_now()
    dataset_id = f"{project_id}-eval-dataset-active"
    return [
        EvaluationRun(
            id=f"{project_id}-eval-run-success",
            project_id=project_id,
            dataset_id=dataset_id,
            dataset_version_id=f"{project_id}-eval-version-active-v1",
            experiment_id=f"{project_id}-experiment-completed",
            prompt_version_id="prompt-treatment-v1",
            model_run_id="model-run-mvp4",
            model_provider="mock",
            model_name="mock-mvp4",
            status="SUCCESS",
            started_at=now,
            completed_at=now,
            requested_by="dev-user",
            metrics={
                "sample_count": 8,
                "approval_rate": 0.5,
                "rejection_rate": 0.125,
                "modification_rate": 0.125,
                "failed_validation_rate": 0.125,
                "missing_evidence_rate": 0.125,
            },
            dimensions={
                "prompt_version_id": "prompt-treatment-v1",
                "model_run_id": "model-run-mvp4",
                "source_type": "CSV",
                "class_type": "Company",
                "relation_type": "HAS_DEPARTMENT",
                "validation_outcome": "PASSED",
                "review_decision": "APPROVE",
                "correction_pattern": "NONE",
            },
        ),
        EvaluationRun(
            id=f"{project_id}-eval-run-failed",
            project_id=project_id,
            dataset_id=dataset_id,
            dataset_version_id=f"{project_id}-eval-version-active-v1",
            experiment_id=f"{project_id}-experiment-draft",
            prompt_version_id="prompt-control-v1",
            model_provider="mock",
            model_name="mock-mvp4",
            status=EvaluationRunStatus.FAILED,
            started_at=now,
            completed_at=now,
            requested_by="dev-user",
            metrics={"sample_count": 0},
            dimensions={"prompt_version_id": "prompt-control-v1"},
            error_code="MVP4_EVALUATION_FIXTURE_FAILED",
            error_message="Deterministic failed-run fixture for UI and QA state coverage.",
        ),
    ]


def list_runs(project_id: str) -> list[EvaluationRun]:
    created = [run for run in _runs.values() if run.project_id == project_id]
    return [*created, *_legacy_runs(project_id)]


def _candidate_evidence_from_sample(sample: EvaluationSample, quote: str | None) -> GoldEvidenceRef:
    return GoldEvidenceRef(
        sample_id=sample.id,
        source_id=sample.source_id,
        source_segment_id=sample.source_segment_id,
        locator=sample.source_locator,
        quote=quote,
    )


def _entity_candidate_from_gold(
    gold: GoldEntity,
    *,
    candidate_id: str,
    evidence: GoldEvidenceRef | None = None,
    label: str | None = None,
    normalized_value: str | None = None,
    ontology_class_id: str | None = None,
) -> EvaluationCandidateRef:
    return EvaluationCandidateRef(
        candidate_id=candidate_id,
        candidate_kind="ENTITY",
        sample_id=gold.sample_id,
        ontology_class_id=ontology_class_id or gold.ontology_class_id,
        label=label or gold.label,
        normalized_value=normalized_value or gold.normalized_value,
        evidence=evidence or gold.evidence,
    )


def _relation_candidate_from_gold(
    gold: GoldRelation,
    *,
    candidate_id: str,
    evidence: GoldEvidenceRef | None = None,
    ontology_relation_id: str | None = None,
    source_gold_entity_id: str | None = None,
    target_gold_entity_id: str | None = None,
) -> EvaluationCandidateRef:
    return EvaluationCandidateRef(
        candidate_id=candidate_id,
        candidate_kind="RELATION",
        sample_id=gold.sample_id,
        ontology_relation_id=ontology_relation_id or gold.ontology_relation_id,
        source_gold_entity_id=source_gold_entity_id or gold.source_gold_entity_id,
        target_gold_entity_id=target_gold_entity_id or gold.target_gold_entity_id,
        evidence=evidence or gold.evidence,
    )


def _candidate_evidence(candidate: EvaluationCandidateRef) -> GoldEvidenceRef | None:
    return candidate.evidence


def _entity_key(entity: GoldEntity | EvaluationCandidateRef) -> tuple[str, str | None, str | None]:
    return (entity.sample_id, entity.ontology_class_id, _normalize(entity.normalized_value))


def _relation_key(
    relation: GoldRelation | EvaluationCandidateRef,
) -> tuple[str, str | None, str | None, str | None]:
    return (
        relation.sample_id,
        relation.ontology_relation_id,
        relation.source_gold_entity_id,
        relation.target_gold_entity_id,
    )


def _relation_unordered_key(
    relation: GoldRelation | EvaluationCandidateRef,
) -> tuple[str, str | None, frozenset[str | None]]:
    return (
        relation.sample_id,
        relation.ontology_relation_id,
        frozenset({relation.source_gold_entity_id, relation.target_gold_entity_id}),
    )


def _offsets_overlap(gold: GoldEvidenceRef, candidate: GoldEvidenceRef) -> bool:
    if None in {
        gold.offset_start,
        gold.offset_end,
        candidate.offset_start,
        candidate.offset_end,
    }:
        return False
    return bool(gold.offset_start < candidate.offset_end and candidate.offset_start < gold.offset_end)


def _evidence_matches(gold: GoldEvidenceRef | None, candidate: GoldEvidenceRef | None) -> bool:
    if gold is None or candidate is None:
        return False
    if gold.sample_id != candidate.sample_id:
        return False
    if gold.source_segment_id and candidate.source_segment_id:
        if gold.source_segment_id != candidate.source_segment_id:
            return False
    if gold.locator and candidate.locator and gold.locator == candidate.locator:
        return True
    if gold.quote and candidate.quote and _normalize(gold.quote) == _normalize(candidate.quote):
        return True
    return _offsets_overlap(gold, candidate)


def _metric(
    run_id: str,
    name: EvaluationMetricName,
    numerator: int,
    denominator: int,
    formula: str,
    computed_at: datetime,
) -> EvaluationMetric:
    if denominator == 0:
        return EvaluationMetric(
            run_id=run_id,
            metric_name=name,
            value=None,
            numerator=numerator,
            denominator=denominator,
            formula=formula,
            status=EvaluationMetricStatus.NOT_APPLICABLE,
            computed_at=computed_at,
        )
    return EvaluationMetric(
        run_id=run_id,
        metric_name=name,
        value=round(numerator / denominator, 4),
        numerator=numerator,
        denominator=denominator,
        formula=formula,
        status=EvaluationMetricStatus.MEASURED,
        computed_at=computed_at,
    )


def _build_deterministic_entity_candidates(
    dataset_id: str,
) -> list[EvaluationCandidateRef]:
    gold = list_gold_entities(dataset_id)
    candidates = [
        _entity_candidate_from_gold(entity, candidate_id=f"candidate-{entity.id}")
        for entity in gold[:2]
    ]
    if gold:
        sample = _samples[gold[0].sample_id]
        candidates.append(
            EvaluationCandidateRef(
                candidate_id=f"{dataset_id}-candidate-extra-entity",
                candidate_kind="ENTITY",
                sample_id=sample.id,
                ontology_class_id="class-extra",
                label="Extra Entity",
                normalized_value="extra entity",
                evidence=_candidate_evidence_from_sample(sample, "Extra Entity"),
            )
        )
    return candidates


def _build_deterministic_relation_candidates(
    dataset_id: str,
) -> list[EvaluationCandidateRef]:
    gold = list_gold_relations(dataset_id)
    candidates = [
        _relation_candidate_from_gold(relation, candidate_id=f"candidate-{relation.id}")
        for relation in gold[:1]
    ]
    if gold:
        sample = _samples[gold[0].sample_id]
        candidates.append(
            EvaluationCandidateRef(
                candidate_id=f"{dataset_id}-candidate-extra-relation",
                candidate_kind="RELATION",
                sample_id=sample.id,
                ontology_relation_id="relation-extra",
                source_gold_entity_id=gold[0].target_gold_entity_id,
                target_gold_entity_id=gold[0].source_gold_entity_id,
                evidence=_candidate_evidence_from_sample(sample, "Extra relation"),
            )
        )
    return candidates


def _match_entities(
    gold_entities: list[GoldEntity],
    candidate_entities: list[EvaluationCandidateRef],
) -> tuple[list[tuple[GoldEntity, EvaluationCandidateRef]], list[GoldEntity], list[EvaluationCandidateRef]]:
    unmatched_candidates = list(candidate_entities)
    matches: list[tuple[GoldEntity, EvaluationCandidateRef]] = []
    missing: list[GoldEntity] = []
    for gold in gold_entities:
        match = next(
            (candidate for candidate in unmatched_candidates if _entity_key(candidate) == _entity_key(gold)),
            None,
        )
        if match is None:
            missing.append(gold)
            continue
        matches.append((gold, match))
        unmatched_candidates.remove(match)
    return matches, missing, unmatched_candidates


def _match_relations(
    gold_relations: list[GoldRelation],
    candidate_relations: list[EvaluationCandidateRef],
) -> tuple[
    list[tuple[GoldRelation, EvaluationCandidateRef]],
    list[GoldRelation],
    list[EvaluationCandidateRef],
    list[tuple[GoldRelation, EvaluationCandidateRef]],
]:
    unmatched_candidates = list(candidate_relations)
    matches: list[tuple[GoldRelation, EvaluationCandidateRef]] = []
    missing: list[GoldRelation] = []
    wrong_direction: list[tuple[GoldRelation, EvaluationCandidateRef]] = []
    for gold in gold_relations:
        match = next(
            (candidate for candidate in unmatched_candidates if _relation_key(candidate) == _relation_key(gold)),
            None,
        )
        if match is not None:
            matches.append((gold, match))
            unmatched_candidates.remove(match)
            continue
        reversed_match = next(
            (
                candidate
                for candidate in unmatched_candidates
                if _relation_unordered_key(candidate) == _relation_unordered_key(gold)
            ),
            None,
        )
        if reversed_match is not None:
            wrong_direction.append((gold, reversed_match))
            unmatched_candidates.remove(reversed_match)
            continue
        missing.append(gold)
    return matches, missing, unmatched_candidates, wrong_direction


def _error_case(
    *,
    run_id: str,
    project_id: str,
    dataset_id: str,
    sample_id: str,
    error_type: EvaluationErrorType,
    index: int,
    comparison_summary: str,
    gold_entity_id: str | None = None,
    gold_relation_id: str | None = None,
    candidate_ref: EvaluationCandidateRef | None = None,
    gold_evidence: GoldEvidenceRef | None = None,
    candidate_evidence: GoldEvidenceRef | None = None,
    created_at: datetime,
) -> EvaluationErrorCase:
    return EvaluationErrorCase(
        id=f"{run_id}-error-{index}",
        run_id=run_id,
        project_id=project_id,
        dataset_id=dataset_id,
        sample_id=sample_id,
        error_type=error_type,
        gold_entity_id=gold_entity_id,
        gold_relation_id=gold_relation_id,
        candidate_ref=candidate_ref,
        comparison_summary=comparison_summary,
        gold_evidence=gold_evidence,
        candidate_evidence=candidate_evidence,
        created_at=created_at,
    )


def create_run(project_id: str, payload: EvaluationRunCreateRequest) -> EvaluationRun:
    if payload.dataset_id is None:
        now = utc_now()
        return EvaluationRun(
            id=f"{project_id}-eval-run-draft-created",
            project_id=project_id,
            dataset_id=f"{project_id}-eval-dataset-active",
            dataset_version_id=payload.dataset_version_id or f"{project_id}-eval-version-active-v1",
            experiment_id=payload.experiment_id,
            status=EvaluationRunStatus.PENDING,
            started_at=None,
            completed_at=None,
            requested_by="dev-user",
            metrics={"sample_count": 0},
            dimensions={},
            model_name=payload.model_name,
            model_run_id=payload.model_run_id,
            prompt_version_id=payload.prompt_version_id,
            parser_version=payload.parser_version,
        )

    dataset = dataset_or_404(payload.dataset_id)
    if dataset.project_id != project_id:
        raise ApiException(
            status_code=400,
            code="EVALUATION_DATASET_PROJECT_MISMATCH",
            message="Evaluation dataset does not belong to the requested project.",
            details={"project_id": project_id, "dataset_id": payload.dataset_id},
        )

    now = utc_now()
    run_number = sum(1 for run in _runs.values() if run.project_id == project_id) + 1
    run_id = f"{project_id}-eval-run-mvp6-{run_number}"
    model_run_id = payload.model_run_id or f"{run_id}-model-run"

    gold_entities = list_gold_entities(dataset.id)
    gold_relations = list_gold_relations(dataset.id)
    entity_candidates = _build_deterministic_entity_candidates(dataset.id)
    relation_candidates = _build_deterministic_relation_candidates(dataset.id)
    entity_matches, missing_entities, extra_entities = _match_entities(
        gold_entities, entity_candidates
    )
    relation_matches, missing_relations, extra_relations, wrong_direction_relations = (
        _match_relations(gold_relations, relation_candidates)
    )

    entity_tp = len(entity_matches)
    entity_fp = len(extra_entities)
    entity_fn = len(missing_entities)
    relation_tp = len(relation_matches)
    relation_fp = len(extra_relations) + len(wrong_direction_relations)
    relation_fn = len(missing_relations) + len(wrong_direction_relations)
    direction_denominator = len(relation_matches) + len(wrong_direction_relations)
    direction_numerator = len(relation_matches)
    evidence_pairs: list[tuple[GoldEvidenceRef | None, GoldEvidenceRef | None]] = [
        (gold.evidence, _candidate_evidence(candidate)) for gold, candidate in entity_matches
    ]
    evidence_pairs.extend(
        (gold.evidence, _candidate_evidence(candidate)) for gold, candidate in relation_matches
    )
    evidence_numerator = sum(1 for gold, candidate in evidence_pairs if _evidence_matches(gold, candidate))
    evidence_denominator = len(evidence_pairs)

    metrics = [
        _metric(
            run_id,
            EvaluationMetricName.ENTITY_PRECISION,
            entity_tp,
            entity_tp + entity_fp,
            "entity_tp / (entity_tp + entity_fp)",
            now,
        ),
        _metric(
            run_id,
            EvaluationMetricName.ENTITY_RECALL,
            entity_tp,
            entity_tp + entity_fn,
            "entity_tp / (entity_tp + entity_fn)",
            now,
        ),
        _metric(
            run_id,
            EvaluationMetricName.ENTITY_F1,
            2 * entity_tp,
            2 * entity_tp + entity_fp + entity_fn,
            "2 * entity_tp / (2 * entity_tp + entity_fp + entity_fn)",
            now,
        ),
        _metric(
            run_id,
            EvaluationMetricName.RELATION_PRECISION,
            relation_tp,
            relation_tp + relation_fp,
            "relation_tp / (relation_tp + relation_fp)",
            now,
        ),
        _metric(
            run_id,
            EvaluationMetricName.RELATION_RECALL,
            relation_tp,
            relation_tp + relation_fn,
            "relation_tp / (relation_tp + relation_fn)",
            now,
        ),
        _metric(
            run_id,
            EvaluationMetricName.RELATION_F1,
            2 * relation_tp,
            2 * relation_tp + relation_fp + relation_fn,
            "2 * relation_tp / (2 * relation_tp + relation_fp + relation_fn)",
            now,
        ),
        _metric(
            run_id,
            EvaluationMetricName.RELATION_DIRECTION_ACCURACY,
            direction_numerator,
            direction_denominator,
            "correct_direction_matches / direction_comparable_relations",
            now,
        ),
        _metric(
            run_id,
            EvaluationMetricName.EVIDENCE_MATCH_RATE,
            evidence_numerator,
            evidence_denominator,
            "evidence_matches / evidence_comparable_matches",
            now,
        ),
    ]

    errors: list[EvaluationErrorCase] = []
    for missing in missing_entities:
        errors.append(
            _error_case(
                run_id=run_id,
                project_id=project_id,
                dataset_id=dataset.id,
                sample_id=missing.sample_id,
                error_type=EvaluationErrorType.MISSING_ENTITY,
                index=len(errors) + 1,
                gold_entity_id=missing.id,
                comparison_summary=f"Gold entity '{missing.label}' was not produced by the deterministic candidate set.",
                gold_evidence=missing.evidence,
                created_at=now,
            )
        )
    for extra in extra_entities:
        errors.append(
            _error_case(
                run_id=run_id,
                project_id=project_id,
                dataset_id=dataset.id,
                sample_id=extra.sample_id,
                error_type=EvaluationErrorType.EXTRA_ENTITY,
                index=len(errors) + 1,
                candidate_ref=extra,
                comparison_summary=f"Candidate entity '{extra.label}' has no matching gold entity.",
                candidate_evidence=_candidate_evidence(extra),
                created_at=now,
            )
        )
    for missing in missing_relations:
        errors.append(
            _error_case(
                run_id=run_id,
                project_id=project_id,
                dataset_id=dataset.id,
                sample_id=missing.sample_id,
                error_type=EvaluationErrorType.MISSING_RELATION,
                index=len(errors) + 1,
                gold_relation_id=missing.id,
                comparison_summary=(
                    f"Gold relation '{missing.ontology_relation_id}' was not produced by the "
                    "deterministic candidate set."
                ),
                gold_evidence=missing.evidence,
                created_at=now,
            )
        )
    for extra in extra_relations:
        errors.append(
            _error_case(
                run_id=run_id,
                project_id=project_id,
                dataset_id=dataset.id,
                sample_id=extra.sample_id,
                error_type=EvaluationErrorType.EXTRA_RELATION,
                index=len(errors) + 1,
                candidate_ref=extra,
                comparison_summary=(
                    f"Candidate relation '{extra.ontology_relation_id}' has no matching gold relation."
                ),
                candidate_evidence=_candidate_evidence(extra),
                created_at=now,
            )
        )
    for gold, candidate in wrong_direction_relations:
        errors.append(
            _error_case(
                run_id=run_id,
                project_id=project_id,
                dataset_id=dataset.id,
                sample_id=gold.sample_id,
                error_type=EvaluationErrorType.WRONG_RELATION_DIRECTION,
                index=len(errors) + 1,
                gold_relation_id=gold.id,
                candidate_ref=candidate,
                comparison_summary=(
                    f"Candidate relation '{candidate.ontology_relation_id}' matches the endpoint pair "
                    "but reverses source and target direction."
                ),
                gold_evidence=gold.evidence,
                candidate_evidence=_candidate_evidence(candidate),
                created_at=now,
            )
        )

    metric_summary = {metric.metric_name.value: metric.value for metric in metrics}
    run = EvaluationRun(
        id=run_id,
        project_id=project_id,
        dataset_id=dataset.id,
        status=EvaluationRunStatus.SUCCEEDED,
        run_mode=EvaluationRunMode.DETERMINISTIC_MOCK,
        ontology_version_id=payload.ontology_version_id,
        prompt_version_id=payload.prompt_version_id,
        model_name=payload.model_name,
        model_run_id=model_run_id,
        parser_version=payload.parser_version,
        started_at=now,
        completed_at=now,
        metric_summary=metric_summary,
        dataset_version_id=payload.dataset_version_id,
        requested_by="dev-user",
        metrics={
            "sample_count": sum(1 for sample in _samples.values() if sample.dataset_id == dataset.id),
            "entity_tp": entity_tp,
            "entity_fp": entity_fp,
            "entity_fn": entity_fn,
            "relation_tp": relation_tp,
            "relation_fp": relation_fp,
            "relation_fn": relation_fn,
        },
        dimensions={
            "ontology_version_id": payload.ontology_version_id,
            "prompt_version_id": payload.prompt_version_id,
            "model_run_id": model_run_id,
            "parser_version": payload.parser_version,
        },
    )
    _runs[run.id] = run
    _metrics_by_run[run.id] = metrics
    _errors_by_run[run.id] = errors
    for error in errors:
        _errors[error.id] = error
    return run


def run_or_404(run_id: str) -> EvaluationRun:
    if run_id in _runs:
        return _runs[run_id]
    project_id = _project_id_from_run_id(run_id)
    for run in _legacy_runs(project_id):
        if run.id == run_id:
            return run
    raise ApiException(
        status_code=404,
        code="EVALUATION_RUN_NOT_FOUND",
        message="Evaluation run was not found.",
        details={"run_id": run_id},
    )


def metrics_for_run(run_id: str) -> list[EvaluationMetric]:
    run_or_404(run_id)
    return _metrics_by_run.get(run_id, [])


def errors_for_run(run_id: str) -> list[EvaluationErrorCase]:
    run_or_404(run_id)
    return _errors_by_run.get(run_id, [])


def error_case_or_404(error_case_id: str) -> EvaluationErrorCase:
    error = _errors.get(error_case_id)
    if error is None:
        raise ApiException(
            status_code=404,
            code="EVALUATION_ERROR_CASE_NOT_FOUND",
            message="Evaluation error case was not found.",
            details={"error_case_id": error_case_id},
        )
    return error
