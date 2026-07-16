import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";

// Wave 59 (PM6-039) §4/P7 — layout-mimicking skeleton loader (NN/g guidance:
// prefer a skeleton that mirrors the real content shape over a generic
// spinner). NEW component; nothing existing depends on it yet, so it is
// purely additive.

type SkeletonVariant = "table-row" | "card";

interface SkeletonProps {
  variant: SkeletonVariant;
  /** Number of repeated rows/cards to render. Defaults to 3. */
  count?: number;
  /** Number of columns to mimic for `table-row`. Defaults to 4. */
  columns?: number;
  className?: string;
}

export function Skeleton({ variant, count = 3, columns = 4, className }: SkeletonProps) {
  const items = Array.from({ length: count }, (_, index) => index);

  if (variant === "card") {
    return (
      <CardSkeletonGrid className={className} aria-hidden="true" data-testid="skeleton-card">
        {items.map((index) => (
          <CardSkeletonBox key={index}>
            <SkeletonBlock $height="14px" $width="40%" />
            <SkeletonBlock $height="20px" $width="70%" />
            <SkeletonBlock $height="12px" $width="90%" />
            <SkeletonBlock $height="12px" $width="60%" />
          </CardSkeletonBox>
        ))}
      </CardSkeletonGrid>
    );
  }

  return (
    <TableSkeletonBox className={className} aria-hidden="true" data-testid="skeleton-table-row">
      {items.map((index) => (
        <TableSkeletonRow key={index} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }, (_, col) => (
            <SkeletonBlock key={col} $height="14px" $width={col === 0 ? "80%" : "60%"} />
          ))}
        </TableSkeletonRow>
      ))}
    </TableSkeletonBox>
  );
}

/**
 * Wave 59 (PM6-039) §4/P7 — NN/g threshold: skeletons should not flash for
 * sub-300ms loads. Consumers wrap their loading branch with
 * `useDelayedVisible(300)` and only render `Skeleton` once it returns true.
 */
export function useDelayedVisible(delayMs = 300): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  return visible;
}

const shimmer = keyframes`
  0% {
    background-position: -120% 0;
  }
  100% {
    background-position: 120% 0;
  }
`;

const SkeletonBlock = styled.div<{ $height: string; $width: string }>`
  width: ${({ $width }) => $width};
  height: ${({ $height }) => $height};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.color.surfaceMuted} 25%,
    ${({ theme }) => theme.color.surfaceOverlay} 50%,
    ${({ theme }) => theme.color.surfaceMuted} 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;
`;

const TableSkeletonBox = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`;

const TableSkeletonRow = styled.div`
  display: grid;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md} 0;
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
`;

const CardSkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const CardSkeletonBox = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};
`;
