import styled from "styled-components";

// Wave 37 (FE6-040): the shared layout primitives. These were previously
// duplicated inside per-MVP helper files (pages/mvp3Shared.tsx, and ad-hoc
// copies in mvp2Shared.tsx). Promoting them here gives ONE layout grammar that
// every screen inherits (P2/P3). Token-driven; no magic numbers.

/** Two-column workbench grid: main content + contextual side panel. */
export const ScreenGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.75fr);
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 1120px) {
    grid-template-columns: 1fr;
  }
`;

/** Vertical stack of sections with consistent rhythm. */
export const Stack = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  min-width: 0;
`;

/** Even two-up split (collapses to single column on narrow widths). */
export const Split = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`;

/** Standard inner padding/gap for content placed inside a HanaCard. */
export const CardBody = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
`;

/** Muted supporting paragraph (outcome-first secondary copy, P7). */
export const Muted = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.textMuted};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
`;

/** Inline wrap of status badges / small chips. */
export const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
`;
