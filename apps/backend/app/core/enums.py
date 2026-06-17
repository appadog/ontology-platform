from enum import Enum


class Role(str, Enum):
    SYSTEM_ADMIN = "SYSTEM_ADMIN"
    PROJECT_ADMIN = "PROJECT_ADMIN"
    ONTOLOGY_MANAGER = "ONTOLOGY_MANAGER"
    DATA_MANAGER = "DATA_MANAGER"
    EXTRACTION_MANAGER = "EXTRACTION_MANAGER"
    REVIEWER = "REVIEWER"
    VIEWER = "VIEWER"
    API_CLIENT = "API_CLIENT"


class ProjectStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    DELETED = "DELETED"


class OntologyVersionStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class OntologyElementStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    DELETED = "DELETED"


class SourceType(str, Enum):
    CSV = "CSV"
    EXCEL = "EXCEL"
    TXT = "TXT"
    PDF = "PDF"


class SourceStatus(str, Enum):
    UPLOADED = "UPLOADED"
    PARSING = "PARSING"
    PARSED = "PARSED"
    PROFILED = "PROFILED"
    EXTRACTION_READY = "EXTRACTION_READY"
    FAILED = "FAILED"


class SourcePreviewStatus(str, Enum):
    PENDING = "PENDING"
    READY = "READY"
    NOT_AVAILABLE = "NOT_AVAILABLE"
    FAILED = "FAILED"


class PropertyDataType(str, Enum):
    STRING = "STRING"
    TEXT = "TEXT"
    INTEGER = "INTEGER"
    FLOAT = "FLOAT"
    BOOLEAN = "BOOLEAN"
    DATE = "DATE"
    DATETIME = "DATETIME"
    URI = "URI"


class Cardinality(str, Enum):
    ONE_TO_ONE = "ONE_TO_ONE"
    ONE_TO_MANY = "ONE_TO_MANY"
    MANY_TO_ONE = "MANY_TO_ONE"
    MANY_TO_MANY = "MANY_TO_MANY"
    OPTIONAL = "OPTIONAL"
    REQUIRED = "REQUIRED"
    MULTIPLE = "MULTIPLE"


class ValidationStatus(str, Enum):
    NOT_VALIDATED = "NOT_VALIDATED"
    PASSED = "PASSED"
    WARNING = "WARNING"
    FAILED = "FAILED"


class CandidateReviewStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    MODIFIED = "MODIFIED"
    NEEDS_DISCUSSION = "NEEDS_DISCUSSION"


class PublishStatus(str, Enum):
    NOT_PUBLISHED = "NOT_PUBLISHED"
    PUBLISHED = "PUBLISHED"
    ROLLED_BACK = "ROLLED_BACK"


class ExtractionJobStatus(str, Enum):
    PENDING = "PENDING"
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    PARTIAL_FAILED = "PARTIAL_FAILED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    RETRYING = "RETRYING"
