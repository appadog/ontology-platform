import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderPlus, Search, type LucideIcon } from "lucide-react";
import styled from "styled-components";
import { globalNavItems, projectNavGroups, type NavItem, type NavSection } from "./navigation";
import { useProjects } from "../api/queries";
import { getRecentProjectIds } from "../lib/recentProjects";

// Wave 63 (PM6-041 §2.1 / design doc P4): universal launcher command palette.
// Built ONLY from existing data sources (navigation.ts route table + the
// shared recents store also used by AppShell/DashboardPage) -- no parallel
// route list, no new backend state.

// Wave 65 (follow-up): the LNB label itself stays English per D3 copy policy,
// but a Korean-speaking user typing the Korean word for a section (e.g.
// "품질" for Quality) found no match — only the English label was indexed.
// This is a search-only alias map (not a UI label change); it feeds into
// each action's `keywords` field alongside the existing label/section text.
const sectionKeywordsKo: Record<NavSection, string> = {
  dashboard: "대시보드",
  projects: "프로젝트",
  admin: "관리",
  ontology: "온톨로지",
  "ontology-packs": "온톨로지 팩",
  sources: "소스",
  connectors: "커넥터",
  extraction: "추출",
  candidates: "후보",
  review: "검수",
  quality: "품질",
  governance: "거버넌스",
  publish: "게시",
  "published-graph": "게시 그래프",
  search: "검색",
  rag: "RAG 답변",
  evaluation: "평가 골드셋",
  copilot: "코파일럿",
  "learning-insights": "학습 인사이트",
  benchmark: "벤치마크",
  "external-api": "외부 API",
};

interface PaletteAction {
  id: string;
  label: string;
  group: string;
  icon: LucideIcon;
  keywords?: string;
  perform: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/**
 * Simple, dependency-free token match: every whitespace-separated query token
 * must appear as a substring of the action's searchable text. This is enough
 * for a ~60-item action list (57 routes + a couple of extras) -- a fuzzy-match
 * dependency would be overkill per design doc §2.1 ("keep dependency-light").
 */
function matches(query: string, haystack: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  const target = haystack.toLowerCase();
  return tokens.every((token) => target.includes(token));
}

export function CommandPalette() {
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const routeProjectId = useMemo(() => {
    const match = window.location.pathname.match(/^\/projects\/([^/]+)/);
    return match?.[1] ?? "";
  }, [open]);

  const recentProjectId = getRecentProjectIds()[0] ?? "";
  const contextProjectId = routeProjectId || recentProjectId || projects[0]?.id || "";

  const actions = useMemo<PaletteAction[]>(() => {
    const list: PaletteAction[] = [];

    // Creation action first per design doc §2.2 (no auto-form-opening required).
    list.push({
      id: "action:new-project",
      label: "새 프로젝트 만들기",
      group: "액션",
      icon: FolderPlus,
      keywords: "new project create 새 프로젝트 만들기 생성",
      perform: () => navigate("/projects"),
    });

    // Recent project, pulled from the existing storage convention.
    const recentProject = projects.find((project) => project.id === recentProjectId);
    if (recentProject) {
      list.push({
        id: `recent:${recentProject.id}`,
        label: `최근 프로젝트: ${recentProject.name}`,
        group: "최근 프로젝트",
        icon: FolderPlus,
        keywords: `recent ${recentProject.name}`,
        perform: () => navigate(`/projects/${recentProject.id}`),
      });
    }

    const addNavItem = (item: NavItem, group: string) => {
      list.push({
        id: `nav:${group}:${item.section}`,
        label: item.label,
        group,
        icon: item.icon,
        keywords: `${item.label} ${item.section} ${sectionKeywordsKo[item.section] ?? ""}`,
        perform: () => navigate(item.to(contextProjectId || undefined)),
      });
    };

    globalNavItems.forEach((item) => addNavItem(item, "전역 메뉴"));
    projectNavGroups.forEach((group) => {
      group.items.forEach((item) => addNavItem(item, group.label));
    });

    return list;
  }, [contextProjectId, navigate, projects, recentProjectId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    return actions.filter((action) => matches(query, `${action.label} ${action.group} ${action.keywords ?? ""}`));
  }, [actions, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    // Return focus to whatever opened the palette (trigger button or the
    // element focused before the global shortcut fired).
    triggerRef.current?.focus();
  }, []);

  const openPalette = useCallback((trigger?: HTMLElement | null) => {
    triggerRef.current = trigger ?? (document.activeElement as HTMLElement | null);
    setOpen(true);
    setQuery("");
    setActiveIndex(0);
  }, []);

  // Global Cmd/Ctrl+K listener. Standard command-palette convention (Linear /
  // Notion) is to open globally even while focus is inside a text input --
  // implemented that way here -- but we never mutate the input's value, so
  // typing is never corrupted; Escape below always closes and restores focus.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isK = event.key === "k" || event.key === "K";
      if ((event.metaKey || event.ctrlKey) && isK) {
        event.preventDefault();
        openPalette(isEditableTarget(document.activeElement) ? (document.activeElement as HTMLElement) : undefined);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openPalette]);

