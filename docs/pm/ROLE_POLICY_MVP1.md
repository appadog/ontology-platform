# Role Policy MVP 1 v0.1

MVP 1은 개발용 인증 모드를 사용하되, 후속 MVP의 RBAC/SSO 확장을 막지 않도록 역할 enum과 화면/행동 권한을 먼저 고정한다.

## Roles

| Role | MVP 1 사용 여부 | 설명 |
|---|---|---|
| SYSTEM_ADMIN | reserved | 시스템 설정과 사용자 관리. MVP 5 중심 |
| PROJECT_ADMIN | active | 프로젝트 생성, 수정, 샘플 데이터 확인 |
| ONTOLOGY_MANAGER | active | 온톨로지 클래스/속성/관계 생성과 수정 |
| DATA_MANAGER | active | 원천 데이터 업로드, 목록/preview 확인 |
| EXTRACTION_MANAGER | reserved | LLM 추출 작업 실행. MVP 2부터 활성화 |
| REVIEWER | reserved | 후보 검수. MVP 3부터 활성화 |
| VIEWER | active | 프로젝트, 온톨로지, 데이터 소스 조회 |
| API_CLIENT | reserved | 외부 API 사용. MVP 5 중심 |

## Development Auth Default

MVP 1의 `/api/v1/me`는 개발용 사용자 1명을 반환한다.

```text
id: dev-user
name: Local Developer
roles:
  - PROJECT_ADMIN
  - ONTOLOGY_MANAGER
  - DATA_MANAGER
  - VIEWER
```

## MVP 1 Permission Matrix

| Action | PROJECT_ADMIN | ONTOLOGY_MANAGER | DATA_MANAGER | VIEWER |
|---|---|---|---|---|
| project:create | yes | no | no | no |
| project:update | yes | no | no | no |
| project:view | yes | yes | yes | yes |
| ontology:create/update | yes | yes | no | no |
| ontology:view | yes | yes | yes | yes |
| source:upload | yes | no | yes | no |
| source:view | yes | yes | yes | yes |
| source:delete/archive | yes | no | yes | no |

## Rules

- MVP 1에서는 실사용 로그인/SSO를 만들지 않는다.
- API와 UI는 role 이름을 위 enum과 동일하게 사용한다.
- 권한 부족 상태는 프론트엔드에서 empty/error와 구분되는 notice로 보여준다.
- 후속 MVP에서 프로젝트 멤버십 기반 권한으로 확장할 수 있게 `project_id` 컨텍스트를 유지한다.
