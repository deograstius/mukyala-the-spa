import type { HTMLAttributes, ElementType } from 'react';

export interface ListItemProps extends HTMLAttributes<HTMLDivElement> {
  as?: ElementType;
}

export default function ListItem({ as: Tag = 'div', className, ...rest }: ListItemProps) {
  const cls = className ? className : '';
  const Comp = Tag as ElementType;
  return <Comp role="listitem" className={cls} {...rest} />;
}
