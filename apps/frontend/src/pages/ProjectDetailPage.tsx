import { ChangeEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import {
  BarChart3,
  Boxes,
  Code2,
  Database,
  FlaskConical,
  GitBranch,
  Lightbulb,
  ListChecks,
  MessageSquareQuote,
  Rocket,
  Save,
  Search,
  Sparkles,
} from "lucide-react";
import { useProject, useUpdateProject } from "../shared/api/queries";
import { Breadcrumbs } from "../shared/layout/Breadcrumbs";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, HanaInput, HanaSelect, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { MetricCard } from "../shared/ui/platform/MetricCard";
import { formatDateTime } from "../shared/lib/format";
import { ProjectStatus } from "../shared/api/types";
import { WorkflowStage, WorkSurface } from "./mvp2Shared";
import { ProjectOnboardingChecklist } from "./ProjectOnboardingChecklist";

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
    return <PageState kind="loading" title="프로젝트 상세를 불러오는 중" description="작업 공간의 상태와 최근 리소스를 준비하고 있습니다." />;
  }

  if (isError || !project) {
    return (
      <PageState
        kind="error"
        title="프로젝트를 찾지 못했습니다"
        description="프로젝트 목록에서 다시 선택하거나 새 프로젝트를 생성하세요."
        actionLabel="다시 시도"
        onAction={() => void refetch()}
      />
    );
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: project.name },
        ]}
      />
      <PageHeader title={project.name} description={project.description ?? "No description"}>
        <StatusBadge token={project.status} tone={statusToTone(project.status)} />
      </PageHeader>
      <MetricGrid>
        <MetricCard label="Sources" value={project.source_count}>
          SourceData 목록으로 연결됩니다.
        </MetricCard>
        <MetricCard label="Ontology Versions" value={project.ontology_version_count}>
          DRAFT/PUBLISHED 버전 흐름
        </MetricCard>
        <MetricCard label="Updated" value={formatDateTime(project.updated_at)}>
          마지막 변경 시각
        </MetricCard>
      </MetricGrid>
      <ProjectOnboardingChecklist projectId={project.id} sourceCount={project.source_count} />
      <WorkSurface>
        <WorkflowStage current="Project" action={<StageAction to={`/projects/${project.id}/ontology`}>Ontology 열기</StageAction>} />
        <NextActionRow>
          <span>Ontology 구조를 먼저 잡고 Source를 준비한 뒤 Extraction으로 Candidate를 생성합니다.</span>
          <CardAction to={`/projects/${project.id}/ontology`}>
            <Boxes aria-hidden="true" />
            Ontology 열기
          </CardAction>
        </NextActionRow>
      </WorkSurface>
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
        <HanaCard title="Extraction" description="Source와 Ontology 초안을 묶어 후보 추출 작업을 실행합니다.">
          <CardAction to={`/projects/${project.id}/extraction-jobs`}>
            <Sparkles aria-hidden="true" />
            추출 작업 보기
          </CardAction>
        </HanaCard>
        <HanaCard title="Review Inbox" description="검수 대상, validation, confidence, evidence 상태를 우선순위로 정렬합니다.">
          <CardAction to={`/projects/${project.id}/review`}>
            <ListChecks aria-hidden="true" />
            Review inbox
          </CardAction>
        </HanaCard>
        <HanaCard title="Publish Queue" description="승인된 후보의 eligibility reason과 publish job 결과를 확인합니다.">
          <CardAction to={`/projects/${project.id}/publish`}>
            <Rocket aria-hidden="true" />
            Publish queue
          </CardAction>
        </HanaCard>
        <HanaCard title="Published Graph" description="현재 게시 snapshot의 published facts와 lineage를 탐색합니다.">
          <CardAction to={`/projects/${project.id}/published-graph`}>
            <GitBranch aria-hidden="true" />
            Published graph
          </CardAction>
        </HanaCard>
        <HanaCard title="Quality Dashboard" description="Validation, review, publish metric을 action drilldown과 함께 봅니다.">
          <CardAction to={`/projects/${project.id}/quality`}>
            <BarChart3 aria-hidden="true" />
            Quality dashboard
          </CardAction>
        </HanaCard>
        <HanaCard title="Search" description="게시 그래프, 원천, 근거, lineage 결과를 프로젝트 안에서 묶어 봅니다.">
          <CardAction to={`/projects/${project.id}/search`}>
            <Search aria-hidden="true" />
            Integrated search
          </CardAction>
        </HanaCard>
        <HanaCard title="RAG Answers" description="게시된 사실과 인용 근거에 기반한 답변 작업 공간입니다.">
          <CardAction to={`/projects/${project.id}/rag`}>
            <MessageSquareQuote aria-hidden="true" />
            RAG workspace
          </CardAction>
        </HanaCard>
        <HanaCard title="Evaluation" description="Golden set, 평가 데이터셋, prompt/model 성능을 확인합니다.">
          <CardAction to={`/projects/${project.id}/evaluation-datasets`}>
            <FlaskConical aria-hidden="true" />
            Evaluation sets
          </CardAction>
        </HanaCard>
        <HanaCard title="Learning Insights" description="검수·품질·평가 근거에서 나온 프롬프트 개선 추천을 검토하고 audit-only로 결정합니다.">
          <CardAction to={`/projects/${project.id}/learning-insights`}>
            <Lightbulb aria-hidden="true" />
            Learning Insights
          </CardAction>
        </HanaCard>
        <HanaCard title="External API" description="개발 인증 기반 read-only 소비자 문서를 확인합니다.">
          <CardAction to={`/projects/${project.id}/external-api`}>
            <Code2 aria-hidden="true" />
            API docs
          </CardAction>
        </HanaCard>
      </QuickLinks>
      <HanaCard title="Project edit" description="작업 공간 이름, 설명, 상태를 관리합니다.">
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

const StageAction = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.color.borderStrong};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};
  color: ${({ theme }) => theme.color.text};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const NextActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.color.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};

  ${CardAction} {
    margin: 0;
  }
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
