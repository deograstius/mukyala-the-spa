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

function getUtm(): TelemetryEnvelopeV1['utm'] | undefined {
  try {
    const u = new URL(window.location.href);

    const sanitize = (raw: string | null): string | undefined => {
      const v = raw?.trim();
      if (!v) return undefined;
      // Defensive: don't allow obvious PII-like tokens in UTMs.
      if (v.includes('@')) return undefined;
      const digits = v.replace(/[^\d]/g, '');
      if (digits.length >= 10) return undefined;
      return v.length > 120 ? v.slice(0, 120) : v;
    };

    const utm = {
      source: sanitize(u.searchParams.get('utm_source')),
      medium: sanitize(u.searchParams.get('utm_medium')),
      campaign: sanitize(u.searchParams.get('utm_campaign')),
      content: sanitize(u.searchParams.get('utm_content')),
      term: sanitize(u.searchParams.get('utm_term')),
    };
    return Object.values(utm).some(Boolean) ? utm : undefined;
  } catch {
    return undefined;
  }
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
    route: ev.route,
    path: ev.path,
    method: ev.method,
    referrer: ev.referrer,
    utm: ev.utm,
    ctaId: ev.ctaId,
    locationId: ev.locationId,
    serviceSlug: ev.serviceSlug,
    productSlug: ev.productSlug,
    sku: ev.sku,
    orderId: ev.orderId,
    reservationId: ev.reservationId,
    props: stripUnsafeProps(ev.props),
  };

  void fetch(collectorUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(envelope),
    keepalive: true,
    credentials: 'omit',
  }).catch(() => undefined);
}

export function emitPageView(): void {
  emitTelemetry({
    event: 'page_view',
    route: window.location.pathname,
    path: window.location.pathname,
    method: 'GET',
    referrer: document.referrer || undefined,
    utm: getUtm(),
  });
}
