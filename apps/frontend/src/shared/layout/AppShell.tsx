import { PropsWithChildren } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ChevronDown, CircleUserRound } from "lucide-react";
import styled from "styled-components";
import { mockProjects } from "../mocks/fixtures";
import { navigationItems } from "./navigation";
import { HanaBadge, HanaSelect, statusToTone } from "../ui/hana";

const defaultProfileSourceId = "source-policy-csv";
const defaultChunkSourceId = "source-handbook-pdf";
const defaultJobId = "job-policy-extraction";
const defaultEvidenceId = "evidence-policy-row-1";

export function AppShell({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const selectedProject = mockProjects[0];

  return (
    <Shell>
      <Sidebar>
        <Brand>
          <strong>Ontology</strong>
          <span>Data Platform</span>
        </Brand>
        <Nav aria-label="Application navigation">
          {navigationItems.map((item) => {
            const path = resolveNavigationPath(item.path, selectedProject.id);

            return (
              <NavLink key={item.path} to={path}>
                <item.icon aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </Nav>
      </Sidebar>
      <MainArea>
        <Topbar>
          <ProjectSelector>
            <label htmlFor="project-selector">Current project</label>
            <SelectWrap>
              <HanaSelect
                id="project-selector"
                value={selectedProject.id}
                onChange={(event) => navigate(`/projects/${event.target.value}`)}
              >
                {mockProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </HanaSelect>
              <ChevronDown aria-hidden="true" />
            </SelectWrap>
          </ProjectSelector>
          <TopbarRight>
            <HanaBadge tone={statusToTone(selectedProject.status)}>{selectedProject.status}</HanaBadge>
            <UserChip>
              <CircleUserRound aria-hidden="true" />
              dev-admin
            </UserChip>
          </TopbarRight>
        </Topbar>
        <Content>{children}</Content>
      </MainArea>
    </Shell>
  );
}

function resolveNavigationPath(path: string, projectId: string) {
  switch (path) {
    case "/ontology":
      return `/projects/${projectId}/ontology`;
    case "/sources":
      return `/projects/${projectId}/sources`;
    case "/profile":
      return `/projects/${projectId}/sources/${defaultProfileSourceId}/profile`;
    case "/chunks":
      return `/projects/${projectId}/sources/${defaultChunkSourceId}/chunks`;
    case "/extraction/new":
      return `/projects/${projectId}/extraction/new`;
    case "/extraction-jobs":
      return `/projects/${projectId}/extraction-jobs`;
    case "/candidates":
      return `/extraction-jobs/${defaultJobId}/candidates`;
    case "/evidence":
      return `/candidate-evidence/${defaultEvidenceId}`;
    default:
      return path;
  }
}

const Shell = styled.div`
  display: grid;
  grid-template-columns: ${({ theme }) => theme.sidebarWidth} minmax(0, 1fr);
  min-height: 100vh;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.aside`
  position: sticky;
  top: 0;
  height: 100vh;
  border-right: 1px solid ${({ theme }) => theme.color.border};
  background: ${({ theme }) => theme.color.surfaceRaised};
  padding: 22px 16px;

  @media (max-width: 860px) {
    position: static;
    height: auto;
    border-right: 0;
    border-bottom: 1px solid ${({ theme }) => theme.color.border};
  }
`;

const Brand = styled.div`
  display: grid;
  gap: 2px;
  padding: 0 8px 20px;

  strong {
    font-size: 20px;
    line-height: 1.2;
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 13px;
    font-weight: 700;
  }
`;

const Nav = styled.nav`
  display: grid;
  gap: 6px;

  a {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 42px;
    padding: 0 12px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.color.textMuted};
    font-weight: 800;

    svg {
      width: 18px;
      height: 18px;
    }

    &.active {
      background: ${({ theme }) => theme.color.primarySoft};
      color: ${({ theme }) => theme.color.primary};
    }
  }

  @media (max-width: 860px) {
    grid-template-columns: repeat(auto-fit, minmax(118px, 1fr));

    a {
      justify-content: center;
      padding: 0 8px;
    }
  }

  @media (max-width: 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const MainArea = styled.div`
  min-width: 0;
`;

const Topbar = styled.header`
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 72px;
  padding: 14px 28px;
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
  background: rgba(247, 249, 251, 0.92);
  backdrop-filter: blur(10px);

  @media (max-width: 760px) {
    align-items: stretch;
    flex-direction: column;
    padding: 14px 18px;
  }
`;

const ProjectSelector = styled.div`
  display: grid;
  gap: 6px;
  width: min(420px, 100%);

  label {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
  }
`;

const SelectWrap = styled.div`
  position: relative;

  select {
    width: 100%;
    appearance: none;
  }

  svg {
    position: absolute;
    right: 12px;
    top: 50%;
    width: 16px;
    height: 16px;
    pointer-events: none;
    transform: translateY(-50%);
    color: ${({ theme }) => theme.color.textMuted};
  }
`;

const TopbarRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;

  @media (max-width: 760px) {
    justify-content: flex-start;
  }
`;

const UserChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.color.textMuted};
  font-weight: 800;

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Content = styled.main`
  display: grid;
  gap: 22px;
  width: min(1440px, 100%);
  margin: 0 auto;
  padding: 28px;

  @media (max-width: 760px) {
    padding: 20px 16px;
  }
`;
