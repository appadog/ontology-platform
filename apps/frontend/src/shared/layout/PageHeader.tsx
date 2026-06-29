import { PropsWithChildren } from "react";
import styled from "styled-components";

interface PageHeaderProps extends PropsWithChildren {
  title: string;
  description: string;
  /**
   * Wave 38 (FE6-046): optional small uppercase muted kicker above the H1,
   * matching the canonical Section card eyebrow (breadcrumb-aligned). Purely
   * additive — existing call sites (title/description only) render unchanged.
   */
  eyebrow?: string;
}

export function PageHeader({ title, description, eyebrow, children }: PageHeaderProps) {
  return (
    <Header>
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children && <Actions>{children}</Actions>}
    </Header>
  );
}

// Wave 38 (FE6-046): token-driven. Replaces the previous hardcoded `28px` /
// `8px` / `1.2` with the Wave37 type/spacing/line-height tokens. Visual parity
// is preserved: `fontSize.xl`==28px, `spacing.sm`==8px, `lineHeight.tight`==1.2.
// The flex `gap` and Actions `gap` keep their prior pixel values (no exact token
// rung exists at 18/10px); they are unchanged to avoid any layout shift.
const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  min-width: 0;

  > div:first-child {
    min-width: 0;
  }

  h1 {
    margin: 0;
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
    line-height: ${({ theme }) => theme.typography.lineHeight.tight};
    overflow-wrap: anywhere;
  }

  p {
    max-width: 760px;
    margin: ${({ theme }) => theme.spacing.sm} 0 0;
    color: ${({ theme }) => theme.color.textMuted};
    line-height: 1.55;
    overflow-wrap: anywhere;
  }

  @media (max-width: 760px) {
    flex-direction: column;
  }
`;

// Breadcrumb-aligned eyebrow kicker (matches HanaCard's Eyebrow grammar).
const Eyebrow = styled.span`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  min-width: 0;

  > * {
    max-width: 100%;
  }

  @media (max-width: 760px) {
    justify-content: flex-start;
  }
`;
