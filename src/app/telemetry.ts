type TelemetryEnv = 'local' | 'staging' | 'prod';

type TelemetryEnvelopeV1 = {
  schemaVersion: 1;
  eventId: string;
  event: string;
  timestamp: string;
  env: TelemetryEnv;
  source: 'spa';
  anonymousId: string;
  sessionId: string;
  route?: string;
  path?: string;
  method?: string;
  referrer?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  ctaId?: string;
  locationId?: string;
  serviceSlug?: string;
  productSlug?: string;
  sku?: string;
  orderId?: string;
  reservationId?: string;
  props?: Record<string, unknown>;
};

const FIRST_TOUCH_UTM_KEY = 'mukyala_first_touch_utm:v1';
const FIRST_TOUCH_REFERRER_KEY = 'mukyala_first_touch_referrer:v1';

function inferEnv(): TelemetryEnv {
  if (import.meta.env.DEV) return 'local';
  const host = window.location.hostname;
  if (host === 'staging.mukyala.com' || host.endsWith('.staging.mukyala.com')) return 'staging';
  return 'prod';
}

function inferCollectorUrl(): string | undefined {
  if (import.meta.env.DEV) return 'http://localhost:4500/v1/events';
  const host = window.location.hostname;
  if (host === 'staging.mukyala.com') return 'https://telemetry.staging.mukyala.com/v1/events';
  if (host === 'www.mukyala.com' || host === 'mukyala.com')
    return 'https://telemetry.mukyala.com/v1/events';
  return undefined;
}

function getOrCreateStorageId(storage: Storage, key: string): string {
  const existing = storage.getItem(key);
  if (existing && existing.trim().length >= 8) return existing;
  const id =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  storage.setItem(key, id);
  return id;
}

export function getAnonymousId(): string {
  return getOrCreateStorageId(window.localStorage, 'mukyala_anonymous_id');
}

export function getSessionId(): string {
  return getOrCreateStorageId(window.sessionStorage, 'mukyala_session_id');
}

function sanitizeAttributionToken(raw: string | null): string | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  // Defensive: don't allow obvious PII-like tokens in UTMs.
  if (v.includes('@')) return undefined;
  const digits = v.replace(/[^\d]/g, '');
  if (digits.length >= 10) return undefined;
  return v.length > 120 ? v.slice(0, 120) : v;
}

function stripQueryAndHash(url: string): string | undefined {
  try {
    const u = new URL(url);
    u.search = '';
    u.hash = '';
    return u.toString();
  } catch {
    return undefined;
  }
}

function getExternalReferrer(): string | undefined {
  const raw = document.referrer?.trim();
  if (!raw) return undefined;
  try {
    const ref = new URL(raw);
    const currentHost = window.location.hostname;
    if (ref.hostname === currentHost) return undefined;
    return stripQueryAndHash(ref.toString());
  } catch {
    return undefined;
  }
}

function getUtmFromCurrentUrl(): TelemetryEnvelopeV1['utm'] | undefined {
  try {
    const u = new URL(window.location.href);

    const utm = {
      source: sanitizeAttributionToken(u.searchParams.get('utm_source')),
      medium: sanitizeAttributionToken(u.searchParams.get('utm_medium')),
      campaign: sanitizeAttributionToken(u.searchParams.get('utm_campaign')),
      content: sanitizeAttributionToken(u.searchParams.get('utm_content')),
      term: sanitizeAttributionToken(u.searchParams.get('utm_term')),
    };
    return Object.values(utm).some(Boolean) ? utm : undefined;
  } catch {
    return undefined;
  }
}

function readJsonFromStorage<T>(key: string): T | undefined {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

function writeJsonToStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function initFirstTouchAttribution(): void {
  // Persist once per anonymousId (localStorage) — never overwrite.
  try {
    if (!readJsonFromStorage<TelemetryEnvelopeV1['utm']>(FIRST_TOUCH_UTM_KEY)) {
      const utm = getUtmFromCurrentUrl();
      if (utm) writeJsonToStorage(FIRST_TOUCH_UTM_KEY, utm);
    }
    if (!window.localStorage.getItem(FIRST_TOUCH_REFERRER_KEY)) {
      const ref = getExternalReferrer();
      if (ref) window.localStorage.setItem(FIRST_TOUCH_REFERRER_KEY, ref);
    }
  } catch {
    // ignore
  }
}

function getFirstTouchUtm(): TelemetryEnvelopeV1['utm'] | undefined {
  const stored = readJsonFromStorage<TelemetryEnvelopeV1['utm']>(FIRST_TOUCH_UTM_KEY);
  if (stored && Object.values(stored).some(Boolean)) return stored;
  const current = getUtmFromCurrentUrl();
  if (current) {
    writeJsonToStorage(FIRST_TOUCH_UTM_KEY, current);
    return current;
  }
  return undefined;
}

function getFirstTouchReferrer(): string | undefined {
  try {
    const stored = window.localStorage.getItem(FIRST_TOUCH_REFERRER_KEY);
    if (stored && stored.trim()) return stored;
    const current = getExternalReferrer();
    if (current) {
      window.localStorage.setItem(FIRST_TOUCH_REFERRER_KEY, current);
      return current;
    }
  } catch {
    // ignore
  }
  return undefined;
}

function stripUnsafeProps(
  props: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!props) return undefined;
  const out: Record<string, unknown> = { ...props };
  // Shallow redaction guardrails (best-effort) — keep SPA props PII-free.
  ['email', 'phone', 'name', 'address', 'street', 'notes', 'message'].forEach((k) => {
    if (k in out) delete out[k];
  });
  return Object.keys(out).length ? out : undefined;
}

