import { useQuery } from '@tanstack/react-query';
import { apiGet, apiPost } from '@utils/api';

function fnv1a32(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function orderIdempotencyKey(req: CreateOrderRequest): string {
  const normalized = {
    email: req.email.trim().toLowerCase(),
    items: [...req.items]
      .map((it) => ({ sku: it.sku, qty: it.qty }))
      .sort((a, b) => a.sku.localeCompare(b.sku)),
  };
  return `order:${fnv1a32(JSON.stringify(normalized))}`;
}

export type OrderItemRequest = {
  sku: string;
  title: string;
  priceCents: number;
  qty: number;
};

export type CreateOrderRequest = {
  email: string;
  items: OrderItemRequest[];
};

export type CreateOrderResponse = {
  id: string;
  status: 'pending' | 'checkout_started' | 'confirmed' | 'canceled';
  subtotalCents: number;
  confirmationToken?: string;
  confirmationExpiresAt?: string;
};

export type CheckoutResponse = { checkoutUrl: string };

export type CancelOrderResponse = {
  id: string;
  status: 'canceled' | 'pending' | 'confirmed';
};

export type OrderItem = {
  sku: string;
  title: string;
  priceCents: number;
  qty: number;
};

export type OrderDetailResponse = {
  id: string;
  email: string;
  status: 'pending' | 'checkout_started' | 'confirmed' | 'canceled';
  subtotalCents: number;
  items: OrderItem[];
};

export async function createOrder(req: CreateOrderRequest): Promise<CreateOrderResponse> {
  return apiPost<CreateOrderResponse, CreateOrderRequest>('/orders/v1/orders', req, {
    headers: { 'Idempotency-Key': orderIdempotencyKey(req) },
  });
}

export async function createCheckout(orderId: string): Promise<CheckoutResponse> {
  return apiPost<CheckoutResponse>(`/orders/v1/orders/${orderId}/checkout`, undefined, {
    headers: { 'Idempotency-Key': `checkout:${orderId}` },
  });
}

export async function cancelOrder(orderId: string): Promise<CancelOrderResponse> {
  return apiPost<CancelOrderResponse>(`/orders/v1/orders/${orderId}/cancel`);
}

export async function getOrder(orderId: string, token: string): Promise<OrderDetailResponse> {
  return apiGet<OrderDetailResponse>(
    `/orders/v1/orders/${orderId}?token=${encodeURIComponent(token)}`,
  );
}

export function useOrderStatusQuery(orderId?: string, token?: string) {
  return useQuery({
    queryKey: ['order-status', orderId, token],
    queryFn: async () => {
      if (!orderId || !token) throw new Error('Missing order reference');
      return getOrder(orderId, token);
    },
    enabled: Boolean(orderId && token),
    staleTime: 5_000,
    retry: 1,
  });
}
