import { Link } from '@tanstack/react-router';
import * as React from 'react';

type Variant = 'primary' | 'primary-filled' | 'white' | 'white-filled' | 'link';
type Size = 'large' | 'md';

export interface ButtonLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children'> {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
}

function classesFor(variant: Variant, size: Size) {
  const parts = ['w-inline-block'];
  if (variant === 'primary') parts.unshift('button-primary');
  if (variant === 'primary-filled') parts.unshift('button-primary', 'filled');
  if (variant === 'white') parts.unshift('button-primary', 'white');
  if (variant === 'white-filled') parts.unshift('button-primary', 'white', 'filled');
  if (variant === 'link') parts.unshift('link');
  if (size === 'large') parts.push('large');
  return parts.join(' ');
}

export default function ButtonLink({
  href,
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: ButtonLinkProps) {
  const cls = classesFor(variant, size) + (className ? ` ${className}` : '');
  // Internal routes go through the router (SPA navigation + intent preload,
  // matching MediaCard); external/mailto/tel links stay plain anchors.
  if (href.startsWith('/')) {
    return (
      <Link to={href} preload="intent" className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={cls} {...rest}>
      {children}
    </a>
  );
}
