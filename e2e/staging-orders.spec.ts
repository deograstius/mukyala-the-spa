import { createHmac, randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';

const USE_STAGING = process.env.STAGING_E2E === 'true';
const STAGING_ORIGIN = (process.env.STAGING_ORIGIN || 'https://staging.mukyala.com').replace(
  /\/$/,
  '',
);

const STRIPE_WEBHOOK_SECRET_RAW = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
const STRIPE_WEBHOOK_SECRET = STRIPE_WEBHOOK_SECRET_RAW.split(',')[0]?.trim() || '';

const E2E_EMAIL = process.env.E2E_EMAIL || 'qa+mukyala-e2e@example.com';
const MAX_SKU_ATTEMPTS = Number(process.env.E2E_MAX_SKU_ATTEMPTS || 5);

function stripeSignatureHeader(payload: string, secret: string, timestampSeconds?: number) {
  const t = timestampSeconds ?? Math.floor(Date.now() / 1000);
  const signedPayload = `${t}.${payload}`;
  const sig = createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
  return `t=${t},v1=${sig}`;
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollUntil<T>(
  fn: () => Promise<T>,
  predicate: (value: T) => boolean,
  opts: { timeoutMs: number; intervalMs: number },
) {
  const start = Date.now();
  let last: T | undefined;
  while (Date.now() - start < opts.timeoutMs) {
    last = await fn();
    if (predicate(last)) return last;
    await wait(opts.intervalMs);
  }
  throw new Error('timeout waiting for condition');
}

test.describe('Staging Orders E2E', () => {
  test.skip(!USE_STAGING, 'Set STAGING_E2E=true to run this smoke test against staging');

  test('create order → start checkout → signed webhook → order confirmed', async ({ request }) => {
    test.setTimeout(60_000);
    if (!STRIPE_WEBHOOK_SECRET) {
      throw new Error(
        'Missing STRIPE_WEBHOOK_SECRET (staging whsec_* secret required to sign webhook requests)',
      );
    }

    const origin = STAGING_ORIGIN;
    const runId = randomUUID();

    const productsRes = await request.get(`${origin}/v1/products`);
    expect(productsRes.ok()).toBeTruthy();
    const productsBody: any = await productsRes.json();
    const products: Array<{ sku?: string; title?: string; priceCents?: number; active?: boolean }> =
      Array.isArray(productsBody)
        ? productsBody
        : Array.isArray(productsBody?.products)
          ? productsBody.products
          : [];

    const candidates = products
      .filter((p) => p && typeof p.sku === 'string' && p.sku && (p.active ?? true))
      .slice(0, Number.isFinite(MAX_SKU_ATTEMPTS) ? MAX_SKU_ATTEMPTS : 5);
    if (candidates.length === 0) throw new Error('No product SKUs available from /v1/products');

    let order: any | null = null;
    let checkoutOk = false;
    let lastCheckoutError: any | null = null;

    for (let i = 0; i < candidates.length; i++) {
      const sku = String(candidates[i]!.sku);
      const idemOrder = `order:e2e:${runId}:${i}`;

      const createRes = await request.post(`${origin}/orders/v1/orders`, {
        headers: { 'content-type': 'application/json', 'idempotency-key': idemOrder },
        data: { email: E2E_EMAIL, items: [{ sku, qty: 1 }] },
      });

      if (!createRes.ok()) {
        lastCheckoutError = {
          step: 'createOrder',
          sku,
          status: createRes.status(),
          body: await createRes.text(),
        };
        continue;
      }
      order = await createRes.json();
      if (!order?.id || !order?.confirmationToken) {
        lastCheckoutError = { step: 'createOrder', sku, status: createRes.status(), body: order };
        order = null;
        continue;
      }

      const idemCheckout = `checkout:e2e:${order.id}:${runId}`;
      const checkoutRes = await request.post(
        `${origin}/orders/v1/orders/${encodeURIComponent(order.id)}/checkout`,
        {
          headers: { 'idempotency-key': idemCheckout },
          data: {},
        },
      );

      if (checkoutRes.ok()) {
        const body: any = await checkoutRes.json();
        if (typeof body?.checkoutUrl === 'string' && body.checkoutUrl.length) {
          checkoutOk = true;
          break;
        }
        lastCheckoutError = { step: 'checkout', sku, status: checkoutRes.status(), body };
      } else {
        const bodyText = await checkoutRes.text();
        lastCheckoutError = { step: 'checkout', sku, status: checkoutRes.status(), body: bodyText };
      }

      // Best-effort cleanup before trying another SKU.
      try {
        await request.post(`${origin}/orders/v1/orders/${encodeURIComponent(order.id)}/cancel`, {
          data: {},
        });
      } catch (err) {
        void err;
      }

      order = null;
    }

    if (!checkoutOk || !order) {
      throw new Error(
        `Unable to start checkout for any SKU (likely inventory out-of-stock). Last error: ${JSON.stringify(lastCheckoutError)}`,
      );
    }

    const event = {
      id: `evt_e2e_${runId.replace(/-/g, '')}`,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: `cs_test_${runId.replace(/-/g, '')}`,
          client_reference_id: order.id,
          payment_status: 'paid',
          payment_intent: `pi_test_${runId.replace(/-/g, '')}`,
        },
      },
    };
    const payload = JSON.stringify(event);
    const sig = stripeSignatureHeader(payload, STRIPE_WEBHOOK_SECRET);

    const webhookRes = await request.post(`${origin}/orders/v1/webhooks/stripe`, {
      headers: { 'content-type': 'application/json', 'stripe-signature': sig },
      data: payload,
    });
    expect(webhookRes.status(), await webhookRes.text()).toBe(204);

    const getOrder = async () => {
      const res = await request.get(
        `${origin}/orders/v1/orders/${encodeURIComponent(order.id)}?token=${encodeURIComponent(order.confirmationToken)}`,
      );
      expect(res.ok()).toBeTruthy();
      return res.json();
    };

    const finalOrder: any = await pollUntil(getOrder, (o) => o?.status === 'confirmed', {
      timeoutMs: 20_000,
      intervalMs: 500,
    });
    expect(finalOrder.status).toBe('confirmed');

    // Idempotency: replaying the same event should still return 204 and not break the order.
    const webhookRes2 = await request.post(`${origin}/orders/v1/webhooks/stripe`, {
      headers: { 'content-type': 'application/json', 'stripe-signature': sig },
      data: payload,
    });
    expect(webhookRes2.status(), await webhookRes2.text()).toBe(204);
    const finalOrder2: any = await getOrder();
    expect(finalOrder2.status).toBe('confirmed');
  });
});
