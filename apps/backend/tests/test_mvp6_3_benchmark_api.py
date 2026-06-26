import json
import os
from pathlib import Path
from typing import Any

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["LOCAL_STORAGE_PATH"] = "/private/tmp/ontology-platform-backend-test-storage"

from fastapi.testclient import TestClient  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.main import app  # noqa: E402
from app.modules.benchmark import service as benchmark_service  # noqa: E402
from app.modules.evaluation import service as evaluation_service  # noqa: E402
from scripts.seed_mvp3 import seed_mvp3  # noqa: E402

Base.metadata.create_all(bind=engine)
client = TestClient(app)

REPO_ROOT = Path(__file__).resolve().parents[3]
DRAFT_OPENAPI_PATH = REPO_ROOT / "docs/api/openapi-mvp6-3-draft.json"


def _json(response: Any, expected_status: int = 200) -> Any:
    assert response.status_code == expected_status, response.text
    return response.json()


def _build_dataset_with_runs(project_id: str, ctx: dict[str, Any]) -> dict[str, str]:
    """Create a deterministic dataset with gold items and two successful runs."""
    dataset = _json(
        client.post(
            f"/api/v1/projects/{project_id}/evaluation-datasets",
            json={"name": "Benchmark gold set", "description": "MVP6.3 smoke"},
        ),
        expected_status=201,
    )
    sample = _json(
        client.post(
            f"/api/v1/evaluation-datasets/{dataset['id']}/samples",
            json={
                "sample_kind": "MANUAL_TEXT",
                "title": "Benchmark sample",
                "content_text": "Acme Corp owns Beta Dept. Missing LLC absent.",
                "source_id": "source-bench",
                "source_segment_id": "segment-bench-001",
                "source_locator": "manual:bench:1",
            },
        ),
        expected_status=201,
    )

    def _entity(label: str, cls: str, off_start: int, off_end: int) -> dict[str, Any]:
        return _json(
            client.post(
                f"/api/v1/evaluation-datasets/{dataset['id']}/gold-entities",
                json={
                    "sample_id": sample["id"],
                    "ontology_class_id": cls,
                    "label": label,
                    "evidence": {
                        "sample_id": sample["id"],
                        "source_id": sample["source_id"],
                        "source_segment_id": sample["source_segment_id"],
                        "locator": "manual:bench:1",
                        "offset_start": off_start,
                        "offset_end": off_end,
                        "quote": label,
                    },
                },
            ),
            expected_status=201,
        )

    acme = _entity("Acme Corp", "class-company", 0, 9)
    beta = _entity("Beta Dept", "class-department", 15, 24)
    _entity("Missing LLC", "class-company", 26, 37)

    _json(
        client.post(
            f"/api/v1/evaluation-datasets/{dataset['id']}/gold-relations",
            json={
                "sample_id": sample["id"],
                "ontology_relation_id": "relation-owns",
                "source_gold_entity_id": acme["id"],
                "target_gold_entity_id": beta["id"],
                "evidence": {
                    "sample_id": sample["id"],
                    "source_id": sample["source_id"],
                    "source_segment_id": sample["source_segment_id"],
                    "locator": "manual:bench:1",
                    "offset_start": 0,
                    "offset_end": 24,
                    "quote": "Acme Corp owns Beta Dept",
                },
            },
        ),
        expected_status=201,
    )

    def _run(model: str) -> dict[str, Any]:
        return _json(
            client.post(
                f"/api/v1/projects/{project_id}/evaluation-runs",
                json={
                    "dataset_id": dataset["id"],
                    "run_mode": "DETERMINISTIC_MOCK",
                    "ontology_version_id": ctx["ontology_version_id"],
                    "prompt_version_id": "prompt-bench",
                    "model_name": model,
                    "parser_version": "parser-bench-v1",
                },
            ),
            expected_status=201,
        )

    run_a = _run("deterministic-mock")
    run_b = _run("gpt-mock-b")
    return {"dataset_id": dataset["id"], "run_a": run_a["id"], "run_b": run_b["id"]}


def _seed() -> dict[str, Any]:
    evaluation_service.reset_runtime_store()
    benchmark_service.reset_runtime_store()
    return seed_mvp3(reset=True)


