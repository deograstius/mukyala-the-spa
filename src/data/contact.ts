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
    // Operator, 2026-09-24: open Saturdays only for now. Google Business
    // Profile mirrors these hours; change both together.
    weekdayHours: 'Saturdays: 10 am – 6 pm',
    hoursByDay: {
      sat: [{ open: '10:00', close: '18:00' }],
    },
  },
];

export const primaryLocation = locations[0];
