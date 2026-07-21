import { Play, RotateCcw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import { useExtractionJob, useExtractionJobs, useModelRuns, useProject, useRetryExtractionJob, useRunExtractionJob } from "../shared/api/queries";
import type { ExtractionJobStatus } from "../shared/api/types";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { formatDateTime } from "../shared/lib/format";
import { ButtonSlot, DataLink, KeyValueGrid, Mono, SecondaryActionLink, WorkflowStage } from "./mvp2Shared";
import { CompactTable } from "./mvp3Shared";

export function ExtractionJobMonitorPage() {
  const { projectId = "", jobId = "" } = useParams();
  const projectQuery = useProject(projectId);
  const listQuery = useExtractionJobs(projectId);
  const detailQuery = useExtractionJob(jobId);
  const modelRunsQuery = useModelRuns(jobId);
  const activeJob = detailQuery.data;
  const runJob = useRunExtractionJob(jobId, activeJob?.project_id ?? projectId);
  const retryJob = useRetryExtractionJob(jobId, activeJob?.project_id ?? projectId);

  if (jobId) {
    if (detailQuery.isLoading || modelRunsQuery.isLoading) {
      return <PageState kind="loading" title="추출 작업을 불러오는 중" description="상태, 진행률, 실행 기록을 조회하고 있습니다." />;
    }

    if (detailQuery.isError || !activeJob || modelRunsQuery.isError || !modelRunsQuery.data) {
      return (
        <PageState
          kind="error"
          title="추출 작업을 불러오지 못했습니다"
          description="추출 작업 목록에서 다시 선택하거나 새 추출 작업을 만드세요."
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
            { label: projectQuery.data?.name ?? "프로젝트", to: `/projects/${activeJob.project_id}` },
            { label: "Extraction", to: `/projects/${activeJob.project_id}/extraction-jobs` },
            { label: `작업 #${shortId(activeJob.id)}` },
          ]}
        />
        <PageHeader title="추출 작업 모니터" description="실행 상태와 후보 결과로 이어지는 길을 확인합니다.">
          <StatusBadge token={activeJob.status} tone={statusToTone(activeJob.status)} />
          <ButtonSlot>
            <HanaButton type="button" onClick={() => runJob.mutate()} disabled={runJob.isPending || !canRunJob}>
              <Play aria-hidden="true" />
              {runJob.isPending ? "실행 중" : "실행"}
            </HanaButton>
            <HanaButton type="button" onClick={() => retryJob.mutate()} disabled={retryJob.isPending || !canRetryJob}>
              <RotateCcw aria-hidden="true" />
              {retryJob.isPending ? "다시 시도 중" : "다시 시도"}
            </HanaButton>
            <SecondaryActionLink to={`/extraction-jobs/${activeJob.id}/candidates`}>후보 결과 보기</SecondaryActionLink>
          </ButtonSlot>
        </PageHeader>
        <WorkflowStage current="Extraction" action={<SecondaryActionLink to={`/extraction-jobs/${activeJob.id}/candidates`}>후보 결과 보기</SecondaryActionLink>} />
        <JobSummary>
          <div>
            <strong>{activeJob.progress}%</strong>
            <span>{formatJobStatusSummary(activeJob.status)}</span>
          </div>
          <ProgressTrack>
            <ProgressFill style={{ width: `${activeJob.progress}%` }} />
          </ProgressTrack>
          <SummaryFacts>
            <span>Provider {formatProvider(activeJob.provider)}</span>
            <span>{formatFixtureSummary(activeJob.fixture_id)}</span>
            <span>{activeJob.retry_of_job_id ? `재시도 ${shortId(activeJob.retry_of_job_id)}` : "첫 실행"}</span>
            <span>{activeJob.ended_at ? `종료 ${formatDateTime(activeJob.ended_at)}` : `생성 ${formatDateTime(activeJob.created_at)}`}</span>
          </SummaryFacts>
        </JobSummary>
        <HanaCard title="실행 맥락" description={formatJobStatusSummary(activeJob.status)}>
          <KeyValueGrid>
            <dt>ID</dt>
            <dd>
              <Mono>{shortId(activeJob.id)}</Mono>
            </dd>
            <dt>Source</dt>
            <dd>
              <DataLink to={`/projects/${activeJob.project_id}/sources/${activeJob.source_id}`}>{shortId(activeJob.source_id)}</DataLink>
            </dd>
            <dt>Ontology 버전</dt>
            <dd>
              <Mono>{activeJob.ontology_version_id}</Mono>
            </dd>
            <dt>프롬프트 버전</dt>
            <dd>
              <Mono>{activeJob.prompt_version_id}</Mono>
            </dd>
            <dt>Fixture</dt>
            <dd>{activeJob.fixture_id ?? "default"}</dd>
            <dt>Error</dt>
            <dd>{activeJob.error_code ? `${activeJob.error_code}: ${activeJob.error_message ?? ""}` : "-"}</dd>
            <dt>재시도 중복 처리</dt>
            <dd>{activeJob.retry_of_job_id ? `재시도 ${shortId(activeJob.retry_of_job_id)}` : "첫 실행"}</dd>
            <dt>Candidates</dt>
            <dd>
              <DataLink to={`/extraction-jobs/${activeJob.id}/candidates`}>후보 결과 보기</DataLink>
            </dd>
          </KeyValueGrid>
        </HanaCard>
        <HanaCard title="실행 기록" description="실행 기록과 재시도 중복 처리 요약을 확인합니다.">
          {modelRunsQuery.data.length === 0 ? (
            <PageState kind="empty" title="실행 기록이 없습니다" description="실행을 시작하면 기록이 표시됩니다." />
          ) : (
            <CompactTable>
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
                        <StatusBadge token={run.status} tone={statusToTone(run.status)} />
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
            </CompactTable>
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
        description="Projects에서 작업할 Project를 선택한 뒤 추출 작업을 확인하세요."
        actionLabel="Projects로 이동"
        onAction={() => {
          window.location.assign("/projects");
        }}
      />
    );
  }

  if (listQuery.isLoading) {
    return <PageState kind="loading" title="추출 작업 목록을 불러오는 중" description="Project의 추출 작업 목록을 준비하고 있습니다." />;
  }

  if (listQuery.isError || !listQuery.data) {
    return (
      <PageState
        kind="error"
        title="추출 작업 목록을 불러오지 못했습니다"
        description="추출 작업 목록을 다시 불러오세요."
        actionLabel="다시 시도"
        onAction={() => void listQuery.refetch()}
      />
    );
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: projectQuery.data?.name ?? "프로젝트", to: `/projects/${projectId}` },
          { label: "Extraction" },
        ]}
      />
      <PageHeader title="추출 작업" description="추출 작업을 만들고 실행한 뒤 후보 결과로 이동합니다.">
        <ActionLink to={`/projects/${projectId}/extraction/new`}>추출 작업 만들기</ActionLink>
      </PageHeader>
      <WorkflowStage current="Extraction" action={<ActionLink to={`/projects/${projectId}/extraction/new`}>추출 작업 만들기</ActionLink>} />
      {listQuery.data.length === 0 ? (
        <PageState
          kind="empty"
          title="추출 작업이 없습니다"
          description="Source와 Ontology 초안이 준비되면 새 추출 작업을 만들어 Candidate를 생성할 수 있습니다."
          actionLabel="추출 작업 만들기"
          onAction={() => {
            window.location.assign(`/projects/${projectId}/extraction/new`);
          }}
        />
      ) : (
        <HanaCard title="추출 작업 목록">
          <CompactTable>
            <table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Status</th>
                  <th>Provider</th>
                  <th>Source</th>
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
                      <DataLink to={`/extraction-jobs/${job.id}`}>{shortId(job.id)}</DataLink>
                    </td>
                    <td>
                      <StatusBadge token={job.status} tone={statusToTone(job.status)} />
                    </td>
                    <td>{formatProvider(job.provider)}</td>
                    <td>
                      <DataLink to={`/projects/${job.project_id}/sources/${job.source_id}`}>{shortId(job.source_id)}</DataLink>
                    </td>
                    <td>{job.progress}%</td>
                    <td>{job.error_code ?? "-"}</td>
                    <td>{formatDateTime(job.created_at)}</td>
                    <td>
                      <DataLink to={`/extraction-jobs/${job.id}/candidates`}>보기</DataLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CompactTable>
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
      return "일부 Candidate에 Evidence 확인 필요";
    case "invalid_evidence_reference":
      return "끊어진 Evidence 복구 흐름";
    case "missing":
      return "입력 설정 확인 필요";
    default:
      return "성공 흐름";
  }
}

function formatJobStatusSummary(status: ExtractionJobStatus) {
  switch (status) {
    case "SUCCESS":
      return "Candidate 결과를 검토할 수 있습니다.";
    case "PARTIAL_FAILED":
      return "일부 Candidate는 Evidence 또는 validation 확인이 필요합니다.";
    case "FAILED":
      return "실행이 실패했습니다. 입력을 확인한 뒤 retry할 수 있습니다.";
    case "RETRYING":
      return "재시도 작업을 실행할 수 있습니다.";
    case "RUNNING":
    case "QUEUED":
      return "Job이 실행 중입니다.";
    default:
      return "Run을 실행하면 Candidate가 생성됩니다.";
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

  return `생성 ${created} · 재사용 ${reused} · 중복 제외 ${skipped}`;
}

function shortId(value: string) {
  return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

const JobSummary = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};

  div:first-child {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  }

  strong {
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
    line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  }
`;

const SummaryFacts = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
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
