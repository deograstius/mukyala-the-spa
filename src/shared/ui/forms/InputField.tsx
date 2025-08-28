import * as React from 'react';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export default function InputField({ className, ...rest }: InputFieldProps) {
  const cls = className ?? 'input-line medium w-input';
  return <input className={cls} {...rest} />;
}
