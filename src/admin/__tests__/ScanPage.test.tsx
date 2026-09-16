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
    onCancel?: () => void;
  }) => (
    <div>
      <button onClick={() => onDetected('0850024183209')}>mock-detect</button>
      {onCancel ? <button onClick={onCancel}>mock-cancel</button> : null}
    </div>
  ),
}));

// The capture screens also need a live camera (and jsdom has no
// canvas.toBlob); this stub "snaps" a JPEG File on click, like the real one.
vi.mock('../PhotoCapture', () => ({
  default: ({
    shot,
    onCapture,
    onCancel,
  }: {
    shot: 'front' | 'back';
    onCapture: (file: File) => void;
    onCancel: () => void;
  }) => (
    <div>
      <p>{`mock-capture-${shot}`}</p>
      <button
        onClick={() => onCapture(new File(['photo-bytes'], `${shot}.jpg`, { type: 'image/jpeg' }))}
      >
        mock-snap
      </button>
      <button onClick={onCancel}>mock-capture-cancel</button>
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

/** Tracks presign + PUT traffic so tests can assert upload semantics. */
function useIntakeHandlers() {
  const intake = { presignBodies: [] as unknown[], puts: [] as string[] };
  server.use(
    http.post('/v1/retail/intake-uploads', async ({ request }) => {
      const body = (await request.json()) as {
        barcode: string;
        shots: Array<{ shot: string; contentType: string }>;
      };
      intake.presignBodies.push(body);
      return HttpResponse.json({
        uploads: body.shots.map(({ shot }) => ({
          shot,
          key: `intake/${body.barcode}/${shot}`,
          uploadUrl: `https://uploads.example/${body.barcode}/${shot}`,
        })),
      });
    }),
    http.put('https://uploads.example/:barcode/:shot', ({ params }) => {
      intake.puts.push(String(params.shot));
      return new HttpResponse(null, { status: 200 });
    }),
  );
  return intake;
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

async function detectBarcode() {
  // Zero-tap (#18a): the scanner is already live — no button to press first.
  await userEvent.click(await screen.findByRole('button', { name: 'mock-detect' }));
}

/** Flow 1 (barcode-DB hit): detection lands straight on the create form. */
async function openCreateForm() {
  await detectBarcode();
  await screen.findByText(/New barcode:/);
}

/** Flow 2 (barcode-DB miss): walk the guided capture — front, then back. */
async function captureBothPhotos() {
  expect(await screen.findByText('mock-capture-front')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'mock-snap' }));
  expect(await screen.findByText('mock-capture-back')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'mock-snap' }));
  await screen.findByText(/New barcode:/);
}

beforeEach(() => {
  window.localStorage.setItem(TOKEN_KEY, 'valid-token');
});

describe('scan → create, Flow 1 (barcode DB hit — no photos, #19)', () => {
  it('prefills from the barcode DB; no capture screens, no photo rows, no image-link field', async () => {
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
    // The DB identifies the product — no photos, and no manual image link.
    expect(screen.queryByText('mock-capture-front')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit front photo' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Image link/)).not.toBeInTheDocument();
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

  it('creates without any photo traffic: create hidden → receive, presign never called', async () => {
    const calls: string[] = [];
    let createBody: Record<string, unknown> | null = null;
    unknownBarcodeHandlers({ title: 'New Mask', suggestedPriceCents: 2500 });
    const intake = useIntakeHandlers();
    server.use(
      http.post('/v1/retail/products', async ({ request }) => {
        calls.push('create');
        createBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          { slug: 'new-mask', title: 'New Mask', priceCents: 2500, active: false, sku: 'MK-NEW01' },
          { status: 201 },
        );
      }),
      http.post('/v1/retail/stock/receive', () => {
        calls.push('receive');
        return HttpResponse.json({ sku: 'MK-NEW01', onHand: 1 });
      }),
    );
    renderScan();
    await openCreateForm();
    await userEvent.click(screen.getByRole('button', { name: 'Add product' }));

    expect(await screen.findByText(/“New Mask” added — 1 in stock/)).toBeInTheDocument();
    expect(screen.getByText(/Hidden — publish it from Products/)).toBeInTheDocument();
    expect(calls).toEqual(['create', 'receive']);
    expect(intake.presignBodies).toEqual([]);
    expect(intake.puts).toEqual([]);
    expect(createBody).toMatchObject({ barcode: '0850024183209', active: false });
  });
});

describe('scan → create, Flow 2 (barcode DB miss — guided capture, #19)', () => {
  it('walks front → back capture, then the form with retake buttons and no image-link field', async () => {
    unknownBarcodeHandlers();
    renderScan();
    await detectBarcode();
    await captureBothPhotos();

    expect(screen.getByText(/nothing found in the barcode database/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit front photo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit back photo' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Image link/)).not.toBeInTheDocument();
  });

  it('happy path with publish ON: uploads photos, creates hidden, receives stock, then applies visibility', async () => {
    const calls: string[] = [];
    let createBody: Record<string, unknown> | null = null;
    let receiveBody: Record<string, unknown> | null = null;
    let patchBody: Record<string, unknown> | null = null;
    unknownBarcodeHandlers();
    const intake = useIntakeHandlers();
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
    await detectBarcode();
    await captureBothPhotos();

    await userEvent.type(screen.getByLabelText('Name'), 'New Mask');
    await userEvent.type(screen.getByLabelText('Price (USD)'), '25');
    const qty = screen.getByLabelText('Quantity');
    await userEvent.clear(qty);
    await userEvent.type(qty, '2');
    await userEvent.click(screen.getByLabelText('Show on website'));
    await userEvent.click(screen.getByRole('button', { name: 'Add product' }));

    expect(await screen.findByText(/“New Mask” added — 2 in stock/)).toBeInTheDocument();
    expect(screen.getByText('Live on the shop.')).toBeInTheDocument();
    // Hidden-first ordering: a mid-sequence failure can never leave a visible
    // zero-stock product. Photos land before the product exists.
    expect(calls).toEqual(['create', 'receive', 'patch']);
    expect(intake.presignBodies).toEqual([
      {
        barcode: '0850024183209',
        shots: [
          { shot: 'front', contentType: 'image/jpeg' },
          { shot: 'back', contentType: 'image/jpeg' },
        ],
      },
    ]);
    expect(intake.puts).toEqual(['front', 'back']);
    expect(createBody).toMatchObject({ barcode: '0850024183209', active: false });
    expect(receiveBody).toEqual({ sku: 'MK-NEW01', qty: 2 });
    expect(patchBody).toEqual({ active: true });
  });

  it('photo upload failure: retry re-sends only the failed shot, then proceeds', async () => {
    let frontPutAttempts = 0;
    let createCalls = 0;
    const presignBodies: Array<{ shots: Array<{ shot: string }> }> = [];
    unknownBarcodeHandlers();
    server.use(
      http.post('/v1/retail/intake-uploads', async ({ request }) => {
        const body = (await request.json()) as {
          barcode: string;
          shots: Array<{ shot: 'front' | 'back'; contentType: string }>;
        };
        presignBodies.push(body);
        return HttpResponse.json({
          uploads: body.shots.map(({ shot }) => ({
            shot,
            key: `intake/${body.barcode}/${shot}`,
            uploadUrl: `https://uploads.example/${body.barcode}/${shot}`,
          })),
        });
      }),
      http.put('https://uploads.example/:barcode/front', () => {
        frontPutAttempts += 1;
        return new HttpResponse(null, { status: 200 });
      }),
      http.put('https://uploads.example/:barcode/back', () => {
        // First attempt dies; retry succeeds.
        return presignBodies.length === 1
          ? HttpResponse.error()
          : new HttpResponse(null, { status: 200 });
      }),
      http.post('/v1/retail/products', () => {
        createCalls += 1;
        return HttpResponse.json(
          {
            slug: 'flaky-upload',
            title: 'Flaky Upload',
            priceCents: 900,
            active: false,
            sku: 'MK-FLK02',
          },
          { status: 201 },
        );
      }),
      http.post('/v1/retail/stock/receive', () =>
        HttpResponse.json({ sku: 'MK-FLK02', onHand: 1 }),
      ),
    );
    renderScan();
    await detectBarcode();
    await captureBothPhotos();

    await userEvent.type(screen.getByLabelText('Name'), 'Flaky Upload');
    await userEvent.type(screen.getByLabelText('Price (USD)'), '9');
    await userEvent.click(screen.getByRole('button', { name: 'Add product' }));

    // Front landed, back failed — nothing was created yet.
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(createCalls).toBe(0);
    expect(frontPutAttempts).toBe(1);

    await userEvent.click(screen.getByRole('button', { name: 'Add product' }));
    expect(await screen.findByText(/“Flaky Upload” added — 1 in stock/)).toBeInTheDocument();
    // Retry presigned ONLY the missing back shot and never re-PUT the front.
    expect(presignBodies[1].shots.map((s) => s.shot)).toEqual(['back']);
    expect(frontPutAttempts).toBe(1);
    expect(createCalls).toBe(1);
  });

  it('receive failure: keeps the surface open with inline retry and does NOT re-create', async () => {
    let createCalls = 0;
    let receiveCalls = 0;
    unknownBarcodeHandlers();
    const intake = useIntakeHandlers();
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
    await detectBarcode();
    await captureBothPhotos();

    await userEvent.type(screen.getByLabelText('Name'), 'Flaky Mask');
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
    expect(intake.puts).toEqual(['front', 'back']); // photos never re-uploaded
  });

  it('Edit re-runs a single capture screen and returns to the form', async () => {
    unknownBarcodeHandlers();
    renderScan();
    await detectBarcode();
    await captureBothPhotos();

    await userEvent.type(screen.getByLabelText('Name'), 'Keep My Fields');
    await userEvent.click(screen.getByRole('button', { name: 'Edit front photo' }));
    expect(await screen.findByText('mock-capture-front')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'mock-snap' }));

    // Straight back to the form — no forced walk through the back shot — and
    // the typed fields survived.
    expect(await screen.findByText(/New barcode:/)).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Keep My Fields');
  });

  it('Cancel on the initial capture returns to the scanner; cancel on a retake returns to the form', async () => {
    unknownBarcodeHandlers();
    renderScan();
    await detectBarcode();
    expect(await screen.findByText('mock-capture-front')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'mock-capture-cancel' }));
    // Back on the live scanner — the create was abandoned.
    expect(await screen.findByRole('button', { name: 'mock-detect' })).toBeInTheDocument();

    await detectBarcode();
    await captureBothPhotos();
    await userEvent.click(screen.getByRole('button', { name: 'Edit back photo' }));
    expect(await screen.findByText('mock-capture-back')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'mock-capture-cancel' }));
    // A retake cancel keeps the photo and the form.
    expect(await screen.findByText(/New barcode:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit back photo' })).toBeInTheDocument();
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
    await detectBarcode();

    expect(await screen.findByRole('heading', { name: 'Test Balm' })).toBeInTheDocument();
    const qty = screen.getByLabelText('Receive quantity for Test Balm');
    await userEvent.clear(qty);
    await userEvent.type(qty, '3');
    await userEvent.click(screen.getByRole('button', { name: 'Receive' }));

    expect(await screen.findByText(/Received 3/)).toBeInTheDocument();
    expect(received).toEqual({ sku: 'MK-TEST01', qty: 3 });
  });
});

describe('zero-tap scan entry (#18a)', () => {
  it('opens the scanner immediately — no Scan button, no Cancel', async () => {
    server.use(http.get('/v1/retail/categories', () => HttpResponse.json([])));
    renderScan();
    expect(await screen.findByRole('button', { name: 'mock-detect' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Scan barcode' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'mock-cancel' })).not.toBeInTheDocument();
  });

  it('Done after receiving drops back onto the live scanner with the notice above it', async () => {
    server.use(
      http.get('/v1/retail/categories', () => HttpResponse.json([])),
      http.get('/v1/retail/products/by-barcode/:code', () => HttpResponse.json(balm)),
      http.post('/v1/retail/stock/receive', () => HttpResponse.json({ sku: balm.sku, onHand: 12 })),
    );
    renderScan();
    await detectBarcode();
    await screen.findByRole('heading', { name: 'Test Balm' });
    const qty = screen.getByLabelText('Receive quantity for Test Balm');
    await userEvent.clear(qty);
    await userEvent.type(qty, '3');
    await userEvent.click(screen.getByRole('button', { name: 'Receive' }));
    await screen.findByText(/Received 3/);
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    // Back on the live scanner, success banner riding above it.
    expect(await screen.findByRole('button', { name: 'mock-detect' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Received 3 × “Test Balm”.');
  });
});
