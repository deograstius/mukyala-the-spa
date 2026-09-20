/**
 * Bridges the Stripe redirect: the confirmation token minted at order
 * creation is stashed in sessionStorage so /thanks (reached via Stripe's
 * success_url, which carries only the orderId) can read the order. Mirrors
 * the spa's checkout-success snapshot pattern.
 */

const STORAGE_PREFIX = 'dmv-thanks:v1:';
const TTL_MS = 1000 * 60 * 60 * 2;

export type ThanksSnapshot = {
  orderId: string;
  token: string;
  email: string;
  storedAt: number;
};

function storageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function saveThanksSnapshot(snapshot: Omit<ThanksSnapshot, 'storedAt'>): void {
  if (!storageAvailable()) return;
  try {
    window.sessionStorage.setItem(
      `${STORAGE_PREFIX}${snapshot.orderId}`,
      JSON.stringify({ ...snapshot, storedAt: Date.now() }),
    );
  } catch {
    // Private-mode storage failures degrade to the tokenless /thanks state.
  }
}

export function loadThanksSnapshot(orderId: string): ThanksSnapshot | undefined {
  if (!storageAvailable()) return undefined;
  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${orderId}`);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as ThanksSnapshot;
    if (!parsed?.token || Date.now() - parsed.storedAt > TTL_MS) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}
