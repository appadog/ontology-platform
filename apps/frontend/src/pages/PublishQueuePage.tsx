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
import { HanaBadge, HanaButton, HanaCard, HanaInput, statusToTone } from "../shared/ui/hana";
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
  const [webhookUrl, setWebhookUrl] = useState("");
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
    return <PageState kind="loading" title="게시 큐를 불러오는 중" description="검수 완료 후보와 게시 작업 상태를 조회하고 있습니다." />;
  }

  if (projectQuery.isError || candidatesQuery.isError || jobsQuery.isError || !projectQuery.data || !candidatesQuery.data || !jobsQuery.data) {
    return (
      <PageState
        kind="error"
        title="게시 큐를 불러오지 못했습니다"
        description="검수 상태와 게시 작업 목록을 다시 조회하세요."
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
          { label: "게시" },
        ]}
      />
      <PageHeader title="게시 대기열" description="승인되었거나 수정 승인된, 게시 자격을 갖춘 후보만 게시 그래프 스냅샷으로 반영됩니다.">
        <Mvp3ActionLink to={`/projects/${projectId}/published-graph`}>게시 그래프</Mvp3ActionLink>
      </PageHeader>
      <Mvp3Workflow current="Publish queue" action={<Mvp3ActionLink to={`/projects/${projectId}/review`}>검수 인박스</Mvp3ActionLink>} />
      {eligibleCandidates.length === 0 ? (
        <PageState kind="empty" title="게시 가능한 후보가 없습니다" description="게시 작업을 실행하려면 먼저 검수 결정과 게시 자격 사유를 해소해야 합니다." />
      ) : null}
      <ScreenGrid>
        <Stack>
          <HanaCard title="후보 게시 자격" description="게시 자격 사유 코드는 게시 자격 계약에서 고정되어 옵니다.">
            <QueueActions>
              <HanaButton type="button" variant="secondary" onClick={() => setSelectedIds(eligibleIds)}>
                게시 가능 항목 선택
              </HanaButton>
              <HanaButton
                type="button"
                variant="primary"
                disabled={selectedIds.length === 0 || createPublishJob.isPending}
                onClick={() => createPublishJob.mutate({ candidates: selectedCandidates, notifyWebhookUrl: webhookUrl.trim() || null })}
              >
                <Send aria-hidden="true" />
                게시 준비
              </HanaButton>
              <Muted>{selectedIds.length}개 선택됨</Muted>
            </QueueActions>
            <QueueActions>
              <HanaInput
                value={webhookUrl}
                onChange={(event) => setWebhookUrl(event.target.value)}
                placeholder="게시 완료 알림 웹훅 URL (선택)"
                aria-label="게시 완료 알림 웹훅 URL"
              />
            </QueueActions>
            <CompactTable $stickyHeader $maxHeight="640px">
              <table>
                <thead>
                  <tr>
                    <th>선택</th>
                    <th>후보</th>
                    <th>검수</th>
                    <th>검증</th>
                    <th>근거</th>
                    <th>게시 자격</th>
                    <th>맥락</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr key={candidate.candidate_id}>
                      <td>
                        <input
                          aria-label={`${candidate.candidate_kind} ${candidate.candidate_id} 선택`}
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
                          <HanaBadge tone={candidate.eligible ? "success" : "warning"}>{candidate.eligible ? "ELIGIBLE · 게시 가능" : "BLOCKED · 차단됨"}</HanaBadge>
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
                          <span>{candidate.has_warning_reason ? "경고 사유 있음" : "경고 사유 없음"}</span>
                        </BadgeRow>
                      </td>
                      <td>
                        <ReasonBadges reasons={candidate.reasons} />
                      </td>
                      <td>
                        <CandidateCell>
                          <span>{candidate.eligible ? "게시 작업 준비 완료" : "게시 자격 정책에 의해 차단됨"}</span>
                          <span>{candidate.has_warning_reason ? "검수자 경고 사유 있음" : "검수자 경고 사유 없음"}</span>
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
          <HanaCard title="게시 작업">
            {!selectedJob ? (
              <PageState kind="empty" title="아직 게시 작업이 없습니다" description="게시 가능한 후보를 선택해 첫 작업을 만드세요." />
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
                          <span>선택됨</span>
                        </Metric>
                        <Metric>
                          <strong>{selectedJob.published_entity_count}</strong>
                          <span>엔티티</span>
                        </Metric>
                        <Metric>
                          <strong>{selectedJob.published_relation_count}</strong>
                          <span>관계</span>
                        </Metric>
                        <Metric>
                          <strong>{selectedJob.skipped_count}</strong>
                          <span>건너뜀</span>
                        </Metric>
                      </JobStats>
                      <BadgeRow>
                        <StatusBadge
                          token={selectedJob.status}
                          tone={selectedJob.status === "SUCCESS" ? "success" : selectedJob.status === "FAILED" ? "danger" : "progress"}
                        />
                        <span>{formatDateTime(selectedJob.created_at)}</span>
                      </BadgeRow>
                      {selectedJob.notify_webhook_url ? (
                        <BadgeRow>
                          <HanaBadge tone={selectedJob.webhook_delivery_status === "DELIVERED" ? "success" : selectedJob.webhook_delivery_status === "FAILED" ? "danger" : "progress"}>
                            {selectedJob.webhook_delivery_status === "DELIVERED"
                              ? "웹훅 알림 전송됨"
                              : selectedJob.webhook_delivery_status === "FAILED"
                                ? "웹훅 알림 전송 실패"
                                : "웹훅 알림 대기 중"}
                          </HanaBadge>
                          <span>{selectedJob.notify_webhook_url}</span>
                        </BadgeRow>
                      ) : null}
                      <HanaButton
                        type="button"
                        variant="primary"
                        disabled={runPublishJob.isPending || selectedJob.status === "SUCCESS"}
                        onClick={() => runPublishJob.mutate(selectedJob.id)}
                      >
                        <Play aria-hidden="true" />
                        작업 실행
                      </HanaButton>
                      {jobView.resultVersionId ? (
                        <Mvp3PrimaryLink to={`/projects/${projectId}/published-graph`}>스냅샷 열기 {jobView.resultVersionId}</Mvp3PrimaryLink>
                      ) : null}
                    </>
                  );
                })()}
              </CardBody>
            )}
          </HanaCard>
          <HanaCard title="사유 요약">
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
                <Muted>아직 요약이 없습니다.</Muted>
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
