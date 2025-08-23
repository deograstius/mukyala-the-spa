import * as React from 'react';

type Variant = 'primary' | 'white' | 'link';
type Size = 'large' | 'md';

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
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

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: ButtonProps) {
  const cls = classesFor(variant, size) + (className ? ` ${className}` : '');
  return (
    <button type={rest.type ?? 'button'} className={cls} {...rest}>
      {children}
    </button>
  );
}
