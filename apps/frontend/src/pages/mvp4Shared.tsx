import type { ReactNode } from "react";
import styled from "styled-components";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import {
  EvaluationDatasetStatus,
  ExternalApiAuthMode,
  GraphExploreState,
  PromptExperimentStatus,
  RagAnswerState,
  SearchIndexState,
  VectorAdapterStatus,
} from "../shared/api/types";

export function pct(value?: number | null) {
  if (value === null || value === undefined) {
    return "Unavailable";
  }

  return `${Math.round(value * 100)}%`;
}

export function valueLabel(value?: number | null, rate?: number | null) {
  if (rate !== null && rate !== undefined) {
    return pct(rate);
  }

  if (value !== null && value !== undefined) {
    return String(value);
  }

  return "Partial";
}

export function versionLabel(version?: { published_graph_version: number; is_current: boolean } | null) {
  if (!version) {
    return "No published version";
  }

  return `Published graph v${version.published_graph_version}${version.is_current ? " current" : " selected"}`;
}

export function stateTone(
  state:
    | EvaluationDatasetStatus
    | PromptExperimentStatus
    | RagAnswerState
    | GraphExploreState
    | SearchIndexState
    | VectorAdapterStatus
    | ExternalApiAuthMode
    | "READ_ONLY"
    | "PENDING"
    | "RUNNING"
    | "FAILED"
    | "SUCCESS",
) {
  if (state === "ACTIVE" || state === "COMPLETED" || state === "ANSWERED" || state === "READY" || state === "AVAILABLE" || state === "SUCCESS") {
    return "success" as const;
  }
  if (state === "DRAFT" || state === "DEV_AUTH" || state === "READ_ONLY") {
    return "neutral" as const;
  }
  if (
    state === "RUNNING" ||
    state === "PARTIAL" ||
    state === "STALE" ||
    state === "FALLBACK_KEYWORD" ||
    state === "SAFE_TOO_LARGE" ||
    state === "INSUFFICIENT_EVIDENCE"
  ) {
    return "warning" as const;
  }
  if (state === "ERROR" || state === "FAILED" || state === "UNAVAILABLE") {
    return "danger" as const;
  }
  return "muted" as const;
}

export function StateBadge({ state }: { state: Parameters<typeof stateTone>[0] }) {
  // D6 (FE6-035): render the state token as the shared StatusBadge (icon +
  // UPPER_SNAKE token + Korean gloss). Keep the domain-derived tone via the
  // override so MVP4 state coloring (e.g. ERROR -> danger, ACTIVE -> success)
  // is preserved; the badge still shows the exact token text.
  return <StatusBadge token={state} tone={stateTone(state)} />;
}

export function Mvp4StatePanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <StatePanel>
      <strong>{title}</strong>
      <div>{children}</div>
    </StatePanel>
  );
}

export const PageActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

export const Mvp4Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

export const Mvp4TwoColumn = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.75fr);
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 1020px) {
    grid-template-columns: 1fr;
  }
`;

export const Mvp4Panel = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surface};

  strong,
  code {
    overflow-wrap: anywhere;
  }

  span,
  p {
    color: ${({ theme }) => theme.color.textMuted};
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  }
`;

export const InlineList = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const StatePanel = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceMuted};

  div {
    color: ${({ theme }) => theme.color.textMuted};
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  }
`;
