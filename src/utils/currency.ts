export function parsePriceToCents(price: string): number {
  const m = price.replace(/[^0-9.]/g, '');
  const n = Number.parseFloat(m || '0');
  return Math.round(n * 100);
}

export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
