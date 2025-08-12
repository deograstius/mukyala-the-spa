import * as React from 'react';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Semantic section wrapper that always includes the base `section` class
 * while allowing additional class names.
 */
export default function Section({ as: Tag = 'section', className, ...rest }: SectionProps) {
  const base = 'section';
  const cls = className ? `${base} ${className}` : base;
  return <Tag className={cls} {...rest} />;
}
