import * as React from 'react';

type Variant = 'primary' | 'primary-filled' | 'white' | 'white-filled';
type Size = 'large' | 'md';

/**
 * Plain-anchor pill button. The shared ButtonLink routes internal hrefs
 * through the tanstack router, which this app doesn't mount — a four-page
 * site navigates with real page loads (nginx serves index.html everywhere).
 */
export default function PillLink({
  href,
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children'>) {
  const parts = ['button-primary'];
  if (variant === 'primary-filled') parts.push('filled');
  if (variant === 'white') parts.push('white');
  if (variant === 'white-filled') parts.push('white', 'filled');
  if (size === 'large') parts.push('large');
  parts.push('w-inline-block');
  const cls = parts.join(' ') + (className ? ` ${className}` : '');
  return (
    <a href={href} className={cls} {...rest}>
      <div className="text-block">{children}</div>
    </a>
  );
}
