import styled from "styled-components";

// Wave 37 (FE6-040): the canonical "Section" module entrypoint. The repeating
// Section card itself is HanaCard (extended in FE6-039 with eyebrow/action/
// emphasis). This file centralizes the page-level section rhythm primitive and
// re-exports the shared layout helpers so screens import one place (P2).

export { ScreenGrid, Stack, Split, CardBody, Muted, BadgeRow } from "./Layout";

/**
 * Vertical page rhythm between top-level sections (P3 whitespace). Uses the new
 * `spacing.section` token instead of per-screen ad-hoc gaps.
 */
export const SectionStack = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.section};
  min-width: 0;
`;
