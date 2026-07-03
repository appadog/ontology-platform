from __future__ import annotations

import base64
import itertools
from datetime import datetime, timezone

from app.core.enums import Role
from app.core.errors import ApiException

from .schemas import (
    ChangeRequestChangeType,
    ChangeRequestTargetKind,
    GovernanceApplicationBanner,
    GovernanceApplicationState,
    GovernanceAuditAction,
    GovernanceAuditEntry,
    GovernanceAuditListResponse,
    GovernanceCapabilities,
    GovernanceMutationResponse,
    GovernanceReviewAction,
    GovernanceReviewDecision,
    GovernanceReviewDecisionRequest,
    GovernanceWithdrawRequest,
    OntologyChangeItem,
    OntologyChangeItemRequest,
    OntologyChangeRequest,
    OntologyChangeRequestCreateRequest,
    OntologyChangeRequestDetail,
    OntologyChangeRequestListResponse,
    OntologyChangeRequestStatus,
    OntologyChangeRequestUpdateRequest,
)

# ---------------------------------------------------------------------------
# Roles allowed to approve/reject and to comment/request-changes.
# ---------------------------------------------------------------------------

APPROVER_ROLES = {Role.ONTOLOGY_MANAGER, Role.PROJECT_ADMIN, Role.SYSTEM_ADMIN}
REVIEWER_ROLES = APPROVER_ROLES | {Role.REVIEWER}

_TERMINAL_STATUSES = {
    OntologyChangeRequestStatus.APPROVED,
    OntologyChangeRequestStatus.REJECTED,
    OntologyChangeRequestStatus.WITHDRAWN,
}
_EDITABLE_STATUSES = {
    OntologyChangeRequestStatus.DRAFT,
    OntologyChangeRequestStatus.OPEN,
}

APPLICATION_BANNER_MESSAGE = (
    "승인은 의도 등록 + 감사 기록일 뿐이며, 온톨로지/게시 그래프에 아무것도 "
    "적용되지 않습니다."
)

# Ontology refs known to resolve in the seeded demo project.
_KNOWN_CLASS_IDS = {"class-clause", "class-company", "class-extra"}
_KNOWN_PROPERTY_IDS = {"property-claim-deadline", "property-name", "property-extra"}
_KNOWN_RELATION_IDS = {"relation-has-clause", "relation-extra"}
_KNOWN_ONTOLOGY_VERSION_IDS = {"ontology-v7", "ontology-v1"}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Process-local store
# ---------------------------------------------------------------------------

_requests: dict[str, OntologyChangeRequest] = {}
_items: dict[str, list[OntologyChangeItem]] = {}
_reviews: dict[str, list[GovernanceReviewDecision]] = {}
_audit: list[GovernanceAuditEntry] = []

_seeded = False
_audit_counter = itertools.count(1)
_request_counter = itertools.count(1)
_item_counter = itertools.count(1)
_decision_counter = itertools.count(1)


def reset_runtime_store() -> None:
    global _seeded, _audit_counter, _request_counter, _item_counter, _decision_counter
    _requests.clear()
    _items.clear()
    _reviews.clear()
    _audit.clear()
    _seeded = False
    _audit_counter = itertools.count(1)
    _request_counter = itertools.count(1)
    _item_counter = itertools.count(1)
    _decision_counter = itertools.count(1)
    # MVP6.6: also reset the application submodule's process-local store.
    from app.modules.governance import application as _application

    _application.reset_application_store()


def _next_audit_id() -> str:
    return f"gaudit-{next(_audit_counter):05d}"


def _next_request_id() -> str:
    return f"ocr-{next(_request_counter):05d}"


def _next_item_id() -> str:
    return f"ocitem-{next(_item_counter):05d}"


def _next_decision_id() -> str:
    return f"gdec-{next(_decision_counter):05d}"


# ---------------------------------------------------------------------------
# Deterministic seed
# ---------------------------------------------------------------------------

SEED_PROJECT_ID = "project-corp-knowledge"


