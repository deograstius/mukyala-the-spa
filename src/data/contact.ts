import type { Location } from '../types/data';

export const defaultTimezone = 'America/Los_Angeles';

export const locations: Location[] = [
  {
    id: 'carlsbad-village',
    name: 'Mukyala Day Spa – Carlsbad Village',
    address: {
      line1: '390 Oak Ave',
      city: 'Carlsbad',
      state: 'CA',
      postalCode: '92008',
      country: 'United States',
    },
    mapUrl: 'https://www.google.com/maps/place/390+Oak+Ave,+Carlsbad,+CA+92008',
    phone: { tel: '+14436810463', display: '(443) 681 0463' },
    email: 'info@mukyala.com',
    timezone: defaultTimezone,
    weekdayHours: 'Mon–Fri: 10 am – 6 pm',
    weekendHours: 'Sat–Sun: 10 am – 6 pm',
    hoursByDay: {
      mon: [{ open: '10:00', close: '18:00' }],
      tue: [{ open: '10:00', close: '18:00' }],
      wed: [{ open: '10:00', close: '18:00' }],
      thu: [{ open: '10:00', close: '18:00' }],
      fri: [{ open: '10:00', close: '18:00' }],
      sat: [{ open: '10:00', close: '18:00' }],
      sun: [{ open: '10:00', close: '18:00' }],
    },
  },
];

export const primaryLocation = locations[0];
