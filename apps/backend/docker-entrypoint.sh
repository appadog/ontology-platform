#!/bin/sh
# ---------------------------------------------------------------------------
# Backend container entrypoint.
# - Optionally applies DB migrations before starting (RUN_MIGRATIONS=true).
# - Then execs the container command (CMD, or the command from compose/ECS),
#   so this works for both the prod server and the local dev override.
# ---------------------------------------------------------------------------
set -e

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "[entrypoint] RUN_MIGRATIONS=true -> alembic upgrade head"
  alembic upgrade head
fi

# No command supplied (should not happen with the image CMD) -> sane default.
if [ "$#" -eq 0 ]; then
  set -- uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --workers "${WEB_CONCURRENCY:-2}"
fi

echo "[entrypoint] starting: $*"
exec "$@"
