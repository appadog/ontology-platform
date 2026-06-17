import "styled-components";
import { theme } from "./theme";

type PlatformTheme = typeof theme;

declare module "styled-components" {
  export interface DefaultTheme extends PlatformTheme {}
}
