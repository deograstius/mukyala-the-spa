import * as React from 'react';

export interface ListProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: keyof JSX.IntrinsicElements;
  role?: 'list' | 'listbox' | 'menu' | string;
}

export default function List({ as: Tag = 'div', role = 'list', className, ...rest }: ListProps) {
  const cls = className ? className : '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Comp: any = Tag;
  return <Comp role={role} className={cls} {...rest} />;
}
