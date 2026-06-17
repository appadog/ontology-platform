import { PropsWithChildren } from "react";
import styled from "styled-components";
import { ProjectStatus, SourceStatus, ValidationStatus, OntologyVersionStatus } from "../../api/types";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "progress" | "muted";

interface HanaBadgeProps extends PropsWithChildren {
  tone?: BadgeTone;
}

const statusTone: Record<ProjectStatus | SourceStatus | ValidationStatus | OntologyVersionStatus, BadgeTone> = {
  ACTIVE: "success",
  ARCHIVED: "muted",
  DELETED: "danger",
  DRAFT: "neutral",
  PUBLISHED: "success",
  UPLOADED: "neutral",
  PARSING: "progress",
  PARSED: "progress",
  PROFILED: "success",
  EXTRACTION_READY: "success",
  FAILED: "danger",
  NOT_VALIDATED: "muted",
  PASSED: "success",
  WARNING: "warning",
};

export function statusToTone(status: keyof typeof statusTone): BadgeTone {
  return statusTone[status];
}

export function HanaBadge({ tone = "neutral", children }: HanaBadgeProps) {
  return <Badge data-tone={tone}>{children}</Badge>;
}

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  max-width: 100%;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;

  &[data-tone="neutral"] {
    background: ${({ theme }) => theme.color.draftSoft};
    color: ${({ theme }) => theme.color.draft};
  }

  &[data-tone="success"] {
    background: ${({ theme }) => theme.color.positiveSoft};
    color: ${({ theme }) => theme.color.positive};
  }

  &[data-tone="warning"] {
    background: ${({ theme }) => theme.color.warningSoft};
    color: ${({ theme }) => theme.color.warning};
  }

  &[data-tone="danger"] {
    background: ${({ theme }) => theme.color.dangerSoft};
    color: ${({ theme }) => theme.color.danger};
  }

  &[data-tone="progress"] {
    background: ${({ theme }) => theme.color.progressSoft};
    color: ${({ theme }) => theme.color.progress};
  }

  &[data-tone="muted"] {
    background: ${({ theme }) => theme.color.surfaceMuted};
    color: ${({ theme }) => theme.color.textMuted};
  }
`;
