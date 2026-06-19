import { ChangeEvent, useState } from "react";
import { Plus } from "lucide-react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { useCreateProject, useProjects } from "../shared/api/queries";
import { PageHeader } from "../shared/layout/PageHeader";
import { HanaBadge, HanaButton, HanaCard, HanaInput, statusToTone } from "../shared/ui/hana";
import { PageState } from "../shared/ui/platform/PageState";
import { formatDateTime } from "../shared/lib/format";

export function ProjectListPage() {
  const { data: projects, isLoading, isError, refetch } = useProjects();
  const createProject = useCreateProject();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

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
      <PageHeader title="Projects" description="데이터 구축 작업의 최상위 작업 공간을 만들고 선택합니다.">
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
        <PageState kind="empty" title="프로젝트가 없습니다" description="새 프로젝트를 만들면 Ontology와 Source 작업을 시작할 수 있습니다." />
      ) : (
        <HanaCard>
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Sources</th>
                  <th>Ontology Versions</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <ProjectLink to={`/projects/${project.id}`}>
                        <strong>{project.name}</strong>
                        <span>{project.description ?? "No description"}</span>
                      </ProjectLink>
                    </td>
                    <td>
                      <HanaBadge tone={statusToTone(project.status)}>{project.status}</HanaBadge>
                    </td>
                    <td>{project.source_count}</td>
                    <td>{project.ontology_version_count}</td>
                    <td>{formatDateTime(project.updated_at)}</td>
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

const TableWrap = styled.div`
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 16px 18px;
    border-bottom: 1px solid ${({ theme }) => theme.color.border};
    text-align: left;
    vertical-align: middle;
  }

  th {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 12px;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  tr:last-child td {
    border-bottom: 0;
  }
`;

const ProjectLink = styled(Link)`
  display: grid;
  gap: 4px;

  strong {
    color: ${({ theme }) => theme.color.primary};
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    line-height: 1.45;
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
