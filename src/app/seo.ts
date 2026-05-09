import { formatTitle } from '../data/site';

export function setTitle(title: string) {
  if (typeof document !== 'undefined') {
    document.title = title;
  }
}

export function setBaseTitle(page: string) {
  setTitle(formatTitle(page));
}

/**
 * Per-route head metadata applied at runtime.
 *
 * `index.html` ships a global set of OG/Twitter/canonical/<title> tags. CSR
 * routes that want per-route overrides call `setRouteMeta(...)` from a
 * useEffect to mutate the document head. Prerendered routes can still rely on
 * the static tags or use TanStack Router's `head: () => ({ meta, links })`.
 */
export type RouteMeta = {
  /** <title> for this route. Pass already-formatted (use formatTitle if needed). */
  title?: string;
  /** <meta name="description"> for this route. Keep <= 160 chars. */
  description?: string;
  /** <link rel="canonical"> absolute URL. */
  canonical?: string;
  /** Absolute URL for og:image / twitter:image override. */
  ogImage?: string;
  /** Optional alt text for og:image:alt / twitter:image:alt. */
  ogImageAlt?: string;
};

function upsertMetaByName(name: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertMetaByProperty(property: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Apply per-route head metadata.
 *
 * Contract:
 * - Idempotent: calling with the same input twice produces the same DOM.
 * - Partial input does NOT clobber unrelated tags. Only the keys present on
 *   `meta` are touched. Tags not addressed (e.g. `og:type`, `twitter:card`,
 *   the JSON-LD block) remain whatever `index.html` shipped.
 * - Tag creation: if the targeted `<meta>` / `<link rel="canonical">` element
 *   does not yet exist, it is created and appended to `<head>`. If it already
 *   exists, only its `content` / `href` attribute is updated.
 * - When `meta.title` is set, `<title>`, `og:title`, and `twitter:title` are
 *   all updated together. Same group-update semantics for `description`
 *   (description + og:description + twitter:description), `canonical`
 *   (canonical link + og:url), and `ogImage` (og:image + og:image:secure_url
 *   + twitter:image).
 * - Safe no-op outside the browser (returns immediately if `document` is
 *   undefined), so it is fine to call from a SSG/prerender path.
 *
 * Note: this helper does NOT inject JSON-LD. The canonical structured-data
 * block lives in `index.html` and must not be duplicated at runtime.
 */
export function setRouteMeta(meta: RouteMeta): void {
  if (typeof document === 'undefined') return;

  if (meta.title) {
    setTitle(meta.title);
    upsertMetaByProperty('og:title', meta.title);
    upsertMetaByName('twitter:title', meta.title);
  }
  if (meta.description) {
    upsertMetaByName('description', meta.description);
    upsertMetaByProperty('og:description', meta.description);
    upsertMetaByName('twitter:description', meta.description);
  }
  if (meta.canonical) {
    upsertCanonical(meta.canonical);
    upsertMetaByProperty('og:url', meta.canonical);
  }
  if (meta.ogImage) {
    upsertMetaByProperty('og:image', meta.ogImage);
    upsertMetaByProperty('og:image:secure_url', meta.ogImage);
    upsertMetaByName('twitter:image', meta.ogImage);
  }
  if (meta.ogImageAlt) {
    upsertMetaByProperty('og:image:alt', meta.ogImageAlt);
    upsertMetaByName('twitter:image:alt', meta.ogImageAlt);
  }
}
