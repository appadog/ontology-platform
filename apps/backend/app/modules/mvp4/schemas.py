from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator

from app.core.enums import (
    CandidateKind,
    EvaluationDatasetStatus,
    ExternalApiAuthMode,
    GoldenSetItemKind,
    GraphExploreState,
    PromptExperimentStatus,
    QualityMetricGroup,
    QualityMetricUnit,
    RagAnswerState,
    RagCitationKind,
    ReviewDecisionType,
    SearchResultKind,
    VectorAdapterStatus,
    VectorFallbackReason,
)
from app.modules.publish.schemas import PublishedEntity, PublishedGraphSnapshot, PublishedRelation
from app.modules.source.schemas import SourceData


class PublishedGraphVersionRef(BaseModel):
    published_graph_version_id: str
    published_graph_version: int
    ontology_version_id: str
    is_current: bool
    created_at: datetime


class SourceRef(BaseModel):
    source_id: str
    source_segment_id: str | None = None
    locator: str | None = None
    label: str | None = None


class EvidenceRef(BaseModel):
    evidence_id: str
    source_id: str | None = None
    source_segment_id: str | None = None
    label: str | None = None


class CandidateRef(BaseModel):
    candidate_kind: CandidateKind
    candidate_id: str


class ReviewDecisionRef(BaseModel):
    review_decision_id: str | None = None
    review_decision_type: ReviewDecisionType | None = None
    reviewer_id: str | None = None
    reviewed_at: datetime | None = None


class QualityDrilldownHint(BaseModel):
    target: str
    label: str | None = None
    query: dict[str, Any] = Field(default_factory=dict)


class QualityFormulaMetadata(BaseModel):
    formula_id: str
    numerator: str
    denominator: str
    scope: str
    time_window: str
    breakdown_dimension: str
    drilldown_target: str
    description: str | None = None
    unit: QualityMetricUnit | None = None
    notes: str | None = None


class QualityMetricBreakdown(BaseModel):
    dimension: str
    key: str | None = None
    label: str
    value: float
    rate: float | None = None
    drilldown: QualityDrilldownHint | None = None


class QualityMetric(BaseModel):
    metric_id: str
    group: QualityMetricGroup
    label: str
    description: str | None = None
    unit: QualityMetricUnit
    value: float | None = None
    rate: float | None = None
    trend: float | None = None
    formula: QualityFormulaMetadata
    drilldown: QualityDrilldownHint | None = None
    evidence_refs: list[EvidenceRef] = Field(default_factory=list)
    published_graph_version_ref: PublishedGraphVersionRef | None = None
    breakdowns: list[QualityMetricBreakdown] = Field(default_factory=list)


class QualityMetricGroupResult(BaseModel):
    group: QualityMetricGroup
    label: str
    description: str | None = None
    metrics: list[QualityMetric]


class QualityMetricsResponse(BaseModel):
    project_id: str
    published_graph_version_ref: PublishedGraphVersionRef | None = None
    generated_at: datetime
    filters: dict[str, Any] = Field(default_factory=dict)
    metric_groups: list[QualityMetricGroupResult]


class EvaluationDataset(BaseModel):
    id: str
    project_id: str
    name: str
    description: str | None = None
    status: EvaluationDatasetStatus
    owner_id: str | None = None
    active_version_id: str | None = None
    created_at: datetime
    updated_at: datetime
    notes: str | None = None


class EvaluationDatasetCreateRequest(BaseModel):
    name: str
    description: str | None = None
    notes: str | None = None


class EvaluationDatasetVersion(BaseModel):
    id: str
    dataset_id: str
    project_id: str
    version: int
    status: EvaluationDatasetStatus
    source_refs: list[SourceRef] = Field(default_factory=list)
    source_segment_refs: list[SourceRef] = Field(default_factory=list)
    candidate_refs: list[CandidateRef] = Field(default_factory=list)
    evidence_refs: list[EvidenceRef] = Field(default_factory=list)
    golden_item_count: int
    created_by: str | None = None
    created_at: datetime
    notes: str | None = None


class EvaluationDatasetVersionCreateRequest(BaseModel):
    notes: str | None = None


class GoldenSetItem(BaseModel):
    id: str
    dataset_version_id: str
    project_id: str
    kind: GoldenSetItemKind
    expected_payload: dict[str, Any]
    source_refs: list[SourceRef] = Field(default_factory=list)
    evidence_refs: list[EvidenceRef] = Field(default_factory=list)
    review_decision_ref: ReviewDecisionRef | None = None
    published_graph_version_ref: PublishedGraphVersionRef | None = None
    reviewer_id: str | None = None
    created_at: datetime
    notes: str | None = None


class GoldenSetItemCreateRequest(BaseModel):
    kind: GoldenSetItemKind
    expected_payload: dict[str, Any]
    notes: str | None = None


class RunWindow(BaseModel):
    started_at: datetime | None = None
    ended_at: datetime | None = None


