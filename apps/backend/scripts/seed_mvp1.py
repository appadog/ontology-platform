from __future__ import annotations

import sys
from pathlib import Path

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.core.enums import (
    Cardinality,
    OntologyElementStatus,
    OntologyVersionStatus,
    ProjectStatus,
    PropertyDataType,
    SourcePreviewStatus,
    SourceStatus,
    SourceType,
)
from app.db.session import SessionLocal
from app.modules.ontology.models import (
    OntologyClass,
    OntologyProperty,
    OntologyRelation,
    OntologyVersion,
)
from app.modules.project.models import Project
from app.modules.source.models import SourceData
from app.modules.source.preview import build_preview

DEMO_PROJECT_NAME = "기업 문서 온톨로지 Demo"


def main() -> None:
    seed_csv = Path(__file__).resolve().parents[3] / "infra/local/seed/companies.csv"
    with SessionLocal() as db:
        project = db.scalar(select(Project).where(Project.name == DEMO_PROJECT_NAME))
        if project is None:
            project = Project(
                name=DEMO_PROJECT_NAME,
                description="MVP 1 demo project seeded by backend.",
                status=ProjectStatus.ACTIVE,
            )
            db.add(project)
            db.flush()

        version = db.scalar(
            select(OntologyVersion).where(
                OntologyVersion.project_id == project.id,
                OntologyVersion.version == 1,
            )
        )
        if version is None:
            version = OntologyVersion(
                project_id=project.id,
                version=1,
                status=OntologyVersionStatus.DRAFT,
                created_by=settings.dev_user_id,
            )
            db.add(version)
            db.flush()
            project.current_ontology_version_id = version.id

        classes = _ensure_classes(db, version.id)
        _ensure_properties(db, version.id, classes)
        _ensure_relations(db, version.id, classes)
        _ensure_source(db, project.id, seed_csv)
        db.add(project)
        db.commit()
        print(f"Seeded MVP 1 demo project: {project.id}")


def _ensure_classes(db, version_id: str) -> dict[str, OntologyClass]:
    definitions = {
        "Company": {"x": 120, "y": 120},
        "Person": {"x": 320, "y": 120},
        "Department": {"x": 520, "y": 120},
        "Document": {"x": 220, "y": 320},
        "Contract": {"x": 440, "y": 320},
    }
    result = {}
    for name, position in definitions.items():
        ontology_class = db.scalar(
            select(OntologyClass).where(
                OntologyClass.version_id == version_id,
                OntologyClass.name == name,
            )
        )
        if ontology_class is None:
            ontology_class = OntologyClass(
                version_id=version_id,
                name=name,
                label=name,
                description=f"Seed {name} class.",
                status=OntologyElementStatus.ACTIVE,
                position=position,
            )
            db.add(ontology_class)
            db.flush()
        result[name] = ontology_class
    return result


def _ensure_properties(db, version_id: str, classes: dict[str, OntologyClass]) -> None:
    for class_name, property_name in {
        "Company": "company_name",
        "Person": "person_name",
        "Department": "department_name",
        "Document": "document_title",
        "Contract": "contract_name",
    }.items():
        exists = db.scalar(
            select(OntologyProperty).where(
                OntologyProperty.version_id == version_id,
                OntologyProperty.class_id == classes[class_name].id,
                OntologyProperty.name == property_name,
            )
        )
        if exists is None:
            db.add(
                OntologyProperty(
                    version_id=version_id,
                    class_id=classes[class_name].id,
                    name=property_name,
                    label=property_name.replace("_", " ").title(),
                    description=f"Seed property for {class_name}.",
                    data_type=PropertyDataType.STRING,
                    cardinality=Cardinality.REQUIRED,
                    required=True,
                    status=OntologyElementStatus.ACTIVE,
                )
            )


def _ensure_relations(db, version_id: str, classes: dict[str, OntologyClass]) -> None:
    for name, domain, range_, cardinality in [
        ("HAS_DEPARTMENT", "Company", "Department", Cardinality.ONE_TO_MANY),
        ("BELONGS_TO", "Person", "Department", Cardinality.MANY_TO_ONE),
        ("AUTHORED_BY", "Document", "Person", Cardinality.MANY_TO_ONE),
        ("SIGNED_BY", "Contract", "Company", Cardinality.MANY_TO_MANY),
    ]:
        exists = db.scalar(
            select(OntologyRelation).where(
                OntologyRelation.version_id == version_id,
                OntologyRelation.name == name,
            )
        )
        if exists is None:
            db.add(
                OntologyRelation(
                    version_id=version_id,
                    name=name,
                    label=name,
                    description=f"Seed relation {name}.",
                    domain_class_id=classes[domain].id,
                    range_class_id=classes[range_].id,
                    cardinality=cardinality,
                    required=False,
                    status=OntologyElementStatus.ACTIVE,
                )
            )


def _ensure_source(db, project_id: str, seed_csv: Path) -> None:
    exists = db.scalar(
        select(SourceData).where(
            SourceData.project_id == project_id,
            SourceData.file_name == seed_csv.name,
            SourceData.is_deleted.is_(False),
        )
    )
    if exists is not None:
        return
    content = seed_csv.read_bytes()
    preview = build_preview(SourceType.CSV, content)
    db.add(
        SourceData(
            project_id=project_id,
            file_name=seed_csv.name,
            source_type=SourceType.CSV,
            mime_type="text/csv",
            size_bytes=len(content),
            status=SourceStatus.UPLOADED,
            preview_status=SourcePreviewStatus.READY,
            storage_uri=f"seed://{seed_csv.name}",
            created_by=settings.dev_user_id,
            metadata_={"display_name": "Seed companies CSV"},
            preview_columns=preview.columns,
            preview_rows=preview.rows,
            row_count_sampled=preview.row_count_sampled,
            total_row_count=preview.total_row_count,
            sheet_name=preview.sheet_name,
            preview_warnings=preview.warnings,
        )
    )


if __name__ == "__main__":
    main()
