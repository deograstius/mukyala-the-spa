import * as React from 'react';

export interface SectionHeaderProps {
  title: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  titleAs?: keyof JSX.IntrinsicElements;
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
  titleAs: TitleTag = 'h2',
}: SectionHeaderProps) {
  return (
    <div className={`title-left---content-right${className ? ` ${className}` : ''}`}>
      <TitleTag className={titleClassName}>{title}</TitleTag>
      {actions ? <div className="buttons-row left">{actions}</div> : null}
    </div>
  );
}
