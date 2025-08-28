import type { Location } from '../types/data';

export const defaultTimezone = 'America/Los_Angeles';

export const locations: Location[] = [
  {
    id: 'carlsbad-village',
    name: 'Mukyala Day Spa – Carlsbad Village',
    address: {
      line1: '2951 State Street',
      city: 'Carlsbad',
      state: 'CA',
      postalCode: '92008',
      country: 'United States',
    },
    mapUrl: 'https://www.google.com/maps/place/2951+State+St,+Carlsbad,+CA+92008',
    phone: { tel: '+17608701087', display: '(760) 870 1087' },
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
