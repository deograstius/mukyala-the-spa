import type { Location } from '../types/data';

export const defaultTimezone = 'America/Los_Angeles';

export const locations: Location[] = [
  {
    id: 'carlsbad-village',
    name: 'Mukyala The Spa – Carlsbad Village',
    address: {
      line1: '390 Oak Ave',
      city: 'Carlsbad',
      state: 'CA',
      postalCode: '92008',
      country: 'United States',
    },
    mapUrl: 'https://www.google.com/maps/place/390+Oak+Ave,+Carlsbad,+CA+92008',
    // Canonical site-wide phone. Operator decision (locked, 2026-05-01): the ONLY
    // public-facing phone number is +17602766583 / (760) 276-6583. Disclosure pages,
    // SMS link `tel:` hrefs, and tests import `primaryLocation.phone` from this file
    // so future swaps are 1-line. Do not duplicate the literal elsewhere.
    phone: { tel: '+17602766583', display: '(760) 276-6583' },
    email: 'info@mukyala.com',
    timezone: defaultTimezone,
    // Operator, 2026-09-24 (checked with Aryea): Monday, Wednesday, Thursday
    // 11 am to 4 pm. The Google Business Profile and the API location row
    // mirror these hours; change all three together.
    weekdayHours: 'Mon, Wed, Thu: 11 am – 4 pm',
    hoursByDay: {
      mon: [{ open: '11:00', close: '16:00' }],
      wed: [{ open: '11:00', close: '16:00' }],
      thu: [{ open: '11:00', close: '16:00' }],
    },
  },
];

export const primaryLocation = locations[0];
