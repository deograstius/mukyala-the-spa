export function isValidName(name: string): boolean {
  const n = name.trim();
  if (n.length < 2 || n.length > 80) return false;
  // Allow letters, spaces, apostrophes, and hyphens
  return /^[A-Za-z][A-Za-z '\-.]{1,79}$/.test(n);
}

export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function isValidPhone(phone: string): boolean {
  const digits = normalizePhoneDigits(phone);
  return digits.length >= 7 && digits.length <= 15;
}

export function isValidEmail(email: string): boolean {
  return /.+@.+\..+/.test(email);
}
