# Wave 13 UI/UX Expert Review

Status: `READY FOR FRONTEND EXECUTION`
Date: 2026-06-19

## 총괄 판정

Wave 12 이후 UI/UX는 많이 개선되었다. 프로젝트 선택, LNB 상위 업무 영역, breadcrumb, source-to-evidence 흐름, candidate/evidence context, responsive overflow containment가 모두 이전보다 안정적이다. 이제 화면은 단순 scaffold가 아니라 MVP 2 demo를 실제로 따라갈 수 있는 상태다.

다만 아직 “상품”이라기보다 “API 결과를 정돈해서 보여주는 운영 콘솔”의 인상이 남아 있다. Wave 13은 새 Backend/API scope를 열지 않고, Frontend만으로 사용자의 판단과 다음 행동을 더 명확하게 만드는 product polish wave로 진행한다.

## 좋아진 점

- LNB가 top-level 업무 영역 중심으로 정리되어 ID-bound detail page가 평면 메뉴에 노출되는 혼란이 줄었다.
- Project, Source, Job, Candidate, Evidence 화면이 breadcrumb와 context action으로 연결되어 source-to-evidence 흐름이 끊기지 않는다.
- Candidate results가 validation, confidence, evidence, source/job context를 한 화면에 모으기 시작했다.
- Evidence viewer가 normal, broken, direct missing fallback에서도 context와 recovery action을 유지한다.
- `390x900` viewport에서 document-level horizontal overflow가 제거되었다.
- endpoint/debug 중심 문구가 주 화면에서 내려가고 technical details로 분리되었다.

## 남은 UX Gap

1. 업무 흐름의 “현재 단계”가 아직 화면마다 흩어져 있다.
   - Dashboard/Project detail/Source detail/Job monitor/Candidates가 같은 작업 여정을 보여주지만, 단계형 안내가 공통 패턴으로 느껴지지 않는다.
   - 사용자는 “지금 source profile을 봐야 하는지, job을 만들면 되는지, candidate를 검토하면 되는지”를 화면마다 다시 해석해야 한다.

2. Candidate review는 표 중심이라 모바일과 실사용 검토에서 읽기 부담이 크다.
   - Desktop table은 유지 가능하지만, mobile에서는 핵심 정보가 좁은 열로 찢어져 보인다.
   - 후보명, 유형, validation, confidence, evidence CTA, source/job context가 한 카드 안에서 스캔되어야 한다.

3. Evidence viewer는 locator metadata가 근거 본문보다 먼저 크게 보인다.
   - 실제 사용자는 “이 후보가 왜 맞는지”를 먼저 보고, ID/offset/segment는 나중에 확인한다.
   - Evidence text와 locator highlight가 더 높은 시각적 우선순위를 가져야 한다.

4. Raw ID와 enum value가 아직 주요 읽기 흐름에 과하게 노출된다.
   - class_id, ontology_version_id, prompt_version_id, model_run_id, source_segment_id 같은 값은 필요하지만 primary content는 아니다.
   - 짧은 ID나 display label을 우선 보여주고 full ID는 details로 내려야 한다.

5. 문구가 한국어와 영어/enum 사이에서 어색하게 섞인다.
   - `Candidate가 참조하는 원천 구간과 evidence text를 확인합니다`처럼 한 문장 안의 혼합이 많다.
   - 도메인 명사(Project, Source, Candidate, Evidence, Ontology)는 유지하되 설명문/CTA는 자연스러운 한국어로 정리한다.

6. Status chip과 action hierarchy가 화면별로 조금씩 다르다.
   - 성공/경고/실패/준비/검토대기 상태가 같은 우선순위와 색상 언어로 읽혀야 한다.
   - 비활성 버튼은 왜 눌리지 않는지 주변 상태가 설명해야 한다.

## Wave 13 Product Polish Acceptance

### `UX13-01` Workflow Stage Pattern

- Dashboard, Project detail, Source detail, Job monitor, Candidate results 중 최소 4개 화면에 같은 구조의 compact workflow/stage pattern을 적용한다.
- 단계는 `Project -> Ontology -> Source -> Extraction -> Candidates -> Evidence` 순서를 기준으로 한다.
- 현재 단계, 완료/준비/다음 단계가 시각적으로 구분되어야 한다.
- 긴 설명문이 아니라 stage label, status chip, primary action으로 흐름을 전달한다.

### `UX13-02` Source Readiness and Next Action