function stripQueryAndHashFromPath(path: string | undefined): string | undefined {
  const v = path?.trim();
  if (!v) return undefined;
  return v.split('#')[0]?.split('?')[0] || undefined;
}

function postEnvelopeToCollector(collectorUrl: string, body: string): void {
  void fetch(collectorUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
    credentials: 'omit',
  }).catch(() => undefined);
}

function sendBeaconToCollector(collectorUrl: string, body: string): boolean {
  try {
    if (typeof navigator?.sendBeacon !== 'function') return false;
    const blob = new Blob([body], { type: 'application/json' });
    return navigator.sendBeacon(collectorUrl, blob);
  } catch {
    return false;
  }
}

export function emitTelemetry(
  ev: Omit<
    TelemetryEnvelopeV1,
    'schemaVersion' | 'eventId' | 'timestamp' | 'env' | 'source' | 'anonymousId' | 'sessionId'
  > & {
    event: string;
  },
): void {
  const collectorUrl = inferCollectorUrl();
  if (!collectorUrl) return;

  initFirstTouchAttribution();

  const envelope: TelemetryEnvelopeV1 = {
    schemaVersion: 1,
    eventId:
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`,
    event: ev.event,
    timestamp: new Date().toISOString(),
    env: inferEnv(),
    source: 'spa',
    anonymousId: getAnonymousId(),
    sessionId: getSessionId(),
    route: stripQueryAndHashFromPath(ev.route) ?? window.location.pathname,
    path: stripQueryAndHashFromPath(ev.path) ?? window.location.pathname,
    method: ev.method,
    referrer: getFirstTouchReferrer() ?? stripQueryAndHash(document.referrer || '') ?? undefined,
    utm: getFirstTouchUtm(),
    ctaId: ev.ctaId,
    locationId: ev.locationId,
    serviceSlug: ev.serviceSlug,
    productSlug: ev.productSlug,
    sku: ev.sku,
    orderId: ev.orderId,
    reservationId: ev.reservationId,
    props: stripUnsafeProps(ev.props),
  };

  const body = JSON.stringify(envelope);
  if (ev.event === 'page_exit' && sendBeaconToCollector(collectorUrl, body)) return;
  postEnvelopeToCollector(collectorUrl, body);
}

export function emitPageView(): void {
  emitTelemetry({
    event: 'page_view',
    route: window.location.pathname,
    path: window.location.pathname,
    method: 'GET',
    // referrer/utm are attached automatically from first-touch.
  });
}

let ctaListenerInstalled = false;
const lastCtaClickMsById = new Map<string, number>();

function getClosestCtaId(target: EventTarget | null): string | undefined {
  if (!(target instanceof Element)) return undefined;
  const el = target.closest('[data-cta-id]');
  if (!el) return undefined;
  const raw = el.getAttribute('data-cta-id')?.trim();
  if (!raw) return undefined;
  return raw.length > 120 ? raw.slice(0, 120) : raw;
}

function getTargetPathFromElement(target: EventTarget | null): string | undefined {
  if (!(target instanceof Element)) return undefined;
  const link = target.closest('a[href]') as HTMLAnchorElement | null;
  if (!link) return undefined;
  const href = link.getAttribute('href')?.trim();
  if (!href) return undefined;
  try {
    const u = new URL(href, window.location.origin);
    if (u.origin !== window.location.origin) return undefined;
    return u.pathname;
  } catch {
    return undefined;
  }
}

export function installCtaClickTracking(): void {
  if (ctaListenerInstalled) return;
  ctaListenerInstalled = true;

  document.addEventListener(
    'click',
    (e) => {
      const ctaId = getClosestCtaId(e.target);
      if (!ctaId) return;

      const now = Date.now();
      const last = lastCtaClickMsById.get(ctaId) ?? 0;
      if (now - last < 800) return;
      lastCtaClickMsById.set(ctaId, now);

      const targetPath = getTargetPathFromElement(e.target);
      emitTelemetry({
        event: 'cta_click',
        ctaId,
        route: window.location.pathname,
        path: window.location.pathname,
        props: targetPath ? { targetPath } : undefined,
      });
    },
    { capture: true },
  );
}
