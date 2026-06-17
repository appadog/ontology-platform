# Infra

로컬 개발과 후속 배포 인프라 파일을 두는 영역입니다.

## Current Scope

현재는 대규모 구현 전 골격 단계이므로 실제 실행 파일보다 로컬 인프라 요구사항과 ownership을 먼저 둡니다.

## Planned Local Services

- PostgreSQL: metadata, ontology, source, candidate/review/publish 확장 기반
- Redis: cache, queue, worker coordination
- MinIO: 원본 파일과 parsing result object storage
- Neo4j 또는 temporary graph adapter: ontology graph와 후속 published graph adapter

## Rules

- secret은 commit하지 않는다.
- `.env.example`에는 안전한 local default만 둔다.
- Docker Compose 작성 시 service healthcheck와 volume 이름을 명시한다.
- frontend/backend 실행법과 port는 각 앱 README와 맞춘다.
