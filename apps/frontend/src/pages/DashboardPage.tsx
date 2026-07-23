import styled from "styled-components";
import { PageHeader } from "../shared/layout/PageHeader";
import { PageContainer } from "../shared/layout/PageContainer";
import { useDashboardSummary, useProjects } from "../shared/api/queries";
import { PageState } from "../shared/ui/platform/PageState";
import { Skeleton, useDelayedVisible } from "../shared/ui/platform/Skeleton";
import { MetricCard } from "../shared/ui/platform/MetricCard";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { formatDateTime } from "../shared/lib/format";
import { HanaCard } from "../shared/ui/hana";
import { ActionLink, SecondaryActionLink } from "./mvp2Shared";

const recentProjectStorageKey = "ontology-platform:recent-project-id";

// D2 (docs/pm/UIUX_REMEDIATION_DECISIONS.md §2): frozen Hero copy.
const heroValuePoints = [
  {
    lead: "후보와 게시를 분리합니다",
    body: "추출 결과는 후보 그래프에 먼저 쌓이고, 검수를 통과한 항목만 게시 그래프로 올라갑니다.",
  },
  {
    lead: "모든 항목에 근거가 남습니다",
    body: "엔티티·관계·속성마다 원천 문서 근거를 연결해 추적과 감사가 가능합니다.",
  },
  {
    lead: "품질과 개선을 함께 추적합니다",
    body: "품질 지표, 벤치마크 비교, 학습 인사이트로 추출·검수 품질을 지속적으로 개선합니다.",
  },
];

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboardSummary();
  const { data: projects = [] } = useProjects();
  // Wave 59 (PM6-039) §4/P7 showcase: only paint a skeleton once the load has
  // actually taken >300ms (NN/g), so fast responses never flash a placeholder.
  const showLoadingSkeleton = useDelayedVisible(300);

  const recentProjectId = typeof window === "undefined" ? "" : window.localStorage.getItem(recentProjectStorageKey) ?? "";
  const recentProject = projects.find((project) => project.id === recentProjectId) ?? projects[0];

  if (isLoading) {
    if (!showLoadingSkeleton) {
      return null;
    }
    return (
      <PageContainer width="default">
        <Skeleton variant="card" count={4} />
        <Skeleton variant="table-row" count={4} columns={2} />
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageState
        kind="error"
        title="대시보드를 불러오지 못했습니다"
        description="작업 현황을 다시 불러오거나 Projects에서 작업 공간을 선택하세요."
        actionLabel="다시 시도"
        onAction={() => void refetch()}
      />
    );
  }

  return (
    <PageContainer width="default">
      <PageHeader title="대시보드" description="오늘 무엇을 검수하고 게시할지 한눈에 파악하고, 바로 다음 작업으로 이동합니다." />
      <Hero aria-label="제품 소개">
        {/* Wave 64 (PM6-042 §2.2): eyebrow text is the existing headline's own
            closing phrase ("온톨로지 운영 플랫폼") — reused verbatim, not new copy. */}
        <HeroEyebrow>온톨로지 운영 플랫폼</HeroEyebrow>
        <HeroHeadline>문서에서 추출한 지식을 검수·게시하고, 품질을 추적하는 온톨로지 운영 플랫폼</HeroHeadline>
        <HeroSubline>
          LLM 추출 결과를 바로 쓰지 않고 후보 단계에서 검증한 뒤 게시해, 근거가 남는 신뢰할 수 있는 지식 그래프를 만듭니다.
        </HeroSubline>
        <ValuePoints>
          {heroValuePoints.map((point) => (
            <ValuePoint key={point.lead}>
              <strong>{point.lead}</strong>
              <span>{point.body}</span>
            </ValuePoint>
          ))}
        </ValuePoints>
        <HeroActions>
          <HeroPrimaryLink to="/projects">프로젝트 시작하기</HeroPrimaryLink>
          {recentProject ? <HeroSecondaryLink to={`/projects/${recentProject.id}`}>최근 프로젝트 열기</HeroSecondaryLink> : null}
        </HeroActions>
      </Hero>
      <MetricGrid>
        <MetricCard label="Active Projects" value={data.active_project_count}>
          운영 중인 작업 공간
        </MetricCard>
        <MetricCard label="Sources" value={data.source_count}>
          업로드된 원천 데이터
        </MetricCard>
        <MetricCard label="Ontology Classes" value={data.ontology_class_count}>
          초안 class 정의
        </MetricCard>
        <MetricCard label="Relations" value={data.ontology_relation_count}>
          초안 relation 정의
        </MetricCard>
      </MetricGrid>
      <HanaCard title="최근 활동" description="최근 프로젝트와 원천 데이터 작업을 확인합니다.">
        <ActivityList>
          {data.recent_activity.length === 0 ? (
            <PageState
              kind="empty"
              title="아직 활동이 없습니다"
              description="프로젝트를 선택하고 source를 업로드하면 최근 작업이 표시됩니다."
              actionLabel="Projects로 이동"
              onAction={() => {
                window.location.assign("/projects");
              }}
            />
          ) : (
            data.recent_activity.map((activity) => (
              <li key={activity.id}>
                <ActivityMain>
                  <span>{activity.label}</span>
                  {activity.status ? <StatusBadge token={activity.status} /> : null}
                </ActivityMain>
                <time dateTime={activity.timestamp}>{formatDateTime(activity.timestamp)}</time>
              </li>
            ))
          )}
        </ActivityList>
      </HanaCard>
      <Notice>
        <span>새 작업 공간이 필요하신가요?</span>
        <SecondaryActionLink to="/projects">프로젝트 만들기 또는 선택</SecondaryActionLink>
      </Notice>
    </PageContainer>
  );
}

