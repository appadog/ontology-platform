from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from .schemas import (
    DestructiveImpactRow,
    GovernanceJobStatus,
    ImportCompatibilityStatus,
    ImportConflict,
    ImportConflictSeverity,
    ImportConflictType,
    ImportDryRunSummary,
    ImportWarning,
    OntologyPackageClass,
    OntologyPackagePayload,
    OntologyPackageProperty,
    OntologyPackageRelation,
)

ONTOLOGY_PACKAGE_SCHEMA_VERSION = "ontology-package.v1"
ONTOLOGY_VERSION_ID = "ontology-version-mvp5-current"
PUBLISHED_GRAPH_VERSION_ID = "published-graph-version-mvp5-current"


@dataclass(frozen=True)
class ImportDryRunAnalysis:
    status: GovernanceJobStatus
    compatibility_status: ImportCompatibilityStatus
    summary: ImportDryRunSummary
    conflicts: list[ImportConflict]
    warnings: list[ImportWarning]
    destructive_impacts: list[DestructiveImpactRow]
    confirmation_required: bool


def build_current_ontology_package(project_id: str, generated_at: datetime) -> OntologyPackagePayload:
    return OntologyPackagePayload(
        package_id="ontology-package-project-corp-knowledge-current",
        schema_version=ONTOLOGY_PACKAGE_SCHEMA_VERSION,
        project_id=project_id,
        ontology_version_id=ONTOLOGY_VERSION_ID,
        published_graph_version_id=PUBLISHED_GRAPH_VERSION_ID,
        generated_at=generated_at,
        classes=[
            OntologyPackageClass(
                stable_id="class-customer",
                name="Customer",
                description="Customer account holder.",
            ),
            OntologyPackageClass(
                stable_id="class-account",
                name="Account",
                description="Financial account.",
            ),
            OntologyPackageClass(
                stable_id="class-branch",
                name="Branch",
                description="Retail branch.",
            ),
        ],
        properties=[
            OntologyPackageProperty(
                stable_id="property-customer-email",
                class_stable_id="class-customer",
                name="email",
                data_type="STRING",
            ),
            OntologyPackageProperty(
                stable_id="property-customer-tier",
                class_stable_id="class-customer",
                name="tier",
                data_type="STRING",
            ),
            OntologyPackageProperty(
                stable_id="property-account-status",
                class_stable_id="class-account",
                name="status",
                data_type="STRING",
            ),
            OntologyPackageProperty(
                stable_id="property-branch-region",
                class_stable_id="class-branch",
                name="region",
                data_type="STRING",
            ),
        ],
        relations=[
            OntologyPackageRelation(
                stable_id="relation-customer-owns-account",
                name="OWNS_ACCOUNT",
                source_class_stable_id="class-customer",
                target_class_stable_id="class-account",
            ),
            OntologyPackageRelation(
                stable_id="relation-account-managed-by-branch",
                name="MANAGED_BY",
                source_class_stable_id="class-account",
                target_class_stable_id="class-branch",
            ),
        ],
        compatibility_notes=[
            "MVP5 P0 JSON package only; RDF/Turtle/OWL/SHACL fidelity is P1.",
            "Credential and raw secret material are excluded from ontology packages.",
        ],
    )


