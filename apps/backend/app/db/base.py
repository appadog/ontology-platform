from app.db.base_class import Base as Base


from app.modules.ontology.models import (  # noqa: E402,F401
    OntologyClass,
    OntologyProperty,
    OntologyRelation,
    OntologyVersion,
)
from app.modules.candidate.models import (  # noqa: E402,F401
    CandidateEntity,
    CandidateEvidence,
    CandidateRelation,
)
from app.modules.extraction.models import ExtractionJob, ModelRun  # noqa: E402,F401
from app.modules.prompt.models import PromptTemplate, PromptVersion  # noqa: E402,F401
from app.modules.project.models import Project  # noqa: E402,F401
from app.modules.source.models import SourceData, SourceProfile, SourceSegment  # noqa: E402,F401
