import { RouterProvider } from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server, http, HttpResponse } from '../../test/msw.server';
import { createAdminRouter } from '../AdminApp';

// The real scanner needs a camera + the zxing WASM decoder; the page flow is
// what these tests cover, so the scanner is a stub that "detects" on click.
vi.mock('../retail/BarcodeScanner', () => ({
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

/** Every /scan render fetches drafts (#23) — default handler returns none. */
function draftsHandler(drafts: unknown[] = []) {
  return http.get('/v1/retail/intake-drafts', () => HttpResponse.json({ drafts }));
}

/** Tracks presign + PUT traffic so tests can assert upload semantics. */
function useIntakeHandlers() {
  const intake = {
    presignBodies: [] as Array<{ shots: Array<{ shot: string }> }>,
    puts: [] as string[],
  };
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
    draftsHandler(),
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

describe('scan → create, Flow 1 (barcode DB hit — full form, no photos)', () => {
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

  it('blocks a $0 create with Show on website on (#30 — unpriced never visible)', async () => {
    let created = false;
    unknownBarcodeHandlers({ title: 'New Thing' });
    server.use(
      http.post('/v1/retail/products', () => {
        created = true;
        return HttpResponse.json({ slug: 'new-thing' }, { status: 201 });
      }),
    );
    renderScan();
    await openCreateForm();

    await userEvent.type(screen.getByLabelText('Price (USD)'), '0');
    await userEvent.click(screen.getByLabelText('Show on website'));
    await userEvent.click(screen.getByRole('button', { name: 'Add product' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Set a price before showing this product on the website.',
    );
    expect(created).toBe(false);
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

    // One-tap finish (#25): success drops straight back onto the live
    // scanner with the notice above it — no "added ✓" panel, no Done tap.
    expect(await screen.findByRole('button', { name: 'mock-detect' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      '“New Mask” was added — hidden until you publish it.',
    );
    expect(calls).toEqual(['create', 'receive']);
    expect(intake.presignBodies).toEqual([]);
    expect(intake.puts).toEqual([]);
    expect(createBody).toMatchObject({ barcode: '0850024183209', active: false });
  });
});

describe('scan → create, Flow 2 (barcode DB miss — capture, stripped form)', () => {
  it('walks front → back capture, then a form of ONLY barcode + quantity + photos (#22)', async () => {
    unknownBarcodeHandlers();
    useIntakeHandlers();
    renderScan();
    await detectBarcode();
    await captureBothPhotos();

    expect(screen.getByText(/nothing found in the barcode database/)).toBeInTheDocument();
    expect(screen.getByLabelText('Barcode')).toHaveValue('0850024183209');
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit front photo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit back photo' })).toBeInTheDocument();
    // The AI pipeline owns the details — none of these exist here (#22).
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Price (USD)')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Show on website')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Category')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Description')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Image link/)).not.toBeInTheDocument();
  });

  it('uploads each shot AT CAPTURE, then creates hidden with barcode-as-title and $0 (#22/#23)', async () => {
    const calls: string[] = [];
    let createBody: Record<string, unknown> | null = null;
    let receiveBody: Record<string, unknown> | null = null;
    unknownBarcodeHandlers();
    const intake = useIntakeHandlers();
    server.use(
      http.post('/v1/retail/products', async ({ request }) => {
        calls.push('create');
        createBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            slug: 'raw-0850024183209',
            title: '0850024183209',
            priceCents: 0,
            active: false,
            sku: 'MK-RAW01',
          },
          { status: 201 },
        );
      }),
      http.post('/v1/retail/stock/receive', async ({ request }) => {
        calls.push('receive');
        receiveBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ sku: 'MK-RAW01', onHand: 2 });
      }),
    );
    renderScan();
    await detectBarcode();
    await captureBothPhotos();

    // Capture-time uploads: both shots land before submit is ever pressed.
    await waitFor(() => expect(intake.puts).toEqual(['front', 'back']));
    expect(intake.presignBodies.map((b) => b.shots.map((s) => s.shot))).toEqual([
      ['front'],
      ['back'],
    ]);

    const qty = screen.getByLabelText('Quantity');
    await userEvent.clear(qty);
    await userEvent.type(qty, '2');
    await userEvent.click(screen.getByRole('button', { name: 'Add product' }));

    // One-tap finish (#25): straight back to the scanner, notice above it.
    expect(await screen.findByRole('button', { name: 'mock-detect' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      '“0850024183209” was added — hidden until you publish it.',
    );
    expect(calls).toEqual(['create', 'receive']); // no visibility patch — always hidden
    expect(intake.puts).toEqual(['front', 'back']); // submit re-uploaded nothing
    expect(createBody).toEqual({
      title: '0850024183209',
      priceCents: 0,
      barcode: '0850024183209',
      active: false,
    });
    expect(receiveBody).toEqual({ sku: 'MK-RAW01', qty: 2 });
  });

  it('capture-upload failure: submit safety net re-sends only the missing shot', async () => {
    let backPutAttempts = 0;
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
      http.put(
        'https://uploads.example/:barcode/front',
        () => new HttpResponse(null, { status: 200 }),
      ),
      http.put('https://uploads.example/:barcode/back', () => {
        backPutAttempts += 1;
        // The capture-time attempt dies; the submit safety net succeeds.
        return backPutAttempts === 1
          ? HttpResponse.error()
          : new HttpResponse(null, { status: 200 });
      }),
      http.post('/v1/retail/products', () => {
        createCalls += 1;
        return HttpResponse.json(
          {
            slug: 'raw-0850024183209',
            title: '0850024183209',
            priceCents: 0,
            active: false,
            sku: 'MK-RAW02',
          },
          { status: 201 },
        );
      }),
      http.post('/v1/retail/stock/receive', () =>
        HttpResponse.json({ sku: 'MK-RAW02', onHand: 1 }),
      ),
    );
    renderScan();
    await detectBarcode();
    await captureBothPhotos();
    await waitFor(() => expect(backPutAttempts).toBe(1)); // capture attempt failed quietly

    await userEvent.click(screen.getByRole('button', { name: 'Add product' }));
    expect(await screen.findByRole('button', { name: 'mock-detect' })).toBeInTheDocument(); // #25
    // Presigns: front@capture, back@capture (PUT died), back@submit.
    expect(presignBodies.map((b) => b.shots.map((s) => s.shot))).toEqual([
      ['front'],
      ['back'],
      ['back'],
    ]);
    expect(backPutAttempts).toBe(2);
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
            slug: 'raw-0850024183209',
            title: '0850024183209',
            priceCents: 0,
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
    await waitFor(() => expect(intake.puts).toEqual(['front', 'back']));

    await userEvent.click(screen.getByRole('button', { name: 'Add product' }));

    // Stuck state: product exists, stock does not — retry, don't lose it.
    expect(await screen.findByText(/stock not received yet/i)).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Barcode')).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('button', { name: 'mock-detect' })).toBeInTheDocument(); // #25
    expect(createCalls).toBe(1); // retry resumed, not restarted
    expect(receiveCalls).toBe(2);
    expect(intake.puts).toEqual(['front', 'back']); // photos never re-uploaded
  });

  it('Edit re-runs a single capture screen, re-uploads that shot, and keeps typed fields', async () => {
    unknownBarcodeHandlers();
    const intake = useIntakeHandlers();
    renderScan();
    await detectBarcode();
    await captureBothPhotos();
    await waitFor(() => expect(intake.puts).toEqual(['front', 'back']));

    const qty = screen.getByLabelText('Quantity');
    await userEvent.clear(qty);
    await userEvent.type(qty, '5');
    await userEvent.click(screen.getByRole('button', { name: 'Edit front photo' }));
    expect(await screen.findByText('mock-capture-front')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'mock-snap' }));

    // Straight back to the form; the retaken shot re-uploaded under its key.
    expect(await screen.findByText(/New barcode:/)).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity')).toHaveValue('5');
    await waitFor(() => expect(intake.puts).toEqual(['front', 'back', 'front']));
  });

  it('Cancel on the initial capture returns to the scanner; cancel on a retake returns to the form', async () => {
    unknownBarcodeHandlers();
    useIntakeHandlers();
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

describe('drafts — continue where you left off (#23)', () => {
  it('a complete draft resumes straight at the form, barcode locked, nothing re-uploaded', async () => {
    let createBody: Record<string, unknown> | null = null;
    server.use(
      draftsHandler([
        {
          barcode: '0850000000017',
          shots: ['front', 'back'],
          lastModified: '2026-09-17T17:01:00.000Z',
        },
      ]),
      http.get('/v1/retail/categories', () => HttpResponse.json([])),
      http.post('/v1/retail/products', async ({ request }) => {
        createBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            slug: 'raw-0850000000017',
            title: '0850000000017',
            priceCents: 0,
            active: false,
            sku: 'MK-DFT01',
          },
          { status: 201 },
        );
      }),
      http.post('/v1/retail/stock/receive', () =>
        HttpResponse.json({ sku: 'MK-DFT01', onHand: 1 }),
      ),
    );
    const intake = useIntakeHandlers();
    renderScan();

    expect(await screen.findByText('Continue where you left off')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /0850000000017/ }));

    // Both shots already in the bucket — no capture screens, straight to the
    // stripped form with the barcode locked.
    expect(await screen.findByText(/New barcode:/)).toBeInTheDocument();
    expect(screen.queryByText(/mock-capture/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Barcode')).toHaveValue('0850000000017');
    expect(screen.getByLabelText('Barcode')).toBeDisabled();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Add product' }));
    expect(await screen.findByRole('button', { name: 'mock-detect' })).toBeInTheDocument(); // #25
    expect(screen.getByRole('status')).toHaveTextContent(
      '“0850000000017” was added — hidden until you publish it.',
    );
    expect(intake.presignBodies).toEqual([]); // nothing re-uploaded
    expect(createBody).toEqual({
      title: '0850000000017',
      priceCents: 0,
      barcode: '0850000000017',
      active: false,
    });
  });

  it('a one-shot draft resumes at the missing capture screen', async () => {
    server.use(
      draftsHandler([
        { barcode: '0850000000017', shots: ['front'], lastModified: '2026-09-17T17:01:00.000Z' },
      ]),
      http.get('/v1/retail/categories', () => HttpResponse.json([])),
    );
    const intake = useIntakeHandlers();
    renderScan();

    await userEvent.click(await screen.findByRole('button', { name: /0850000000017/ }));
    // The front shot exists — resume at the BACK capture.
    expect(await screen.findByText('mock-capture-back')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'mock-snap' }));
    expect(await screen.findByText(/New barcode:/)).toBeInTheDocument();
    await waitFor(() => expect(intake.puts).toEqual(['back']));
  });
});