def analyze_import_dry_run(
    project_id: str,
    current: OntologyPackagePayload,
    package: OntologyPackagePayload,
) -> ImportDryRunAnalysis:
    conflicts: list[ImportConflict] = []
    warnings: list[ImportWarning] = []
    destructive_impacts: list[DestructiveImpactRow] = []
    create_count = 0
    update_count = 0
    no_op_count = 0

    if package.schema_version != ONTOLOGY_PACKAGE_SCHEMA_VERSION:
        conflicts.append(
            ImportConflict(
                conflict_type=ImportConflictType.SCHEMA_VERSION_INCOMPATIBLE,
                severity=ImportConflictSeverity.BLOCKING,
                path="schema_version",
                message="Only ontology-package.v1 JSON packages are accepted for MVP5 P0 dry-run.",
            )
        )

    if package.project_id != project_id:
        conflicts.append(
            ImportConflict(
                conflict_type=ImportConflictType.PUBLISHED_VERSION_CONFLICT,
                severity=ImportConflictSeverity.BLOCKING,
                path="project_id",
                message="Package project id does not match the target project.",
            )
        )

    current_classes = {item.stable_id: item for item in current.classes}
    current_properties = {item.stable_id: item for item in current.properties}
    current_relations = {item.stable_id: item for item in current.relations}
    incoming_classes = {item.stable_id: item for item in package.classes}
    incoming_properties = {item.stable_id: item for item in package.properties}
    incoming_relations = {item.stable_id: item for item in package.relations}

    current_class_names = {item.name: item.stable_id for item in current.classes}
    for item in package.classes:
        existing_stable_id = current_class_names.get(item.name)
        if existing_stable_id is not None and existing_stable_id != item.stable_id:
            conflicts.append(
                ImportConflict(
                    conflict_type=ImportConflictType.NAME_COLLISION,
                    severity=ImportConflictSeverity.BLOCKING,
                    path=f"classes[{item.name}]",
                    message="Class name already exists with a different stable identifier.",
                )
            )

    for item in package.relations:
        current_relation = current_relations.get(item.stable_id)
        if current_relation and (
            current_relation.source_class_stable_id != item.source_class_stable_id
            or current_relation.target_class_stable_id != item.target_class_stable_id
        ):
            conflicts.append(
                ImportConflict(
                    conflict_type=ImportConflictType.RELATION_RANGE_MISMATCH,
                    severity=ImportConflictSeverity.BLOCKING,
                    path=f"relations[{item.name}]",
                    message="Relation source or target class differs from the current ontology.",
                )
            )

    for item in package.classes:
        if item.stable_id not in current_classes:
            create_count += 1
        elif item == current_classes[item.stable_id]:
            no_op_count += 1
        else:
            update_count += 1
    for item in package.properties:
        if item.stable_id not in current_properties:
            create_count += 1
        elif item == current_properties[item.stable_id]:
            no_op_count += 1
        else:
            update_count += 1
    for item in package.relations:
        if item.stable_id not in current_relations:
            create_count += 1
        elif item == current_relations[item.stable_id]:
            no_op_count += 1
        else:
            update_count += 1

    destructive_impacts.extend(
        _destructive_impacts("CLASS", sorted(set(current_classes) - set(incoming_classes)))
    )
    destructive_impacts.extend(
        _destructive_impacts("PROPERTY", sorted(set(current_properties) - set(incoming_properties)))
    )
    destructive_impacts.extend(
        _destructive_impacts("RELATION", sorted(set(current_relations) - set(incoming_relations)))
    )
    if destructive_impacts:
        warnings.append(
            ImportWarning(
                path="package",
                message="Package omits current ontology elements; dry-run reports delete impact only.",
            )
        )

    compatibility_status = ImportCompatibilityStatus.COMPATIBLE
    status = GovernanceJobStatus.SUCCEEDED
    if any(conflict.severity == ImportConflictSeverity.BLOCKING for conflict in conflicts):
        compatibility_status = ImportCompatibilityStatus.BLOCKED
        status = GovernanceJobStatus.BLOCKED
    elif warnings or destructive_impacts:
        compatibility_status = ImportCompatibilityStatus.WARNING

    return ImportDryRunAnalysis(
        status=status,
        compatibility_status=compatibility_status,
        summary=ImportDryRunSummary(
            create_count=create_count,
            update_count=update_count,
            delete_count=len(destructive_impacts),
            no_op_count=no_op_count,
            conflict_count=len(conflicts),
            warning_count=len(warnings),
            destructive_impact_count=len(destructive_impacts),
        ),
        conflicts=conflicts,
        warnings=warnings,
        destructive_impacts=destructive_impacts,
        confirmation_required=compatibility_status != ImportCompatibilityStatus.COMPATIBLE
        or bool(destructive_impacts),
    )


def _destructive_impacts(resource_type: str, resource_ids: list[str]) -> list[DestructiveImpactRow]:
    return [
        DestructiveImpactRow(
            resource_type=resource_type,
            resource_id=resource_id,
            action="WOULD_DELETE",
            reason="Incoming package omits this current ontology element.",
            published_graph_refs_affected=1 if resource_type in {"CLASS", "RELATION"} else 0,
        )
        for resource_id in resource_ids
    ]
