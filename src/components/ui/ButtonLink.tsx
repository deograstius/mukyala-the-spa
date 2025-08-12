import * as React from 'react';

type Variant = 'primary' | 'white' | 'link';
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
  if (variant === 'white') parts.unshift('button-primary', 'white');
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
  return (
    <a href={href} className={cls} {...rest}>
      {children}
    </a>
  );
}
