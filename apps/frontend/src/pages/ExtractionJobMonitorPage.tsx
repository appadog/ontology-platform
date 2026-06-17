import { Play, RotateCcw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import { useExtractionJob, useExtractionJobs, useModelRuns, useRetryExtractionJob, useRunExtractionJob } from "../shared/api/queries";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { MetricCard } from "../shared/ui/platform/MetricCard";
import { formatDateTime } from "../shared/lib/format";
import { DataLink, KeyValueGrid, Mono, TableWrap } from "./mvp2Shared";

export function ExtractionJobMonitorPage() {
  const { projectId = "project-corp-knowledge", jobId = "" } = useParams();
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
          description="MVP 2 extraction job detail endpoint 또는 fixture 상태를 확인하세요."
          actionLabel="다시 시도"
          onAction={() => {
            void detailQuery.refetch();
            void modelRunsQuery.refetch();
          }}
        />
      );
    }

    return (
      <>
        <PageHeader title="Extraction Job Monitor" description="MockProvider job lifecycle, progress, failure reason, masked model run metadata를 확인합니다.">
          <HanaBadge tone={statusToTone(activeJob.status)}>{activeJob.status}</HanaBadge>
          <HanaButton type="button" onClick={() => runJob.mutate()} disabled={runJob.isPending || activeJob.status === "SUCCESS"}>
            <Play aria-hidden="true" />
            {runJob.isPending ? "Running" : "Run"}
          </HanaButton>
          <HanaButton type="button" onClick={() => retryJob.mutate()} disabled={retryJob.isPending}>
            <RotateCcw aria-hidden="true" />
            {retryJob.isPending ? "Retrying" : "Retry"}
          </HanaButton>
        </PageHeader>
        <MetricGrid>
          <MetricCard label="Progress" value={`${activeJob.progress}%`}>
            <ProgressTrack>
              <span style={{ width: `${activeJob.progress}%` }} />
            </ProgressTrack>
          </MetricCard>
          <MetricCard label="Provider" value={activeJob.provider}>
            {activeJob.model_name}
          </MetricCard>
          <MetricCard label="Created" value={formatDateTime(activeJob.created_at)}>
            Job lifecycle start
          </MetricCard>
          <MetricCard label="Ended" value={activeJob.ended_at ? formatDateTime(activeJob.ended_at) : "Not ended"}>
            Terminal status timestamp
          </MetricCard>
        </MetricGrid>
        <HanaCard title="Job detail" description="Backend actual API mode 전환 지점: GET/POST /api/v1/extraction-jobs/{job_id}">
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
            <dt>Error</dt>
            <dd>{activeJob.error_code ? `${activeJob.error_code}: ${activeJob.error_message ?? ""}` : "-"}</dd>
            <dt>Candidates</dt>
            <dd>
              <DataLink to={`/extraction-jobs/${activeJob.id}/candidates`}>Open candidate results</DataLink>
            </dd>
          </KeyValueGrid>
        </HanaCard>
        <HanaCard title="Model runs" description="Masked raw request/response metadata only. Full source text or credentials are not shown.">
          {modelRunsQuery.data.length === 0 ? (
            <PageState kind="empty" title="Model run이 없습니다" description="job 실행 후 model run metadata가 표시됩니다." />
          ) : (
            <TableWrap>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Status</th>
                    <th>Tokens</th>
                    <th>Masking</th>
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
                      <td>
                        {run.input_token_count} / {run.output_token_count}
                      </td>
                      <td>{run.masking_version}</td>
                      <td>{formatDateTime(run.started_at)}</td>
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

  if (listQuery.isLoading) {
    return <PageState kind="loading" title="Extraction jobs를 불러오는 중" description="project extraction job 목록을 조회하고 있습니다." />;
  }

  if (listQuery.isError || !listQuery.data) {
    return (
      <PageState
        kind="error"
        title="Extraction jobs를 불러오지 못했습니다"
        description="MVP 2 extraction job list endpoint 또는 fixture 상태를 확인하세요."
        actionLabel="다시 시도"
        onAction={() => void listQuery.refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader title="Extraction Jobs" description="MockProvider extraction job 상태와 candidate result 진입점을 확인합니다.">
        <ActionLink to={`/projects/${projectId}/extraction/new`}>New job</ActionLink>
      </PageHeader>
      {listQuery.data.length === 0 ? (
        <PageState kind="empty" title="Extraction job이 없습니다" description="새 job을 생성하면 monitor 목록에 표시됩니다." />
      ) : (
        <HanaCard title="Job monitor" description="Backend actual API mode 전환 지점: GET /api/v1/projects/{project_id}/extraction-jobs">
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

const ProgressTrack = styled.div`
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: ${({ theme }) => theme.color.surfaceMuted};

  span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: ${({ theme }) => theme.color.primary};
  }
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