def _ensure_seed() -> None:
    global _seeded
    if _seeded:
        return
    _seeded = True


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------


def _not_found(code: str, message: str) -> ApiException:
    return ApiException(status_code=404, code=code, message=message)


def _conflict(code: str, message: str) -> ApiException:
    return ApiException(status_code=409, code=code, message=message)


def _forbidden(code: str, message: str) -> ApiException:
    return ApiException(status_code=403, code=code, message=message)


def _unprocessable(code: str, message: str) -> ApiException:
    return ApiException(status_code=422, code=code, message=message)


def _get_request_or_404(change_request_id: str) -> OntologyChangeRequest:
    _ensure_seed()
    request = _requests.get(change_request_id)
    if request is None:
        raise _not_found(
            "CHANGE_REQUEST_NOT_FOUND",
            f"change request {change_request_id} not found",
        )
    return request


# ---------------------------------------------------------------------------
# Capabilities (display-only hint; server enforces authorization independently)
# ---------------------------------------------------------------------------


def _capabilities(
    request: OntologyChangeRequest, actor_id: str, actor_role: Role
) -> GovernanceCapabilities:
    is_proposer = actor_id == request.proposer_id
    is_reviewer = actor_role in REVIEWER_ROLES
    is_approver = actor_role in APPROVER_ROLES
    editable = request.status in _EDITABLE_STATUSES
    non_terminal = request.status not in _TERMINAL_STATUSES
    reviewable = request.status in {
        OntologyChangeRequestStatus.OPEN,
        OntologyChangeRequestStatus.IN_REVIEW,
    }
    return GovernanceCapabilities(
        can_view=True,
        can_edit_request=is_proposer and editable,
        can_submit=is_proposer and request.status == OntologyChangeRequestStatus.DRAFT,
        can_withdraw=is_proposer and non_terminal,
        can_comment=is_reviewer and reviewable,
        can_request_changes=is_reviewer and reviewable,
        can_approve=is_approver and (not is_proposer) and reviewable,
        can_reject=is_approver and reviewable,
    )


# ---------------------------------------------------------------------------
# Audit + pagination helpers
# ---------------------------------------------------------------------------


def _record_audit(
    *,
    request: OntologyChangeRequest,
    action: GovernanceAuditAction,
    actor_id: str,
    actor_role: Role,
    before_status: OntologyChangeRequestStatus | None,
    after_status: OntologyChangeRequestStatus | None,
    reason: str | None = None,
) -> GovernanceAuditEntry:
    items = _items.get(request.id, [])
    element_ids: list[str] = []
    for item in items:
        for ref in (
            item.ontology_class_id,
            item.ontology_property_id,
            item.ontology_relation_id,
        ):
            if ref:
                element_ids.append(ref)
    entry = GovernanceAuditEntry(
        id=_next_audit_id(),
        project_id=request.project_id,
        change_request_id=request.id,
        action=action,
        actor_id=actor_id,
        actor_role=actor_role,
        target_item_ids=[item.id for item in items],
        target_ontology_element_ids=element_ids,
        ontology_version_id=request.ontology_version_id,
        before_status=before_status,
        after_status=after_status,
        reason=reason,
        created_at=utc_now(),
    )
    _audit.append(entry)
    return entry


def _decode_cursor(cursor: str | None) -> int:
    if not cursor:
        return 0
    try:
        return int(base64.urlsafe_b64decode(cursor.encode()).decode())
    except (ValueError, TypeError):
        raise _unprocessable("INVALID_CURSOR", "cursor is not a valid opaque cursor")


def _encode_cursor(offset: int) -> str:
    return base64.urlsafe_b64encode(str(offset).encode()).decode()


def _clamp_limit(limit: int | None) -> int:
    if limit is None:
        return 50
    return max(1, min(limit, 100))


# ---------------------------------------------------------------------------
# Change-item validation
# ---------------------------------------------------------------------------


