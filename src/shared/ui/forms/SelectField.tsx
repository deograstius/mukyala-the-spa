import * as React from 'react';

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

export default function SelectField({ className, children, ...rest }: SelectFieldProps) {
  const cls = className ?? 'input-line medium w-input';
  return (
    <select className={cls} {...rest}>
      {children}
    </select>
  );
}
