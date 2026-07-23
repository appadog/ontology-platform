import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Building2, ChevronDown, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import styled from "styled-components";
// Wave 64 (PM6-042 §2.1): self-hosted Newsreader italic 600, scoped ONLY to the
// sidebar "Ontology" wordmark below (never applied to body text). Same
// self-hosted pattern as wave-59's Inter choice (docs/DEPLOYMENT.md — no
// Google Fonts CDN link anywhere).
import "@fontsource/newsreader/600-italic.css";
import { globalNavItems, projectNavGroups, resolveActiveSection, type NavItem } from "./navigation";
import { useMyTenants, useProjects } from "../api/queries";
import { useActiveTenantId } from "../lib/activeTenant";
import { getRecentProjectIds, recordProjectVisit } from "../lib/recentProjects";
import { HanaBadge, HanaSelect, statusToTone } from "../ui/hana";
import { StatusBadge } from "../ui/platform/StatusBadge";
import { CommandPalette } from "./CommandPalette";

// MVP6.10 (FE6-095): the acting actor is a dev-only default in the header switcher
// (never a real auth/JWT claim, never a production control). The dropdown lists
// ONLY this actor's ACTIVE visibility set (GET /tenants) — cross-tenant selection
// is unreachable by construction (isolation-by-construction; ADR 0017 §2.1).
const TENANT_SWITCHER_ACTOR_ID = "dev-user";

// Wave 64 (PM6-042 §2.1): the dev-only acting actor's display name for the
// topbar user chip. Kept as a named constant (not hardcoded inline) so the
// avatar-initials computation below stays visibly derived, not hardcoded.
const ACTING_ACTOR_NAME = "dev-admin";

// Wave 64: derive avatar initials programmatically from a hyphen-separated
// actor name ("dev-admin" -> "DA") instead of hardcoding "DA", so this still
// makes sense if the dev-actor name ever changes.
function actorInitials(name: string): string {
  const initials = name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");
  return initials.slice(0, 2) || "?";
}

// Wave 59 (PM6-039) §5/P8 — desktop icon-rail collapse toggle state, persisted
// across reloads. This is a DESKTOP-ONLY addition: the wave-058 mobile drawer
// (`navOpen` below) keeps its own separate state and CSS path untouched.
const sidebarCollapsedStorageKey = "ontology-platform:sidebar-collapsed";

export function AppShell({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  // F4: mobile nav drawer. Closed by default so page content (breadcrumb/H1) is
  // visible first on mobile; the desktop fixed sidebar is unaffected (the drawer
  // styles only apply under the mobile breakpoint). Any route change closes it.
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);
  // Wave 59: desktop-only icon-rail collapse. Read once at mount (SSR-safe
  // guard) and persist on every change.
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(sidebarCollapsedStorageKey) === "true";
  });
  useEffect(() => {
    window.localStorage.setItem(sidebarCollapsedStorageKey, collapsed ? "true" : "false");
  }, [collapsed]);
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();
  const routeProjectId = useMemo(() => {
    const match = location.pathname.match(/^\/projects\/([^/]+)/);
    return match?.[1] ?? "";
  }, [location.pathname]);
  const recentProjectId = getRecentProjectIds()[0] ?? "";
  const selectedProject =
    projects.find((project) => project.id === routeProjectId) ??
    projects.find((project) => project.id === recentProjectId) ??
    projects[0];

  useEffect(() => {
    if (routeProjectId) {
      recordProjectVisit(routeProjectId);
      return;
    }

    if (selectedProject?.id) {
      recordProjectVisit(selectedProject.id);
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
        // Wave 59: when the desktop rail is collapsed, labels are visually
        // hidden (CSS) but `title` still surfaces them as a native tooltip.
        title={collapsed ? item.label : undefined}
      >
        <item.icon aria-hidden="true" />
        <span className="label">{item.label}</span>
      </Link>
    );
  };

  return (
    <Shell $collapsed={collapsed}>
      <MobileBar>
        <MobileMenuButton
          type="button"
          aria-label="내비게이션 열기/닫기"
          aria-expanded={navOpen}
          aria-controls="app-sidebar"
          onClick={() => setNavOpen((open) => !open)}
        >
          {navOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </MobileMenuButton>
        <MobileBrand>
          <Wordmark>Ontology</Wordmark>
          <span>Data Platform</span>
        </MobileBrand>
      </MobileBar>
      <Sidebar id="app-sidebar" data-open={navOpen ? "true" : "false"} data-collapsed={collapsed ? "true" : "false"}>
        <Brand>
          <Wordmark>Ontology</Wordmark>
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
        <CollapseToggle
          type="button"
          aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
          title={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
        </CollapseToggle>
      </Sidebar>
      <MainArea>
        <Topbar>
          <TopbarLeft>
            <TenantSwitcher />
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
                  recordProjectVisit(nextProjectId);
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
          </TopbarLeft>
          <TopbarRight>
            <CommandPalette />
            {selectedProject ? <HanaBadge tone={statusToTone(selectedProject.status)}>{selectedProject.status}</HanaBadge> : <HanaBadge tone="neutral">NO_PROJECT</HanaBadge>}
            <UserChip>
              <AvatarInitials aria-hidden="true">{actorInitials(ACTING_ACTOR_NAME)}</AvatarInitials>
              {ACTING_ACTOR_NAME}
            </UserChip>
          </TopbarRight>
        </Topbar>
        <Content>{children}</Content>
      </MainArea>
    </Shell>
  );
}

/**
 * MVP6.10 client-side Tenant Context indicator + switcher (FE6-095). Lives in the
 * app-shell header as the OUTER scoping context (not an LNB item; ADR 0010). The
 * dropdown lists ONLY the actor's ACTIVE visibility set (GET /tenants) so
 * cross-tenant selection is unreachable by construction. Switching writes only the
 * CLIENT-SIDE active-tenant key (no server session/state; gate G5) and opens the
 * read-only Tenant Context view. There is NO create / join / provision affordance.
 */
function TenantSwitcher() {
  const navigate = useNavigate();
  const { data, isLoading } = useMyTenants(TENANT_SWITCHER_ACTOR_ID);
  const [activeTenantId, setActiveTenantId] = useActiveTenantId();
  const tenants = data?.items ?? [];
  const activeTenant = tenants.find((t) => t.id === activeTenantId) ?? tenants[0];

  const openTenantContext = () => navigate("/tenant");

  return (
    <TenantContextBox>
      <TenantLabel htmlFor="tenant-switcher">
        <Building2 aria-hidden="true" />
        <span>테넌트 컨텍스트</span>
      </TenantLabel>
      {isLoading ? (
        <TenantHint role="status">테넌트 불러오는 중…</TenantHint>
      ) : tenants.length === 0 ? (
        <TenantHint role="note">소속된 테넌트 없음</TenantHint>
      ) : (
        <TenantRow>
          <SelectWrap>
            <HanaSelect
              id="tenant-switcher"
              value={activeTenant?.id ?? ""}
              aria-label="활성 테넌트 전환 (화면 상태만 변경)"
              onChange={(event) => {
                const nextTenantId = event.target.value;
                if (!nextTenantId) return;
                // Client-side only: persist the view-state key + open the read-only view.
                setActiveTenantId(nextTenantId);
                navigate("/tenant");
              }}
            >
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.display_name}
                </option>
              ))}
            </HanaSelect>
            <ChevronDown aria-hidden="true" />
          </SelectWrap>
          {activeTenant ? <StatusBadge token={activeTenant.status} /> : null}
          <TenantViewLink type="button" onClick={openTenantContext}>
            보기
          </TenantViewLink>
        </TenantRow>
      )}
    </TenantContextBox>
  );
}

