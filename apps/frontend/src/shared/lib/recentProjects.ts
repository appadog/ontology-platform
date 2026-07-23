// Wave 69 (dashboard personalization follow-up): replaces the old single-value
// `ontology-platform:recent-project-id` key (previously duplicated across
// AppShell/ProjectListPage/DashboardPage/CommandPalette) with a shared,
// list-based recents store plus a new favorites store. One place, many pages.
const RECENT_PROJECTS_KEY = "ontology-platform:recent-project-ids";
const FAVORITE_PROJECTS_KEY = "ontology-platform:favorite-project-ids";
const MAX_RECENT_PROJECTS = 5;

function readIdList(key: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeIdList(key: string, ids: string[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(ids));
}

export function getRecentProjectIds(): string[] {
  return readIdList(RECENT_PROJECTS_KEY);
}

export function recordProjectVisit(projectId: string): void {
  if (!projectId) {
    return;
  }

  const next = [projectId, ...getRecentProjectIds().filter((id) => id !== projectId)].slice(0, MAX_RECENT_PROJECTS);
  writeIdList(RECENT_PROJECTS_KEY, next);
}

export function getFavoriteProjectIds(): string[] {
  return readIdList(FAVORITE_PROJECTS_KEY);
}

export function isFavoriteProject(projectId: string): boolean {
  return getFavoriteProjectIds().includes(projectId);
}

export function toggleFavoriteProject(projectId: string): string[] {
  const current = getFavoriteProjectIds();
  const next = current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId];
  writeIdList(FAVORITE_PROJECTS_KEY, next);
  return next;
}
