# Ontology Data Platform

문서(CSV·Excel·PDF·TXT)에서 LLM이 추출한 지식을 후보 단계에서 검증한 뒤 게시해, 근거가 남는 신뢰할 수 있는 지식 그래프를 만드는 운영 플랫폼입니다.

**현재 상태: MVP1–MVP6.12 전체 완료, 전체 회귀 GREEN.** 최신 상태는 항상 [`docs/handoffs/CURRENT_STATE.md`](docs/handoffs/CURRENT_STATE.md)를 참고하세요.

## 문서 바로가기

| 문서 | 용도 |
|---|---|
| [`docs/RELEASE_NOTES.md`](docs/RELEASE_NOTES.md) | 완료된 제품 범위, 품질 상태, 알려진 제한 |
| [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) | 처음 쓰는 사용자를 위한 처음부터 끝까지 사용법 |
| [`docs/RELEASE_PACKAGING.md`](docs/RELEASE_PACKAGING.md) | 로컬 데모 실행·시드·스모크 명령 매트릭스·no-secret 체크리스트 |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Docker 기반 AWS 프로덕션 배포 가이드 |
| [`docs/handoffs/CURRENT_STATE.md`](docs/handoffs/CURRENT_STATE.md) | 전체 wave 이력 + 최신 상태(항상 최신) |
| `AGENTS.md` | 이 레포에서 에이전트가 작업하는 방식(총괄/역할 wave 루프) |

## 빠른 시작 (로컬 데모)

```bash
# 백엔드
cd apps/backend
cp .env.example .env
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 프론트엔드 (다른 터미널) — 기본은 mock API라 백엔드 없이도 전체 UI 데모 가능
cd apps/frontend
npm install
npm run dev
```
`http://127.0.0.1:5173` 접속 후 [`USER_GUIDE.md`](docs/USER_GUIDE.md) §3 "20분 따라하기"를 따라가면 온톨로지 설계→소스 업로드→추출→검수→게시→시각화까지 첫 사이클을 재현할 수 있습니다. 전체 스택(Postgres/Redis/MinIO/Neo4j) 기동, 시드, 스모크 명령 매트릭스는 [`docs/RELEASE_PACKAGING.md`](docs/RELEASE_PACKAGING.md)를 참고하세요.

## 저장소 구조

```text
apps/
  frontend/          React + TypeScript + Vite + styled-components
  backend/           FastAPI 모듈러 모놀리스 (Python 3.12, SQLAlchemy 2.x, Alembic)
docs/
  pm/                PM 산출물(브리프, 디자인 방향, UX 요구사항)
  api/               API 계약 + OpenAPI 드래프트
  adr/               아키텍처 의사결정 기록
  backlog/           MVP별 백로그·수용 기준
  handoffs/          wave별 역할 리포트 + CURRENT_STATE.md
infra/
  local/             로컬 Docker Compose 개발 환경
.agents/
  skills/            PM/Backend/Frontend 에이전트 작업 지시 요약
AGENTS.md            레포 전체 에이전트 운영 규칙
```

## 핵심 불변 원칙

1. **후보 ≠ 게시** — 추출 결과는 후보 그래프에만 쌓이고, 검수를 통과한 항목만 게시 그래프로 올라간다.
2. **모든 항목에 근거** — 엔티티·관계·속성마다 원천 문서 근거(evidence)와 버전이 연결되어 추적·감사 가능하다.
3. **품질을 함께 추적** — 완전성·일관성·추적성·검증 통과율을 지표로 관리한다.
4. **읽기 전용/미리보기 우선** — 코파일럿·커넥터·온톨로지 팩·거버넌스 승인 등 새 기능은 실제 변경 없는 dry-run/제안으로 시작하고, 실변경은 정식 경로(온톨로지 편집→검수→게시→거버넌스)로만 발생한다.

## 운영 방식

이 레포는 "루프엔지니어링" 방식의 멀티 에이전트 wave 루프로 개발됩니다 — PM(계획/스코프 동결) → Backend/Frontend(병렬 구현) → QA(독립 검증) 순으로 각 wave가 진행되며, 산출물은 `docs/handoffs/wave-NNN/`에 기록됩니다. 자세한 내용은 `AGENTS.md`를 참고하세요.