class PromptExperiment(BaseModel):
    id: str
    project_id: str
    name: str
    hypothesis: str | None = None
    status: PromptExperimentStatus
    dataset_id: str
    dataset_version_id: str
    control_prompt_version_id: str
    treatment_prompt_version_id: str
    model_provider: str | None = None
    model_name: str | None = None
    run_window: RunWindow | None = None
    created_by: str | None = None
    created_at: datetime
    updated_at: datetime
    notes: str | None = None


class PromptExperimentCreateRequest(BaseModel):
    name: str
    dataset_id: str | None = None
    dataset_version_id: str | None = None
    hypothesis: str | None = None
    notes: str | None = None


class EvaluationDimensions(BaseModel):
    prompt_version_id: str | None = None
    model_run_id: str | None = None
    source_type: str | None = None
    class_type: str | None = None
    relation_type: str | None = None
    validation_outcome: str | None = None
    review_decision: str | None = None
    correction_pattern: str | None = None


class EvaluationRunMetrics(BaseModel):
    sample_count: int = 0
    approval_rate: float = 0.0
    rejection_rate: float = 0.0
    modification_rate: float = 0.0
    failed_validation_rate: float = 0.0
    missing_evidence_rate: float = 0.0


class EvaluationRun(BaseModel):
    id: str
    project_id: str
    dataset_version_id: str
    experiment_id: str | None = None
    prompt_version_id: str | None = None
    model_run_id: str | None = None
    model_provider: str | None = None
    model_name: str | None = None
    status: Literal["PENDING", "RUNNING", "SUCCESS", "FAILED"]
    started_at: datetime | None = None
    ended_at: datetime | None = None
    requested_by: str | None = None
    metrics: EvaluationRunMetrics
    dimensions: EvaluationDimensions
    error_code: str | None = None
    error_message: str | None = None


class EvaluationRunCreateRequest(BaseModel):
    dataset_version_id: str | None = None
    experiment_id: str | None = None
    notes: str | None = None


class PromptPerformanceRow(BaseModel):
    dimensions: EvaluationDimensions
    approval_rate: float
    rejection_rate: float
    modification_rate: float
    failed_validation_rate: float
    missing_evidence_rate: float
    sample_count: int = 0
    latency_ms: int | None = None
    token_count: int | None = None
    cost: float | None = None
    drilldown: QualityDrilldownHint | None = None


class PromptPerformanceSummary(BaseModel):
    project_id: str
    generated_at: datetime
    filters: dict[str, Any] = Field(default_factory=dict)
    comparison_dimensions: list[str]
    rows: list[PromptPerformanceRow]


class SearchResultItem(BaseModel):
    id: str
    kind: SearchResultKind
    title: str
    snippet: str | None = None
    score: float
    published_graph_version_ref: PublishedGraphVersionRef | None = None
    source_ref: SourceRef | None = None
    evidence_refs: list[EvidenceRef] = Field(default_factory=list)
    lineage_ref: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class SearchResultGroup(BaseModel):
    kind: SearchResultKind
    total_count: int
    items: list[SearchResultItem]


class SearchResponse(BaseModel):
    project_id: str
    query: str
    published_graph_version_ref: PublishedGraphVersionRef | None = None
    groups: list[SearchResultGroup]
    total_count: int
    limit: int
    offset: int
    index_state: Literal["READY", "PARTIAL", "STALE"]


class VectorAdapterState(BaseModel):
    project_id: str
    status: VectorAdapterStatus
    embedding_target: str
    index_name: str | None = None
    indexed_chunk_count: int | None = None
    last_indexed_at: datetime | None = None
    fallback_reason: VectorFallbackReason | None = None
    message: str | None = None


class SimilarEvidenceRequest(BaseModel):
    query: str | None = None
    source_segment_id: str | None = None
    evidence_id: str | None = None
    published_fact_id: str | None = None
    published_fact_type: SearchResultKind | None = None
    published_graph_version_id: str | None = None
    limit: int = Field(default=10, ge=1, le=50)

    @model_validator(mode="after")
    def require_lookup_hint(self) -> "SimilarEvidenceRequest":
        if not any([self.query, self.source_segment_id, self.evidence_id, self.published_fact_id]):
            raise ValueError("At least one similar-evidence lookup hint is required.")
        return self


class SimilarEvidenceItem(BaseModel):
    evidence_ref: EvidenceRef
    source_ref: SourceRef | None = None
    snippet: str
    similarity_score: float
    match_reason: str
    published_graph_version_ref: PublishedGraphVersionRef | None = None
    linked_published_fact_refs: list["PublishedFactRef"] = Field(default_factory=list)


class SimilarEvidenceResponse(BaseModel):
    project_id: str
    adapter_state: VectorAdapterState
    fallback_used: bool
    items: list[SimilarEvidenceItem]


