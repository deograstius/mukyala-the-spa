export function formatUSPhone(digitsOnly: string): string {
  const d = digitsOnly.replace(/\D/g, '');
  if (!d) return '';

  let country = '';
  let rest = d;
  if (d.length > 10 && d.startsWith('1')) {
    country = '+1 ';
    rest = d.slice(1);
  }

  const a = rest.slice(0, 3);
  const b = rest.slice(3, 6);
  const c = rest.slice(6, 10);

  if (rest.length <= 3) return country + `(${a}`;
  if (rest.length <= 6) return country + `(${a}) ${b}`;
  return country + `(${a}) ${b}-${c}`;
}
