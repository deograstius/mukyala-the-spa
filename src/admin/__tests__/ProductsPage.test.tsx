import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
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
  sku: 'MK-TEST01',
  barcode: '0850024183209',
  description: null,
  categoryId: 'cat-1',
  category: { slug: 'balms', title: 'Balms' },
  stock: { sku: 'MK-TEST01', onHand: 9, reserved: 0, committed: 0, available: 9 },
};

const serum = {
  slug: 'loose-serum',
  title: 'Loose Serum',
  priceCents: 5600,
  active: false,
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

describe('products management page', () => {
  it('groups by category, shows hidden state, and links View to the customer shop', async () => {
    useProductHandlers();
    renderProducts();

    expect(await screen.findByText('Test Balm')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Balms' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Uncategorized' })).toBeInTheDocument();
    expect(screen.getByText(/hidden from shop/)).toBeInTheDocument();
    // Cross-origin view link — the admin site is its own website now.
    const viewLinks = screen.getAllByRole('link', { name: 'View' });
    expect(viewLinks[0]).toHaveAttribute('href', 'https://staging.mukyala.com/shop/test-balm');
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
    await screen.findByText('Test Balm');

    // Balm is active → its row offers "Hide from shop".
    await userEvent.click(screen.getByRole('button', { name: 'Hide from shop' }));
    expect(await screen.findByText('Test Balm')).toBeInTheDocument();
    expect(patchedSlug).toBe('test-balm');
    expect(patched).toEqual({ active: false });
  });

  it('receives stock from the row', async () => {
    let received: unknown = null;
    useProductHandlers();
    server.use(
      http.post('/v1/retail/stock/receive', async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ sku: 'MK-TEST01', onHand: 14 });
      }),
    );
    renderProducts();
    await screen.findByText('Test Balm');

    await userEvent.type(screen.getByLabelText('Receive quantity for Test Balm'), '5');
    await userEvent.click(screen.getAllByRole('button', { name: 'Receive' })[0]);
    expect(await screen.findByText('Test Balm')).toBeInTheDocument();
    expect(received).toEqual({ sku: 'MK-TEST01', qty: 5 });
  });

  it('surfaces the insufficient-stock message from a signed correction', async () => {
    useProductHandlers();
    server.use(
      http.post('/v1/retail/stock/adjust', () =>
        HttpResponse.json(
          { error: 'insufficient_stock', message: 'On hand is 9; cannot remove 20.', onHand: 9 },
          { status: 409 },
        ),
      ),
    );
    renderProducts();
    await screen.findByText('Test Balm');

    await userEvent.click(screen.getAllByRole('button', { name: 'Adjust stock' })[0]);
    await userEvent.type(
      screen.getByLabelText('Stock correction for Test Balm (use a minus sign to remove)'),
      '-20',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Apply correction' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('On hand is 9; cannot remove 20.');
  });

  it('edits title, price, and description via PATCH', async () => {
    let patched: unknown = null;
    useProductHandlers();
    server.use(
      http.patch('/v1/retail/products/:slug', async ({ request }) => {
        patched = await request.json();
        return HttpResponse.json({ slug: 'test-balm' });
      }),
    );
    renderProducts();
    await screen.findByText('Test Balm');

    await userEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    const title = screen.getByLabelText('Name');
    await userEvent.clear(title);
    await userEvent.type(title, 'Renamed Balm');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Test Balm')).toBeInTheDocument();
    expect(patched).toEqual({ title: 'Renamed Balm', priceCents: 1234, description: null });
  });
});
