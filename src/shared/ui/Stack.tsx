import * as React from 'react';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: keyof JSX.IntrinsicElements;
}

// Minimal vertical stack that merely forwards classes/props.
export default function Stack({ as: Tag = 'div', className, ...rest }: StackProps) {
  const base = '';
  const cls = className ? `${base}${className}`.trim() : base.trim();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Comp: any = Tag;
  return <Comp className={cls} {...rest} />;
}
