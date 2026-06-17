import styled from "styled-components";
import { PageHeader } from "../shared/layout/PageHeader";
import { useDashboardSummary } from "../shared/api/queries";
import { PageState } from "../shared/ui/platform/PageState";
import { MetricCard } from "../shared/ui/platform/MetricCard";
import { formatDateTime } from "../shared/lib/format";
import { HanaBadge, HanaCard } from "../shared/ui/hana";

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboardSummary();

  if (isLoading) {
    return <PageState kind="loading" title="대시보드를 불러오는 중" description="mock fixture를 통해 MVP 1 요약 상태를 준비하고 있습니다." />;
  }

  if (isError || !data) {
    return (
      <PageState
        kind="error"
        title="대시보드를 불러오지 못했습니다"
        description="API 또는 mock boundary 상태를 확인한 뒤 다시 시도할 수 있습니다."
        actionLabel="다시 시도"
        onAction={() => void refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader title="Dashboard" description="프로젝트, 원천 데이터, 온톨로지 draft 상태를 빠르게 확인합니다." />
      <MetricGrid>
        <MetricCard label="Active Projects" value={data.active_project_count}>
          ProjectStatus ACTIVE 기준
        </MetricCard>
        <MetricCard label="Sources" value={data.source_count}>
          업로드된 SourceData
        </MetricCard>
        <MetricCard label="Ontology Classes" value={data.ontology_class_count}>
          그래프 노드 후보
        </MetricCard>
        <MetricCard label="Relations" value={data.ontology_relation_count}>
          방향 edge 정의
        </MetricCard>
      </MetricGrid>
      <HanaCard title="Recent activity" description="실제 audit log는 후속 MVP에서 연결하고, 현재는 fixture 이벤트로 표시합니다.">
        <ActivityList>
          {data.recent_activity.length === 0 ? (
            <PageState kind="empty" title="아직 활동이 없습니다" description="프로젝트와 source 작업이 시작되면 최근 이벤트가 표시됩니다." />
          ) : (
            data.recent_activity.map((activity) => (
              <li key={activity.id}>
                <span>{activity.label}</span>
                <time dateTime={activity.timestamp}>{formatDateTime(activity.timestamp)}</time>
              </li>
            ))
          )}
        </ActivityList>
      </HanaCard>
      <Notice>
        <HanaBadge tone="muted">DEV MODE</HanaBadge>
        <span>Mock fixture API로 로컬 화면 상태를 확인합니다.</span>
      </Notice>
    </>
  );
}

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const ActivityList = styled.ul`
  display: grid;
  gap: 0;
  margin: 0;
  padding: 10px 18px 18px;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 0;
    border-bottom: 1px solid ${({ theme }) => theme.color.border};

    &:last-child {
      border-bottom: 0;
    }
  }

  span {
    font-weight: 700;
  }

  time {
    color: ${({ theme }) => theme.color.textMuted};
    white-space: nowrap;
  }

  @media (max-width: 720px) {
    li {
      align-items: flex-start;
      flex-direction: column;
      gap: 6px;
    }
  }
`;

const Notice = styled.aside`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};
  color: ${({ theme }) => theme.color.textMuted};
  font-weight: 700;
`;
