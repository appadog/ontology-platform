from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.enums import ProjectStatus
from app.core.errors import ApiErrorResponse, ApiException
from app.db.session import get_db
from app.modules.project.models import Project
from app.modules.prompt.models import PromptTemplate as PromptTemplateModel
from app.modules.prompt.models import PromptVersion as PromptVersionModel
from app.modules.prompt.schemas import (
    PromptTemplate,
    PromptTemplateCreateRequest,
    PromptVersion,
    PromptVersionCreateRequest,
)

router = APIRouter(tags=["Prompt"])


def _not_found(code: str, message: str, **details: str) -> ApiException:
    return ApiException(status_code=404, code=code, message=message, details=details)


def _project_or_404(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if project is None or project.status == ProjectStatus.DELETED:
        raise _not_found("PROJECT_NOT_FOUND", "Project was not found.", project_id=project_id)
    return project


def _prompt_or_404(db: Session, prompt_id: str) -> PromptTemplateModel:
    prompt = db.get(PromptTemplateModel, prompt_id)
    if prompt is None:
        raise _not_found(
            "PROMPT_TEMPLATE_NOT_FOUND",
            "Prompt template was not found.",
            prompt_id=prompt_id,
        )
    return prompt


@router.get(
    "/projects/{project_id}/prompts",
    response_model=list[PromptTemplate],
    summary="List prompt templates",
    responses={404: {"model": ApiErrorResponse}},
)
def list_prompt_templates(
    project_id: str,
    db: Session = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[PromptTemplate]:
    _project_or_404(db, project_id)
    prompts = db.scalars(
        select(PromptTemplateModel)
        .where(PromptTemplateModel.project_id == project_id)
        .order_by(PromptTemplateModel.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()
    return [PromptTemplate.model_validate(prompt) for prompt in prompts]


@router.post(
    "/projects/{project_id}/prompts",
    response_model=PromptTemplate,
    status_code=status.HTTP_201_CREATED,
    summary="Create prompt template",
    responses={404: {"model": ApiErrorResponse}},
)
def create_prompt_template(
    project_id: str, payload: PromptTemplateCreateRequest, db: Session = Depends(get_db)
) -> PromptTemplate:
    _project_or_404(db, project_id)
    prompt = PromptTemplateModel(
        project_id=project_id,
        name=payload.name,
        description=payload.description,
    )
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return PromptTemplate.model_validate(prompt)


@router.get(
    "/prompts/{prompt_id}/versions",
    response_model=list[PromptVersion],
    summary="List prompt versions",
    responses={404: {"model": ApiErrorResponse}},
)
def list_prompt_versions(
    prompt_id: str,
    db: Session = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[PromptVersion]:
    _prompt_or_404(db, prompt_id)
    versions = db.scalars(
        select(PromptVersionModel)
        .where(PromptVersionModel.prompt_template_id == prompt_id)
        .order_by(PromptVersionModel.version.desc())
        .limit(limit)
        .offset(offset)
    ).all()
    return [PromptVersion.model_validate(version) for version in versions]


@router.post(
    "/prompts/{prompt_id}/versions",
    response_model=PromptVersion,
    status_code=status.HTTP_201_CREATED,
    summary="Create prompt version",
    responses={404: {"model": ApiErrorResponse}},
)
def create_prompt_version(
    prompt_id: str, payload: PromptVersionCreateRequest, db: Session = Depends(get_db)
) -> PromptVersion:
    _prompt_or_404(db, prompt_id)
    next_version = (
        db.scalar(
            select(func.max(PromptVersionModel.version)).where(
                PromptVersionModel.prompt_template_id == prompt_id
            )
        )
        or 0
    ) + 1
    if payload.is_active:
        active_versions = db.scalars(
            select(PromptVersionModel).where(
                PromptVersionModel.prompt_template_id == prompt_id,
                PromptVersionModel.is_active.is_(True),
            )
        ).all()
        for version in active_versions:
            version.is_active = False
            db.add(version)
    prompt_version = PromptVersionModel(
        prompt_template_id=prompt_id,
        version=next_version,
        template=payload.template,
        output_schema=payload.output_schema,
        is_active=payload.is_active,
        created_by=payload.created_by or settings.dev_user_id,
    )
    db.add(prompt_version)
    db.commit()
    db.refresh(prompt_version)
    return PromptVersion.model_validate(prompt_version)
