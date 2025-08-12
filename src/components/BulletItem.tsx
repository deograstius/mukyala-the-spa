import * as React from 'react';

export interface BulletItemProps {
  children: React.ReactNode;
  href?: string;
  className?: string;
}

export default function BulletItem({ children, href, className }: BulletItemProps) {
  return (
    <div className={`flex-horizontal bullet-point-left${className ? ` ${className}` : ''}`}>
      <div className="decoration-dot bullet-point mg-right-14px" />
      {href ? (
        <a href={href} className="location-info-link w-inline-block">
          {children}
        </a>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}