describe('scan-path draft resume (#24)', () => {
  it('RE-SCANNING a fully-photographed barcode lands on the quantity form — no retakes', async () => {
    server.use(
      draftsHandler([
        {
          barcode: '0850024183209',
          shots: ['front', 'back'],
          lastModified: '2026-09-17T17:01:00.000Z',
        },
      ]),
      http.get('/v1/retail/categories', () => HttpResponse.json([])),
      http.get('/v1/retail/products/by-barcode/:code', () =>
        HttpResponse.json({ error: 'not_found' }, { status: 404 }),
      ),
      http.get('/v1/retail/barcode-info/:code', () => HttpResponse.json({})),
    );
    useIntakeHandlers();
    renderScan();
    await detectBarcode();

    // Straight to the stripped form — quantity is the only thing to touch.
    expect(await screen.findByText(/New barcode:/)).toBeInTheDocument();
    expect(screen.queryByText(/mock-capture/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Barcode')).toBeDisabled();
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add product' })).toBeEnabled();
  });

  it('RE-SCANNING a half-photographed barcode resumes at the missing shot', async () => {
    server.use(
      draftsHandler([
        { barcode: '0850024183209', shots: ['front'], lastModified: '2026-09-17T17:01:00.000Z' },
      ]),
      http.get('/v1/retail/categories', () => HttpResponse.json([])),
      http.get('/v1/retail/products/by-barcode/:code', () =>
        HttpResponse.json({ error: 'not_found' }, { status: 404 }),
      ),
      http.get('/v1/retail/barcode-info/:code', () => HttpResponse.json({})),
    );
    useIntakeHandlers();
    renderScan();
    await detectBarcode();

    // The front shot exists in the bucket — resume at the BACK capture only.
    expect(await screen.findByText('mock-capture-back')).toBeInTheDocument();
    expect(screen.queryByText('mock-capture-front')).not.toBeInTheDocument();
  });
});

describe('scan → receive (known barcode)', () => {
  it('goes straight to the receive card and posts the adjustment', async () => {
    let received: unknown = null;
    server.use(
      draftsHandler(),
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

    // One-tap finish (#25): the successful Receive IS the exit.
    expect(await screen.findByRole('button', { name: 'mock-detect' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Received 3 × “Test Balm”.');
    expect(received).toEqual({ sku: 'MK-TEST01', qty: 3 });
  });
});

describe('zero-tap scan entry (#18a)', () => {
  it('opens the scanner immediately — no Scan button, no Cancel', async () => {
    server.use(
      draftsHandler(),
      http.get('/v1/retail/categories', () => HttpResponse.json([])),
    );
    renderScan();
    expect(await screen.findByRole('button', { name: 'mock-detect' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Scan barcode' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'mock-cancel' })).not.toBeInTheDocument();
  });

  it('one tap: Receive alone returns to the live scanner — no Scan next/Done panel (#25)', async () => {
    server.use(
      draftsHandler(),
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

    // Back on the live scanner, success banner riding above it — the
    // "Received ✓" panel is gone; no second tap ever happened.
    expect(await screen.findByRole('button', { name: 'mock-detect' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Received 3 × “Test Balm”.');
    expect(screen.queryByText(/Received 3 ✓/)).not.toBeInTheDocument();
  });
});
