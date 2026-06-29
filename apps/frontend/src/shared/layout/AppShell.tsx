import { PropsWithChildren, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, CircleUserRound } from "lucide-react";
import styled from "styled-components";
import { globalNavItems, projectNavGroups, resolveActiveSection, type NavItem } from "./navigation";
import { useProjects } from "../api/queries";
import { HanaBadge, HanaSelect, statusToTone } from "../ui/hana";

const recentProjectStorageKey = "ontology-platform:recent-project-id";

export function AppShell({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();
  const routeProjectId = useMemo(() => {
    const match = location.pathname.match(/^\/projects\/([^/]+)/);
    return match?.[1] ?? "";
  }, [location.pathname]);
  const recentProjectId = typeof window === "undefined" ? "" : window.localStorage.getItem(recentProjectStorageKey) ?? "";
  const selectedProject =
    projects.find((project) => project.id === routeProjectId) ??
    projects.find((project) => project.id === recentProjectId) ??
    projects[0];

  useEffect(() => {
    if (routeProjectId) {
      window.localStorage.setItem(recentProjectStorageKey, routeProjectId);
      return;
    }

    if (selectedProject?.id) {
      window.localStorage.setItem(recentProjectStorageKey, selectedProject.id);
    }
  }, [routeProjectId, selectedProject?.id]);

  const activeSection = resolveActiveSection(location.pathname);
  const projectId = selectedProject?.id;
  const renderNavItem = (item: NavItem) => {
    // FE6-037: drive both the visual `.active` class AND `aria-current` from the
    // single resolved section (resolveActiveSection) so exactly one LNB item is
    // current. We use a plain Link instead of NavLink because NavLink's built-in
    // path-prefix matching marks the global `Projects` item (to=/projects)
    // aria-current on every /projects/:p/... sub-route, and it also overrides any
    // explicitly-passed aria-current for items whose `to` does not equal the full
    // pathname (e.g. Candidates -> /extraction-jobs). Computing it ourselves keeps
    // class + aria-current consistent for every item.
    const isActive = activeSection === item.section;
    return (
      <Link
        key={item.section}
        to={item.to(projectId)}
        aria-current={isActive ? "page" : undefined}
        className={isActive ? "active" : undefined}
      >
        <item.icon aria-hidden="true" />
        {item.label}
      </Link>
    );
  };

  return (
    <Shell>
      <Sidebar>
        <Brand>
          <strong>Ontology</strong>
          <span>Data Platform</span>
        </Brand>
        <Nav aria-label="Application navigation">
          {globalNavItems.map(renderNavItem)}
          {projectId ? (
            projectNavGroups.map((group) => (
              <NavGroupBlock key={group.label}>
                <GroupLabel>{group.label}</GroupLabel>
                {group.items.map(renderNavItem)}
              </NavGroupBlock>
            ))
          ) : (
            <ProjectHint role="note">프로젝트를 선택하면 작업 메뉴가 표시됩니다</ProjectHint>
          )}
        </Nav>
      </Sidebar>
      <MainArea>
        <Topbar>
          <ProjectSelector>
            <label htmlFor="project-selector">Current project</label>
            <SelectWrap>
              <HanaSelect
                id="project-selector"
                value={selectedProject?.id ?? ""}
                disabled={isProjectsLoading || projects.length === 0}
                onChange={(event) => {
                  const nextProjectId = event.target.value;
                  if (!nextProjectId) {
                    return;
                  }
                  window.localStorage.setItem(recentProjectStorageKey, nextProjectId);
                  navigate(`/projects/${nextProjectId}`);
                }}
              >
                {projects.length === 0 && <option value="">{isProjectsLoading ? "Loading projects" : "Select project"}</option>}
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </HanaSelect>
              <ChevronDown aria-hidden="true" />
            </SelectWrap>
          </ProjectSelector>
          <TopbarRight>
            {selectedProject ? <HanaBadge tone={statusToTone(selectedProject.status)}>{selectedProject.status}</HanaBadge> : <HanaBadge tone="neutral">NO_PROJECT</HanaBadge>}
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
    /* Collapsed top grid: global items + each group's items become a responsive
       grid; group headers (BUILD/REVIEW/...) still span full width so grouping
       survives (D1 §1.7). */
    grid-template-columns: repeat(auto-fit, minmax(118px, 1fr));

    > a {
      justify-content: center;
      padding: 0 8px;
    }
  }

  @media (max-width: 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const NavGroupBlock = styled.div`
  display: grid;
  gap: 6px;
  margin-top: 10px;

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
    grid-column: 1 / -1;
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

const GroupLabel = styled.span`
  padding: 6px 12px 2px;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  letter-spacing: 0.04em;
  text-transform: uppercase;

  @media (max-width: 860px) {
    grid-column: 1 / -1;
  }
`;

const ProjectHint = styled.p`
  margin: 12px 0 0;
  padding: 0 12px;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  line-height: 1.5;

  @media (max-width: 860px) {
    grid-column: 1 / -1;
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
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  min-width: 0;

  @media (max-width: 760px) {
    justify-content: flex-start;
  }
`;

const UserChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
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
  min-width: 0;
  margin: 0 auto;
  padding: 28px;

  /* FE6-036: at very wide viewports raise the max-width so the content does not
     leave a large empty right gutter (the 1920 alignment issue). Gutters stay
     symmetric within the content column. */
  @media (min-width: 1700px) {
    width: min(1600px, 100%);
  }

  @media (max-width: 760px) {
    padding: 20px 16px;
  }
`;
