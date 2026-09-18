import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { server, http, HttpResponse } from '../../test/msw.server';
import Shop from '../Shop';

function renderShop() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <Shop />
    </QueryClientProvider>,
  );
}

describe('Shop page', () => {
  it('renders hero and product grid', async () => {
    renderShop();
    expect(
      screen.getByRole('heading', {
        name: /shop/i,
        level: 1,
      }),
    ).toBeInTheDocument();

    // One product link is present from MSW default
    const link = await screen.findByRole('link', { name: /DermaQuest B5 Hydrating Serum/i });
    expect(link).toHaveAttribute('href', '/shop/b5-hydrating-serum');
  });

  it('empty catalog: shows the sold-out line, not "No items found." (#27)', async () => {
    server.use(http.get('/v1/products', () => HttpResponse.json([])));
    renderShop();

    expect(await screen.findByText('All sold out! More products coming soon!')).toBeInTheDocument();
    expect(screen.queryByText(/no items found/i)).not.toBeInTheDocument();
  });

  it('API down: shows the SAME sold-out line and reports the failure (#27)', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(
      http.get('/v1/products', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );
    renderShop();

    expect(
      await screen.findByText('All sold out! More products coming soon!', undefined, {
        timeout: 8000,
      }),
    ).toBeInTheDocument();
    // The old error wall is gone — one fallback for both causes.
    expect(screen.queryByText(/couldn’t load the shop/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    // But never graceful-and-undebuggable: the failure is logged.
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('products unavailable on shop'),
      expect.anything(),
    );
    consoleError.mockRestore();
  });
});
