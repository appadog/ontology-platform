# Release / Demo Packaging Checklist

Status: `WAVE62 — EXECUTED (supersedes the unexecuted Wave27 orders, scope updated to MVP1–MVP6.12)`
Date: 2026-07-15
Owner: 총괄(commander)

Wave27(`docs/handoffs/wave-027/NEXT_ORDERS.md`, 2026-06-19)는 MVP1–5 시점에 작성된 뒤 사용자 지시로 MVP6 진입이 우선되며 실행되지 않았습니다. 이 문서는 그 의도(재현 가능한 로컬 데모, 명령 매트릭스, 시드/스모크 안내, no-secret 체크리스트, 릴리스 핸드오프 자료)를 **현재 전체 범위(MVP1–MVP6.12 + UI/UX + 디자인 시스템)** 로 갱신해 실행한 결과물입니다.

---

## 1. 로컬 데모 — 처음부터 끝까지

### 1.1 사전 준비
```bash
git clone <repo>
cd ontology-platform
```

### 1.2 백엔드 (mock LLM, SQLite 또는 Postgres)
```bash
cd apps/backend
cp .env.example .env
poetry install
# 코어(MVP1-5, 게시 그래프)는 PostgreSQL 필요 — 아래 1.4의 compose로 기동하거나
# 로컬 SQLite로 빠르게 확인만 하려면 DATABASE_URL을 sqlite로 덮어씁니다:
#   DATABASE_URL="sqlite+pysqlite:///./_local.db" poetry run alembic upgrade head
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
헬스체크: `curl http://localhost:8000/health` → `{"status":"ok",...}`. OpenAPI 문서: `http://localhost:8000/docs`.

### 1.3 프론트엔드 (mock API 기본값)
```bash
cd apps/frontend
npm install
npm run dev
```
`http://127.0.0.1:5173` — 기본은 **mock API**(백엔드 없이도 전체 UI 데모 가능). 실제 백엔드로 전환하려면:
```bash
VITE_USE_MOCK_API=false VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

### 1.4 전체 스택 (Docker Compose, 로컬 개발용)
```bash
cd infra/local
cp .env.example .env
docker compose up --build
```
Postgres/Redis/MinIO/Neo4j 포함. 포트: backend 8000 · frontend 5173 · postgres 5432 · redis 6379 · minio 9000/9001 · neo4j 7474/7687. (`infra/local/README.md` 참고.)

### 1.5 프로덕션 스타일 (AWS 배포 전 로컬 검증)
Docker 이미지 빌드/AWS(EC2 Compose 또는 ECR+ECS) 배포는 [`DEPLOYMENT.md`](DEPLOYMENT.md) 참고 — 동일-출처 nginx 리버스 프록시, private GitHub 의존성(`hana-style-component`) SSH 인증 절차 포함.

### 1.6 데모 시나리오
[`USER_GUIDE.md`](USER_GUIDE.md) §3 "20분 따라하기"를 그대로 따라가면 온톨로지 설계 → 소스 업로드 → 추출 → 검수 → 게시 → 시각화까지 첫 사이클을 재현할 수 있습니다. 데모 발표용으로는 이 순서를 그대로 스크립트로 사용하세요.

## 2. 시드 스크립트 + 산출물 위치

| 스크립트 | 대상 | 산출물 |
|---|---|---|
| `apps/backend/scripts/seed_mvp1.py` | MVP1 프로젝트/온톨로지/소스 | DB에 직접 시드 |
| `apps/backend/scripts/seed_mvp3.py` | MVP3 검수/게시 흐름 | `--output <path>.json` (예: `/tmp/ontology-mvp3-seed.json`) |
| `apps/backend/scripts/seed_mvp4.py` | MVP4 품질/검색 | `--output <path>.json` |
| `apps/backend/scripts/seed_mvp5.py` | MVP5 관리자/조직 (MVP3/4 상위집합) | `--output <path>.json` |

예:
```bash
cd apps/backend
DATABASE_URL="sqlite+pysqlite:////tmp/ontology-mvp5-seed.db" \
  .venv/bin/python scripts/seed_mvp5.py --output /tmp/ontology-mvp5-seed.json
