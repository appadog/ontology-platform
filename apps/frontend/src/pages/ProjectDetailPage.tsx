import { ChangeEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import { Boxes, Database, Save, Sparkles } from "lucide-react";
import { useProject, useUpdateProject } from "../shared/api/queries";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, HanaInput, HanaSelect, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { MetricCard } from "../shared/ui/platform/MetricCard";
import { formatDateTime } from "../shared/lib/format";
import { ProjectStatus } from "../shared/api/types";

export function ProjectDetailPage() {
  const { projectId = "" } = useParams();
  const { data: project, isLoading, isError, refetch } = useProject(projectId);
  const updateProject = useUpdateProject(projectId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("DRAFT");

  useEffect(() => {
    if (!project) {
      return;
    }

    setName(project.name);
    setDescription(project.description ?? "");
    setStatus(project.status);
  }, [project]);

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
      <Breadcrumbs
        items={[
          { label: "Projects", to: "/projects" },
          { label: project.name },
        ]}
      />
      <PageHeader title={project.name} description={project.description ?? "No description"}>
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
          <CardAction to={`/projects/${project.id}/ontology`}>
            <Boxes aria-hidden="true" />
            Model ontology
          </CardAction>
        </HanaCard>
        <HanaCard title="Sources" description="CSV/Excel/PDF/TXT 원천 데이터의 상태와 preview를 확인합니다.">
          <CardAction to={`/projects/${project.id}/sources`}>
            <Database aria-hidden="true" />
            Manage sources
          </CardAction>
        </HanaCard>
        <HanaCard title="Extraction" description="source와 ontology draft를 묶어 candidate extraction job을 실행합니다.">
          <CardAction to={`/projects/${project.id}/extraction-jobs`}>
            <Sparkles aria-hidden="true" />
            Monitor jobs
          </CardAction>
        </HanaCard>
      </QuickLinks>
      <HanaCard title="Permission state" description="실사용 RBAC 전까지 dev mode notice로 권한 영역을 예약합니다.">
        <PermissionBox>
          <PageState kind="permission" title="Dev mode access" description="현재 사용자는 dev-admin으로 표시되며, 실제 SSO/RBAC는 MVP 1에서 구현하지 않습니다." />
        </PermissionBox>
      </HanaCard>
      <HanaCard title="Project edit" description="ProjectUpdateRequest 경계를 검증하기 위한 MVP 1 최소 수정 폼입니다.">
        <EditGrid>
          <Field>
            <span>Name</span>
            <HanaInput value={name} onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)} />
          </Field>
          <Field>
            <span>Description</span>
            <HanaInput value={description} onChange={(event: ChangeEvent<HTMLInputElement>) => setDescription(event.target.value)} />
          </Field>
          <Field>
            <span>Status</span>
            <HanaSelect value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)}>
              <option value="DRAFT">DRAFT</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </HanaSelect>
          </Field>
          <ButtonSlot>
            <HanaButton
              variant="primary"
              type="button"
              disabled={!name.trim() || updateProject.isPending}
              onClick={() =>
                updateProject.mutate({
                  name: name.trim(),
                  description: description.trim() || null,
                  status,
                })
              }
            >
              <Save aria-hidden="true" />
              {updateProject.isPending ? "Saving" : "Save"}
            </HanaButton>
          </ButtonSlot>
        </EditGrid>
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

const EditGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(220px, 2fr) 180px auto;
  gap: 12px;
  align-items: end;
  padding: 18px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: grid;
  gap: 6px;

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
  }
`;

const ButtonSlot = styled.div`
  display: flex;
  justify-content: flex-end;

  @media (max-width: 980px) {
    justify-content: flex-start;
  }
`;
