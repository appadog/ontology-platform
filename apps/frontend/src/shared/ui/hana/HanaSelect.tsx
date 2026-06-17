import { SelectHTMLAttributes } from "react";
import styled from "styled-components";

export function HanaSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <Select {...props} />;
}

const Select = styled.select`
  min-height: 38px;
  padding: 0 36px 0 12px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};
  color: ${({ theme }) => theme.color.text};
`;
