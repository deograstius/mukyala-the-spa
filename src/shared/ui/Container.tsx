import * as React from 'react';

export interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Consistent content width wrapper matching existing Webflow classes.
 * Keeps markup tidy without changing styles.
 */
export default function Container({ children, className, as: Tag = 'div' }: ContainerProps) {
  const base = 'w-layout-blockcontainer container-default w-container';
  const cls = className ? `${base} ${className}` : base;
  return <Tag className={cls}>{children}</Tag>;
}
