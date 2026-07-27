"""Deterministic real-DB ontology fixtures for the governance demo/test suite.

Wave 73 fixes the wave-068 finding: governance's item-reference validation and
recommended-approver lookup never touched the real ontology DB — they checked
membership in hardcoded string sets instead. This module seeds the exact same
fixed element ids those sets used to hardcode (`class-clause`, `class-company`,
etc.) as REAL `OntologyVersion`/`OntologyClass`/`OntologyProperty`/
`OntologyRelation` rows, so service.py can validate against real data while
every existing governance/application/impact test assertion (which references
these ids as opaque known-good/known-bad strings) keeps working unchanged.

Call `ensure_governance_ontology_fixtures(db)` after seeding the project
(e.g. after `seed_mvp3(reset=True)`), which deletes/recreates ontology
versions for the project — this must run AFTER that reset, not before.
"""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.enums import OntologyElementStatus, OntologyVersionStatus
from app.modules.ontology.models import (
    OntologyClass,
    OntologyProperty,
    OntologyRelation,
    OntologyVersion,
)

SEED_PROJECT_ID = "project-corp-knowledge"
DRAFT_VERSION_ID = "ontology-v7"
PUBLISHED_VERSION_ID = "ontology-v1"

# Reserved version numbers unlikely to collide with seed_mvp3's own versions.
_DRAFT_VERSION_NUMBER = 900
_PUBLISHED_VERSION_NUMBER = 901


def ensure_governance_ontology_fixtures(db: Session) -> None:
    if db.get(OntologyVersion, DRAFT_VERSION_ID) is not None:
        return

    db.add(
        OntologyVersion(
            id=DRAFT_VERSION_ID,
            project_id=SEED_PROJECT_ID,
            version=_DRAFT_VERSION_NUMBER,
            status=OntologyVersionStatus.DRAFT,
            created_by="dev-user",
        )
    )
    db.add(
        OntologyVersion(
            id=PUBLISHED_VERSION_ID,
            project_id=SEED_PROJECT_ID,
            version=_PUBLISHED_VERSION_NUMBER,
            status=OntologyVersionStatus.PUBLISHED,
            created_by="dev-user",
            published_at=datetime.now(timezone.utc),
        )
    )
    db.flush()

    db.add_all(
        [
            OntologyClass(
                id="class-clause",
                version_id=DRAFT_VERSION_ID,
                name="Clause",
                label="Clause",
                status=OntologyElementStatus.ACTIVE,
                position={},
                owner_id="user-ontology-manager-1",
                owner_display_name="온톨로지 매니저",
            ),
            OntologyClass(
                id="class-company",
                version_id=DRAFT_VERSION_ID,
                name="Company",
                label="Company",
                status=OntologyElementStatus.ACTIVE,
                position={},
                owner_id="user-ontology-manager-1",
                owner_display_name="온톨로지 매니저",
            ),
            OntologyClass(
                id="class-extra",
                version_id=DRAFT_VERSION_ID,
                name="Extra",
                label="Extra",
                status=OntologyElementStatus.ACTIVE,
                position={},
            ),
            OntologyClass(
                id="class-isolated",
                version_id=DRAFT_VERSION_ID,
                name="Isolated",
                label="Isolated",
                status=OntologyElementStatus.ACTIVE,
                position={},
            ),
        ]
    )
    db.flush()

    db.add_all(
        [
            OntologyProperty(
                id="property-claim-deadline",
                version_id=DRAFT_VERSION_ID,
                class_id="class-clause",
                name="claim_deadline",
                label="Claim Deadline",
                status=OntologyElementStatus.ACTIVE,
            ),
            OntologyProperty(
                id="property-name",
                version_id=DRAFT_VERSION_ID,
                class_id="class-company",
                name="name",
                label="Name",
                status=OntologyElementStatus.ACTIVE,
            ),
            OntologyProperty(
                id="property-extra",
                version_id=DRAFT_VERSION_ID,
                class_id="class-extra",
                name="extra",
                label="Extra",
                status=OntologyElementStatus.ACTIVE,
            ),
        ]
    )
    db.add_all(
        [
            OntologyRelation(
                id="relation-has-clause",
                version_id=DRAFT_VERSION_ID,
                name="has_clause",
                label="Has Clause",
                domain_class_id="class-company",
                range_class_id="class-clause",
                status=OntologyElementStatus.ACTIVE,
            ),
            OntologyRelation(
                id="relation-extra",
                version_id=DRAFT_VERSION_ID,
                name="extra_relation",
                label="Extra Relation",
                domain_class_id="class-extra",
                range_class_id="class-isolated",
                status=OntologyElementStatus.ACTIVE,
            ),
        ]
    )
    db.commit()
