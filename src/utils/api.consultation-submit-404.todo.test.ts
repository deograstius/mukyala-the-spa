/**
 * Unit tests for the consultation-submit 404 fix
 * (chunk: `consultation-submit-404-fix-2026-04-26`).
 *
 * Naming: `*.todo.test.ts` mirrors the existing pattern
 *         (e.g. `config.staging-api-host.todo.test.ts`). Filename retained
 *         for cross-stage HANDOFF traceability after the architect/implementer
 *         scaffolded it; the body is now real, passing assertions.
 *
 * Mocking pattern: matches `managePreferencesApi.test.ts` — `vi.stubGlobal`
 * on `fetch` to intercept low-level requests, and `vi.stubEnv` /
 * `vi.resetModules()` for env-driven `API_BASE_URL` cases (mirrors
 * `config.staging-api-host.todo.test.ts`).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type { ConsultationSubmitRequest } from '@features/consultation/schema';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SUBMIT_PATH = '/v1/consultations';

type FetchInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

type CapturedFetchCall = { url: string; init: FetchInit };

function makeFetchMock(response: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  body?: string;
}): { fetchMock: ReturnType<typeof vi.fn>; calls: CapturedFetchCall[] } {
  const calls: CapturedFetchCall[] = [];
  const fetchMock = vi.fn(async (url: string, init?: FetchInit) => {
    calls.push({ url, init: init ?? {} });
    return {
      ok: response.ok ?? true,
      status: response.status ?? 200,
      statusText: response.statusText ?? 'OK',
      text: async () => response.body ?? '',
    } as unknown as Response;
  });
  return { fetchMock, calls };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

// ---------------------------------------------------------------------------
// 1) Relative-path POST construction in api.ts
// ---------------------------------------------------------------------------
describe('apiPost — relative URL construction in dev (consultation-submit 404 fix)', () => {
  beforeEach(() => {
    // Force the localhost fallback path in `src/app/config.ts`:
    //   - VITE_API_BASE_URL unset -> normalizeApiBaseUrl returns undefined
    //   - location.hostname === 'localhost' -> defaultApiBaseUrlFromHost returns undefined
    // Combined: `API_BASE_URL` is `undefined`, so `apiPost` builds a
    // same-origin RELATIVE URL — exactly what the Vite `/v1` proxy intercepts.
    vi.stubEnv('VITE_API_BASE_URL', '');
    vi.stubGlobal('location', { hostname: 'localhost' } as Location);
  });

  it('apiPost("/v1/consultations") posts to the same-origin relative URL when API_BASE_URL is undefined (localhost dev)', async () => {
    const { fetchMock, calls } = makeFetchMock({
      ok: true,
      status: 200,
      body: JSON.stringify({ submission_id: 'sub_1', received_at: '2026-04-26T00:00:00Z' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { apiPost } = await import('./api');
    await apiPost(SUBMIT_PATH, { form_id: 'intake' });

    expect(calls).toHaveLength(1);
    const url = calls[0]!.url;

    // Relative path: no scheme, no host, no port. Starts with `/v1/`.
    expect(url).toBe('/v1/consultations');
    expect(url.startsWith('/')).toBe(true);
    expect(url).not.toMatch(/^https?:\/\//);
    expect(url).not.toContain(':4000');
    expect(url).not.toContain(':5173');
    expect(url).not.toContain('localhost');

    // Method + body shape sanity (avoid silent regressions in apiPost wiring).
    expect(calls[0]!.init.method).toBe('POST');
    expect(calls[0]!.init.body).toBe(JSON.stringify({ form_id: 'intake' }));
  });

  it('apiPost preserves a leading slash and does NOT collapse to "//" when API_BASE_URL is undefined', async () => {
    const { fetchMock, calls } = makeFetchMock({ ok: true, status: 200, body: '{}' });
    vi.stubGlobal('fetch', fetchMock);

    const { apiPost } = await import('./api');

    // Leading-slash input -> exact same path on the wire.
    await apiPost('/v1/consultations', { ping: true });
    expect(calls[0]!.url).toBe('/v1/consultations');
    expect(calls[0]!.url).not.toMatch(/^\/\//);

    // Non-leading-slash input -> still a single-leading-slash path
    // (this is the `path.startsWith('/') ? path : `/${path}`` branch).
    await apiPost('v1/consultations', { ping: true });
    expect(calls[1]!.url).toBe('/v1/consultations');
    expect(calls[1]!.url).not.toMatch(/^\/\//);
  });
});

// ---------------------------------------------------------------------------
// 2) Schema-correct submit payload
// ---------------------------------------------------------------------------
describe('apiPost — consultation submit payload + headers (MD §11)', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    vi.stubGlobal('location', { hostname: 'localhost' } as Location);
  });

  it('apiPost serializes the consultation submit payload per MD §11 (form_id="intake", payload, signatures, attachments)', async () => {
    const { fetchMock, calls } = makeFetchMock({
      ok: true,
      status: 200,
      body: JSON.stringify({ submission_id: 'sub_2', received_at: '2026-04-26T00:00:00Z' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { apiPost } = await import('./api');
    const { createEmptyDraft, flattenDraftForSubmit, CONSULTATION_FORM_ID } = await import(
      '@features/consultation/schema'
    );

    // Build a minimum-valid Steps 1–5 + Step 6 signature draft.
    const draft = createEmptyDraft();
    draft.personal.client_name = 'Jane Doe';
    draft.personal.home_address = '1 Test Street';
    draft.personal.phone = '+15551234567';
    draft.personal.email = 'jane@example.com';
    draft.personal.dob_day = '15';
    draft.personal.dob_month = '06';
    draft.personal.dob_year = '1990';
    // Step 4 health booleans all answered (defaults: all `false` is acceptable).
    for (const k of Object.keys(draft.health) as Array<keyof typeof draft.health>) {
      const cur = draft.health[k];
      if (cur === null) {
        // every required boolean answered no
        (draft.health as unknown as Record<string, unknown>)[k] = false;
      }
    }
    // Step 5: not applicable -> step skipped.
    draft.females_only.applicable = false;
    // Step 6: typed name + attest + date.
    draft.signature.print_name = 'Jane Doe';
    draft.signature.attested = true;
    draft.signature.date = '2026-04-26';

    const idempotencyKey = '11111111-2222-4333-8444-555555555555';
    const clientSessionId = '99999999-8888-4777-8666-555555555555';
    const submittedAt = '2026-04-26T12:00:00Z';

    const submitBody: ConsultationSubmitRequest = {
      form_id: CONSULTATION_FORM_ID,
      submitted_at: submittedAt,
      client_session_id: clientSessionId,
      payload: flattenDraftForSubmit(draft),
      signatures: [
        {
          field: 'signature.client',
          method: 'typed',
          typed_name: draft.signature.print_name,
          attested: true,
          signed_at: submittedAt,
        },
      ],
      attachments: [],
    };

    await apiPost(SUBMIT_PATH, submitBody as unknown as Record<string, unknown>, {
      headers: {
        'Idempotency-Key': idempotencyKey,
        'X-Client-Session-Id': clientSessionId,
      },
    });

    expect(calls).toHaveLength(1);
    const { url, init } = calls[0]!;

    // URL: relative `/v1/consultations`.
    expect(url).toBe('/v1/consultations');
    expect(init.method).toBe('POST');

    // Headers: content-type + Idempotency-Key + X-Client-Session-Id all forwarded.
    expect(init.headers).toMatchObject({
      accept: 'application/json',
      'content-type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      'X-Client-Session-Id': clientSessionId,
    });

    // Body: round-trip via JSON.parse and check the contract surface.
    const parsed = JSON.parse(init.body!) as Record<string, unknown>;
    expect(parsed.form_id).toBe('intake');
    expect(parsed.client_session_id).toBe(clientSessionId);
    expect(parsed.submitted_at).toBe(submittedAt);
    expect(parsed.attachments).toEqual([]);

    // Payload: flat dotted keys (MD §11) — spot-check the required ones.
    const payload = parsed.payload as Record<string, unknown>;
    expect(payload['personal.client_name']).toBe('Jane Doe');
    expect(payload['personal.email']).toBe('jane@example.com');
    expect(payload['signature.print_name']).toBe('Jane Doe');
    expect(payload['signature.attested']).toBe(true);
    expect(payload['signature.date']).toBe('2026-04-26');

    // Signatures: typed-name variant.
    const signatures = parsed.signatures as Array<Record<string, unknown>>;
    expect(signatures).toHaveLength(1);
    expect(signatures[0]).toMatchObject({
      field: 'signature.client',
      method: 'typed',
      typed_name: 'Jane Doe',
      attested: true,
    });
  });
});

// ---------------------------------------------------------------------------
// 3) 200 response handling
// ---------------------------------------------------------------------------
describe('apiPost — 200 response handling', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    vi.stubGlobal('location', { hostname: 'localhost' } as Location);
  });

  it('apiPost resolves with the parsed JSON body on a 200 response and surfaces submission_id to the caller', async () => {
    const responseBody = {
      submission_id: 'sub_test_42',
      received_at: '2026-04-26T18:30:00Z',
    };
    const { fetchMock } = makeFetchMock({
      ok: true,
      status: 200,
      body: JSON.stringify(responseBody),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { apiPost } = await import('./api');
    const result = await apiPost<typeof responseBody>(SUBMIT_PATH, {
      form_id: 'intake',
    });

    // No shape mutation: api.ts returns the parsed body verbatim.
    expect(result).toEqual(responseBody);
    expect(result.submission_id).toBe('sub_test_42');
    expect(result.received_at).toBe('2026-04-26T18:30:00Z');
  });
});

// ---------------------------------------------------------------------------
// 4) 4xx error UI surface (ApiError shape — what the Step 6 review screen reads)
// 5) 5xx error UI surface (ApiError shape — server failure)
// ---------------------------------------------------------------------------
describe('apiPost — error responses surface ApiError', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    vi.stubGlobal('location', { hostname: 'localhost' } as Location);
  });

  it('apiPost throws ApiError with status/message/code/details on 4xx (validation) and 5xx (server) responses', async () => {
    // ---- 422 validation failure: full body with code + details ----
    const { fetchMock: fetch422 } = makeFetchMock({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      body: JSON.stringify({
        message: 'invalid',
        code: 'validation_failed',
        details: { field: 'personal.email' },
      }),
    });
    vi.stubGlobal('fetch', fetch422);

    let { apiPost, ApiError } = await import('./api');

    await expect(apiPost(SUBMIT_PATH, { form_id: 'intake' })).rejects.toBeInstanceOf(ApiError);

    // Re-run to inspect the rejection value (consumed by the prior assertion).
    const { fetchMock: fetch422b } = makeFetchMock({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      body: JSON.stringify({
        message: 'invalid',
        code: 'validation_failed',
        details: { field: 'personal.email' },
      }),
    });
    vi.unstubAllGlobals();
    vi.stubGlobal('location', { hostname: 'localhost' } as Location);
    vi.stubGlobal('fetch', fetch422b);
    vi.resetModules();
    ({ apiPost, ApiError } = await import('./api'));

    await expect(apiPost(SUBMIT_PATH, { form_id: 'intake' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
      message: 'invalid',
      code: 'validation_failed',
      details: { field: 'personal.email' },
    });

    // ---- 500 with an empty body: message falls back to res.statusText ----
    const { fetchMock: fetch500 } = makeFetchMock({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      body: '',
    });
    vi.unstubAllGlobals();
    vi.stubGlobal('location', { hostname: 'localhost' } as Location);
    vi.stubGlobal('fetch', fetch500);
    vi.resetModules();
    ({ apiPost, ApiError } = await import('./api'));

    await expect(apiPost(SUBMIT_PATH, { form_id: 'intake' })).rejects.toBeInstanceOf(ApiError);

    const { fetchMock: fetch500b } = makeFetchMock({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      body: '',
    });
    vi.unstubAllGlobals();
    vi.stubGlobal('location', { hostname: 'localhost' } as Location);
    vi.stubGlobal('fetch', fetch500b);
    vi.resetModules();
    ({ apiPost, ApiError } = await import('./api'));

    await expect(apiPost(SUBMIT_PATH, { form_id: 'intake' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      message: 'Internal Server Error',
    });
  });
});

// ---------------------------------------------------------------------------
// 6) Proxy-resolved URL in dev mode (vite.config.ts shape contract)
// ---------------------------------------------------------------------------
describe('Vite dev `/v1` proxy — wires relative SPA fetches to mukyala-core-api', () => {
  it('in dev, the Vite `/v1` proxy resolves the relative URL to the local mukyala-core-api (port 4000)', () => {
    // Read `vite.config.ts` source as text (cheaper + more robust than
    // dynamically `loadConfigFromFile`-ing it under jsdom). Architect note
    // explicitly allows this shape-level assertion at the unit-test layer.
    const cfgPath = path.resolve(__dirname, '../../vite.config.ts');
    const src = fs.readFileSync(cfgPath, 'utf8');

    // 1) `server.proxy['/v1']` block exists.
    expect(src).toMatch(/server\s*:\s*\{[\s\S]*proxy\s*:\s*\{[\s\S]*['"]\/v1['"]/);

    // 2) Target is the local core-api at port 4000.
    expect(src).toMatch(/target\s*:\s*['"]http:\/\/localhost:4000['"]/);

    // 3) `changeOrigin: true` is set (required so the upstream sees its own host).
    expect(src).toMatch(/changeOrigin\s*:\s*true/);

    // 4) No path rewrite — `/v1/consultations` must hit `/v1/consultations`
    //    on the upstream. (The implementer's vite.config.ts does NOT define
    //    `rewrite` for the `/v1` rule; assert that explicitly.)
    const proxyBlockMatch = src.match(/['"]\/v1['"]\s*:\s*\{[\s\S]*?\n\s*\}\s*,?\s*\n\s*\}\s*,/);
    expect(proxyBlockMatch).not.toBeNull();
    const proxyBlock = proxyBlockMatch?.[0] ?? '';
    expect(proxyBlock).not.toMatch(/rewrite\s*:/);
  });
});
