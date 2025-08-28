import * as React from 'react';

export interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export default function PhoneInput({ className, ...rest }: PhoneInputProps) {
  const cls = className ?? 'input-line medium w-input';
  return <input inputMode="numeric" className={cls} {...rest} />;
}
