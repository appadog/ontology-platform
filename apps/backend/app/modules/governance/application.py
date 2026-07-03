"""MVP6.6 Governance Change Application.

Additive, human-initiated application of an APPROVED + application_state=QUEUED
ontology change request onto a DRAFT ontology version (QUEUED -> APPLIED), via the
sanctioned MVP1 ontology-edit semantics (ADD=create, MODIFY=update,
DEPRECATE=archive) on a DRAFT version ONLY.

Application != publish: apply never touches the published graph, never starts a
publish/extraction/evaluation job, never rolls back, never hard-deletes. The
successful apply response carries GovernanceApplicationMutationGuard with exactly
one true flag (ontology_draft_mutated); every read / blocked apply keeps the
all-false MVP6.5 GovernanceMutationGuard.

The MVP6.5 governance module has no real ontology DB write path (it validates refs
against fixed known-id sets and keeps a process-local store). Per ADR 0013 a
deterministic process-local store is acceptable for the P0 thin slice, so this
module keeps a self-contained DRAFT ontology-version element store that apply
mutates and staleness re-checks read.
"""

from __future__ import annotations

import base64
import hashlib
import itertools
import json
from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

from app.core.enums import OntologyElementStatus, OntologyVersionStatus, Role
from app.core.errors import ApiException

from .schemas import (
    ChangeRequestChangeType,
    ChangeRequestTargetKind,
    GovernanceMutationGuard,
    OntologyChangeItem,
    OntologyChangeRequest,
    OntologyChangeRequestStatus,
)
from .service import APPROVER_ROLES, GovernanceApplicationState

# ---------------------------------------------------------------------------
# New MVP6.6 enums
# ---------------------------------------------------------------------------


class GovernanceApplicationAuditAction(str, Enum):
    CHANGE_REQUEST_APPLIED = "CHANGE_REQUEST_APPLIED"
    CHANGE_REQUEST_SUPERSEDED = "CHANGE_REQUEST_SUPERSEDED"


# ---------------------------------------------------------------------------
# Guard + capability
# ---------------------------------------------------------------------------


class GovernanceApplicationMutationGuard(BaseModel):
    """Successful-apply guard only. Exactly one legitimately-true flag."""

    ontology_draft_mutated: bool = True
    published_graph_mutated: bool = False
    candidate_graph_mutated: bool = False
    prompt_version_mutated: bool = False
    publish_job_started: bool = False
    extraction_job_started: bool = False
    evaluation_run_started: bool = False


class ApplicationCapabilities(BaseModel):
    can_view: bool = True
    can_apply: bool = False


# ---------------------------------------------------------------------------
# Element / preview refs
# ---------------------------------------------------------------------------


class OntologyElementRef(BaseModel):
    target_kind: ChangeRequestTargetKind
    ontology_class_id: str | None = None
    ontology_property_id: str | None = None
    ontology_relation_id: str | None = None
    ontology_version_id: str
    status: OntologyElementStatus | None = None


class ApplicationItemPreview(BaseModel):
    change_item_id: str
    target_kind: ChangeRequestTargetKind
    change_type: ChangeRequestChangeType
    before_ref: OntologyElementRef | None = None
    after_ref: OntologyElementRef | None = None
    stale: bool = False
    stale_reason: str | None = None


class ApplicationBeforeAfterRef(BaseModel):
    change_item_id: str
    change_type: ChangeRequestChangeType
    before: OntologyElementRef | None = None
    after: OntologyElementRef | None = None


# ---------------------------------------------------------------------------
# Audit + responses
# ---------------------------------------------------------------------------


class GovernanceApplicationAuditEntry(BaseModel):
    id: str
    project_id: str
    change_request_id: str
    action: GovernanceApplicationAuditAction
    actor_id: str
    actor_role: Role | None = None
    target_ontology_version_id: str | None = None
    applied_item_ids: list[str] = Field(default_factory=list)
    before_after_refs: list[ApplicationBeforeAfterRef] = Field(default_factory=list)
    before_application_state: GovernanceApplicationState | None = None
    after_application_state: GovernanceApplicationState | None = None
    note: str | None = None
    stale_detail: dict[str, Any] | None = None
    created_at: datetime


