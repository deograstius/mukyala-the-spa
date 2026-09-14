import { ApiError, apiGet, apiPost, buildUrl } from '@utils/api';

/**
 * Client for the staff-only retail back-office API (core-api /v1/retail/*).
 * The bearer token lives in localStorage for the length of a shift (the API
 * token itself expires after 12h server-side).
 */

const TOKEN_KEY = 'retail:token:v1';

export type RetailStock = {
  sku: string;
  onHand: number;
  reserved: number;
  committed: number;
  available: number;
} | null;

export interface RetailProduct {
  slug: string;
  title: string;
  priceCents: number;
  image?: string;
  active: boolean;
  sku?: string;
  barcode?: string | null;
  description?: string | null;
  categoryId?: string | null;
  category?: { slug: string; title: string } | null;
  stock: RetailStock;
}

export interface RetailCategory {
  id: string;
  slug: string;
  title: string;
  position: number;
}

/** Hints from the commercial barcode database for an unknown barcode. */
export interface BarcodeInfo {
  title?: string;
  brand?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  suggestedPriceCents?: number;
}

export function getRetailToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setRetailToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Private-mode storage failures just mean re-login next visit.
  }
}

function authHeaders(): Record<string, string> {
  const token = getRetailToken();
  return token ? { authorization: `Bearer ${token}` } : {};
}

export async function retailLogin(username: string, password: string): Promise<string> {
  const res = await apiPost<{ token: string }>('/v1/retail/login', { username, password });
  setRetailToken(res.token);
  return res.token;
}

export async function fetchRetailProducts(): Promise<RetailProduct[]> {
  return apiGet<RetailProduct[]>('/v1/retail/products', { headers: authHeaders() });
}

export async function createRetailProduct(input: {
  title: string;
  priceCents: number;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  imageUrl?: string;
  description?: string;
}): Promise<RetailProduct> {
  return apiPost<RetailProduct>('/v1/retail/products', input, { headers: authHeaders() });
}

export async function fetchRetailCategories(): Promise<RetailCategory[]> {
  return apiGet<RetailCategory[]>('/v1/retail/categories', { headers: authHeaders() });
}

export async function createRetailCategory(title: string): Promise<RetailCategory> {
  return apiPost<RetailCategory>('/v1/retail/categories', { title }, { headers: authHeaders() });
}

/** Resolve a scanned barcode to a product, or null when nothing matches. */
export async function fetchRetailProductByBarcode(code: string): Promise<RetailProduct | null> {
  try {
    return await apiGet<RetailProduct>(
      `/v1/retail/products/by-barcode/${encodeURIComponent(code)}`,
      { headers: authHeaders() },
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Product hints (name/brand/category/photo) for an unknown barcode. */
export async function fetchBarcodeInfo(code: string): Promise<BarcodeInfo> {
  try {
    return await apiGet<BarcodeInfo>(`/v1/retail/barcode-info/${encodeURIComponent(code)}`, {
      headers: authHeaders(),
    });
  } catch {
    return {};
  }
}

export async function receiveRetailStock(sku: string, qty: number): Promise<void> {
  await apiPost('/v1/retail/stock/receive', { sku, qty }, { headers: authHeaders() });
}

export async function patchRetailProduct(
  slug: string,
  patch: {
    title?: string;
    priceCents?: number;
    active?: boolean;
    barcode?: string | null;
    categoryId?: string | null;
  },
): Promise<void> {
  const res = await fetch(buildUrl(`/v1/retail/products/${encodeURIComponent(slug)}`), {
    method: 'PATCH',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // keep statusText
    }
    throw new ApiError(res.status, message);
  }
}

export function isAuthError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}
