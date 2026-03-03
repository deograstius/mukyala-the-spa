import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { renderToString } from 'react-dom/server';
import { CartProvider } from './contexts/CartContext';
import { createTestRouter } from './router';

const prerenderedRoutes = new Set(['/privacy', '/terms', '/sms-disclosures', '/reservation']);

type PrerenderResult = {
  html: string;
  links: Set<string>;
};

export async function prerender({ url }: { url: string }): Promise<PrerenderResult> {
  if (!prerenderedRoutes.has(url)) {
    return {
      html: '',
      links: new Set(),
    };
  }

  const router = createTestRouter([url]);
  const queryClient = new QueryClient();
  await router.load();

  const html = renderToString(
    <CartProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </CartProvider>,
  );

  queryClient.clear();
  return {
    html,
    links: new Set(),
  };
}
