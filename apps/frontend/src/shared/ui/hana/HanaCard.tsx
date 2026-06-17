import { PropsWithChildren } from "react";
import styled from "styled-components";

interface HanaCardProps extends PropsWithChildren {
  title?: string;
  description?: string;
  className?: string;
}

export function HanaCard({ title, description, children, className }: HanaCardProps) {
  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <h2>{title}</h2>}
          {description && <p>{description}</p>}
        </CardHeader>
      )}
      {children}
    </Card>
  );
}

const Card = styled.section`
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};
  box-shadow: ${({ theme }) => theme.shadow.soft};
`;

const CardHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg} 0;

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
    line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  }

  p {
    margin: ${({ theme }) => theme.spacing.sm} 0 0;
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.md};
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  }
`;
