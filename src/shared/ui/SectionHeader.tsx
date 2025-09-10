import type { ReactNode, ElementType } from 'react';

export interface SectionHeaderProps {
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
  titleClassName?: string;
  titleAs?: ElementType;
}

/**
 * Simple header block used by sections that show a left-aligned title
 * and optional right-aligned actions row.
 */
export default function SectionHeader({
  title,
  actions,
  className,
  titleClassName = 'display-9',
  titleAs: Title = 'h2',
}: SectionHeaderProps) {
  return (
    <div className={`title-left---content-right${className ? ` ${className}` : ''}`}>
      {(Title as ElementType) && <Title className={titleClassName}>{title}</Title>}
      {actions ? <div className="buttons-row left">{actions}</div> : null}
    </div>
  );
}
