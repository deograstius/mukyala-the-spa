import { RouterProvider } from '@tanstack/react-router';
import { render, screen, waitFor, within } from '@testing-library/react';
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
  updatedAt: '2026-09-18T09:00:00.000Z',
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

/** The balm's whole row — new-layout queries scope through it (#31). */
async function findBalmRow() {
  const name = await screen.findByDisplayValue('Test Balm');
  return within(name.closest('li') as HTMLElement);
}

async function findSerumRow() {
  const name = await screen.findByDisplayValue('Loose Serum');
  return within(name.closest('li') as HTMLElement);
}

beforeEach(() => {
  window.localStorage.setItem(TOKEN_KEY, 'valid-token');
});

describe('products management page (#31 re-layout)', () => {
  it('lays the row out per the approved mockup: labels, checkboxes, meta line', async () => {
    useProductHandlers();
    renderProducts();
    const row = await findBalmRow();

    expect(screen.getByRole('heading', { name: 'Balms' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Uncategorized' })).toBeInTheDocument();
    // Labeled fields (#31): name, price, quantity, category, description.
    expect(row.getByLabelText('Name')).toHaveValue('Test Balm');
    expect(row.getByLabelText('Price (USD)')).toHaveValue('12.34');
    expect(row.getByLabelText('Quantity')).toHaveValue('8');
    expect(row.getByLabelText('Category')).toHaveValue('cat-1');
    expect(row.getByLabelText('Description')).toBeInTheDocument();
    // Checkboxes carry the visibility state directly.
    expect(row.getByRole('checkbox', { name: 'Show in shop' })).toBeChecked();
    expect(row.getByRole('checkbox', { name: 'Feature on homepage' })).not.toBeChecked();
    // In-cart hint rides under Quantity only when something is reserved.
    expect(row.getByText('In cart: 1')).toBeInTheDocument();
    // Action strip: Apply + View in app together, then the meta line closes.
    expect(row.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
    expect(row.getByRole('link', { name: 'View in app' })).toHaveAttribute(
      'href',
      'https://staging.mukyala.com/shop/test-balm',
    );
    expect(
      row.getByText('‖ 0850024183209 · Added Sep 16, 2026 · Edited Sep 18, 2026'),
    ).toBeInTheDocument();
    // The old jargon is gone.
    expect(screen.queryByText(/hidden from shop/)).not.toBeInTheDocument();
    expect(screen.queryByText(/on hand/)).not.toBeInTheDocument();
    expect(screen.queryByText(/MK-TEST01/)).not.toBeInTheDocument();
  });

  it('tolerates missing stock and missing dates (serum row)', async () => {
    useProductHandlers();
    renderProducts();
    const row = await findSerumRow();

    expect(row.getByLabelText('Quantity')).toBeDisabled();
    expect(row.getByRole('button', { name: 'Apply' })).toBeDisabled();
    expect(row.queryByText(/In cart:/)).not.toBeInTheDocument();
    expect(row.getByRole('checkbox', { name: 'Show in shop' })).not.toBeChecked();
    expect(row.getByRole('checkbox', { name: 'Feature on homepage' })).toBeChecked();
    // No dates on the pre-#20/#31 API — the meta line is barcode only.
    expect(row.getByText('‖ 0850024183300')).toBeInTheDocument();
    expect(row.queryByText(/Added|Edited/)).not.toBeInTheDocument();
  });

  it('the Show in shop checkbox PATCHes active', async () => {
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
    const row = await findBalmRow();

    await userEvent.click(row.getByRole('checkbox', { name: 'Show in shop' }));
    await waitFor(() => expect(patched).toEqual({ active: false }));
    expect(patchedSlug).toBe('test-balm');
  });

  it('the Feature on homepage checkbox PATCHes homeFeatured both ways (#29)', async () => {
    const patches: Array<{ slug: string; body: unknown }> = [];
    useProductHandlers();
    server.use(
      http.patch('/v1/retail/products/:slug', async ({ request, params }) => {
        patches.push({ slug: String(params.slug), body: await request.json() });
        return HttpResponse.json({ slug: params.slug });
      }),
    );
    renderProducts();
    const balmRow = await findBalmRow();
    const serumRow = await findSerumRow();

    await userEvent.click(balmRow.getByRole('checkbox', { name: 'Feature on homepage' }));
    await waitFor(() => expect(patches.length).toBe(1));
    await userEvent.click(serumRow.getByRole('checkbox', { name: 'Feature on homepage' }));
    await waitFor(() => expect(patches.length).toBe(2));

    expect(patches).toEqual([
      { slug: 'test-balm', body: { homeFeatured: true } },
      { slug: 'loose-serum', body: { homeFeatured: false } },
    ]);
  });

  it('sets stock to the typed quantity via one signed adjustment on Apply (#29)', async () => {
    let adjusted: unknown = null;
    useProductHandlers();
    server.use(
      http.post('/v1/retail/stock/adjust', async ({ request }) => {
        adjusted = await request.json();
        return HttpResponse.json({ sku: 'MK-TEST01', onHand: 6 });
      }),
    );
    renderProducts();
    const row = await findBalmRow();

    const qty = row.getByLabelText('Quantity');
    expect(qty).toHaveValue('8');
    const apply = row.getByRole('button', { name: 'Apply' });
    expect(apply).toBeDisabled();

    await userEvent.clear(qty);
    await userEvent.type(qty, '5');
    expect(apply).toBeEnabled();
    await userEvent.click(apply);

    // 8 available → 5 = a single -3 correction.
    await waitFor(() =>
      expect(adjusted).toEqual({ sku: 'MK-TEST01', delta: -3, reason: 'recount' }),
    );
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
    const row = await findBalmRow();

    const qty = row.getByLabelText('Quantity');
    await userEvent.clear(qty);
    await userEvent.type(qty, '0');
    await userEvent.click(row.getByRole('button', { name: 'Apply' }));

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
    const row = await findBalmRow();

    const name = row.getByLabelText('Name');
    await userEvent.clear(name);
    await userEvent.type(name, 'Renamed Balm');
    await userEvent.tab();

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
    const row = await findBalmRow();

    const price = row.getByLabelText('Price (USD)');
    await userEvent.click(price);
    await userEvent.tab();
    expect(patches).toEqual([]);

    await userEvent.clear(price);
    await userEvent.type(price, '20');
    await userEvent.tab();
    await waitFor(() => expect(patches).toEqual([{ priceCents: 2000 }]));
  });

  it('rejects a garbage price locally and restores the stored value', async () => {
    useProductHandlers();
    renderProducts();
    const row = await findBalmRow();

    const price = row.getByLabelText('Price (USD)');
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
    const row = await findBalmRow();

    await userEvent.type(row.getByLabelText('Description'), 'A calming balm.');
    await userEvent.tab();

    await waitFor(() => expect(patched).toEqual({ description: 'A calming balm.' }));
  });

  it('has no Edit, Receive, Adjust, or link-toggle ceremonies left (#29/#31)', async () => {
    useProductHandlers();
    renderProducts();
    await findBalmRow();

    for (const dead of [
      'Edit',
      'Receive',
      'Adjust stock',
      'Save changes',
      'Apply correction',
      'Hide from shop',
      'Show in shop',
      'Feature on homepage',
      'Refresh', // removed on operator order — the browser refreshes the page
    ]) {
      expect(screen.queryByRole('button', { name: dead })).not.toBeInTheDocument();
    }
    expect(screen.queryByRole('link', { name: 'View' })).not.toBeInTheDocument();
  });
});
