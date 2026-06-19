import { Play, RotateCcw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import { useExtractionJob, useExtractionJobs, useModelRuns, useRetryExtractionJob, useRunExtractionJob } from "../shared/api/queries";
import type { ExtractionJobStatus } from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { MetricCard } from "../shared/ui/platform/MetricCard";
import { formatDateTime } from "../shared/lib/format";
import { DataLink, KeyValueGrid, Mono, TableWrap } from "./mvp2Shared";

export function ExtractionJobMonitorPage() {
  const { projectId = "", jobId = "" } = useParams();
  const listQuery = useExtractionJobs(projectId);
  const detailQuery = useExtractionJob(jobId);
  const modelRunsQuery = useModelRuns(jobId);
  const activeJob = detailQuery.data;
  const runJob = useRunExtractionJob(jobId, activeJob?.project_id ?? projectId);
  const retryJob = useRetryExtractionJob(jobId, activeJob?.project_id ?? projectId);

  if (jobId) {
    if (detailQuery.isLoading || modelRunsQuery.isLoading) {
      return <PageState kind="loading" title="Extraction job을 불러오는 중" description="job status, progress, model run metadata를 조회하고 있습니다." />;
    }

    if (detailQuery.isError || !activeJob || modelRunsQuery.isError || !modelRunsQuery.data) {
      return (
        <PageState
          kind="error"
          title="Extraction job을 불러오지 못했습니다"
          description="job 목록에서 다시 선택하거나 새 job을 생성하세요."
          actionLabel="다시 시도"
          onAction={() => {
            void detailQuery.refetch();
            void modelRunsQuery.refetch();
          }}
        />
      );
    }

    const canRunJob = activeJob.status === "PENDING" || activeJob.status === "QUEUED" || activeJob.status === "RETRYING";
    const canRetryJob = activeJob.status === "FAILED" || activeJob.status === "PARTIAL_FAILED";

    return (
      <>
        <Breadcrumbs
          items={[
            { label: "Projects", to: "/projects" },
            { label: "Extraction", to: `/projects/${activeJob.project_id}/extraction-jobs` },
            { label: activeJob.id },
          ]}
        />
        <PageHeader title="Extraction Job Monitor" description="Job 실행 상태와 candidate 결과로 이어지는 길을 확인합니다.">
          <HanaBadge tone={statusToTone(activeJob.status)}>{activeJob.status}</HanaBadge>
          <HanaButton type="button" onClick={() => runJob.mutate()} disabled={runJob.isPending || !canRunJob}>
            <Play aria-hidden="true" />
            {runJob.isPending ? "Running" : "Run"}
          </HanaButton>
          <HanaButton type="button" onClick={() => retryJob.mutate()} disabled={retryJob.isPending || !canRetryJob}>
            <RotateCcw aria-hidden="true" />
            {retryJob.isPending ? "Retrying" : "Retry"}
          </HanaButton>
        </PageHeader>
        <MetricGrid>
          <MetricCard label="Progress" value={`${activeJob.progress}%`}>
            <ProgressTrack>
              <ProgressFill style={{ width: `${activeJob.progress}%` }} />
            </ProgressTrack>
          </MetricCard>
          <MetricCard label="Provider" value={formatProvider(activeJob.provider)}>
            {activeJob.model_name}
          </MetricCard>
          <MetricCard label="Fixture" value={activeJob.fixture_id ?? "default"}>
            {formatFixtureSummary(activeJob.fixture_id)}
          </MetricCard>
          <MetricCard label="Created" value={formatDateTime(activeJob.created_at)}>
            Job lifecycle start
          </MetricCard>
          <MetricCard label="Ended" value={activeJob.ended_at ? formatDateTime(activeJob.ended_at) : "Not ended"}>
            Terminal status timestamp
          </MetricCard>
          <MetricCard label="Retry Chain" value={activeJob.retry_of_job_id ? "Retry" : "Root"}>
            {activeJob.retry_of_job_id ? `Parent ${activeJob.retry_of_job_id}` : "Retry results reuse matching duplicates."}
          </MetricCard>
        </MetricGrid>
        <HanaCard title="Job detail" description={formatJobStatusSummary(activeJob.status)}>
          <KeyValueGrid>
            <dt>ID</dt>
            <dd>
              <Mono>{activeJob.id}</Mono>
            </dd>
            <dt>Source</dt>
            <dd>
              <Mono>{activeJob.source_id}</Mono>
            </dd>
            <dt>Ontology version</dt>
            <dd>
              <Mono>{activeJob.ontology_version_id}</Mono>
            </dd>
            <dt>Prompt version</dt>
            <dd>
              <Mono>{activeJob.prompt_version_id}</Mono>
            </dd>
            <dt>Fixture</dt>
            <dd>{activeJob.fixture_id ?? "default"}</dd>
            <dt>Error</dt>
            <dd>{activeJob.error_code ? `${activeJob.error_code}: ${activeJob.error_message ?? ""}` : "-"}</dd>
            <dt>Retry dedupe</dt>
            <dd>{activeJob.retry_of_job_id ? `Retry of ${activeJob.retry_of_job_id}` : "Root job"}</dd>
            <dt>Candidates</dt>
            <dd>
              <DataLink to={`/extraction-jobs/${activeJob.id}/candidates`}>Open candidate results</DataLink>
            </dd>
          </KeyValueGrid>
        </HanaCard>
        <HanaCard title="Model runs" description="Masked run metadata and retry reuse summary.">
          {modelRunsQuery.data.length === 0 ? (
            <PageState kind="empty" title="Model run이 없습니다" description="Run을 실행하면 model run 기록이 표시됩니다." />
          ) : (
            <TableWrap>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Status</th>
                    <th>Provider</th>
                    <th>Tokens</th>
                    <th>Dedupe</th>
                    <th>Started</th>
                  </tr>
                </thead>
                <tbody>
                  {modelRunsQuery.data.map((run) => (
                    <tr key={run.id}>
                      <td>
                        <Mono>{run.id}</Mono>
                      </td>
                      <td>
                        <HanaBadge tone={statusToTone(run.status)}>{run.status}</HanaBadge>
                      </td>
                      <td>{formatProvider(run.provider)}</td>
                      <td>
                        {run.input_token_count} / {run.output_token_count}
                      </td>
                      <td>{formatDedupeSummary(run.raw_response)}</td>
                      <td>{run.started_at ? formatDateTime(run.started_at) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </HanaCard>
      </>
    );
  }

  if (!projectId) {
    return (
      <PageState
        kind="empty"
        title="Project context가 필요합니다"
        description="Projects에서 작업할 project를 선택한 뒤 extraction jobs를 확인하세요."
        actionLabel="Go to projects"
        onAction={() => {
          window.location.assign("/projects");
        }}
      />
    );
  }

  if (listQuery.isLoading) {
    return <PageState kind="loading" title="Extraction jobs를 불러오는 중" description="project의 job 목록을 준비하고 있습니다." />;
  }

  if (listQuery.isError || !listQuery.data) {
    return (
      <PageState
        kind="error"
        title="Extraction jobs를 불러오지 못했습니다"
        description="job 목록을 다시 불러오세요."
        actionLabel="다시 시도"
        onAction={() => void listQuery.refetch()}
      />
    );
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Projects", to: "/projects" },
          { label: "Extraction" },
        ]}
      />
      <PageHeader title="Extraction Jobs" description="Job을 만들고 실행한 뒤 candidate 결과로 이동합니다.">
        <ActionLink to={`/projects/${projectId}/extraction/new`}>New job</ActionLink>
      </PageHeader>
      {listQuery.data.length === 0 ? (
        <PageState kind="empty" title="Extraction job이 없습니다" description="새 job을 생성하면 monitor 목록에 표시됩니다." />
      ) : (
        <HanaCard title="Job monitor">
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Provider</th>
                  <th>Progress</th>
                  <th>Error</th>
                  <th>Created</th>
                  <th>Candidates</th>
                </tr>
              </thead>
              <tbody>
                {listQuery.data.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <DataLink to={`/extraction-jobs/${job.id}`}>{job.id}</DataLink>
                    </td>
                    <td>
                      <HanaBadge tone={statusToTone(job.status)}>{job.status}</HanaBadge>
                    </td>
                    <td>{job.provider}</td>
                    <td>{job.progress}%</td>
                    <td>{job.error_code ?? "-"}</td>
                    <td>{formatDateTime(job.created_at)}</td>
                    <td>
                      <DataLink to={`/extraction-jobs/${job.id}/candidates`}>Open</DataLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </HanaCard>
      )}
    </>
  );
}

function formatProvider(provider: string) {
  return provider === "mock" ? "MockProvider" : provider;
}

function formatFixtureSummary(fixtureId?: string | null) {
  switch (fixtureId ?? "default") {
    case "partial_invalid":
      return "Partial failure with missing evidence";
    case "invalid_evidence_reference":
      return "Broken evidence fallback";
    case "missing":
      return "Fixture-not-found failure";
    default:
      return "Success path";
  }
}

function formatJobStatusSummary(status: ExtractionJobStatus) {
  switch (status) {
    case "SUCCESS":
      return "Candidate results are ready.";
    case "PARTIAL_FAILED":
      return "Some candidates need evidence or validation attention.";
    case "FAILED":
      return "The run failed; retry is available when the fixture or input is corrected.";
    case "RETRYING":
      return "Retry job is ready to run.";
    case "RUNNING":
    case "QUEUED":
      return "The job is in progress.";
    default:
      return "Run the job to generate candidates.";
  }
}

function formatDedupeSummary(rawResponse: Record<string, unknown>) {
  const dedupe = rawResponse.dedupe;

  if (!dedupe || typeof dedupe !== "object") {
    return "-";
  }

  const summary = dedupe as Record<string, unknown>;
  const created = Number(summary.created_candidates ?? 0);
  const reused = Number(summary.reused_candidates ?? summary.reused_evidence ?? 0);
  const skipped = Number(summary.skipped_duplicates ?? summary.skipped_duplicate_candidates ?? 0);

  return `created ${created} · reused ${reused} · skipped ${skipped}`;
}

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const ProgressTrack = styled.span`
  display: block;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: ${({ theme }) => theme.color.surfaceMuted};
`;

const ProgressFill = styled.span`
  display: block;
  height: 100%;
  border-radius: inherit;
  background: ${({ theme }) => theme.color.primary};
`;

const ActionLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.primary};
  color: #ffffff;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;
