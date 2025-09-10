import type { ReactNode, ElementType } from 'react';

export interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

/**
 * Consistent content width wrapper matching existing Webflow classes.
 * Keeps markup tidy without changing styles.
 */
export default function Container({ children, className, as: Tag = 'div' }: ContainerProps) {
  const base = 'w-layout-blockcontainer container-default w-container';
  const cls = className ? `${base} ${className}` : base;
  const Comp = Tag as ElementType;
  return <Comp className={cls}>{children}</Comp>;
}
