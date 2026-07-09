import { useCallback, useSyncExternalStore } from "react";

// MVP6.10: the active tenant is CLIENT-SIDE VIEW STATE ONLY (PM gate G5). Switching
// writes NO server session/state — it only persists a local key (mirroring the
// existing recent-project key) and notifies subscribers. A stale id is always
// re-validated against the server (GET /tenants/{id}) and resolves to 404/403 via
// the isolation states; it is never trusted as proof a tenant exists.

const ACTIVE_TENANT_STORAGE_KEY = "ontology-platform:active-tenant-id";
const EVENT = "ontology-platform:active-tenant-change";

function read(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ACTIVE_TENANT_STORAGE_KEY) ?? "";
}

/** Set (or clear) the client-side active tenant and notify subscribers. */
export function setActiveTenantId(tenantId: string | null): void {
  if (typeof window === "undefined") return;
  if (tenantId) {
    window.localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, tenantId);
  } else {
    window.localStorage.removeItem(ACTIVE_TENANT_STORAGE_KEY);
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * React hook for the client-side active tenant id. Returns the stored id (or "")
 * plus a stable setter. Kept in sync across the header switcher and the tenant
 * context view via a window event (no server write).
 */
export function useActiveTenantId(): [string, (tenantId: string | null) => void] {
  const value = useSyncExternalStore(subscribe, read, () => "");
  const set = useCallback((tenantId: string | null) => setActiveTenantId(tenantId), []);
  return [value, set];
}
