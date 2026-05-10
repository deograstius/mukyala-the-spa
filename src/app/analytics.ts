/*
 * analytics.ts — chunk: spa-tracking-and-consent-2026-05-09 (implementer pass).
 *
 * Tiny dataLayer wrapper for emitting GTM events. Meta Pixel standard events
 * are routed via GTM tag triggers in the GTM workspace — this module just
 * pushes events onto `window.dataLayer` and lets the operator wire the GTM
 * tags that translate them into Pixel/GA4 hits.
 *
 * Zero-network guarantee:
 *   - When `VITE_GTM_ID` is unset, the GTM container snippet is NOT injected
 *     into index.html (see scripts/vite-plugin-gtm.mjs). That means
 *     `window.dataLayer` is undefined, and `trackEvent()` is a silent no-op:
 *     no script loads, no fetch, no img beacon — even in dev.
 *   - When GTM IS loaded, GTM itself manages dataLayer initialization and
 *     event-handling.
 */

/**
 * Canonical event names. Constants so call sites can't drift on spelling.
 */
export const EV = {
  VIEW_CONTENT: 'view_content',
  LEAD: 'lead',
  SCHEDULE: 'schedule',
  CONSENT_GRANTED: 'consent_granted',
  CONSENT_DECLINED: 'consent_declined',
} as const;

export type AnalyticsEventName =
  | (typeof EV)[keyof typeof EV]
  // Escape hatch for ad-hoc events.
  | (string & {});

export type AnalyticsEventParams = Record<string, unknown>;

interface DataLayerWindow extends Window {
  dataLayer?: Array<Record<string, unknown>>;
}

/**
 * Push an event onto `window.dataLayer`. Silent no-op when dataLayer is absent
 * (i.e. GTM never loaded because VITE_GTM_ID was unset at build time) or when
 * dataLayer has been replaced by something non-array (defensive).
 *
 * Convention: the `event` key is what GTM triggers match against. Any extra
 * params (currency, value, content_name, ...) live alongside.
 */
export function trackEvent(name: AnalyticsEventName, params: AnalyticsEventParams = {}): void {
  if (typeof window === 'undefined') return;
  const w = window as DataLayerWindow;
  if (!Array.isArray(w.dataLayer)) return;
  w.dataLayer.push({ event: name, ...params });
}

/**
 * Convenience for the Meta-standard `view_content` event used from service
 * pages. Keeps the (currency, value, content_name) shape consistent across
 * call sites.
 */
export function trackViewContent(args: {
  contentName: string;
  contentCategory?: string;
  /** Major-unit USD value, e.g. 185 for a $185 service. */
  value?: number;
}): void {
  trackEvent(EV.VIEW_CONTENT, {
    content_name: args.contentName,
    content_category: args.contentCategory,
    value: args.value ?? 0,
    currency: 'USD',
  });
}

/**
 * Convenience for the Meta-standard `lead` event used by NewsletterSignup on
 * successful submit.
 */
export function trackLead(source: string): void {
  trackEvent(EV.LEAD, {
    content_name: source,
    source,
    value: 0,
    currency: 'USD',
  });
}

/**
 * Convenience for the Meta-standard `schedule` event used by every "Book" /
 * "Reserve" CTA. Fires on click intent (not booking completion). Booking-
 * completion will be wired once a booking platform is integrated.
 */
export function trackScheduleIntent(args: {
  ctaId: string;
  serviceSlug?: string;
  source?: string;
}): void {
  trackEvent(EV.SCHEDULE, {
    cta_id: args.ctaId,
    content_name: args.serviceSlug,
    service: args.serviceSlug,
    source: args.source ?? args.ctaId,
    value: 0,
    currency: 'USD',
  });
}