class GovernanceApplicationStatusResponse(BaseModel):
    change_request_id: str
    project_id: str
    status: str
    application_state: GovernanceApplicationState
    target_ontology_version_id: str | None = None
    target_version_status: OntologyVersionStatus | None = None
    target_is_draft: bool = False
    applicable: bool = False
    would_supersede: bool = False
    item_previews: list[ApplicationItemPreview] = Field(default_factory=list)
    capabilities: ApplicationCapabilities = Field(default_factory=ApplicationCapabilities)
    mutation_guard: GovernanceMutationGuard = Field(default_factory=GovernanceMutationGuard)


class GovernanceApplyRequest(BaseModel):
    target_ontology_version_id: str | None = None
    note: str | None = None


class GovernanceApplyResponse(BaseModel):
    change_request_id: str
    project_id: str
    application_state: GovernanceApplicationState
    target_ontology_version_id: str
    applied_item_ids: list[str] = Field(default_factory=list)
    before_after_refs: list[ApplicationBeforeAfterRef] = Field(default_factory=list)
    audit_entry: GovernanceApplicationAuditEntry
    mutation_guard: GovernanceApplicationMutationGuard = Field(
        default_factory=GovernanceApplicationMutationGuard
    )
    capabilities: ApplicationCapabilities = Field(default_factory=ApplicationCapabilities)


class GovernanceApplicationAuditListResponse(BaseModel):
    items: list[GovernanceApplicationAuditEntry] = Field(default_factory=list)
    total_count: int = 0
    next_cursor: str | None = None


# ---------------------------------------------------------------------------
# Process-local DRAFT ontology-version store + snapshots + application audit
# ---------------------------------------------------------------------------


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class _DraftElement:
    __slots__ = ("target_kind", "element_id", "status", "payload")

    def __init__(
        self,
        target_kind: ChangeRequestTargetKind,
        element_id: str,
        status: OntologyElementStatus,
        payload: dict[str, Any] | None,
    ) -> None:
        self.target_kind = target_kind
        self.element_id = element_id
        self.status = status
        self.payload = payload


class _OntologyVersion:
    __slots__ = ("version_id", "project_id", "status", "elements")

    def __init__(
        self, version_id: str, project_id: str, status: OntologyVersionStatus
    ) -> None:
        self.version_id = version_id
        self.project_id = project_id
        self.status = status
        # keyed by (target_kind, element_id)
        self.elements: dict[tuple[ChangeRequestTargetKind, str], _DraftElement] = {}


# version_id -> _OntologyVersion
_versions: dict[str, _OntologyVersion] = {}
# change_request_id -> {change_item_id -> snapshot fingerprint dict}
_snapshots: dict[str, dict[str, dict[str, Any]]] = {}
_app_audit: list[GovernanceApplicationAuditEntry] = []
_app_audit_counter = itertools.count(1)
_seeded = False


def _next_app_audit_id() -> str:
    return f"gappaudit-{next(_app_audit_counter):05d}"


def reset_application_store() -> None:
    global _app_audit_counter, _seeded
    _versions.clear()
    _snapshots.clear()
    _app_audit.clear()
    _app_audit_counter = itertools.count(1)
    _seeded = False


# Mirror the MVP6.5 seed universe so MODIFY/DEPRECATE refs resolve on the draft.
_SEED_PROJECT_ID = "project-corp-knowledge"
_DRAFT_VERSION_ID = "ontology-v7"
_PUBLISHED_VERSION_ID = "ontology-v1"

_SEED_ELEMENTS: list[tuple[ChangeRequestTargetKind, str]] = [
    (ChangeRequestTargetKind.CLASS, "class-clause"),
    (ChangeRequestTargetKind.CLASS, "class-company"),
    (ChangeRequestTargetKind.CLASS, "class-extra"),
    (ChangeRequestTargetKind.PROPERTY, "property-claim-deadline"),
    (ChangeRequestTargetKind.PROPERTY, "property-name"),
    (ChangeRequestTargetKind.PROPERTY, "property-extra"),
    (ChangeRequestTargetKind.RELATION, "relation-has-clause"),
    (ChangeRequestTargetKind.RELATION, "relation-extra"),
]


