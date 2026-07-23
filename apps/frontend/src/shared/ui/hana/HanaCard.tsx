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
  /**
   * Wave 59 (PM6-039) §4 ADD — corner-radius variant. `md` (default) keeps the
   * exact prior radius (no regression on any existing call site); `lg` opts a
   * card into the new large-panel radius rung (theme.radius.lg).
   */
  radius?: "md" | "lg";
  /**
   * Wave 65 (PM6-042 follow-up) ADD — opt-in whole-card interactivity for
   * catalog/grid cards whose only click target today is a nested button
   * (e.g. Ontology Packs / Connectors catalog cards). Omitted (the default
   * for all ~38 existing call sites): renders exactly as before, a plain
   * `<section>`, zero behavior change. Passed: adds the mock's card-hover
   * treatment (box-shadow lift + border-strong), keyboard access (Enter/Space
   * trigger the same handler), and `role="button"` — the nested button (if
   * any) keeps working unchanged since this only adds a handler on the card
   * itself, it doesn't remove or alter existing click targets.
   */
  onClick?: () => void;
  className?: string;
}

export function HanaCard({ title, description, eyebrow, action, emphasis = "summary", radius = "md", onClick, children, className }: HanaCardProps) {
  const hasHeader = Boolean(title || description || eyebrow || action);

  return (
    <Card
      className={className}
      data-emphasis={emphasis}
      data-radius={radius}
      data-interactive={onClick ? "true" : undefined}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
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

  /* Wave 59 (PM6-039) §4: opt-in large-panel radius rung. */
  &[data-radius="lg"] {
    border-radius: ${({ theme }) => theme.radius.lg};
  }

  /* Wave 65 (PM6-042 follow-up): opt-in whole-card interactivity. */
  &[data-interactive="true"] {
    cursor: pointer;
    transition: box-shadow 120ms ease, border-color 120ms ease;
    text-align: left;
  }

  &[data-interactive="true"]:hover,
  &[data-interactive="true"]:focus-visible {
    box-shadow: ${({ theme }) => theme.shadow.md ?? theme.shadow.soft};
    border-color: ${({ theme }) => theme.color.borderStrong};
  }

  &[data-interactive="true"]:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.primary};
    outline-offset: 2px;
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
