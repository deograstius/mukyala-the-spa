import Price from '@shared/ui/Price';
import * as React from 'react';

export interface DetailMetaProps {
  priceCents?: number;
  duration?: string;
  className?: string; // allows page-specific spacing (e.g., mg-top-12px vs 16px)
}

/**
 * Renders price and/or duration rows in a consistent structure.
 * Styling follows existing class names used in detail pages.
 */
export default function DetailMeta({ priceCents, duration, className }: DetailMetaProps) {
  if (typeof priceCents !== 'number' && !duration) return null;
  const cls = className ?? '';
  return (
    <div className={cls} aria-label="service meta">
      {typeof priceCents === 'number' ? (
        <Price cents={priceCents} as="div" className="display-7" />
      ) : null}
      {duration ? (
        <div className="text-neutral-700" style={{ marginTop: '0.25rem' }}>
          Duration: {duration}
        </div>
      ) : null}
    </div>
  );
}
