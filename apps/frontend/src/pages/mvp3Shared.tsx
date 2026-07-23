import type { ReactNode } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
// Wave 37 (FE6-040): shared layout primitives now live in the platform module.
import { ScreenGrid, Stack, Split, CardBody, Muted, BadgeRow } from "../shared/ui/platform/Section";
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

// Korean display labels for the review→publish stepper. The English stage keys
// above are internal identifiers used for indexing (never renamed); only the
// visible label is Korean.
const mvp3StageLabels: Record<Mvp3Stage, string> = {
  "Review inbox": "검수 인박스",
  Workbench: "검수 워크벤치",
  "Publish queue": "게시 큐",
  "Published graph": "게시 그래프",
  Quality: "품질",
};

export function Mvp3Workflow({ current, action }: { current: Mvp3Stage; action?: ReactNode }) {
  const currentIndex = mvp3Stages.indexOf(current);

  return (
    <WorkflowWrap aria-label="검수·게시 워크플로">
      <WorkflowHeader>
        <strong>검수에서 게시된 사실까지</strong>
        {action}
      </WorkflowHeader>
      <WorkflowList>
        {mvp3Stages.map((stage, index) => (
          <WorkflowItem key={stage} data-state={index === currentIndex ? "current" : index < currentIndex ? "done" : "ready"}>
            <span>{mvp3StageLabels[stage]}</span>
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
        <StatusBadge key={reason} token={reason} tone={eligibilityTone(reason)} />
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

// Wave 37 (FE6-040): ScreenGrid / Stack / Split / CardBody / Muted / BadgeRow
// were promoted into the shared platform module (imported above). Re-exported
// here so existing import sites (`./mvp3Shared`) keep working with no churn and
// no visual diff.
export { ScreenGrid, Stack, Split, CardBody, Muted, BadgeRow };

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

// Wave 60 (PM6-040, table-design deep-research): additive readability upgrade
// shared by every CompactTable consumer (~15 pages) — no per-page changes
// needed. New behavior is opt-in via transient props so all existing call
// sites keep their exact current layout unless a page opts in:
//   - `$stickyHeader` + `$maxHeight`: bounds the table to a scrollable region
//     with a sticky header (confirmed pattern: position:sticky + top:0).
//   - cells/headers can add `data-align="right"` for numeric columns
//     (confirmed: right-align numeric, left-align text).
// Always-on additive changes (safe for every existing consumer): row hover
// highlight (previously NONE — the single biggest readability gap), a subtle
// header background tint + semibold weight, and a comfortable ~44px row
// height (Supabase Data Grid reference value).
export const CompactTable = styled.div<{ $stickyHeader?: boolean; $maxHeight?: string }>`
  width: 100%;
  overflow-x: auto;
  overflow-y: ${({ $maxHeight }) => ($maxHeight ? "auto" : "visible")};
  max-height: ${({ $maxHeight }) => $maxHeight ?? "none"};
  border-radius: ${({ theme }) => theme.radius.md};

  table {
    width: 100%;
    min-width: 860px;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 14px 16px;
    border-bottom: 1px solid ${({ theme }) => theme.color.border};
    text-align: left;
    vertical-align: top;
  }

  th[data-align="right"],
  td[data-align="right"] {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  th {
    background: ${({ theme }) => theme.color.surfaceOverlay};
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
    text-transform: uppercase;
    position: ${({ $stickyHeader }) => ($stickyHeader ? "sticky" : "static")};
    top: 0;
    z-index: 2;
  }

  tbody tr {
    transition: box-shadow 120ms ease;
  }

  tbody tr:hover td {
    background: ${({ theme }) => theme.color.surfaceOverlay};
  }

  // Wave 65 (PM6-042 follow-up): the card-row hover outline introduced as a
  // one-off in ReviewInboxPage (wave-064) is genuinely useful on every
  // CompactTable consumer, so it moves here — every one of the ~15+ pages
  // that already use CompactTable (and the 7 admin pages via AdminTable)
  // inherit it for free, no per-page change needed.
  tbody tr:hover {
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.color.borderStrong};
  }

  tr:last-child td {
    border-bottom: 0;
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