def _element_ref_for_kind(
    payload: OntologyChangeItemRequest,
) -> tuple[str | None, ChangeRequestTargetKind | None]:
    refs = {
        ChangeRequestTargetKind.CLASS: payload.ontology_class_id,
        ChangeRequestTargetKind.PROPERTY: payload.ontology_property_id,
        ChangeRequestTargetKind.RELATION: payload.ontology_relation_id,
    }
    present = [(kind, value) for kind, value in refs.items() if value]
    if len(present) == 1:
        return present[0][1], present[0][0]
    if len(present) == 0:
        return None, None
    return "MULTIPLE", None


def _validate_item(payload: OntologyChangeItemRequest) -> None:
    ref_value, ref_kind = _element_ref_for_kind(payload)
    if payload.change_type == ChangeRequestChangeType.ADD:
        if ref_value is not None:
            raise _conflict(
                "CHANGE_ITEM_TARGET_INVALID",
                "ADD change item must not reference an existing element",
            )
    else:
        if ref_value is None or ref_value == "MULTIPLE" or ref_kind != payload.target_kind:
            raise _conflict(
                "CHANGE_ITEM_TARGET_INVALID",
                "MODIFY/DEPRECATE requires exactly one element ref matching target_kind",
            )
        if not _element_ref_resolves(ref_kind, ref_value):
            raise _conflict(
                "ONTOLOGY_REF_INVALID",
                f"referenced element {ref_value} not found in project",
            )
    if not _version_resolves(payload.ontology_version_id):
        raise _conflict(
            "ONTOLOGY_REF_INVALID",
            f"ontology_version_id {payload.ontology_version_id} not found in project",
        )


def _element_ref_resolves(kind: ChangeRequestTargetKind, value: str) -> bool:
    if kind == ChangeRequestTargetKind.CLASS:
        return value in _KNOWN_CLASS_IDS
    if kind == ChangeRequestTargetKind.PROPERTY:
        return value in _KNOWN_PROPERTY_IDS
    if kind == ChangeRequestTargetKind.RELATION:
        return value in _KNOWN_RELATION_IDS
    return False


def _version_resolves(version_id: str) -> bool:
    return version_id in _KNOWN_ONTOLOGY_VERSION_IDS


# ---------------------------------------------------------------------------
# Response builders
# ---------------------------------------------------------------------------


def _application_banner(request: OntologyChangeRequest) -> GovernanceApplicationBanner:
    return GovernanceApplicationBanner(
        application_state=request.application_state,
        message=APPLICATION_BANNER_MESSAGE,
    )


def _mutation_response(
    request: OntologyChangeRequest,
    audit_entry: GovernanceAuditEntry,
    actor_id: str,
    actor_role: Role,
    review_decision: GovernanceReviewDecision | None = None,
) -> GovernanceMutationResponse:
    return GovernanceMutationResponse(
        change_request=request,
        review_decision=review_decision,
        audit_entry=audit_entry,
        capabilities=_capabilities(request, actor_id, actor_role),
    )


def _refresh_item_count(request: OntologyChangeRequest) -> None:
    request.item_count = len(_items.get(request.id, []))


# ---------------------------------------------------------------------------
# A. Change-request CRUD
# ---------------------------------------------------------------------------


def propose_change_request(
    project_id: str,
    payload: OntologyChangeRequestCreateRequest,
    actor_id: str,
    actor_role: Role,
) -> GovernanceMutationResponse:
    _ensure_seed()
    now = utc_now()
    request_id = _next_request_id()
    for item_payload in payload.items:
        _validate_item(item_payload)
    request = OntologyChangeRequest(
        id=request_id,
        project_id=project_id,
        title=payload.title,
        summary=payload.summary,
        status=OntologyChangeRequestStatus.DRAFT,
        application_state=GovernanceApplicationState.NOT_APPLICABLE,
        proposer_id=actor_id,
        item_count=0,
        ontology_version_id=payload.ontology_version_id,
        created_at=now,
        updated_at=now,
    )
    _requests[request_id] = request
    _items[request_id] = []
    _reviews[request_id] = []
    for item_payload in payload.items:
        _append_item(request, item_payload)
    _refresh_item_count(request)
    audit_entry = _record_audit(
        request=request,
        action=GovernanceAuditAction.CHANGE_REQUEST_CREATED,
        actor_id=actor_id,
        actor_role=actor_role,
        before_status=None,
        after_status=OntologyChangeRequestStatus.DRAFT,
    )
    return _mutation_response(request, audit_entry, actor_id, actor_role)


