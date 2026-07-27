// Wave 70 (interactive ontology exploration follow-up): extracted from
// CommandPalette's local `matches()` so OntologyModelerPage's ontology
// explorer can reuse the exact same token-match semantics (one place, many
// consumers).
/**
 * Every whitespace-separated query token must appear as a substring of the
 * haystack (case-insensitive). Dependency-free — good enough for the small,
 * in-memory lists this app searches (route table, one project's ontology).
 */
export function tokenMatch(query: string, haystack: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  const target = haystack.toLowerCase();
  return tokens.every((token) => target.includes(token));
}
