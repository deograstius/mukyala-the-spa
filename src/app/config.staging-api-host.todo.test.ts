import { afterEach, describe, expect, it, vi } from 'vitest';

const UNSET = Symbol('UNSET');

type LoadConfigOptions = {
  hostname?: string;
  apiBaseUrl?: string | typeof UNSET;
};

async function loadConfig(options: LoadConfigOptions = {}) {
  vi.resetModules();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();

  const { hostname = 'localhost', apiBaseUrl = UNSET } = options;
  vi.stubGlobal('location', { hostname } as Location);

  if (apiBaseUrl !== UNSET) {
    vi.stubEnv('VITE_API_BASE_URL', apiBaseUrl);
  }

  return import('./config');
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('API base URL selection', () => {
  it('uses the staging API host when running on staging hostname and env is unset', async () => {
    const { API_BASE_URL } = await loadConfig({ hostname: 'staging.mukyala.com' });
    expect(API_BASE_URL).toBe('https://api.staging.mukyala.com');
  });

  it('maps production hostnames to api.mukyala.com', async () => {
    const fromWww = await loadConfig({ hostname: 'www.mukyala.com' });
    expect(fromWww.API_BASE_URL).toBe('https://api.mukyala.com');

    const fromApex = await loadConfig({ hostname: 'mukyala.com' });
    expect(fromApex.API_BASE_URL).toBe('https://api.mukyala.com');
  });

  it('prefers explicit VITE_API_BASE_URL and normalizes trailing slash/whitespace', async () => {
    const { API_BASE_URL } = await loadConfig({
      hostname: 'staging.mukyala.com',
      apiBaseUrl: ' https://api.staging.mukyala.com/ ',
    });

    expect(API_BASE_URL).toBe('https://api.staging.mukyala.com');
  });

  it('falls back to hostname defaults when VITE_API_BASE_URL is invalid or empty', async () => {
    const invalid = await loadConfig({
      hostname: 'staging.mukyala.com',
      apiBaseUrl: 'not-a-url',
    });
    expect(invalid.API_BASE_URL).toBe('https://api.staging.mukyala.com');

    const empty = await loadConfig({
      hostname: 'staging.mukyala.com',
      apiBaseUrl: '   ',
    });
    expect(empty.API_BASE_URL).toBe('https://api.staging.mukyala.com');
  });

  it('keeps localhost/dev same-origin behavior and throws when API base is required', async () => {
    const config = await loadConfig({ hostname: 'localhost' });

    expect(config.API_BASE_URL).toBeUndefined();
    expect(() => config.requireApiBaseUrl()).toThrowError(
      'VITE_API_BASE_URL is not set or invalid',
    );
  });
});