def _append_item(
    request: OntologyChangeRequest, payload: OntologyChangeItemRequest
) -> OntologyChangeItem:
    now = utc_now()
    item = OntologyChangeItem(
        id=_next_item_id(),
        change_request_id=request.id,
        target_kind=payload.target_kind,
        change_type=payload.change_type,
        ontology_class_id=payload.ontology_class_id,
        ontology_property_id=payload.ontology_property_id,
        ontology_relation_id=payload.ontology_relation_id,
        ontology_version_id=payload.ontology_version_id,
        proposed_change=payload.proposed_change,
        created_at=now,
        updated_at=now,
    )
    _items.setdefault(request.id, []).append(item)
    return item


def list_change_requests(
    project_id: str,
    status_filter: OntologyChangeRequestStatus | None,
    application_state_filter: GovernanceApplicationState | None,
    limit: int | None,
    cursor: str | None,
) -> OntologyChangeRequestListResponse:
    _ensure_seed()
    rows = [r for r in _requests.values() if r.project_id == project_id]
    if status_filter is not None:
        rows = [r for r in rows if r.status == status_filter]
    if application_state_filter is not None:
        rows = [r for r in rows if r.application_state == application_state_filter]
    rows.sort(key=lambda r: (r.created_at, r.id))
    total = len(rows)
    offset = _decode_cursor(cursor)
    page_size = _clamp_limit(limit)
    page = rows[offset : offset + page_size]
    next_cursor = (
        _encode_cursor(offset + page_size) if offset + page_size < total else None
    )
    return OntologyChangeRequestListResponse(
        items=page, total_count=total, next_cursor=next_cursor
    )


def get_change_request_detail(
    change_request_id: str, actor_id: str, actor_role: Role
) -> OntologyChangeRequestDetail:
    request = _get_request_or_404(change_request_id)
    return OntologyChangeRequestDetail(
        change_request=request,
        items=list(_items.get(change_request_id, [])),
        reviews=list(_reviews.get(change_request_id, [])),
        capabilities=_capabilities(request, actor_id, actor_role),
        application_banner=_application_banner(request),
    )


def update_change_request(
    change_request_id: str,
    payload: OntologyChangeRequestUpdateRequest,
    actor_id: str,
    actor_role: Role,
) -> GovernanceMutationResponse:
    request = _get_request_or_404(change_request_id)
    _require_proposer(request, actor_id)
    _require_editable(request)
    if payload.title is not None:
        request.title = payload.title
    if payload.summary is not None:
        request.summary = payload.summary
    request.updated_at = utc_now()
    audit_entry = _record_audit(
        request=request,
        action=GovernanceAuditAction.CHANGE_REQUEST_UPDATED,
        actor_id=actor_id,
        actor_role=actor_role,
        before_status=request.status,
        after_status=request.status,
    )
    return _mutation_response(request, audit_entry, actor_id, actor_role)


# ---------------------------------------------------------------------------
# B. Change-item management
# ---------------------------------------------------------------------------


def add_item(
    change_request_id: str,
    payload: OntologyChangeItemRequest,
    actor_id: str,
    actor_role: Role,
) -> GovernanceMutationResponse:
    request = _get_request_or_404(change_request_id)
    _require_proposer(request, actor_id)
    _require_editable(request)
    _validate_item(payload)
    _append_item(request, payload)
    _refresh_item_count(request)
    request.updated_at = utc_now()
    audit_entry = _record_audit(
        request=request,
        action=GovernanceAuditAction.CHANGE_REQUEST_UPDATED,
        actor_id=actor_id,
        actor_role=actor_role,
        before_status=request.status,
        after_status=request.status,
    )
    return _mutation_response(request, audit_entry, actor_id, actor_role)


