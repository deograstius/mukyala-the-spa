import type { HTMLAttributes, ElementType } from 'react';

export interface ListProps extends HTMLAttributes<HTMLDivElement> {
  as?: ElementType;
  role?: 'list' | 'listbox' | 'menu' | string;
}

export default function List({ as: Tag = 'div', role = 'list', className, ...rest }: ListProps) {
  const cls = className ? className : '';
  const Comp = Tag as ElementType;
  return <Comp role={role} className={cls} {...rest} />;
}
