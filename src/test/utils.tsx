import { RouterProvider, RouterOptions, Router } from '@tanstack/react-router';
import { render } from '@testing-library/react';
import { ReactElement } from 'react';

import { router as appRouter } from '../router';

// Wrapper to render components with the app's TanStack Router context.
// Allows components that rely on <Link> etc. to render in tests without
// recreating a custom router for every test file.

export function renderWithRouter(ui: ReactElement, router?: Router) {
  // If a test-specific router is provided, use it, otherwise fall back to the
  // app's router from src/router.ts. No generic type argument is passed to
  // RouterOptions so the default "any route tree" type is used, avoiding the
  // need for an explicit `any` and keeping ESLint happy.
  const testRouter: RouterOptions = router ?? (appRouter as unknown as RouterOptions);

  return render(<RouterProvider router={testRouter}>{ui}</RouterProvider>);
}
