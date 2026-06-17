from app.integrations.llm.base import LLMRequest, LLMResponse


class MockFixtureNotFoundError(Exception):
    pass


class MockProvider:
    name = "mock"

    def generate(self, request: LLMRequest) -> LLMResponse:
        if request.fixture_id == "missing":
            raise MockFixtureNotFoundError("Mock fixture was not found.")

        class_names = request.ontology_class_names or ["Candidate"]
        entities = [
            {
                "name": f"{class_name} Candidate {index + 1}",
                "class_name": class_name,
                "confidence": 0.91,
            }
            for index, class_name in enumerate(class_names[:2])
        ]
        relations = []
        if request.ontology_relation_names and len(entities) >= 2:
            relations.append(
                {
                    "relation_name": request.ontology_relation_names[0],
                    "source_entity_index": 0,
                    "target_entity_index": 1,
                    "confidence": 0.84,
                }
            )

        partial_failed = request.fixture_id == "partial_invalid"
        warnings = []
        if partial_failed:
            entities.append(
                {
                    "name": "Invalid Evidence Candidate",
                    "class_name": class_names[0],
                    "confidence": 0.4,
                    "force_missing_evidence": True,
                }
            )
            warnings.append("Mock fixture emitted one candidate without evidence.")

        return LLMResponse(
            fixture_id=request.fixture_id,
            entities=entities,
            relations=relations,
            warnings=warnings,
            partial_failed=partial_failed,
        )
