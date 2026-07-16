import { AlertCircle, FileSearch, Loader2, Lock } from "lucide-react";
import styled, { keyframes } from "styled-components";
import { HanaButton } from "../hana";

type PageStateKind = "loading" | "empty" | "error" | "permission";

// Wave 59 (PM6-039) §4: PatternFly-style size variants — `xs` (inline/inside a
// card), `sm` (table/modal — the EXISTING look, default), `lg` (full page),
// `xl` (onboarding/success). Default stays `sm` so all ~40+ current call sites
// (which omit `size`) render byte-for-byte the same box as before this wave.
type PageStateSize = "xs" | "sm" | "lg" | "xl";

interface PageStateProps {
  kind: PageStateKind;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  size?: PageStateSize;
}

const iconByKind = {
  loading: Loader2,
  empty: FileSearch,
  error: AlertCircle,
  permission: Lock,
};

export function PageState({ kind, title, description, actionLabel, onAction, size = "sm" }: PageStateProps) {
  const Icon = iconByKind[kind];

  return (
    <StateBox data-kind={kind} data-size={size}>
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
  gap: ${({ theme }) => theme.spacing.md};
  min-height: 240px;
  padding: 40px ${({ theme }) => theme.spacing.lg};
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
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  }

  p {
    max-width: 520px;
    margin: 0;
    color: ${({ theme }) => theme.color.textMuted};
    line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  }

  /* Wave 59 (PM6-039) §4 size variants — sm (default) is the unchanged
     original box above; the rest are additive alternates. */
  &[data-size="xs"] {
    min-height: 0;
    gap: ${({ theme }) => theme.spacing.sm};
    padding: ${({ theme }) => theme.spacing.lg};

    svg {
      width: 22px;
      height: 22px;
    }

    h2 {
      font-size: ${({ theme }) => theme.typography.fontSize.md};
    }
  }

  &[data-size="lg"] {
    min-height: 420px;
    padding: 64px ${({ theme }) => theme.spacing.xl};

    svg {
      width: 40px;
      height: 40px;
    }

    h2 {
      font-size: ${({ theme }) => theme.typography.fontSize.lgPlus};
    }
  }

  &[data-size="xl"] {
    min-height: 520px;
    padding: 80px ${({ theme }) => theme.spacing.xxl};

    svg {
      width: 48px;
      height: 48px;
    }

    h2 {
      font-size: ${({ theme }) => theme.typography.fontSize.xl};
    }

    p {
      max-width: 640px;
    }
  }
`;
