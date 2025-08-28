import * as React from 'react';

export interface DetailLayoutProps {
  media: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Two-column responsive detail layout used by product/service pages.
 * Keeps existing class names to preserve styles.
 */
export default function DetailLayout({
  media,
  title,
  meta,
  description,
  actions,
}: DetailLayoutProps) {
  return (
    <div className="w-layout-grid grid-2-columns">
      <div className="image-wrapper border-radius-20px">{media}</div>
      <div>
        {title}
        {meta}
        {description}
        {actions}
      </div>
    </div>
  );
}
