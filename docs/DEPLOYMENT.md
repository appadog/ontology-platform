# 배포 가이드 — Docker 기반 AWS 프로덕션

이 문서는 프론트엔드(React/Vite)와 백엔드(FastAPI)를 **Docker 이미지로 빌드해 AWS에 배포·운영**하는 방법을 설명합니다. 두 가지 경로를 제공합니다: (A) 단일 EC2 + Docker Compose, (B) ECR + ECS Fargate.

---

## 1. 아키텍처 (기본: 동일 출처 리버스 프록시)

```text
                 ┌───────────────────────────────┐
  브라우저 ──▶   │  frontend 컨테이너 (nginx:80)  │
                 │   /            → SPA 정적파일    │
                 │   /api/  ─────▶ backend:8000     │  (reverse proxy)
                 └───────────────────────────────┘
                                 │
                                 ▼
                 ┌───────────────────────────────┐
                 │  backend 컨테이너 (uvicorn:8000)│
                 │   FastAPI · /api/v1/* · /health │
                 └───────────────────────────────┘
                                 │
                                 ▼
                 PostgreSQL (번들 컨테이너 또는 AWS RDS)
```

- **동일 출처(same-origin)** 를 기본값으로 합니다. SPA는 `/api/v1/...` 를 자기 출처로 호출하고 nginx가 백엔드로 프록시합니다 → **CORS 문제 없음**, 프론트 빌드의 `VITE_API_BASE_URL=""`.
- 분리 도메인(예: `api.example.com`)을 쓰려면 §6 참고(빌드 시 `VITE_API_BASE_URL` 지정 + 백엔드 `CORS_ORIGINS`에 프론트 도메인 추가).

### 핵심 개념 (반드시 이해)
- **프론트 환경변수는 빌드 시점에 고정됩니다.** Vite는 `import.meta.env.VITE_*`를 **빌드 때** 값으로 굽습니다. 따라서 `VITE_API_BASE_URL`/`VITE_USE_MOCK_API`는 런타임 env가 아니라 **`docker build --build-arg`** 로 넣습니다. 값을 바꾸려면 **재빌드**가 필요합니다.
- **`VITE_USE_MOCK_API=false`** 를 반드시 넣어야 프론트가 mock이 아닌 실제 API를 호출합니다(기본 개발 모드는 mock).
- **백엔드 환경변수는 런타임 env** 입니다(`DATABASE_URL`, `CORS_ORIGINS` 등).

---

## 2. 산출물

| 파일 | 역할 |
|---|---|
| `apps/backend/Dockerfile` | 백엔드 멀티스테이지·비루트·헬스체크 이미지 |
| `apps/backend/docker-entrypoint.sh` | (옵션) `alembic upgrade head` 후 서버 exec |
| `apps/frontend/Dockerfile` | 프론트 Node 빌드 → nginx 서빙 이미지 |
| `apps/frontend/nginx.conf.template` | SPA fallback + `/api/` 프록시 (`${BACKEND_UPSTREAM}`) |
| `infra/prod/docker-compose.yml` | frontend + backend + (번들)postgres |
| `infra/prod/.env.example` | 프로덕션 env 템플릿(시크릿 placeholder) |

---

## 3. 경로 A — 단일 EC2 + Docker Compose (가장 빠름)

단일 서버에서 전체 스택을 올리는 방법. 소규모/데모/스테이징에 적합.

```bash
# EC2 (Amazon Linux 2023 예시)에서 Docker + compose 설치 후
git clone <repo> && cd ontology-platform/infra/prod
cp .env.example .env
#  .env 편집: POSTGRES_PASSWORD, DATABASE_URL(비밀번호 동일), CORS_ORIGINS(공개 도메인)

# 프론트 빌드는 private 의존성 때문에 SSH가 필요합니다(§4.3). ssh-agent에 키를 올린 뒤:
eval "$(ssh-agent -s)" && ssh-add ~/.ssh/id_ed25519
DOCKER_BUILDKIT=1 docker compose up -d --build   # 이미지 빌드 + 기동 (백엔드가 먼저 마이그레이션)
docker compose ps                 # 상태 확인
curl -s http://localhost/healthz  # 프론트 nginx → 백엔드 /health 프록시
```

- 프론트는 80 포트로 공개됩니다(`FRONTEND_PORT`로 변경 가능). 앞단에 ALB/CloudFront로 HTTPS를 종단하세요(§7).
- **RDS를 쓰려면**: compose에서 `postgres` 서비스와 backend의 `depends_on: postgres`를 지우고, `.env`의 `DATABASE_URL`을 RDS 엔드포인트로 지정.

### 마이그레이션
백엔드 컨테이너는 `RUN_MIGRATIONS=true`(prod compose 기본)일 때 시작 전에 `alembic upgrade head`를 실행합니다. 다중 인스턴스로 확장할 때는 마이그레이션을 **1회성 작업**으로 분리하세요:

```bash
# 한 번만 실행 (서버 기동과 분리)
docker compose run --rm -e RUN_MIGRATIONS=false backend alembic upgrade head
# 이후 서비스는 RUN_MIGRATIONS=false 로 기동
```

