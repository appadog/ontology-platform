# UI Style Guide MVP 1

이 문서는 MVP 1 프론트엔드 화면의 공통 스타일 기준이다. 실제 구현 기준 파일은 `apps/frontend/src/shared/styles/theme.ts`, `apps/frontend/src/shared/ui/hana`, `apps/frontend/src/shared/ui/platform`, `apps/frontend/src/shared/ui/hana/HanaBadge.tsx`이다.

## Theme Token

### Color

- Surface: `surface`, `surfaceRaised`, `surfaceMuted`
- Border: `border`, `borderStrong`
- Text: `text`, `textMuted`
- Primary: `primary`, `primarySoft`
- Semantic: `positive`, `positiveSoft`, `warning`, `warningSoft`, `danger`, `dangerSoft`, `progress`, `progressSoft`, `draft`, `draftSoft`
- Graph: `graphNode`, `graphRelation`

### Spacing

- `xs`: 4px
- `sm`: 8px
- `md`: 12px
- `lg`: 16px
- `xl`: 24px
- `xxl`: 32px

### Radius

- `sm`: 6px
- `md`: 8px

### Shadow

- `soft`: 기본 surface card shadow. 반복 카드, metric card, panel에만 제한적으로 사용한다.

### Typography

- `fontFamily`: Inter/system UI stack
- `fontSize`: `xs`, `sm`, `md`, `lg`, `xl`
- `fontWeight`: `regular`, `medium`, `bold`
- `lineHeight`: `tight`, `normal`, `relaxed`

## UI Primitive

- `Button`: `HanaButton`. 외부 `hana-style-component` 버튼을 감싼 adapter이다.
- `Input`: `HanaInput`. form grid와 filter/search 입력에 사용한다.
- `Select`: `HanaSelect`. enum/status/project selector에 사용한다.
- `Badge`: `HanaBadge`. status는 반드시 `statusToTone`을 통해 tone을 정한다.
- `Card`: `HanaCard`. 반복 item, detail panel, form panel에 사용한다. page section 전체를 카드로 과도하게 감싸지 않는다.
- `Table`: 현재는 각 화면의 styled table을 사용하되 `border`, `textMuted`, `spacing.lg`, uppercase header 패턴을 유지한다.
- `PageState`: loading, empty, error, permission 상태를 표시하는 공통 primitive이다. 모든 주요 화면은 이 상태를 가진다.
- `MetricCard`: dashboard/detail summary metric에 사용한다.

## Hana Adapter Policy

- 업무 화면은 `hana-style-component`를 직접 import하지 않는다.
- 외부 UI dependency 접근은 `src/shared/ui/hana`에서만 허용한다.
- `src/shared/ui/hana`는 Hana dependency adapter이다. 외부 컴포넌트 API 변경을 이 경계에서 흡수한다.
- `src/shared/ui/platform`은 제품 고유 primitive이다. `PageState`, `MetricCard`처럼 Hana dependency와 무관한 공통 UI를 둔다.

## Status Tone Matrix

Tone 이름은 `neutral`, `success`, `warning`, `danger`, `progress`, `muted`만 사용한다.

| Enum | Value | Tone |
|---|---:|---|
| ProjectStatus | DRAFT | neutral |
| ProjectStatus | ACTIVE | success |
| ProjectStatus | ARCHIVED | muted |
| ProjectStatus | DELETED | danger |
| OntologyVersionStatus | DRAFT | neutral |
| OntologyVersionStatus | PUBLISHED | success |
| OntologyVersionStatus | ARCHIVED | muted |
| OntologyElementStatus | DRAFT | neutral |
| OntologyElementStatus | ACTIVE | success |
| OntologyElementStatus | ARCHIVED | muted |
| OntologyElementStatus | DELETED | danger |
| SourceStatus | UPLOADED | neutral |
| SourceStatus | PARSING | progress |
| SourceStatus | PARSED | progress |
| SourceStatus | PROFILED | success |
| SourceStatus | EXTRACTION_READY | success |
| SourceStatus | FAILED | danger |
| SourcePreviewStatus | PENDING | progress |
| SourcePreviewStatus | READY | success |
| SourcePreviewStatus | NOT_AVAILABLE | muted |
| SourcePreviewStatus | FAILED | danger |
| ValidationStatus | NOT_VALIDATED | muted |
| ValidationStatus | PASSED | success |
| ValidationStatus | WARNING | warning |
| ValidationStatus | FAILED | danger |
| PublishStatus | NOT_PUBLISHED | muted |
| PublishStatus | PUBLISHED | success |
| PublishStatus | ROLLED_BACK | warning |

## Layout

### App Shell

- Sidebar width는 `theme.sidebarWidth`를 사용한다.
- Topbar에는 current project selector, selected project status, dev user chip을 둔다.
- 모바일에서는 sidebar navigation이 top band로 접히고 content는 단일 column으로 흐른다.

### Page Header

- `PageHeader`는 화면 제목, 설명, 우측 action/status slot으로 구성한다.
- H1은 화면 이름 또는 현재 entity 이름을 사용한다.
- status badge는 action slot에 두고 `statusToTone`을 적용한다.

### List/Detail

- 목록은 table 또는 scan 가능한 row list를 사용한다.
- 상세는 metadata card, metric row, 주요 작업 panel 순서로 구성한다.
- description nullable 값은 `No description`, `N/A`, `-`처럼 화면 맥락에 맞는 fallback을 둔다.

### Form Grid

- label은 12px uppercase/bold 패턴을 유지한다.
- desktop에서는 2-4 column grid를 사용할 수 있고 880-980px 이하에서는 1 column으로 접는다.
- create/edit mutation은 API boundary DTO와 같은 nullable 정책을 사용한다.

### Table

- header는 `textMuted`, uppercase, 12px 기준을 유지한다.
- cell padding은 14-18px 범위에서 사용한다.
- 가로 overflow가 생길 수 있는 table은 wrapper에 `overflow-x: auto`를 둔다.

### Ontology Modeler 3-Panel

- 좌측: class/node list
- 중앙: graph canvas
- 우측: selected class/relation/property detail
- `OntologyGraph`는 `nodes[]`, `edges[]`, `properties[]`를 canonical로 사용한다. `classes[]`, `relations[]`는 deprecated compatibility로만 다룬다.
- 그래프 시각화는 MVP 1 핵심 기능으로 보며, empty/error/loading 상태도 모델러 안에서 제공한다.

## 금지 규칙

- 임의 색상을 새로 추가하지 않는다. 새 색상이 필요하면 `theme.ts` token과 이 문서를 함께 갱신한다.
- enum/status별 임의 tone을 만들지 않는다. `statusToTone`과 Status Tone Matrix를 갱신한다.
- 업무 화면에서 `hana-style-component`를 직접 import하지 않는다.
- 과도한 카드 중첩을 피한다. 카드는 반복 item, form panel, detail panel에만 쓴다.
- 실제 LLM, candidate review, RAG 화면은 MVP 1에서 만들지 않는다.
- Source archive/delete UI는 INT-001 필수 범위가 아니며 follow-up으로 둔다.
