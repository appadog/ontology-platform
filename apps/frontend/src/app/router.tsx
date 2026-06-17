import { createBrowserRouter, Navigate } from "react-router-dom";
import { App } from "./App";
import { DashboardPage } from "../pages/DashboardPage";
import { OntologyModelerPage } from "../pages/OntologyModelerPage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { ProjectListPage } from "../pages/ProjectListPage";
import { SourceDetailPage } from "../pages/SourceDetailPage";
import { SourceManagerPage } from "../pages/SourceManagerPage";

const defaultProjectId = "project-corp-knowledge";

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
        path: "/projects/:projectId/ontology",
        element: <OntologyModelerPage />,
      },
      {
        path: "/projects/:projectId/sources",
        element: <SourceManagerPage />,
      },
      {
        path: "/projects/:projectId/sources/:sourceId",
        element: <SourceDetailPage />,
      },
      {
        path: "/ontology",
        element: <Navigate to={`/projects/${defaultProjectId}/ontology`} replace />,
      },
      {
        path: "/sources",
        element: <Navigate to={`/projects/${defaultProjectId}/sources`} replace />,
      },
      {
        path: "/sources/:sourceId",
        element: <SourceDetailPage />,
      },
    ],
  },
]);
