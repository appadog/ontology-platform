# UI/UX Review Report — Full Product (MVP1–MVP6.3)

- 작성일: 2026-06-26
- 리뷰어 역할: Senior Product Designer / UX Researcher / UX Auditor / QA Tester / Product Reviewer / Conversion Optimization Consultant
- 대상: ontology-platform 프론트엔드 (apps/frontend, Vite mock 모드)
- 검증 방식: mock 모드 실제 구동 + Playwright(chromium) 스크린샷 캡처 후 육안 판독
- 캡처 범위: 29개 라우트, 6개 해상도 매트릭스, 총 123장 스크린샷 (코드만 검토한 화면 없음 — 전 라우트 200 응답, 로드 에러 0)
- 캡처 해상도: Desktop 1920x1080 / 1440x900, Laptop 1366x768 / 1280x800, Tablet 1024x768 / 768x1024 (모바일 제외, 스펙 준수)

> 본 보고서는 `docs/pm/ui_ux_reviewer_long.md` 의 "최종 결과 보고서 형식" 1~10 구조를 그대로 따른다. 모든 이슈는 문제(어디서)/원인/사용자 영향/개선안/완료 기준을 포함한다.

---

## 1. Executive Summary

### 점수

```text
사용성:          78 / 100
UI 완성도:        84 / 100
반응형 안정성:     80 / 100
상품화 가능성:     70 / 100
종합 점수:        78 / 100
```

### 총평

전반적으로 "운영 워크플로우 제품"으로서 완성도가 높다. 토큰 기반의 일관된 라이트 테마, 강한 요약 카드 + KPI strip + 세그먼트 탭 + 컨텍스트 디테일 패널이라는 MVP6 스타일 가이드 방향이 Review Workbench / Published Graph / Quality / Benchmark / Learning Insights / Evaluation 전반에 잘 적용되어 있고, read-only/감사 안전 카피("Recommendation only", "No prompt version was changed", "preview-only")가 명확히 노출된다. 빈 상태/로딩/권한 제한/stale 상태 설계도 대부분 갖춰져 있어 데모 티가 적고 전문 도구처럼 보인다.

다만 출시 관점에서 두 가지 구조적 약점이 있다. 첫째, **전역 LNB(좌측 네비)가 MVP1~3 범위(Dashboard/Projects/Ontology/Sources/Extraction/Candidates/Admin)에서 멈춰 있어** MVP4~6의 핵심 가치 화면(Review/Publish/Published Graph/Quality/Search/RAG/Evaluation/Learning Insights/Benchmark/External API)이 전역 메뉴에서 보이지 않는다. 이 화면들은 오직 Project Detail 허브의 카드와 각 화면 내부의 보조 탭을 통해서만 도달 가능하다 — 즉 제품의 가장 비싼 기능들이 "숨어" 있다. 둘째, **Candidate Results 화면의 entity/relation 테이블이 문서 수준 가로 스크롤(최대 +84px)을 유발**한다.

상품화 측면에서는 가치 제안(무엇을/왜)을 첫 화면에서 전달하는 온보딩/설명 레이어가 없고, 한국어·영어 카피가 한 화면에 혼재해 일관성이 떨어진다. 이 둘은 P1~P2로 출시 전후에 보완 가능하다.

---

## 2. Critical Findings

### 가장 심각한 문제 (P1)
- **MVP4~6 핵심 기능이 전역 네비게이션에서 접근 불가.** 좌측 LNB는 7개 항목(Dashboard/Projects/Ontology/Sources/Extraction/Candidates/Admin)에서 끝난다. Quality/Review/Publish/Published Graph/Search/RAG/Evaluation/Learning Insights/Benchmark/External API는 LNB에 없고 Project Detail 화면 카드 + 각 화면 내부 탭으로만 진입한다. 사용자는 "이 제품이 분석/벤치마크/학습 기능을 한다"는 사실을 메뉴만 봐서는 알 수 없다.

