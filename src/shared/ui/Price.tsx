import type { ElementType } from 'react';
import { formatCurrency } from '../../utils/currency';

export interface PriceProps {
  cents: number;
  as?: ElementType;
  className?: string;
}

export default function Price({ cents, as: Tag = 'span', className }: PriceProps) {
  const value = formatCurrency(cents);
  const Comp = Tag as ElementType;
  return <Comp className={className}>{value}</Comp>;
}
