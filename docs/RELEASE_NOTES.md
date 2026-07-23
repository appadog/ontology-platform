# Release Notes — Ontology Data Platform

이 문서는 현재까지 완성된 제품 범위를 릴리스/데모 관점에서 요약합니다. 세부 wave별 이력은 `docs/handoffs/CURRENT_STATE.md`(항상 source of truth)를 참고하세요.

기준일: 2026-07-15 · 상태: **MVP1–MVP6.12 전체 완료, 전체 회귀 GREEN (wave-057), 테이블/UI 디자인 시스템 업그레이드 완료 (wave-058~061)**

---

## 1. 제품 개요

문서(CSV·Excel·PDF·TXT)에서 LLM이 추출한 지식을 **후보 단계에서 검증한 뒤 게시**해, 근거가 남는 신뢰할 수 있는 지식 그래프를 만드는 운영 플랫폼입니다. 처음 쓰는 사용자를 위한 전체 흐름 안내는 [`docs/USER_GUIDE.md`](USER_GUIDE.md)를 참고하세요.

핵심 불변 원칙(전 범위에서 유지): 후보/게시 그래프 분리, 모든 항목의 근거·버전 추적, contract-first(계약 우선) 개발, 범위 가드(스코프 확장 시 항상 PM 동결 선행).

## 2. 완료된 범위

### MVP1–5 (코어 플랫폼)
- **MVP1**: 프로젝트·온톨로지(클래스/속성/관계) 모델러, 소스 업로드·프로파일링.
- **MVP2**: LLM 추출(결정적 mock provider), 후보·근거 브라우징, 재시도 체인 중복 제거.
- **MVP3**: 검증(validation)·검수(review)·감사·게시(publish) 잡·게시 그래프·품질 대시보드 v0.1.
- **MVP4**: 설명 가능한 품질 지표, 읽기 전용 검색/RAG, 벡터/유사근거 어댑터.
- **MVP5**: 조직/프로젝트 관리자 콘솔(역할, 자격증명, 승인 정책, JSON import/export dry-run, 운영, 보존/백업).

### MVP6 — 상품화 및 고급 지식운영 (6.1–6.12, 전부 완료)
| 테마 | 내용 |
|---|---|
| 6.1 Gold Set / Benchmark Studio | 평가 데이터셋, 벤치마크 실행 |
| 6.2 Active Learning | 검수 패턴 학습 → 제안(감사 전용, 자동승인 없음) |
| 6.3 Benchmark Comparison | 실행 간 비교, 컨퓨전 매트릭스 |
| 6.4 Gold Set Authoring | 골드셋 작성/버전관리, FROZEN 불변성 |
| 6.5 Governance Workflow | 온톨로지 변경 요청 검토/승인(승인=큐잉, 미적용) |
| 6.6 Governance Change Application | 승인된 변경의 실제 적용(감사 동반, 별도 사람 개시 단계) |
| 6.7 Impact Simulation | 변경 영향 dry-run 시뮬레이션 |
| 6.8 Copilot | 제안 전용 어드바이저리(실행/자동승인 없음, 결정적 mock) |
| 6.9 Connectors | 외부 시스템 dry-run 미리보기(가져오기 없음) |
| 6.10 Multi-tenant | 읽기 전용 테넌트 컨텍스트, 격리 |
| 6.11 Ontology Packs | 온톨로지 팩 카탈로그 + 적용 미리보기(dry-run) |
| 6.12 Advanced Visualization | 게시 그래프 시각화·요약(읽기 전용, all-false mutation guard) |

모든 MVP6 신규 기능은 **읽기 전용/미리보기(dry-run)** 원칙을 지키며, 실제 변경은 항상 기존 정식 경로(온톨로지 편집→검수→게시→거버넌스)로만 발생합니다.

