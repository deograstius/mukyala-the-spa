import { apiPost } from '@utils/api';

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
  status: 'pending' | 'confirmed' | 'canceled';
  subtotalCents: number;
};

export type CheckoutResponse = { checkoutUrl: string };

export async function createOrder(req: CreateOrderRequest): Promise<CreateOrderResponse> {
  return apiPost<CreateOrderResponse, CreateOrderRequest>('/orders/v1/orders', req);
}

export async function createCheckout(orderId: string): Promise<CheckoutResponse> {
  return apiPost<CheckoutResponse>(`/orders/v1/orders/${orderId}/checkout`);
}
