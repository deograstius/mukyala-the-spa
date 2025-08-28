import * as React from 'react';

export interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Visually hidden region for announcing dynamic updates to screen readers.
 */
export default function LiveRegion({
  message,
  politeness = 'polite',
  className,
  style,
}: LiveRegionProps) {
  return (
    <div aria-live={politeness} className={className ?? 'visually-hidden'} style={style}>
      {message}
    </div>
  );
}