def edit_item(
    change_request_id: str,
    item_id: str,
    payload: OntologyChangeItemRequest,
    actor_id: str,
    actor_role: Role,
) -> GovernanceMutationResponse:
    request = _get_request_or_404(change_request_id)
    _require_proposer(request, actor_id)
    _require_editable(request)
    item = _get_item_or_404(change_request_id, item_id)
    _validate_item(payload)
    item.target_kind = payload.target_kind
    item.change_type = payload.change_type
    item.ontology_class_id = payload.ontology_class_id
    item.ontology_property_id = payload.ontology_property_id
    item.ontology_relation_id = payload.ontology_relation_id
    item.ontology_version_id = payload.ontology_version_id
    item.proposed_change = payload.proposed_change
    item.updated_at = utc_now()
    request.updated_at = utc_now()
    audit_entry = _record_audit(
        request=request,
        action=GovernanceAuditAction.CHANGE_REQUEST_UPDATED,
        actor_id=actor_id,
        actor_role=actor_role,
        before_status=request.status,
        after_status=request.status,
    )
    return _mutation_response(request, audit_entry, actor_id, actor_role)


def remove_item(
    change_request_id: str,
    item_id: str,
    actor_id: str,
    actor_role: Role,
) -> GovernanceMutationResponse:
    request = _get_request_or_404(change_request_id)
    _require_proposer(request, actor_id)
    _require_editable(request)
    item = _get_item_or_404(change_request_id, item_id)
    _items[change_request_id].remove(item)
    _refresh_item_count(request)
    request.updated_at = utc_now()
    audit_entry = _record_audit(
        request=request,
        action=GovernanceAuditAction.CHANGE_REQUEST_UPDATED,
        actor_id=actor_id,
        actor_role=actor_role,
        before_status=request.status,
        after_status=request.status,
    )
    return _mutation_response(request, audit_entry, actor_id, actor_role)


def _get_item_or_404(change_request_id: str, item_id: str) -> OntologyChangeItem:
    for item in _items.get(change_request_id, []):
        if item.id == item_id:
            return item
    raise _not_found("CHANGE_ITEM_NOT_FOUND", f"change item {item_id} not found")


# ---------------------------------------------------------------------------
# C. Lifecycle (submit / withdraw)
# ---------------------------------------------------------------------------


def submit_change_request(
    change_request_id: str, actor_id: str, actor_role: Role
) -> GovernanceMutationResponse:
    request = _get_request_or_404(change_request_id)
    _require_proposer(request, actor_id)
    if request.status != OntologyChangeRequestStatus.DRAFT:
        raise _conflict(
            "CHANGE_REQUEST_STATE_CONFLICT",
            f"cannot submit a change request in status {request.status.value}",
        )
    if not _items.get(change_request_id):
        raise _conflict(
            "CHANGE_REQUEST_NO_ITEMS",
            "cannot submit a change request with zero change items",
        )
    before = request.status
    now = utc_now()
    request.status = OntologyChangeRequestStatus.OPEN
    request.submitted_at = now
    request.updated_at = now
    audit_entry = _record_audit(
        request=request,
        action=GovernanceAuditAction.CHANGE_REQUEST_SUBMITTED,
        actor_id=actor_id,
        actor_role=actor_role,
        before_status=before,
        after_status=request.status,
    )
    return _mutation_response(request, audit_entry, actor_id, actor_role)


