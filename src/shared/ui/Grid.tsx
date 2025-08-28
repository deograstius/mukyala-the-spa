import * as React from 'react';

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: keyof JSX.IntrinsicElements;
}

// Minimal grid wrapper that forwards class names and attributes.
export default function Grid({ as: Tag = 'div', className, ...rest }: GridProps) {
  const cls = className ? className : '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Comp: any = Tag;
  return <Comp className={cls} {...rest} />;
}
