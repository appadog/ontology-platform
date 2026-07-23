import { ChangeEvent, useState } from "react";
import { Boxes, Database, FolderKanban, Inbox, Plus } from "lucide-react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { useCreateProject, useProjects } from "../shared/api/queries";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, HanaInput, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { StatusBadge } from "../shared/ui/platform/StatusBadge";
import { formatDateTime } from "../shared/lib/format";
import { CompactTable } from "./mvp3Shared";

const recentProjectStorageKey = "ontology-platform:recent-project-id";

export function ProjectListPage() {
  const { data: projects, isLoading, isError, refetch } = useProjects();
  const createProject = useCreateProject();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // Wave 64 (PM6-042 §2.3): the contextual quick-links card below the list
  // targets the "selected" project — same recent/first-project resolution
  // AppShell already uses for its project selector, so the two stay in sync.
  const recentProjectId = typeof window === "undefined" ? "" : window.localStorage.getItem(recentProjectStorageKey) ?? "";
  const selectedProject = (projects ?? []).find((project) => project.id === recentProjectId) ?? (projects ?? [])[0];

  const canCreate = name.trim().length > 0 && !createProject.isPending;

  function handleCreateProject() {
    if (!canCreate) {
      return;
    }

    createProject.mutate(
      {
        name: name.trim(),
        description: description.trim() || null,
      },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          setShowCreateForm(false);
        },
      },
    );
  }

  if (isLoading) {
    return <PageState kind="loading" title="프로젝트 목록을 불러오는 중" description="최근 작업 공간을 준비하고 있습니다." />;
  }

  if (isError || !projects) {
    return (
      <PageState
        kind="error"
        title="프로젝트 목록을 불러오지 못했습니다"
        description="프로젝트 목록을 다시 불러오거나 잠시 후 재시도하세요."
        actionLabel="다시 시도"
        onAction={() => void refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader title="프로젝트" description="데이터 구축 작업의 최상위 작업 공간을 만들고 선택합니다.">
        <HanaButton variant="primary" type="button" onClick={() => setShowCreateForm((current) => !current)}>
          <Plus aria-hidden="true" />
          New Project
        </HanaButton>
      </PageHeader>
      {showCreateForm && (
        <HanaCard title="Create project" description="새 데이터 구축 작업 공간의 이름과 설명을 입력합니다.">
          <CreateGrid>
            <Field>
              <span>Name</span>
              <HanaInput value={name} onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)} placeholder="프로젝트 이름" />
            </Field>
            <Field>
              <span>Description</span>
              <HanaInput
                value={description}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setDescription(event.target.value)}
                placeholder="프로젝트 설명"
              />
            </Field>
            <ButtonSlot>
              <HanaButton variant="primary" type="button" disabled={!canCreate} onClick={handleCreateProject}>
                {createProject.isPending ? "Creating" : "Create"}
              </HanaButton>
            </ButtonSlot>
          </CreateGrid>
        </HanaCard>
      )}
      {projects.length === 0 ? (
        // Wave 63 (PM6-041 §2.2 / design doc P1/P2): single primary CTA. Zero
        // projects means there is no existing project in the system to link
        // to, so the secondary "예시 프로젝트 둘러보기" CTA is intentionally
        // omitted here (design doc §3: no backend sample-data seeding; the
        // secondary link only ever points at a REAL existing project).
        <PageState
          kind="empty"
          icon={FolderKanban}
          title="프로젝트가 없습니다"
          description="새 프로젝트를 만들면 Ontology와 Source 작업을 시작할 수 있습니다."
          actionLabel="새 프로젝트 만들기"
          onAction={() => setShowCreateForm(true)}
        />
      ) : (
        <>
          <HanaCard emphasis="default">
            <CompactTable>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th data-align="right">Sources</th>
                    <th data-align="right">Ontology Versions</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id}>
                      <td>
                        <ProjectLink to={`/projects/${project.id}`}>
                          {/* Wave 64 (PM6-042 §2.3): mock's colored initial-letter
                              avatar square, driven by the real project name. */}
                          <ProjectAvatar aria-hidden="true">{project.name.trim().charAt(0).toUpperCase() || "?"}</ProjectAvatar>
                          <ProjectLinkText>
                            <strong>{project.name}</strong>
                            <span>{project.description ?? "No description"}</span>
                          </ProjectLinkText>
                        </ProjectLink>
                      </td>
                      <td>
                        <StatusBadge token={project.status} tone={statusToTone(project.status)} />
                      </td>
                      <td data-align="right">{project.source_count}</td>
                      <td data-align="right">{project.ontology_version_count}</td>
                      <td>{formatDateTime(project.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CompactTable>
          </HanaCard>
          {selectedProject && (
            <HanaCard
              emphasis="default"
              eyebrow={selectedProject.name}
              title="빠른 이동"
              description="선택된 프로젝트의 Ontology, Sources, Review로 바로 이동합니다."
            >
              <QuickLinkGrid>
                <QuickLinkCard to={`/projects/${selectedProject.id}/ontology`}>
                  <Boxes aria-hidden="true" />
                  <span>Ontology Modeler</span>
                </QuickLinkCard>
                <QuickLinkCard to={`/projects/${selectedProject.id}/sources`}>
                  <Database aria-hidden="true" />
                  <span>Sources</span>
                </QuickLinkCard>
                <QuickLinkCard to={`/projects/${selectedProject.id}/review`}>
                  <Inbox aria-hidden="true" />
                  <span>Review Inbox</span>
                </QuickLinkCard>
              </QuickLinkGrid>
            </HanaCard>
          )}
        </>
      )}
    </>
  );
}

const ProjectLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

// Wave 64 (PM6-042 §2.3): initial-letter avatar square, accent-soft tinted.
const ProjectAvatar = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.primarySoft};
  color: ${({ theme }) => theme.color.primary};
  font-weight: 800;
`;

const ProjectLinkText = styled.span`
  display: grid;
  gap: 4px;
  min-width: 0;

  strong {
    color: ${({ theme }) => theme.color.primary};
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    line-height: 1.45;
    overflow-wrap: anywhere;
  }
`;

// Wave 64 (PM6-042 §2.3): the 3-link quick-access card for the selected
// project — pure navigation to real existing routes, no new data.
const QuickLinkGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  padding: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const QuickLinkCard = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.color.borderSubtle};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surfaceRaised};
  color: ${({ theme }) => theme.color.text};
  font-weight: 700;
  transition: box-shadow 120ms ease, border-color 120ms ease;

  svg {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.color.primary};
  }

  &:hover {
    box-shadow: ${({ theme }) => theme.shadow.card};
    border-color: ${({ theme }) => theme.color.borderStrong};
  }
`;

const CreateGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(220px, 2fr) auto;
  gap: 12px;
  align-items: end;
  padding: 18px;

  @media (max-width: 880px) {
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

  @media (max-width: 880px) {
    justify-content: flex-start;
  }
`;
