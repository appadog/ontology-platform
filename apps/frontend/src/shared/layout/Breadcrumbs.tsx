import { Link } from "react-router-dom";
import styled from "styled-components";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <Trail aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {item.to ? <Link to={item.to}>{item.label}</Link> : <strong>{item.label}</strong>}
        </span>
      ))}
    </Trail>
  );
}

const Trail = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
  max-width: 100%;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};

  span {
    min-width: 0;
    max-width: 100%;
    overflow-wrap: anywhere;
  }

  span:not(:last-child)::after {
    content: "/";
    margin-left: ${({ theme }) => theme.spacing.sm};
    color: ${({ theme }) => theme.color.borderStrong};
  }

  a {
    color: ${({ theme }) => theme.color.primary};
    overflow-wrap: anywhere;
  }

  strong {
    color: ${({ theme }) => theme.color.text};
    overflow-wrap: anywhere;
  }
`;
