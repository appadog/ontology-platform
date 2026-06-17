import { PropsWithChildren } from "react";
import styled from "styled-components";

interface HanaCardProps extends PropsWithChildren {
  title?: string;
  description?: string;
}

export function HanaCard({ title, description, children }: HanaCardProps) {
  return (
    <Card>
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
  padding: 18px 18px 0;

  h2 {
    margin: 0;
    font-size: 17px;
    line-height: 1.3;
  }

  p {
    margin: 6px 0 0;
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 14px;
    line-height: 1.5;
  }
`;
