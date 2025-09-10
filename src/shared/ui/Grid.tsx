import type { HTMLAttributes, ElementType } from 'react';

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  as?: ElementType;
}

// Minimal grid wrapper that forwards class names and attributes.
export default function Grid({ as: Tag = 'div', className, ...rest }: GridProps) {
  const cls = className ? className : '';
  const Comp = Tag as ElementType;
  return <Comp className={cls} {...rest} />;
}
