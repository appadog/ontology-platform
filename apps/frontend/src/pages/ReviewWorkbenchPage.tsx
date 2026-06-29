import { useMemo, useState } from "react";
import styled from "styled-components";
import { Check, FileWarning, MessageSquare, PenLine, X } from "lucide-react";
import { useParams } from "react-router-dom";
import { useProject, useReviewTask } from "../shared/api/queries";
import { ReviewDecisionType } from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, HanaInput, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { formatDateTime } from "../shared/lib/format";
import {
  BadgeRow,
  CardBody,
  KeyValue,
  Mvp3ActionLink,
  Mvp3Workflow,
  Muted,
  ReasonBadges,
  ScreenGrid,
  Split,
  Stack,
  severityTone,
} from "./mvp3Shared";

const decisionLabels: Record<ReviewDecisionType, string> = {
  APPROVE: "Approve",
  REJECT: "Reject",
  REQUEST_CHANGES: "Needs discussion",
  MODIFY_AND_APPROVE: "Modify and approve",
};

export function ReviewWorkbenchPage() {
  const { projectId = "", reviewTaskId = "" } = useParams();
  const [reason, setReason] = useState("");
  const projectQuery = useProject(projectId);
  const taskQuery = useReviewTask(reviewTaskId);
  const decisionStates = useMemo(() => {
    const task = taskQuery.data;

    if (!task) {
      return [];
    }
    const taskAny = task as typeof task & {
      can_decide?: boolean;
      read_only_reason?: string | null;
      corrections?: Array<{ correction_diff?: Array<{ field_path: string }> }>;
    };
    const canDecide = taskAny.can_decide ?? false;
    const evidenceState = String(task.evidence_state ?? "MISSING").toUpperCase();
    const correctionDiff = task.correction?.diff ?? taskAny.corrections?.[0]?.correction_diff ?? [];
    const publishStatus = task.publish_status ?? "NOT_PUBLISHED";

    return (Object.keys(decisionLabels) as ReviewDecisionType[]).map((decision) => {
      const requiresReason =
        decision === "REJECT" ||
        decision === "REQUEST_CHANGES" ||
        decision === "MODIFY_AND_APPROVE" ||
        (decision === "APPROVE" && task.validation_results.some((result) => result.severity === "WARNING"));
      const disabledReasons: string[] = [];

      if (!canDecide) {
        disabledReasons.push(taskAny.read_only_reason ?? "No review permission");
      }
      if (requiresReason && !reason.trim()) {
        disabledReasons.push("Reason required");
      }
      if (evidenceState !== "PRESENT" && (decision === "APPROVE" || decision === "MODIFY_AND_APPROVE")) {
        disabledReasons.push(evidenceState === "MISSING" ? "Missing evidence" : "Broken evidence");
      }
      if (task.validation_results.some((result) => result.severity === "FAILED") && (decision === "APPROVE" || decision === "MODIFY_AND_APPROVE")) {
        disabledReasons.push("Failed validation");
      }
      if (decision === "MODIFY_AND_APPROVE" && correctionDiff.length === 0) {
        disabledReasons.push("No correction diff");
      }
      if (publishStatus === "PUBLISHED") {
        disabledReasons.push("Already published");
      }

      return {
        decision,
        disabled: disabledReasons.length > 0,
        disabledReasons,
      };
    });
  }, [reason, taskQuery.data]);

  if (projectQuery.isLoading || taskQuery.isLoading) {
    return <PageState kind="loading" title="Workbench를 불러오는 중" description="Evidence, correction, validation, decision history를 준비하고 있습니다." />;
  }

  if (projectQuery.isError || taskQuery.isError || !projectQuery.data || !taskQuery.data) {
    return (
      <PageState
        kind="error"
        title="Review workbench를 열지 못했습니다"
        description="Review inbox에서 task 상태를 새로고침한 뒤 다시 선택하세요."
        actionLabel="다시 시도"
        onAction={() => {
          void projectQuery.refetch();
          void taskQuery.refetch();
        }}
      />
    );
  }

  const task = taskQuery.data;
  const taskAny = task as typeof task & {
    candidate_snapshot?: Record<string, unknown>;
    corrections?: Array<{
      corrected_payload?: Record<string, unknown>;
      correction_diff?: Array<{ field_path: string; original_value: unknown; corrected_value: unknown }>;
    }>;
    decisions?: Array<{
      id: string;
      decision: ReviewDecisionType;
      resulting_review_status: string;
      reviewer_id: string;
      reviewer_display_name?: string | null;
      reason: string | null;
      created_at: string;
      publish_eligibility?: { reasons: [] };
    }>;
    source_excerpt?: string;
    source_locator?: string;
    can_decide?: boolean;
    read_only_reason?: string | null;
    publish_eligibility?: { reasons: [] };
    source_display_name?: string;
    job_display_label?: string;
    source_context_label?: string;
    confidence?: number;
  };
  const reviewStatus = task.review_status ?? task.status;
  const publishStatus = task.publish_status ?? ((taskAny.candidate_snapshot?.publish_status as string | undefined) ?? "NOT_PUBLISHED");
  const evidenceState = String(task.evidence_state ?? "MISSING").toUpperCase();
  const canDecide = taskAny.can_decide ?? false;
  const candidateSnapshot = task.original_snapshot ?? taskAny.candidate_snapshot ?? {};
  const latestCorrection = task.correction ?? taskAny.corrections?.[0] ?? null;
  const latestCorrectionAny = latestCorrection as
    | {
        corrected_payload?: Record<string, unknown>;
        correction_diff?: Array<{ field_path: string; original_value: unknown; corrected_value: unknown }>;
      }
    | null;
  const correctedSnapshot = task.corrected_snapshot ?? latestCorrectionAny?.corrected_payload ?? null;
  const correctionDiff: Array<{ field_path: string; original_value: unknown; corrected_value: unknown }> =
    task.correction?.diff ?? latestCorrectionAny?.correction_diff ?? [];
  const decisions = task.decision_history ?? taskAny.decisions ?? [];
  const publishReasonCodes = taskAny.publish_eligibility?.reasons ?? decisions[0]?.publish_eligibility?.reasons ?? [];

  return (
    <>
      <Breadcrumbs
        items={[
          { label: projectQuery.data.name, to: `/projects/${projectId}` },
          { label: "Review", to: `/projects/${projectId}/review` },
          { label: task.candidate_display_name },
        ]}
      />
      <PageHeader title="검수 워크벤치" description={task.candidate_display_name}>
        <StatusBadge token={reviewStatus} tone={statusToTone(reviewStatus)} />
        <StatusBadge token={publishStatus} tone={statusToTone(publishStatus)} />
        <Mvp3ActionLink to={`/projects/${projectId}/publish`}>Publish queue</Mvp3ActionLink>
      </PageHeader>
      <Mvp3Workflow current="Workbench" action={<Mvp3ActionLink to={`/projects/${projectId}/review`}>Back to inbox</Mvp3ActionLink>} />
      {!canDecide ? (
        <PageState kind="permission" title="Read-only review" description={taskAny.read_only_reason ?? "This task is visible without decision permission."} />
      ) : null}
      <ScreenGrid>
        <Stack>
          <HanaCard title="Evidence and source" description={taskAny.source_locator ?? task.source_id ?? "Actual API source context"}>
            <EvidencePanel data-state={evidenceState}>
              {evidenceState === "PRESENT" ? (
                <blockquote>{taskAny.source_excerpt ?? "Evidence is linked in the actual API response."}</blockquote>
              ) : (
                <Muted>Evidence is not available for this candidate.</Muted>
              )}
              <KeyValue>
                <dt>Source</dt>
                <dd>{taskAny.source_display_name ?? task.source_id ?? "Source unavailable"}</dd>
                <dt>Job</dt>
                <dd>{taskAny.job_display_label ?? task.extraction_job_id ?? "Job unavailable"}</dd>
                <dt>Context</dt>
                <dd>{taskAny.source_context_label ?? "Actual API task context"}</dd>
                <dt>Evidence state</dt>
                <dd>
                  <StatusBadge token={evidenceState} tone={evidenceState === "PRESENT" ? "success" : "danger"} />
                </dd>
              </KeyValue>
            </EvidencePanel>
          </HanaCard>
          <HanaCard title="Candidate context" description="Candidate graph remains separate from published graph.">
            <CardBody>
              <CandidateMiniGraph>
                <GraphNode>{task.candidate_kind}</GraphNode>
                <GraphEdge>{task.candidate_display_name}</GraphEdge>
                <GraphNode>{task.validation_status}</GraphNode>
              </CandidateMiniGraph>
              <KeyValue>
                <dt>Candidate</dt>
                <dd>{task.candidate_id}</dd>
                <dt>Priority</dt>
                <dd>{task.priority_reason ?? task.priority}</dd>
                <dt>Confidence</dt>
                <dd>{typeof taskAny.confidence === "number" ? `${Math.round(taskAny.confidence * 100)}%` : "Not reported"}</dd>
              </KeyValue>
            </CardBody>
          </HanaCard>
          <HanaCard title="Original vs corrected">
            <Split>
              <SnapshotBox>
                <h3>Original LLM value</h3>
                <pre>{JSON.stringify(candidateSnapshot, null, 2)}</pre>
              </SnapshotBox>
              <SnapshotBox>
                <h3>Expert correction</h3>
                <pre>{JSON.stringify(correctedSnapshot ?? { state: "No correction diff saved" }, null, 2)}</pre>
              </SnapshotBox>
            </Split>
            <DiffList>
              {correctionDiff.length === 0 ? (
                <Muted>No correction diff.</Muted>
              ) : (
                correctionDiff.map((item) => (
                  <li key={item.field_path}>
                    <strong>{item.field_path}</strong>
                    <span>
                      {String(item.original_value)} {"->"} {String(item.corrected_value)}
                    </span>
                  </li>
                ))
              )}
            </DiffList>
          </HanaCard>
        </Stack>
        <Stack>
          <HanaCard title="Decision actions" description="Buttons expose the current blocking reason before submit.">
            <CardBody>
              <HanaInput value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for warning, rejection, discussion, or correction" />
              <ActionGrid>
                {decisionStates.map((state) => (
                  <DecisionAction key={state.decision}>
                    <HanaButton type="button" variant={state.decision === "REJECT" ? "danger" : state.decision === "APPROVE" ? "primary" : "secondary"} disabled={state.disabled}>
                      {state.decision === "APPROVE" ? <Check aria-hidden="true" /> : null}
                      {state.decision === "REJECT" ? <X aria-hidden="true" /> : null}
                      {state.decision === "REQUEST_CHANGES" ? <MessageSquare aria-hidden="true" /> : null}
                      {state.decision === "MODIFY_AND_APPROVE" ? <PenLine aria-hidden="true" /> : null}
                      {decisionLabels[state.decision]}
                    </HanaButton>
                    <small>{state.disabledReasons.length === 0 ? "Ready" : state.disabledReasons.join(", ")}</small>
                  </DecisionAction>
                ))}
              </ActionGrid>
              <ReasonBadges reasons={publishReasonCodes} />
            </CardBody>
          </HanaCard>
          <HanaCard title="Validation results">
            <CardBody>
              {task.validation_results.map((result) => (
                <ValidationItem key={result.id}>
                  <FileWarning aria-hidden="true" />
                  <div>
                    <BadgeRow>
                      <HanaBadge tone={severityTone(result.severity)}>{result.severity}</HanaBadge>
                      <HanaBadge tone={result.blocking ? "danger" : "neutral"}>{result.rule_code}</HanaBadge>
                    </BadgeRow>
                    <strong>{result.field_path || "candidate"}</strong>
                    <p>{result.message}</p>
                    {result.suggested_fix ? <Muted>{result.suggested_fix}</Muted> : null}
                  </div>
                </ValidationItem>
              ))}
            </CardBody>
          </HanaCard>
          <HanaCard title="Decision history">
            <CardBody>
              {decisions.length === 0 ? (
                <PageState kind="empty" title="No decision yet" description="This candidate is still awaiting a first expert decision." />
              ) : (
                decisions.map((decision) => (
                  <HistoryItem key={decision.id}>
                    <BadgeRow>
                      <StatusBadge token={decision.decision} tone={statusToTone(decision.resulting_review_status)} />
                      <span>{formatDateTime(decision.created_at)}</span>
                    </BadgeRow>
                    <strong>{decision.reviewer_display_name ?? decision.reviewer_id}</strong>
                    <Muted>{decision.reason ?? "No reason stored"}</Muted>
                  </HistoryItem>
                ))
              )}
            </CardBody>
          </HanaCard>
        </Stack>
      </ScreenGrid>
    </>
  );
}

