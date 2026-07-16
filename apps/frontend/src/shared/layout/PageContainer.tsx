import { PropsWithChildren } from "react";
import styled from "styled-components";

// Wave 59 (PM6-039) §4/P4 — content-width primitive (Supabase idea: forms=
// small, lists/tables=default, graphs/code/logs=full). NEW component; nothing
// existing depends on it yet (AppShell's own `Content` max-width is untouched
// so every current page keeps its exact current width until it opts in).
export type PageContainerWidth = "small" | "default" | "full";

interface PageContainerProps extends PropsWithChildren {
  width?: PageContainerWidth;
  className?: string;
}

export function PageContainer({ width = "default", children, className }: PageContainerProps) {
  return (
    <Container className={className} data-width={width}>
      {children}
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.section};
  width: 100%;
  min-width: 0;
  margin: 0 auto;

  &[data-width="small"] {
    max-width: ${({ theme }) => theme.layout.contentWidth.small};
  }

  &[data-width="default"] {
    max-width: ${({ theme }) => theme.layout.contentWidth.default};
  }

  &[data-width="full"] {
    max-width: ${({ theme }) => theme.layout.contentWidth.full};
  }
`;
