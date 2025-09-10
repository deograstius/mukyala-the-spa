import type { HTMLAttributes, ElementType } from 'react';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
}

/**
 * Semantic section wrapper that always includes the base `section` class
 * while allowing additional class names.
 */
export default function Section({ as: Tag = 'section', className, ...rest }: SectionProps) {
  const base = 'section';
  const cls = className ? `${base} ${className}` : base;
  const Comp = Tag as ElementType;
  return <Comp className={cls} {...rest} />;
}
