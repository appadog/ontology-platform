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

// Wave 37 (FE6-042 / §5.2): KO decision action labels (D3). The resulting
// *status* badge still shows the EN token (APPROVED 등) per D6 — only these
// action button labels are Korean. ReviewDecisionType enum values are unchanged.
const decisionLabels: Record<ReviewDecisionType, string> = {
  APPROVE: "승인",
  REJECT: "반려",
  REQUEST_CHANGES: "논의 필요",
  MODIFY_AND_APPROVE: "수정 후 승인",
};

// Outcome-first KO blocking reasons shown under each decision button (P7).
const blockingReasonText: Record<string, string> = {
  "No review permission": "검수 권한이 없습니다",
  "Reason required": "사유 입력이 필요합니다",
  "Missing evidence": "근거가 없습니다",
  "Broken evidence": "근거 연결이 끊어졌습니다",
  "Failed validation": "검증 실패 항목입니다",
  "No correction diff": "수정 내역이 없습니다",
  "Already published": "이미 게시되었습니다",
};

function reasonLabel(reason: string) {
  return blockingReasonText[reason] ?? reason;
}

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
    return <PageState kind="loading" title="워크벤치를 불러오는 중" description="근거, 수정 내역, 검증, 결정 이력을 준비하고 있습니다." />;
  }

  if (projectQuery.isError || taskQuery.isError || !projectQuery.data || !taskQuery.data) {
    return (
      <PageState
        kind="error"
        title="검수 워크벤치를 열지 못했습니다"
        description="검수 인박스에서 태스크 상태를 새로고침한 뒤 다시 선택하세요."
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
          { label: "검수", to: `/projects/${projectId}/review` },
          { label: task.candidate_display_name },
        ]}
      />
      <PageHeader title="검수 워크벤치" description={task.candidate_display_name}>
        <StatusBadge token={reviewStatus} tone={statusToTone(reviewStatus)} />
        <StatusBadge token={publishStatus} tone={statusToTone(publishStatus)} />
        <Mvp3ActionLink to={`/projects/${projectId}/publish`}>게시 큐</Mvp3ActionLink>
      </PageHeader>
      <Mvp3Workflow current="Workbench" action={<Mvp3ActionLink to={`/projects/${projectId}/review`}>인박스로 돌아가기</Mvp3ActionLink>} />
      {!canDecide ? (
        <PageState kind="permission" title="읽기 전용 검수" description={taskAny.read_only_reason ?? "결정 권한 없이 열람만 가능한 항목입니다."} />
      ) : null}
      <HanaCard
        emphasis="summary"
        eyebrow="검수 결정"
        title="이 항목을 게시 후보로 넘길지 결정합니다"
        description="근거와 검증 결과를 확인하고 한 가지 결정을 선택하세요."
      >
        <SummaryBody>
          {task.validation_results.some((result) => result.severity === "WARNING") ? (
            <Muted>검증 경고가 있는 항목입니다. 게시하려면 사유를 입력해야 합니다.</Muted>
          ) : (
            <Muted>검증 결과와 근거 상태를 확인한 뒤 아래에서 결정을 진행하세요.</Muted>
          )}
        </SummaryBody>
      </HanaCard>
      <ScreenGrid>
        <Stack>
          <HanaCard title="근거와 소스" description={taskAny.source_locator ?? task.source_id ?? "소스 맥락 정보 없음"}>
            <EvidencePanel data-state={evidenceState}>
              {evidenceState === "PRESENT" ? (
                <blockquote>{taskAny.source_excerpt ?? "근거가 연결되어 있습니다."}</blockquote>
              ) : (
                <Muted>이 후보에는 근거를 확인할 수 없습니다.</Muted>
              )}
              <KeyValue>
                <dt>소스</dt>
                <dd>{taskAny.source_display_name ?? task.source_id ?? "소스 정보 없음"}</dd>
                <dt>작업</dt>
                <dd>{taskAny.job_display_label ?? task.extraction_job_id ?? "작업 정보 없음"}</dd>
                <dt>맥락</dt>
                <dd>{taskAny.source_context_label ?? "작업 맥락 정보 없음"}</dd>
                <dt>근거 상태</dt>
                <dd>
                  <StatusBadge token={evidenceState} tone={evidenceState === "PRESENT" ? "success" : "danger"} />
                </dd>
              </KeyValue>
            </EvidencePanel>
          </HanaCard>
          <HanaCard title="후보 맥락" description="후보 그래프는 게시 그래프와 분리되어 유지됩니다.">
            <CardBody>
              <CandidateMiniGraph>
                <GraphNode>{task.candidate_kind}</GraphNode>
                <GraphEdge>{task.candidate_display_name}</GraphEdge>
                <GraphNode>{task.validation_status}</GraphNode>
              </CandidateMiniGraph>
              <KeyValue>
                <dt>후보</dt>
                <dd>{task.candidate_id}</dd>
                <dt>우선순위</dt>
                <dd>{task.priority_reason ?? task.priority}</dd>
                <dt>신뢰도</dt>
                <dd>{typeof taskAny.confidence === "number" ? `${Math.round(taskAny.confidence * 100)}%` : "보고되지 않음"}</dd>
              </KeyValue>
            </CardBody>
          </HanaCard>
          <HanaCard title="원본과 수정 비교" description="원본 LLM 값과 전문가 수정 내역을 펼쳐서 비교합니다.">
            <Drilldown>
              <summary>원본 / 수정 상세 보기</summary>
              <Split>
                <SnapshotBox>
                  <h3>원본 LLM 값</h3>
                  <pre>{JSON.stringify(candidateSnapshot, null, 2)}</pre>
                </SnapshotBox>
                <SnapshotBox>
                  <h3>전문가 수정</h3>
                  <pre>{JSON.stringify(correctedSnapshot ?? { state: "저장된 수정 내역 없음" }, null, 2)}</pre>
                </SnapshotBox>
              </Split>
              <DiffList>
                {correctionDiff.length === 0 ? (
                  <Muted>수정 내역이 없습니다.</Muted>
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
            </Drilldown>
          </HanaCard>
        </Stack>
        <Stack>
          <HanaCard title="검수 결정 액션" description="제출 전에 각 버튼이 현재 막힌 사유를 보여줍니다.">
            <CardBody>
              <HanaInput value={reason} onChange={(event) => setReason(event.target.value)} placeholder="경고, 반려, 논의, 수정에 대한 사유" />
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
                    <small>{state.disabledReasons.length === 0 ? "선택 가능" : state.disabledReasons.map(reasonLabel).join(", ")}</small>
                  </DecisionAction>
                ))}
              </ActionGrid>
              <ReasonBadges reasons={publishReasonCodes} />
            </CardBody>
          </HanaCard>
          <HanaCard title="검증 결과">
            <CardBody>
              {task.validation_results.map((result) => (
                <ValidationItem key={result.id}>
                  <FileWarning aria-hidden="true" />
                  <div>
                    <BadgeRow>
                      <HanaBadge tone={severityTone(result.severity)}>{result.severity}</HanaBadge>
                      <HanaBadge tone={result.blocking ? "danger" : "neutral"}>{result.rule_code}</HanaBadge>
                    </BadgeRow>
                    <strong>{result.field_path || "후보"}</strong>
                    <p>{result.message}</p>
                    {result.suggested_fix ? <Muted>{result.suggested_fix}</Muted> : null}
                  </div>
                </ValidationItem>
              ))}
            </CardBody>
          </HanaCard>
          <HanaCard title="결정 이력" description="이 항목의 과거 검수 결정을 펼쳐서 확인합니다.">
            {decisions.length === 0 ? (
              <CardBody>
                <PageState
                  kind="empty"
                  title="아직 결정이 없습니다"
                  description="이 후보는 첫 전문가 결정을 기다리고 있습니다. 위에서 결정을 선택하세요."
                />
              </CardBody>
            ) : (
              <Drilldown>
                <summary>결정 이력 {decisions.length}건 보기</summary>
                {decisions.map((decision) => (
                  <HistoryItem key={decision.id}>
                    <BadgeRow>
                      <StatusBadge token={decision.decision} tone={statusToTone(decision.resulting_review_status)} />
                      <span>{formatDateTime(decision.created_at)}</span>
                    </BadgeRow>
                    <strong>{decision.reviewer_display_name ?? decision.reviewer_id}</strong>
                    <Muted>{decision.reason ?? "저장된 사유 없음"}</Muted>
                  </HistoryItem>
                ))}
              </Drilldown>
            )}
          </HanaCard>
        </Stack>
      </ScreenGrid>
    </>
  );
}

const SummaryBody = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};
`;

// Wave 37 (FE6-042 / P6): progressive disclosure for dense detail (raw diff,
// audit history) — collapsed by default behind a native disclosure.
const Drilldown = styled.details`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};

  > summary {
    cursor: pointer;
    padding: ${({ theme }) => theme.spacing.sm} 0;
    color: ${({ theme }) => theme.color.textMuted};
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  }
`;

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