const Shell = styled.div<{ $collapsed: boolean }>`
  display: grid;
  grid-template-columns: ${({ theme, $collapsed }) => ($collapsed ? theme.sidebarWidthCollapsed : theme.sidebarWidth)} minmax(0, 1fr);
  min-height: 100vh;
  transition: grid-template-columns 160ms ease;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const CollapseToggle = styled.button`
  display: none;

  @media (min-width: 861px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin-top: auto;
    border: 1px solid ${({ theme }) => theme.color.border};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.color.surface};
    color: ${({ theme }) => theme.color.textMuted};
    cursor: pointer;

    svg {
      width: 16px;
      height: 16px;
    }

    &:hover {
      color: ${({ theme }) => theme.color.text};
      background: ${({ theme }) => theme.color.surfaceOverlay};
    }
  }
`;

// Wave 64 (PM6-042 §2.1): sidebar wordmark treatment — Newsreader italic 600,
// ~21px, tightened tracking. Scoped to this one element only.
const Wordmark = styled.strong`
  font-family: "Newsreader", serif;
  font-style: italic;
  font-weight: 600;
  font-size: 21px;
  letter-spacing: -0.01em;
  line-height: 1.2;
`;

const Brand = styled.div`
  display: grid;
  gap: 2px;
  padding: 0 8px 20px;

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* The brand shows in the mobile app bar instead, so hide the in-drawer copy. */
  @media (max-width: 860px) {
    display: none;
  }
`;

const MobileBar = styled.div`
  display: none;

  @media (max-width: 860px) {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid ${({ theme }) => theme.color.border};
    background: ${({ theme }) => theme.color.surfaceRaised};
  }
`;

const MobileMenuButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surface};
  color: ${({ theme }) => theme.color.text};
  cursor: pointer;

  svg {
    width: 20px;
    height: 20px;
  }
`;

const MobileBrand = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;

  strong {
    font-size: 18px;
    line-height: 1.2;
  }

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 12px;
    font-weight: 700;
  }
