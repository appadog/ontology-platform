# Frontend Report - Wave 61

## 담당 범위
- backlog ID: PM6-040 후속 (table CompactTable 이관)
- 작업 경로: `apps/frontend/src/pages/**`

## 완료한 작업
13개 raw-`<table>` 사용 페이지를 공용 `CompactTable`(`src/pages/mvp3Shared.tsx`)로 이관해 row hover / 헤더 틴트+semibold / radius를 상속받도록 정리했다. 관례대로 `ReviewInboxPage.tsx` / `PublishQueuePage.tsx` / `QualityDashboardPage.tsx` 패턴(`<CompactTable><table>...</table></CompactTable>`)을 그대로 따랐다.

파일별 상태:

| # | 파일 | 상태 |
|---|---|---|
| 1 | `src/pages/CandidateResultsPage.tsx` (table 2곳) | 이관 완료 — `mvp2Shared`의 `TableWrap` → `CompactTable`. 기본 스타일만 있어 커스터마이즈 보존 불필요. |
| 2 | `src/pages/EvidenceViewerPage.tsx` | **스킵** — 유일한 table(`StructuredHighlight` 안)은 일반 목록 테이블이 아니라 evidence 위치 1개 row를 강조하는 특수 위젯. 셀 전체 border(`border: 1px solid`), `td[data-highlight="true"]` 배경 강조, 별도 padding 등 `CompactTable`에는 없는 고유 동작이 있어 그대로 두었다(silently dropping 방지). |
| 3 | `src/pages/ExtractionJobMonitorPage.tsx` (table 2곳) | 이관 완료 — `mvp2Shared`의 `TableWrap` → `CompactTable`. |
| 4 | `src/pages/ProjectListPage.tsx` | 이관 완료 — 로컬 `TableWrap` 삭제, `CompactTable`로 교체. Sources/Ontology Versions 컬럼에 `data-align="right"` 추가(옵션 폴리시). |
| 5 | `src/pages/SourceDetailPage.tsx` | 이관 완료 — 로컬 `PreviewTable` 삭제, `CompactTable`로 교체. |
| 6 | `src/pages/SourceManagerPage.tsx` | 이관 완료 — 로컬 `TableWrap`(옛 CompactTable과 거의 동일하다고 명시된 것) 삭제, `CompactTable`로 교체. |
| 7 | `src/pages/SourceProfilingPage.tsx` | 이관 완료 — `mvp2Shared`의 `TableWrap` → `CompactTable`. |
| 8 | `src/pages/admin/AdminProjectsPage.tsx` | **이관 완료(공유 인프라 경유)** — 아래 참고 |
| 9 | `src/pages/admin/ProjectAdminApprovalPolicyPage.tsx` | 이관 완료(공유 인프라 경유) |
| 10 | `src/pages/admin/ProjectAdminCredentialsPage.tsx` | 이관 완료(공유 인프라 경유) |
| 11 | `src/pages/admin/ProjectAdminImportExportPage.tsx` | 이관 완료(공유 인프라 경유) |
| 12 | `src/pages/admin/ProjectAdminOperationsPage.tsx` | 이관 완료(공유 인프라 경유) |
| 13 | `src/pages/admin/ProjectAdminRetentionBackupPage.tsx` (table 2곳) | 이관 완료(공유 인프라 경유) |
| 14 | `src/pages/admin/ProjectAdminRolesPage.tsx` | 이관 완료(공유 인프라 경유) |

**admin 7개 페이지 관련 특이사항**: 7개 admin 페이지는 실제로는 raw `<table>`이 아니라 이미 admin 전용 공유 래퍼 `AdminTable`(`src/pages/mvp5Shared.tsx`, `src/pages/admin/shared.tsx`를 통해 re-export)을 100% 동일하게 재사용 중이었다(중복 정의가 아니라 이미 한 곳에서만 정의됨). `AdminTable`은 전체 테이블을 감싸는 `1px solid border` 박스 + `overflow-wrap: anywhere`라는 `CompactTable`에는 없는 고유 동작을 갖고 있어, 7개 파일을 개별 수정하는 대신 **`AdminTable` 정의 자체를 `styled(CompactTable)`로 재작성**하고 그 고유 border/wrap 커스터마이즈만 얹었다. 그 결과 7개 admin 페이지는 코드 변경 없이 `CompactTable`의 hover/헤더 톤/semibold/radius를 상속받으면서 기존 border 박스 시각 정체성도 100% 유지한다. (개별 페이지에 `data-align="right"`는 추가하지 않음 — 각 admin 테이블 컬럼이 텍스트/ID/badge 위주라 애매한 케이스가 많아 스킵.)

