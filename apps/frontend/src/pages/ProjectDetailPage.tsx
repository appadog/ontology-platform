import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import { Boxes, Database } from "lucide-react";
import { useProject } from "../shared/api/queries";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { MetricCard } from "../shared/ui/platform/MetricCard";
import { formatDateTime } from "../shared/lib/format";

export function ProjectDetailPage() {
  const { projectId = "" } = useParams();
  const { data: project, isLoading, isError, refetch } = useProject(projectId);

  if (isLoading) {
    return <PageState kind="loading" title="프로젝트 상세를 불러오는 중" description="ProjectSummary DTO를 조회하고 있습니다." />;
  }

  if (isError || !project) {
    return (
      <PageState
        kind="error"
        title="프로젝트를 찾지 못했습니다"
        description="선택한 프로젝트 ID가 mock fixture 또는 API 응답에 없습니다."
        actionLabel="다시 시도"
        onAction={() => void refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader title={project.name} description={project.description}>
        <HanaBadge tone={statusToTone(project.status)}>{project.status}</HanaBadge>
      </PageHeader>
      <MetricGrid>
        <MetricCard label="Sources" value={project.source_count}>
          SourceData 목록으로 연결됩니다.
        </MetricCard>
        <MetricCard label="Ontology Versions" value={project.ontology_version_count}>
          DRAFT/PUBLISHED 버전 흐름
        </MetricCard>
        <MetricCard label="Updated" value={formatDateTime(project.updated_at)}>
          마지막 mock 변경 시각
        </MetricCard>
      </MetricGrid>
      <QuickLinks>
        <HanaCard title="Ontology Modeler" description="클래스와 관계를 그래프에서 보고 초안 구조를 다듬습니다.">
          <CardAction to="/ontology">
            <Boxes aria-hidden="true" />
            Model ontology
          </CardAction>
        </HanaCard>
        <HanaCard title="Sources" description="CSV/Excel/PDF/TXT 원천 데이터의 상태와 preview를 확인합니다.">
          <CardAction to="/sources">
            <Database aria-hidden="true" />
            Manage sources
          </CardAction>
        </HanaCard>
      </QuickLinks>
      <HanaCard title="Permission state" description="실사용 RBAC 전까지 dev mode notice로 권한 영역을 예약합니다.">
        <PermissionBox>
          <PageState kind="permission" title="Dev mode access" description="현재 사용자는 dev-admin으로 표시되며, 실제 SSO/RBAC는 MVP 1에서 구현하지 않습니다." />
        </PermissionBox>
      </HanaCard>
    </>
  );
}

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 880px) {
    grid-template-columns: 1fr;
  }
`;

const QuickLinks = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 880px) {
    grid-template-columns: 1fr;
  }
`;

const CardAction = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 18px;
  min-height: 40px;
  color: ${({ theme }) => theme.color.primary};
  font-weight: 800;

  svg {
    width: 20px;
    height: 20px;
  }
`;

const PermissionBox = styled.div`
  padding: 18px;
`;
