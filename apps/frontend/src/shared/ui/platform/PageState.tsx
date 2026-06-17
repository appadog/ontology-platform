import { AlertCircle, FileSearch, Loader2, Lock } from "lucide-react";
import styled, { keyframes } from "styled-components";
import { HanaButton } from "../hana";

type PageStateKind = "loading" | "empty" | "error" | "permission";

interface PageStateProps {
  kind: PageStateKind;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const iconByKind = {
  loading: Loader2,
  empty: FileSearch,
  error: AlertCircle,
  permission: Lock,
};

export function PageState({ kind, title, description, actionLabel, onAction }: PageStateProps) {
  const Icon = iconByKind[kind];

  return (
    <StateBox data-kind={kind}>
      <Icon aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel && onAction && (
        <HanaButton type="button" onClick={onAction}>
          {actionLabel}
        </HanaButton>
      )}
    </StateBox>
  );
}

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const StateBox = styled.div`
  display: grid;
  justify-items: center;
  gap: 10px;
  min-height: 240px;
  padding: 40px 18px;
  border: 1px dashed ${({ theme }) => theme.color.borderStrong};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};
  text-align: center;

  svg {
    width: 32px;
    height: 32px;
    color: ${({ theme }) => theme.color.primary};
  }

  &[data-kind="loading"] svg {
    animation: ${spin} 900ms linear infinite;
  }

  &[data-kind="error"] svg {
    color: ${({ theme }) => theme.color.danger};
  }

  h2 {
    margin: 0;
    font-size: 18px;
  }

  p {
    max-width: 520px;
    margin: 0;
    color: ${({ theme }) => theme.color.textMuted};
    line-height: 1.6;
  }
`;
