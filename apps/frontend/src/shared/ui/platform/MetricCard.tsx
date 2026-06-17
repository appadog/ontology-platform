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
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }

  strong {
    font-size: 30px;
    line-height: 1;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  }
`;
