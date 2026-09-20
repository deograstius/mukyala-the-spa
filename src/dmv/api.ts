import { apiGet, apiPost } from '@utils/api';
import { SESSIONS } from './eventConfig';

/** Catalog prices for the ticket SKUs (scope=all includes event tickets). */
export async function loadTicketPrices(): Promise<Record<string, number>> {
  const products =
    await apiGet<Array<{ sku?: string; priceCents: number }>>('/v1/products?scope=all');
  const bySku: Record<string, number> = {};
  const wanted = new Set(SESSIONS.flatMap((s) => [s.skus.GA.sku, s.skus.VIP.sku]));
  for (const p of products) {
    if (p.sku && wanted.has(p.sku)) bySku[p.sku] = p.priceCents;
  }
  return bySku;
}

/** Live remaining-seat count for one SKU; null when unknown (inventory blip). */
export async function loadAvailability(sku: string): Promise<number | null> {
  try {
    const snap = await apiGet<{ available: number }>(
      `/inventory/v1/inventory/${encodeURIComponent(sku)}`,
    );
    return Number(snap.available);
  } catch {
    return null;
  }
}

export type Attendee = { sku: string; name: string };

export type CreateEventOrderResponse = {
  id: string;
  status: string;
  subtotalCents: number;
  confirmationToken?: string;
  confirmationExpiresAt?: string;
};

function randomNonce(): string {
  const c = typeof crypto !== 'undefined' ? crypto : undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}

export async function createEventOrder(req: {
  email: string;
  items: Array<{ sku: string; qty: number }>;
  attendees: Attendee[];
  marketingOptIn: boolean;
}): Promise<CreateEventOrderResponse> {
  return apiPost<CreateEventOrderResponse>('/orders/v1/orders', req, {
    headers: { 'Idempotency-Key': `dmv-order:${randomNonce()}` },
  });
}

export async function createCheckout(orderId: string): Promise<{ checkoutUrl: string }> {
  return apiPost<{ checkoutUrl: string }>(`/orders/v1/orders/${orderId}/checkout`, undefined, {
    headers: { 'Idempotency-Key': `dmv-checkout:${orderId}:${randomNonce()}` },
  });
}

export type EventTicket = {
  code: string;
  attendeeName: string;
  session: 'S1' | 'S2';
  tier: 'GA' | 'VIP';
  sessionLabel?: string;
  tierLabel?: string;
};

export type EventOrderDetail = {
  id: string;
  email: string | null;
  status: 'pending' | 'checkout_started' | 'confirmed' | 'canceled' | 'declined_sold_out';
  subtotalCents: number;
  soldOutSkus?: string[];
  items: Array<{ sku: string; title: string; priceCents: number; qty: number }>;
  tickets?: EventTicket[];
  surveySubmitted?: boolean;
};

export async function getEventOrder(orderId: string, token: string): Promise<EventOrderDetail> {
  return apiGet<EventOrderDetail>(
    `/orders/v1/orders/${orderId}?token=${encodeURIComponent(token)}`,
  );
}

export type SurveyAnswers = {
  facialExperience?: 'first_time' | 'a_few' | 'seasoned';
  skinConcern?: string;
  groupType?: 'solo' | 'with_people';
  heardFrom?: 'instagram' | 'friend' | 'search' | 'other';
  heardFromOther?: string;
};

export async function submitSurvey(
  orderId: string,
  token: string,
  answers: SurveyAnswers,
): Promise<void> {
  await apiPost<void>(
    `/orders/v1/orders/${orderId}/survey?token=${encodeURIComponent(token)}`,
    answers,
  );
}
