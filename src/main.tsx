import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { lazy, Suspense, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import 'react-day-picker/dist/style.css';
import './styles/global.css';
import { CartProvider } from './contexts/CartContext';
import { router } from './router';

const queryClient = new QueryClient();

// Dev-only background palette A/B switcher. `import.meta.env.DEV` is a Vite
// build-time constant; the false branch (prod) is dead-code eliminated, and
// because the import is dynamic the chunk is never included in the prod build.
const PaletteSwitcher: ComponentType | null = import.meta.env.DEV
  ? lazy(() => import('./dev/PaletteSwitcher').then((m) => ({ default: m.PaletteSwitcher })))
  : null;

createRoot(document.getElementById('root')!).render(
  <CartProvider>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {PaletteSwitcher ? (
        <Suspense fallback={null}>
          <PaletteSwitcher />
        </Suspense>
      ) : null}
    </QueryClientProvider>
  </CartProvider>,
);
