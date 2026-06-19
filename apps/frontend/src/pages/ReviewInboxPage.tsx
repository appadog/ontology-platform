import { useMemo, useState } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { useProject, useReviewTasks } from "../shared/api/queries";
import { CandidateReviewStatus, ReviewTaskListFilters, ValidationStatus } from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaCard, HanaSelect, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
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
    return <PageState kind="loading" title="Review inbox를 불러오는 중" description="검수 대상과 우선순위를 정리하고 있습니다." />;
  }

  if (projectQuery.isError || reviewTasksQuery.isError || !projectQuery.data || !reviewTasksQuery.data) {
    return (
      <PageState
        kind="error"
        title="Review inbox를 불러오지 못했습니다"
        description="현재 filter를 유지한 채 다시 조회할 수 있습니다."
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
          { label: "Projects", to: "/projects" },
          { label: projectQuery.data.name, to: `/projects/${projectId}` },
          { label: "Review inbox" },
        ]}
      />
      <PageHeader title="Review Inbox" description="Candidate decisions stay separate from published facts until publish eligibility passes.">
        <Mvp3ActionLink to={`/projects/${projectId}/publish`}>Publish queue</Mvp3ActionLink>
      </PageHeader>
      <Mvp3Workflow current="Review inbox" action={<Mvp3ActionLink to={`/projects/${projectId}/quality`}>Quality dashboard</Mvp3ActionLink>} />
      <HanaCard title="Queue filters" description="Assignment, status, validation, confidence, source and job context are preserved in the wrapped inbox response.">
        <FieldGrid>
          <FieldLabel>
            <span>Assignment</span>
            <HanaSelect value={assignment} onChange={(event) => setAssignment(event.target.value as AssignmentFilter)}>
              <option value="assigned-to-me">Assigned to me</option>
              <option value="unassigned">Unassigned</option>
              <option value="all">All reviewable</option>
            </HanaSelect>
          </FieldLabel>
          <FieldLabel>
            <span>Status</span>
            <HanaSelect value={status} onChange={(event) => setStatus(event.target.value as CandidateReviewStatus | "ALL")}>
              <option value="ALL">All</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="MODIFIED">MODIFIED</option>
              <option value="NEEDS_DISCUSSION">NEEDS_DISCUSSION</option>
            </HanaSelect>
          </FieldLabel>
          <FieldLabel>
            <span>Validation</span>
            <HanaSelect value={validationStatus} onChange={(event) => setValidationStatus(event.target.value as ValidationStatus | "ALL")}>
              <option value="ALL">All</option>
              <option value="PASSED">PASSED</option>
              <option value="WARNING">WARNING</option>
              <option value="FAILED">FAILED</option>
              <option value="NOT_VALIDATED">NOT_VALIDATED</option>
            </HanaSelect>
          </FieldLabel>
          <FieldLabel>
            <span>Confidence</span>
            <HanaSelect value={confidence} onChange={(event) => setConfidence(event.target.value as ConfidenceFilter)}>
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </HanaSelect>
          </FieldLabel>
        </FieldGrid>
      </HanaCard>
      {assignedElsewhereCount > 0 ? (
        <PageState kind="permission" title="Read-only rows included" description="Some filtered tasks are assigned to another reviewer and open in read-only mode." />
      ) : null}
      {tasks.length === 0 ? (
        <PageState kind="empty" title="No review tasks in this view" description="Switch assignment or validation filters to widen the queue." />
      ) : (
        <HanaCard title={`${reviewTasksQuery.data.total_count} review tasks`} description="Priority and reason stay visible before opening the workbench.">
          <CompactTable>
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Status</th>
                  <th>Validation</th>
                  <th>Priority</th>
                  <th>Assignment</th>
                  <th>Source / Job</th>
                  <th>Evidence</th>
                  <th>Updated</th>
                  <th>Workbench</th>
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
                          <span>{task.candidate_summary ?? `${task.candidate_kind} candidate`}</span>
                          <BadgeRow>
                            <HanaBadge tone="neutral">{task.candidate_kind}</HanaBadge>
                            {typeof taskAny.confidence === "number" ? <strong>{percent(taskAny.confidence)}</strong> : null}
                          </BadgeRow>
                        </CandidateName>
                      </td>
                      <td>
                        <BadgeRow>
                          <HanaBadge tone={statusToTone(reviewStatus)}>{reviewStatus}</HanaBadge>
                          <HanaBadge tone={statusToTone(publishStatus)}>{publishStatus}</HanaBadge>
                        </BadgeRow>
                      </td>
                      <td>
                        <CandidateName>
                          <HanaBadge tone={statusToTone(task.validation_status)}>{task.validation_status}</HanaBadge>
                          <HanaBadge tone={severityTone(validationSeverity)}>{validationSeverity}</HanaBadge>
                          <span>{validationMessage}</span>
                        </CandidateName>
                      </td>
                      <td>
                        <CandidateName>
                          <strong>{task.priority}</strong>
                          <span>{task.priority_reason ?? "Seeded review priority"}</span>
                        </CandidateName>
                      </td>
                      <td>{task.assignee_display_name ?? "Unassigned"}</td>
                      <td>
                        <CandidateName>
                          <strong>{taskAny.source_display_name ?? task.source_id ?? "Source unavailable"}</strong>
                          <span>{taskAny.job_display_label ?? task.extraction_job_id ?? "Job unavailable"}</span>
                          <span>{taskAny.source_context_label ?? "Actual API source context"}</span>
                        </CandidateName>
                      </td>
                      <td>
                        <BadgeRow>
                          <HanaBadge tone={evidenceState === "PRESENT" ? "success" : "danger"}>{evidenceState}</HanaBadge>
                          <span>{task.evidence_count}</span>
                        </BadgeRow>
                      </td>
                      <td>{formatDateTime(task.updated_at)}</td>
                      <td>
                        <Mvp3PrimaryLink to={`/projects/${projectId}/review/${task.id}`}>Open</Mvp3PrimaryLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CompactTable>
        </HanaCard>
      )}
      <HanaCard title="Queue response">
        <CardBody>
          <Muted>
            items {tasks.length} / total {reviewTasksQuery.data.total_count} · limit {reviewTasksQuery.data.limit} · offset{" "}
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
