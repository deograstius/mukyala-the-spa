/**
 * Env-aware link back to the customer site (spec decision #4). Staging and
 * local dev both point at the staging site — the safe default for anything
 * that isn't the prod admin host.
 */
export function mainWebsiteUrl(): string {
  const host = globalThis.location?.hostname?.toLowerCase() ?? '';
  if (host === 'admin.mukyala.com') return 'https://www.mukyala.com';
  return 'https://staging.mukyala.com';
}
