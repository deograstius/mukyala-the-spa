import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server, http, HttpResponse } from '../../test/msw.server';
import { createAdminRouter } from '../AdminApp';

// The real scanner needs a camera + the zxing WASM decoder; the page flow is
// what these tests cover, so the scanner is a stub that "detects" on click.
vi.mock('@features/retail/BarcodeScanner', () => ({
  default: ({
    onDetected,
    onCancel,
  }: {
    onDetected: (code: string) => void;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={() => onDetected('0850024183209')}>mock-detect</button>
      <button onClick={onCancel}>mock-cancel</button>
    </div>
  ),
}));

const TOKEN_KEY = 'retail:token:v1';

const balm = {
  slug: 'test-balm',
  title: 'Test Balm',
  priceCents: 1234,
  active: true,
  sku: 'MK-TEST01',
  barcode: '0850024183209',
  description: null,
  categoryId: null,
  category: null,
  stock: { sku: 'MK-TEST01', onHand: 9, reserved: 0, committed: 0, available: 9 },
};

function renderScan() {
  return render(<RouterProvider router={createAdminRouter(['/scan'])} />);
}

function unknownBarcodeHandlers(hint: Record<string, unknown> = {}) {
  server.use(
    http.get('/v1/retail/categories', () =>
      HttpResponse.json([{ id: 'cat-1', slug: 'balms', title: 'Balms', position: 0 }]),
    ),
    http.get('/v1/retail/products/by-barcode/:code', () =>
      HttpResponse.json({ error: 'not_found' }, { status: 404 }),
    ),
    http.get('/v1/retail/barcode-info/:code', () => HttpResponse.json(hint)),
  );
}

async function openCreateForm() {
  await userEvent.click(await screen.findByRole('button', { name: 'Scan barcode' }));
  await userEvent.click(await screen.findByRole('button', { name: 'mock-detect' }));
  await screen.findByText(/New barcode:/);
}

beforeEach(() => {
  window.localStorage.setItem(TOKEN_KEY, 'valid-token');
});

describe('scan → create (barcode-first, everything in one surface)', () => {
  it('prefills from the barcode DB; quantity defaults to 1 and visibility to OFF', async () => {
    unknownBarcodeHandlers({
      title: 'ZAQ Noor LED Mask',
      category: 'Health & Beauty > Balms',
      description: 'LED therapy at home.',
      imageUrl: 'https://images.example/mask.jpg',
      suggestedPriceCents: 34999,
    });
    renderScan();
    await openCreateForm();

    expect(screen.getByLabelText('Barcode')).toHaveValue('0850024183209');
    expect(screen.getByLabelText('Name')).toHaveValue('ZAQ Noor LED Mask');
    expect(screen.getByLabelText('Price (USD)')).toHaveValue('349.99');
    expect(screen.getByLabelText('Quantity')).toHaveValue('1');
    expect(screen.getByLabelText('Show on website')).not.toBeChecked();
    expect(screen.getByLabelText('Category')).toHaveValue('cat-1');
  });

  it('requires quantity ≥ 1 — no zero-stock creates', async () => {
    unknownBarcodeHandlers({ title: 'New Thing' });
    renderScan();
    await openCreateForm();

    await userEvent.type(screen.getByLabelText('Price (USD)'), '12.50');
    const submit = screen.getByRole('button', { name: 'Add product' });
    const qty = screen.getByLabelText('Quantity');
    await userEvent.clear(qty);
    expect(submit).toBeDisabled();
    await userEvent.type(qty, '0');
    expect(submit).toBeDisabled();
    await userEvent.clear(qty);
    await userEvent.type(qty, '3');
    expect(submit).toBeEnabled();
  });

  it('happy path with publish ON: creates hidden, receives stock, then applies visibility', async () => {
    const calls: string[] = [];
    let createBody: Record<string, unknown> | null = null;
    let receiveBody: Record<string, unknown> | null = null;
    let patchBody: Record<string, unknown> | null = null;
    unknownBarcodeHandlers({ title: 'New Mask', suggestedPriceCents: 2500 });
    server.use(
      http.post('/v1/retail/products', async ({ request }) => {
        calls.push('create');
        createBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          { slug: 'new-mask', title: 'New Mask', priceCents: 2500, active: false, sku: 'MK-NEW01' },
          { status: 201 },
        );
      }),
      http.post('/v1/retail/stock/receive', async ({ request }) => {
        calls.push('receive');
        receiveBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ sku: 'MK-NEW01', onHand: 2 });
      }),
      http.patch('/v1/retail/products/:slug', async ({ request }) => {
        calls.push('patch');
        patchBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ slug: 'new-mask', active: true });
      }),
    );
    renderScan();
    await openCreateForm();

    const qty = screen.getByLabelText('Quantity');
    await userEvent.clear(qty);
    await userEvent.type(qty, '2');
    await userEvent.click(screen.getByLabelText('Show on website'));
    await userEvent.click(screen.getByRole('button', { name: 'Add product' }));

    expect(await screen.findByText(/“New Mask” added — 2 in stock/)).toBeInTheDocument();
    expect(screen.getByText('Live on the shop.')).toBeInTheDocument();
    // Hidden-first ordering: a mid-sequence failure can never leave a visible
    // zero-stock product.
    expect(calls).toEqual(['create', 'receive', 'patch']);
    expect(createBody).toMatchObject({ barcode: '0850024183209', active: false });
    expect(receiveBody).toEqual({ sku: 'MK-NEW01', qty: 2 });
    expect(patchBody).toEqual({ active: true });
  });

  it('receive failure: keeps the surface open with inline retry and does NOT re-create', async () => {
    let createCalls = 0;
    let receiveCalls = 0;
    unknownBarcodeHandlers({ title: 'Flaky Mask' });
    server.use(
      http.post('/v1/retail/products', () => {
        createCalls += 1;
        return HttpResponse.json(
          {
            slug: 'flaky-mask',
            title: 'Flaky Mask',
            priceCents: 1000,
            active: false,
            sku: 'MK-FLK01',
          },
          { status: 201 },
        );
      }),
      http.post('/v1/retail/stock/receive', () => {
        receiveCalls += 1;
        if (receiveCalls === 1) {
          return HttpResponse.json({ error: 'inventory_unreachable' }, { status: 502 });
        }
        return HttpResponse.json({ sku: 'MK-FLK01', onHand: 1 });
      }),
    );
    renderScan();
    await openCreateForm();

    await userEvent.type(screen.getByLabelText('Price (USD)'), '10');
    await userEvent.click(screen.getByRole('button', { name: 'Add product' }));

    // Stuck state: product exists, stock does not — retry, don't lose it.
    expect(await screen.findByText(/stock not received yet/i)).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: 'Retry' });
    expect(screen.getByLabelText('Name')).toBeDisabled();

    await userEvent.click(retry);
    expect(await screen.findByText(/“Flaky Mask” added — 1 in stock/)).toBeInTheDocument();
    expect(screen.getByText(/Hidden — publish it from Products/)).toBeInTheDocument();
    expect(createCalls).toBe(1); // retry resumed, not restarted
    expect(receiveCalls).toBe(2);
  });
});

describe('scan → receive (known barcode)', () => {
  it('goes straight to the receive card and posts the adjustment', async () => {
    let received: unknown = null;
    server.use(
      http.get('/v1/retail/categories', () => HttpResponse.json([])),
      http.get('/v1/retail/products/by-barcode/:code', () => HttpResponse.json(balm)),
      http.post('/v1/retail/stock/receive', async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ sku: balm.sku, onHand: 12 });
      }),
    );
    renderScan();
    await userEvent.click(await screen.findByRole('button', { name: 'Scan barcode' }));
    await userEvent.click(await screen.findByRole('button', { name: 'mock-detect' }));

    expect(await screen.findByRole('heading', { name: 'Test Balm' })).toBeInTheDocument();
    const qty = screen.getByLabelText('Receive quantity for Test Balm');
    await userEvent.clear(qty);
    await userEvent.type(qty, '3');
    await userEvent.click(screen.getByRole('button', { name: 'Receive' }));

    expect(await screen.findByText(/Received 3/)).toBeInTheDocument();
    expect(received).toEqual({ sku: 'MK-TEST01', qty: 3 });
  });
});
