# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Ontology Platform — Frontend (React/Vite) production image
# Multi-stage: build the static bundle with Node, serve it with nginx.
#
# IMPORTANT: Vite bakes VITE_* variables at BUILD time (import.meta.env), so
# the API base URL and mock flag are build ARGs, not runtime env. Default is
# same-origin (VITE_API_BASE_URL=""): the SPA calls /api/v1/... and nginx
# reverse-proxies /api/ to the backend (BACKEND_UPSTREAM, a runtime env).
# ---------------------------------------------------------------------------

# ---- build: compile the static bundle -------------------------------------
FROM node:20-alpine AS build

# `hana-style-component` is a PRIVATE GitHub dependency
# (git+ssh://git@github.com/appadog/hana-style-component.git), so the build
# needs git + an SSH agent. Build with BuildKit SSH forwarding:
#     DOCKER_BUILDKIT=1 docker build --ssh default -t ontology-frontend apps/frontend
# (ensure `ssh-add` holds a key with access to that repo). Public-repo and
# GitHub-token alternatives are documented in docs/DEPLOYMENT.md §4.3.
RUN apk add --no-cache git openssh-client \
 && mkdir -p -m 0700 ~/.ssh \
 && ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null

WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=ssh npm ci

COPY . .

# Same-origin by default; override for a split API domain (then also set
# CORS_ORIGINS on the backend to include the frontend origin).
ARG VITE_API_BASE_URL=""
ARG VITE_USE_MOCK_API="false"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_USE_MOCK_API=$VITE_USE_MOCK_API

RUN npm run build

# ---- runtime: nginx serving the SPA + /api proxy --------------------------
FROM nginx:1.27-alpine AS runtime

# Reverse-proxy target for /api/ and /health. Overridable at run time.
ENV BACKEND_UPSTREAM=http://backend:8000

# nginx:alpine runs envsubst over *.template into /etc/nginx/conf.d at start,
# substituting only listed env vars (nginx's own $uri/$host are preserved).
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