def _ensure_seed() -> None:
    global _seeded
    if _seeded:
        return
    _seeded = True
    draft = _OntologyVersion(
        _DRAFT_VERSION_ID, _SEED_PROJECT_ID, OntologyVersionStatus.DRAFT
    )
    for kind, element_id in _SEED_ELEMENTS:
        draft.elements[(kind, element_id)] = _DraftElement(
            kind, element_id, OntologyElementStatus.ACTIVE, {"seed": element_id}
        )
    _versions[draft.version_id] = draft
    # A second, non-DRAFT version to exercise APPLY_TARGET_NOT_DRAFT.
    _versions[_PUBLISHED_VERSION_ID] = _OntologyVersion(
        _PUBLISHED_VERSION_ID, _SEED_PROJECT_ID, OntologyVersionStatus.PUBLISHED
    )


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------


def _not_found(code: str, message: str) -> ApiException:
    return ApiException(status_code=404, code=code, message=message)


def _conflict(code: str, message: str) -> ApiException:
    return ApiException(status_code=409, code=code, message=message)


def _forbidden(code: str, message: str) -> ApiException:
    return ApiException(status_code=403, code=code, message=message)


# ---------------------------------------------------------------------------
# Fingerprint / snapshot (G2 + G3)
# ---------------------------------------------------------------------------


def _item_element_id(item: OntologyChangeItem) -> str | None:
    return (
        item.ontology_class_id
        or item.ontology_property_id
        or item.ontology_relation_id
    )


def _stable_payload_hash(payload: dict[str, Any] | None) -> str:
    return hashlib.sha256(
        json.dumps(payload or {}, sort_keys=True, ensure_ascii=False).encode("utf-8")
    ).hexdigest()


def _fingerprint(
    target_kind: ChangeRequestTargetKind,
    element_id: str | None,
    status: OntologyElementStatus | None,
    payload: dict[str, Any] | None,
) -> dict[str, Any]:
    return {
        "target_kind": target_kind.value,
        "element_id": element_id,
        "status": status.value if status is not None else None,
        "payload_hash": _stable_payload_hash(payload),
    }


def capture_approval_snapshot(
    request: OntologyChangeRequest, items: list[OntologyChangeItem]
) -> None:
    """G3: capture the before-state snapshot at APPROVE time on the QUEUED request.

    For MODIFY/DEPRECATE the snapshot records the current draft element's status +
    a stable content fingerprint. For ADD the snapshot records the item's
    ontology_version_id context (no prior element).
    """
    _ensure_seed()
    draft = _versions.get(_DRAFT_VERSION_ID)
    snap: dict[str, dict[str, Any]] = {}
    for item in items:
        element_id = _item_element_id(item)
        if item.change_type == ChangeRequestChangeType.ADD:
            snap[item.id] = {
                "change_type": item.change_type.value,
                "version_context": item.ontology_version_id,
                "payload_hash": _stable_payload_hash(item.proposed_change),
            }
            continue
        current = None
        if draft is not None and element_id is not None:
            current = draft.elements.get((item.target_kind, element_id))
        snap[item.id] = {
            "change_type": item.change_type.value,
            "version_context": item.ontology_version_id,
            "fingerprint": _fingerprint(
                item.target_kind,
                element_id,
                current.status if current is not None else None,
                current.payload if current is not None else None,
            ),
        }
    _snapshots[request.id] = snap


# ---------------------------------------------------------------------------
# Target resolution (G1)
# ---------------------------------------------------------------------------


def _resolve_current_draft(project_id: str) -> _OntologyVersion | None:
    drafts = [
        v
        for v in _versions.values()
        if v.project_id == project_id and v.status == OntologyVersionStatus.DRAFT
    ]
    if len(drafts) == 1:
        return drafts[0]
    return None


