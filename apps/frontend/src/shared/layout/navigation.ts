import {
  Boxes,
  Cable,
  Database,
  Package,
  FolderKanban,
  ListChecks,
  ShieldCheck,
  Sparkles,
  LayoutDashboard,
  ClipboardCheck,
  GaugeCircle,
  Scale,
  UploadCloud,
  Share2,
  Search,
  MessageSquareText,
  ClipboardList,
  Lightbulb,
  BarChart3,
  Bot,
  PlugZap,
  type LucideIcon,
} from "lucide-react";

// Wave 35 / D1 (ADR 0010): the LNB has two zones.
//  - Global zone: project-independent, always visible.
//  - Project zone: rendered only when a project is selected. Four ordered
//    groups (Build -> Review -> Publish -> Analyze). Labels/order frozen by
//    docs/pm/UIUX_REMEDIATION_DECISIONS.md §1.3.
//
// LNB labels use the short English noun (D3 copy policy); destination page H1s
// are Korean. `section` is the active-state key derived from the route per §1.6.

export type NavSection =
  | "dashboard"
  | "projects"
  | "admin"
  | "ontology"
  | "ontology-packs"
  | "sources"
  | "connectors"
  | "extraction"
  | "candidates"
  | "review"
  | "quality"
  | "governance"
  | "publish"
  | "published-graph"
  | "search"
  | "rag"
  | "evaluation"
  | "copilot"
  | "learning-insights"
  | "benchmark"
  | "external-api";

export interface NavItem {
  /** Active-state key, derived from the route per D1 §1.6. */
  section: NavSection;
  /** English LNB label (D3). Also used as the breadcrumb "섹션" segment. */
  label: string;
  icon: LucideIcon;
  /**
   * Builds the destination path. Global items ignore the projectId; project
   * items require it.
   */
  to: (projectId?: string) => string;
}

export interface NavGroup {
  /** Group heading shown in the project zone (BUILD/REVIEW/PUBLISH/ANALYZE). */
  label: string;
  items: NavItem[];
}

export const globalNavItems: NavItem[] = [
  { section: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: () => "/dashboard" },
  { section: "projects", label: "Projects", icon: FolderKanban, to: () => "/projects" },
  { section: "admin", label: "Admin", icon: ShieldCheck, to: () => "/admin" },
];

export const projectNavGroups: NavGroup[] = [
  {
    label: "Build",
    items: [
      { section: "ontology", label: "Ontology", icon: Boxes, to: (p) => `/projects/${p}/ontology` },
      // MVP6.11 (FE6-100 / ADR 0018 + PM6-036 G12): read-only ontology-pack catalog
      // + dry-run apply-preview. It operates on the project's DRAFT ontology, so its
      // natural neighbor is Ontology — placed immediately after it (before Sources).
      // Single LNB item; pack detail + apply-preview are contextual sub-views.
      { section: "ontology-packs", label: "Ontology Packs", icon: Package, to: (p) => `/projects/${p}/ontology-packs` },
      { section: "sources", label: "Sources", icon: Database, to: (p) => `/projects/${p}/sources` },
      // MVP6.9 (FE6-090 / ADR 0016): read-only connector catalog + dry-run import
      // preview. An ingestion-funnel entry upstream of extraction; its natural
      // neighbor is Sources. Single LNB item; per-kind detail is contextual.
      { section: "connectors", label: "Connectors", icon: Cable, to: (p) => `/projects/${p}/connectors` },
      { section: "extraction", label: "Extraction", icon: Sparkles, to: (p) => `/projects/${p}/extraction-jobs` },
      // Note A: no standalone project candidate list route; point at the job monitor.
      { section: "candidates", label: "Candidates", icon: ListChecks, to: (p) => `/projects/${p}/extraction-jobs` },
    ],
  },
  {
    label: "Review",
    items: [
      { section: "review", label: "Review", icon: ClipboardCheck, to: (p) => `/projects/${p}/review` },
      { section: "quality", label: "Quality", icon: GaugeCircle, to: (p) => `/projects/${p}/quality` },
      // MVP6.5 (FE6-061): governance change-request board is its own persistent
      // work queue under the Review group (ADR 0010). Detail is contextual.
      { section: "governance", label: "Governance", icon: Scale, to: (p) => `/projects/${p}/governance` },
    ],
  },
  {
    label: "Publish",
    items: [
      { section: "publish", label: "Publish", icon: UploadCloud, to: (p) => `/projects/${p}/publish` },
      { section: "published-graph", label: "Published Graph", icon: Share2, to: (p) => `/projects/${p}/published-graph` },
    ],
  },
  {
    label: "Analyze",
    items: [
      // MVP6.8 (FE6-085 / ADR 0015): the advisory-only Copilot is a cross-cutting
      // "what should I do next?" destination. First in Analyze (recommended entry).
      { section: "copilot", label: "Copilot", icon: Bot, to: (p) => `/projects/${p}/copilot` },
      { section: "search", label: "Search", icon: Search, to: (p) => `/projects/${p}/search` },
      { section: "rag", label: "RAG", icon: MessageSquareText, to: (p) => `/projects/${p}/rag` },
      { section: "evaluation", label: "Evaluation", icon: ClipboardList, to: (p) => `/projects/${p}/evaluation-datasets` },
      { section: "learning-insights", label: "Learning Insights", icon: Lightbulb, to: (p) => `/projects/${p}/learning-insights` },
      { section: "benchmark", label: "Benchmark", icon: BarChart3, to: (p) => `/projects/${p}/benchmark-comparisons` },
      { section: "external-api", label: "External API", icon: PlugZap, to: (p) => `/projects/${p}/external-api` },
    ],
  },
];

/**
 * Resolve the active LNB section from a pathname, per D1 §1.6. The more
 * specific Candidates test must win over Extraction, so the order here matters.
 */
export function resolveActiveSection(pathname: string): NavSection | null {
  if (pathname === "/dashboard") return "dashboard";
  if (pathname === "/projects" || /^\/projects\/[^/]+$/.test(pathname)) return "projects";
  if (pathname.startsWith("/admin")) return "admin";

  // Candidates is more specific than Extraction — test it first.
  if (pathname.includes("/candidates") || pathname.includes("/candidate-evidence")) return "candidates";
  // Ontology Packs is more specific than Ontology (its path contains /ontology) —
  // test it first so the two never both resolve.
  if (pathname.includes("/ontology-packs")) return "ontology-packs";
  if (pathname.includes("/ontology")) return "ontology";
  if (pathname.includes("/connectors")) return "connectors";
  if (pathname.includes("/sources")) return "sources";
  if (pathname.includes("/extraction-jobs") || pathname.includes("/extraction/new")) return "extraction";
  if (pathname.includes("/quality")) return "quality";
  // Governance is a distinct segment; resolve it explicitly (no overlap with review).
  if (pathname.includes("/governance")) return "governance";
  if (pathname.includes("/review")) return "review";
  if (pathname.includes("/published-graph")) return "published-graph";
  if (pathname.includes("/publish")) return "publish"; // covers /publish and /publish-jobs
  if (pathname.includes("/search")) return "search";
  if (pathname.includes("/rag")) return "rag";
  if (pathname.includes("/evaluation-dataset")) return "evaluation";
  if (pathname.includes("/copilot")) return "copilot";
  if (pathname.includes("/learning-insights")) return "learning-insights";
  if (pathname.includes("/benchmark-comparison")) return "benchmark";
  if (pathname.includes("/external-api")) return "external-api";

  // Project admin pages live under /projects/:p/admin/* -> highlight global Admin.
  if (pathname.includes("/admin")) return "admin";

  return null;
}