### 제품화 트랙 (UI/UX·디자인·운영문서)
- **UI/UX 리뷰 remediation**(wave-035~038): 반응형 0-overflow, 단일 활성 LNB, D3/D6 상태배지 전면 롤아웃, 레퍼런스 기반 디자인 언어.
- **Wave-058**: 실사용 리뷰 6건 수정(한/영 카피 통일, 모바일 내비 드로어, 내부 용어 제거 등) + [`USER_GUIDE.md`](USER_GUIDE.md) 신규.
- **Wave-059**: AI SaaS(Vercel/Linear/shadcn/Supabase 등) 레퍼런스 기반 디자인 시스템 업그레이드 — Inter 폰트, 서페이스 레이어링, radius 스케일, 데스크톱 사이드바 collapse.
- **Wave-060/061**: 데이터 테이블 디자인 개선 — 공용 `CompactTable` 프리미티브(행 hover, 헤더 sticky/톤, 숫자 우측정렬)로 사실상 전체 테이블 통일.
- **배포**: Docker 기반 AWS 프로덕션 배포 가이드 — [`DEPLOYMENT.md`](DEPLOYMENT.md).

## 3. 품질 상태 (Wave-057 전체 회귀 기준)

- 백엔드: **276 tests passed**, ruff clean, OpenAPI 드래프트 17/17 파싱 OK.
- 프론트엔드: **116 tests passed**, build PASS.
- Mock 스모크: **13/13 PASS**. Actual-API 스모크: **14 PASS + 1 DEFERRED**(하네스 갭, 제품 결함 아님 — §5 참고).
- **제품 회귀 0건.**

## 4. 알려진 범위 밖 / 의도된 제한

- 일부 MVP6 상세 기능(코파일럿, 커넥터, 온톨로지 팩, 임팩트 시뮬레이션, 텐넌시)은 **프로세스 로컬 결정적 fixture**로 동작 — 데모/미리보기 목적이며 DB 영속화 대상이 아닙니다(컨테이너/프로세스 재시작 시 초기화). 코어(MVP1-5, 게시 그래프)는 PostgreSQL + Alembic으로 영속화됩니다.
- `LLM_PROVIDER=mock` — 실제 LLM 호출 없음(결정적 mock). 실제 모델 연동은 별도 구현 범위.
- Redis/MinIO/Neo4j는 로컬 개발 compose(`infra/local`)에만 포함 — 프로덕션에서는 매니지드 서비스로 대체 권장(`DEPLOYMENT.md` §8).
- Docker/PostgreSQL Compose 실측(`docker compose up`)은 이 개발 환경에 Docker CLI가 없어 미실행 — 명령/entrypoint/YAML 문법은 검증됨, 실제 `docker build`/`up`은 사용자 환경에서 최초 1회 확인 필요.

## 5. 하네스 팔로업 (제품 결함 아님, P3)

- `smoke:mvp3:actual` — 레거시 카드가 기본 접힘 `<details>` 안에 있어 마지막 assertion이 못 펼침(UI/데이터는 정상, 스모크 스크립트만 보강 필요).
- `smoke:mvp5:actual` — 조직 ID 환경변수 주입 + 격리된 DB 필요(다른 self-seed 스모크와 공유 DB에서 실행 시 충돌).
- `smoke:mvp6:graphviz:actual` / `smoke:mvp6:*:actual` 일부 — 아직 실제 백엔드 부팅 상태로 정기 실행되지 않음(mock 스모크로 대체 커버, 다음 통합 게이트에서 실행 권장).
- 게시 큐(`/publish`)·품질 대시보드(`/quality`) 화면에 아직 영문 카피 잔존(wave-058 F1이 검수/게시그래프/소스 3개 화면만 처리) — 다음 카피 정리 후속.
- 프론트 메인 JS 청크가 650KB 경고 임계 초과(759KB, wave-059 폰트/컴포넌트 추가분) — `manualChunks` 코드분할 조정 권장.

## 6. 다음 후보

1. 위 §5 하네스/카피/번들 팔로업 스윕.
2. AWS 실배포 1회 검증(`docker build` + `docker compose up`, 사용자 환경).
3. 전체 저장소 스캔 기반 새 하드닝 대상 발굴.
