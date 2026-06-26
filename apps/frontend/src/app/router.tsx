import { createBrowserRouter, Navigate } from "react-router-dom";
import { App } from "./App";
import {
  AdminConsolePage,
  AdminProjectsPage,
  ProjectAdminApprovalPolicyPage,
  ProjectAdminCredentialsPage,
  ProjectAdminImportExportPage,
  ProjectAdminOperationsPage,
  ProjectAdminPage,
  ProjectAdminRetentionBackupPage,
  ProjectAdminRolesPage,
} from "../pages/AdminPages";
import { CandidateResultsPage } from "../pages/CandidateResultsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DocumentChunkViewerPage } from "../pages/DocumentChunkViewerPage";
import { EvaluationDatasetsPage } from "../pages/EvaluationDatasetsPage";
import { EvidenceViewerPage } from "../pages/EvidenceViewerPage";
import { ExternalApiDocsPage } from "../pages/ExternalApiDocsPage";
import { ExtractionJobCreatePage } from "../pages/ExtractionJobCreatePage";
import { ExtractionJobMonitorPage } from "../pages/ExtractionJobMonitorPage";
import { IntegratedSearchPage } from "../pages/IntegratedSearchPage";
import { LearningInsightsPage } from "../pages/LearningInsightsPage";
import { OntologyModelerPage } from "../pages/OntologyModelerPage";
import { PromptPerformancePage } from "../pages/PromptPerformancePage";
import { PublishedGraphExplorerPage } from "../pages/PublishedGraphExplorerPage";
import { PublishQueuePage } from "../pages/PublishQueuePage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { ProjectListPage } from "../pages/ProjectListPage";
import { QualityDashboardPage } from "../pages/QualityDashboardPage";
import { RagAnswerWorkspacePage } from "../pages/RagAnswerWorkspacePage";
import { ReviewInboxPage } from "../pages/ReviewInboxPage";
import { ReviewWorkbenchPage } from "../pages/ReviewWorkbenchPage";
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
        path: "/admin",
        element: <AdminConsolePage />,
      },
      {
        path: "/admin/projects",
        element: <AdminProjectsPage />,
      },
      {
        path: "/projects/:projectId/admin",
        element: <ProjectAdminPage />,
      },
      {
        path: "/projects/:projectId/admin/roles",
        element: <ProjectAdminRolesPage />,
      },
      {
        path: "/projects/:projectId/admin/credentials",
        element: <ProjectAdminCredentialsPage />,
      },
      {
        path: "/projects/:projectId/admin/policies/approval",
        element: <ProjectAdminApprovalPolicyPage />,
      },
      {
        path: "/projects/:projectId/admin/import-export",
        element: <ProjectAdminImportExportPage />,
      },
      {
        path: "/projects/:projectId/admin/operations",
        element: <ProjectAdminOperationsPage />,
      },
      {
        path: "/projects/:projectId/admin/retention-backup",
        element: <ProjectAdminRetentionBackupPage />,
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
        path: "/projects/:projectId/review",
        element: <ReviewInboxPage />,
      },
      {
        path: "/projects/:projectId/review/:reviewTaskId",
        element: <ReviewWorkbenchPage />,
      },
      {
        path: "/projects/:projectId/publish",
        element: <PublishQueuePage />,
      },
      {
        path: "/projects/:projectId/publish-jobs/:publishJobId",
        element: <PublishQueuePage />,
      },
      {
        path: "/projects/:projectId/published-graph",
        element: <PublishedGraphExplorerPage />,
      },
      {
        path: "/projects/:projectId/quality",
        element: <QualityDashboardPage />,
      },
      {
        path: "/projects/:projectId/search",
        element: <IntegratedSearchPage />,
      },
      {
        path: "/projects/:projectId/rag",
        element: <RagAnswerWorkspacePage />,
      },
      {
        path: "/projects/:projectId/evaluation-datasets",
        element: <EvaluationDatasetsPage />,
      },
      {
        path: "/projects/:projectId/evaluation-datasets/:datasetId",
        element: <EvaluationDatasetsPage />,
      },
      {
        path: "/projects/:projectId/evaluation-dataset-versions/:datasetVersionId",
        element: <EvaluationDatasetsPage />,
      },
      {
        path: "/projects/:projectId/learning-insights",
        element: <LearningInsightsPage />,
      },
      {
        path: "/projects/:projectId/learning-insights/patterns/:patternId",
        element: <LearningInsightsPage />,
      },
      {
        path: "/projects/:projectId/learning-insights/suggestions/:suggestionId",
        element: <LearningInsightsPage />,
      },
      {
        path: "/projects/:projectId/learning-insights/auto-approval-candidates/:autoApprovalPreviewId",
        element: <LearningInsightsPage />,
      },
      {
        path: "/projects/:projectId/prompt-performance",
        element: <PromptPerformancePage />,
      },
      {
        path: "/projects/:projectId/external-api",
        element: <ExternalApiDocsPage />,
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
