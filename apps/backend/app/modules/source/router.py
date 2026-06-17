from pathlib import Path
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.enums import ProjectStatus, SourcePreviewStatus, SourceStatus, SourceType
from app.core.errors import ApiErrorResponse, ApiException
from app.db.session import get_db
from app.modules.project.models import Project
from app.modules.source.models import SourceData as SourceDataModel
from app.modules.source.preview import PreviewResult, build_preview
from app.modules.source.schemas import SourceData, SourcePreview, SourcePreviewColumn

router = APIRouter(tags=["Source"])


def _project_or_404(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if project is None or project.status == ProjectStatus.DELETED:
        raise ApiException(
            status_code=404,
            code="PROJECT_NOT_FOUND",
            message="Project was not found.",
            details={"project_id": project_id},
        )
    return project


def _source_or_404(db: Session, source_id: str) -> SourceDataModel:
    source = db.get(SourceDataModel, source_id)
    if source is None or source.is_deleted:
        raise ApiException(
            status_code=404,
            code="SOURCE_NOT_FOUND",
            message="Source data was not found.",
            details={"source_id": source_id},
        )
    return source


def _to_source_data(source: SourceDataModel) -> SourceData:
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


def _to_source_preview(source: SourceDataModel) -> SourcePreview:
    return SourcePreview(
        source_id=source.id,
        columns=[SourcePreviewColumn.model_validate(column) for column in source.preview_columns],
        rows=source.preview_rows,
        row_count_sampled=source.row_count_sampled,
        total_row_count=source.total_row_count,
        sheet_name=source.sheet_name,
        warnings=source.preview_warnings,
    )


def _safe_file_name(file_name: str | None) -> str:
    name = Path(file_name or "upload.bin").name.strip()
    return name or "upload.bin"


def _storage_root() -> Path:
    return Path(settings.local_storage_path)


def _write_upload(project_id: str, source_id: str, file_name: str, content: bytes) -> str:
    target_dir = _storage_root() / "sources" / project_id / source_id
    target_dir.mkdir(parents=True, exist_ok=True)
    (target_dir / file_name).write_bytes(content)
    return f"local://sources/{source_id}/{file_name}"


def _not_available_preview(source_type: SourceType) -> PreviewResult:
    return PreviewResult(
        columns=[],
        rows=[],
        row_count_sampled=0,
        total_row_count=0,
        sheet_name=None,
        warnings=[f"Preview is not available for {source_type.value} sources in MVP 1."],
    )


@router.get(
    "/projects/{project_id}/sources",
    response_model=list[SourceData],
    summary="List source data",
    responses={404: {"model": ApiErrorResponse}},
)
def list_sources(
    project_id: str,
    db: Session = Depends(get_db),
    source_type: SourceType | None = Query(default=None),
    preview_status: SourcePreviewStatus | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[SourceData]:
    _project_or_404(db, project_id)
    statement = select(SourceDataModel).where(
        SourceDataModel.project_id == project_id,
        SourceDataModel.is_deleted.is_(False),
    )
    if source_type is not None:
        statement = statement.where(SourceDataModel.source_type == source_type)
    if preview_status is not None:
        statement = statement.where(SourceDataModel.preview_status == preview_status)
    sources = db.scalars(
        statement.order_by(SourceDataModel.uploaded_at.desc()).limit(limit).offset(offset)
    ).all()
    return [_to_source_data(source) for source in sources]


@router.post(
    "/projects/{project_id}/sources/upload",
    response_model=SourceData,
    status_code=status.HTTP_201_CREATED,
    summary="Upload source data",
    responses={404: {"model": ApiErrorResponse}},
)
async def upload_source(
    project_id: str,
    source_type: Annotated[SourceType, Form()],
    file: Annotated[UploadFile, File()],
    display_name: Annotated[str | None, Form()] = None,
    db: Session = Depends(get_db),
) -> SourceData:
    _project_or_404(db, project_id)
    source_id = str(uuid4())
    file_name = _safe_file_name(file.filename)
    content = await file.read()
    storage_uri = _write_upload(project_id, source_id, file_name, content)
    preview_status = SourcePreviewStatus.NOT_AVAILABLE
    status_value = SourceStatus.UPLOADED
    preview = _not_available_preview(source_type)
    if source_type in {SourceType.CSV, SourceType.EXCEL}:
        preview = build_preview(source_type, content)
        preview_status = SourcePreviewStatus.READY
        if preview.warnings and not preview.rows and not preview.columns:
            preview_status = SourcePreviewStatus.FAILED
            status_value = SourceStatus.FAILED

    source = SourceDataModel(
        id=source_id,
        project_id=project_id,
        file_name=file_name,
        source_type=source_type,
        mime_type=file.content_type,
        size_bytes=len(content),
        status=status_value,
        preview_status=preview_status,
        storage_uri=storage_uri,
        created_by=settings.dev_user_id,
        metadata_={"display_name": display_name} if display_name else {},
        preview_columns=preview.columns,
        preview_rows=preview.rows,
        row_count_sampled=preview.row_count_sampled,
        total_row_count=preview.total_row_count,
        sheet_name=preview.sheet_name,
        preview_warnings=preview.warnings,
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return _to_source_data(source)


@router.get(
    "/sources/{source_id}",
    response_model=SourceData,
    summary="Get source data detail",
    responses={404: {"model": ApiErrorResponse}},
)
def get_source(source_id: str, db: Session = Depends(get_db)) -> SourceData:
    return _to_source_data(_source_or_404(db, source_id))


@router.get(
    "/sources/{source_id}/preview",
    response_model=SourcePreview,
    summary="Get source preview",
    responses={404: {"model": ApiErrorResponse}},
)
def get_source_preview(source_id: str, db: Session = Depends(get_db)) -> SourcePreview:
    return _to_source_preview(_source_or_404(db, source_id))


@router.delete(
    "/sources/{source_id}",
    response_model=SourceData,
    summary="Archive source data",
    responses={404: {"model": ApiErrorResponse}},
)
def archive_source(source_id: str, db: Session = Depends(get_db)) -> SourceData:
    source = _source_or_404(db, source_id)
    source.is_deleted = True
    db.add(source)
    db.commit()
    db.refresh(source)
    return _to_source_data(source)
