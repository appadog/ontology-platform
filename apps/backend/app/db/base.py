from app.db.base_class import Base as Base


from app.modules.ontology.models import (  # noqa: E402,F401
    OntologyClass,
    OntologyProperty,
    OntologyRelation,
    OntologyVersion,
)
from app.modules.project.models import Project  # noqa: E402,F401
