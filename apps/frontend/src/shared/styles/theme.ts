export const theme = {
  color: {
    surface: "#f7f9fb",
    surfaceRaised: "#ffffff",
    surfaceMuted: "#eef2f7",
    border: "#d8e0ea",
    borderStrong: "#aab7c8",
    text: "#172033",
    textMuted: "#65748b",
    primary: "#1d4ed8",
    primarySoft: "#dbeafe",
    positive: "#047857",
    positiveSoft: "#d1fae5",
    warning: "#b45309",
    warningSoft: "#fef3c7",
    danger: "#b91c1c",
    dangerSoft: "#fee2e2",
    progress: "#0f766e",
    progressSoft: "#ccfbf1",
    draft: "#475569",
    draftSoft: "#e2e8f0",
    graphNode: "#1f5f8b",
    graphRelation: "#7c3aed",
    // Wave 37 (FE6-038) ADD — semantic surface roles + the single accent alias.
    // Additive only; the existing blue `primary` stays the ONLY accent (P5).
    accent: "#1d4ed8", // alias of primary — the only accent
    accentSoft: "#dbeafe", // alias of primarySoft
    surfaceInfo: "#ecfeff", // read-only / preview-only panels
    surfaceSuccess: "#ecfdf5", // pass / accepted surfaces
    surfaceWarning: "#fffbeb", // stale / preview / regressed surfaces
    surfaceDanger: "#fff1f2", // destructive / high-risk surfaces
    surfaceSelected: "#fff7ed", // selected row / card background
    surfaceStrong: "#0f172a", // ONE dark summary / primary CTA area per screen
    textOnStrong: "#f8fafc", // text on surfaceStrong
  },
  shadow: {
    // Wave 37 (FE6-038): keep `soft` for hero/summary; ADD `card` (flat rest
    // shadow for repeated list cards) + `none` so hierarchy P1 can vary weight.
    none: "none",
    soft: "0 14px 34px rgba(23, 32, 51, 0.08)",
    card: "0 1px 2px rgba(23, 32, 51, 0.06)",
  },
  radius: {
    sm: "6px",
    md: "8px",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    xxl: "32px",
    // Wave 37 (FE6-038) ADD — page-rhythm tokens (P3 whitespace). `section`
    // == xl (between-section gap); `page` for page top/side breathing.
    section: "24px",
    page: "40px",
  },
  typography: {
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    fontSize: {
      xs: "12px",
      sm: "13px",
      md: "14px",
      lg: "18px",
      // Wave 37 (FE6-038): NON-BREAKING ADDITIVE token decision (commander).
      // The design doc's primary spec renames xl(28)->xxl and adds xl=22, but
      // that breaks ~7 existing `fontSize.xl` consumers (they expect 28px). We
      // take the doc's documented fallback: ADD `lgPlus`=22px (the missing
      // 18->28 rung for sub-hero / large section titles) and KEEP `xl`=28px.
      lgPlus: "22px",
      xl: "28px",
    },
    fontWeight: {
      // Wave 37 (FE6-038): NON-BREAKING ADDITIVE. The doc proposes re-mapping
      // medium 700->500 and bold 800->700, but that silently restyles ~65
      // existing consumers. We instead ADD the genuinely-missing `semibold`=600
      // rung (section headers / emphasized labels / primary action) and KEEP
      // medium=700 / bold=800 so no current screen visually regresses.
      regular: 400,
      semibold: 600,
      medium: 700,
      bold: 800,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.6,
    },
  },
  sidebarWidth: "248px",
};
