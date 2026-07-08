from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.core.enums import Role
from app.core.errors import ApiException
from app.modules.project.models import Project

from .schemas import (
    ConnectorCatalogItem,
    ConnectorCatalogListResponse,
    ConnectorConfigField,
    ConnectorConfigFieldKind,
    ConnectorConfigSchemaResponse,
    ConnectorImportPreviewResponse,
    ConnectorKind,
    ConnectorMutationGuard,
    ConnectorOntologyElementRef,
    ConnectorPreviewCompatibility,
    ConnectorPreviewItem,
    ConnectorPreviewNotice,
    ConnectorPreviewStatus,
    ConnectorPreviewSummary,
    ConnectorPreviewTargetLayer,
)

# Hard server cap on returned sample items (P0). Counts remain exact regardless.
ITEM_CAP_MAX = 50

# Constant boundary note (byte-stable) present on every preview response.
ROUTING_NOTE = (
    "preview only - nothing imported; a real run would route through the "
    "existing extraction -> candidate -> review -> publish gate."
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Process-local (no persistence). MVP6.9 preview is compute-on-read / ephemeral
# (G1): it persists NOTHING, so the reset hook is a no-op kept only to mirror
# the MVP6.1-6.8 module contract (import safety for test/seed harnesses).
# ---------------------------------------------------------------------------


def reset_runtime_store() -> None:
    # Intentionally empty: connectors persist nothing (read-only + dry-run).
    return None


def project_or_404(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise ApiException(
            status_code=404,
            code="PROJECT_NOT_FOUND",
            message="Project was not found.",
            details={"project_id": project_id},
        )
    return project


_VALID_ROLES = {r.value for r in Role}


def require_project_read(actor_role: str) -> None:
    # Any project-read member is allowed; an unrecognized role is denied.
    if actor_role not in _VALID_ROLES:
        raise ApiException(
            status_code=403,
            code="PERMISSION_DENIED",
            message="A project-read member role is required to view connectors.",
            details={"actor_role": actor_role},
        )


def connector_kind_or_404(connector_kind: str) -> ConnectorKind:
    try:
        return ConnectorKind(connector_kind)
    except ValueError:
        raise ApiException(
            status_code=404,
            code="CONNECTOR_KIND_NOT_FOUND",
            message="Connector kind was not found.",
            details={"connector_kind": connector_kind},
        ) from None


# ---------------------------------------------------------------------------
# Frozen catalog metadata + masked config schemas (deterministic; 3 kinds).
# ---------------------------------------------------------------------------

_CATALOG_META: dict[ConnectorKind, tuple[str, str]] = {
    ConnectorKind.FILE_SOURCE: ("File Source (CSV/JSON)", "CSV/JSON file-style source (mock)."),
    ConnectorKind.REST_SOURCE: ("REST Source", "Generic REST-ish API source (mock)."),
    ConnectorKind.KNOWLEDGE_BASE_SOURCE: (
        "Knowledge Base Source",
        "Knowledge-base / doc source (mock).",
    ),
}

_MASKED_SECRET_PLACEHOLDER = "SECRET_PLACEHOLDER_NOT_A_REAL_SECRET"

_CONFIG_SCHEMAS: dict[ConnectorKind, list[ConnectorConfigField]] = {
    ConnectorKind.FILE_SOURCE: [
        ConnectorConfigField(
            name="file_name",
            label="File name",
            field_kind=ConnectorConfigFieldKind.STRING,
            required=True,
            secret=False,
            placeholder="records.csv",
            help_text="Non-secret fixture file name; no real file is read.",
        ),
        ConnectorConfigField(
            name="file_format",
            label="File format",
            field_kind=ConnectorConfigFieldKind.ENUM,
            required=True,
            secret=False,
            placeholder="CSV",
            enum_values=["CSV", "JSON"],
        ),
        ConnectorConfigField(
            name="has_header",
            label="Has header row",
            field_kind=ConnectorConfigFieldKind.BOOLEAN,
            required=False,
            secret=False,
            placeholder="true",
        ),
    ],
    ConnectorKind.REST_SOURCE: [
        ConnectorConfigField(
            name="base_url",
            label="Base URL",
            field_kind=ConnectorConfigFieldKind.URL,
            required=True,
            secret=False,
            placeholder="https://example.invalid/api",
            help_text="Non-secret placeholder; no real request is made.",
        ),
        ConnectorConfigField(
            name="resource_path",
            label="Resource path",
            field_kind=ConnectorConfigFieldKind.STRING,
            required=True,
            secret=False,
            placeholder="/v1/items",
        ),
        ConnectorConfigField(
            name="api_key",
            label="API key",
            field_kind=ConnectorConfigFieldKind.SECRET,
            required=False,
            secret=True,
            placeholder=_MASKED_SECRET_PLACEHOLDER,
            help_text="Masked; never echoed/persisted/logged; not used (no real network).",
        ),
    ],
    ConnectorKind.KNOWLEDGE_BASE_SOURCE: [
        ConnectorConfigField(
            name="knowledge_base_id",
            label="Knowledge base id",
            field_kind=ConnectorConfigFieldKind.STRING,
            required=True,
            secret=False,
            placeholder="kb-001",
        ),
        ConnectorConfigField(
            name="collection",
            label="Collection",
            field_kind=ConnectorConfigFieldKind.STRING,
            required=True,
            secret=False,
            placeholder="documents",
        ),
        ConnectorConfigField(
            name="access_token",
            label="Access token",
            field_kind=ConnectorConfigFieldKind.SECRET,
            required=False,
            secret=True,
            placeholder=_MASKED_SECRET_PLACEHOLDER,
            help_text="Masked; never echoed/persisted/logged; not used (no real network).",
        ),
    ],
}


def _has_secret(kind: ConnectorKind) -> bool:
    return any(f.secret for f in _CONFIG_SCHEMAS[kind])


# ---------------------------------------------------------------------------
# Frozen per-kind fixtures (G5). NON-SECRET, byte-stable, no external read.
#   FILE_SOURCE=6 records -> COMPATIBLE
#   REST_SOURCE=5 records (>=1 unmapped) -> WARNING
#   KNOWLEDGE_BASE_SOURCE=4 records -> COMPATIBLE
# Each entity record = (label, class_ref | None); relation record = (label, rel_ref).
# ---------------------------------------------------------------------------

_PERSON = ("CLASS", "cls_person", "Person")
_MACHINE = ("CLASS", "cls_machine", "Machine")
_DOCUMENT = ("CLASS", "cls_document", "Document")
_TOPIC = ("CLASS", "cls_topic", "Topic")
_REL_USES = ("RELATION", "rel_uses", "uses")
_REL_MENTIONS = ("RELATION", "rel_mentions", "mentions")


def _ref(triple: tuple[str, str, str] | None) -> ConnectorOntologyElementRef | None:
    if triple is None:
        return None
    return ConnectorOntologyElementRef(
        element_kind=triple[0], element_id=triple[1], label=triple[2]
    )


# tag, entity_records, relation_records
_FIXTURES: dict[ConnectorKind, tuple[str, list[tuple[str, Any]], list[tuple[str, Any]]]] = {
    ConnectorKind.FILE_SOURCE: (
        "file",
        [
            ("Ada Lovelace", _PERSON),
            ("Grace Hopper", _PERSON),
            ("Alan Turing", _PERSON),
            ("ENIAC", _MACHINE),
            ("Analytical Engine", _MACHINE),
            ("Difference Engine", _MACHINE),
        ],
        [
            ("Ada Lovelace uses Analytical Engine", _REL_USES),
            ("Grace Hopper uses ENIAC", _REL_USES),
        ],
    ),
    ConnectorKind.REST_SOURCE: (
        "rest",
        [
            ("Ada Lovelace", _PERSON),
            ("(unmapped record)", None),
            ("Grace Hopper", _PERSON),
            ("Alan Turing", _PERSON),
            ("ENIAC", _MACHINE),
        ],
        [
            ("Ada Lovelace uses ENIAC", _REL_USES),
        ],
    ),
    ConnectorKind.KNOWLEDGE_BASE_SOURCE: (
        "kb",
        [
            ("Data Governance Policy", _DOCUMENT),
            ("Ontology Modeling Guide", _DOCUMENT),
            ("Knowledge Graphs", _TOPIC),
            ("Entity Resolution", _TOPIC),
        ],
        [
            ("Data Governance Policy mentions Knowledge Graphs", _REL_MENTIONS),
        ],
    ),
}

# Default resource segment per kind when config provides none.
_DEFAULT_RESOURCE: dict[ConnectorKind, str] = {
    ConnectorKind.FILE_SOURCE: "records",
    ConnectorKind.REST_SOURCE: "items",
    ConnectorKind.KNOWLEDGE_BASE_SOURCE: "documents",
}

# Non-secret config keys that name the fixture resource (opaque locator only).
_RESOURCE_KEY: dict[ConnectorKind, str] = {
    ConnectorKind.FILE_SOURCE: "file_name",
    ConnectorKind.REST_SOURCE: "resource_path",
    ConnectorKind.KNOWLEDGE_BASE_SOURCE: "collection",
}


def _resource_token(kind: ConnectorKind, config: dict[str, Any]) -> str:
    raw = config.get(_RESOURCE_KEY[kind])
    if not isinstance(raw, str) or not raw.strip():
        return _DEFAULT_RESOURCE[kind]
    # Take the last non-empty path segment; opaque, non-secret only.
    segment = [s for s in raw.strip().split("/") if s]
    return segment[-1] if segment else _DEFAULT_RESOURCE[kind]


# ---------------------------------------------------------------------------
# Catalog + config-schema.
# ---------------------------------------------------------------------------


def catalog(project_id: str) -> ConnectorCatalogListResponse:
    items = [
        ConnectorCatalogItem(
            connector_kind=kind,
            display_name=_CATALOG_META[kind][0],
            description=_CATALOG_META[kind][1],
            has_secret_fields=_has_secret(kind),
            config_field_count=len(_CONFIG_SCHEMAS[kind]),
            target_layer=ConnectorPreviewTargetLayer.CANDIDATE,
        )
        for kind in ConnectorKind
    ]
    return ConnectorCatalogListResponse(
        project_id=project_id,
        items=items,
        total_count=len(items),
        mutation_guard=ConnectorMutationGuard(),
    )


def config_schema(project_id: str, kind: ConnectorKind) -> ConnectorConfigSchemaResponse:
    return ConnectorConfigSchemaResponse(
        project_id=project_id,
        connector_kind=kind,
        display_name=_CATALOG_META[kind][0],
        fields=list(_CONFIG_SCHEMAS[kind]),
        raw_secret_present=False,
        mutation_guard=ConnectorMutationGuard(),
    )


# ---------------------------------------------------------------------------
# Dry-run import preview (deterministic, secret-independent, creates nothing).
# ---------------------------------------------------------------------------

_ENUM_FIELD_VALUES: dict[tuple[ConnectorKind, str], list[str]] = {
    (ConnectorKind.FILE_SOURCE, "file_format"): ["CSV", "JSON"],
}


def _validate_config(kind: ConnectorKind, config: dict[str, Any]) -> list[ConnectorPreviewNotice]:
    """Non-secret config validation only. Returns blocked_reasons (empty == OK)."""
    reasons: list[ConnectorPreviewNotice] = []
    for field in _CONFIG_SCHEMAS[kind]:
        if field.secret:
            continue  # secrets never block; independent of any secret value
        value = config.get(field.name)
        if field.required and (value is None or (isinstance(value, str) and not value.strip())):
            reasons.append(
                ConnectorPreviewNotice(
                    code="MISSING_REQUIRED_FIELD",
                    message=f"필수 설정값 '{field.name}'이(가) 누락되었습니다.",
                )
            )
    if reasons:
        return reasons

    # Value-shape checks (only when required fields are present).
    enum_values = _ENUM_FIELD_VALUES.get((kind, "file_format"))
    if enum_values is not None:
        fmt = config.get("file_format")
        if isinstance(fmt, str) and fmt not in enum_values:
            reasons.append(
                ConnectorPreviewNotice(
                    code="INVALID_CONFIG_VALUE",
                    message=f"'file_format' 값 '{fmt}'은(는) 허용되지 않습니다.",
                )
            )
    if kind == ConnectorKind.REST_SOURCE:
        base_url = config.get("base_url")
        if isinstance(base_url, str) and not base_url.startswith(("http://", "https://")):
            reasons.append(
                ConnectorPreviewNotice(
                    code="INVALID_CONFIG_VALUE",
                    message="'base_url' 값은 http:// 또는 https:// 로 시작해야 합니다.",
                )
            )
    return reasons


def import_preview(
    project_id: str,
    kind: ConnectorKind,
    config: dict[str, Any],
    item_cap: int | None,
) -> ConnectorImportPreviewResponse:
    generated_at = utc_now()
    effective_cap = ITEM_CAP_MAX if item_cap is None else min(item_cap, ITEM_CAP_MAX)

    blocked = _validate_config(kind, config)
    if blocked:
        return ConnectorImportPreviewResponse(
            preview_id=None,
            project_id=project_id,
            connector_kind=kind,
            generated_at=generated_at,
            preview_only=True,
            status=ConnectorPreviewStatus.BLOCKED,
            compatibility=ConnectorPreviewCompatibility.INCOMPATIBLE,
            target_layer=ConnectorPreviewTargetLayer.CANDIDATE,
            summary=ConnectorPreviewSummary(
                source_record_count=0,
                would_be_candidate_entity_count=0,
                would_be_candidate_relation_count=0,
                unmapped_record_count=0,
                warning_count=0,
            ),
            sample_items=[],
            item_cap=effective_cap,
            truncated=False,
            total_item_count=0,
            warnings=[],
            blocked_reasons=blocked,
            routing_note=ROUTING_NOTE,
            raw_secret_present=False,
            mutation_guard=ConnectorMutationGuard(),
        )

    tag, entity_records, relation_records = _FIXTURES[kind]
    resource = _resource_token(kind, config)

    all_items: list[ConnectorPreviewItem] = []
    seq = 0
    unmapped_count = 0
    entity_count = 0

    for row, (label, triple) in enumerate(entity_records, start=1):
        seq += 1
        ref = _ref(triple)
        mapped = ref is not None
        if mapped:
            entity_count += 1
        else:
            unmapped_count += 1
        all_items.append(
            ConnectorPreviewItem(
                preview_ref=f"prev_{tag}_{seq:04d}",
                target_layer=ConnectorPreviewTargetLayer.CANDIDATE,
                mapped_ontology_class_ref=ref,
                label=label,
                source_locator=f"fixture:{tag}/{resource}#row={row}",
                compatibility=(
                    ConnectorPreviewCompatibility.COMPATIBLE
                    if mapped
                    else ConnectorPreviewCompatibility.WARNING
                ),
                note=(None if mapped else "매핑되는 온톨로지 클래스가 없어 검토가 필요합니다."),
            )
        )

    for rel_row, (label, triple) in enumerate(relation_records, start=1):
        seq += 1
        all_items.append(
            ConnectorPreviewItem(
                preview_ref=f"prev_{tag}_{seq:04d}",
                target_layer=ConnectorPreviewTargetLayer.CANDIDATE,
                mapped_ontology_class_ref=_ref(triple),
                label=label,
                source_locator=f"fixture:{tag}/{resource}#rel={rel_row}",
                compatibility=ConnectorPreviewCompatibility.COMPATIBLE,
                note=None,
            )
        )

    warning_count = unmapped_count
    warnings: list[ConnectorPreviewNotice] = []
    if unmapped_count > 0:
        warnings.append(
            ConnectorPreviewNotice(
                code="UNMAPPED_FIELDS",
                message=f"{unmapped_count}개 레코드는 실제 실행 전에 검토가 필요합니다.",
            )
        )

    compatibility = (
        ConnectorPreviewCompatibility.WARNING
        if unmapped_count > 0
        else ConnectorPreviewCompatibility.COMPATIBLE
    )

    total_item_count = len(all_items)
    sample_items = all_items[:effective_cap]
    truncated = total_item_count > effective_cap

    return ConnectorImportPreviewResponse(
        preview_id=None,
        project_id=project_id,
        connector_kind=kind,
        generated_at=generated_at,
        preview_only=True,
        status=ConnectorPreviewStatus.READY,
        compatibility=compatibility,
        target_layer=ConnectorPreviewTargetLayer.CANDIDATE,
        summary=ConnectorPreviewSummary(
            source_record_count=len(entity_records),
            would_be_candidate_entity_count=entity_count,
            would_be_candidate_relation_count=len(relation_records),
            unmapped_record_count=unmapped_count,
            warning_count=warning_count,
        ),
        sample_items=sample_items,
        item_cap=effective_cap,
        truncated=truncated,
        total_item_count=total_item_count,
        warnings=warnings,
        blocked_reasons=[],
        routing_note=ROUTING_NOTE,
        raw_secret_present=False,
        mutation_guard=ConnectorMutationGuard(),
    )
