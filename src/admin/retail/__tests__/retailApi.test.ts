import { afterEach, describe, expect, it } from 'vitest';
import { server, http, HttpResponse } from '../../../test/msw.server';
import { ApiError } from '../../../utils/api';
import {
  fetchBarcodeInfo,
  fetchRetailProductByBarcode,
  getRetailToken,
  isAuthError,
  retailLogin,
  setRetailToken,
} from '../retailApi';

const TOKEN_KEY = 'retail:token:v1';

afterEach(() => {
  window.localStorage.removeItem(TOKEN_KEY);
});

describe('retail token storage', () => {
  it('stores, reads and clears the token', () => {
    expect(getRetailToken()).toBeNull();
    setRetailToken('tok-123');
    expect(getRetailToken()).toBe('tok-123');
    setRetailToken(null);
    expect(getRetailToken()).toBeNull();
  });
});

describe('retailLogin', () => {
  it('persists the returned token', async () => {
    server.use(
      http.post('/v1/retail/login', () =>
        HttpResponse.json({ token: 'tok-abc', username: 'abryemah' }),
      ),
    );
    const token = await retailLogin('abryemah', 'pw');
    expect(token).toBe('tok-abc');
    expect(getRetailToken()).toBe('tok-abc');
  });

  it('throws the API error message on bad credentials', async () => {
    server.use(
      http.post('/v1/retail/login', () =>
        HttpResponse.json(
          { error: 'invalid_credentials', message: 'Wrong username or password.' },
          { status: 401 },
        ),
      ),
    );
    await expect(retailLogin('abryemah', 'bad')).rejects.toThrow('Wrong username or password.');
    expect(getRetailToken()).toBeNull();
  });
});

describe('fetchRetailProductByBarcode', () => {
  it('returns the product on a match', async () => {
    server.use(
      http.get('/v1/retail/products/by-barcode/:code', () =>
        HttpResponse.json({
          slug: 'balm',
          title: 'Balm',
          priceCents: 100,
          active: true,
          stock: null,
        }),
      ),
    );
    const p = await fetchRetailProductByBarcode('0850024183209');
    expect(p?.slug).toBe('balm');
  });

  it('returns null on 404 instead of throwing', async () => {
    server.use(
      http.get('/v1/retail/products/by-barcode/:code', () =>
        HttpResponse.json({ error: 'not_found' }, { status: 404 }),
      ),
    );
    await expect(fetchRetailProductByBarcode('0000000000000')).resolves.toBeNull();
  });

  it('rethrows non-404 errors (so auth expiry can be handled)', async () => {
    server.use(
      http.get('/v1/retail/products/by-barcode/:code', () =>
        HttpResponse.json({ error: 'unauthorized' }, { status: 401 }),
      ),
    );
    await expect(fetchRetailProductByBarcode('0850024183209')).rejects.toSatisfy((e) =>
      isAuthError(e),
    );
  });
});

describe('fetchBarcodeInfo', () => {
  it('returns {} when the request fails (best-effort hints)', async () => {
    server.use(http.get('/v1/retail/barcode-info/:code', () => HttpResponse.error()));
    await expect(fetchBarcodeInfo('123456')).resolves.toEqual({});
  });
});

describe('isAuthError', () => {
  it('is true only for 401 ApiErrors', () => {
    expect(isAuthError(new ApiError(401, 'no'))).toBe(true);
    expect(isAuthError(new ApiError(404, 'missing'))).toBe(false);
    expect(isAuthError(new Error('nope'))).toBe(false);
  });
});
