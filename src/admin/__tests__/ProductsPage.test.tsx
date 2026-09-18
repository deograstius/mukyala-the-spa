import { RouterProvider } from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { server, http, HttpResponse } from '../../test/msw.server';
import { createAdminRouter } from '../AdminApp';

const TOKEN_KEY = 'retail:token:v1';

const balm = {
  slug: 'test-balm',
  title: 'Test Balm',
  priceCents: 1234,
  active: true,
  homeFeatured: false,
  sku: 'MK-TEST01',
  barcode: '0850024183209',
  description: null,
  categoryId: 'cat-1',
  category: { slug: 'balms', title: 'Balms' },
  createdAt: '2026-09-16T12:00:00.000Z',
  stock: { sku: 'MK-TEST01', onHand: 9, reserved: 1, committed: 0, available: 8 },
};

const serum = {
  slug: 'loose-serum',
  title: 'Loose Serum',
  priceCents: 5600,
  active: false,
  homeFeatured: true,
  sku: 'MK-SER01',
  barcode: '0850024183300',
  description: null,
  categoryId: null,
  category: null,
  stock: null,
};

function useProductHandlers() {
  server.use(
    http.get('/v1/retail/products', () => HttpResponse.json([balm, serum])),
    http.get('/v1/retail/categories', () =>
      HttpResponse.json([{ id: 'cat-1', slug: 'balms', title: 'Balms', position: 0 }]),
    ),
  );
}

function renderProducts() {
  return render(<RouterProvider router={createAdminRouter(['/products'])} />);
}

beforeEach(() => {
  window.localStorage.setItem(TOKEN_KEY, 'valid-token');
});