def _resolve_target(
    project_id: str, explicit_id: str | None
) -> _OntologyVersion | None:
    """Resolve the effective target version.

    Explicit id: must exist (else 404) and be DRAFT (checked by caller). Omitted:
    the project's single current DRAFT, else None (caller -> 409).
    """
    if explicit_id is not None:
        version = _versions.get(explicit_id)
        if version is None or version.project_id != project_id:
            raise _not_found(
                "ONTOLOGY_VERSION_NOT_FOUND",
                f"ontology version {explicit_id} not found",
            )
        return version
    return _resolve_current_draft(project_id)


# ---------------------------------------------------------------------------
# Staleness (G2) — compute per item against the resolved draft + stored snapshot
# ---------------------------------------------------------------------------


def _item_staleness(
    item: OntologyChangeItem,
    draft: _OntologyVersion,
    snap: dict[str, Any] | None,
) -> str | None:
    """Return a stale_reason string, or None when the item is fresh."""
    element_id = _item_element_id(item)
    if item.change_type == ChangeRequestChangeType.ADD:
        # ADD is superseded only if its version context no longer resolves to the
        # target draft.
        version_context = snap.get("version_context") if snap else item.ontology_version_id
        if version_context != draft.version_id:
            return "VERSION_CONTEXT_DIVERGED"
        return None

    # MODIFY / DEPRECATE
    current = draft.elements.get((item.target_kind, element_id)) if element_id else None
    if current is None or current.status == OntologyElementStatus.DELETED:
        return "TARGET_ELEMENT_DELETED"

    captured = (snap or {}).get("fingerprint")
    if captured is None:
        # No snapshot (e.g. approved before this slice existed) — compare against
        # the item's own expectation: treat a non-ACTIVE current as changed.
        if current.status == OntologyElementStatus.ARCHIVED:
            return "TARGET_ELEMENT_ARCHIVED"
        return None

    captured_status = captured.get("status")
    if current.status.value != captured_status:
        if current.status == OntologyElementStatus.ARCHIVED:
            return "TARGET_ELEMENT_ARCHIVED"
        return "TARGET_ELEMENT_MODIFIED"

    current_fp = _fingerprint(
        item.target_kind, element_id, current.status, current.payload
    )
    if current_fp != captured:
        return "TARGET_ELEMENT_MODIFIED"
    return None


def _before_ref(
    item: OntologyChangeItem, draft: _OntologyVersion
) -> OntologyElementRef | None:
    if item.change_type == ChangeRequestChangeType.ADD:
        return None
    element_id = _item_element_id(item)
    current = draft.elements.get((item.target_kind, element_id)) if element_id else None
    return OntologyElementRef(
        target_kind=item.target_kind,
        ontology_class_id=item.ontology_class_id,
        ontology_property_id=item.ontology_property_id,
        ontology_relation_id=item.ontology_relation_id,
        ontology_version_id=draft.version_id,
        status=current.status if current is not None else None,
    )


def _after_ref(
    item: OntologyChangeItem,
    draft: _OntologyVersion,
    projected_status: OntologyElementStatus,
) -> OntologyElementRef:
    return OntologyElementRef(
        target_kind=item.target_kind,
        ontology_class_id=item.ontology_class_id,
        ontology_property_id=item.ontology_property_id,
        ontology_relation_id=item.ontology_relation_id,
        ontology_version_id=draft.version_id,
        status=projected_status,
    )


def _projected_after_status(item: OntologyChangeItem) -> OntologyElementStatus:
    if item.change_type == ChangeRequestChangeType.DEPRECATE:
        return OntologyElementStatus.ARCHIVED
    if item.change_type == ChangeRequestChangeType.ADD:
        return OntologyElementStatus.DRAFT
    return OntologyElementStatus.ACTIVE  # MODIFY


# ---------------------------------------------------------------------------
# Capabilities (G6)
# ---------------------------------------------------------------------------