---

## 4. 경로 B — ECR + ECS Fargate (권장, 확장형)

이미지를 ECR에 푸시하고 ECS 서비스로 운영. RDS/ALB/Secrets Manager와 조합.

### 4.1 이미지 빌드 & ECR 푸시
```bash
ACCOUNT=123456789012 ; REGION=ap-northeast-2
aws ecr get-login-password --region $REGION | docker login --username AWS \
  --password-stdin $ACCOUNT.dkr.ecr.$REGION.amazonaws.com
aws ecr create-repository --repository-name ontology-backend  --region $REGION || true
aws ecr create-repository --repository-name ontology-frontend --region $REGION || true

# 백엔드 (linux/amd64 — Fargate는 x86_64 기본; ARM이면 --platform linux/arm64 + Graviton)
docker build --platform linux/amd64 -t ontology-backend:latest apps/backend
docker tag ontology-backend:latest $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/ontology-backend:latest
docker push $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/ontology-backend:latest

# 프론트 (API 베이스는 빌드 인자! 동일 출처면 빈 값)
# ★ 프론트는 private GitHub 의존성(hana-style-component)이 있어 SSH 인증이 필요합니다(§4.3).
DOCKER_BUILDKIT=1 docker build --platform linux/amd64 --ssh default \
  --build-arg VITE_API_BASE_URL="" \
  --build-arg VITE_USE_MOCK_API="false" \
  -t ontology-frontend:latest apps/frontend
docker tag ontology-frontend:latest $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/ontology-frontend:latest
docker push $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/ontology-frontend:latest
```

### 4.3 프론트 private 의존성 인증 (`hana-style-component`)
프론트는 `package.json`에서 `hana-style-component`을 **private GitHub 저장소**
(`git+ssh://git@github.com/appadog/hana-style-component.git`)로 받습니다. 깨끗한 Docker
빌드 환경에는 git·SSH 키가 없으므로 그대로는 `npm ci`가 실패합니다. 세 가지 해결책:

1. **BuildKit SSH 포워딩 (권장, 로컬/CI)** — 저장소 접근 권한이 있는 키를 ssh-agent에 올리고:
   ```bash
   eval "$(ssh-agent -s)" && ssh-add ~/.ssh/id_ed25519   # 또는 해당 키
   DOCKER_BUILDKIT=1 docker build --ssh default -t ontology-frontend \
     --build-arg VITE_USE_MOCK_API=false apps/frontend
   ```
   Dockerfile은 이미 `RUN --mount=type=ssh npm ci` 로 구성되어 있습니다.
2. **GitHub 토큰 (CI/ECR 파이프라인)** — 저장소 read 권한 토큰(또는 deploy key)으로 SSH→HTTPS 치환:
   ```dockerfile
   # (Dockerfile 대안) npm ci 앞에 삽입
   ARG GITHUB_TOKEN
   RUN git config --global url."https://${GITHUB_TOKEN}@github.com/".insteadOf "git@github.com:" \
    && git config --global url."https://${GITHUB_TOKEN}@github.com/".insteadOf "ssh://git@github.com/"
   ```
   `docker build --secret` 또는 `--build-arg GITHUB_TOKEN=...`(빌드 로그 노출 주의)로 주입.
3. **레지스트리 게시(장기 권장)** — `hana-style-component`을 사내 npm 레지스트리(CodeArtifact 등)에
   게시하고 `package.json`을 버전 의존성으로 바꾸면 SSH 없이 `npm ci`가 재현 가능해집니다.

> GitHub Actions에서는 `webfactory/ssh-agent` 액션으로 키를 로드한 뒤 `--ssh default`로 빌드하는 방식이 가장 단순합니다.

### 4.2 구성 권장안
- **DB**: RDS for PostgreSQL. backend task의 `DATABASE_URL`을 RDS로 지정.
- **네트워킹**:
  - 같은 태스크(같은 Task Definition)에 frontend + backend 컨테이너를 두면 `BACKEND_UPSTREAM=http://localhost:8000` (컨테이너 간 localhost). ALB는 frontend:80 으로만 라우팅.
  - 또는 서비스 분리 후 서비스 디스커버리 DNS로 `BACKEND_UPSTREAM` 지정.
- **마이그레이션**: 배포 파이프라인에서 `alembic upgrade head`를 실행하는 **일회성 ECS Task**(RUN_MIGRATIONS=false로 서버는 분리)로 수행.
- **시크릿**: `DATABASE_URL`, `POSTGRES_PASSWORD` 등은 **Secrets Manager / SSM**에서 태스크에 주입(평문 .env 금지).
- **헬스체크**: ALB 타깃 그룹 → frontend `/healthz`(백엔드 `/health` 프록시) 또는 backend `/health`.
- **로깅**: `awslogs` 드라이버로 CloudWatch Logs.

---

## 5. 환경변수 매트릭스

