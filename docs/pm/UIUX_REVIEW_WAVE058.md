# UI/UX 사용성·반응형·상품화 리뷰 — Wave 58

리뷰어: 총괄(commander) — `docs/pm/ui_ux_reviewer_long.md` 역할/형식 적용
방식: 실제 구동 앱(`npm run dev`, mock mode, :5173)을 데스크톱(native) + 모바일(375×812)에서 직접 탐색
대상 저니: Dashboard → Project 홈 → Ontology 모델러 → Sources → Review 인박스 → Published Graph(탐색기/시각화·요약) → (LNB 전 구역)
기준일: 2026-07-14

## 총평
지난 UI/UX 웨이브(Wave35~38)와 최신 MVP6 화면 덕분에 **셸·대시보드·신규 MVP6 화면의 완성도는 상품 수준**이다(가치 제안 Hero, 워크플로 스테퍼, D6 상태 배지, 근거/가드 증명, 데스크톱 0-overflow). 반면 **초기 MVP3/MVP4 화면과 모바일 내비게이션**에 상품성을 떨어뜨리는 구체적 결함이 남아 있다. 아래 6건은 모두 재현 가능하고 작업 지시 가능한 형태로 정리했다.

---

## F1 — 언어 혼용(한/영 불일치) · **P1**
### 문제
셸·대시보드·최신 MVP6 화면은 한국어인데, 핵심 검수·게시 저니의 MVP3/MVP4 화면은 H1만 한국어이고 **본문·설명·필터 라벨·상태 문구가 영어**다.
- 검수 인박스(`/review`): "Candidate decisions stay separate from published facts until publish eligibility passes.", "Review to published facts", "Queue filters", 필터 라벨 `ASSIGNMENT/STATUS/VALIDATION/CONFIDENCE`, "N review tasks", "Priority and reason stay visible before opening the workbench."
- 게시 그래프 탐색기 탭(`/published-graph`): "Explorer controls", "Default is 2 hops. Maximum supported hop depth is 3.", "Current snapshot", "Published entities and relations are shown from the selected published graph version.", "Overlays".
- 소스(`/sources`): 표 헤더 `FILE/TYPE/STATUS/PREVIEW/NEXT/SIZE/UPLOADED`, "Profile".
### 원인
초기 MVP3/4 화면이 영어 카피로 작성되었고, 이후 한국어화가 셸·신규 화면에만 적용되어 저니 중간에 언어가 바뀐다.
### 사용자 영향
한국어 사용자가 가장 중요한 검수→게시 흐름 한복판에서 갑자기 영어를 만나 이해도·신뢰도가 떨어지고, 제품이 미완성/번역 누락으로 보인다.
### 개선안
핵심 저니(Review 인박스/Workbench/Publish Queue/Published Graph 탐색기 탭/Quality/Sources)의 사용자 대면 카피·컨트롤 라벨·상태 문구를 한국어로 통일한다. 상태 enum 배지는 최신 MVP6 화면처럼 `한국어 gloss` 병기(예: `READY · 준비됨`) 규칙을 따른다.
### 완료 기준
핵심 저니 화면에서 사용자 대면 영어 단독 문장/라벨이 없다(디버그용 raw enum은 F2에서 별도 처리).

---

## F2 — 개발자 전문용어·내부 문구 노출 · **P2**
### 문제
사용자 화면에 내부 상태 enum과 개발 노트가 그대로 노출된다.
- 게시 그래프 탐색기: "**SAFE TOO LARGE** is handled without rendering unsafe partial graphs." 문장 + 상태 토글 버튼 `SAFE_TOO_LARGE`.
- 시각화·요약 배너 하단: "read-only visualization - nothing changes the graph; publishing stays the separate **MVP3** publish path." (바로 위 한국어 설명과 중복 + 내부 마일스톤 명칭 노출).
### 원인
상태 enum·설계 노트를 사용자 카피로 그대로 렌더.
### 사용자 영향
비개발 사용자가 의미를 이해하지 못하고, 디버그/미완성 화면 인상을 준다. "MVP3" 같은 내부 용어는 외부 사용자에게 노출되면 안 된다.
### 개선안
사용자 언어로 치환("그래프가 너무 커서 요약만 표시합니다"), 중복 영어 문장 제거, 상태 시뮬레이션 토글의 raw enum이 개발 전용이면 사용자 빌드에서 숨기거나 한국어 라벨로 표기.
### 완료 기준
핵심 화면에 raw enum 문장·"MVP3" 등 내부 용어·중복 영어 노트가 없다.

---

