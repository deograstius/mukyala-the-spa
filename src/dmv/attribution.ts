/**
 * First-touch ad attribution for the event site (spec decision #18's
 * machine-captured referral/UTM).
 *
 * Ads land here with utm_* set in the platform's own field (Meta: ad-level
 * URL parameters; Google: final URL suffix) plus click IDs the platforms
 * append on their own (fbclid; gclid/gbraid/wbraid from Google auto-tagging).
 * The click IDs matter beyond reporting: they are the join key for any future
 * conversion upload back to the platforms.
 *
 * Routes on this site are real page loads, so the params survive only the
 * landing load. captureFirstTouch() runs at app boot and persists the first
 * non-empty touch in localStorage; later visits never overwrite it. The
 * captured object rides on order creation and lands in the orders DB, keyed
 * to the ticket numbers like every other study signal.
 */

export type Attribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  fbclid?: string;
  referrer?: string;
};

const PARAMS_KEY = 'mukyala_dmv_first_touch:v1';
const REFERRER_KEY = 'mukyala_dmv_first_touch_referrer:v1';

function sanitizeUtmToken(raw: string | null): string | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  // Defensive: don't allow obvious PII-like tokens in UTMs.
  if (v.includes('@')) return undefined;
  const digits = v.replace(/[^\d]/g, '');
  if (digits.length >= 10) return undefined;
  return v.length > 120 ? v.slice(0, 120) : v;
}

function sanitizeClickId(raw: string | null): string | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  // Click IDs are opaque machine tokens; the phone-number heuristic above
  // would false-positive on them, so the guard here is charset + length.
  if (!/^[\w.-]+$/.test(v)) return undefined;
  return v.length > 255 ? undefined : v;
}

function getParamsFromCurrentUrl(): Attribution | undefined {
  try {
    const u = new URL(window.location.href);
    const q = (k: string) => u.searchParams.get(k);
    const params: Attribution = {
      source: sanitizeUtmToken(q('utm_source')),
      medium: sanitizeUtmToken(q('utm_medium')),
      campaign: sanitizeUtmToken(q('utm_campaign')),
      content: sanitizeUtmToken(q('utm_content')),
      term: sanitizeUtmToken(q('utm_term')),
      gclid: sanitizeClickId(q('gclid')),
      gbraid: sanitizeClickId(q('gbraid')),
      wbraid: sanitizeClickId(q('wbraid')),
      fbclid: sanitizeClickId(q('fbclid')),
    };
    return Object.values(params).some(Boolean) ? params : undefined;
  } catch {
    return undefined;
  }
}

function getExternalReferrer(): string | undefined {
  const raw = document.referrer?.trim();
  if (!raw) return undefined;
  try {
    const ref = new URL(raw);
    if (ref.hostname === window.location.hostname) return undefined;
    ref.search = '';
    ref.hash = '';
    const v = ref.toString();
    return v.length > 500 ? undefined : v;
  } catch {
    return undefined;
  }
}

function readStoredParams(): Attribution | undefined {
  try {
    const raw = window.localStorage.getItem(PARAMS_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Attribution;
    return Object.values(parsed).some(Boolean) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/** Persist the first non-empty touch; an empty visit never claims the slot. */
export function captureFirstTouch(): void {
  try {
    if (!readStoredParams()) {
      const params = getParamsFromCurrentUrl();
      if (params) window.localStorage.setItem(PARAMS_KEY, JSON.stringify(params));
    }
    if (!window.localStorage.getItem(REFERRER_KEY)) {
      const ref = getExternalReferrer();
      if (ref) window.localStorage.setItem(REFERRER_KEY, ref);
    }
  } catch {
    // Storage unavailable (private mode etc.) — attribution is best-effort.
  }
}

/** The stored first touch, falling back to the current URL for direct lands. */
export function getAttribution(): Attribution | undefined {
  captureFirstTouch();
  const params = readStoredParams() ?? getParamsFromCurrentUrl();
  let referrer: string | undefined;
  try {
    referrer = window.localStorage.getItem(REFERRER_KEY) ?? undefined;
  } catch {
    referrer = undefined;
  }
  referrer = referrer || getExternalReferrer();
  if (!params && !referrer) return undefined;
  return { ...(params ?? {}), ...(referrer ? { referrer } : {}) };
}
