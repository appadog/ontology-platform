import { InputHTMLAttributes } from "react";
import styled from "styled-components";

export function HanaInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <Input {...props} />;
}

const Input = styled.input`
  width: 100%;
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};
  color: ${({ theme }) => theme.color.text};

  &::placeholder {
    color: ${({ theme }) => theme.color.textMuted};
  }
`;
