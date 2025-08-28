import * as React from 'react';

export interface DetailMetaProps {
  price?: string;
  duration?: string;
  className?: string; // allows page-specific spacing (e.g., mg-top-12px vs 16px)
}

/**
 * Renders price and/or duration rows in a consistent structure.
 * Styling follows existing class names used in detail pages.
 */
export default function DetailMeta({ price, duration, className }: DetailMetaProps) {
  if (!price && !duration) return null;
  const cls = className ?? '';
  return (
    <div className={cls} aria-label="service meta">
      {price ? <div className="display-7">{price}</div> : null}
      {duration ? (
        <div className="text-neutral-700" style={{ marginTop: '0.25rem' }}>
          Duration: {duration}
        </div>
      ) : null}
    </div>
  );
}
