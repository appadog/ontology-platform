from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal
from app.main import app
from app.modules.mvp4.quality_proof import build_quality_recompute_proof
from scripts.seed_mvp3 import PROJECT_ID, seed_mvp3

client = TestClient(app)


def seed_mvp4(*, reset: bool = True) -> dict[str, Any]:
    base = seed_mvp3(reset=reset)
    project_id = base["project_id"]

    quality = _request("get", f"/api/v1/projects/{project_id}/quality/metrics")
    datasets = _request("get", f"/api/v1/projects/{project_id}/evaluation-datasets")
    active_dataset = next(dataset for dataset in datasets if dataset["status"] == "ACTIVE")
    active_version_id = active_dataset["active_version_id"]
    golden_items = _request(
        "get",
        f"/api/v1/evaluation-dataset-versions/{active_version_id}/golden-items",
    )
    runs = _request("get", f"/api/v1/projects/{project_id}/evaluation-runs")
    experiments = _request("get", f"/api/v1/projects/{project_id}/prompt-experiments")
    search = _request("get", f"/api/v1/projects/{project_id}/search", params={"q": "Acme"})
    vector = _request("get", f"/api/v1/projects/{project_id}/vector/status")
    answered = _request(
        "post",
        f"/api/v1/projects/{project_id}/rag/answers",
        json={"question": "Which department belongs to Acme?", "max_citations": 3},
    )
    insufficient = _request(
        "post",
        f"/api/v1/projects/{project_id}/rag/answers",
        json={"question": "What candidate-only fact should answer this?", "max_citations": 3},
    )
    graph = _request("get", f"/api/v1/projects/{project_id}/published-graph/explore")
    too_large = _request(
        "get",
        f"/api/v1/projects/{project_id}/published-graph/explore",
        params={"max_hops": 4},
    )
    external_graph = _request(
        "get",
        f"/api/v1/external/projects/{project_id}/published-graph/current",
        headers={"X-Dev-Auth": "mvp4-dev"},
    )
    with SessionLocal() as db:
        quality_recompute_proof = build_quality_recompute_proof(db, project_id, api_body=quality)

    return {
        **base,
        "mvp4": {
            "quality_metric_ids": [
                metric["metric_id"]
                for group in quality["metric_groups"]
                for metric in group["metrics"]
            ],
            "dataset_ids": [dataset["id"] for dataset in datasets],
            "active_dataset_version_id": active_version_id,
            "golden_item_ids": [item["id"] for item in golden_items],
            "evaluation_run_ids": [run["id"] for run in runs],
            "prompt_experiment_ids": [experiment["id"] for experiment in experiments],
            "search_group_kinds": [group["kind"] for group in search["groups"]],
            "vector_status": vector["status"],
            "rag_answered_state": answered["state"],
            "rag_insufficient_state": insufficient["state"],
            "graph_state": graph["state"],
            "graph_too_large_state": too_large["state"],
            "external_auth_mode": external_graph["auth_mode"],
            "quality_recompute_proof": quality_recompute_proof,
            "candidate_exclusion_proof": {
                "rag_insufficient_reason": insufficient["insufficient_evidence"]["reason_code"],
                "external_graph_candidate_fact_count": 0,
                "graph_candidate_node_count": 0,
            },
            "recommended_frontend_routes": [
                f"/projects/{PROJECT_ID}/quality",
                f"/projects/{PROJECT_ID}/search",
                f"/projects/{PROJECT_ID}/rag",
                f"/projects/{PROJECT_ID}/published-graph/explore",
                f"/projects/{PROJECT_ID}/evaluation",
                f"/projects/{PROJECT_ID}/external-api",
            ],
        },
    }


def _request(
    method: str,
    path: str,
    *,
    expected_status: int = 200,
    **kwargs: Any,
) -> Any:
    response = getattr(client, method)(path, **kwargs)
    if response.status_code != expected_status:
        raise RuntimeError(
            f"{method.upper()} {path} returned {response.status_code}, "
            f"expected {expected_status}: {response.text}"
        )
    return response.json()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed deterministic MVP4 smoke data.")
    parser.add_argument("--output", type=Path, help="Optional JSON output file path.")
    parser.add_argument(
        "--no-reset",
        action="store_true",
        help="Reuse the fixed project and report MVP4 examples without clearing it first.",
    )
    args = parser.parse_args()
    result = seed_mvp4(reset=not args.no_reset)
    text = json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text + "\n", encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()
