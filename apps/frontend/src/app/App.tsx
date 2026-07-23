import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { AppShell } from "../shared/layout/AppShell";

export function App() {
  return (
    <AppShell>
      {/* Wave 65 (PM6-042 follow-up): route-level code-splitting (router.tsx
          now lazy()-loads every page) needs one Suspense boundary. `null`
          fallback avoids a loading flash for the common case (chunk already
          cached / fetched in well under the app's existing 300ms threshold
          for showing a loading state); AppShell chrome itself is not lazy so
          the sidebar/topbar never disappears during a route change. */}
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </AppShell>
  );
}