def _capabilities(
    request: OntologyChangeRequest, actor_role: Role
) -> ApplicationCapabilities:
    can_apply = (
        actor_role in APPROVER_ROLES
        and request.status == OntologyChangeRequestStatus.APPROVED
        and request.application_state == GovernanceApplicationState.QUEUED
    )
    return ApplicationCapabilities(can_view=True, can_apply=can_apply)


# ---------------------------------------------------------------------------
# Pagination
# ---------------------------------------------------------------------------


def _decode_cursor(cursor: str | None) -> int:
    if not cursor:
        return 0
    try:
        return int(base64.urlsafe_b64decode(cursor.encode()).decode())
    except (ValueError, TypeError):
        raise ApiException(
            status_code=422,
            code="INVALID_CURSOR",
            message="cursor is not a valid opaque cursor",
        )


def _encode_cursor(offset: int) -> str:
    return base64.urlsafe_b64encode(str(offset).encode()).decode()


def _clamp_limit(limit: int | None) -> int:
    if limit is None:
        return 50
    return max(1, min(limit, 100))


# ---------------------------------------------------------------------------
# A. Application-status pre-check (read-only; G5 advisory — never mutates)
# ---------------------------------------------------------------------------


def get_application_status(
    change_request_id: str,
    target_ontology_version_id: str | None,
    actor_id: str,
    actor_role: Role,
) -> GovernanceApplicationStatusResponse:
    from . import service as _service

    request = _service._get_request_or_404(change_request_id)
    _ensure_seed()

    target = _resolve_target(request.project_id, target_ontology_version_id)
    items = _service._items.get(request.id, [])
    snap_all = _snapshots.get(request.id, {})

    target_version_status = target.status if target is not None else None
    target_is_draft = (
        target is not None and target.status == OntologyVersionStatus.DRAFT
    )

    previews: list[ApplicationItemPreview] = []
    would_supersede = False
    for item in items:
        stale_reason: str | None = None
        before_ref = None
        after_ref = None
        if target_is_draft and target is not None:
            stale_reason = _item_staleness(item, target, snap_all.get(item.id))
            before_ref = _before_ref(item, target)
            after_ref = _after_ref(item, target, _projected_after_status(item))
        if stale_reason is not None:
            would_supersede = True
        previews.append(
            ApplicationItemPreview(
                change_item_id=item.id,
                target_kind=item.target_kind,
                change_type=item.change_type,
                before_ref=before_ref,
                after_ref=after_ref,
                stale=stale_reason is not None,
                stale_reason=stale_reason,
            )
        )

    applicable = (
        request.status == OntologyChangeRequestStatus.APPROVED
        and request.application_state == GovernanceApplicationState.QUEUED
        and target_is_draft
        and not would_supersede
    )
    return GovernanceApplicationStatusResponse(
        change_request_id=request.id,
        project_id=request.project_id,
        status=request.status.value,
        application_state=request.application_state,
        target_ontology_version_id=target.version_id if target is not None else None,
        target_version_status=target_version_status,
        target_is_draft=target_is_draft,
        applicable=applicable,
        would_supersede=would_supersede,
        item_previews=previews,
        capabilities=_capabilities(request, actor_role),
        mutation_guard=GovernanceMutationGuard(),
    )


# ---------------------------------------------------------------------------
# B. Apply (the ONE sanctioned mutation surface)
# ---------------------------------------------------------------------------


