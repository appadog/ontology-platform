import { Boxes, Database, FolderKanban, LayoutDashboard } from "lucide-react";

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
];