describe('products management page (#29 simplified card)', () => {
  it('groups by category, shows readable stock words, and links View in app', async () => {
    useProductHandlers();
    renderProducts();

    expect(await screen.findByDisplayValue('Test Balm')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Balms' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Uncategorized' })).toBeInTheDocument();
    expect(screen.getByText(/hidden from shop/)).toBeInTheDocument();
    // Stock reads as words (#29): Available + In cart, no on-hand jargon.
    expect(screen.getByText('Available 8 · In cart 1')).toBeInTheDocument();
    expect(screen.getByText('Stock: —')).toBeInTheDocument();
    expect(screen.queryByText(/on hand/)).not.toBeInTheDocument();
    // Cross-origin view link, relabeled (#29).
    const viewLinks = screen.getAllByRole('link', { name: 'View in app' });
    expect(viewLinks[0]).toHaveAttribute('href', 'https://staging.mukyala.com/shop/test-balm');
    // Scanned-in date (decision #20); the serum has none (pre-#20 API).
    const balmRow = screen.getByDisplayValue('Test Balm').closest('li');
    expect(balmRow).toHaveTextContent('Added Sep 16, 2026');
    expect(screen.getByDisplayValue('Loose Serum').closest('li')).not.toHaveTextContent('Added');
  });

  it('hide/show toggles the active flag via PATCH', async () => {
    let patched: unknown = null;
    let patchedSlug = '';
    useProductHandlers();
    server.use(
      http.patch('/v1/retail/products/:slug', async ({ request, params }) => {
        patchedSlug = String(params.slug);
        patched = await request.json();
        return HttpResponse.json({ slug: params.slug, active: false });
      }),
    );
    renderProducts();
    await screen.findByDisplayValue('Test Balm');

    // Balm is active → its row offers "Hide from shop".
    await userEvent.click(screen.getByRole('button', { name: 'Hide from shop' }));
    expect(await screen.findByDisplayValue('Test Balm')).toBeInTheDocument();
    expect(patchedSlug).toBe('test-balm');
    expect(patched).toEqual({ active: false });
  });

  it('feature/hide on homepage toggles homeFeatured via PATCH (#29)', async () => {
    const patches: Array<{ slug: string; body: unknown }> = [];
    useProductHandlers();
    server.use(
      http.patch('/v1/retail/products/:slug', async ({ request, params }) => {
        patches.push({ slug: String(params.slug), body: await request.json() });
        return HttpResponse.json({ slug: params.slug });
      }),
    );
    renderProducts();
    await screen.findByDisplayValue('Test Balm');

    // Balm is unfeatured → offers "Feature on homepage"; the serum is
    // featured → offers "Hide from homepage".
    await userEvent.click(screen.getByRole('button', { name: 'Feature on homepage' }));
    await screen.findByDisplayValue('Test Balm');
    await userEvent.click(screen.getByRole('button', { name: 'Hide from homepage' }));
    await screen.findByDisplayValue('Test Balm');

    expect(patches).toEqual([
      { slug: 'test-balm', body: { homeFeatured: true } },
      { slug: 'loose-serum', body: { homeFeatured: false } },
    ]);
  });

  it('sets stock to the typed quantity via one signed adjustment (#29)', async () => {
    let adjusted: unknown = null;
    useProductHandlers();
    server.use(
      http.post('/v1/retail/stock/adjust', async ({ request }) => {
        adjusted = await request.json();
        return HttpResponse.json({ sku: 'MK-TEST01', onHand: 6 });
      }),
    );
    renderProducts();
    await screen.findByDisplayValue('Test Balm');

    // Quantity holds current Available (8); Apply is disabled until it changes.
    const qty = screen.getByLabelText('Quantity for Test Balm');
    expect(qty).toHaveValue('8');
    const apply = screen.getAllByRole('button', { name: 'Apply' })[0];
    expect(apply).toBeDisabled();

    await userEvent.clear(qty);
    await userEvent.type(qty, '5');
    expect(apply).toBeEnabled();
    await userEvent.click(apply);

    expect(await screen.findByDisplayValue('Test Balm')).toBeInTheDocument();
    // 8 available → 5 = a single -3 correction.
    expect(adjusted).toEqual({ sku: 'MK-TEST01', delta: -3, reason: 'recount' });
  });

  it('disables the quantity control when stock is unreachable', async () => {
    useProductHandlers();
    renderProducts();
    await screen.findByDisplayValue('Loose Serum');

    expect(screen.getByLabelText('Quantity for Loose Serum')).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Apply' })[1]).toBeDisabled();
  });

  it('surfaces the in-cart protection message from the server', async () => {
    useProductHandlers();
    server.use(
      http.post('/v1/retail/stock/adjust', () =>
        HttpResponse.json(
          { error: 'insufficient_stock', message: 'Available is 8; cannot remove 20.' },
          { status: 409 },
        ),
      ),
    );
    renderProducts();
    await screen.findByDisplayValue('Test Balm');

    const qty = screen.getByLabelText('Quantity for Test Balm');
    await userEvent.clear(qty);
    await userEvent.type(qty, '0');
    await userEvent.click(screen.getAllByRole('button', { name: 'Apply' })[0]);

    expect(await screen.findByRole('alert')).toHaveTextContent('Available is 8; cannot remove 20.');
  });

  it('saves the inline name on blur (#29 — no Edit ceremony)', async () => {
    let patched: unknown = null;
    useProductHandlers();
    server.use(
      http.patch('/v1/retail/products/:slug', async ({ request }) => {
        patched = await request.json();
        return HttpResponse.json({ slug: 'test-balm' });
      }),
    );
    renderProducts();
    await screen.findByDisplayValue('Test Balm');

    const name = screen.getByLabelText('Name for Test Balm');
    await userEvent.clear(name);
    await userEvent.type(name, 'Renamed Balm');
    await userEvent.tab();

    // The mocked reload still returns the old title, so assert on the PATCH
    // itself (live, the refreshed row re-renders with the saved name).
    await waitFor(() => expect(patched).toEqual({ title: 'Renamed Balm' }));
  });

  it('saves the inline price on blur and ignores an unchanged value', async () => {
    const patches: unknown[] = [];
    useProductHandlers();
    server.use(
      http.patch('/v1/retail/products/:slug', async ({ request }) => {
        patches.push(await request.json());
        return HttpResponse.json({ slug: 'test-balm' });
      }),
    );
    renderProducts();
    await screen.findByDisplayValue('Test Balm');

    // Blur without changes → no PATCH.
    const price = screen.getByLabelText('Price for Test Balm');
    await userEvent.click(price);
    await userEvent.tab();
    expect(patches).toEqual([]);

    await userEvent.clear(price);
    await userEvent.type(price, '20');
    await userEvent.tab();
    expect(await screen.findByDisplayValue('Test Balm')).toBeInTheDocument();
    expect(patches).toEqual([{ priceCents: 2000 }]);
  });

  it('rejects a garbage price locally and restores the stored value', async () => {
    useProductHandlers();
    renderProducts();
    await screen.findByDisplayValue('Test Balm');

    const price = screen.getByLabelText('Price for Test Balm');
    await userEvent.clear(price);
    await userEvent.type(price, 'abc');
    await userEvent.tab();

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a price like 45 or 45.50.');
    expect(price).toHaveValue('12.34');
  });

  it('saves the inline description on blur', async () => {
    let patched: unknown = null;
    useProductHandlers();
    server.use(
      http.patch('/v1/retail/products/:slug', async ({ request }) => {
        patched = await request.json();
        return HttpResponse.json({ slug: 'test-balm' });
      }),
    );
    renderProducts();
    await screen.findByDisplayValue('Test Balm');

    const desc = screen.getByLabelText('Description for Test Balm');
    await userEvent.type(desc, 'A calming balm.');
    await userEvent.tab();

    expect(await screen.findByDisplayValue('Test Balm')).toBeInTheDocument();
    expect(patched).toEqual({ description: 'A calming balm.' });
  });

  it('has no Edit, Receive, or Adjust stock ceremonies left (#29)', async () => {
    useProductHandlers();
    renderProducts();
    await screen.findByDisplayValue('Test Balm');

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Receive' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Adjust stock' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Apply correction' })).not.toBeInTheDocument();
  });
});