def apply_change_request(
    change_request_id: str,
    payload: GovernanceApplyRequest | None,
    actor_id: str,
    actor_role: Role,
) -> GovernanceApplyResponse:
    from . import service as _service

    request = _service._get_request_or_404(change_request_id)
    _ensure_seed()
    payload = payload or GovernanceApplyRequest()

    # 1. Precondition / idempotency (409) — before authz? Spec lists precondition
    #    first, then authz. But an unauthorized actor must never learn nothing; we
    #    follow the contract order: precondition, then authz, then target, then
    #    staleness. Authz still mutates nothing.
    if request.application_state == GovernanceApplicationState.APPLIED:
        raise _conflict(
            "CHANGE_ALREADY_APPLIED",
            "change request already applied to a draft version",
        )
    if not (
        request.status == OntologyChangeRequestStatus.APPROVED
        and request.application_state == GovernanceApplicationState.QUEUED
    ):
        raise _conflict(
            "CHANGE_NOT_APPLICABLE",
            "apply requires status=APPROVED and application_state=QUEUED",
        )

    # 2. Authz (403).
    if actor_role not in APPROVER_ROLES:
        raise _forbidden(
            "PERMISSION_DENIED",
            "apply requires ONTOLOGY_MANAGER/PROJECT_ADMIN/SYSTEM_ADMIN",
        )

    # 3. Target resolution (G1). Explicit missing -> 404; non-DRAFT / no single
    #    current DRAFT -> 409 APPLY_TARGET_NOT_DRAFT. Mutates nothing on failure.
    target = _resolve_target(request.project_id, payload.target_ontology_version_id)
    if target is None:
        raise _conflict(
            "APPLY_TARGET_NOT_DRAFT",
            "no single current DRAFT ontology version to apply into",
        )
    if target.status != OntologyVersionStatus.DRAFT:
        raise _conflict(
            "APPLY_TARGET_NOT_DRAFT",
            f"target ontology version {target.version_id} is not DRAFT",
        )

    items = _service._items.get(request.id, [])
    snap_all = _snapshots.get(request.id, {})

    # 4. Staleness (G2) — all-or-nothing (G4). Compute all before mutating.
    stale_items: list[dict[str, Any]] = []
    for item in items:
        reason = _item_staleness(item, target, snap_all.get(item.id))
        if reason is not None:
            stale_items.append(
                {"change_item_id": item.id, "stale_reason": reason}
            )

    if stale_items:
        # Block: mutate NOTHING, QUEUED -> SUPERSEDED (terminal), audit, 409.
        before_state = request.application_state
        request.application_state = GovernanceApplicationState.SUPERSEDED
        request.updated_at = utc_now()
        audit_entry = _record_app_audit(
            request=request,
            action=GovernanceApplicationAuditAction.CHANGE_REQUEST_SUPERSEDED,
            actor_id=actor_id,
            actor_role=actor_role,
            target_ontology_version_id=target.version_id,
            applied_item_ids=[],
            before_after_refs=[],
            before_application_state=before_state,
            after_application_state=GovernanceApplicationState.SUPERSEDED,
            note=payload.note,
            stale_detail={"stale_items": stale_items},
        )
        raise ApiException(
            status_code=409,
            code="CHANGE_REQUEST_SUPERSEDED",
            message="change request is stale; superseded, nothing applied",
            details={
                "application_state": GovernanceApplicationState.SUPERSEDED.value,
                "stale_items": stale_items,
                "audit_entry_id": audit_entry.id,
            },
        )

    # 5. Apply (all-or-nothing) via MVP1 ontology-edit semantics on the DRAFT.
    before_after: list[ApplicationBeforeAfterRef] = []
    applied_item_ids: list[str] = []
    for item in items:
        element_id = _item_element_id(item)
        before_ref = _before_ref(item, target)
        if item.change_type == ChangeRequestChangeType.ADD:
            new_id = element_id or f"applied-{item.id}"
            target.elements[(item.target_kind, new_id)] = _DraftElement(
                item.target_kind,
                new_id,
                OntologyElementStatus.DRAFT,
                item.proposed_change,
            )
            after_status = OntologyElementStatus.DRAFT
            after_ref = OntologyElementRef(
                target_kind=item.target_kind,
                ontology_class_id=new_id
                if item.target_kind == ChangeRequestTargetKind.CLASS
                else item.ontology_class_id,
                ontology_property_id=new_id
                if item.target_kind == ChangeRequestTargetKind.PROPERTY
                else item.ontology_property_id,
                ontology_relation_id=new_id
                if item.target_kind == ChangeRequestTargetKind.RELATION
                else item.ontology_relation_id,
                ontology_version_id=target.version_id,
                status=after_status,
            )
        elif item.change_type == ChangeRequestChangeType.MODIFY:
            element = target.elements[(item.target_kind, element_id)]
            element.payload = item.proposed_change
            element.status = OntologyElementStatus.ACTIVE
            after_ref = _after_ref(item, target, OntologyElementStatus.ACTIVE)
        else:  # DEPRECATE -> ARCHIVED (never DELETED)
            element = target.elements[(item.target_kind, element_id)]
            element.status = OntologyElementStatus.ARCHIVED
            after_ref = _after_ref(item, target, OntologyElementStatus.ARCHIVED)

        before_after.append(
            ApplicationBeforeAfterRef(
                change_item_id=item.id,
                change_type=item.change_type,
                before=before_ref,
                after=after_ref,
            )
        )
        applied_item_ids.append(item.id)

    before_state = request.application_state
    request.application_state = GovernanceApplicationState.APPLIED
    request.updated_at = utc_now()

    audit_entry = _record_app_audit(
        request=request,
        action=GovernanceApplicationAuditAction.CHANGE_REQUEST_APPLIED,
        actor_id=actor_id,
        actor_role=actor_role,
        target_ontology_version_id=target.version_id,
        applied_item_ids=applied_item_ids,
        before_after_refs=before_after,
        before_application_state=before_state,
        after_application_state=GovernanceApplicationState.APPLIED,
        note=payload.note,
        stale_detail=None,
    )

    return GovernanceApplyResponse(
        change_request_id=request.id,
        project_id=request.project_id,
        application_state=GovernanceApplicationState.APPLIED,
        target_ontology_version_id=target.version_id,
        applied_item_ids=applied_item_ids,
        before_after_refs=before_after,
        audit_entry=audit_entry,
        mutation_guard=GovernanceApplicationMutationGuard(),
        capabilities=_capabilities(request, actor_role),
    )