def withdraw_change_request(
    change_request_id: str,
    payload: GovernanceWithdrawRequest,
    actor_id: str,
    actor_role: Role,
) -> GovernanceMutationResponse:
    request = _get_request_or_404(change_request_id)
    _require_proposer(request, actor_id)
    if request.status in _TERMINAL_STATUSES:
        raise _conflict(
            "CHANGE_REQUEST_STATE_CONFLICT",
            f"cannot withdraw a change request in status {request.status.value}",
        )
    before = request.status
    request.status = OntologyChangeRequestStatus.WITHDRAWN
    request.updated_at = utc_now()
    audit_entry = _record_audit(
        request=request,
        action=GovernanceAuditAction.CHANGE_REQUEST_WITHDRAWN,
        actor_id=actor_id,
        actor_role=actor_role,
        before_status=before,
        after_status=request.status,
        reason=payload.reason,
    )
    return _mutation_response(request, audit_entry, actor_id, actor_role)


# ---------------------------------------------------------------------------
# D. Review + decision
# ---------------------------------------------------------------------------


def record_review_decision(
    change_request_id: str,
    payload: GovernanceReviewDecisionRequest,
    actor_id: str,
    actor_role: Role,
) -> GovernanceMutationResponse:
    request = _get_request_or_404(change_request_id)
    action = payload.action

    # Reason rules (422) before any state check for APPROVE/REJECT/REQUEST_CHANGES.
    if action in (
        GovernanceReviewAction.APPROVE,
        GovernanceReviewAction.REJECT,
        GovernanceReviewAction.REQUEST_CHANGES,
    ):
        if not payload.reason or not payload.reason.strip():
            raise _unprocessable(
                "REASON_REQUIRED",
                f"reason is required for {action.value}",
            )

    # Role gating (403).
    if action in (GovernanceReviewAction.APPROVE, GovernanceReviewAction.REJECT):
        if actor_role not in APPROVER_ROLES:
            raise _forbidden(
                "PERMISSION_DENIED",
                f"{action.value} requires ONTOLOGY_MANAGER/PROJECT_ADMIN/SYSTEM_ADMIN",
            )
    else:  # COMMENT / REQUEST_CHANGES
        if actor_role not in REVIEWER_ROLES:
            raise _forbidden(
                "PERMISSION_DENIED",
                f"{action.value} requires REVIEWER or elevated role",
            )

    # Segregation of duties (403): proposer may not approve own request.
    if action == GovernanceReviewAction.APPROVE and actor_id == request.proposer_id:
        raise _forbidden(
            "SELF_APPROVAL_FORBIDDEN",
            "the proposer may not approve their own change request",
        )

    # State gating (409): decisions valid only from OPEN/IN_REVIEW.
    if request.status not in (
        OntologyChangeRequestStatus.OPEN,
        OntologyChangeRequestStatus.IN_REVIEW,
    ):
        raise _conflict(
            "CHANGE_REQUEST_STATE_CONFLICT",
            f"cannot record a decision on a request in status {request.status.value}",
        )

    before = request.status

    # G1 first-touch: COMMENT/REQUEST_CHANGES against an OPEN request atomically
    # advances to IN_REVIEW and audits REVIEW_STARTED BEFORE the action's audit.
    if (
        action in (GovernanceReviewAction.COMMENT, GovernanceReviewAction.REQUEST_CHANGES)
        and request.status == OntologyChangeRequestStatus.OPEN
    ):
        request.status = OntologyChangeRequestStatus.IN_REVIEW
        request.updated_at = utc_now()
        _record_audit(
            request=request,
            action=GovernanceAuditAction.REVIEW_STARTED,
            actor_id=actor_id,
            actor_role=actor_role,
            before_status=before,
            after_status=OntologyChangeRequestStatus.IN_REVIEW,
        )

    action_before = request.status
    audit_action: GovernanceAuditAction
    resulting_application_state = GovernanceApplicationState.NOT_APPLICABLE

    if action == GovernanceReviewAction.COMMENT:
        audit_action = GovernanceAuditAction.COMMENT_ADDED
    elif action == GovernanceReviewAction.REQUEST_CHANGES:
        request.status = OntologyChangeRequestStatus.OPEN
        audit_action = GovernanceAuditAction.CHANGES_REQUESTED
    elif action == GovernanceReviewAction.APPROVE:
        request.status = OntologyChangeRequestStatus.APPROVED
        request.application_state = GovernanceApplicationState.QUEUED
        request.decided_at = utc_now()
        request.decided_by = actor_id
        request.decision_reason = payload.reason
        resulting_application_state = GovernanceApplicationState.QUEUED
        audit_action = GovernanceAuditAction.CHANGE_REQUEST_APPROVED
        # MVP6.6 G3: capture the approve-time before-state snapshot on the QUEUED
        # request so a later apply compares against the stored snapshot (additive;
        # does not change MVP6.5 external behavior). Import locally to avoid a
        # module import cycle.
        from app.modules.governance import application as _application

        _application.capture_approval_snapshot(request, _items.get(request.id, []))
    else:  # REJECT
        request.status = OntologyChangeRequestStatus.REJECTED
        request.decided_at = utc_now()
        request.decided_by = actor_id
        request.decision_reason = payload.reason
        audit_action = GovernanceAuditAction.CHANGE_REQUEST_REJECTED

    request.updated_at = utc_now()

    decision = GovernanceReviewDecision(
        id=_next_decision_id(),
        change_request_id=request.id,
        action=action,
        actor_id=actor_id,
        actor_role=actor_role,
        reason=payload.reason,
        resulting_status=request.status,
        resulting_application_state=resulting_application_state,
        created_at=utc_now(),
    )
    _reviews.setdefault(request.id, []).append(decision)

    audit_entry = _record_audit(
        request=request,
        action=audit_action,
        actor_id=actor_id,
        actor_role=actor_role,
        before_status=action_before,
        after_status=request.status,
        reason=payload.reason,
    )
    return _mutation_response(request, audit_entry, actor_id, actor_role, decision)


