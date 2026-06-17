import { createBrowserRouter, Navigate } from "react-router-dom";
import { App } from "./App";
import { DashboardPage } from "../pages/DashboardPage";
import { OntologyModelerPage } from "../pages/OntologyModelerPage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { ProjectListPage } from "../pages/ProjectListPage";
import { SourceDetailPage } from "../pages/SourceDetailPage";
import { SourceManagerPage } from "../pages/SourceManagerPage";

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      {
        path: "/projects",
        element: <ProjectListPage />,
      },
      {
        path: "/projects/:projectId",
        element: <ProjectDetailPage />,
      },
      {
        path: "/ontology",
        element: <OntologyModelerPage />,
      },
      {
        path: "/sources",
        element: <SourceManagerPage />,
      },
      {
        path: "/sources/:sourceId",
        element: <SourceDetailPage />,
      },
    ],
  },
]);
