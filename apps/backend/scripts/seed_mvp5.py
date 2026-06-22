from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.modules.mvp5 import service
from scripts.seed_mvp4 import seed_mvp4


def seed_mvp5(*, output: Path | None = None, reset: bool = True) -> dict[str, Any]:
    base = seed_mvp4(reset=reset)
    service.reset_runtime_state()
    result = {
        **base,
        **service.seed_summary(),
    }
    if output is not None:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(
            json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed deterministic MVP5 smoke data.")
    parser.add_argument("--output", type=Path, help="Optional JSON output file path.")
    parser.add_argument(
        "--no-reset",
        action="store_true",
        help="Reuse the fixed project and report MVP5 examples without clearing it first.",
    )
    args = parser.parse_args()
    result = seed_mvp5(output=args.output, reset=not args.no_reset)
    print(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
