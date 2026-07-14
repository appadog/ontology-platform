import { useMemo, useState } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { useProject, useReviewTasks } from "../shared/api/queries";
import { CandidateReviewStatus, ReviewTaskListFilters, ValidationStatus } from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaCard, HanaSelect, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { formatDateTime } from "../shared/lib/format";
import {
  BadgeRow,
  CardBody,
  CompactTable,
  FieldGrid,
  FieldLabel,
  Mvp3ActionLink,
  Mvp3PrimaryLink,
  Mvp3Workflow,
  Muted,
  percent,
  severityTone,
} from "./mvp3Shared";

type AssignmentFilter = NonNullable<ReviewTaskListFilters["assignment"]>;
type ConfidenceFilter = NonNullable<ReviewTaskListFilters["confidence"]>;

export function ReviewInboxPage() {
  const { projectId = "" } = useParams();
  const [assignment, setAssignment] = useState<AssignmentFilter>("assigned-to-me");
  const [status, setStatus] = useState<CandidateReviewStatus | "ALL">("ALL");
  const [validationStatus, setValidationStatus] = useState<ValidationStatus | "ALL">("ALL");
  const [confidence, setConfidence] = useState<ConfidenceFilter>("all");
  const projectQuery = useProject(projectId);
  const filters = useMemo<ReviewTaskListFilters>(
    () => ({ assignment, status, validation_status: validationStatus, confidence, limit: 20, offset: 0 }),
    [assignment, confidence, status, validationStatus],
  );
  const reviewTasksQuery = useReviewTasks(projectId, filters);

  if (projectQuery.isLoading || reviewTasksQuery.isLoading) {
    return <PageState kind="loading" title="검수 인박스를 불러오는 중" description="검수 대상과 우선순위를 정리하고 있습니다." />;
  }

  if (projectQuery.isError || reviewTasksQuery.isError || !projectQuery.data || !reviewTasksQuery.data) {
    return (
      <PageState
        kind="error"
        title="검수 인박스를 불러오지 못했습니다"
        description="현재 필터를 유지한 채 다시 조회할 수 있습니다."
        actionLabel="다시 시도"
        onAction={() => {
          void projectQuery.refetch();
          void reviewTasksQuery.refetch();
        }}
      />
    );
  }

  const tasks = reviewTasksQuery.data.items;
  const assignedElsewhereCount = tasks.filter((task) => task.assignee_id && !task.is_assigned_to_me).length;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: projectQuery.data.name, to: `/projects/${projectId}` },
          { label: "검수" },
        ]}
      />
      <PageHeader title="검수 인박스" description="후보 결정은 게시 적격 조건을 통과하기 전까지 게시된 사실과 분리되어 유지됩니다.">
        <Mvp3ActionLink to={`/projects/${projectId}/publish`}>게시 큐</Mvp3ActionLink>
      </PageHeader>
      <Mvp3Workflow current="Review inbox" action={<Mvp3ActionLink to={`/projects/${projectId}/quality`}>품질 대시보드</Mvp3ActionLink>} />
      <HanaCard title="검수 큐 필터" description="담당·상태·검증·신뢰도, 소스와 작업 맥락이 인박스 응답에 함께 유지됩니다.">
        <FieldGrid>
          <FieldLabel>
            <span>담당</span>
            <HanaSelect value={assignment} onChange={(event) => setAssignment(event.target.value as AssignmentFilter)}>
              <option value="assigned-to-me">나에게 배정됨</option>
              <option value="unassigned">미배정</option>
              <option value="all">전체 검수 대상</option>
            </HanaSelect>
          </FieldLabel>
          <FieldLabel>
            <span>상태</span>
            <HanaSelect value={status} onChange={(event) => setStatus(event.target.value as CandidateReviewStatus | "ALL")}>
              <option value="ALL">전체</option>
              <option value="PENDING">PENDING · 대기</option>
              <option value="APPROVED">APPROVED · 승인됨</option>
              <option value="REJECTED">REJECTED · 반려됨</option>
              <option value="MODIFIED">MODIFIED · 수정 승인</option>
              <option value="NEEDS_DISCUSSION">NEEDS_DISCUSSION · 논의 필요</option>
            </HanaSelect>
          </FieldLabel>
          <FieldLabel>
            <span>검증</span>
            <HanaSelect value={validationStatus} onChange={(event) => setValidationStatus(event.target.value as ValidationStatus | "ALL")}>
              <option value="ALL">전체</option>
              <option value="PASSED">PASSED · 통과</option>
              <option value="WARNING">WARNING · 경고</option>
              <option value="FAILED">FAILED · 실패</option>
              <option value="NOT_VALIDATED">NOT_VALIDATED · 미검증</option>
            </HanaSelect>
          </FieldLabel>
          <FieldLabel>
            <span>신뢰도</span>
            <HanaSelect value={confidence} onChange={(event) => setConfidence(event.target.value as ConfidenceFilter)}>
              <option value="all">전체</option>
              <option value="low">낮음</option>
              <option value="medium">중간</option>
              <option value="high">높음</option>
            </HanaSelect>
          </FieldLabel>
        </FieldGrid>
      </HanaCard>
      {assignedElsewhereCount > 0 ? (
        <PageState kind="permission" title="읽기 전용 항목 포함" description="일부 항목은 다른 검수자에게 배정되어 읽기 전용으로 열립니다." />
      ) : null}
      {tasks.length === 0 ? (
        <PageState kind="empty" title="이 조건에 해당하는 검수 대상이 없습니다" description="담당 또는 검증 필터를 바꿔 검수 큐 범위를 넓혀 보세요." />
      ) : (
        <HanaCard title={`검수 대상 ${reviewTasksQuery.data.total_count}건`} description="워크벤치를 열기 전에 우선순위와 사유가 먼저 보입니다.">
          <CompactTable>
            <table>
              <thead>
                <tr>
                  <th>후보</th>
                  <th>상태</th>
                  <th>검증</th>
                  <th>우선순위</th>
                  <th>담당</th>
                  <th>소스 / 작업</th>
                  <th>근거</th>
                  <th>수정 시각</th>
                  <th>워크벤치</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const taskAny = task as typeof task & {
                    top_validation_message?: string | null;
                    confidence?: number;
                    source_display_name?: string;
                    job_display_label?: string;
                    source_context_label?: string;
                  };
                  const reviewStatus = task.review_status ?? task.status;
                  const publishStatus = task.publish_status ?? "NOT_PUBLISHED";
                  const validationSeverity =
                    task.top_validation?.severity ?? (task.validation_status === "FAILED" ? "FAILED" : task.validation_status === "WARNING" ? "WARNING" : "INFO");
                  const validationMessage = task.top_validation?.message ?? taskAny.top_validation_message ?? task.validation_codes.join(", ");
                  const evidenceState = String(task.evidence_state ?? "MISSING").toUpperCase();

                  return (
                    <tr key={task.id}>
                      <td>
                        <CandidateName>
                          <strong>{task.candidate_display_name ?? task.candidate_id}</strong>
                          <span>{task.candidate_summary ?? `${task.candidate_kind} 후보`}</span>
                          <BadgeRow>
                            <HanaBadge tone="neutral">{task.candidate_kind}</HanaBadge>
                            {typeof taskAny.confidence === "number" ? <strong>{percent(taskAny.confidence)}</strong> : null}
                          </BadgeRow>
                        </CandidateName>
                      </td>
                      <td>
                        <BadgeRow>
                          <StatusBadge token={reviewStatus} tone={statusToTone(reviewStatus)} />
                          <StatusBadge token={publishStatus} tone={statusToTone(publishStatus)} />
                        </BadgeRow>
                      </td>
                      <td>
                        <CandidateName>
                          <StatusBadge token={task.validation_status} tone={statusToTone(task.validation_status)} />
                          <HanaBadge tone={severityTone(validationSeverity)}>{validationSeverity}</HanaBadge>
                          <span>{validationMessage}</span>
                        </CandidateName>
                      </td>
                      <td>
                        <CandidateName>
                          <strong>{task.priority}</strong>
                          <span>{task.priority_reason ?? "기본 검수 우선순위"}</span>
                        </CandidateName>
                      </td>
                      <td>{task.assignee_display_name ?? "미배정"}</td>
                      <td>
                        <CandidateName>
                          <strong>{taskAny.source_display_name ?? task.source_id ?? "소스 정보 없음"}</strong>
                          <span>{taskAny.job_display_label ?? task.extraction_job_id ?? "작업 정보 없음"}</span>
                          <span>{taskAny.source_context_label ?? "소스 맥락"}</span>
                        </CandidateName>
                      </td>
                      <td>
                        <BadgeRow>
                          <StatusBadge token={evidenceState} tone={evidenceState === "PRESENT" ? "success" : "danger"} />
                          <span>{task.evidence_count}</span>
                        </BadgeRow>
                      </td>
                      <td>{formatDateTime(task.updated_at)}</td>
                      <td>
                        <Mvp3PrimaryLink to={`/projects/${projectId}/review/${task.id}`}>열기</Mvp3PrimaryLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CompactTable>
        </HanaCard>
      )}
      <HanaCard title="큐 응답">
        <CardBody>
          <Muted>
            항목 {tasks.length} / 전체 {reviewTasksQuery.data.total_count} · 페이지 크기 {reviewTasksQuery.data.limit} · 시작 위치{" "}
            {reviewTasksQuery.data.offset}
          </Muted>
        </CardBody>
      </HanaCard>
    </>
  );
}

const CandidateName = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;

  span {
    color: ${({ theme }) => theme.color.textMuted};
    overflow-wrap: anywhere;
  }
`;
