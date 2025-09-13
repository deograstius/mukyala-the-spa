import { API_BASE_URL } from '@app/config';

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

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

async function parseJson(res: Response) {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiGet<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });
  const body = await parseJson(res);
  if (!res.ok) {
    const msg = (body && (body as any).message) || res.statusText || 'Request failed';
    throw new ApiError(res.status, msg, (body as any)?.code, (body as any)?.details);
  }
  return body as T;
}

export async function apiPost<T = unknown, B extends Json = Json>(path: string, payload?: B, init?: RequestInit): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json',
      ...(init?.headers || {}),
    },
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
    ...init,
  });
  const body = await parseJson(res);
  if (!res.ok) {
    const msg = (body && (body as any).message) || res.statusText || 'Request failed';
    throw new ApiError(res.status, msg, (body as any)?.code, (body as any)?.details);
  }
  return body as T;
}

