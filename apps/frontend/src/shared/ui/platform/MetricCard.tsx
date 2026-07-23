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

// Wave 64 (PM6-042 §2.2): mock's flat metric-card style — 24px padding, lg
// radius, subtle border, larger/heavier value type.
const Metric = styled.article`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.color.borderSubtle};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.color.surfaceRaised};
  box-shadow: ${({ theme }) => theme.shadow.card};

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }

  strong {
    font-size: 36px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  }
`;
