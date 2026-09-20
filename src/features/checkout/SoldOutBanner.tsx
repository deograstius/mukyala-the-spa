import {
  buildCurrentlyUnavailableBody,
  fitCartToStock,
  type CartStockChange,
} from '@features/checkout/cartStock';
import Button from '@shared/ui/Button';
import SmsDisclosureInline from '@shared/ui/SmsDisclosureInline';
import type { DetailedCartItem } from '@utils/cart';
import { useState } from 'react';

export interface SoldOutBannerProps {
  /** Prefixes the cta-ids so cart vs checkout clicks stay distinguishable. */
  surface: 'cart' | 'checkout';
  holdFailedSku: string | null;
  list: DetailedCartItem[];
  removeItem: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  /** Called after the cart changed (changes.length > 0) — clear the error upstream. */
  onUpdated: (changes: CartStockChange[]) => void;
  style?: React.CSSProperties;
}

/**
 * Shared "Sold out" banner for the inventory-hold failure path. One source of
 * truth for the compliance-bound waitlist copy (SMS + email + notification
 * preferences + SMS disclosures) that used to be duplicated ~80 lines each in
 * CartDrawer and Checkout.
 */
export default function SoldOutBanner({
  surface,
  holdFailedSku,
  list,
  removeItem,
  setQty,
  onUpdated,
  style,
}: SoldOutBannerProps) {
  const [updating, setUpdating] = useState(false);

  return (
    <div role="alert" aria-live="assertive" className="error-message" style={style}>
      <div className="paragraph-large" style={{ fontWeight: 600 }}>
        Sold out
      </div>
      <div className="paragraph-small mg-top-8px">
        {buildCurrentlyUnavailableBody({ holdFailedSku, list })}
      </div>
      <div
        className="mg-top-12px"
        style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Button
          variant="white"
          disabled={updating}
          data-cta-id={`${surface}-update-cart-stock`}
          onClick={async () => {
            setUpdating(true);
            const changes = await fitCartToStock({
              holdFailedSku,
              list,
              removeItem,
              setQty,
            });
            setUpdating(false);
            if (changes.length > 0) onUpdated(changes);
          }}
        >
          {updating ? 'Updating…' : 'Update cart'}
        </Button>
      </div>
      <div className="paragraph-small mg-top-8px">
        Join the waitlist:{' '}
        <a
          href="sms:+17602766583"
          style={{ color: '#fff', textDecoration: 'underline' }}
          data-cta-id="waitlist-sms"
        >
          Text
        </a>{' '}
        for SMS updates or{' '}
        <a
          href="mailto:info@mukyala.com?subject=Waitlist"
          style={{ color: '#fff', textDecoration: 'underline' }}
          data-cta-id="waitlist-email"
        >
          Email
        </a>{' '}
        us.{' '}
        <a
          href="/notifications/manage"
          style={{ color: '#fff', textDecoration: 'underline' }}
          data-cta-id={`${surface}-waitlist-manage-notifications`}
        >
          Manage notifications
        </a>
        .
      </div>
      <SmsDisclosureInline
        className="paragraph-small"
        style={{ marginTop: 8, marginBottom: 0 }}
        linkStyle={{ color: '#fff', textDecoration: 'underline' }}
        ctaId={`${surface}-waitlist-sms-disclosures`}
      />
    </div>
  );
}
