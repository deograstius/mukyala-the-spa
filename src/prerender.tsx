import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { renderToString } from 'react-dom/server';
import { CartProvider } from './contexts/CartContext';
import { createTestRouter } from './router';

const prerenderedRoutes = new Set(['/privacy', '/terms', '/sms-disclosures', '/reservation']);

// Home ('/') is not React-prerendered (its hero/menu render from live API
// data), but it must not ship an empty <div id="root"> either: Google's OAuth
// branding review and other non-JS crawlers need the app name "Mukyala"
// (exactly matching the OAuth consent screen), a description of what the app
// does, the Google Ads API data-use statement, and a privacy-policy link in
// the raw HTML. createRoot().render() replaces this block as soon as the
// bundle mounts, so JS users never see it. Keep the <h1> text exactly
// "Mukyala" — the consent-screen app name must match it verbatim.
const HOME_FALLBACK_HTML = `
  <main>
    <h1>Mukyala</h1>
    <p>
      Licensed esthetician facials in Carlsbad, California. Science-rooted
      skincare in a calm, inclusive space.
    </p>
    <p>
      Mukyala uses the Google Ads API to manage its own advertising account. It
      requests access only to Google Ads data belonging to Mukyala, to select
      keywords and report on our own campaigns. It does not access personal data.
    </p>
    <p><a href="/privacy">Privacy policy</a> · <a href="/terms">Terms of service</a></p>
  </main>
`;

type PrerenderResult = {
  html: string;
  links: Set<string>;
};

export async function prerender({ url }: { url: string }): Promise<PrerenderResult> {
  if (url === '/') {
    return {
      html: HOME_FALLBACK_HTML,
      links: new Set(),
    };
  }

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
