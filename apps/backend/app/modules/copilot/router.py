from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.errors import ApiErrorResponse
from app.db.session import get_db
from app.modules.copilot import service
from app.modules.copilot.schemas import (
    CopilotRiskLabel,
    CopilotSuggestionDecisionRequest,
    CopilotSuggestionDecisionResponse,
    CopilotSuggestionDetailResponse,
    CopilotSuggestionKind,
    CopilotSuggestionListResponse,
    CopilotSuggestionState,
    CopilotSummaryResponse,
)

router = APIRouter(tags=["MVP6.8 Copilot"])


@router.get(
    "/projects/{project_id}/copilot/summary",
    response_model=CopilotSummaryResponse,
    summary="Get project copilot summary",
    responses={403: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}},
)
def get_copilot_summary(
    project_id: str,
    db: Session = Depends(get_db),
) -> CopilotSummaryResponse:
    service.project_or_404(db, project_id)
    return service.summary(project_id)


@router.get(
    "/projects/{project_id}/copilot/suggestions",
    response_model=CopilotSuggestionListResponse,
    summary="List deterministic copilot suggestions",
    responses={403: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}},
)
def list_copilot_suggestions(
    project_id: str,
    kind: CopilotSuggestionKind | None = Query(default=None),
    state: CopilotSuggestionState | None = Query(default=None),
    risk_label: CopilotRiskLabel | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    cursor: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> CopilotSuggestionListResponse:
    service.project_or_404(db, project_id)
    return service.list_suggestions(
        project_id,
        kind=kind,
        state=state,
        risk_label=risk_label,
        limit=limit,
        cursor=cursor,
    )


@router.get(
    "/copilot-suggestions/{suggestion_id}",
    response_model=CopilotSuggestionDetailResponse,
    summary="Get a copilot suggestion by id",
    responses={403: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}},
)
def get_copilot_suggestion(
    suggestion_id: str,
) -> CopilotSuggestionDetailResponse:
    return service.get_suggestion(suggestion_id)


@router.post(
    "/copilot-suggestions/{suggestion_id}/decisions",
    response_model=CopilotSuggestionDecisionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record copilot suggestion decision (audit-only)",
    responses={
        400: {"model": ApiErrorResponse},
        403: {"model": ApiErrorResponse},
        404: {"model": ApiErrorResponse},
        409: {"model": ApiErrorResponse},
        422: {"model": ApiErrorResponse},
    },
)
def create_copilot_suggestion_decision(
    suggestion_id: str,
    payload: CopilotSuggestionDecisionRequest,
    actor_id: str = Query(default="dev-user"),
    actor_role: str = Query(default="PROJECT_MEMBER"),
) -> CopilotSuggestionDecisionResponse:
    return service.decide(
        suggestion_id,
        payload,
        actor_id=actor_id,
        actor_role=actor_role,
    )
