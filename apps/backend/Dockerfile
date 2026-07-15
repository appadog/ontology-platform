# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Ontology Platform — Backend (FastAPI) production image
# Multi-stage: install deps in a builder, ship a slim non-root runtime.
# Local dev (infra/local/docker-compose.yml) overrides `command:` and mounts
# the source; this image still works there because ENTRYPOINT runs optional
# migrations then `exec "$@"` (the CMD, or the compose-provided command).
# ---------------------------------------------------------------------------

# ---- builder: resolve + install main dependencies --------------------------
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.5 \
    PIP_NO_CACHE_DIR=1

RUN pip install --no-cache-dir "poetry==$POETRY_VERSION"

WORKDIR /app
COPY pyproject.toml README.md ./

# Install ONLY main deps into the system site-packages (no dev, no app root).
RUN poetry config virtualenvs.create false \
 && poetry install --only main --no-root --no-interaction --no-ansi

# ---- runtime: slim, non-root ----------------------------------------------
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    WEB_CONCURRENCY=2 \
    APP_ENV=production

# Bring over the installed dependencies and their console scripts
# (uvicorn, alembic) from the builder.
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

WORKDIR /app
COPY . .

# Run as an unprivileged user.
RUN adduser --disabled-password --gecos "" --uid 10001 appuser \
 && chmod +x docker-entrypoint.sh \
 && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Liveness: hit the app's /health with the stdlib (no curl in slim).
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD python -c "import sys,urllib.request; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4).status==200 else 1)"

# ENTRYPOINT runs optional `alembic upgrade head` (RUN_MIGRATIONS=true) then
# execs the CMD below (or the command supplied by compose/ECS).
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
