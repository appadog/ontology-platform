import { ComponentType, lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { App } from "./App";

// Wave 65 (PM6-042 follow-up): route-level code-splitting. The single main
// JS chunk had grown past Vite's 650kB warning (all ~50 pages bundled
// together); `lazy()` + this per-named-export helper defers every page to
// its own chunk, fetched on first navigation. Each call site below still
// writes a literal `import("../pages/X")` (required for bundlers to
// statically split it) — the helper only picks the named export out of the
// resolved module. Files with multiple named exports (AdminPages.tsx) share
// one chunk across their `lazy()` calls since it's the same import specifier.
function lazyNamed<M extends Record<string, ComponentType>, K extends keyof M>(
  loader: () => Promise<M>,
  name: K,
) {
  return lazy(() => loader().then((module) => ({ default: module[name] })));
}

const AdminConsolePage = lazyNamed(() => import("../pages/AdminPages"), "AdminConsolePage");
const AdminProjectsPage = lazyNamed(() => import("../pages/AdminPages"), "AdminProjectsPage");
const ProjectAdminApprovalPolicyPage = lazyNamed(() => import("../pages/AdminPages"), "ProjectAdminApprovalPolicyPage");
const ProjectAdminCredentialsPage = lazyNamed(() => import("../pages/AdminPages"), "ProjectAdminCredentialsPage");
const ProjectAdminImportExportPage = lazyNamed(() => import("../pages/AdminPages"), "ProjectAdminImportExportPage");
const ProjectAdminOperationsPage = lazyNamed(() => import("../pages/AdminPages"), "ProjectAdminOperationsPage");
const ProjectAdminPage = lazyNamed(() => import("../pages/AdminPages"), "ProjectAdminPage");
const ProjectAdminRetentionBackupPage = lazyNamed(() => import("../pages/AdminPages"), "ProjectAdminRetentionBackupPage");
const ProjectAdminRolesPage = lazyNamed(() => import("../pages/AdminPages"), "ProjectAdminRolesPage");
const BenchmarkComparisonPage = lazyNamed(() => import("../pages/BenchmarkComparisonPage"), "BenchmarkComparisonPage");
const ConnectorsPage = lazyNamed(() => import("../pages/ConnectorsPage"), "ConnectorsPage");
const CopilotPage = lazyNamed(() => import("../pages/CopilotPage"), "CopilotPage");
const CandidateResultsPage = lazyNamed(() => import("../pages/CandidateResultsPage"), "CandidateResultsPage");
const DashboardPage = lazyNamed(() => import("../pages/DashboardPage"), "DashboardPage");
const DocumentChunkViewerPage = lazyNamed(() => import("../pages/DocumentChunkViewerPage"), "DocumentChunkViewerPage");
const EvaluationDatasetsPage = lazyNamed(() => import("../pages/EvaluationDatasetsPage"), "EvaluationDatasetsPage");
const EvidenceViewerPage = lazyNamed(() => import("../pages/EvidenceViewerPage"), "EvidenceViewerPage");
const ExternalApiDocsPage = lazyNamed(() => import("../pages/ExternalApiDocsPage"), "ExternalApiDocsPage");
const ExtractionJobCreatePage = lazyNamed(() => import("../pages/ExtractionJobCreatePage"), "ExtractionJobCreatePage");
const GoldSetManagerPage = lazyNamed(() => import("../pages/GoldSetManagerPage"), "GoldSetManagerPage");
const GovernanceBoardPage = lazyNamed(() => import("../pages/GovernanceBoardPage"), "GovernanceBoardPage");
const GovernanceProposePage = lazyNamed(() => import("../pages/GovernanceProposePage"), "GovernanceProposePage");
const GovernanceDetailPage = lazyNamed(() => import("../pages/GovernanceDetailPage"), "GovernanceDetailPage");
const ExtractionJobMonitorPage = lazyNamed(() => import("../pages/ExtractionJobMonitorPage"), "ExtractionJobMonitorPage");
const IntegratedSearchPage = lazyNamed(() => import("../pages/IntegratedSearchPage"), "IntegratedSearchPage");
const LearningInsightsPage = lazyNamed(() => import("../pages/LearningInsightsPage"), "LearningInsightsPage");
const OntologyModelerPage = lazyNamed(() => import("../pages/OntologyModelerPage"), "OntologyModelerPage");
const OntologyPacksPage = lazyNamed(() => import("../pages/OntologyPacksPage"), "OntologyPacksPage");
const PromptPerformancePage = lazyNamed(() => import("../pages/PromptPerformancePage"), "PromptPerformancePage");
const PublishedGraphExplorerPage = lazyNamed(() => import("../pages/PublishedGraphExplorerPage"), "PublishedGraphExplorerPage");
const PublishQueuePage = lazyNamed(() => import("../pages/PublishQueuePage"), "PublishQueuePage");
const ProjectDetailPage = lazyNamed(() => import("../pages/ProjectDetailPage"), "ProjectDetailPage");
const ProjectListPage = lazyNamed(() => import("../pages/ProjectListPage"), "ProjectListPage");
const QualityDashboardPage = lazyNamed(() => import("../pages/QualityDashboardPage"), "QualityDashboardPage");
const RagAnswerWorkspacePage = lazyNamed(() => import("../pages/RagAnswerWorkspacePage"), "RagAnswerWorkspacePage");
const ReviewInboxPage = lazyNamed(() => import("../pages/ReviewInboxPage"), "ReviewInboxPage");
const ReviewWorkbenchPage = lazyNamed(() => import("../pages/ReviewWorkbenchPage"), "ReviewWorkbenchPage");
const SourceDetailPage = lazyNamed(() => import("../pages/SourceDetailPage"), "SourceDetailPage");
const SourceManagerPage = lazyNamed(() => import("../pages/SourceManagerPage"), "SourceManagerPage");
const SourceProfilingPage = lazyNamed(() => import("../pages/SourceProfilingPage"), "SourceProfilingPage");
const TenantContextPage = lazyNamed(() => import("../pages/TenantContextPage"), "TenantContextPage");

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
        // MVP6.10 (FE6-096 / ADR 0010 contextual-detail carve-out): the read-only
        // Tenant Context view is a CONTEXTUAL route driven by the client-side active
        // tenant (no id in the path), reached ONLY from the app-shell header
        // indicator — never an LNB item. The two LNB zones are unchanged.
        path: "/tenant",
        element: <TenantContextPage />,
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
        path: "/projects/:projectId/governance",
        element: <GovernanceBoardPage />,
      },
      {
        path: "/projects/:projectId/governance/new",
        element: <GovernanceProposePage />,
      },
      {
        path: "/projects/:projectId/governance/:changeRequestId",
        element: <GovernanceDetailPage />,
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
        path: "/projects/:projectId/evaluation-datasets/:datasetId/gold-set",
        element: <GoldSetManagerPage />,
      },
      {
        path: "/projects/:projectId/evaluation-dataset-versions/:datasetVersionId",
        element: <EvaluationDatasetsPage />,
      },
      {
        // MVP6.11 (FE6-100 / ADR 0018): read-only ontology-pack catalog. Pack
        // detail + apply-preview are contextual sub-views (bounded pack id set),
        // never new LNB items.
        path: "/projects/:projectId/ontology-packs",
        element: <OntologyPacksPage />,
      },
      {
        path: "/projects/:projectId/ontology-packs/:packId",
        element: <OntologyPacksPage />,
      },
      {
        path: "/projects/:projectId/connectors",
        element: <ConnectorsPage />,
      },
      {
        path: "/projects/:projectId/connectors/:connectorKind",
        element: <ConnectorsPage />,
      },
      {
        path: "/projects/:projectId/copilot",
        element: <CopilotPage />,
      },
      {
        path: "/projects/:projectId/copilot/suggestions/:suggestionId",
        element: <CopilotPage />,
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
        path: "/projects/:projectId/benchmark-comparisons",
        element: <BenchmarkComparisonPage />,
      },
      {
        path: "/projects/:projectId/benchmark-comparisons/:comparisonId",
        element: <BenchmarkComparisonPage />,
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