def test_openapi_exposes_benchmark_paths_and_enums() -> None:
    schema = _json(client.get("/api/v1/openapi.json"))
    paths = schema["paths"]
    for path in [
        "/api/v1/projects/{project_id}/benchmark-comparisons",
        "/api/v1/benchmark-comparisons/{comparison_id}",
        "/api/v1/benchmark-comparisons/{comparison_id}/confusion-matrix",
        "/api/v1/benchmark-comparisons/{comparison_id}/confusion-matrix/cells/{cell_id}/error-cases",
    ]:
        assert path in paths, path

    schemas = schema["components"]["schemas"]
    assert schemas["BenchmarkComparisonGroupBy"]["enum"] == [
        "MODEL",
        "PROMPT_VERSION",
        "ONTOLOGY_VERSION",
        "DATASET_VERSION",
        "PARSER_VERSION",
    ]
    assert schemas["ComparisonComparabilityFlag"]["enum"] == [
        "SAME_DATASET",
        "DIFFERENT_DATASET_VERSION",
        "DIFFERENT_DATASET",
        "DIFFERENT_ONTOLOGY_VERSION",
        "MISSING_METRIC",
    ]
    assert schemas["ConfusionMatrixAxis"]["enum"] == ["ENTITY_CLASS", "RELATION_TYPE"]
    assert schemas["MetricDeltaStatus"]["enum"] == [
        "IMPROVED",
        "REGRESSED",
        "UNCHANGED",
        "NOT_COMPARABLE",
    ]
    assert schemas["RunExclusionReason"]["enum"] == [
        "NOT_TERMINAL_SUCCESS",
        "DIFFERENT_PROJECT",
        "RUN_NOT_FOUND",
        "DUPLICATE_RUN_ID",
    ]


def test_openapi_runtime_matches_draft_field_names() -> None:
    runtime = _json(client.get("/api/v1/openapi.json"))["components"]["schemas"]
    draft = json.loads(DRAFT_OPENAPI_PATH.read_text(encoding="utf-8"))["components"]["schemas"]
    benchmark_schemas = [
        "BenchmarkComparison",
        "BenchmarkComparisonCreateRequest",
        "BenchmarkComparisonRun",
        "BenchmarkRunContext",
        "BenchmarkMetricRow",
        "BenchmarkMetricCell",
        "BenchmarkExcludedRun",
        "ComparabilitySummary",
        "BenchmarkMutationGuard",
        "BenchmarkComparisonSummary",
        "BenchmarkComparisonListResponse",
        "ConfusionMatrix",
        "ConfusionMatrixCell",
        "ConfusionMatrixTotals",
        "ConfusionCellErrorCaseRef",
        "ConfusionCellErrorCasesResponse",
    ]
    for name in benchmark_schemas:
        assert name in runtime, f"runtime missing {name}"
        draft_fields = set(draft[name].get("properties", {}))
        runtime_fields = set(runtime[name].get("properties", {}))
        assert draft_fields == runtime_fields, (name, draft_fields ^ runtime_fields)


def test_build_list_and_get_roundtrip() -> None:
    ctx = _seed()
    project_id = ctx["project_id"]
    runs = _build_dataset_with_runs(project_id, ctx)

    comparison = _json(
        client.post(
            f"/api/v1/projects/{project_id}/benchmark-comparisons",
            json={
                "run_ids": [runs["run_a"], runs["run_b"]],
                "group_by": "MODEL",
                "baseline_run_id": runs["run_a"],
            },
        ),
        expected_status=201,
    )
    assert comparison["baseline_run_id"] == runs["run_a"]
    assert len(comparison["runs"]) == 2
    assert comparison["delta_epsilon"] == 0.0001
    assert len(comparison["metric_rows"]) == 8
    assert comparison["mutation_guard"] == {
        "candidate_graph_mutated": False,
        "published_graph_mutated": False,
        "evaluation_run_started": False,
        "gold_set_mutated": False,
    }

    listed = _json(client.get(f"/api/v1/projects/{project_id}/benchmark-comparisons"))
    assert any(item["id"] == comparison["id"] for item in listed["items"])
    assert listed["items"][0]["run_count"] == 2

    fetched = _json(client.get(f"/api/v1/benchmark-comparisons/{comparison['id']}"))
    assert fetched["id"] == comparison["id"]
    assert fetched["metric_rows"] == comparison["metric_rows"]


def test_delta_math_and_epsilon_boundary() -> None:
    ctx = _seed()
    project_id = ctx["project_id"]
    runs = _build_dataset_with_runs(project_id, ctx)
    comparison = _json(
        client.post(
            f"/api/v1/projects/{project_id}/benchmark-comparisons",
            json={
                "run_ids": [runs["run_a"], runs["run_b"]],
                "group_by": "MODEL",
                "baseline_run_id": runs["run_a"],
                "metric_names": ["ENTITY_F1"],
            },
        ),
        expected_status=201,
    )
    row = comparison["metric_rows"][0]
    # Two deterministic runs on the same dataset produce identical metrics -> UNCHANGED.
    baseline_cell = next(c for c in row["per_run"] if c["run_id"] == runs["run_a"])
    other_cell = next(c for c in row["per_run"] if c["run_id"] == runs["run_b"])
    assert baseline_cell["delta"] == 0.0
    assert baseline_cell["delta_status"] == "UNCHANGED"
    assert other_cell["delta"] == 0.0
    assert other_cell["delta_status"] == "UNCHANGED"

    # Unit-level epsilon boundary on the pure builder.
    from app.modules.benchmark.service import DELTA_EPSILON

    assert DELTA_EPSILON == 0.0001


