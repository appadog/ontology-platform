import { Boxes, Database, FolderKanban, ListChecks, ShieldCheck, Sparkles, LayoutDashboard } from "lucide-react";

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
    label: "Extraction",
    path: "/extraction",
    icon: Sparkles,
  },
  {
    label: "Candidates",
    path: "/candidates",
    icon: ListChecks,
  },
  {
    label: "Admin",
    path: "/admin",
    icon: ShieldCheck,
  },
];
