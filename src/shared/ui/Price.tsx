import * as React from 'react';
import { formatCurrency } from '../../utils/currency';

export interface PriceProps {
  cents: number;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export default function Price({ cents, as: Tag = 'span', className }: PriceProps) {
  const value = formatCurrency(cents);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Comp: any = Tag;
  return <Comp className={className}>{value}</Comp>;
}