# ---------------------------------------------------------------------------
# C. Application audit (read-only)
# ---------------------------------------------------------------------------


def _record_app_audit(
    *,
    request: OntologyChangeRequest,
    action: GovernanceApplicationAuditAction,
    actor_id: str,
    actor_role: Role,
    target_ontology_version_id: str | None,
    applied_item_ids: list[str],
    before_after_refs: list[ApplicationBeforeAfterRef],
    before_application_state: GovernanceApplicationState | None,
    after_application_state: GovernanceApplicationState | None,
    note: str | None,
    stale_detail: dict[str, Any] | None,
) -> GovernanceApplicationAuditEntry:
    entry = GovernanceApplicationAuditEntry(
        id=_next_app_audit_id(),
        project_id=request.project_id,
        change_request_id=request.id,
        action=action,
        actor_id=actor_id,
        actor_role=actor_role,
        target_ontology_version_id=target_ontology_version_id,
        applied_item_ids=applied_item_ids,
        before_after_refs=before_after_refs,
        before_application_state=before_application_state,
        after_application_state=after_application_state,
        note=note,
        stale_detail=stale_detail,
        created_at=utc_now(),
    )
    _app_audit.append(entry)
    return entry


def list_application_audit(
    change_request_id: str,
    action_filter: GovernanceApplicationAuditAction | None,
    limit: int | None,
    cursor: str | None,
) -> GovernanceApplicationAuditListResponse:
    from . import service as _service

    _service._get_request_or_404(change_request_id)
    rows = [e for e in _app_audit if e.change_request_id == change_request_id]
    if action_filter is not None:
        rows = [e for e in rows if e.action == action_filter]
    rows = sorted(rows, key=lambda e: (e.created_at, e.id))
    total = len(rows)
    offset = _decode_cursor(cursor)
    page_size = _clamp_limit(limit)
    page = rows[offset : offset + page_size]
    next_cursor = (
        _encode_cursor(offset + page_size) if offset + page_size < total else None
    )
    return GovernanceApplicationAuditListResponse(
        items=page, total_count=total, next_cursor=next_cursor
    )
