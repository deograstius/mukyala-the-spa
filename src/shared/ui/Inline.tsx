import type { HTMLAttributes, ElementType } from 'react';

export interface InlineProps extends HTMLAttributes<HTMLDivElement> {
  as?: ElementType;
}

// Minimal horizontal inline wrapper that merely forwards classes/props.
export default function Inline({ as: Tag = 'div', className, ...rest }: InlineProps) {
  const base = '';
  const cls = className ? `${base}${className}`.trim() : base.trim();
  const Comp = Tag as ElementType;
  return <Comp className={cls} {...rest} />;
}