# ---------------------------------------------------------------------------
# E. Audit reads (chronological ascending + opaque cursor pagination)
# ---------------------------------------------------------------------------


def list_change_request_audit(
    change_request_id: str,
    action_filter: GovernanceAuditAction | None,
    limit: int | None,
    cursor: str | None,
) -> GovernanceAuditListResponse:
    _get_request_or_404(change_request_id)
    rows = [e for e in _audit if e.change_request_id == change_request_id]
    return _paginate_audit(rows, action_filter, limit, cursor)


def list_project_governance_audit(
    project_id: str,
    action_filter: GovernanceAuditAction | None,
    limit: int | None,
    cursor: str | None,
) -> GovernanceAuditListResponse:
    _ensure_seed()
    rows = [e for e in _audit if e.project_id == project_id]
    return _paginate_audit(rows, action_filter, limit, cursor)


def _paginate_audit(
    rows: list[GovernanceAuditEntry],
    action_filter: GovernanceAuditAction | None,
    limit: int | None,
    cursor: str | None,
) -> GovernanceAuditListResponse:
    if action_filter is not None:
        rows = [e for e in rows if e.action == action_filter]
    # Chronological ascending (oldest -> newest). _audit is append-order.
    rows = sorted(rows, key=lambda e: (e.created_at, e.id))
    total = len(rows)
    offset = _decode_cursor(cursor)
    page_size = _clamp_limit(limit)
    page = rows[offset : offset + page_size]
    next_cursor = (
        _encode_cursor(offset + page_size) if offset + page_size < total else None
    )
    return GovernanceAuditListResponse(
        items=page, total_count=total, next_cursor=next_cursor
    )


# ---------------------------------------------------------------------------
# Authorization helpers
# ---------------------------------------------------------------------------


def _require_proposer(request: OntologyChangeRequest, actor_id: str) -> None:
    if actor_id != request.proposer_id:
        raise _forbidden(
            "PERMISSION_DENIED",
            "only the proposer may perform this action",
        )


def _require_editable(request: OntologyChangeRequest) -> None:
    if request.status not in _EDITABLE_STATUSES:
        raise _conflict(
            "CHANGE_REQUEST_STATE_CONFLICT",
            f"cannot modify a change request in status {request.status.value}",
        )
