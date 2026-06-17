from dataclasses import dataclass, field
from typing import Protocol


@dataclass(frozen=True)
class LLMRequest:
    fixture_id: str | None
    source_id: str
    segment_count: int
    ontology_class_names: list[str]
    ontology_relation_names: list[str]


@dataclass(frozen=True)
class LLMResponse:
    fixture_id: str | None
    entities: list[dict] = field(default_factory=list)
    relations: list[dict] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    partial_failed: bool = False


class LLMProvider(Protocol):
    name: str

    def generate(self, request: LLMRequest) -> LLMResponse:
        """Return deterministic structured output for the extraction pipeline."""