### 사용자 흐름 핵심 문제 (P1/P2)
- 전역 LNB의 Ontology/Sources/Extraction/Candidates는 "최근/현재 프로젝트" 컨텍스트에 묶여 있는데, 프로젝트가 선택되지 않으면 `/projects`로 리다이렉트된다. 흐름의 진입점이 LNB(전역)와 Project Detail(허브) 두 곳으로 이원화되어 멘탈 모델이 분산된다.
- 화면 내부 보조 탭(Review inbox / Workbench / Publish queue / Published graph / Quality)이 강력하지만, 이 탭과 전역 LNB가 별개의 네비 시스템이라 "현재 위치"가 두 군데서 따로 표현된다.

### 반응형 핵심 문제 (P1)
- **Candidate Results**: 1440(+30px), 1366(+48px), 1280(+70px), 768(테이블 우측 CONTEXT 컬럼 잘림) — entity/relation 테이블에 가로 스크롤 컨테이너가 없어 문서 전체가 가로로 밀린다.
- **Ontology Modeler**: 1280에서 +84px 가로 오버플로우 (3컬럼: classes/canvas/detail). 1024 이하에서는 정상 stack.

### 상품화 핵심 문제 (P1/P2)
- 첫 화면(Dashboard)에 "무엇을 하는 제품인가 / 왜 써야 하는가"를 5초 내 설명하는 가치 제안 카피·온보딩이 없다. KPI 카운트와 워크플로우 스텝만 있어 신규 사용자는 제품 목적을 추론해야 한다.
- 한국어/영어 카피 혼재(예: "Dashboard" 제목 + 한국어 부제, "Recent activity" + 한국어 본문)로 전문 제품의 카피 일관성이 떨어진다.

---

## 3. User Journey Review

| 단계 | 기대 행동 | 실제 경험 | 문제 | 개선안 | 우선순위 |
| -- | -- | -- | -- | -- | -- |
| 첫 방문(Dashboard) | 제품 목적·다음 행동 파악 | KPI 4종 + 워크플로우 스텝 + 최근 활동 노출 | 가치 제안/목적 설명 부재, 최근활동에 상태 토큰(NOT_AVAILABLE 등) 평문 노출 | Hero 한 줄 가치 카피 + 첫 행동 CTA, 상태는 badge로 | P2 |
| 프로젝트 생성/선택 | 새 작업공간 만들기 | Projects 목록 + New Project 버튼 명확 | 생성 모달/폼 진입 후 검증 안내는 추가 확인 필요 | 양호 — 유지 | P3 |
| 온톨로지 모델링 | class/property/relation 정의 | 3컬럼 모델러(authoring/classes+canvas/detail) 직관적 | 1280에서 가로 오버플로우(+84px) | detail 패널 1280 이하 stack 전환 | P1 |
| 소스 업로드/프리뷰 | 파일 업로드·프로파일 확인 | Source Detail에 상태·메타·프리뷰·CSV 샘플 잘 구성 | 양호 | 유지 | P3 |
| 추출 작업 생성 | source/ontology/prompt 선택 후 실행 | 폼 + 선택 맥락 요약 카드 명확, MockProvider 안내 | 양호 | 유지 | P3 |
| Candidate/Evidence 검토 | 후보·근거 확인 | 필터 + entity/relation 테이블 + 디테일 패널 | **가로 스크롤(테이블 오버플로우)**, 768에서 컬럼 잘림 | 테이블 overflow-x:auto 래퍼 추가 | P1 |
| 검토/전문가 수정 | 후보 승인·수정·반려 | Review Workbench: 근거/후보/원본대비/결정/검증/이력 패널 충실 | 원본vs수정이 raw JSON 노출(전문가용은 OK) | JSON diff에 라벨/하이라이트 보강(선택) | P2 |
| 게시(Publish) | 자격 후보를 게시 큐로 | Publish Queue: 자격/사유/잡 상태 명확 | 양호 | 유지 | P3 |
| Published Graph | 게시 그래프 탐색 | snapshot/lineage/overlay/safe-too-large 처리 우수 | 양호 | 유지 | P3 |
| Quality Dashboard | 품질 지표 점검 | 완전성/일관성/추적성 등 다수 metric 카드 | 정보밀도 매우 높음, 스캔 난이도 높음 | 섹션 접기/요약 우선 노출 | P2 |
| Admin/Governance(5) | 권한·운영 점검 | Admin Console 권한/안전상태 카피 명확 | 양호 | 유지 | P3 |
| Evaluation/Gold(6.1) | gold set·메트릭·에러케이스 | 요약 KPI + 메트릭 + error case 테이블 충실 | 768에서 error-case 테이블 과밀 | 테이블 가로 스크롤/우선 컬럼화 | P2 |
| Learning Insights(6.2) | 보정 패턴·제안·미리보기 | 강한 요약카드+KPI+탭 구조, 안전카피 명확 | 양호(가이드 준수 우수) | 유지 | P3 |
| Benchmark(6.3) | run 비교·델타·혼동행렬 | read-only 카피, run 선택, 비교 결과 honest 상태 표현 | 양호(가이드 준수 우수) | 유지 | P3 |
| 전구간 진입 | 메뉴에서 기능 발견 | LNB에 4~6 기능 없음 | **전역 발견성 결여** | LNB에 프로젝트 컨텍스트 하위 메뉴 추가 | P1 |