def test_not_comparable_when_metric_not_applicable() -> None:
    ctx = _seed()
    project_id = ctx["project_id"]
    # Empty dataset -> all metrics NOT_APPLICABLE on both runs.
    dataset = _json(
        client.post(
            f"/api/v1/projects/{project_id}/evaluation-datasets",
            json={"name": "Empty benchmark"},
        ),
        expected_status=201,
    )

    def _run() -> str:
        return _json(
            client.post(
                f"/api/v1/projects/{project_id}/evaluation-runs",
                json={
                    "dataset_id": dataset["id"],
                    "run_mode": "DETERMINISTIC_MOCK",
                    "model_name": "deterministic-mock",
                },
            ),
            expected_status=201,
        )["id"]

    run_a, run_b = _run(), _run()
    comparison = _json(
        client.post(
            f"/api/v1/projects/{project_id}/benchmark-comparisons",
            json={
                "run_ids": [run_a, run_b],
                "group_by": "MODEL",
                "metric_names": ["ENTITY_F1"],
            },
        ),
        expected_status=201,
    )
    row = comparison["metric_rows"][0]
    assert row["baseline_metric_status"] == "NOT_APPLICABLE"
    assert "MISSING_METRIC" in row["row_comparability_flags"]
    for cell in row["per_run"]:
        assert cell["delta"] is None
        assert cell["delta_status"] == "NOT_COMPARABLE"
    assert "MISSING_METRIC" in comparison["comparability_summary"]["flags"]


def test_eligibility_and_exclusion_reasons() -> None:
    ctx = _seed()
    project_id = ctx["project_id"]
    runs = _build_dataset_with_runs(project_id, ctx)
    # legacy failed run + nonexistent + duplicate + cross project
    failed_run = f"{project_id}-eval-run-failed"
    other_project_run = "some-other-project-eval-run-success"

    resp = client.post(
        f"/api/v1/projects/{project_id}/benchmark-comparisons",
        json={
            "run_ids": [
                runs["run_a"],
                runs["run_a"],  # duplicate
                runs["run_b"],
                failed_run,  # not terminal success
                "does-not-exist",  # run not found
                other_project_run,  # different project
            ],
            "group_by": "MODEL",
        },
    )
    comparison = _json(resp, expected_status=201)
    reasons = {e["run_id"]: e["exclusion_reason"] for e in comparison["excluded_runs"]}
    assert reasons[runs["run_a"]] == "DUPLICATE_RUN_ID"
    assert reasons[failed_run] == "NOT_TERMINAL_SUCCESS"
    assert reasons["does-not-exist"] == "RUN_NOT_FOUND"
    assert reasons[other_project_run] == "DIFFERENT_PROJECT"
    assert {r["run_id"] for r in comparison["runs"]} == {runs["run_a"], runs["run_b"]}


def test_insufficient_runs_returns_400() -> None:
    ctx = _seed()
    project_id = ctx["project_id"]
    runs = _build_dataset_with_runs(project_id, ctx)
    resp = client.post(
        f"/api/v1/projects/{project_id}/benchmark-comparisons",
        json={"run_ids": [runs["run_a"], "does-not-exist"], "group_by": "MODEL"},
    )
    body = _json(resp, expected_status=400)
    assert body["error"]["code"] == "BENCHMARK_INSUFFICIENT_RUNS"


def test_baseline_ineligible_returns_400() -> None:
    ctx = _seed()
    project_id = ctx["project_id"]
    runs = _build_dataset_with_runs(project_id, ctx)
    resp = client.post(
        f"/api/v1/projects/{project_id}/benchmark-comparisons",
        json={
            "run_ids": [runs["run_a"], runs["run_b"]],
            "group_by": "MODEL",
            "baseline_run_id": "does-not-exist",
        },
    )
    body = _json(resp, expected_status=400)
    assert body["error"]["code"] == "BENCHMARK_BASELINE_INELIGIBLE"