### 백엔드 (런타임 env)
| 변수 | 예시 | 비고 |
|---|---|---|
| `APP_ENV` | `production` | |
| `DATABASE_URL` | `postgresql+psycopg://user:pw@host:5432/db` | RDS 또는 번들 postgres |
| `CORS_ORIGINS` | `["https://app.example.com"]` | **JSON 배열** 문자열 |
| `RUN_MIGRATIONS` | `true`/`false` | true면 기동 전 마이그레이션 |
| `WEB_CONCURRENCY` | `2` | uvicorn worker 수 (≈ 2×vCPU+1) |
| `PORT` | `8000` | |
| `LLM_PROVIDER` | `mock` | 결정적 mock(외부 호출 없음) |
| `DEV_USER_ID` / `DEV_USER_NAME` | `dev-user` | 현재 actor 모델 |

### 프론트엔드 (빌드 ARG — 재빌드 필요)
| 변수 | 기본 | 비고 |
|---|---|---|
| `VITE_USE_MOCK_API` | `false` | **prod는 반드시 false** |
| `VITE_API_BASE_URL` | `""` | 동일 출처(권장). 분리 도메인이면 `https://api.example.com` |

### 프론트엔드 (런타임 env)
| 변수 | 기본 | 비고 |
|---|---|---|
| `BACKEND_UPSTREAM` | `http://backend:8000` | nginx `/api/` 프록시 대상 |

---

## 6. 분리 도메인 방식(선택)

프론트를 `app.example.com`, API를 `api.example.com` 으로 나눌 때:
1. 프론트 빌드: `--build-arg VITE_API_BASE_URL="https://api.example.com"`.
2. 백엔드: `CORS_ORIGINS=["https://app.example.com"]` 로 프론트 출처 허용.
3. 이 경우 nginx `/api/` 프록시는 불필요(정적 파일만 서빙). 동일 출처 방식이 운영이 더 단순하므로 특별한 이유가 없으면 §1 기본을 권장.

---

## 7. HTTPS / 운영 체크리스트

- [ ] ALB(또는 CloudFront) + ACM 인증서로 **HTTPS 종단**, HTTP→HTTPS 리다이렉트.
- [ ] `CORS_ORIGINS` 에 실제 공개 도메인 포함(분리 도메인 시 필수).
- [ ] 시크릿은 Secrets Manager/SSM 주입(평문 .env 커밋 금지 — `.gitignore`가 `.env` 제외).
- [ ] 마이그레이션을 배포 단계에서 1회 실행하도록 분리(다중 인스턴스 대비).
- [ ] RDS 자동 백업/스냅샷, 보안그룹(DB는 백엔드에서만 접근).
- [ ] 프론트 `VITE_USE_MOCK_API=false` 확인(mock 데이터가 프로덕션에 노출되지 않도록).
- [ ] 로그/헬스체크/오토스케일 정책 구성.

> 내부 데이터·자료를 다룰 때는 사내 절차에 따라 부서장과 협의하세요.

---

## 8. 알아두기 (현재 스택의 한계)

- 일부 MVP6 기능은 **프로세스 로컬(in-memory) 결정적 fixture** 로 동작합니다(데모/미리보기 목적). 이들은 DB 영속화 대상이 아니며, 컨테이너 재시작 시 초기화됩니다. 영속 저장이 필요한 기능(MVP1~5 코어)은 PostgreSQL + Alembic으로 관리됩니다.
- `LLM_PROVIDER=mock` 은 실제 모델을 호출하지 않습니다. 실제 LLM 연동은 별도 구현 범위입니다.
- Redis/MinIO/Neo4j 는 로컬 개발 compose(`infra/local`)에만 포함되어 있습니다. 프로덕션에서 필요한 경우 매니지드 서비스(ElastiCache/S3/Neptune 등)로 대체하고 백엔드 설정에 연결하세요.

---

## 9. 빌드 검증 (배포 전 로컬 확인)

```bash
# 프론트 프로덕션 빌드 (mock OFF, 동일 출처)
cd apps/frontend && VITE_USE_MOCK_API=false VITE_API_BASE_URL="" npm run build   # dist/ 생성

# 백엔드 부팅 스모크 (예: sqlite로 기동 확인)
cd apps/backend
APP_ENV=production DATABASE_URL="sqlite+pysqlite:///./_check.db" \
  .venv/bin/uvicorn app.main:app --port 8099 &
curl -s http://127.0.0.1:8099/health   # {"status":"ok",...}

# 이미지 빌드는 Docker가 있는 환경에서:
docker build -t ontology-backend apps/backend
eval "$(ssh-agent -s)" && ssh-add ~/.ssh/id_ed25519    # 프론트 private 의존성용(§4.3)
DOCKER_BUILDKIT=1 docker build --ssh default -t ontology-frontend \
  --build-arg VITE_USE_MOCK_API=false apps/frontend
cd infra/prod && cp .env.example .env && DOCKER_BUILDKIT=1 docker compose up -d --build
```

> ⚠️ 이 저장소 환경에는 Docker CLI가 없어 `docker build` 실측은 사용자의 머신/CI에서 수행해야
> 합니다. 대신 빌드가 사용하는 실제 명령(`npm ci && npm run build` mock=off, 백엔드 부팅+`/health`,
> compose/entrypoint 문법, `poetry install --only main`)은 모두 사전 검증했습니다.