---

## 4. UI/UX Issues

| 화면 | 유형 | 설명 | 영향 | 개선안 | 우선순위 | 담당 |
| -- | -- | -- | -- | -- | -- | -- |
| 전역 LNB (AppShell) | 정보구조 | LNB 7항목이 MVP1~3에서 멈춤. 4~6 핵심화면 미노출 | 비싼 기능 발견성 0, 제품 가치 전달 실패 | 프로젝트 선택 시 LNB에 Review/Publish/Quality/Search/RAG/Evaluation/Learning/Benchmark 하위 그룹 노출 | P1 | PM+Frontend |
| Candidate Results | 반응형/레이아웃 | entity/relation 테이블이 가로 스크롤 컨테이너 없이 페이지 폭을 초과(1440 +30, 1280 +70px) | 가로 스크롤 발생, 768에서 CONTEXT 컬럼 잘림 | 각 테이블을 `overflow-x:auto` 래퍼로 감싸고 min-width 지정 | P1 | Frontend |
| Ontology Modeler | 반응형/레이아웃 | 1280에서 3컬럼이 +84px 오버플로우 | 노트북에서 가로 스크롤 | 1280 이하 detail 패널 하단 stack 또는 canvas min-width 축소 | P1 | Frontend |
| Dashboard | 카피/상품화 | 가치 제안 카피 부재, 최근활동에 상태 토큰 평문 | 신규 사용자 목적 이해 지연 | Hero 가치 한 줄 + 상태 badge화 | P2 | PM+Frontend |
| Dashboard 1920 | 레이아웃 | 콘텐츠 max 1440px 좌측 정렬, 우측 약 470px 빈 거터 | 와이드 모니터에서 비대칭·허전함 | 콘텐츠 중앙 정렬 또는 max-width 상향/그리드 확장 | P3 | Frontend |
| 전역 카피 | 카피 일관성 | 한/영 혼재(제목 영어 + 본문 한국어) | 전문성·일관성 저하 | 1차 언어 결정 후 용어집 정리, 토큰 라벨은 의도적 영어로 명시 | P2 | PM |
| Breadcrumb | 정보구조 | 화면별 breadcrumb 라벨 불일치(Extraction은 "Extraction", RAG는 프로젝트명) | 위치 인식 혼란 | breadcrumb 규칙 통일(프로젝트명 > 섹션 > 항목) | P2 | PM+Frontend |
| Quality Dashboard | 화면밀도 | 메트릭 카드 내부에 다시 표가 중첩, 한 화면 정보량 과다 | 핵심 지표 스캔 어려움 | 상단 요약 점수 strip + 상세는 접기/탭 | P2 | Frontend |
| Review Workbench | 가독성 | 원본 vs 수정이 raw JSON으로 노출 | 비전문 리뷰어 해석 부담(전문가용은 허용 범위) | 필드 단위 diff 하이라이트(선택적) | P3 | Frontend |
| 상태 토큰 표기 | 접근성/가독성 | NOT_AVAILABLE/NOT_PUBLISHED 등 대문자 토큰 평문 다용 | 의미 전달이 색·텍스트에만 의존 | badge+아이콘+한국어 보조라벨 병기 | P3 | Frontend |

