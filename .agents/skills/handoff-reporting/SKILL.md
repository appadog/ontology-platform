---
name: handoff-reporting
description: Use this project-local skill whenever an agent receives, executes, finishes, reports, coordinates, or hands off PM, Backend, Frontend, QA, integration, or architecture work in this ontology-platform repo. It defines the mandatory report-at-finish workflow, wave folders, report template, current-state review, and next-order protocol for multi-agent execution.
---

# Handoff Reporting Skill

## Purpose

This skill makes multi-agent work controllable. A task is not complete when code or docs are changed; it is complete only after the agent writes a handoff report in the assigned location.

## When to Use

Use this skill for every PM, Backend, Frontend, QA, Infra, Integration, or commander task in this repo.

## Required Inputs

- Current order from the commander
- Relevant backlog IDs
- Relevant source docs
- Assigned report path, normally `docs/handoffs/wave-XXX/{ROLE}_REPORT.md`

## Start-of-work Checklist

1. Read `AGENTS.md`.
2. Read `docs/handoffs/CURRENT_STATE.md`.
3. Read the current wave order, for example `docs/handoffs/wave-001/NEXT_ORDERS.md`.
4. Read role-specific source docs:
   - PM: `03_PM_AGENT_SKILL.md`, `docs/pm/*`
   - Backend: `01_BACKEND_AGENT_SKILL.md`, `apps/backend/README.md`, `docs/api/*`
   - Frontend: `02_FRONTEND_AGENT_SKILL.md`, `apps/frontend/README.md`, `docs/pm/IA_MVP1.md`
   - QA: `docs/backlog/INT-001_MVP1_DEMO_ACCEPTANCE.md`, `docs/backlog/MVP1_BACKLOG.md`
5. Confirm the assigned report path before making changes.

## End-of-work Requirement

Before stopping, write or update the assigned report using `docs/handoffs/REPORT_TEMPLATE.md`.

Minimum report content:

- 담당 범위
- 완료한 작업
- 변경 파일
- 실행/검증 결과
- API/Enum/DTO 변경 여부
- blocker
- 남은 TODO
- 다른 역할에 전달할 내용
- 총괄에게 요청하는 결정
- 현재 판정: `PASS`, `PARTIAL`, `FAIL`, or `NOT RUNNABLE`

## Commander Workflow

When acting as commander:

1. Read `docs/handoffs/CURRENT_STATE.md`.
2. Read all current wave reports.
3. Compare reports against `docs/backlog/MVP1_BACKLOG.md`.
4. Identify blockers, contract changes, and scope violations.
5. Update `docs/handoffs/CURRENT_STATE.md`.
6. Write next orders in `docs/handoffs/wave-XXX/NEXT_ORDERS.md`.
7. Assign a report path for every role in the next wave.

## Hard Rule

Do not consider a role's work done until its report file exists and names:

- backlog IDs touched
- changed files
- validation performed
- next blockers or handoff notes