const EvidencePanel = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};

  blockquote {
    margin: 0;
    padding: ${({ theme }) => theme.spacing.lg};
    border-left: 4px solid ${({ theme }) => theme.color.primary};
    background: ${({ theme }) => theme.color.surface};
    line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  }

  &[data-state="MISSING"],
  &[data-state="BROKEN"] {
    border-left: 4px solid ${({ theme }) => theme.color.danger};
  }
`;

const CandidateMiniGraph = styled.div`
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(180px, 1.3fr) minmax(120px, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const GraphNode = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.borderStrong};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surface};
  text-align: center;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const GraphEdge = styled(GraphNode)`
  border-color: ${({ theme }) => theme.color.primary};
  color: ${({ theme }) => theme.color.primary};
`;

const SnapshotBox = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};

  h3 {
    margin: 0;
    font-size: ${({ theme }) => theme.typography.fontSize.md};
  }

  pre {
    max-width: 100%;
    margin: 0;
    overflow: auto;
    padding: ${({ theme }) => theme.spacing.md};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.color.surface};
  }
`;

const DiffList = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  margin: 0;
  padding: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};
  list-style: none;

  li {
    display: grid;
    gap: ${({ theme }) => theme.spacing.xs};
    padding: ${({ theme }) => theme.spacing.md};
    border: 1px solid ${({ theme }) => theme.color.border};
    border-radius: ${({ theme }) => theme.radius.sm};
  }
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const DecisionAction = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};

  small {
    color: ${({ theme }) => theme.color.textMuted};
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  }
`;

const ValidationItem = styled.div`
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.md};

  svg {
    color: ${({ theme }) => theme.color.warning};
  }

  p {
    margin: ${({ theme }) => theme.spacing.xs} 0;
  }
`;

const HistoryItem = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  padding-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.color.border};

  &:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }
`;
