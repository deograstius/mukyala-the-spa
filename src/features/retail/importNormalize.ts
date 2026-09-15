/**
 * Normalizers for barcode-feed product data (B7/M2 in NOTES/spa-pages.md).
 *
 * Raw commercial barcode-database rows carry artifacts that must never reach
 * the customer shop verbatim: "[esthemax] DIAMOND GLOW BOOST HYDROJELLY®
 * MASK" bracket prefixes and ALL-CAPS shouting, "… Face Mask - LB" variant
 * suffixes, and spec-sheet descriptions with embedded "DESCRIPTION" labels.
 * These helpers clean the prefill BEFORE staff review, so the reviewed text
 * is what ships.
 */

const SMALL_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'by',
  'for',
  'in',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
]);

function toTitleCase(input: string): string {
  const words = input.toLowerCase().split(/\s+/);
  return words
    .map((word, i) => {
      if (i > 0 && i < words.length - 1 && SMALL_WORDS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/** Share of letters that are uppercase (0..1); non-letters ignored. */
function uppercaseRatio(input: string): number {
  const letters = input.replace(/[^a-zA-Z]/g, '');
  if (!letters) return 0;
  const uppers = letters.replace(/[^A-Z]/g, '');
  return uppers.length / letters.length;
}

export function normalizeImportedTitle(raw: string): string {
  let title = raw.trim();

  // "[esthemax] Diamond Glow…" → "Diamond Glow… (Esthemax)" — keep the brand,
  // drop the feed's bracket notation.
  const bracket = title.match(/^\[([^\]]+)\]\s*(.+)$/);
  let brand: string | undefined;
  if (bracket) {
    brand = bracket[1].trim();
    title = bracket[2].trim();
  }

  // Trailing variant codes: " - LB", " -XL2" … (dash + short all-caps token).
  title = title.replace(/\s+-\s*[A-Z0-9]{1,4}$/, '').trim();

  // Collapse whitespace.
  title = title.replace(/\s+/g, ' ');

  // De-shout: mostly-uppercase feed titles become Title Case.
  if (uppercaseRatio(title) > 0.6 && title.length > 6) {
    title = toTitleCase(title);
  }

  if (brand) {
    const brandDisplay = uppercaseRatio(brand) > 0.6 ? toTitleCase(brand) : brand;
    // Only append when the brand isn't already part of the name.
    if (!title.toLowerCase().includes(brand.toLowerCase())) {
      title = `${title} (${brandDisplay})`;
    }
  }

  return title;
}

export function normalizeImportedDescription(raw: string): string {
  let description = raw.trim();

  // Strip embedded feed labels like a leading "DESCRIPTION" line/token.
  description = description.replace(/^\s*DESCRIPTION\s*:?\s*/i, '');
  description = description.replace(/\n\s*DESCRIPTION\s*:?\s*/gi, '\n');

  // Collapse 3+ newlines to paragraph breaks; trim trailing whitespace.
  description = description.replace(/\n{3,}/g, '\n\n').trim();

  return description;
}
