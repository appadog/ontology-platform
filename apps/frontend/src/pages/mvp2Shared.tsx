import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

const workflowStages = ["Project", "Ontology", "Source", "Extraction", "Candidates", "Evidence"] as const;

export type WorkflowStageName = (typeof workflowStages)[number];

interface WorkflowStageProps {
  current: WorkflowStageName;
  action?: ReactNode;
}

export function WorkflowStage({ current, action }: WorkflowStageProps) {
  const currentIndex = workflowStages.indexOf(current);

  return (
    <WorkflowStageWrap aria-label="Workflow stage">
      <WorkflowStageHeader>
        <strong>Workflow</strong>
        {action ? <WorkflowStageAction>{action}</WorkflowStageAction> : null}
      </WorkflowStageHeader>
      <WorkflowStageList>
        {workflowStages.map((stage, index) => {
          const state = index < currentIndex ? "done" : index === currentIndex ? "current" : index === currentIndex + 1 ? "next" : "ready";
          const label = state === "done" ? "완료" : state === "current" ? "현재" : state === "next" ? "다음" : "준비";

          return (
            <WorkflowStageItem key={stage} data-state={state}>
              <span>{stage}</span>
              <small>{label}</small>
            </WorkflowStageItem>
          );
        })}
      </WorkflowStageList>
    </WorkflowStageWrap>
  );
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export const PanelGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  align-items: end;
  padding: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

export const Field = styled.label`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    text-transform: uppercase;
  }
`;

export const ButtonSlot = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  button,
  a {
    min-width: max-content;
  }
`;

export const MutedText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.textMuted};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
`;

export const InlineList = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
`;

export const DataLink = styled(Link)`
  color: ${({ theme }) => theme.color.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  overflow-wrap: anywhere;
`;

export const Mono = styled.code`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  overflow-wrap: anywhere;
`;

export const KeyValueGrid = styled.dl`
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  margin: 0;
  padding: ${({ theme }) => theme.spacing.lg};

  dt {
    color: ${({ theme }) => theme.color.textMuted};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }

  dd {
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
  }

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.xs};
    padding: ${({ theme }) => theme.spacing.md};

    dd {
      padding-bottom: ${({ theme }) => theme.spacing.sm};
    }
  }
`;

export const ActionLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  min-height: 40px;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.primary};
  color: #ffffff;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  white-space: nowrap;

  @media (max-width: 560px) {
    white-space: normal;
    text-align: center;
  }
`;

export const SecondaryActionLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  min-height: 38px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.borderStrong};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};
  color: ${({ theme }) => theme.color.text};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  white-space: nowrap;

  @media (max-width: 560px) {
    white-space: normal;
    text-align: center;
  }
`;

export const WorkSurface = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};
`;

export const CompactPath = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};

  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

const WorkflowStageWrap = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};
`;

const WorkflowStageHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};

  strong {
    color: ${({ theme }) => theme.color.text};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const WorkflowStageAction = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const WorkflowStageList = styled.ol`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
  margin: 0;
  padding: 0;
  list-style: none;

  @media (max-width: 920px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const WorkflowStageItem = styled.li`
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceMuted};

  span,
  small {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  span {
    color: ${({ theme }) => theme.color.text};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }

  small {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }

  &[data-state="done"] {
    border-color: ${({ theme }) => theme.color.positive};
    background: ${({ theme }) => theme.color.positiveSoft};
  }

  &[data-state="current"] {
    border-color: ${({ theme }) => theme.color.primary};
    background: ${({ theme }) => theme.color.primarySoft};
  }

  &[data-state="next"] {
    border-color: ${({ theme }) => theme.color.warning};
    background: ${({ theme }) => theme.color.warningSoft};
  }
`;
