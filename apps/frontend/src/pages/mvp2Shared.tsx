import { Link } from "react-router-dom";
import styled from "styled-components";

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export const TableWrap = styled.div`
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 14px 18px;
    border-bottom: 1px solid ${({ theme }) => theme.color.border};
    text-align: left;
    vertical-align: top;
  }

  th {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    text-transform: uppercase;
  }

  tr:last-child td {
    border-bottom: 0;
  }
`;

export const PanelGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  align-items: end;
  padding: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

export const Field = styled.label`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    text-transform: uppercase;
  }
`;

export const ButtonSlot = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const MutedText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.textMuted};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
`;

export const InlineList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const DataLink = styled(Link)`
  color: ${({ theme }) => theme.color.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

export const Mono = styled.code`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 12px;
`;

export const KeyValueGrid = styled.dl`
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  margin: 0;
  padding: ${({ theme }) => theme.spacing.lg};

  dt {
    color: ${({ theme }) => theme.color.textMuted};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }

  dd {
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
  }
`;
