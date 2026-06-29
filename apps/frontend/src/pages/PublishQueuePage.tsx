import { useMemo, useState } from "react";
import styled from "styled-components";
import { Play, Send } from "lucide-react";
import { useParams } from "react-router-dom";
import type { PublishEligibilityReasonCode } from "../shared/api/types";
import {
  useCreatePublishJob,
  useProject,
  usePublishCandidates,
  usePublishJobs,
  useRunPublishJob,
} from "../shared/api/queries";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { formatDateTime } from "../shared/lib/format";
import {
  BadgeRow,
  CardBody,
  CompactTable,
  Mvp3ActionLink,
  Mvp3PrimaryLink,
  Mvp3Workflow,
  Muted,
  ReasonBadges,
  ScreenGrid,
  Stack,
  toPublishJobView,
} from "./mvp3Shared";

export function PublishQueuePage() {
  const { projectId = "", publishJobId = "" } = useParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const projectQuery = useProject(projectId);
  const candidatesQuery = usePublishCandidates(projectId);
  const jobsQuery = usePublishJobs(projectId);
  const createPublishJob = useCreatePublishJob(projectId);
  const runPublishJob = useRunPublishJob(projectId);
  const selectedJob = useMemo(
    () => jobsQuery.data?.find((job) => job.id === publishJobId) ?? jobsQuery.data?.[0],
    [jobsQuery.data, publishJobId],
  );
  const eligibleIds = useMemo(
    () => candidatesQuery.data?.filter((candidate) => candidate.eligible).map((candidate) => candidate.candidate_id) ?? [],
    [candidatesQuery.data],
  );

  if (projectQuery.isLoading || candidatesQuery.isLoading || jobsQuery.isLoading) {
    return <PageState kind="loading" title="Publish queue를 불러오는 중" description="검수 완료 후보와 publish job 상태를 조회하고 있습니다." />;
  }

  if (projectQuery.isError || candidatesQuery.isError || jobsQuery.isError || !projectQuery.data || !candidatesQuery.data || !jobsQuery.data) {
    return (
      <PageState
        kind="error"
        title="Publish queue를 불러오지 못했습니다"
        description="검수 상태와 publish job 목록을 다시 조회하세요."
        actionLabel="다시 시도"
        onAction={() => {
          void projectQuery.refetch();
          void candidatesQuery.refetch();
          void jobsQuery.refetch();
        }}
      />
    );
  }

  const candidates = candidatesQuery.data;
  const eligibleCandidates = candidates.filter((candidate) => candidate.eligible);
  const selectedCandidates = candidates.filter((candidate) => selectedIds.includes(candidate.candidate_id));

  function toggleCandidate(candidateId: string) {
    setSelectedIds((current) => (current.includes(candidateId) ? current.filter((id) => id !== candidateId) : [...current, candidateId]));
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: projectQuery.data.name, to: `/projects/${projectId}` },
          { label: "Publish" },
        ]}
      />
      <PageHeader title="게시 대기열" description="Only eligible approved or modified candidates move into the published graph snapshot.">
        <Mvp3ActionLink to={`/projects/${projectId}/published-graph`}>Published graph</Mvp3ActionLink>
      </PageHeader>
      <Mvp3Workflow current="Publish queue" action={<Mvp3ActionLink to={`/projects/${projectId}/review`}>Review inbox</Mvp3ActionLink>} />
      {eligibleCandidates.length === 0 ? (
        <PageState kind="empty" title="No eligible candidates" description="Review decisions and eligibility reasons must clear before a publish job can run." />
      ) : null}
      <ScreenGrid>
        <Stack>
          <HanaCard title="Candidate eligibility" description="Frozen reason codes come from the publish eligibility contract.">
            <QueueActions>
              <HanaButton type="button" variant="secondary" onClick={() => setSelectedIds(eligibleIds)}>
                Select eligible
              </HanaButton>
              <HanaButton
                type="button"
                variant="primary"
                disabled={selectedIds.length === 0 || createPublishJob.isPending}
                onClick={() => createPublishJob.mutate(selectedCandidates)}
              >
                <Send aria-hidden="true" />
                Prepare publish
              </HanaButton>
              <Muted>{selectedIds.length} selected</Muted>
            </QueueActions>
            <CompactTable>
              <table>
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Candidate</th>
                    <th>Review</th>
                    <th>Validation</th>
                    <th>Evidence</th>
                    <th>Eligibility</th>
                    <th>Context</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr key={candidate.candidate_id}>
                      <td>
                        <input
                          aria-label={`Select ${candidate.candidate_kind} ${candidate.candidate_id}`}
                          type="checkbox"
                          checked={selectedIds.includes(candidate.candidate_id)}
                          disabled={!candidate.eligible}
                          onChange={() => toggleCandidate(candidate.candidate_id)}
                        />
                      </td>
                      <td>
                        <CandidateCell>
                          <strong>{candidate.candidate_id}</strong>
                          <span>{candidate.candidate_kind}</span>
                          <HanaBadge tone={candidate.eligible ? "success" : "warning"}>{candidate.eligible ? "ELIGIBLE" : "BLOCKED"}</HanaBadge>
                        </CandidateCell>
                      </td>
                      <td>
                        <BadgeRow>
                          <StatusBadge token={candidate.review_status} tone={statusToTone(candidate.review_status)} />
                          <StatusBadge token={candidate.publish_status} tone={statusToTone(candidate.publish_status)} />
                        </BadgeRow>
                      </td>
                      <td>
                        <StatusBadge token={candidate.validation_status} tone={statusToTone(candidate.validation_status)} />
                      </td>
                      <td>
                        <BadgeRow>
                          <StatusBadge token={candidate.has_evidence ? "PRESENT" : "MISSING"} tone={candidate.has_evidence ? "success" : "danger"} />
                          <span>{candidate.has_warning_reason ? "warning reason" : "no warning reason"}</span>
                        </BadgeRow>
                      </td>
                      <td>
                        <ReasonBadges reasons={candidate.reasons} />
                      </td>
                      <td>
                        <CandidateCell>
                          <span>{candidate.eligible ? "Ready for publish job" : "Blocked by eligibility policy"}</span>
                          <span>{candidate.has_warning_reason ? "Reviewer warning reason present" : "No reviewer warning reason"}</span>
                        </CandidateCell>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CompactTable>
          </HanaCard>
        </Stack>
        <Stack>
          <HanaCard title="Publish job">
            {!selectedJob ? (
              <PageState kind="empty" title="No publish job yet" description="Select eligible candidates to create the first job." />
            ) : (
              <CardBody>
                {(() => {
                  const jobView = toPublishJobView(selectedJob);

                  return (
                    <>
                      <JobProgress>
                        <strong>{selectedJob.status}</strong>
                        <ProgressTrack>
                          <span style={{ width: `${jobView.progress}%` }} />
                        </ProgressTrack>
                      </JobProgress>
                      <JobStats>
                        <Metric>
                          <strong>{jobView.selectedCandidateCount}</strong>
                          <span>Selected</span>
                        </Metric>
                        <Metric>
                          <strong>{selectedJob.published_entity_count}</strong>
                          <span>Entities</span>
                        </Metric>
                        <Metric>
                          <strong>{selectedJob.published_relation_count}</strong>
                          <span>Relations</span>
                        </Metric>
                        <Metric>
                          <strong>{selectedJob.skipped_count}</strong>
                          <span>Skipped</span>
                        </Metric>
                      </JobStats>
                      <BadgeRow>
                        <StatusBadge
                          token={selectedJob.status}
                          tone={selectedJob.status === "SUCCESS" ? "success" : selectedJob.status === "FAILED" ? "danger" : "progress"}
                        />
                        <span>{formatDateTime(selectedJob.created_at)}</span>
                      </BadgeRow>
                      <HanaButton
                        type="button"
                        variant="primary"
                        disabled={runPublishJob.isPending || selectedJob.status === "SUCCESS"}
                        onClick={() => runPublishJob.mutate(selectedJob.id)}
                      >
                        <Play aria-hidden="true" />
                        Run job
                      </HanaButton>
                      {jobView.resultVersionId ? (
                        <Mvp3PrimaryLink to={`/projects/${projectId}/published-graph`}>Open snapshot {jobView.resultVersionId}</Mvp3PrimaryLink>
                      ) : null}
                    </>
                  );
                })()}
              </CardBody>
            )}
          </HanaCard>
          <HanaCard title="Reason summary">
            <CardBody>
              {selectedJob ? (
                Object.entries(toPublishJobView(selectedJob).eligibilitySummary)
                  .filter(([, count]) => count > 0)
                  .map(([reason, count]) => (
                    <SummaryRow key={reason}>
                      <ReasonBadges reasons={[reason as PublishEligibilityReasonCode]} />
                      <strong>{count}</strong>
                    </SummaryRow>
                  ))
              ) : (
                <Muted>No summary yet.</Muted>
              )}
            </CardBody>
          </HanaCard>
        </Stack>
      </ScreenGrid>
    </>
  );
}

const QueueActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};
`;

const CandidateCell = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;

  span {
    color: ${({ theme }) => theme.color.textMuted};
    overflow-wrap: anywhere;
  }
`;

const JobProgress = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ProgressTrack = styled.div`
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: ${({ theme }) => theme.color.surfaceMuted};

  span {
    display: block;
    height: 100%;
    background: ${({ theme }) => theme.color.primary};
  }
`;

const JobStats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};

  @media (max-width: 680px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Metric = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};

  strong {
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
  }
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
`;