- Source detail은 `Metadata`, `Preview/Profile`, `Chunks`, `Extraction`을 나열하는 데서 끝나지 않고 준비 상태와 다음 행동을 함께 보여준다.
- CSV/Excel이면 profile/preview를 우선, TXT/PDF이면 chunks를 우선한다.
- `Create job`은 source와 ontology/prompt가 준비된 뒤 다음 action으로 보이게 한다.
- sample rows table은 유지하되 mobile에서는 핵심 column summary가 먼저 보인다.

### `UX13-03` Candidate Review Workspace

- Desktop에서는 table + selected detail panel 구조를 유지하되, 후보 row의 primary content를 더 읽기 쉽게 만든다.
- Mobile에서는 entity/relation 후보를 card/list 형태로 읽을 수 있어야 한다. 좁은 viewport에서 table horizontal scroll만으로 PASS 처리하지 않는다.
- 각 candidate card/row는 다음을 한눈에 보여준다:
  - 후보 이름 또는 relation endpoints
  - kind
  - validation status/code
  - confidence
  - evidence presence and open evidence action
  - source/job/segment context는 짧은 label로 제공
- full raw ID와 raw payload는 technical details 또는 expandable area로 낮춘다.

### `UX13-04` Evidence Reading Priority

- Evidence viewer는 상단에서 candidate summary, validation, source, evidence text를 먼저 읽게 한다.
- locator metadata는 “근거 위치”로 의미 있게 묶되, full ID 중심 key-value list가 첫 화면을 지배하지 않게 한다.
- normal/broken/direct missing 모두 recovery action이 유지되어야 한다.
- mobile에서 evidence text, locator highlight, recovery action이 겹치지 않아야 한다.

### `UX13-05` Copy and Terminology Cleanup

- 도메인 명사는 기존 contract와 맞춘다: Project, Ontology, Source, Extraction, Candidate, Evidence.
- 사용자 설명문과 CTA는 자연스러운 한국어로 정리한다.
- `candidate를 validation context로`, `source 위치와 parent context`처럼 어색한 혼합 문장은 줄인다.
- enum/status literal은 chip에는 허용하되, 주변 설명은 사용자 언어로 풀어준다.
- endpoint/debug/dev 문구는 주 화면에 노출하지 않는다.

### `UX13-06` Visual Hierarchy and Rhythm

- 화면마다 top metric card가 반복되어 “숫자 카드 더미”처럼 보이지 않게 한다.
- 주요 작업 화면은 `summary -> primary action -> review content -> technical details` 순서로 정리한다.
- 카드 안 카드 구조를 만들지 않는다.
- 기존 hana adapter/styled-components 경계를 유지하고, 업무 화면에서 `hana-style-component`를 직접 import하지 않는다.
- 장식적 hero, gradient/orb/background illustration은 추가하지 않는다.

### `UX13-07` Responsive Product Quality

- `390x900` viewport에서 Candidates, Evidence, Source detail, Job monitor를 확인한다.
- document-level horizontal overflow가 없어야 한다.
- Candidate/Evidence 핵심 판단 정보는 local table scroll 없이도 읽을 수 있어야 한다.
- 데이터 grid 성격의 sample rows/chunks/model runs만 local horizontal scroll을 허용한다.

### `UX13-08` Regression Preservation

- 신규 Backend endpoint, DTO, enum을 요구하지 않는다.
- External LLM provider, review/publish workflow, RAG, advanced PDF parsing, production auth/RBAC를 열지 않는다.
- `npm run build`, `npm run test`, actual API smoke가 PASS여야 한다.
- Browser screenshot 또는 DOM artifact를 남긴다.

## Frontend 실행 우선순위

1. 공통 workflow/stage primitive를 만들고 Dashboard/Project/Source/Job/Candidate에 재사용한다.
2. Candidate results의 mobile card/list mode와 selected detail hierarchy를 정리한다.
3. Evidence viewer의 읽기 순서를 evidence-first로 재배치한다.
4. Source detail의 readiness/next action hierarchy를 정리한다.
5. visible copy guard를 보강하고 actual API smoke selector가 깨지지 않게 갱신한다.

## QA 확인 기준

- Wave 13은 “예쁜가”가 아니라 “사용자가 다음 작업을 덜 고민하는가”로 판단한다.
- QA는 desktop screenshot, `390x900` screenshot/DOM, actual API smoke, visible copy guard를 함께 본다.
- UX gap은 `UX13-*`, `FE-012`, `FE2-001`~`FE2-006`, `INT2-003`에 연결한다.
