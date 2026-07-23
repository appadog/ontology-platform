from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import (
    Cardinality,
    OntologyElementStatus,
    OntologyVersionStatus,
    PropertyDataType,
)
from app.db.base_class import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class OntologyVersion(Base):
    __tablename__ = "ontology_versions"
    __table_args__ = (UniqueConstraint("project_id", "version", name="uq_ontology_version_project"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[OntologyVersionStatus] = mapped_column(
        Enum(OntologyVersionStatus, native_enum=False, length=32),
        nullable=False,
        default=OntologyVersionStatus.DRAFT,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(String(100), nullable=False, default="dev-user")

    classes: Mapped[list["OntologyClass"]] = relationship(back_populates="version")
    properties: Mapped[list["OntologyProperty"]] = relationship(back_populates="version")
    relations: Mapped[list["OntologyRelation"]] = relationship(back_populates="version")


class OntologyClass(Base):
    __tablename__ = "ontology_classes"
    __table_args__ = (UniqueConstraint("version_id", "name", name="uq_ontology_class_version_name"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    version_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ontology_versions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[OntologyElementStatus] = mapped_column(
        Enum(OntologyElementStatus, native_enum=False, length=32),
        nullable=False,
        default=OntologyElementStatus.ACTIVE,
        index=True,
    )
    position: Mapped[dict[str, float]] = mapped_column(JSON, nullable=False, default=dict)
    owner_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    owner_display_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    version: Mapped[OntologyVersion] = relationship(back_populates="classes")


class OntologyProperty(Base):
    __tablename__ = "ontology_properties"
    __table_args__ = (
        UniqueConstraint("version_id", "class_id", "name", name="uq_ontology_property_class_name"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    version_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ontology_versions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    class_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ontology_classes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    data_type: Mapped[PropertyDataType] = mapped_column(
        Enum(PropertyDataType, native_enum=False, length=32),
        nullable=False,
        default=PropertyDataType.STRING,
    )
    cardinality: Mapped[Cardinality] = mapped_column(
        Enum(Cardinality, native_enum=False, length=32),
        nullable=False,
        default=Cardinality.OPTIONAL,
    )
    required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[OntologyElementStatus] = mapped_column(
        Enum(OntologyElementStatus, native_enum=False, length=32),
        nullable=False,
        default=OntologyElementStatus.ACTIVE,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    version: Mapped[OntologyVersion] = relationship(back_populates="properties")


class OntologyRelation(Base):
    __tablename__ = "ontology_relations"
    __table_args__ = (
        UniqueConstraint("version_id", "name", name="uq_ontology_relation_version_name"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    version_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ontology_versions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    domain_class_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ontology_classes.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    range_class_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ontology_classes.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    cardinality: Mapped[Cardinality] = mapped_column(
        Enum(Cardinality, native_enum=False, length=32),
        nullable=False,
        default=Cardinality.MANY_TO_MANY,
    )
    required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[OntologyElementStatus] = mapped_column(
        Enum(OntologyElementStatus, native_enum=False, length=32),
        nullable=False,
        default=OntologyElementStatus.ACTIVE,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    version: Mapped[OntologyVersion] = relationship(back_populates="relations")
