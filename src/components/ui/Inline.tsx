import * as React from 'react';

export interface InlineProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: keyof JSX.IntrinsicElements;
}

// Minimal horizontal inline wrapper that merely forwards classes/props.
export default function Inline({ as: Tag = 'div', className, ...rest }: InlineProps) {
  const base = '';
  const cls = className ? `${base}${className}`.trim() : base.trim();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Comp: any = Tag;
  return <Comp className={cls} {...rest} />;
}
