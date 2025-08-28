import * as React from 'react';

export interface DateTimeFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export default function DateTimeField({ className, ...rest }: DateTimeFieldProps) {
  const cls = className ?? 'input-line medium w-input';
  return <input type="datetime-local" className={cls} {...rest} />;
}
