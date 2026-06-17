from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.enums import ProjectStatus
from app.core.errors import ApiException, ApiErrorResponse
from app.db.session import get_db
from app.modules.ontology.models import OntologyVersion
from app.modules.project.models import Project
from app.modules.project.schemas import ProjectCreateRequest, ProjectDetail, ProjectSummary, ProjectUpdateRequest
from app.modules.source.models import SourceData

router = APIRouter(prefix="/projects", tags=["Project"])


def _ontology_version_count(db: Session, project_id: str) -> int:
    return db.scalar(
        select(func.count()).select_from(OntologyVersion).where(OntologyVersion.project_id == project_id)
    ) or 0


def _source_count(db: Session, project_id: str) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(SourceData)
            .where(SourceData.project_id == project_id, SourceData.is_deleted.is_(False))
        )
        or 0
    )


def _to_summary(db: Session, project: Project) -> ProjectSummary:
    return ProjectSummary(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        created_at=project.created_at,
        updated_at=project.updated_at,
        source_count=_source_count(db, project.id),
        ontology_version_count=_ontology_version_count(db, project.id),
    )


def _to_detail(db: Session, project: Project) -> ProjectDetail:
    return ProjectDetail(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        current_ontology_version_id=project.current_ontology_version_id,
        source_count=_source_count(db, project.id),
        ontology_version_count=_ontology_version_count(db, project.id),
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


def get_project_or_404(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if project is None or project.status == ProjectStatus.DELETED:
        raise ApiException(
            status_code=404,
            code="PROJECT_NOT_FOUND",
            message="Project was not found.",
            details={"project_id": project_id},
        )
    return project


@router.get(
    "",
    response_model=list[ProjectSummary],
    summary="List projects",
    responses={404: {"model": ApiErrorResponse}},
)
def list_projects(
    db: Session = Depends(get_db),
    status_filter: ProjectStatus | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[ProjectSummary]:
    statement = select(Project).where(Project.status != ProjectStatus.DELETED)
    if status_filter is not None:
        statement = statement.where(Project.status == status_filter)
    statement = statement.order_by(Project.created_at.desc()).limit(limit).offset(offset)
    projects = db.scalars(statement).all()
    return [_to_summary(db, project) for project in projects]


@router.post(
    "",
    response_model=ProjectDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Create project",
)
def create_project(payload: ProjectCreateRequest, db: Session = Depends(get_db)) -> ProjectDetail:
    project = Project(
        name=payload.name,
        description=payload.description,
        status=ProjectStatus.ACTIVE,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return _to_detail(db, project)


@router.get(
    "/{project_id}",
    response_model=ProjectDetail,
    summary="Get project detail",
    responses={404: {"model": ApiErrorResponse}},
)
def get_project(project_id: str, db: Session = Depends(get_db)) -> ProjectDetail:
    return _to_detail(db, get_project_or_404(db, project_id))


@router.patch(
    "/{project_id}",
    response_model=ProjectDetail,
    summary="Update project",
    responses={404: {"model": ApiErrorResponse}},
)
def update_project(
    project_id: str, payload: ProjectUpdateRequest, db: Session = Depends(get_db)
) -> ProjectDetail:
    project = get_project_or_404(db, project_id)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    db.add(project)
    db.commit()
    db.refresh(project)
    return _to_detail(db, project)


@router.delete(
    "/{project_id}",
    response_model=ProjectDetail,
    summary="Archive project",
    responses={404: {"model": ApiErrorResponse}},
)
def archive_project(project_id: str, db: Session = Depends(get_db)) -> ProjectDetail:
    project = get_project_or_404(db, project_id)
    project.status = ProjectStatus.ARCHIVED
    db.add(project)
    db.commit()
    db.refresh(project)
    return _to_detail(db, project)
