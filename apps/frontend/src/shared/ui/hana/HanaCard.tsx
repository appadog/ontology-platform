import { PropsWithChildren, ReactNode } from "react";
import styled from "styled-components";

// Wave 37 (FE6-039): the canonical "Section + Card" emphasis roles (P1/P2).
// `default` is the repeated list card (flat shadow); `summary` is the ONE
// strong summary/hero card per screen; the state roles tint the surface.
export type HanaCardEmphasis = "default" | "summary" | "info" | "success" | "warning" | "danger";

interface HanaCardProps extends PropsWithChildren {
  title?: string;
  description?: string;
  /** Small uppercase muted kicker above the title (optional). */
  eyebrow?: string;
  /** Single right-aligned header action node (one primary/secondary control). */
  action?: ReactNode;
  /** Visual weight / state surface. Defaults to the previous summary look. */
  emphasis?: HanaCardEmphasis;
  className?: string;
}

export function HanaCard({ title, description, eyebrow, action, emphasis = "summary", children, className }: HanaCardProps) {
  const hasHeader = Boolean(title || description || eyebrow || action);

  return (
    <Card className={className} data-emphasis={emphasis}>
      {hasHeader && (
        <CardHeader>
          <CardHeading>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </CardHeading>
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}
      {children}
    </Card>
  );
}

const Card = styled.section`
  min-width: 0;
  max-width: 100%;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};
  box-shadow: ${({ theme }) => theme.shadow.soft};

  /* default = repeated list/item card: flatter rest shadow (P1 hierarchy). */
  &[data-emphasis="default"] {
    box-shadow: ${({ theme }) => theme.shadow.card};
  }

  &[data-emphasis="info"] {
    background: ${({ theme }) => theme.color.surfaceInfo};
    box-shadow: ${({ theme }) => theme.shadow.card};
  }

  &[data-emphasis="success"] {
    background: ${({ theme }) => theme.color.surfaceSuccess};
    box-shadow: ${({ theme }) => theme.shadow.card};
  }

  &[data-emphasis="warning"] {
    background: ${({ theme }) => theme.color.surfaceWarning};
    box-shadow: ${({ theme }) => theme.shadow.card};
  }

  &[data-emphasis="danger"] {
    background: ${({ theme }) => theme.color.surfaceDanger};
    box-shadow: ${({ theme }) => theme.shadow.card};
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg} 0;
`;

const CardHeading = styled.div`
  min-width: 0;

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
    line-height: ${({ theme }) => theme.typography.lineHeight.tight};
    overflow-wrap: anywhere;
  }

  p {
    margin: ${({ theme }) => theme.spacing.sm} 0 0;
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.md};
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
    overflow-wrap: anywhere;
  }
`;

const Eyebrow = styled.span`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const CardAction = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  > * {
    max-width: 100%;
  }
`;
