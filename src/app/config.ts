type Env = {
  VITE_API_BASE_URL?: string;
};

const env = import.meta.env as unknown as Env;

function normalizeApiBaseUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.toString().replace(/\/$/, '');
  } catch {
    return undefined;
  }
}

function defaultApiBaseUrlFromHost(): string | undefined {
  const host = globalThis.location?.hostname?.toLowerCase();
  if (!host || host === 'localhost' || host === '127.0.0.1') return undefined;
  if (host === 'staging.mukyala.com' || host.endsWith('.staging.mukyala.com')) {
    return 'https://api.staging.mukyala.com';
  }
  if (host === 'www.mukyala.com' || host === 'mukyala.com') {
    return 'https://api.mukyala.com';
  }
  return undefined;
}

export const API_BASE_URL: string | undefined = (() => {
  const configuredBaseUrl = normalizeApiBaseUrl(env.VITE_API_BASE_URL?.trim());
  if (configuredBaseUrl) return configuredBaseUrl;
  return defaultApiBaseUrlFromHost();
})();

export function requireApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not set or invalid');
  }
  return API_BASE_URL;
}