`;

const Nav = styled.nav`
  display: grid;
  gap: 6px;
  align-content: start;

  /* Wave 59 (PM6-039) §5: on desktop the sidebar is a fixed-height sticky
     column (100vh) with the collapse toggle pinned below it via margin-top:
     auto on Sidebar's flex layout. Without its own scroll region, a tall nav
     (many project groups) would overflow past the viewport and push the
     toggle button out of reach. Scoped to the desktop breakpoint only - the
     mobile drawer keeps its non-scrolling grid layout. */
  @media (min-width: 861px) {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
  }

  a {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 42px;
    padding: 0 12px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.color.textMuted};
    font-weight: 800;
    transition: background 120ms ease, color 120ms ease;

    svg {
      width: 18px;
      height: 18px;
    }

    /* Wave 64 (PM6-042 §2.1): mock's .op-navlink hover/active treatment —
       hover tints the row with surface-2, active is a solid surface-2 fill
       with primary-text color (not the accent color) so the active state
       reads as "current location", not "call to action". */
    &:hover {
      background: ${({ theme }) => theme.color.surfaceMuted};
      color: ${({ theme }) => theme.color.text};
    }

    &.active {
      background: ${({ theme }) => theme.color.surfaceMuted};
      color: ${({ theme }) => theme.color.text};
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
    transition: background 120ms ease, color 120ms ease;

    svg {
      width: 18px;
      height: 18px;
    }

    /* Wave 64 (PM6-042 §2.1): mock's .op-navlink hover/active treatment —
       hover tints the row with surface-2, active is a solid surface-2 fill
       with primary-text color (not the accent color) so the active state
       reads as "current location", not "call to action". */
    &:hover {
      background: ${({ theme }) => theme.color.surfaceMuted};
      color: ${({ theme }) => theme.color.text};
    }

    &.active {
      background: ${({ theme }) => theme.color.surfaceMuted};
      color: ${({ theme }) => theme.color.text};
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

// Wave 64 (PM6-042 §2.1): mock's group-header micro-typography — 11px/700,
// wider 0.08em tracking (replacing the previous 12px/800/0.04em).
const GroupLabel = styled.span`
  padding: 6px 12px 2px;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
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

// Wave 59 (PM6-039) §5/P8: Sidebar is declared here (after Brand/Nav/
// GroupLabel above) so it can reference them by styled-components selector
// for the desktop-only icon-rail collapse rules.
const Sidebar = styled.aside`
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  border-right: 1px solid ${({ theme }) => theme.color.border};
  background: ${({ theme }) => theme.color.surfaceRaised};
  padding: 22px 16px;

  /* Wave 59 (PM6-039) §5/P8: desktop icon-rail collapse. Labels are hidden and
     the nav/brand center on the icon; the toggle button flips its icon. This
     rule is scoped to widths ABOVE the mobile breakpoint so it never touches
     the wave-058 mobile drawer behavior below. */
  @media (min-width: 861px) {
    &[data-collapsed="true"] {
      padding-left: 12px;
      padding-right: 12px;

      ${Brand} {
        display: none;
      }

      ${Nav} a {
        justify-content: center;
        padding: 0;

        .label {
          position: absolute;
          width: 1px;
          height: 1px;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
        }
      }

      ${GroupLabel} {
        display: none;
      }
    }
  }

  /* F4: under the mobile breakpoint the sidebar becomes a collapsible drawer
     toggled from the mobile app bar. Closed by default (max-height 0) so page
     content sits directly beneath the app bar and is visible first. This
     behavior is unaffected by the desktop-only data-collapsed rules above. */
  @media (max-width: 860px) {
    position: static;
    height: auto;
    max-height: 0;
    overflow: hidden;
    border-right: 0;
    border-bottom: 0;
    padding-top: 0;
    padding-bottom: 0;

    &[data-open="true"] {
      max-height: none;
      padding-top: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid ${({ theme }) => theme.color.border};
    }
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
  /* Wave 64 (PM6-042 §2.1): mock's sticky translucent-blur topbar treatment. */
  border-bottom: 1px solid ${({ theme }) => theme.color.borderSubtle};
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(10px);

  /* F4: the mobile app bar is the sticky top element on mobile; keep the topbar
     in-flow so the two don't stack/overlap on scroll. */
  @media (max-width: 860px) {
    position: static;
  }

  @media (max-width: 760px) {
    align-items: stretch;
    flex-direction: column;
    padding: 14px 18px;
  }
`;

const TopbarLeft = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 18px;
  min-width: 0;

  @media (max-width: 760px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const TenantContextBox = styled.div`
  display: grid;
  gap: 6px;
  min-width: 0;
`;

const TenantLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const TenantRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const TenantHint = styled.span`
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: 700;
`;

const TenantViewLink = styled.button`
  padding: 0;
  border: none;
  background: none;
  color: ${({ theme }) => theme.color.primary};
  font-weight: 800;
  cursor: pointer;
`;

const ProjectSelector = styled.div`
  display: grid;
  gap: 6px;
  width: min(320px, 100%);

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

// Wave 64 (PM6-042 §2.1): mock's avatar-initials pill user chip — a rounded
// surface-2 pill wrapping a circular accent-filled initials badge + name.
const UserChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 4px 14px 4px 4px;
  border-radius: 999px;
  background: ${({ theme }) => theme.color.surfaceMuted};
  color: ${({ theme }) => theme.color.textSecondary};
  font-weight: 800;
`;

const AvatarInitials = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: ${({ theme }) => theme.color.primary};
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
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
