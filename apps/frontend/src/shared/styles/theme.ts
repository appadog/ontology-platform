export const theme = {
  color: {
    // Wave 64 (PM6-042, Claude Design import — docs/pm/DESIGN_DIRECTION_CLAUDE_DESIGN_IMPORT.md
    // §1): value-only shift from blue-tinted neutrals to true zinc neutrals,
    // plus a slightly brighter accent blue. No key renamed/removed.
    surface: "#fafafa",
    surfaceRaised: "#ffffff",
    surfaceMuted: "#f4f4f5",
    border: "#e4e4e7",
    borderStrong: "#a1a1aa",
    text: "#18181b",
    textMuted: "#71717a",
    primary: "#2563eb",
    primarySoft: "#dbeafe",
    // Wave 64 ADD — hover/active steps for the single accent (old primary
    // value conveniently becomes the hover step).
    primaryHover: "#1d4ed8",
    primaryActive: "#1e40af",
    positive: "#15803d",
    positiveSoft: "#dcfce7",
    warning: "#b45309",
    warningSoft: "#fef3c7",
    danger: "#dc2626",
    dangerSoft: "#fee2e2",
    progress: "#0f766e",
    progressSoft: "#ccfbf1",
    // Wave 64 ADD — faintest divider tone (sidebar/topbar borders) and the
    // one new mid-tier neutral surface (skeleton track / border-strong-ish
    // fill), plus the new middle text tone (e.g. topbar user-chip label).
    surface3: "#e4e4e7",
    borderSubtle: "#f4f4f5",
    textSecondary: "#3f3f46",
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
    // Wave 59 (PM6-039) ADD — P1 surface layering (Supabase surface-100~400
    // idea, additive aliases only; no existing key renamed/removed).
    surfaceBase: "#f7f9fb", // alias of `surface`
    surfaceCard: "#ffffff", // alias of `surfaceRaised`
    surfaceOverlay: "#eef2f7", // hover/modal background, alias of `surfaceMuted`
    surfaceAccentPanel: "#eef4ff", // accent-tinted panel, tone-matched to `primary`/`accent`
  },
  shadow: {
    // Wave 37 (FE6-038): keep `soft` for hero/summary; ADD `card` (flat rest
    // shadow for repeated list cards) + `none` so hierarchy P1 can vary weight.
    none: "none",
    // Wave 64: rgba tint moved from blue-tinted (23,32,51) to zinc (24,24,27)
    // to match the new neutral scale.
    soft: "0 14px 34px rgba(24, 24, 27, 0.08)",
    card: "0 1px 2px rgba(24, 24, 27, 0.06)",
    // Wave 64 ADD — mid-tier shadow (mock's shadow-lg) for the dashboard hero.
    md: "0 12px 24px rgba(24, 24, 27, 0.16)",
  },
  radius: {
    // Wave 59 (PM6-039): base-derived scale (shadcn/ui `--radius` idea). `sm`
    // and `md` KEEP their existing px values (no regression); `lg`/`xl` are new
    // rungs derived from `base` (10px * 1.4 / * 1.8) for large panels/modals.
    base: "10px",
    sm: "6px",
    md: "8px",
    lg: "14px",
    xl: "18px",
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
  // Wave 59 (PM6-039) ADD — desktop icon-rail collapse width + per-purpose
  // content-width scale (Supabase idea: forms=small, lists=default, graphs=full).
  sidebarWidthCollapsed: "72px",
  layout: {
    contentWidth: {
      small: "720px",
      default: "1200px",
      full: "none",
    },
  },
};
