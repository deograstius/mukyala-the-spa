import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server, http, HttpResponse } from '../../test/msw.server';
import Retail from '../Retail';

// The real scanner needs a camera + the zxing WASM decoder; the page flow is
// what these tests cover, so the scanner is a stub that "detects" on click.
vi.mock('../../features/retail/BarcodeScanner', () => ({
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
  barcode: null,
  description: null,
  categoryId: 'cat-1',
  category: { slug: 'balms', title: 'Balms' },
  stock: { sku: 'MK-TEST01', onHand: 9, reserved: 0, committed: 0, available: 9 },
};

const serum = {
  slug: 'loose-serum',
  title: 'Loose Serum',
  priceCents: 5600,
  active: true,
  sku: 'MK-SER01',
  barcode: null,
  description: null,
  categoryId: null,
  category: null,
  stock: null,
};

function useRetailHandlers() {
  server.use(
    http.get('/v1/retail/products', () => HttpResponse.json([balm, serum])),
    http.get('/v1/retail/categories', () =>
      HttpResponse.json([{ id: 'cat-1', slug: 'balms', title: 'Balms', position: 0 }]),
    ),
  );
}

beforeEach(() => {
  window.localStorage.removeItem(TOKEN_KEY);
});

describe('Retail login', () => {
  it('shows the login form when logged out, with the username prefilled', () => {
    render(<Retail />);
    expect(screen.getByLabelText('Username')).toHaveValue('abryemah');
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
  });

  it('surfaces the API error message on failed login', async () => {
    server.use(
      http.post('/v1/retail/login', () =>
        HttpResponse.json(
          { error: 'invalid_credentials', message: 'Wrong username or password.' },
          { status: 401 },
        ),
      ),
    );
    render(<Retail />);
    await userEvent.type(screen.getByLabelText('Password'), 'bad');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong username or password.');
  });

  it('logs in and shows the dashboard grouped by category', async () => {
    useRetailHandlers();
    server.use(
      http.post('/v1/retail/login', () => HttpResponse.json({ token: 't1', username: 'abryemah' })),
    );
    render(<Retail />);
    await userEvent.type(screen.getByLabelText('Password'), 'pw');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Test Balm')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scan barcode' })).toBeInTheDocument();
    // Grouping: category heading + uncategorized bucket label.
    expect(screen.getByRole('heading', { name: 'Balms' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Uncategorized' })).toBeInTheDocument();
    expect(screen.getByText(/In stock: 9 available/)).toBeInTheDocument();
  });
});

describe('Retail dashboard auth expiry', () => {
  it('drops back to the login screen when the API returns 401', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'stale-token');
    server.use(
      http.get('/v1/retail/products', () =>
        HttpResponse.json({ error: 'unauthorized' }, { status: 401 }),
      ),
      http.get('/v1/retail/categories', () =>
        HttpResponse.json({ error: 'unauthorized' }, { status: 401 }),
      ),
    );
    render(<Retail />);
    expect(await screen.findByLabelText('Password')).toBeInTheDocument();
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

describe('Retail scan flow', () => {
  beforeEach(() => {
    window.localStorage.setItem(TOKEN_KEY, 'valid-token');
  });

  it('unknown barcode: prefills the whole create form from the database hint', async () => {
    useRetailHandlers();
    server.use(
      http.get('/v1/retail/products/by-barcode/:code', () =>
        HttpResponse.json({ error: 'not_found' }, { status: 404 }),
      ),
      http.get('/v1/retail/barcode-info/:code', () =>
        HttpResponse.json({
          title: 'ZAQ Noor LED Mask',
          brand: 'ZAQ',
          category: 'Health & Beauty > Balms',
          description: 'LED therapy at home.',
          imageUrl: 'https://images.example/mask.jpg',
          suggestedPriceCents: 34999,
        }),
      ),
    );
    render(<Retail />);
    await userEvent.click(await screen.findByRole('button', { name: 'Scan barcode' }));
    await userEvent.click(screen.getByRole('button', { name: 'mock-detect' }));

    expect(await screen.findByText(/New barcode:/)).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('ZAQ Noor LED Mask');
    expect(screen.getByLabelText('Price (USD)')).toHaveValue('349.99');
    expect(screen.getByLabelText('Description')).toHaveValue('LED therapy at home.');
    // "Balms" exists and matches the hint path → auto-selected.
    expect(screen.getByLabelText('Category')).toHaveValue('cat-1');
    expect(screen.getByRole('button', { name: 'Approve & add to shop' })).toBeInTheDocument();
  });

  it('unknown barcode with an unmatched category: auto-creates it from the path tail', async () => {
    let createdTitle = '';
    useRetailHandlers();
    server.use(
      http.get('/v1/retail/products/by-barcode/:code', () =>
        HttpResponse.json({ error: 'not_found' }, { status: 404 }),
      ),
      http.get('/v1/retail/barcode-info/:code', () =>
        HttpResponse.json({
          title: 'New Thing',
          category: 'Health & Beauty > Skin Care Masks & Peels',
        }),
      ),
      http.post('/v1/retail/categories', async ({ request }) => {
        const body = (await request.json()) as { title: string };
        createdTitle = body.title;
        return HttpResponse.json(
          { id: 'cat-new', slug: 'skin-care-masks-peels', title: body.title, position: 1 },
          { status: 201 },
        );
      }),
    );
    render(<Retail />);
    await userEvent.click(await screen.findByRole('button', { name: 'Scan barcode' }));
    await userEvent.click(screen.getByRole('button', { name: 'mock-detect' }));

    await screen.findByText(/New barcode:/);
    expect(createdTitle).toBe('Skin Care Masks & Peels');
    await waitFor(() => expect(screen.getByLabelText('Category')).toHaveValue('cat-new'));
  });

  it('known barcode: goes straight to the receive card and posts the adjustment', async () => {
    let received: unknown = null;
    useRetailHandlers();
    server.use(
      http.get('/v1/retail/products/by-barcode/:code', () =>
        HttpResponse.json({ ...balm, barcode: '0850024183209' }),
      ),
      http.post('/v1/retail/stock/receive', async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ sku: balm.sku, onHand: 12 });
      }),
    );
    render(<Retail />);
    await userEvent.click(await screen.findByRole('button', { name: 'Scan barcode' }));
    await userEvent.click(screen.getByRole('button', { name: 'mock-detect' }));

    expect(await screen.findByRole('heading', { name: 'Test Balm' })).toBeInTheDocument();
    const qty = screen.getByLabelText('Receive quantity for Test Balm');
    await userEvent.clear(qty);
    await userEvent.type(qty, '3');
    await userEvent.click(screen.getByRole('button', { name: 'Receive' }));

    expect(await screen.findByText(/Received 3/)).toBeInTheDocument();
    expect(received).toEqual({ sku: 'MK-TEST01', qty: 3 });
  });
});
