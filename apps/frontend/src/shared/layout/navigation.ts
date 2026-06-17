import { Activity, BarChart3, Boxes, Database, FileText, FolderKanban, ListChecks, ScanSearch, Sparkles, LayoutDashboard } from "lucide-react";

export const navigationItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Projects",
    path: "/projects",
    icon: FolderKanban,
  },
  {
    label: "Ontology",
    path: "/ontology",
    icon: Boxes,
  },
  {
    label: "Sources",
    path: "/sources",
    icon: Database,
  },
  {
    label: "Profiling",
    path: "/profile",
    icon: BarChart3,
  },
  {
    label: "Chunks",
    path: "/chunks",
    icon: FileText,
  },
  {
    label: "Extract",
    path: "/extraction/new",
    icon: Sparkles,
  },
  {
    label: "Jobs",
    path: "/extraction-jobs",
    icon: Activity,
  },
  {
    label: "Candidates",
    path: "/candidates",
    icon: ListChecks,
  },
  {
    label: "Evidence",
    path: "/evidence",
    icon: ScanSearch,
  },
];
