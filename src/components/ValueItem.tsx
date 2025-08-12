import * as React from 'react';
import ResponsiveImage from './ui/ResponsiveImage';

export interface ValueItemProps {
  iconSrc: string;
  iconAlt?: string;
  title: string;
  children: React.ReactNode;
  iconWidth?: number;
  iconHeight?: number;
  className?: string;
  iconClassName?: string;
}
export default function ValueItem({
  iconSrc,
  iconAlt,
  title,
  children,
  iconWidth,
  iconHeight,
  className,
  iconClassName,
}: ValueItemProps) {
  return (
    <div className={`our-values-icon-left-container${className ? ` ${className}` : ''}`}>
      <ResponsiveImage
        src={iconSrc}
        alt={iconAlt ?? title}
        width={iconWidth}
        height={iconHeight}
        className={`our-values-icon-left-margin${iconClassName ? ` ${iconClassName}` : ''}`}
        style={{ objectFit: 'contain' }}
      />
      <div>
        <h3 className="display-7">{title}</h3>
        <div className="mg-top-8px">{children}</div>
      </div>
    </div>
  );
}