---

## 5. Responsive Test Results

| 환경 | 해상도 | 문제 | 심각도 | 개선안 | 담당 |
| -- | -- | -- | -- | -- | -- |
| Desktop | 1920x1080 | 콘텐츠 1440px 캡 + 좌측정렬로 우측 ~470px 빈 거터(전 페이지 공통) | P3 | 중앙 정렬 또는 max-width 확장 | Frontend |
| Desktop | 1920x1080 | 기능 화면 자체 레이아웃·카드·그리드 정상, 오버플로우 없음 | 정상 | - | - |
| Desktop | 1440x900 | Candidate Results 가로 오버플로우 +30px | P1 | 테이블 overflow-x 래퍼 | Frontend |
| Laptop | 1366x768 | Candidate Results 가로 오버플로우 +48px | P1 | 테이블 overflow-x 래퍼 | Frontend |
| Laptop | 1280x800 | Candidate Results +70px, Ontology Modeler +84px 오버플로우 | P1 | 테이블 래퍼 + 모델러 detail stack | Frontend |
| Laptop | 1280x800 | 그 외 라우트(Benchmark/Learning/Quality/Review/Publish/Source/Admin 등) 오버플로우 0, 정상 | 정상 | - | - |
| Tablet | 1024x768 | Ontology Modeler classes+canvas 병렬·detail 하단 stack으로 안정, 오버플로우 0 | 정상 | - | - |
| Tablet | 1024x768 | Review Inbox 등 dense 테이블 정상 표시 | 정상 | - | - |
| Tablet | 768x1024 | LNB 상단 그리드로 collapse, 멀티패널(Workbench/Published/Benchmark/Learning) 단일컬럼 stack 양호 | 정상 | - | - |
| Tablet | 768x1024 | Candidate Results 테이블 우측 컬럼(CONTEXT) 카드 밖으로 잘림 | P1 | 테이블 overflow-x 래퍼 | Frontend |
| Tablet | 768x1024 | Evaluation error-case 테이블 컬럼 과밀·줄바꿈 다발 | P2 | 가로 스크롤 또는 우선 컬럼만 표시 | Frontend |
| Tablet | 768x1024 | Quality Dashboard 단일컬럼 전환은 정상이나 스크롤 길이 매우 김 | P2 | 섹션 접기/앵커 네비 | Frontend |

> 반응형 이슈 기록 양식(대표 1건)
> ```text
> 화면: Candidate Results (/extraction-jobs/:jobId/candidates)
> 사이즈: 1280x800 (1440·1366·768에서도 재현)
> 문제: Entity/Relation candidates 테이블이 가로 스크롤 컨테이너 없이 페이지 폭 초과 → 문서 가로 스크롤 +70px, 768에서는 CONTEXT 컬럼 카드 밖 잘림
> 재현 방법: mock 모드에서 위 라우트 진입 → 뷰포트 1280폭 → 우측 가로 스크롤바 확인
> 사용자 영향: 후보 검토 중 컨텍스트/근거 컬럼이 잘리거나 가로 스크롤로 가려져 검토 정확도 저하
> 개선안: Entity/Relation 테이블을 overflow-x:auto 래퍼로 감싸고 테이블 min-width 지정, 카드 폭은 페이지 폭으로 고정
> 우선순위: P1
> 담당: Frontend
> ```

---

## 6. Productization Review

