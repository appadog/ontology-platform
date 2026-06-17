import { PropsWithChildren } from "react";
import { ThemeProvider } from "styled-components";
import { theme } from "../../shared/styles/theme";

export function PlatformThemeProvider({ children }: PropsWithChildren) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
