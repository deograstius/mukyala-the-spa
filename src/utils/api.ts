import { API_BASE_URL } from '@app/config';

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

type ErrorBody =
  | {
      message?: string;
      code?: string;
      details?: unknown;
    }
  | null
  | undefined;

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function buildUrl(path: string): string {
  const base = API_BASE_URL || '';
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorParts(
  body: unknown,
  fallbackStatusText: string,
): { message: string; code?: string; details?: unknown } {
  const eb = (body as ErrorBody) || undefined;
  const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
  const msg =
    isObj(eb) && typeof (eb as { message?: unknown }).message === 'string'
      ? (eb as { message: string }).message
      : fallbackStatusText || 'Request failed';
  const code = isObj(eb) && 'code' in eb ? (eb as { code?: string }).code : undefined;
  const details = isObj(eb) && 'details' in eb ? (eb as { details?: unknown }).details : undefined;
  return { message: msg, code, details };
}

export async function apiGet<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: 'GET',
    headers: {
      accept: 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });
  const body = await parseJson(res);
  if (!res.ok) {
    const { message, code, details } = getErrorParts(body, res.statusText);
    throw new ApiError(res.status, message, code, details);
  }
  return body as T;
}

export async function apiPost<T = unknown, B extends Json = Json>(
  path: string,
  payload?: B,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      ...(init?.headers || {}),
    },
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
    ...init,
  });
  const body = await parseJson(res);
  if (!res.ok) {
    const { message, code, details } = getErrorParts(body, res.statusText);
    throw new ApiError(res.status, message, code, details);
  }
  return body as T;
}