## F3 — 원시 ISO 타임스탬프 노출 · **P2**
### 문제
시각화·요약 뷰의 "생성 시각: **2026-07-14T04:38:47.820Z**" 등 로케일 미적용 ISO 문자열이 그대로 표시된다. (반면 프로젝트 홈의 "Updated 2026. 6. 16. 오후 3:20"은 로컬 포맷 → 화면 간 불일치.)
### 원인
`generated_at`를 포맷 없이 렌더.
### 사용자 영향
가독성이 낮고, 끝의 `Z`(UTC) 때문에 실제 시각을 오해할 수 있다.
### 개선안
공용 날짜 포맷 유틸로 로컬 포맷("2026. 7. 14. 오후 1:38")으로 표시하고, 화면 전반의 시간 표기를 통일한다.
### 완료 기준
사용자 대면 시간 표기가 모두 로컬 포맷이며 raw ISO 문자열이 없다.

---

## F4 — 모바일 내비게이션이 첫 화면 전체를 점유 · **P1(반응형)**
### 문제
모바일(375×812)에서 LNB가 햄버거/드로어로 접히지 않고 **20개 이상 항목이 2열 그리드로 첫 뷰포트 전체**를 차지한다. 페이지 콘텐츠(브레드크럼·H1)는 내비를 한참 스크롤한 뒤에야 나온다. (가로 overflow는 없음 — 세로 점유가 문제.)
### 원인
모바일 브레이크포인트에서 사이드바가 상단 스택 그리드로만 전환되고, collapse/drawer 패턴이 없다.
### 사용자 영향
모바일 사용자가 매 페이지 진입 시 내비를 지나쳐 스크롤해야 콘텐츠에 도달한다. 현재 위치·다음 행동 파악이 지연되고, 태블릿/모바일 데모 시 완성도가 크게 떨어져 보인다.
### 개선안
모바일에서 상단 앱바 + 햄버거 드로어(또는 접이식 섹션) 패턴을 적용해 **진입 시 콘텐츠가 먼저** 보이도록 한다. 데스크톱 고정 사이드바는 유지.
### 완료 기준
모바일 진입 시 H1·브레드크럼이 첫 뷰포트에 보이고, 내비는 토글로 열고 닫힌다. 가로 overflow 0 유지.

---

## F5 — 잘린 enum 라벨(카디널리티) · **P3**
### 문제
온톨로지 모델러의 `RELATION CARDINALITY` select가 "**MANY_TO_MA**"로 잘려 표시된다(실제 `MANY_TO_MANY`).
### 원인
select 폭 부족 + 옵션 라벨 길이.
### 사용자 영향
카디널리티 값을 오인할 수 있다(1:N vs N:N).
### 개선안
select 최소 폭 확대 또는 사용자 친화 라벨("N:N(다대다)")로 축약·한국어화.
### 완료 기준
카디널리티 옵션이 잘리지 않고 완전히 표시된다.

---

## F6 — 비활성 업로드 버튼의 사유 미표시 + 진입점 중복 · **P3**
### 문제
소스 화면 우상단 "Source 업로드" 버튼이 비활성(회색)인데 이유 안내가 없고, 바로 아래 인라인 "원천 데이터 업로드" 폼과 진입점이 중복된다.
### 원인
상단 버튼과 인라인 폼을 이중 제공하고, disabled 사유를 표시하지 않는다.
### 사용자 영향
왜 버튼을 누를 수 없는지 몰라 혼란스럽다.
### 개선안
상단 버튼을 인라인 폼으로 스크롤·포커스시키는 활성 버튼으로 통일하거나, 비활성 시 사유 헬퍼("파일을 먼저 선택하세요")를 노출한다.
### 완료 기준
업로드 진입점이 하나로 명확하고, 비활성 상태에는 사유가 보인다.

---

## 잘 되어 있는 점(회귀 방지 대상)
- 대시보드 Hero의 결과 중심 가치 제안 + 3대 원칙 카드 + 명확한 CTA.
- 프로젝트 홈의 워크플로 스테퍼(Project 현재 → Ontology 다음 → …)로 다음 행동 안내.
- 시각화·요약 신규 뷰의 한국어-우선 카피 + 읽기 전용 배너 + 6-flag mutation 가드 증명("6개 mutation 플래그 모두 false").
- 상태 배지 `X · 한국어 gloss` 패턴, 단일 활성 LNB, 데스크톱 0-overflow.

## 우선순위 요약
| ID | 결함 | 우선순위 | 소유 |
|---|---|---|---|
| F1 | 언어 혼용(핵심 저니 영어 카피) | P1 | Frontend |
| F4 | 모바일 내비 첫 화면 점유 | P1 | Frontend |
| F2 | 개발 용어/내부 문구 노출 | P2 | Frontend |
| F3 | 원시 ISO 타임스탬프 | P2 | Frontend |
| F5 | 잘린 카디널리티 라벨 | P3 | Frontend |
| F6 | 비활성 업로드 버튼 사유 | P3 | Frontend |

모두 Frontend-only. 백엔드/계약 변경 없음.
