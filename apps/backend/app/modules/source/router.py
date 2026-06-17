from pathlib import Path
import re
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.enums import (
    ProfileInferredType,
    ProjectStatus,
    SourcePreviewStatus,
    SourceSegmentType,
    SourceStatus,
    SourceType,
)
from app.core.errors import ApiErrorResponse, ApiException
from app.db.session import get_db
from app.modules.project.models import Project
from app.modules.source.models import (
    SourceData as SourceDataModel,
    SourceProfile as SourceProfileModel,
    SourceSegment as SourceSegmentModel,
)
from app.modules.source.preview import PreviewResult, build_preview
from app.modules.source.schemas import (
    SourceData,
    SourceParseRequest,
    SourceParseResponse,
    SourcePreview,
    SourcePreviewColumn,
    SourceProfile,
    SourceProfileColumn,
    SourceSegment,
)

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


def _to_source_profile(profile: SourceProfileModel) -> SourceProfile:
    return SourceProfile(
        id=profile.id,
        source_id=profile.source_id,
        columns=[SourceProfileColumn.model_validate(column) for column in profile.columns],
        row_count=profile.row_count,
        sample_size=profile.sample_size,
        warnings=profile.warnings,
        created_at=profile.created_at,
    )


def _to_source_segment(segment: SourceSegmentModel) -> SourceSegment:
    return SourceSegment(
        id=segment.id,
        source_id=segment.source_id,
        segment_type=segment.segment_type,
        sequence=segment.sequence,
        row_index=segment.row_index,
        column_name=segment.column_name,
        page_number=segment.page_number,
        section_title=segment.section_title,
        paragraph_index=segment.paragraph_index,
        chunk_index=segment.chunk_index,
        text=segment.text,
        metadata=segment.metadata_ or {},
        created_at=segment.created_at,
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


def _source_file_path(source: SourceDataModel) -> Path:
    return _storage_root() / "sources" / source.project_id / source.id / source.file_name


def _read_source_bytes(source: SourceDataModel) -> bytes:
    path = _source_file_path(source)
    if not path.exists():
        raise ApiException(
            status_code=409,
            code="SOURCE_FILE_NOT_FOUND",
            message="Source file is not available in local storage.",
            details={"source_id": source.id, "path": str(path)},
        )
    return path.read_bytes()


def _decode_text(content: bytes) -> tuple[str, str | None]:
    for encoding in ("utf-8-sig", "utf-8", "cp949"):
        try:
            text = content.decode(encoding)
            warning = None if encoding != "cp949" else "Source decoded with cp949."
            return text, warning
        except UnicodeDecodeError:
            continue
    return content.decode("utf-8", errors="replace"), "Source contained invalid UTF-8 bytes."


def _not_available_preview(source_type: SourceType) -> PreviewResult:
    return PreviewResult(
        columns=[],
        rows=[],
        row_count_sampled=0,
        total_row_count=0,
        sheet_name=None,
        warnings=[f"Preview is not available for {source_type.value} sources in MVP 1."],
    )


def _profile_columns(source: SourceDataModel) -> list[dict]:
    columns: list[dict] = []
    sample_size = max(source.row_count_sampled, 0)
    for column in source.preview_columns:
        name = column.get("name", "column")
        values = [row.get(name) for row in source.preview_rows]
        non_empty_values = [value for value in values if value not in (None, "")]
        distinct_values = []
        for value in non_empty_values:
            if value not in distinct_values:
                distinct_values.append(value)
        null_count = max(sample_size - len(non_empty_values), 0)
        null_ratio = round(null_count / sample_size, 4) if sample_size else 0.0
        distinct_count = len(distinct_values)
        candidate_key_score = 0.0
        if sample_size and null_count == 0:
            candidate_key_score = round(distinct_count / sample_size, 4)
        columns.append(
            {
                "name": name,
                "inferred_type": _profile_type(column.get("data_type")).value,
                "nullable": bool(column.get("nullable", False)),
                "null_ratio": null_ratio,
                "distinct_count_sampled": distinct_count,
                "sample_values": column.get("sample_values", []),
                "candidate_key_score": candidate_key_score,
            }
        )
    return columns


def _profile_type(value: str | None) -> ProfileInferredType:
    if value in ProfileInferredType.__members__:
        return ProfileInferredType[value]
    return ProfileInferredType.UNKNOWN


def _row_text(row: dict) -> str:
    return " | ".join(f"{key}={value}" for key, value in row.items() if value not in (None, ""))


def _chunk_text(text: str, chunk_size: int) -> list[str]:
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return []
    return [cleaned[index : index + chunk_size] for index in range(0, len(cleaned), chunk_size)]


def _segment_type_values(segments: list[SourceSegmentModel]) -> list[SourceSegmentType]:
    values: list[SourceSegmentType] = []
    for segment in segments:
        if segment.segment_type not in values:
            values.append(segment.segment_type)
    return values


def _existing_segments(db: Session, source_id: str) -> list[SourceSegmentModel]:
    return db.scalars(
        select(SourceSegmentModel)
        .where(SourceSegmentModel.source_id == source_id)
        .order_by(SourceSegmentModel.sequence.asc(), SourceSegmentModel.created_at.asc())
    ).all()


def _create_table_segments(source: SourceDataModel) -> list[SourceSegmentModel]:
    segments: list[SourceSegmentModel] = [
        SourceSegmentModel(
            source_id=source.id,
            segment_type=SourceSegmentType.SHEET,
            sequence=0,
            text=source.sheet_name or source.file_name,
            metadata_={
                "sheet_name": source.sheet_name,
                "row_count_sampled": source.row_count_sampled,
                "total_row_count": source.total_row_count,
            },
        )
    ]
    sequence = 1
    for row_index, row in enumerate(source.preview_rows, start=1):
        row_text = _row_text(row)
        segments.append(
            SourceSegmentModel(
                source_id=source.id,
                segment_type=SourceSegmentType.ROW,
                sequence=sequence,
                row_index=row_index,
                text=row_text,
                metadata_={"row": row},
            )
        )
        sequence += 1
        for column_name, value in row.items():
            segments.append(
                SourceSegmentModel(
                    source_id=source.id,
                    segment_type=SourceSegmentType.CELL,
                    sequence=sequence,
                    row_index=row_index,
                    column_name=column_name,
                    text=None if value is None else str(value),
                    metadata_={"value": value},
                )
            )
            sequence += 1
    return segments


def _create_text_segments(
    source: SourceDataModel, *, chunk_size: int
) -> tuple[list[SourceSegmentModel], list[str]]:
    content = _read_source_bytes(source)
    text, decode_warning = _decode_text(content)
    warnings: list[str] = []
    if decode_warning:
        warnings.append(decode_warning)
    segments: list[SourceSegmentModel] = []
    sequence = 0
    if source.source_type == SourceType.PDF:
        warnings.append("PDF parse uses deterministic byte decoding in this thin slice.")
        segments.append(
            SourceSegmentModel(
                source_id=source.id,
                segment_type=SourceSegmentType.PAGE,
                sequence=sequence,
                page_number=1,
                text=None,
                metadata_={"parser": "deterministic-byte-decode"},
            )
        )
        sequence += 1
        for chunk_index, chunk in enumerate(_chunk_text(text, chunk_size), start=1):
            segments.append(
                SourceSegmentModel(
                    source_id=source.id,
                    segment_type=SourceSegmentType.CHUNK,
                    sequence=sequence,
                    page_number=1,
                    chunk_index=chunk_index,
                    text=chunk,
                    metadata_={"parser": "deterministic-byte-decode"},
                )
            )
            sequence += 1
        return segments, warnings

    paragraphs = [
        paragraph.strip()
        for paragraph in re.split(r"\n\s*\n", text)
        if paragraph and paragraph.strip()
    ]
    if not paragraphs and text.strip():
        paragraphs = [text.strip()]
    for paragraph_index, paragraph in enumerate(paragraphs, start=1):
        segments.append(
            SourceSegmentModel(
                source_id=source.id,
                segment_type=SourceSegmentType.PARAGRAPH,
                sequence=sequence,
                paragraph_index=paragraph_index,
                text=paragraph,
                metadata_={},
            )
        )
        sequence += 1
        for chunk_index, chunk in enumerate(_chunk_text(paragraph, chunk_size), start=1):
            segments.append(
                SourceSegmentModel(
                    source_id=source.id,
                    segment_type=SourceSegmentType.CHUNK,
                    sequence=sequence,
                    paragraph_index=paragraph_index,
                    chunk_index=chunk_index,
                    text=chunk,
                    metadata_={},
                )
            )
            sequence += 1
    return segments, warnings


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


@router.post(
    "/sources/{source_id}/profile",
    response_model=SourceProfile,
    summary="Build source profile",
    responses={404: {"model": ApiErrorResponse}},
)
def build_source_profile(source_id: str, db: Session = Depends(get_db)) -> SourceProfile:
    source = _source_or_404(db, source_id)
    profile = db.scalar(select(SourceProfileModel).where(SourceProfileModel.source_id == source_id))
    if profile is not None:
        return _to_source_profile(profile)

    warnings = list(source.preview_warnings or [])
    columns: list[dict] = []
    row_count = 0
    sample_size = 0
    if source.source_type in {SourceType.CSV, SourceType.EXCEL}:
        columns = _profile_columns(source)
        row_count = source.total_row_count
        sample_size = source.row_count_sampled
    else:
        warnings.append(
            f"Column profiling is not available for {source.source_type.value} sources."
        )

    profile = SourceProfileModel(
        source_id=source.id,
        columns=columns,
        row_count=row_count,
        sample_size=sample_size,
        warnings=warnings,
    )
    source.status = SourceStatus.PROFILED
    db.add(profile)
    db.add(source)
    db.commit()
    db.refresh(profile)
    return _to_source_profile(profile)


@router.get(
    "/sources/{source_id}/profile",
    response_model=SourceProfile,
    summary="Get source profile",
    responses={404: {"model": ApiErrorResponse}},
)
def get_source_profile(source_id: str, db: Session = Depends(get_db)) -> SourceProfile:
    _source_or_404(db, source_id)
    profile = db.scalar(select(SourceProfileModel).where(SourceProfileModel.source_id == source_id))
    if profile is None:
        raise ApiException(
            status_code=404,
            code="SOURCE_PROFILE_NOT_FOUND",
            message="Source profile was not found.",
            details={"source_id": source_id},
        )
    return _to_source_profile(profile)


@router.post(
    "/sources/{source_id}/parse",
    response_model=SourceParseResponse,
    summary="Parse source into deterministic local segments",
    responses={404: {"model": ApiErrorResponse}, 409: {"model": ApiErrorResponse}},
)
def parse_source(
    source_id: str,
    payload: SourceParseRequest | None = None,
    db: Session = Depends(get_db),
) -> SourceParseResponse:
    source = _source_or_404(db, source_id)
    existing_segments = _existing_segments(db, source_id)
    if existing_segments:
        return SourceParseResponse(
            source_id=source.id,
            segment_count=len(existing_segments),
            segment_types=_segment_type_values(existing_segments),
            warnings=[],
        )

    parse_options = payload or SourceParseRequest()
    warnings: list[str] = []
    if source.source_type in {SourceType.CSV, SourceType.EXCEL}:
        segments = _create_table_segments(source)
    else:
        segments, warnings = _create_text_segments(source, chunk_size=parse_options.chunk_size)

    for segment in segments:
        db.add(segment)
    source.status = SourceStatus.EXTRACTION_READY if segments else SourceStatus.PARSED
    db.add(source)
    db.commit()
    created_segments = _existing_segments(db, source_id)
    return SourceParseResponse(
        source_id=source.id,
        segment_count=len(created_segments),
        segment_types=_segment_type_values(created_segments),
        warnings=warnings,
    )


@router.get(
    "/sources/{source_id}/segments",
    response_model=list[SourceSegment],
    summary="List source segments",
    responses={404: {"model": ApiErrorResponse}},
)
def list_source_segments(
    source_id: str,
    db: Session = Depends(get_db),
    segment_type: SourceSegmentType | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> list[SourceSegment]:
    _source_or_404(db, source_id)
    statement = select(SourceSegmentModel).where(SourceSegmentModel.source_id == source_id)
    if segment_type is not None:
        statement = statement.where(SourceSegmentModel.segment_type == segment_type)
    segments = db.scalars(
        statement.order_by(SourceSegmentModel.sequence.asc()).limit(limit).offset(offset)
    ).all()
    return [_to_source_segment(segment) for segment in segments]


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
