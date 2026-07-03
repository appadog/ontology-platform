"""MVP6.7 Impact Simulation.

Additive, READ-ONLY, deterministic, bounded impact analysis of an existing
MVP6.5/6.6 governance change request. Given a change-request id (any lifecycle
state), a human runs an impact simulation and reads a report covering five
deterministic dimensions:

  1. affected ontology elements = direct target(s) of each change item + bounded
     transitive dependents (max depth 2 = direct + one hop);
  2. dependent candidate entities/relations = exact count + capped ref list +
     truncated flag (layer CANDIDATE);
  3. dependent published elements = exact count + capped ref list + truncated
     (layer PUBLISHED);
  4. affected MVP3 ValidationRuleCode(s) + MVP4 QualityMetricGroup(s) by reference;
  5. severity/summary rollup (per-item ImpactSeverity + report-level max + counts).

This is the RETURN TO READ-ONLY after the single MVP6.6 apply mutation. The
analysis MUTATES NOTHING (not the ontology draft/published, candidates, prompts,
extraction, evaluation, or governance state; it never flips status/
application_state and never SUPERSEDES). Every response carries an all-false
ImpactSimulationMutationGuard — no flag ever true. Idempotent GET.

Like the MVP6.5/6.6 governance store, the impact analysis reads a deterministic,
self-contained dependency universe keyed to the same known element ids (per ADR
0013/0014 a deterministic process-local store is acceptable for the P0 thin
slice). It NEVER writes: the seed adjacency/candidate/published/validation/quality
maps below are read-only module constants.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field

from app.core.enums import (
    QualityMetricGroup,
    Role,
    ValidationResultSeverity,
    ValidationRuleCode,
)
from app.core.errors import ApiException

from .application import OntologyElementRef
from .schemas import (
    ChangeRequestChangeType,
    ChangeRequestTargetKind,
    OntologyChangeItem,
    OntologyChangeRequest,
)
from .service import APPROVER_ROLES, GovernanceApplicationState, OntologyChangeRequestStatus

# ---------------------------------------------------------------------------
# New MVP6.7 enums
# ---------------------------------------------------------------------------


class ImpactSeverity(str, Enum):
    NONE = "NONE"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    BREAKING = "BREAKING"


_SEVERITY_ORDER = {
    ImpactSeverity.NONE: 0,
    ImpactSeverity.LOW: 1,
    ImpactSeverity.MEDIUM: 2,
    ImpactSeverity.HIGH: 3,
    ImpactSeverity.BREAKING: 4,
}


class ImpactSeverityReason(str, Enum):
    DEPRECATE_MODIFY_WITH_PUBLISHED_DEPENDENTS = (
        "DEPRECATE_MODIFY_WITH_PUBLISHED_DEPENDENTS"
    )
    DEPRECATE_MODIFY_WITH_CANDIDATE_DEPENDENTS = (
        "DEPRECATE_MODIFY_WITH_CANDIDATE_DEPENDENTS"
    )
    AFFECTED_FAILED_VALIDATION = "AFFECTED_FAILED_VALIDATION"
    TRANSITIVE_ONTOLOGY_DEPENDENTS = "TRANSITIVE_ONTOLOGY_DEPENDENTS"
    AFFECTED_WARNING_VALIDATION = "AFFECTED_WARNING_VALIDATION"
    AFFECTED_QUALITY_GROUP = "AFFECTED_QUALITY_GROUP"
    DIRECT_ELEMENT_ONLY = "DIRECT_ELEMENT_ONLY"
    ADD_NEW_ELEMENT_NO_DEPENDENTS = "ADD_NEW_ELEMENT_NO_DEPENDENTS"


class DependencyRelation(str, Enum):
    DIRECT_TARGET = "DIRECT_TARGET"
    PROPERTY_OF_CLASS = "PROPERTY_OF_CLASS"
    RELATION_DOMAIN = "RELATION_DOMAIN"
    RELATION_RANGE = "RELATION_RANGE"
    SUBCLASS_OF = "SUBCLASS_OF"
    SUPERCLASS_OF = "SUPERCLASS_OF"
    RELATED_ELEMENT = "RELATED_ELEMENT"


# ---------------------------------------------------------------------------
# Mutation guard — all flags false on EVERY response, no exceptions.
# ---------------------------------------------------------------------------


class ImpactSimulationMutationGuard(BaseModel):
    ontology_draft_mutated: bool = False
    published_graph_mutated: bool = False
    candidate_graph_mutated: bool = False
    prompt_version_mutated: bool = False
    governance_state_mutated: bool = False
    publish_job_started: bool = False
    extraction_job_started: bool = False
    evaluation_run_started: bool = False


# ---------------------------------------------------------------------------
# Refs + dimension DTOs (OntologyElementRef reused by reference / same shape)
# ---------------------------------------------------------------------------


class AffectedOntologyElement(BaseModel):
    element_ref: OntologyElementRef
    relation_to_target: DependencyRelation
    depth: int
    display_name: str | None = None


class DependentRefBucket(BaseModel):
    count: int
    refs: list[OntologyElementRef] = Field(default_factory=list)
    truncated: bool = False


class AffectedValidationRef(BaseModel):
    rule_code: ValidationRuleCode
    severity: ValidationResultSeverity


class ImpactItem(BaseModel):
    change_item_id: str
    target_kind: ChangeRequestTargetKind
    change_type: ChangeRequestChangeType
    target_ref: OntologyElementRef
    affected_ontology_elements: list[AffectedOntologyElement] = Field(
        default_factory=list
    )
    dependent_candidates: DependentRefBucket
    dependent_published: DependentRefBucket
    affected_validations: list[AffectedValidationRef] = Field(default_factory=list)
    affected_quality_groups: list[QualityMetricGroup] = Field(default_factory=list)
    severity: ImpactSeverity
    severity_reason: ImpactSeverityReason


class ImpactSeverityCounts(BaseModel):
    NONE: int = 0
    LOW: int = 0
    MEDIUM: int = 0
    HIGH: int = 0
    BREAKING: int = 0


class ImpactSummary(BaseModel):
    max_severity: ImpactSeverity
    severity_counts: ImpactSeverityCounts
    total_change_items: int
    total_affected_ontology_elements: int
    total_dependent_candidates: int
    total_dependent_published: int
    affected_validation_rule_codes: list[ValidationRuleCode] = Field(
        default_factory=list
    )
    affected_quality_groups: list[QualityMetricGroup] = Field(default_factory=list)


class ImpactSimulationCapabilities(BaseModel):
    can_view: bool = True
    can_apply: bool = False
    actor_role: Role | None = None


class ImpactBounding(BaseModel):
    max_dependent_depth: int = 2
    ref_cap: int = 20
    any_dimension_truncated: bool = False


class ImpactSimulationReport(BaseModel):
    impact_report_id: str | None = None
    change_request_id: str
    project_id: str
    change_request_status: str | None = None
    analyzed_ontology_version_id: str
    analyzed_ontology_version_status: str
    items: list[ImpactItem] = Field(default_factory=list)
    summary: ImpactSummary
    bounding: ImpactBounding
    capabilities: ImpactSimulationCapabilities
    mutation_guard: ImpactSimulationMutationGuard = Field(
        default_factory=ImpactSimulationMutationGuard
    )
    computed_at: datetime | None = None


# ---------------------------------------------------------------------------
# Deterministic, READ-ONLY dependency universe (module constants — never written).
# Keyed to the MVP6.5/6.6 known element-id seed universe.
# ---------------------------------------------------------------------------

DEFAULT_REF_CAP = 20
_MIN_REF_CAP = 1
_MAX_REF_CAP = 200
_MAX_DEPTH = 2

_DEFAULT_ANALYZED_VERSION_ID = "ontology-v7"
_DEFAULT_ANALYZED_VERSION_STATUS = "DRAFT"

# Human display labels (advisory).
_DISPLAY_NAMES: dict[str, str] = {
    "class-clause": "약관",
    "class-company": "회사",
    "class-extra": "부가 클래스",
    "property-claim-deadline": "청구 기한",
    "property-name": "명칭",
    "property-extra": "부가 속성",
    "relation-has-clause": "약관 보유",
    "relation-extra": "부가 관계",
    # Deterministic isolated element: no adjacency, no candidate/published
    # dependents, no validation/quality. A MODIFY/DEPRECATE on it -> LOW.
    "class-isolated": "독립 클래스",
}

# Ontology adjacency by element id (deterministic, id-ordered on read).
#   properties_of_class: CLASS -> properties owned by the class
#   relations_of_class: CLASS -> relations with domain/range == class (+ which end)
#   subclasses / superclasses: CLASS -> CLASS
#   class_of_property: PROPERTY -> owning CLASS
#   ends_of_relation: RELATION -> (domain CLASS, range CLASS)
_PROPERTIES_OF_CLASS: dict[str, list[str]] = {
    "class-clause": ["property-claim-deadline"],
    "class-company": ["property-name"],
    "class-extra": [],
}
# relation id -> (domain class, range class)
_RELATION_ENDS: dict[str, tuple[str, str]] = {
    "relation-has-clause": ("class-company", "class-clause"),
    "relation-extra": ("class-extra", "class-extra"),
}
_SUBCLASSES: dict[str, list[str]] = {
    "class-clause": ["class-extra"],  # class-extra is a subclass of class-clause
}
_SUPERCLASSES: dict[str, list[str]] = {
    "class-extra": ["class-clause"],
}
_CLASS_OF_PROPERTY: dict[str, str] = {
    "property-claim-deadline": "class-clause",
    "property-name": "class-company",
    "property-extra": "class-extra",
}

# Dependent CANDIDATE rows referencing an ontology element (exact counts).
#   candidate entity refs a class; candidate relation refs a relation.
# Value is the exact list of candidate-side OntologyElementRef targets (the
# depended-on ontology element grouped per candidate row). We model each candidate
# as one ref back to the depended-on element id, sized to exercise the cap.
_CANDIDATE_DEPENDENT_COUNT: dict[str, int] = {
    "class-clause": 128,
    "class-company": 3,
    "class-extra": 0,
    "relation-has-clause": 12,
    "relation-extra": 0,
}
# Dependent PUBLISHED elements referencing an ontology element (exact counts).
_PUBLISHED_DEPENDENT_COUNT: dict[str, int] = {
    "class-clause": 4,
    "class-company": 0,
    "class-extra": 0,
    "relation-has-clause": 0,
    "relation-extra": 0,
}

# Affected MVP3 validations by element id (rule_code -> max severity).
_AFFECTED_VALIDATIONS: dict[str, list[tuple[ValidationRuleCode, ValidationResultSeverity]]] = {
    "class-clause": [
        (ValidationRuleCode.RELATION_DOMAIN_RANGE, ValidationResultSeverity.FAILED),
        (ValidationRuleCode.REQUIRED_PROPERTY, ValidationResultSeverity.WARNING),
    ],
    "class-company": [
        (ValidationRuleCode.REQUIRED_PROPERTY, ValidationResultSeverity.WARNING),
    ],
    "relation-has-clause": [
        (ValidationRuleCode.RELATION_DIRECTION, ValidationResultSeverity.INFO),
    ],
}

# Affected MVP4 quality groups by element id.
_AFFECTED_QUALITY_GROUPS: dict[str, list[QualityMetricGroup]] = {
    "class-clause": [QualityMetricGroup.CONSISTENCY, QualityMetricGroup.TRACEABILITY],
    "class-company": [QualityMetricGroup.COMPLETENESS],
    "relation-has-clause": [QualityMetricGroup.RELATION_DENSITY],
}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------


def _forbidden(code: str, message: str) -> ApiException:
    return ApiException(status_code=403, code=code, message=message)


def _not_found(code: str, message: str) -> ApiException:
    return ApiException(status_code=404, code=code, message=message)


# ---------------------------------------------------------------------------
# Element-id + ref helpers
# ---------------------------------------------------------------------------


def _item_element_id(item: OntologyChangeItem) -> str | None:
    return (
        item.ontology_class_id
        or item.ontology_property_id
        or item.ontology_relation_id
    )


def _ref_for(
    kind: ChangeRequestTargetKind,
    element_id: str,
    version_id: str,
    status: str | None = "ACTIVE",
) -> OntologyElementRef:
    return OntologyElementRef(
        target_kind=kind,
        ontology_class_id=element_id if kind == ChangeRequestTargetKind.CLASS else None,
        ontology_property_id=(
            element_id if kind == ChangeRequestTargetKind.PROPERTY else None
        ),
        ontology_relation_id=(
            element_id if kind == ChangeRequestTargetKind.RELATION else None
        ),
        ontology_version_id=version_id,
        status=status,
    )


# ---------------------------------------------------------------------------
# Dimension 1 — bounded transitive dependency walk (depth <= 2, id-ordered).
# ---------------------------------------------------------------------------


def _direct_dependents(
    kind: ChangeRequestTargetKind, element_id: str
) -> list[tuple[ChangeRequestTargetKind, str, DependencyRelation]]:
    """One-hop ontology dependents of an element, deterministically id-ordered."""
    out: list[tuple[ChangeRequestTargetKind, str, DependencyRelation]] = []
    if kind == ChangeRequestTargetKind.CLASS:
        for pid in sorted(_PROPERTIES_OF_CLASS.get(element_id, [])):
            out.append(
                (ChangeRequestTargetKind.PROPERTY, pid, DependencyRelation.PROPERTY_OF_CLASS)
            )
        for rid in sorted(_RELATION_ENDS):
            domain, rng = _RELATION_ENDS[rid]
            if domain == element_id:
                out.append(
                    (ChangeRequestTargetKind.RELATION, rid, DependencyRelation.RELATION_DOMAIN)
                )
            if rng == element_id:
                out.append(
                    (ChangeRequestTargetKind.RELATION, rid, DependencyRelation.RELATION_RANGE)
                )
        for cid in sorted(_SUBCLASSES.get(element_id, [])):
            out.append((ChangeRequestTargetKind.CLASS, cid, DependencyRelation.SUBCLASS_OF))
        for cid in sorted(_SUPERCLASSES.get(element_id, [])):
            out.append((ChangeRequestTargetKind.CLASS, cid, DependencyRelation.SUPERCLASS_OF))
    elif kind == ChangeRequestTargetKind.PROPERTY:
        owner = _CLASS_OF_PROPERTY.get(element_id)
        if owner:
            out.append(
                (ChangeRequestTargetKind.CLASS, owner, DependencyRelation.PROPERTY_OF_CLASS)
            )
    elif kind == ChangeRequestTargetKind.RELATION:
        ends = _RELATION_ENDS.get(element_id)
        if ends:
            domain, rng = ends
            out.append(
                (ChangeRequestTargetKind.CLASS, domain, DependencyRelation.RELATION_DOMAIN)
            )
            out.append(
                (ChangeRequestTargetKind.CLASS, rng, DependencyRelation.RELATION_RANGE)
            )
    return out


def _walk_affected(
    kind: ChangeRequestTargetKind, element_id: str | None, version_id: str
) -> list[AffectedOntologyElement]:
    """Direct target (depth 0) + bounded transitive dependents (depth 1-2)."""
    affected: list[AffectedOntologyElement] = []
    if element_id is None:
        return affected
    seen: set[tuple[ChangeRequestTargetKind, str]] = {(kind, element_id)}
    affected.append(
        AffectedOntologyElement(
            element_ref=_ref_for(kind, element_id, version_id),
            relation_to_target=DependencyRelation.DIRECT_TARGET,
            depth=0,
            display_name=_DISPLAY_NAMES.get(element_id),
        )
    )
    frontier = [(kind, element_id)]
    for depth in (1, 2):
        next_frontier: list[tuple[ChangeRequestTargetKind, str]] = []
        for f_kind, f_id in frontier:
            for dep_kind, dep_id, relation in _direct_dependents(f_kind, f_id):
                key = (dep_kind, dep_id)
                if key in seen:
                    continue
                seen.add(key)
                affected.append(
                    AffectedOntologyElement(
                        element_ref=_ref_for(dep_kind, dep_id, version_id),
                        relation_to_target=(
                            relation
                            if depth == 1
                            else DependencyRelation.RELATED_ELEMENT
                        ),
                        depth=depth,
                        display_name=_DISPLAY_NAMES.get(dep_id),
                    )
                )
                next_frontier.append(key)
        if depth >= _MAX_DEPTH:
            break
        frontier = next_frontier
    return affected


# ---------------------------------------------------------------------------
# Dimensions 2/3 — dependent candidate / published buckets (exact count + cap).
# ---------------------------------------------------------------------------


def _dependent_bucket(
    count_map: dict[str, int],
    layer_kind: ChangeRequestTargetKind,
    element_id: str | None,
    version_id: str,
    ref_cap: int,
) -> DependentRefBucket:
    count = count_map.get(element_id, 0) if element_id is not None else 0
    refs: list[OntologyElementRef] = []
    # Deterministic capped refs: one ref back to the depended-on element per row.
    for _ in range(min(count, ref_cap)):
        refs.append(_ref_for(layer_kind, element_id, version_id))
    return DependentRefBucket(
        count=count, refs=refs, truncated=count > len(refs)
    )


# ---------------------------------------------------------------------------
# Dimension 4 — affected validations + quality groups (by reference).
# ---------------------------------------------------------------------------


def _affected_validations(element_id: str | None) -> list[AffectedValidationRef]:
    if element_id is None:
        return []
    return [
        AffectedValidationRef(rule_code=code, severity=severity)
        for code, severity in _AFFECTED_VALIDATIONS.get(element_id, [])
    ]


def _affected_quality(element_id: str | None) -> list[QualityMetricGroup]:
    if element_id is None:
        return []
    return list(_AFFECTED_QUALITY_GROUPS.get(element_id, []))


# ---------------------------------------------------------------------------
# Severity (G3) — highest matching rule wins; stop at first match.
# ---------------------------------------------------------------------------


def _compute_severity(
    change_type: ChangeRequestChangeType,
    dependent_candidates: DependentRefBucket,
    dependent_published: DependentRefBucket,
    affected_validations: list[AffectedValidationRef],
    affected_quality: list[QualityMetricGroup],
    transitive_count: int,
) -> tuple[ImpactSeverity, ImpactSeverityReason]:
    has_published = dependent_published.count > 0
    has_candidate = dependent_candidates.count > 0
    has_failed = any(
        v.severity == ValidationResultSeverity.FAILED for v in affected_validations
    )
    has_warning = any(
        v.severity == ValidationResultSeverity.WARNING for v in affected_validations
    )
    has_quality = len(affected_quality) > 0
    is_deprecate_modify = change_type in (
        ChangeRequestChangeType.DEPRECATE,
        ChangeRequestChangeType.MODIFY,
    )

    # (1) BREAKING — DEPRECATE/MODIFY with published dependents.
    if is_deprecate_modify and has_published:
        return (
            ImpactSeverity.BREAKING,
            ImpactSeverityReason.DEPRECATE_MODIFY_WITH_PUBLISHED_DEPENDENTS,
        )
    # (2) HIGH — DEPRECATE/MODIFY with candidate dependents (no published),
    #     OR any affected FAILED validation.
    if is_deprecate_modify and has_candidate:
        return (
            ImpactSeverity.HIGH,
            ImpactSeverityReason.DEPRECATE_MODIFY_WITH_CANDIDATE_DEPENDENTS,
        )
    if has_failed:
        return (ImpactSeverity.HIGH, ImpactSeverityReason.AFFECTED_FAILED_VALIDATION)
    # (3) MEDIUM — transitive ontology dependents, OR WARNING validation,
    #     OR affected quality group. (ADD referencing an element with dependents
    #     surfaces those as transitive dependents -> MEDIUM.)
    if transitive_count > 0:
        return (
            ImpactSeverity.MEDIUM,
            ImpactSeverityReason.TRANSITIVE_ONTOLOGY_DEPENDENTS,
        )
    if has_warning:
        return (
            ImpactSeverity.MEDIUM,
            ImpactSeverityReason.AFFECTED_WARNING_VALIDATION,
        )
    if has_quality:
        return (ImpactSeverity.MEDIUM, ImpactSeverityReason.AFFECTED_QUALITY_GROUP)
    # (4) LOW — direct-only, no dependents (MODIFY/DEPRECATE).
    if is_deprecate_modify:
        return (ImpactSeverity.LOW, ImpactSeverityReason.DIRECT_ELEMENT_ONLY)
    # (5) NONE — ADD with no dependents.
    return (ImpactSeverity.NONE, ImpactSeverityReason.ADD_NEW_ELEMENT_NO_DEPENDENTS)


# ---------------------------------------------------------------------------
# Per-item analysis + report assembly
# ---------------------------------------------------------------------------


def _analyze_item(
    item: OntologyChangeItem, version_id: str, ref_cap: int
) -> ImpactItem:
    element_id = _item_element_id(item)
    kind = item.target_kind
    change_type = item.change_type

    affected = _walk_affected(kind, element_id, version_id)
    transitive_count = sum(1 for a in affected if a.depth > 0)

    dependent_candidates = _dependent_bucket(
        _CANDIDATE_DEPENDENT_COUNT, kind, element_id, version_id, ref_cap
    )
    dependent_published = _dependent_bucket(
        _PUBLISHED_DEPENDENT_COUNT, kind, element_id, version_id, ref_cap
    )
    affected_validations = _affected_validations(element_id)
    affected_quality = _affected_quality(element_id)

    severity, severity_reason = _compute_severity(
        change_type,
        dependent_candidates,
        dependent_published,
        affected_validations,
        affected_quality,
        transitive_count,
    )

    target_ref = (
        _ref_for(kind, element_id, version_id)
        if element_id is not None
        else OntologyElementRef(target_kind=kind, ontology_version_id=version_id)
    )

    return ImpactItem(
        change_item_id=item.id,
        target_kind=kind,
        change_type=change_type,
        target_ref=target_ref,
        affected_ontology_elements=affected,
        dependent_candidates=dependent_candidates,
        dependent_published=dependent_published,
        affected_validations=affected_validations,
        affected_quality_groups=affected_quality,
        severity=severity,
        severity_reason=severity_reason,
    )


def _rollup(items: list[ImpactItem]) -> ImpactSummary:
    counts = ImpactSeverityCounts()
    max_sev = ImpactSeverity.NONE
    total_affected = 0
    total_candidates = 0
    total_published = 0
    rule_codes: list[ValidationRuleCode] = []
    quality_groups: list[QualityMetricGroup] = []
    seen_rules: set[ValidationRuleCode] = set()
    seen_quality: set[QualityMetricGroup] = set()

    for item in items:
        setattr(counts, item.severity.value, getattr(counts, item.severity.value) + 1)
        if _SEVERITY_ORDER[item.severity] > _SEVERITY_ORDER[max_sev]:
            max_sev = item.severity
        total_affected += len(item.affected_ontology_elements)
        total_candidates += item.dependent_candidates.count
        total_published += item.dependent_published.count
        for v in item.affected_validations:
            if v.rule_code not in seen_rules:
                seen_rules.add(v.rule_code)
                rule_codes.append(v.rule_code)
        for g in item.affected_quality_groups:
            if g not in seen_quality:
                seen_quality.add(g)
                quality_groups.append(g)

    return ImpactSummary(
        max_severity=max_sev,
        severity_counts=counts,
        total_change_items=len(items),
        total_affected_ontology_elements=total_affected,
        total_dependent_candidates=total_candidates,
        total_dependent_published=total_published,
        affected_validation_rule_codes=rule_codes,
        affected_quality_groups=quality_groups,
    )


def _clamp_ref_cap(ref_cap: int | None) -> int:
    if ref_cap is None:
        return DEFAULT_REF_CAP
    return max(_MIN_REF_CAP, min(ref_cap, _MAX_REF_CAP))


def _capabilities(
    request: OntologyChangeRequest, actor_role: Role
) -> ImpactSimulationCapabilities:
    # can_apply is an advisory echo of the SEPARATE MVP6.6 apply capability.
    can_apply = (
        actor_role in APPROVER_ROLES
        and request.status == OntologyChangeRequestStatus.APPROVED
        and request.application_state == GovernanceApplicationState.QUEUED
    )
    return ImpactSimulationCapabilities(
        can_view=True, can_apply=can_apply, actor_role=actor_role
    )


# ---------------------------------------------------------------------------
# Public entry — READ-ONLY. Mutates nothing.
# ---------------------------------------------------------------------------


def get_impact_simulation(
    change_request_id: str,
    target_ontology_version_id: str | None,
    ref_cap: int | None,
    actor_id: str,
    actor_role: Role,
) -> ImpactSimulationReport:
    from . import service as _service

    request = _service._get_request_or_404(change_request_id)

    version_id = (
        target_ontology_version_id
        or request.ontology_version_id
        or _DEFAULT_ANALYZED_VERSION_ID
    )
    effective_cap = _clamp_ref_cap(ref_cap)

    items = _service._items.get(request.id, [])
    impact_items = [_analyze_item(item, version_id, effective_cap) for item in items]

    summary = _rollup(impact_items)
    any_truncated = any(
        it.dependent_candidates.truncated or it.dependent_published.truncated
        for it in impact_items
    )

    return ImpactSimulationReport(
        impact_report_id=None,
        change_request_id=request.id,
        project_id=request.project_id,
        change_request_status=request.status.value,
        analyzed_ontology_version_id=version_id,
        analyzed_ontology_version_status=_DEFAULT_ANALYZED_VERSION_STATUS,
        items=impact_items,
        summary=summary,
        bounding=ImpactBounding(
            max_dependent_depth=_MAX_DEPTH,
            ref_cap=effective_cap,
            any_dimension_truncated=any_truncated,
        ),
        capabilities=_capabilities(request, actor_role),
        mutation_guard=ImpactSimulationMutationGuard(),
        computed_at=utc_now(),
    )
