from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app


def main() -> None:
    parser = argparse.ArgumentParser(description="Export FastAPI OpenAPI schema.")
    parser.add_argument(
        "--output",
        default="../../docs/api/openapi-mvp1.json",
        help="Output path for the OpenAPI JSON file.",
    )
    args = parser.parse_args()
    output_path = Path(args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(app.openapi(), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