```
MVP6.x 대부분의 액추얼 스모크는 **API를 통해 자체 시드**하므로 별도 시드 스크립트가 필요 없습니다(`scripts/mvp6-*-actual-api-smoke.mjs`의 `seedActualApi()`).

## 3. 스모크 명령 매트릭스 (28개, `apps/frontend/package.json`)

| 그룹 | mock | actual |
|---|---|---|
| 코어 MVP2-6 | `smoke:mvp6:mock` | `smoke:mvp2:actual`, `smoke:mvp3:actual`, `smoke:mvp4:actual`(+`:mock`), `smoke:mvp5:actual`(+`:mock`), `smoke:mvp6:actual` |
| Gold Set/Benchmark | `smoke:mvp6:goldset:mock`, `smoke:mvp6:benchmark:mock` | `...:actual` 대응 |
| Governance | `smoke:mvp6:governance:mock`, `smoke:mvp6:governance-apply:mock` | `...:actual` 대응 |
| Impact/Copilot/Connectors/Tenancy/Learning/Graphviz | `smoke:mvp6:{impact,copilot,connectors,tenancy,learning,graphviz}:mock` | `...:actual` 대응 |

**mock 스모크**는 프론트 dev 서버만 필요(`npm run dev` 후 실행). **actual 스모크**는 백엔드(§1.2)와 프론트(§1.3, `VITE_USE_MOCK_API=false`)를 모두 부팅한 상태에서 실행합니다.

```bash
# 예: mock 배터리 일괄 실행 (dev 서버가 떠 있는 상태에서)
for s in mvp4:mock mvp5:mock mvp6:mock mvp6:benchmark:mock mvp6:connectors:mock \
         mvp6:copilot:mock mvp6:goldset:mock mvp6:governance-apply:mock \
         mvp6:governance:mock mvp6:graphviz:mock mvp6:impact:mock \
         mvp6:learning:mock mvp6:tenancy:mock; do
  npm run smoke:$s
done
```

Wave-057 전체 회귀 결과: **mock 13/13 PASS**, **actual 14 PASS + 1 DEFERRED**(하네스 갭, `RELEASE_NOTES.md` §5 참고). 백엔드는 `cd apps/backend && .venv/bin/pytest -q` (276 tests) + `ruff check app tests scripts`.

## 4. No-secret 체크리스트 (이번 wave에서 실행·확인)

```bash
# 1) .env가 커밋되지 않았는지
git ls-files | grep -E '(^|/)\.env$|(^|/)\.env\.'   # .env.example 외에는 결과 없어야 함

# 2) .gitignore가 .env를 덮는지
grep -n '^\.env' .gitignore                          # .env / .env.* 확인

# 3) 자격증명 모양 리터럴 스캔 (실제 시크릿 없음 확인됨)
git grep -nIE "(api[_-]?key|secret|password|token)\s*[:=]\s*[\"'][A-Za-z0-9_\-]{12,}[\"']" \
  -- '*.py' '*.ts' '*.tsx' '*.json' ':!*/node_modules/*' ':!*.lock'
```
**결과(2026-07-15 실행)**: 트래킹된 `.env` 없음, `.gitignore`가 `.env`/`.env.*` 커버, 리터럴 스캔은 상태-배지 enum 토큰(`StatusBadge token="..."`)만 매칭되고 실제 자격증명은 없음. **PASS.**

## 5. 환경 예외 (제품 결함 아님)

- Docker CLI가 이 개발 환경에 없어 `docker compose up`/`docker build` **실측은 미수행** — YAML/entrypoint 문법·`npm ci`/`poetry install`/부팅 명령은 모두 검증됨. 사용자 환경에서 최초 1회 실행 확인 권장.
- PostgreSQL/Redis/MinIO/Neo4j 로컬 compose는 코어(MVP1-5) 대상이며, MVP6.x 대부분은 프로세스 로컬 결정적 fixture로 별도 인프라 없이 동작.

## 6. 롤백 / 복구 노트

- **백엔드 마이그레이션 실패 시**: `poetry run alembic downgrade -1`로 한 단계 되돌린 뒤 원인 조사. 프로덕션에서는 마이그레이션을 서버 기동과 분리해 1회성으로 실행(`DEPLOYMENT.md` §3 참고).
- **actual 스모크 실패 시**: 대부분 백엔드/프론트 부팅 순서·env 문제. `curl localhost:8000/health` 먼저 확인 → 프론트가 `VITE_API_BASE_URL`을 올바르게 가리키는지 확인 → 스모크 재실행.
- **시드 데이터 꼬임**: 로컬 DB/파일을 지우고(`rm _local.db` 등) `alembic upgrade head`부터 재실행. 프로덕션 데이터에는 영향 없음(로컬/스모크 전용 시드).
- **프론트 빌드 실패**: `npm ci`(락파일 기준 클린 설치) 후 재시도. private 의존성(`hana-style-component`) SSH 인증 문제면 `DEPLOYMENT.md` §4.3.

## 7. 릴리스 핸드오프 요약

- 범위/품질 상태: [`RELEASE_NOTES.md`](RELEASE_NOTES.md)
- 사용자 매뉴얼: [`USER_GUIDE.md`](USER_GUIDE.md)
- 배포 가이드(Docker/AWS): [`DEPLOYMENT.md`](DEPLOYMENT.md)
- 전체 웨이브 이력/상태판: `docs/handoffs/CURRENT_STATE.md`
- 이 체크리스트가 다루지 않는 세부 계약/스키마는 `docs/api/openapi-*.json` 및 각 MVP별 `docs/api/*_API_CONTRACT_DRAFT.md` 참고.

## 8. 권고

**릴리스/데모 핸드오프 준비 완료.** 남은 항목은 전부 P1/P2/P3 팔로업(제품 결함 아님, `RELEASE_NOTES.md` §5)이며 릴리스를 막지 않습니다.