// Wave 64 (PM6-042 §2.2): hero becomes a dark gradient card (mock treatment);
// exact copy is unchanged, only the container/CTA visuals change.
const Hero = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: 48px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: linear-gradient(135deg, ${({ theme }) => theme.color.text} 0%, #27272a 100%);
  box-shadow: ${({ theme }) => theme.shadow.md};
  color: #f8fafc;

  @media (max-width: 760px) {
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

const HeroEyebrow = styled.span`
  color: #d4d4d8;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const HeroHeadline = styled.h2`
  margin: 0;
  max-width: 880px;
  color: #ffffff;
  font-size: 38px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;

  @media (max-width: 760px) {
    font-size: 26px;
  }
`;

const HeroSubline = styled.p`
  margin: 0;
  max-width: 880px;
  color: #d4d4d8;
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

const HeroPrimaryLink = styled(ActionLink)`
  background: #ffffff;
  color: ${({ theme }) => theme.color.text};

  &:hover {
    background: #f4f4f5;
  }
`;

const HeroSecondaryLink = styled(SecondaryActionLink)`
  border: 1px solid #52525b;
  background: transparent;
  color: #ffffff;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const ValuePoints = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xs};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

// Wave 64 (PM6-042 §2.2): mock's plain-card treatment — 22px padding, lg
// radius, surface-0 (white) background, subtle border, flat rest shadow.
const ValuePoint = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;
  padding: 22px;
  border: 1px solid ${({ theme }) => theme.color.borderSubtle};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.color.surfaceRaised};
  box-shadow: ${({ theme }) => theme.shadow.card};

  strong {
    color: ${({ theme }) => theme.color.text};
    overflow-wrap: anywhere;
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    line-height: 1.55;
    overflow-wrap: anywhere;
  }
`;

const HeroActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

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
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};
  list-style: none;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({ theme }) => theme.spacing.lg};
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.sm};
    border-bottom: 1px solid ${({ theme }) => theme.color.border};
    border-radius: ${({ theme }) => theme.radius.sm};

    /* Wave 64 (PM6-042 §2.2): mock's .op-row:hover treatment. */
    &:hover {
      background: ${({ theme }) => theme.color.surface};
    }

    &:last-child {
      border-bottom: 0;
    }
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

const ActivityMain = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;

  span {
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
    overflow-wrap: anywhere;
  }
`;

const Notice = styled.aside`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};
  color: ${({ theme }) => theme.color.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;
