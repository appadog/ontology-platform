import { AlertCircle, FileSearch, Loader2, Lock, type LucideIcon } from "lucide-react";
import styled, { keyframes } from "styled-components";
import { HanaButton } from "../hana";

type PageStateKind = "loading" | "empty" | "error" | "permission";

// Wave 59 (PM6-039) §4: PatternFly-style size variants — `xs` (inline/inside a
// card), `sm` (table/modal — the EXISTING look, default), `lg` (full page),
// `xl` (onboarding/success). Default stays `sm` so all ~40+ current call sites
// (which omit `size`) render byte-for-byte the same box as before this wave.
type PageStateSize = "xs" | "sm" | "lg" | "xl";

// Wave 63 (PM6-041 §2.2 / design doc P1): the empty variant may optionally opt
// into a custom icon + a single primary CTA + one optional secondary CTA. All
// new props are optional and additive; every existing call site that omits
// them keeps the exact previous markup (same icon, same single actionLabel/
// onAction button) — see PageState.test.tsx.
interface PageStateSecondaryAction {
  label: string;
  onAction: () => void;
}

interface PageStateProps {
  kind: PageStateKind;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  size?: PageStateSize;
  /** Empty-variant only: override the default icon (e.g. a lucide-react icon already used elsewhere). */
  icon?: LucideIcon;
  /** Empty-variant only: a single optional secondary CTA, rendered after the primary action. Never a second competing primary. */
  secondaryAction?: PageStateSecondaryAction;
}

const iconByKind = {
  loading: Loader2,
  empty: FileSearch,
  error: AlertCircle,
  permission: Lock,
};

export function PageState({ kind, title, description, actionLabel, onAction, size = "sm", icon, secondaryAction }: PageStateProps) {
  const Icon = icon ?? iconByKind[kind];
  const hasPrimary = Boolean(actionLabel && onAction);

  // Back-compat path: when no secondaryAction is passed, render EXACTLY the
  // previous markup (a single HanaButton directly inside StateBox, default
  // variant) so all 20+ existing call sites are byte-for-byte unchanged.
  if (!secondaryAction) {
    return (
      <StateBox data-kind={kind} data-size={size}>
        <Icon aria-hidden="true" />
        <h2>{title}</h2>
        <p>{description}</p>
        {hasPrimary && (
          <HanaButton type="button" onClick={onAction}>
            {actionLabel}
          </HanaButton>
        )}
      </StateBox>
    );
  }

  return (
    <StateBox data-kind={kind} data-size={size}>
      <Icon aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
      <Actions>
        {hasPrimary && (
          <HanaButton variant="primary" type="button" onClick={onAction}>
            {actionLabel}
          </HanaButton>
        )}
        <HanaButton type="button" onClick={secondaryAction.onAction}>
          {secondaryAction.label}
        </HanaButton>
      </Actions>
    </StateBox>
  );
}

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

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
