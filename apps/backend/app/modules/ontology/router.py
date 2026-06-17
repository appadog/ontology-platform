from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.enums import OntologyElementStatus, OntologyVersionStatus, ProjectStatus
from app.core.errors import ApiErrorResponse, ApiException
from app.db.session import get_db
from app.modules.ontology.models import (
    OntologyClass as OntologyClassModel,
    OntologyProperty as OntologyPropertyModel,
    OntologyRelation as OntologyRelationModel,
    OntologyVersion as OntologyVersionModel,
)
from app.modules.ontology.schemas import (
    OntologyClass,
    OntologyClassCreateRequest,
    OntologyClassUpdateRequest,
    OntologyGraph,
    OntologyGraphEdge,
    OntologyGraphNode,
    OntologyProperty,
    OntologyPropertyCreateRequest,
    OntologyPropertyUpdateRequest,
    OntologyRelation,
    OntologyRelationCreateRequest,
    OntologyRelationUpdateRequest,
    OntologyVersion,
    OntologyVersionCreateRequest,
)
from app.modules.project.models import Project

router = APIRouter(tags=["Ontology"])


def _not_found(code: str, message: str, **details: str) -> ApiException:
    return ApiException(status_code=404, code=code, message=message, details=details)


def _project_or_404(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if project is None or project.status == ProjectStatus.DELETED:
        raise _not_found("PROJECT_NOT_FOUND", "Project was not found.", project_id=project_id)
    return project


def _version_or_404(db: Session, version_id: str) -> OntologyVersionModel:
    version = db.get(OntologyVersionModel, version_id)
    if version is None:
        raise _not_found(
            "ONTOLOGY_VERSION_NOT_FOUND",
            "Ontology version was not found.",
            version_id=version_id,
        )
    return version


def _draft_version_or_error(db: Session, version_id: str) -> OntologyVersionModel:
    version = _version_or_404(db, version_id)
    if version.status != OntologyVersionStatus.DRAFT:
        raise ApiException(
            status_code=409,
            code="ONTOLOGY_VERSION_LOCKED",
            message="Only DRAFT ontology versions can be modified.",
            details={"version_id": version_id, "status": version.status.value},
        )
    return version


def _class_or_404(db: Session, class_id: str) -> OntologyClassModel:
    ontology_class = db.get(OntologyClassModel, class_id)
    if ontology_class is None or ontology_class.status == OntologyElementStatus.DELETED:
        raise _not_found(
            "ONTOLOGY_CLASS_NOT_FOUND",
            "Ontology class was not found.",
            class_id=class_id,
        )
    return ontology_class


def _property_or_404(db: Session, property_id: str) -> OntologyPropertyModel:
    ontology_property = db.get(OntologyPropertyModel, property_id)
    if ontology_property is None or ontology_property.status == OntologyElementStatus.DELETED:
        raise _not_found(
            "ONTOLOGY_PROPERTY_NOT_FOUND",
            "Ontology property was not found.",
            property_id=property_id,
        )
    return ontology_property


def _relation_or_404(db: Session, relation_id: str) -> OntologyRelationModel:
    relation = db.get(OntologyRelationModel, relation_id)
    if relation is None or relation.status == OntologyElementStatus.DELETED:
        raise _not_found(
            "ONTOLOGY_RELATION_NOT_FOUND",
            "Ontology relation was not found.",
            relation_id=relation_id,
        )
    return relation


def _class_in_version_or_error(
    db: Session, *, class_id: str, version_id: str, field_name: str = "class_id"
) -> OntologyClassModel:
    ontology_class = _class_or_404(db, class_id)
    if ontology_class.version_id != version_id:
        raise ApiException(
            status_code=422,
            code="ONTOLOGY_CLASS_VERSION_MISMATCH",
            message="Ontology class does not belong to the target version.",
            details={field_name: class_id, "version_id": version_id},
        )
    return ontology_class


def _class_schema(ontology_class: OntologyClassModel) -> OntologyClass:
    return OntologyClass.model_validate(ontology_class)


def _property_schema(ontology_property: OntologyPropertyModel) -> OntologyProperty:
    return OntologyProperty.model_validate(ontology_property)


def _relation_schema(relation: OntologyRelationModel) -> OntologyRelation:
    return OntologyRelation.model_validate(relation)


@router.get(
    "/projects/{project_id}/ontology/versions",
    response_model=list[OntologyVersion],
    summary="List ontology versions",
    responses={404: {"model": ApiErrorResponse}},
)
def list_versions(
    project_id: str,
    db: Session = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[OntologyVersion]:
    _project_or_404(db, project_id)
    versions = db.scalars(
        select(OntologyVersionModel)
        .where(OntologyVersionModel.project_id == project_id)
        .order_by(OntologyVersionModel.version.desc())
        .limit(limit)
        .offset(offset)
    ).all()
    return [OntologyVersion.model_validate(version) for version in versions]


@router.post(
    "/projects/{project_id}/ontology/versions",
    response_model=OntologyVersion,
    status_code=status.HTTP_201_CREATED,
    summary="Create draft ontology version",
    responses={404: {"model": ApiErrorResponse}},
)
def create_version(
    project_id: str,
    payload: OntologyVersionCreateRequest | None = None,
    db: Session = Depends(get_db),
) -> OntologyVersion:
    project = _project_or_404(db, project_id)
    next_version = (
        db.scalar(
            select(func.max(OntologyVersionModel.version)).where(
                OntologyVersionModel.project_id == project_id
            )
        )
        or 0
    ) + 1
    version = OntologyVersionModel(
        project_id=project_id,
        version=next_version,
        status=OntologyVersionStatus.DRAFT,
        created_by=(payload.created_by if payload and payload.created_by else settings.dev_user_id),
    )
    db.add(version)
    db.flush()
    project.current_ontology_version_id = version.id
    db.add(project)
    db.commit()
    db.refresh(version)
    return OntologyVersion.model_validate(version)


@router.post(
    "/ontology/versions/{version_id}/publish",
    response_model=OntologyVersion,
    summary="Publish ontology version",
    responses={404: {"model": ApiErrorResponse}, 409: {"model": ApiErrorResponse}},
)
def publish_version(version_id: str, db: Session = Depends(get_db)) -> OntologyVersion:
    version = _version_or_404(db, version_id)
    if version.status == OntologyVersionStatus.ARCHIVED:
        raise ApiException(
            status_code=409,
            code="ONTOLOGY_VERSION_ARCHIVED",
            message="Archived ontology versions cannot be published.",
            details={"version_id": version_id},
        )
    version.status = OntologyVersionStatus.PUBLISHED
    version.published_at = datetime.now(timezone.utc)
    project = db.get(Project, version.project_id)
    if project is not None:
        project.current_ontology_version_id = version.id
        db.add(project)
    db.add(version)
    db.commit()
    db.refresh(version)
    return OntologyVersion.model_validate(version)


@router.get(
    "/ontology/versions/{version_id}/classes",
    response_model=list[OntologyClass],
    summary="List ontology classes",
    responses={404: {"model": ApiErrorResponse}},
)
def list_classes(version_id: str, db: Session = Depends(get_db)) -> list[OntologyClass]:
    _version_or_404(db, version_id)
    classes = db.scalars(
        select(OntologyClassModel)
        .where(
            OntologyClassModel.version_id == version_id,
            OntologyClassModel.status != OntologyElementStatus.DELETED,
        )
        .order_by(OntologyClassModel.created_at.asc())
    ).all()
    return [_class_schema(ontology_class) for ontology_class in classes]


@router.post(
    "/ontology/versions/{version_id}/classes",
    response_model=OntologyClass,
    status_code=status.HTTP_201_CREATED,
    summary="Create ontology class",
    responses={404: {"model": ApiErrorResponse}, 409: {"model": ApiErrorResponse}},
)
def create_class(
    version_id: str, payload: OntologyClassCreateRequest, db: Session = Depends(get_db)
) -> OntologyClass:
    _draft_version_or_error(db, version_id)
    ontology_class = OntologyClassModel(
        version_id=version_id,
        name=payload.name,
        label=payload.label or payload.name,
        description=payload.description,
        position=payload.position.model_dump(),
        status=OntologyElementStatus.ACTIVE,
    )
    db.add(ontology_class)
    db.commit()
    db.refresh(ontology_class)
    return _class_schema(ontology_class)


@router.patch(
    "/ontology/classes/{class_id}",
    response_model=OntologyClass,
    summary="Update ontology class",
    responses={404: {"model": ApiErrorResponse}, 409: {"model": ApiErrorResponse}},
)
def update_class(
    class_id: str, payload: OntologyClassUpdateRequest, db: Session = Depends(get_db)
) -> OntologyClass:
    ontology_class = _class_or_404(db, class_id)
    _draft_version_or_error(db, ontology_class.version_id)
    update_data = payload.model_dump(exclude_unset=True)
    if "position" in update_data and update_data["position"] is not None:
        update_data["position"] = payload.position.model_dump()
    for field, value in update_data.items():
        setattr(ontology_class, field, value)
    if ontology_class.label is None:
        ontology_class.label = ontology_class.name
    db.add(ontology_class)
    db.commit()
    db.refresh(ontology_class)
    return _class_schema(ontology_class)


@router.delete(
    "/ontology/classes/{class_id}",
    response_model=OntologyClass,
    summary="Delete ontology class",
    responses={404: {"model": ApiErrorResponse}, 409: {"model": ApiErrorResponse}},
)
def delete_class(class_id: str, db: Session = Depends(get_db)) -> OntologyClass:
    ontology_class = _class_or_404(db, class_id)
    _draft_version_or_error(db, ontology_class.version_id)
    ontology_class.status = OntologyElementStatus.DELETED
    db.add(ontology_class)
    db.commit()
    db.refresh(ontology_class)
    return _class_schema(ontology_class)


@router.get(
    "/ontology/versions/{version_id}/properties",
    response_model=list[OntologyProperty],
    summary="List ontology properties",
    responses={404: {"model": ApiErrorResponse}},
)
def list_properties(version_id: str, db: Session = Depends(get_db)) -> list[OntologyProperty]:
    _version_or_404(db, version_id)
    properties = db.scalars(
        select(OntologyPropertyModel)
        .where(
            OntologyPropertyModel.version_id == version_id,
            OntologyPropertyModel.status != OntologyElementStatus.DELETED,
        )
        .order_by(OntologyPropertyModel.created_at.asc())
    ).all()
    return [_property_schema(ontology_property) for ontology_property in properties]


@router.post(
    "/ontology/versions/{version_id}/properties",
    response_model=OntologyProperty,
    status_code=status.HTTP_201_CREATED,
    summary="Create ontology property",
    responses={404: {"model": ApiErrorResponse}, 409: {"model": ApiErrorResponse}},
)
def create_property(
    version_id: str, payload: OntologyPropertyCreateRequest, db: Session = Depends(get_db)
) -> OntologyProperty:
    _draft_version_or_error(db, version_id)
    _class_in_version_or_error(db, class_id=payload.class_id, version_id=version_id)
    ontology_property = OntologyPropertyModel(
        version_id=version_id,
        class_id=payload.class_id,
        name=payload.name,
        label=payload.label or payload.name,
        description=payload.description,
        data_type=payload.data_type,
        cardinality=payload.cardinality,
        required=payload.required,
        status=OntologyElementStatus.ACTIVE,
    )
    db.add(ontology_property)
    db.commit()
    db.refresh(ontology_property)
    return _property_schema(ontology_property)


@router.patch(
    "/ontology/properties/{property_id}",
    response_model=OntologyProperty,
    summary="Update ontology property",
    responses={404: {"model": ApiErrorResponse}, 409: {"model": ApiErrorResponse}},
)
def update_property(
    property_id: str, payload: OntologyPropertyUpdateRequest, db: Session = Depends(get_db)
) -> OntologyProperty:
    ontology_property = _property_or_404(db, property_id)
    _draft_version_or_error(db, ontology_property.version_id)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ontology_property, field, value)
    if ontology_property.label is None:
        ontology_property.label = ontology_property.name
    db.add(ontology_property)
    db.commit()
    db.refresh(ontology_property)
    return _property_schema(ontology_property)


@router.delete(
    "/ontology/properties/{property_id}",
    response_model=OntologyProperty,
    summary="Delete ontology property",
    responses={404: {"model": ApiErrorResponse}, 409: {"model": ApiErrorResponse}},
)
def delete_property(property_id: str, db: Session = Depends(get_db)) -> OntologyProperty:
    ontology_property = _property_or_404(db, property_id)
    _draft_version_or_error(db, ontology_property.version_id)
    ontology_property.status = OntologyElementStatus.DELETED
    db.add(ontology_property)
    db.commit()
    db.refresh(ontology_property)
    return _property_schema(ontology_property)


@router.get(
    "/ontology/versions/{version_id}/relations",
    response_model=list[OntologyRelation],
    summary="List ontology relations",
    responses={404: {"model": ApiErrorResponse}},
)
def list_relations(version_id: str, db: Session = Depends(get_db)) -> list[OntologyRelation]:
    _version_or_404(db, version_id)
    relations = db.scalars(
        select(OntologyRelationModel)
        .where(
            OntologyRelationModel.version_id == version_id,
            OntologyRelationModel.status != OntologyElementStatus.DELETED,
        )
        .order_by(OntologyRelationModel.created_at.asc())
    ).all()
    return [_relation_schema(relation) for relation in relations]


@router.post(
    "/ontology/versions/{version_id}/relations",
    response_model=OntologyRelation,
    status_code=status.HTTP_201_CREATED,
    summary="Create ontology relation",
    responses={404: {"model": ApiErrorResponse}, 409: {"model": ApiErrorResponse}},
)
def create_relation(
    version_id: str, payload: OntologyRelationCreateRequest, db: Session = Depends(get_db)
) -> OntologyRelation:
    _draft_version_or_error(db, version_id)
    _class_in_version_or_error(
        db, class_id=payload.domain_class_id, version_id=version_id, field_name="domain_class_id"
    )
    _class_in_version_or_error(
        db, class_id=payload.range_class_id, version_id=version_id, field_name="range_class_id"
    )
    relation = OntologyRelationModel(
        version_id=version_id,
        name=payload.name,
        label=payload.label or payload.name,
        description=payload.description,
        domain_class_id=payload.domain_class_id,
        range_class_id=payload.range_class_id,
        cardinality=payload.cardinality,
        required=payload.required,
        status=OntologyElementStatus.ACTIVE,
    )
    db.add(relation)
    db.commit()
    db.refresh(relation)
    return _relation_schema(relation)


@router.patch(
    "/ontology/relations/{relation_id}",
    response_model=OntologyRelation,
    summary="Update ontology relation",
    responses={404: {"model": ApiErrorResponse}, 409: {"model": ApiErrorResponse}},
)
def update_relation(
    relation_id: str, payload: OntologyRelationUpdateRequest, db: Session = Depends(get_db)
) -> OntologyRelation:
    relation = _relation_or_404(db, relation_id)
    _draft_version_or_error(db, relation.version_id)
    update_data = payload.model_dump(exclude_unset=True)
    if "domain_class_id" in update_data and update_data["domain_class_id"] is not None:
        _class_in_version_or_error(
            db,
            class_id=update_data["domain_class_id"],
            version_id=relation.version_id,
            field_name="domain_class_id",
        )
    if "range_class_id" in update_data and update_data["range_class_id"] is not None:
        _class_in_version_or_error(
            db,
            class_id=update_data["range_class_id"],
            version_id=relation.version_id,
            field_name="range_class_id",
        )
    for field, value in update_data.items():
        setattr(relation, field, value)
    if relation.label is None:
        relation.label = relation.name
    db.add(relation)
    db.commit()
    db.refresh(relation)
    return _relation_schema(relation)


@router.delete(
    "/ontology/relations/{relation_id}",
    response_model=OntologyRelation,
    summary="Delete ontology relation",
    responses={404: {"model": ApiErrorResponse}, 409: {"model": ApiErrorResponse}},
)
def delete_relation(relation_id: str, db: Session = Depends(get_db)) -> OntologyRelation:
    relation = _relation_or_404(db, relation_id)
    _draft_version_or_error(db, relation.version_id)
    relation.status = OntologyElementStatus.DELETED
    db.add(relation)
    db.commit()
    db.refresh(relation)
    return _relation_schema(relation)


@router.get(
    "/ontology/versions/{version_id}/graph",
    response_model=OntologyGraph,
    summary="Get ontology modeler graph",
    responses={404: {"model": ApiErrorResponse}},
)
def get_graph(version_id: str, db: Session = Depends(get_db)) -> OntologyGraph:
    version = _version_or_404(db, version_id)
    classes = list_classes(version_id, db)
    properties = list_properties(version_id, db)
    class_ids = {ontology_class.id for ontology_class in classes}
    relations = [
        relation
        for relation in list_relations(version_id, db)
        if relation.domain_class_id in class_ids and relation.range_class_id in class_ids
    ]
    nodes = [
        OntologyGraphNode(
            id=ontology_class.id,
            class_id=ontology_class.id,
            label=ontology_class.label or ontology_class.name,
            position=ontology_class.position,
            status=ontology_class.status,
        )
        for ontology_class in classes
    ]
    edges = [
        OntologyGraphEdge(
            id=relation.id,
            relation_id=relation.id,
            source_class_id=relation.domain_class_id,
            target_class_id=relation.range_class_id,
            label=relation.label or relation.name,
            cardinality=relation.cardinality,
            status=relation.status,
        )
        for relation in relations
    ]
    return OntologyGraph(
        version_id=version.id,
        version_status=version.status,
        nodes=nodes,
        edges=edges,
        properties=properties,
        classes=classes,
        relations=relations,
    )