  // Focus trap + body scroll lock while open.
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);

    function handleTrapKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "Tab") {
        // Single focusable field (input) inside the dialog body besides list
        // items which aren't independently focusable; keep focus on input.
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleTrapKeyDown, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleTrapKeyDown, true);
    };
  }, [open, close]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const activeEl = listRef.current?.querySelector<HTMLLIElement>('[data-active="true"]');
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (filtered.length === 0 ? 0 : (index + 1) % filtered.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (filtered.length === 0 ? 0 : (index - 1 + filtered.length) % filtered.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const action = filtered[activeIndex];
      if (action) {
        action.perform();
        close();
      }
    }
  }

  let lastGroup = "";

  return (
    <>
      <TriggerButton type="button" onClick={(event) => openPalette(event.currentTarget)} aria-label="커맨드 팔레트 열기 (검색)">
        <Search aria-hidden="true" />
        <span>검색...</span>
        <Kbd>⌘K</Kbd>
      </TriggerButton>
      {open && (
        <Overlay
          role="dialog"
          aria-modal="true"
          aria-label="커맨드 팔레트"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <Panel>
            <InputRow>
              <Search aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="페이지, 프로젝트 액션 검색..."
                aria-label="커맨드 검색"
                autoComplete="off"
                spellCheck={false}
              />
              <EscHint>Esc</EscHint>
            </InputRow>
            <List ref={listRef} role="listbox" aria-label="검색 결과">
              {filtered.length === 0 ? (
                <EmptyRow>일치하는 항목이 없습니다</EmptyRow>
              ) : (
                filtered.map((action, index) => {
                  const showGroupHeader = action.group !== lastGroup;
                  lastGroup = action.group;
                  const Icon = action.icon;
                  return (
                    <li key={action.id}>
                      {showGroupHeader && <GroupHeader>{action.group}</GroupHeader>}
                      <ActionRow
                        role="option"
                        aria-selected={index === activeIndex}
                        data-active={index === activeIndex ? "true" : "false"}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => {
                          action.perform();
                          close();
                        }}
                      >
                        <Icon aria-hidden="true" />
                        <span>{action.label}</span>
                      </ActionRow>
                    </li>
                  );
                })
              )}
            </List>
          </Panel>
        </Overlay>
      )}
    </>
  );
}

const TriggerButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surface};
  color: ${({ theme }) => theme.color.textMuted};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    color: ${({ theme }) => theme.color.text};
    background: ${({ theme }) => theme.color.surfaceOverlay};
  }
`;

const Kbd = styled.span`
  padding: 1px 6px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surfaceRaised};
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 12vh 16px 16px;
  background: rgba(15, 23, 42, 0.5);
`;

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 560px;
  max-height: 70vh;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.color.surfaceRaised};
  box-shadow: ${({ theme }) => theme.shadow.soft};
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.color.border};

  svg {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.color.textMuted};
  }

  input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: none;
    color: ${({ theme }) => theme.color.text};
    font-size: ${({ theme }) => theme.typography.fontSize.md};
  }
`;

const EscHint = styled.span`
  flex-shrink: 0;
  padding: 1px 6px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const List = styled.ul`
  margin: 0;
  padding: 8px;
  overflow-y: auto;
  list-style: none;
`;

const GroupHeader = styled.div`
  padding: 8px 8px 4px;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  padding: 0 8px;
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.color.text};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;

  svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.color.textMuted};
  }

  &[data-active="true"] {
    background: ${({ theme }) => theme.color.primarySoft};
    color: ${({ theme }) => theme.color.primary};

    svg {
      color: ${({ theme }) => theme.color.primary};
    }
  }
`;

const EmptyRow = styled.li`
  padding: 24px 8px;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;
