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
  /** Home-page featured section membership (#29; absent from older APIs). */
  homeFeatured?: boolean;
  sku?: string;
  barcode?: string | null;
  description?: string | null;
  /** When the item was scanned in (ISO; absent from pre-#20 API deploys). */
  createdAt?: string;
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
  /** false = staged for review (hidden from the shop) until staff publish. */
  active?: boolean;
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

export type AdjustReason = 'recount' | 'damaged' | 'other';

/**
 * Signed stock correction (recount, damage, mistake). The server rejects
 * corrections that would drive on-hand below zero (409 insufficient_stock).
 */
export async function adjustRetailStock(
  sku: string,
  delta: number,
  reason: AdjustReason,
): Promise<void> {
  await apiPost('/v1/retail/stock/adjust', { sku, delta, reason }, { headers: authHeaders() });
}

export async function patchRetailProduct(
  slug: string,
  patch: {
    title?: string;
    priceCents?: number;
    active?: boolean;
    homeFeatured?: boolean;
    barcode?: string | null;
    categoryId?: string | null;
    description?: string | null;
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

/**
 * Change the staff password (DB credential on core-api). A 401 here is
 * ambiguous: `invalid_credentials` means the CURRENT password was wrong (stay
 * signed in, show the message); `unauthorized` means the session token
 * expired — distinguish with isSessionExpiredError, not isAuthError.
 */
export async function changeRetailPassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await apiPost(
    '/v1/retail/change-password',
    { currentPassword, newPassword },
    { headers: authHeaders() },
  );
}

export type IntakeShot = 'front' | 'back';

/**
 * Canonical GTIN form (#23) — mirrors the server rule so client-side keys,
 * markers, and drafts all speak the same barcode: 12-digit UPC-A pads to its
 * 13-digit EAN form; everything else passes through.
 */
export function canonicalizeBarcode(code: string): string {
  const trimmed = code.trim();
  return /^[0-9]{12}$/.test(trimmed) ? `0${trimmed}` : trimmed;
}

export interface IntakeDraft {
  barcode: string;
  shots: IntakeShot[];
  lastModified: string;
}

/**
 * Unfinished photo-flow items (#23): barcodes with intake photos but no
 * product yet — "continue where you left off" on the scan page. Derived
 * server-side from the bucket, so it's account-wide and never stale.
 */
export async function fetchIntakeDrafts(): Promise<IntakeDraft[]> {
  const res = await apiGet<{ drafts: IntakeDraft[] }>('/v1/retail/intake-drafts', {
    headers: authHeaders(),
  });
  return res.drafts;
}

/**
 * Presigned PUT targets for the intake photos taken during scan-create
 * (front + back/ingredients shots). Keys are deterministic per barcode so the
 * downstream enrichment pipeline finds them without a database.
 */
export async function createIntakeUploadUrls(
  barcode: string,
  shots: Array<{ shot: IntakeShot; contentType: string }>,
): Promise<Array<{ shot: IntakeShot; key: string; uploadUrl: string }>> {
  const res = await apiPost<{
    uploads: Array<{ shot: IntakeShot; key: string; uploadUrl: string }>;
  }>('/v1/retail/intake-uploads', { barcode, shots }, { headers: authHeaders() });
  return res.uploads;
}

/** Raw PUT to the presigned URL — S3 direct, no API base, no auth header. */
export async function uploadIntakePhoto(uploadUrl: string, file: Blob): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': file.type || 'image/jpeg' },
    body: file,
  });
  if (!res.ok) {
    throw new ApiError(res.status, 'Photo upload failed — check the connection and retry.');
  }
}

export function isAuthError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

/** True only for an expired/invalid session token, not a wrong password. */
export function isSessionExpiredError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401 && err.code === 'unauthorized';
}
