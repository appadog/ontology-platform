import {
  Boxes,
  Database,
  FolderKanban,
  ListChecks,
  ShieldCheck,
  Sparkles,
  LayoutDashboard,
  ClipboardCheck,
  GaugeCircle,
  UploadCloud,
  Share2,
  Search,
  MessageSquareText,
  ClipboardList,
  Lightbulb,
  BarChart3,
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
  | "sources"
  | "extraction"
  | "candidates"
  | "review"
  | "quality"
  | "publish"
  | "published-graph"
  | "search"
  | "rag"
  | "evaluation"
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
      { section: "sources", label: "Sources", icon: Database, to: (p) => `/projects/${p}/sources` },
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
  if (pathname.includes("/ontology")) return "ontology";
  if (pathname.includes("/sources")) return "sources";
  if (pathname.includes("/extraction-jobs") || pathname.includes("/extraction/new")) return "extraction";
  if (pathname.includes("/quality")) return "quality";
  if (pathname.includes("/review")) return "review";
  if (pathname.includes("/published-graph")) return "published-graph";
  if (pathname.includes("/publish")) return "publish"; // covers /publish and /publish-jobs
  if (pathname.includes("/search")) return "search";
  if (pathname.includes("/rag")) return "rag";
  if (pathname.includes("/evaluation-dataset")) return "evaluation";
  if (pathname.includes("/learning-insights")) return "learning-insights";
  if (pathname.includes("/benchmark-comparison")) return "benchmark";
  if (pathname.includes("/external-api")) return "external-api";

  // Project admin pages live under /projects/:p/admin/* -> highlight global Admin.
  if (pathname.includes("/admin")) return "admin";

  return null;
}
