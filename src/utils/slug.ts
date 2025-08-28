/**
 * Extracts the last non-empty segment from an href/path.
 * Examples:
 *  - "/shop/baobab-peptide" -> "baobab-peptide"
 *  - "services/rooibos-radiance-facial" -> "rooibos-radiance-facial"
 */
export function getSlugFromHref(href: string): string {
  const parts = href.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}