| 항목 | 평가 | 문제 | 개선안 |
| -- | -- | -- | -- |
| 가치 제안 | 약 | 첫 화면에 제품 목적/이점 카피 없음 | Dashboard Hero에 "무엇을/왜" 한 줄 + 대표 결과(게시그래프/품질) 미리보기 |
| 첫인상 | 중상 | 라이트 테마·정렬·여백 전문적이나 가치 전달 약함 | 위 가치 카피 + 첫 행동 CTA 강조 |
| 전환 흐름 | 중 | 핵심 기능이 LNB에 없어 탐색 깊이 증가 | LNB에 프로젝트 하위 기능 노출로 전환 경로 단축 |
| 신뢰도 | 상 | read-only/감사/preview-only 안전 카피, 상태/권한 배지 충실 — 데모 티 낮음 | 유지. 빈 상태 카피의 한/영 혼재만 정리 |
| 기능 설명 | 중 | 화면 내 보조 설명은 있으나 기능 카탈로그/안내 없음 | Project Detail 허브에 기능 그룹 라벨/설명 보강 |
| 가격 설득력 | 해당 외 | 가격/플랜/혜택/FAQ/지원 정보 없음(내부 운영툴 성격) | 외부 상품화 시 플랜·지원·예시 페이지 필요 |
| 재방문 유도 | 중상 | 워크플로우(추출→검토→게시→품질→학습) 반복 사용 동기 강함 | 대시보드에 "내 작업 대기열/최근 결정" 위젯 추가 |
| 경쟁력 | 상 | candidate/published 분리, evidence-first, benchmark/learning 루프는 명확한 차별점 | 이 차별점을 첫 화면 카피로 가시화 |

---

## 7. PM Action Items

| 우선순위 | 작업 | 배경 | 결정 사항 | 기대 효과 |
| -- | -- | -- | -- | -- |
| P1 | 전역 IA 재정의: LNB에 프로젝트 하위 기능 노출 정책 | 4~6 기능이 전역 메뉴에 없음 | LNB를 프로젝트 컨텍스트 하위 그룹(Build/Review/Publish/Analyze)으로 재편할지 결정 | 핵심 기능 발견성·전환율 상승 |
| P1 | 가치 제안 카피 정의 | 첫 화면 목적 전달 부재 | Hero 한 줄 메시지·대표 가치 3종·첫 행동 CTA 카피 확정 | 신규 사용자 5초 내 목적 이해 |
| P2 | 카피 언어 정책 수립 | 한/영 혼재 | 1차 언어와 의도적 영어(상태 토큰) 범위 확정, 용어집 작성 | 일관성·전문성 향상 |
| P2 | Breadcrumb 규칙 표준화 | 화면별 라벨 불일치 | "프로젝트명 > 섹션 > 항목" 규칙 확정 | 위치 인식 통일 |
| P2 | Quality 정보 우선순위 정의 | 정보 과밀 | 최우선 노출 KPI와 접기 대상 결정 | 핵심 지표 스캔성 향상 |
| P3 | 상태 토큰 표기 가이드 | 토큰 평문 다용 | badge/아이콘/한국어 보조라벨 표기 규칙 확정 | 가독성·접근성 향상 |

---

## 8. Frontend Action Items

| 우선순위 | 작업 | 대상 | 문제 | 수정 방향 | 완료 기준 |
| -- | -- | -- | -- | -- | -- |
| P1 | Candidate 테이블 가로 스크롤 래퍼 | CandidateResultsPage.tsx (entity/relation 테이블) | 테이블이 페이지 폭 초과, 문서 가로 스크롤 | 각 테이블을 `overflow-x:auto` 래퍼로 감싸고 테이블 min-width 지정, 카드 폭 고정 | 1440/1366/1280/768 전부 document scrollWidth == clientWidth(가로 오버플로우 0), 768에서 CONTEXT 컬럼 미잘림 |
| P1 | Ontology Modeler 1280 stack | OntologyModelerPage.tsx (3컬럼 레이아웃) | 1280에서 +84px 오버플로우 | 1280 이하 detail 패널 하단 stack 또는 canvas min-width 축소 | 1280에서 가로 오버플로우 0 |
| P1 | LNB 하위 네비 구현 | AppShell.tsx / navigation.ts | 4~6 기능 메뉴 부재 | 프로젝트 선택 시 하위 메뉴 그룹 렌더(PM IA 확정 후) | 프로젝트 선택 상태에서 LNB로 Quality/Review/Publish/Search/RAG/Evaluation/Learning/Benchmark 도달 가능 |
| P2 | Dashboard 최근활동 badge화 | DashboardPage.tsx | 상태 토큰 평문 | 상태를 HanaBadge tone으로 렌더 | 모든 상태가 색+텍스트 badge로 표시 |
| P2 | Evaluation error-case 테이블 반응형 | EvaluationDatasetsPage.tsx | 768 과밀·줄바꿈 | overflow-x:auto + 우선 컬럼 고정 | 768에서 테이블 가로 스크롤로 컬럼 정상 표시 |
| P2 | Quality 섹션 접기/요약 | QualityDashboardPage.tsx | 정보 과밀 | 요약 점수 strip 상단 고정 + 상세 접기 | 첫 화면에서 핵심 지표가 1스크롤 내 노출 |
| P3 | 1920 콘텐츠 정렬 | AppShell.tsx Content (width min(1440px,100%)) | 우측 빈 거터 | 중앙 정렬 또는 max-width 상향 | 1920에서 좌우 거터 대칭 |
| P3 | Breadcrumb 컴포넌트 통일 | 공통 breadcrumb | 라벨 불일치 | 규칙 기반 공통 컴포넌트 적용 | 전 화면 동일 규칙 표기 |

