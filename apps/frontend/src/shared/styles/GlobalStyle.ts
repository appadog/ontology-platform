import { createGlobalStyle } from "styled-components";
// Wave 59 (PM6-039) §3: self-hosted Inter (no external/Google Fonts CDN — must
// build offline/AWS per docs/DEPLOYMENT.md). Weights used across the app:
// regular(400)/semibold(600)/medium(700, existing token name)/bold(800).
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-width: 320px;
    min-height: 100vh;
    color: ${({ theme }) => theme.color.text};
    background: ${({ theme }) => theme.color.surface};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    letter-spacing: 0;
  }

  /* Wave 59 (PM6-039) §3: heading hierarchy via weight + tighter tracking
     (Inter Display approximation) instead of a second font file. */
  h1, h2, h3 {
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  #root {
    min-height: 100vh;
  }
`;
