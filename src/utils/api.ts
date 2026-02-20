import { API_BASE_URL } from '@app/config';
import { getAnonymousId, getSessionId } from '@app/telemetry';

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

type ErrorBody =
  | {
      message?: string;
      error?: string;
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

function getTelemetryJoinHeaders(): HeadersInit {
  try {
    return {
      'x-mukyala-anonymous-id': getAnonymousId(),
      'x-mukyala-session-id': getSessionId(),
    };
  } catch {
    return {};
  }
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
      : isObj(eb) && typeof (eb as { error?: unknown }).error === 'string'
        ? (eb as { error: string }).error
        : fallbackStatusText || 'Request failed';

  const code =
    isObj(eb) && typeof (eb as { code?: unknown }).code === 'string'
      ? (eb as { code: string }).code
      : isObj(eb) && typeof (eb as { error?: unknown }).error === 'string'
        ? (eb as { error: string }).error
        : undefined;

  let details: unknown = undefined;
  if (isObj(eb) && 'details' in eb) {
    details = (eb as { details?: unknown }).details;
  } else if (isObj(eb)) {
    const rest: Record<string, unknown> = { ...eb };
    delete rest.message;
    delete rest.code;
    delete rest.error;
    if (Object.keys(rest).length > 0) details = rest;
  }
  return { message: msg, code, details };
}

export async function apiGet<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const { headers: initHeaders, ...restInit } = init ?? {};
  const res = await fetch(buildUrl(path), {
    method: 'GET',
    headers: {
      accept: 'application/json',
      ...getTelemetryJoinHeaders(),
      ...(initHeaders || {}),
    },
    ...restInit,
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
  const hasPayload = payload !== undefined;
  const { headers: initHeaders, ...restInit } = init ?? {};
  const defaultHeaders: HeadersInit = {
    accept: 'application/json',
    ...(hasPayload ? { 'content-type': 'application/json' } : {}),
  };
  const headers: HeadersInit = {
    ...defaultHeaders,
    ...getTelemetryJoinHeaders(),
    ...(initHeaders || {}),
  };

  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers,
    body: hasPayload ? JSON.stringify(payload) : undefined,
    ...restInit,
  });
  const body = await parseJson(res);
  if (!res.ok) {
    const { message, code, details } = getErrorParts(body, res.statusText);
    throw new ApiError(res.status, message, code, details);
  }
  return body as T;
}
