import type { ReactNode } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { HanaBadge } from "../shared/ui/hana";
import {
  PublishedEntity,
  PublishedGraphSnapshot,
  PublishedRelation,
  PublishEligibilityReasonCode,
  PublishJob,
  ValidationResultSeverity,
} from "../shared/api/types";

const mvp3Stages = ["Review inbox", "Workbench", "Publish queue", "Published graph", "Quality"] as const;

type Mvp3Stage = (typeof mvp3Stages)[number];

export function Mvp3Workflow({ current, action }: { current: Mvp3Stage; action?: ReactNode }) {
  const currentIndex = mvp3Stages.indexOf(current);

  return (
    <WorkflowWrap aria-label="MVP3 review workflow">
      <WorkflowHeader>
        <strong>Review to published facts</strong>
        {action}
      </WorkflowHeader>
      <WorkflowList>
        {mvp3Stages.map((stage, index) => (
          <WorkflowItem key={stage} data-state={index === currentIndex ? "current" : index < currentIndex ? "done" : "ready"}>
            <span>{stage}</span>
          </WorkflowItem>
        ))}
      </WorkflowList>
    </WorkflowWrap>
  );
}

export function severityTone(severity: ValidationResultSeverity) {
  if (severity === "FAILED") {
    return "danger" as const;
  }
  if (severity === "WARNING") {
    return "warning" as const;
  }
  return "success" as const;
}

export function eligibilityTone(reason: PublishEligibilityReasonCode) {
  if (reason === "ELIGIBLE") {
    return "success" as const;
  }
  if (reason === "ALREADY_PUBLISHED") {
    return "muted" as const;
  }
  if (reason === "FAILED_VALIDATION" || reason === "MISSING_EVIDENCE" || reason === "BROKEN_EVIDENCE") {
    return "danger" as const;
  }
  return "warning" as const;
}

export function ReasonBadges({ reasons }: { reasons: PublishEligibilityReasonCode[] }) {
  return (
    <BadgeRow>
      {reasons.map((reason) => (
        <HanaBadge key={reason} tone={eligibilityTone(reason)}>
          {reason}
        </HanaBadge>
      ))}
    </BadgeRow>
  );
}

export function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function toPublishJobView(job: PublishJob) {
  const totalCandidates = job.candidate_refs.length;
  const terminal = job.status === "SUCCESS" || job.status === "PARTIAL_FAILED" || job.status === "FAILED";
  const publishedCount = job.published_entity_count + job.published_relation_count;
  const progress = terminal ? 100 : job.status === "RUNNING" ? 50 : 0;
  const eligibilitySummary = job.skip_reasons.reduce<Record<PublishEligibilityReasonCode, number>>(
    (summary, eligibility) => {
      eligibility.reasons.forEach((reason) => {
        summary[reason] += 1;
      });
      return summary;
    },
    {
      ELIGIBLE: job.eligible_count,
      NOT_APPROVED_OR_MODIFIED: 0,
      PENDING: 0,
      REJECTED: 0,
      NEEDS_DISCUSSION: 0,
      MISSING_EVIDENCE: 0,
      BROKEN_EVIDENCE: 0,
      FAILED_VALIDATION: 0,
      WARNING_REASON_REQUIRED: 0,
      ALREADY_PUBLISHED: 0,
      ONTOLOGY_VERSION_MISMATCH: 0,
      PUBLISH_PERMISSION_REQUIRED: 0,
      CORRECTION_DIFF_REQUIRED: 0,
    },
  );

  return {
    progress,
    selectedCandidateCount: totalCandidates,
    publishedCount,
    failedCount: job.status === "FAILED" ? totalCandidates : 0,
    eligibilitySummary,
    resultVersionId: job.published_graph_version_id,
    finishedAt: job.ended_at,
  };
}

export function toPublishedGraphView(graph: PublishedGraphSnapshot) {
  const entityLabels = new Map(graph.entities.map((entity) => [entity.id, entity.canonical_name]));

  return {
    version: {
      number: graph.version.version,
      isCurrent: graph.version.is_current,
    },
    entities: graph.entities.map((entity) => toPublishedEntityView(entity)),
    relations: graph.relations.map((relation) => toPublishedRelationView(relation, entityLabels)),
  };
}

function toPublishedEntityView(entity: PublishedEntity) {
  return {
    id: entity.id,
    label: entity.canonical_name,
    classLabel: String(entity.properties.class_label ?? entity.class_id),
    sourceCandidateIds: entity.source_candidate_entity_ids,
  };
}

function toPublishedRelationView(relation: PublishedRelation, entityLabels: Map<string, string>) {
  return {
    id: relation.id,
    label: String(relation.properties.label ?? relation.relation_id),
    sourceLabel: entityLabels.get(relation.source_published_entity_id) ?? relation.source_published_entity_id,
    targetLabel: entityLabels.get(relation.target_published_entity_id) ?? relation.target_published_entity_id,
    sourceCandidateIds: relation.source_candidate_relation_ids,
  };
}

export const Mvp3ActionLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.borderStrong};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};
  color: ${({ theme }) => theme.color.text};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

export const Mvp3PrimaryLink = styled(Mvp3ActionLink)`
  border-color: ${({ theme }) => theme.color.primary};
  background: ${({ theme }) => theme.color.primary};
  color: #ffffff;
`;

export const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
`;

export const ScreenGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.75fr);
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 1120px) {
    grid-template-columns: 1fr;
  }
`;

export const CardBody = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
`;

export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

export const FieldLabel = styled.label`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    text-transform: uppercase;
  }
`;

export const CompactTable = styled.div`
  width: 100%;
  overflow-x: auto;

  table {
    width: 100%;
    min-width: 860px;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 13px 16px;
    border-bottom: 1px solid ${({ theme }) => theme.color.border};
    text-align: left;
    vertical-align: top;
  }

  th {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    text-transform: uppercase;
  }

  tr:last-child td {
    border-bottom: 0;
  }
`;

export const Muted = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.textMuted};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
`;

export const Stack = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  min-width: 0;
`;

export const Split = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`;

export const KeyValue = styled.dl`
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  margin: 0;

  dt {
    color: ${({ theme }) => theme.color.textMuted};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }

  dd {
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
  }
`;

const WorkflowWrap = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};
`;

const WorkflowHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
  flex-wrap: wrap;
`;

const WorkflowList = styled.ol`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
  margin: 0;
  padding: 0;
  list-style: none;

  @media (max-width: 880px) {
    grid-template-columns: 1fr;
  }
`;

const WorkflowItem = styled.li`
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surface};
  color: ${({ theme }) => theme.color.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};

  &[data-state="current"] {
    border-color: ${({ theme }) => theme.color.primary};
    color: ${({ theme }) => theme.color.primary};
  }

  &[data-state="done"] {
    color: ${({ theme }) => theme.color.positive};
  }
`;
