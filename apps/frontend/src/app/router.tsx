import { createBrowserRouter, Navigate } from "react-router-dom";
import { App } from "./App";
import { CandidateResultsPage } from "../pages/CandidateResultsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DocumentChunkViewerPage } from "../pages/DocumentChunkViewerPage";
import { EvidenceViewerPage } from "../pages/EvidenceViewerPage";
import { ExtractionJobCreatePage } from "../pages/ExtractionJobCreatePage";
import { ExtractionJobMonitorPage } from "../pages/ExtractionJobMonitorPage";
import { OntologyModelerPage } from "../pages/OntologyModelerPage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { ProjectListPage } from "../pages/ProjectListPage";
import { SourceDetailPage } from "../pages/SourceDetailPage";
import { SourceManagerPage } from "../pages/SourceManagerPage";
import { SourceProfilingPage } from "../pages/SourceProfilingPage";

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
        path: "/projects/:projectId/sources/:sourceId/profile",
        element: <SourceProfilingPage />,
      },
      {
        path: "/projects/:projectId/sources/:sourceId/chunks",
        element: <DocumentChunkViewerPage />,
      },
      {
        path: "/projects/:projectId/extraction/new",
        element: <ExtractionJobCreatePage />,
      },
      {
        path: "/projects/:projectId/extraction-jobs",
        element: <ExtractionJobMonitorPage />,
      },
      {
        path: "/extraction-jobs/:jobId",
        element: <ExtractionJobMonitorPage />,
      },
      {
        path: "/extraction-jobs/:jobId/candidates",
        element: <CandidateResultsPage />,
      },
      {
        path: "/candidate-evidence/:evidenceId",
        element: <EvidenceViewerPage />,
      },
      {
        path: "/ontology",
        element: <Navigate to="/projects" replace />,
      },
      {
        path: "/sources",
        element: <Navigate to="/projects" replace />,
      },
      {
        path: "/sources/:sourceId",
        element: <SourceDetailPage />,
      },
      {
        path: "/extraction",
        element: <Navigate to="/projects" replace />,
      },
      {
        path: "/candidates",
        element: <Navigate to="/projects" replace />,
      },
    ],
  },
]);
