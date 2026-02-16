import type { DetailedCartItem } from '@utils/cart';
import { useEffect, useMemo, useState } from 'react';

const STORAGE_PREFIX = 'checkout-success:v1:';
const TWO_HOURS_MS = 1000 * 60 * 60 * 2;

export interface CheckoutSuccessItem {
  title: string;
  qty: number;
  priceCents: number;
  image?: string;
  imageAlt?: string;
  sku?: string;
  slug?: string;
}

export interface CheckoutSuccessSnapshot {
  orderId: string;
  email?: string;
  subtotalCents: number;
  items: CheckoutSuccessItem[];
  storedAt: number;
  token?: string;
  tokenExpiresAt?: string;
}

function storageAvailable() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function keyFor(orderId: string) {
  return `${STORAGE_PREFIX}${orderId}`;
}

function safeParse(value: string | null): CheckoutSuccessSnapshot | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as CheckoutSuccessSnapshot;
    return parsed;
  } catch {
    return undefined;
  }
}

export function saveCheckoutSuccessSnapshot(params: {
  orderId: string;
  subtotalCents: number;
  items: DetailedCartItem[];
  confirmationToken?: string;
  confirmationExpiresAt?: string;
}) {
  if (!storageAvailable()) return;
  const snapshot: CheckoutSuccessSnapshot = {
    orderId: params.orderId,
    subtotalCents: params.subtotalCents,
    items: params.items.map((item) => ({
      title: item.product.title,
      qty: item.qty,
      priceCents: item.priceCents,
      image: item.product.image,
      imageAlt: item.product.title,
      sku: item.product.sku,
      slug: item.slug,
    })),
    storedAt: Date.now(),
    token: params.confirmationToken,
    tokenExpiresAt: params.confirmationExpiresAt,
  };
  window.sessionStorage.setItem(keyFor(params.orderId), JSON.stringify(snapshot));
}

export function readCheckoutSuccessSnapshot(orderId?: string) {
  if (!orderId || !storageAvailable()) return undefined;
  const snapshot = safeParse(window.sessionStorage.getItem(keyFor(orderId)));
  if (!snapshot) return undefined;
  if (Date.now() - snapshot.storedAt > TWO_HOURS_MS) {
    window.sessionStorage.removeItem(keyFor(orderId));
    return undefined;
  }
  return snapshot;
}

export function clearCheckoutSuccessSnapshot(orderId?: string) {
  if (!orderId || !storageAvailable()) return;
  window.sessionStorage.removeItem(keyFor(orderId));
}

export function useCheckoutSuccessCache(orderId?: string) {
  const [snapshot, setSnapshot] = useState<CheckoutSuccessSnapshot | undefined>(() =>
    readCheckoutSuccessSnapshot(orderId),
  );

  useEffect(() => {
    setSnapshot(readCheckoutSuccessSnapshot(orderId));
  }, [orderId]);

  useEffect(() => {
    if (orderId && snapshot) {
      clearCheckoutSuccessSnapshot(orderId);
    }
  }, [orderId, snapshot]);

  const viewState = useMemo<'missing-order' | 'optimistic' | 'empty'>(() => {
    if (!orderId) return 'missing-order';
    if (snapshot) return 'optimistic';
    return 'empty';
  }, [orderId, snapshot]);

  return { snapshot, viewState };
}