---

## 9. Priority Backlog

| 순위 | 우선순위 | 작업명 | 담당 | 효과 |
| -- | -- | -- | -- | -- |
| 1 | P1 | Candidate 테이블 가로 스크롤 래퍼 | Frontend | 가로 스크롤 제거, 검토 정확도 |
| 2 | P1 | LNB에 프로젝트 하위 기능 노출(IA) | PM+Frontend | 핵심 기능 발견성·전환 |
| 3 | P1 | Ontology Modeler 1280 stack | Frontend | 노트북 가로 스크롤 제거 |
| 4 | P1 | Dashboard 가치 제안 카피 | PM+Frontend | 첫인상·목적 이해 |
| 5 | P2 | 카피 언어 정책·용어집 | PM | 전문성·일관성 |
| 6 | P2 | Breadcrumb 규칙 표준화 | PM+Frontend | 위치 인식 |
| 7 | P2 | Quality 정보 우선순위/접기 | Frontend | 스캔성 |
| 8 | P2 | Evaluation error-case 768 반응형 | Frontend | 태블릿 가독성 |
| 9 | P3 | Dashboard 상태 badge화 | Frontend | 가독성·접근성 |
| 10 | P3 | 1920 콘텐츠 정렬 | Frontend | 와이드 화면 균형 |

P0: 없음 (핵심 기능 사용 불가/데이터 손실/심각한 화면 깨짐 수준 이슈 미발견)

---

## 10. Release Recommendation

### 출시 가능 여부
**조건부 출시 가능.** P0 없음, 전 라우트 정상 렌더(123장 캡처/로드 에러 0). 다만 내부 운영툴/파일럿 기준으로 "출시 가능"이며, 외부 상품으로 일반 공개하려면 아래 P1을 먼저 해소해야 한다.

### 출시 전 필수 수정 사항 (P1)
1. Candidate Results 테이블 가로 스크롤 래퍼 (반응형 깨짐 제거).
2. 전역 LNB에 MVP4~6 기능 노출 (핵심 가치 발견성).
3. Ontology Modeler 1280 가로 오버플로우 제거.
4. Dashboard 가치 제안 카피 (첫인상).

### 출시 후 개선 가능 사항 (P2/P3)
- 카피 언어 정책·용어집, Breadcrumb 표준화, Quality 정보 우선순위, Evaluation 768 반응형, Dashboard 상태 badge화, 1920 정렬, JSON diff 하이라이트.

### 상품화 관점 최우선 보완점
첫 화면 가치 제안 + LNB 기능 발견성. 현재 제품의 진짜 차별점(candidate/published 분리, evidence-first, benchmark/learning 루프)이 메뉴와 첫 화면에서 보이지 않아 가치가 저평가된다. 이 둘만 해결하면 상품화 점수가 크게 오른다.

### PM Next Action
LNB IA(프로젝트 하위 기능 그룹) 구조와 Dashboard 가치 제안 카피를 확정해 Frontend에 전달.

### Frontend Next Action
Candidate Results / Ontology Modeler 가로 오버플로우(P1) 2건을 먼저 수정(완료 기준: 6개 해상도에서 document 가로 오버플로우 0), 이후 IA 확정분에 따라 LNB 하위 네비 구현.
