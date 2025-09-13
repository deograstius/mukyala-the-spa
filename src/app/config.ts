type Env = {
  VITE_API_BASE_URL?: string;
};

const env = import.meta.env as unknown as Env;

export const API_BASE_URL: string | undefined = (() => {
  const url = env.VITE_API_BASE_URL?.trim();
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.toString().replace(/\/$/, '');
  } catch {
    return undefined;
  }
})();

export function requireApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not set or invalid');
  }
  return API_BASE_URL;
}