class RagAnswerRequest(BaseModel):
    question: str = Field(min_length=1)
    published_graph_version_id: str | None = None
    scope: list[SearchResultKind] = Field(default_factory=list)
    source_ids: list[str] = Field(default_factory=list)
    max_citations: int = Field(default=5, ge=1, le=20)


class PublishedFactRef(BaseModel):
    fact_type: SearchResultKind
    fact_id: str
    published_graph_version_id: str
    label: str


class RagCitation(BaseModel):
    citation_id: str
    kind: RagCitationKind
    evidence_ref: EvidenceRef | None = None
    source_ref: SourceRef | None = None
    published_fact_ref: PublishedFactRef | None = None
    quote: str | None = None
    snippet: str | None = None
    locator: str | None = None


class InsufficientEvidenceState(BaseModel):
    reason_code: str
    message: str
    missing_scopes: list[str] = Field(default_factory=list)
    suggested_queries: list[str] = Field(default_factory=list)


class RagAnswerResponse(BaseModel):
    project_id: str
    question: str
    state: RagAnswerState
    answer: str | None = None
    coverage: float | None = None
    published_graph_version_ref: PublishedGraphVersionRef | None = None
    citations: list[RagCitation]
    linked_published_facts: list[PublishedFactRef]
    insufficient_evidence: InsufficientEvidenceState | None = None
    debug: dict[str, Any] = Field(default_factory=dict)


class GraphExploreNode(BaseModel):
    id: str
    published_entity_id: str
    class_id: str
    label: str
    hop: int
    properties: dict[str, Any] = Field(default_factory=dict)
    quality_summary: dict[str, Any] = Field(default_factory=dict)
    source_count: int = 0
    evidence_count: int = 0
    lineage_available: bool = False


class GraphExploreEdge(BaseModel):
    id: str
    published_relation_id: str
    source_node_id: str
    target_node_id: str
    relation_id: str
    label: str
    properties: dict[str, Any] = Field(default_factory=dict)
    quality_summary: dict[str, Any] = Field(default_factory=dict)
    evidence_count: int = 0
    lineage_available: bool = False


class GraphTooLargeState(BaseModel):
    estimated_nodes: int
    estimated_edges: int
    node_budget: int = 150
    edge_budget: int = 300
    suggested_filters: list[str] = Field(default_factory=list)
    message: str


class GraphQualityOverlay(BaseModel):
    target_id: str
    score: float | None = None
    flags: list[str] = Field(default_factory=list)


class GraphSourceOverlay(BaseModel):
    target_id: str
    source_refs: list[SourceRef] = Field(default_factory=list)
    evidence_refs: list[EvidenceRef] = Field(default_factory=list)


class PublishedLineagePanel(BaseModel):
    fact_ref: PublishedFactRef
    published_graph_version_ref: PublishedGraphVersionRef
    publish_job_id: str | None = None
    review_decision_ref: ReviewDecisionRef | None = None
    candidate_ref: CandidateRef | None = None
    evidence_refs: list[EvidenceRef]
    source_refs: list[SourceRef]
    ontology_version_id: str | None = None
    model_run_id: str | None = None
    prompt_version_id: str | None = None
    created_at: datetime | None = None


class GraphExploreResponse(BaseModel):
    project_id: str
    state: GraphExploreState
    published_graph_version_ref: PublishedGraphVersionRef
    root_entity_id: str
    max_hops: int = Field(default=2, le=3)
    nodes: list[GraphExploreNode]
    edges: list[GraphExploreEdge]
    quality_overlays: list[GraphQualityOverlay] = Field(default_factory=list)
    source_overlays: list[GraphSourceOverlay] = Field(default_factory=list)
    lineage_panel: PublishedLineagePanel | None = None
    too_large: GraphTooLargeState | None = None


class EvidenceRead(BaseModel):
    id: str
    project_id: str
    source_id: str | None = None
    source_segment_id: str | None = None
    evidence_text: str | None = None
    locator: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime | None = None


class ExternalApiEnvelopeBase(BaseModel):
    auth_mode: ExternalApiAuthMode
    project_id: str
    published_graph_version_ref: PublishedGraphVersionRef | None = None


class ExternalPublishedGraphEnvelope(ExternalApiEnvelopeBase):
    data: PublishedGraphSnapshot


class ExternalPublishedEntityEnvelope(ExternalApiEnvelopeBase):
    data: PublishedEntity


class ExternalPublishedRelationEnvelope(ExternalApiEnvelopeBase):
    data: PublishedRelation


class ExternalSourceEnvelope(ExternalApiEnvelopeBase):
    data: SourceData


class ExternalEvidenceEnvelope(ExternalApiEnvelopeBase):
    data: EvidenceRead


class ExternalSearchEnvelope(ExternalApiEnvelopeBase):
    data: SearchResponse


class ExternalRagAnswerEnvelope(ExternalApiEnvelopeBase):
    data: RagAnswerResponse