부수 정리: 마이그레이션 후 `mvp2Shared.tsx`의 `TableWrap`이 어떤 파일에서도 더 이상 참조되지 않아 죽은 export를 삭제했다(사용처 3곳 전부 `CompactTable`로 전환 완료됨을 grep으로 재확인).

## 변경 파일
- `apps/frontend/src/pages/CandidateResultsPage.tsx`
- `apps/frontend/src/pages/ExtractionJobMonitorPage.tsx`
- `apps/frontend/src/pages/ProjectListPage.tsx`
- `apps/frontend/src/pages/SourceDetailPage.tsx`
- `apps/frontend/src/pages/SourceManagerPage.tsx`
- `apps/frontend/src/pages/SourceProfilingPage.tsx`
- `apps/frontend/src/pages/mvp2Shared.tsx` (죽은 `TableWrap` export 삭제)
- `apps/frontend/src/pages/mvp5Shared.tsx` (`AdminTable`을 `styled(CompactTable)`로 재정의 — 7개 admin 페이지에 영향, 페이지 파일 자체는 수정 없음)
- `apps/frontend/src/pages/EvidenceViewerPage.tsx` — 변경 없음(스킵, 사유는 위 표 참고)

## 실행/검증
- 실행한 명령: `npm run build`
  - 결과: PASS (tsc + vite, `dist/` 생성 완료, 청크 사이즈 경고만 있음 — 기존과 동일한 vite 경고, 이번 변경과 무관)
- 실행한 명령: `npm run test`
  - 결과: PASS — `Test Files 17 passed (17)` / `Tests 116 passed (116)`
- 실행한 명령: `git diff --check`
  - 결과: 출력 없음 (clean, whitespace 오류 없음)

라이브 프리뷰(로컬 vite dev server, mock API 모드) 스팟체크 4개 페이지:
- `/projects` (ProjectListPage): 테이블 데이터/컬럼 정상 렌더, 콘솔 에러 없음. `th` computed style `fontWeight: "600"`, `background: "rgb(238, 242, 247)"`(surfaceOverlay), 컨테이너 `borderRadius: "8px"` 확인.
- `/admin/projects` (AdminProjectsPage → AdminTable → CompactTable): 데이터 정상, `th` `fontWeight: "600"` / `background: rgb(238,242,247)` 확인 + 보존된 커스터마이즈(`wrapBorder: "1px solid rgb(216, 224, 234)"`, `wrapRadius: "8px"`) 동시 확인.
- `/projects/project-corp-knowledge/sources` (SourceManagerPage): 4개 소스 행, 상태 배지, 링크 정상 렌더, 콘솔 에러 없음.
- `/projects/project-corp-knowledge/extraction-jobs` (ExtractionJobMonitorPage): 작업 목록 테이블 정상 렌더(Job/Status/Provider/Source/Progress/Error/Created/Candidates 전 컬럼), 콘솔 에러 없음.

dev 서버는 확인 후 종료했고, `lsof -i :5173`/`lsof -i :8000` 모두 잔여 리스너 없음을 확인함.

- 실행하지 못한 검증: 없음(요청된 검증 전부 실행)

## API/Enum/DTO 변경
- 변경 여부: 없음
- 상세: 순수 프레젠테이션(스타일) 리팩터. 라우트/타입/API 호출 로직 변경 없음.
- 영향받는 역할: 없음

## Blocker
- 없음

## 남은 TODO
- `EvidenceViewerPage.tsx`의 구조화 하이라이트 테이블은 범위상 의도적으로 스킵함 — 향후 별도 wave에서 "강조 셀 지원 opt-in"을 `CompactTable`에 추가하고 싶다면 그때 재검토 권장(이번 wave 범위 밖).

## 다른 역할에 전달할 내용
- PM: 13개 대상 파일 중 12개(2개는 admin 인프라 경유로 7개가 한 번에 커버됨)를 이관했고 1개(EvidenceViewerPage)는 고유 스타일 보존을 위해 의도적으로 스킵함.
- Backend: 해당 없음.
- Frontend: `AdminTable`(`mvp5Shared.tsx`)이 이제 `CompactTable`을 합성하므로, 이후 `CompactTable`을 다시 손볼 때 admin 7개 페이지도 함께 영향받는다는 점 인지 필요.
- QA: 위 4개 페이지 외 나머지 이관 페이지(`SourceDetailPage`, `SourceProfilingPage`, `CandidateResultsPage`, `ExtractionJobMonitorPage`, 나머지 admin 6개)도 회귀 확인 권장.

## 총괄에게 요청하는 결정
- 없음 — 스킵 사유(EvidenceViewerPage)와 admin 인프라 경유 방식(AdminTable 재정의)이 이번 판단으로 적절한지 확인만 부탁드립니다.

## 현재 판정
- PASS
