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

/**
 * Best-effort human label for a slug when the catalog no longer has the row
 * (e.g. a cart entry for a product that was deactivated).
 * "b5-hydrating-serum" -> "B5 hydrating serum"
 */
export function humanizeSlug(slug: string): string {
  const words = slug.replace(/-/g, ' ').trim();
  if (!words) return slug;
  return words.charAt(0).toUpperCase() + words.slice(1);
}
