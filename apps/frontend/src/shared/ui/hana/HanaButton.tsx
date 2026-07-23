import { ButtonHTMLAttributes } from "react";
import { ButtonNoTokens as HanaBaseButton } from "hana-style-component/input";
import styled, { css } from "styled-components";

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

// Wave 65 (PM6-042 follow-up): HanaButton wraps a third-party component with
// its own internal hardcoded colors, disconnected from our theme (flagged as
// a deviation in wave-064 — the mock's accent-pill primary button never
// landed). `buttonStyle`/`type` are real props on the wrapped component (not
// forwarded to the DOM), so they're readable here even though they aren't
// DOM attributes we could target with a CSS selector. `&&` doubles the
// generated class for specificity (0,2,0) to reliably beat the library's own
// single-class rule, without touching the library itself.
const Button = styled(HanaBaseButton)`
  display: inline-flex;
  font-weight: 700;

  ${({ buttonStyle, theme }) =>
    buttonStyle === "primary" &&
    css`
      && {
        background-color: ${theme.color.primary};
        border-color: ${theme.color.primary};
      }

      &&:hover {
        background-color: ${theme.color.primaryHover};
        border-color: ${theme.color.primaryHover};
      }

      &&:active {
        background-color: ${theme.color.primaryActive};
        border-color: ${theme.color.primaryActive};
      }
    `}
`;
