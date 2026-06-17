import { PropsWithChildren } from "react";
import styled from "styled-components";

interface MetricCardProps extends PropsWithChildren {
  label: string;
  value: string | number;
}

export function MetricCard({ label, value, children }: MetricCardProps) {
  return (
    <Metric>
      <span>{label}</span>
      <strong>{value}</strong>
      {children && <p>{children}</p>}
    </Metric>
  );
}

const Metric = styled.article`
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 18px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 13px;
    font-weight: 800;
  }

  strong {
    font-size: 30px;
    line-height: 1;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 13px;
    line-height: 1.5;
  }
`;
