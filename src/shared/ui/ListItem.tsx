import * as React from 'react';

export interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: keyof JSX.IntrinsicElements;
}

export default function ListItem({ as: Tag = 'div', className, ...rest }: ListItemProps) {
  const cls = className ? className : '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Comp: any = Tag;
  return <Comp role="listitem" className={cls} {...rest} />;
}
