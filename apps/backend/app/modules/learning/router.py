from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.errors import ApiErrorResponse
from app.db.session import get_db
from app.modules.learning import service
from app.modules.learning.schemas import (
    AutoApprovalCandidatePreview,
    CorrectionPattern,
    LearningSignalSummaryResponse,
    PromptSuggestion,
    SuggestionDecisionRequest,
    SuggestionDecisionResponse,
)

router = APIRouter(tags=["MVP6.2 Learning"])


@router.get(
    "/projects/{project_id}/learning-signals/summary",
    response_model=LearningSignalSummaryResponse,
    summary="Get MVP6.2 learning signal summary",
    responses={404: {"model": ApiErrorResponse}},
)
def get_learning_signal_summary(
    project_id: str,
    db: Session = Depends(get_db),
) -> LearningSignalSummaryResponse:
    service.project_or_404(db, project_id)
    return service.learning_summary(project_id)


@router.get(
    "/projects/{project_id}/learning-signals/correction-patterns",
    response_model=list[CorrectionPattern],
    summary="List MVP6.2 correction patterns",
    responses={404: {"model": ApiErrorResponse}},
)
def list_correction_patterns(
    project_id: str,
    db: Session = Depends(get_db),
) -> list[CorrectionPattern]:
    service.project_or_404(db, project_id)
    return service.list_correction_patterns(project_id)


@router.get(
    "/projects/{project_id}/learning-signals/prompt-suggestions",
    response_model=list[PromptSuggestion],
    summary="List MVP6.2 prompt improvement suggestions",
    responses={404: {"model": ApiErrorResponse}},
)
def list_prompt_suggestions(
    project_id: str,
    db: Session = Depends(get_db),
) -> list[PromptSuggestion]:
    service.project_or_404(db, project_id)
    return service.list_prompt_suggestions(project_id)


@router.get(
    "/projects/{project_id}/learning-signals/auto-approval-candidates",
    response_model=list[AutoApprovalCandidatePreview],
    summary="List MVP6.2 preview-only auto-approval candidates",
    responses={404: {"model": ApiErrorResponse}},
)
def list_auto_approval_candidates(
    project_id: str,
    db: Session = Depends(get_db),
) -> list[AutoApprovalCandidatePreview]:
    service.project_or_404(db, project_id)
    return service.list_auto_approval_candidates(project_id)


@router.post(
    "/learning-signal-suggestions/{suggestion_id}/decisions",
    response_model=SuggestionDecisionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record MVP6.2 prompt suggestion decision audit note",
    responses={
        400: {"model": ApiErrorResponse},
        404: {"model": ApiErrorResponse},
        409: {"model": ApiErrorResponse},
    },
)
def decide_prompt_suggestion(
    suggestion_id: str,
    payload: SuggestionDecisionRequest,
) -> SuggestionDecisionResponse:
    return service.decide_suggestion(suggestion_id, payload)
