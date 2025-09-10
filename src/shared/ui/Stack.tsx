import type { HTMLAttributes, ElementType } from 'react';

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  as?: ElementType;
}

// Minimal vertical stack that merely forwards classes/props.
export default function Stack({ as: Tag = 'div', className, ...rest }: StackProps) {
  const base = '';
  const cls = className ? `${base}${className}`.trim() : base.trim();
  const Comp = Tag as ElementType;
  return <Comp className={cls} {...rest} />;
}