def test_confusion_matrix_sparse_none_sentinel_and_drilldown() -> None:
    ctx = _seed()
    project_id = ctx["project_id"]
    runs = _build_dataset_with_runs(project_id, ctx)
    comparison = _json(
        client.post(
            f"/api/v1/projects/{project_id}/benchmark-comparisons",
            json={"run_ids": [runs["run_a"], runs["run_b"]], "group_by": "MODEL"},
        ),
        expected_status=201,
    )

    matrix = _json(
        client.get(
            f"/api/v1/benchmark-comparisons/{comparison['id']}/confusion-matrix",
            params={"run_id": runs["run_a"], "axis": "ENTITY_CLASS"},
        )
    )
    assert matrix["axis"] == "ENTITY_CLASS"
    # Missing LLC (class-company) -> (class-company, __NONE__); Extra Entity (class-extra)
    # -> (__NONE__, class-extra). Matched Acme/Beta -> diagonal.
    assert "__NONE__" in matrix["labels"]
    none_cells = [
        c for c in matrix["cells"] if "__NONE__" in (c["gold_label"], c["candidate_label"])
    ]
    assert none_cells, "expected at least one __NONE__ false-pos/neg cell"
    diagonal = [c for c in matrix["cells"] if c["is_diagonal"]]
    assert diagonal, "expected diagonal true-positive cells"
    for cell in diagonal:
        assert cell["contributing_error_case_ref"]["error_case_count"] == 0

    # totals/accuracy honest
    assert matrix["totals"]["accuracy_status"] == "MEASURED"
    assert matrix["mutation_guard"]["gold_set_mutated"] is False

    # Drill an off-diagonal error cell.
    error_cell = next(
        c
        for c in matrix["cells"]
        if c["contributing_error_case_ref"]["error_case_count"] > 0
    )
    drill = _json(
        client.get(
            f"/api/v1/benchmark-comparisons/{comparison['id']}"
            f"/confusion-matrix/cells/{error_cell['id']}/error-cases"
        )
    )
    assert drill["cell_id"] == error_cell["id"]
    assert len(drill["error_cases"]) == error_cell["contributing_error_case_ref"]["error_case_count"]
    assert all("error_type" in ec for ec in drill["error_cases"])


def test_confusion_matrix_empty_axis_not_applicable() -> None:
    ctx = _seed()
    project_id = ctx["project_id"]
    # Empty dataset -> no entities/relations -> empty matrix.
    dataset = _json(
        client.post(
            f"/api/v1/projects/{project_id}/evaluation-datasets",
            json={"name": "Empty"},
        ),
        expected_status=201,
    )

    def _run() -> str:
        return _json(
            client.post(
                f"/api/v1/projects/{project_id}/evaluation-runs",
                json={"dataset_id": dataset["id"], "run_mode": "DETERMINISTIC_MOCK"},
            ),
            expected_status=201,
        )["id"]

    run_a, run_b = _run(), _run()
    comparison = _json(
        client.post(
            f"/api/v1/projects/{project_id}/benchmark-comparisons",
            json={"run_ids": [run_a, run_b], "group_by": "MODEL"},
        ),
        expected_status=201,
    )
    matrix = _json(
        client.get(
            f"/api/v1/benchmark-comparisons/{comparison['id']}/confusion-matrix",
            params={"run_id": run_a, "axis": "RELATION_TYPE"},
        )
    )
    assert matrix["cells"] == []
    assert matrix["totals"]["accuracy"] is None
    assert matrix["totals"]["accuracy_status"] == "NOT_APPLICABLE"


def test_confusion_matrix_requires_run_in_comparison() -> None:
    ctx = _seed()
    project_id = ctx["project_id"]
    runs = _build_dataset_with_runs(project_id, ctx)
    comparison = _json(
        client.post(
            f"/api/v1/projects/{project_id}/benchmark-comparisons",
            json={"run_ids": [runs["run_a"], runs["run_b"]], "group_by": "MODEL"},
        ),
        expected_status=201,
    )
    resp = client.get(
        f"/api/v1/benchmark-comparisons/{comparison['id']}/confusion-matrix",
        params={"run_id": "not-a-compared-run", "axis": "ENTITY_CLASS"},
    )
    body = _json(resp, expected_status=404)
    assert body["error"]["code"] == "BENCHMARK_RUN_NOT_IN_COMPARISON"


def test_comparison_not_found() -> None:
    _seed()
    body = _json(client.get("/api/v1/benchmark-comparisons/nope"), expected_status=404)
    assert body["error"]["code"] == "BENCHMARK_COMPARISON_NOT_FOUND"


def test_cell_not_found_for_bad_cell_id() -> None:
    ctx = _seed()
    project_id = ctx["project_id"]
    runs = _build_dataset_with_runs(project_id, ctx)
    comparison = _json(
        client.post(
            f"/api/v1/projects/{project_id}/benchmark-comparisons",
            json={"run_ids": [runs["run_a"], runs["run_b"]], "group_by": "MODEL"},
        ),
        expected_status=201,
    )
    body = _json(
        client.get(
            f"/api/v1/benchmark-comparisons/{comparison['id']}"
            f"/confusion-matrix/cells/garbage-cell/error-cases"
        ),
        expected_status=404,
    )
    assert body["error"]["code"] == "CONFUSION_CELL_NOT_FOUND"
