import { PropsWithChildren } from "react";
import { QueryProvider } from "./QueryProvider";
import { PlatformThemeProvider } from "./ThemeProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <PlatformThemeProvider>{children}</PlatformThemeProvider>
    </QueryProvider>
  );
}
