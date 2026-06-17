import { ButtonHTMLAttributes } from "react";
import { ButtonNoTokens as HanaBaseButton } from "hana-style-component/input";
import styled from "styled-components";

type HanaButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface HanaButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  variant?: HanaButtonVariant;
}

const variantMap = {
  primary: {
    type: "fill",
    buttonStyle: "primary",
  },
  secondary: {
    type: "line",
    buttonStyle: "secondary",
  },
  ghost: {
    type: "ghost",
    buttonStyle: "secondary",
  },
  danger: {
    type: "line",
    buttonStyle: "negative",
  },
} as const;

export function HanaButton({ variant = "secondary", type: _htmlType, ...props }: HanaButtonProps) {
  const hanaVariant = variantMap[variant];

  return <Button type={hanaVariant.type} buttonStyle={hanaVariant.buttonStyle} size="medium" {...props} />;
}

const Button = styled(HanaBaseButton)`
  display: inline-flex;
  font-weight: 700;
`;
