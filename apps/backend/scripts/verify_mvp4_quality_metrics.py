from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal
from app.modules.mvp4.quality_proof import QUALITY_RECOMPUTE_ARTIFACT_PATH
from app.modules.mvp4.quality_proof import build_quality_recompute_proof
from scripts.seed_mvp3 import PROJECT_ID
from scripts.seed_mvp4 import seed_mvp4


def main() -> None:
    parser = argparse.ArgumentParser(description="Verify MVP4 quality metric recomputation proof.")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(QUALITY_RECOMPUTE_ARTIFACT_PATH),
        help="JSON proof output path.",
    )
    parser.add_argument(
        "--no-reset",
        action="store_true",
        help="Use the current deterministic project state instead of reseeding it first.",
    )
    args = parser.parse_args()

    if args.no_reset:
        with SessionLocal() as db:
            proof = build_quality_recompute_proof(db, PROJECT_ID)
    else:
        seed = seed_mvp4(reset=True)
        proof = seed["mvp4"]["quality_recompute_proof"]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(proof, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(proof, ensure_ascii=False, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
