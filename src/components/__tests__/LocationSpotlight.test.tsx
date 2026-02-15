import type { Location } from '@app-types/data';
import LocationSpotlight from '@features/home/LocationSpotlight';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('LocationSpotlight section', () => {
  it('renders heading, address, phone, email, and image', () => {
    const mockLocation: Location = {
      id: 'loc-1',
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
      timezone: 'America/Los_Angeles',
      hoursByDay: {
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        sat: [],
        sun: [],
      },
      weekdayHours: 'Mon–Fri: 10 am – 6 pm',
      weekendHours: 'Sat–Sun: 10 am – 6 pm',
    };
    render(<LocationSpotlight location={mockLocation} />);

    expect(screen.getByRole('heading', { name: /our location/i })).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: /390 oak ave, carlsbad, ca 92008, united states/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /\(443\) 681 0463/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /info@mukyala.com/i })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /mukyala treatment room with illuminated sign/i }),
    ).toBeInTheDocument();
  });
});
