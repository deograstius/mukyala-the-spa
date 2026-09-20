/* eslint-disable react-refresh/only-export-components */

import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  RouterProvider,
} from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';
import Login from './Login';
import SettingsModal from './SettingsModal';
import TopBar from './TopBar';
import { AdminAuthContext } from './auth';
import DoorPage from './pages/DoorPage';
import ProductsPage from './pages/ProductsPage';
import ScanPage from './pages/ScanPage';
import { getRetailToken, setRetailToken } from './retail/retailApi';

/**
 * Staff back-office app shell (admin[.staging].mukyala.com). Two routes —
 * `/scan` (default) and `/products` (spec decision #3) — behind a single
 * login gate. Settings (change password) is a modal off the top-right menu.
 */
function AdminLayout() {
  const [token, setToken] = useState<string | null>(() => getRetailToken());
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSignOut = useCallback(() => {
    setRetailToken(null);
    setToken(null);
    setSettingsOpen(false);
  }, []);

  const auth = useMemo(() => ({ onAuthExpired: handleSignOut }), [handleSignOut]);

  if (!token) {
    return <Login onLoggedIn={setToken} />;
  }

  return (
    <AdminAuthContext.Provider value={auth}>
      <TopBar onOpenSettings={() => setSettingsOpen(true)} onSignOut={handleSignOut} />
      <main>
        <Outlet />
      </main>
      {settingsOpen ? <SettingsModal onClose={() => setSettingsOpen(false)} /> : null}
    </AdminAuthContext.Provider>
  );
}

const RootRoute = createRootRoute({
  component: AdminLayout,
});

const IndexRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/scan', replace: true });
  },
});

const ScanRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'scan',
  component: ScanPage,
});

const ProductsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'products',
  component: ProductsPage,
});

// Event door (spec decision #15): QR check-in + attendee list for the DMV
// event, behind the same staff login.
const DoorRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'door',
  component: DoorPage,
});

// Staff tool: unknown URLs just land on the default surface.
const CatchAllRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '*',
  beforeLoad: () => {
    throw redirect({ to: '/scan', replace: true });
  },
});

export const routeTree = RootRoute.addChildren([
  IndexRoute,
  ScanRoute,
  ProductsRoute,
  DoorRoute,
  CatchAllRoute,
]);

/** Test helper: pass memory-history entries for an isolated router. */
export function createAdminRouter(initialEntries?: string[]) {
  return createRouter({
    routeTree,
    ...(initialEntries ? { history: createMemoryHistory({ initialEntries }) } : {}),
  });
}

const router = createAdminRouter();

export default function AdminApp() {
  return <RouterProvider router={router} />;
}
