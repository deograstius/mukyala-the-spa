import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { OPENING_HOURS } from '../../constants/hours';
import Reservation from '../../pages/Reservation';
import { server, http, HttpResponse } from '../../test/msw.server';
import { zonedTimeToUtc } from '../../utils/tz';

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const mod10 = n % 10;
  if (mod10 === 1) return `${n}st`;
  if (mod10 === 2) return `${n}nd`;
  if (mod10 === 3) return `${n}rd`;
  return `${n}th`;
}

function dayPickerAriaLabel(d: Date): string {
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(d);
  const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(d);
  const year = new Intl.DateTimeFormat('en-US', { year: 'numeric' }).format(d);
  return `${weekday}, ${month} ${ordinal(d.getDate())}, ${year}`;
}

describe('Reservation page', () => {
  it('renders the simplified form and submits successfully', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = formatYmd(tomorrow);
    const [year, month, day] = date.split('-').map((n) => parseInt(n, 10));
    const selectedUtc = zonedTimeToUtc(
      { year, month, day, hour: 10, minute: 0 },
      'America/Los_Angeles',
    ).toISOString();

    server.use(
      http.get('/v1/locations/:locationId/services/:serviceSlug/availability', ({ request }) => {
        const url = new URL(request.url);
        const d = url.searchParams.get('date');
        if (d === date) {
          return HttpResponse.json({ timezone: 'America/Los_Angeles', slots: [selectedUtc] });
        }
        return HttpResponse.json({ timezone: 'America/Los_Angeles', slots: [] });
      }),
    );

    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <Reservation />
      </QueryClientProvider>,
    );

    // Heading
    expect(screen.getByRole('heading', { level: 1, name: /book an appointment/i })).toBeTruthy();

    // Fill the form
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText(/example@youremail.com/i), {
      target: { value: 'jane@example.com' },
    });
    // Wait for services to load and select first option
    const serviceSelect = await screen.findByLabelText(/service/i);
    // Wait for option to be present
    const opt = await screen.findByRole('option', { name: /so afric(al|a)l facial/i });
    const selectEl = serviceSelect as HTMLSelectElement;
    fireEvent.change(selectEl, {
      target: { value: (opt as HTMLOptionElement).value || 'so-africal-facial' },
    });

    // Pick a date (tomorrow)
    const dateGroup = screen.getByRole('group', { name: 'Date' });
    fireEvent.click(within(dateGroup).getByRole('button', { name: dayPickerAriaLabel(tomorrow) }));

    // Pick a time (10:00 AM) – enabled by mocked availability (wait for availability fetch)
    await waitFor(() => expect(screen.getByRole('button', { name: '10:00 AM' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: '10:00 AM' }));

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /make a reservation/i }));

    // Success message
    expect(await screen.findByText(/thank you! we’ll get back to you soon/i)).toBeVisible();

    // Persisted payload
    const stored = window.localStorage.getItem('reservation:v1:last');
    expect(stored).toBeTruthy();
    const data = stored ? JSON.parse(stored) : null;
    expect(data?.name).toBe('Jane Doe');
    expect(data?.email).toBe('jane@example.com');
    expect(data?.serviceSlug).toBe('so-africal-facial');
    expect(data?.date).toBe(date);
    expect(data?.startAt).toBe(selectedUtc);
    expect(data?.timezone).toBe('America/Los_Angeles');
  });

  it('shows validation errors for missing required fields', async () => {
    const qc2 = new QueryClient();
    render(
      <QueryClientProvider client={qc2}>
        <Reservation />
      </QueryClientProvider>,
    );
    // Submit without filling required date/time or phone
    // Name filled only
    const name = screen.getByLabelText(/name/i);
    fireEvent.change(name, { target: { value: 'A' } }); // too short, also triggers name validation
    fireEvent.click(screen.getByRole('button', { name: /make a reservation/i }));

    expect(await screen.findByText(/please enter your full name/i)).toBeVisible();
  });

  it('disables past dates (based on spa timezone)', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-02-16T20:00:00.000Z')); // 12:00pm PT

      const qc = new QueryClient();
      render(
        <QueryClientProvider client={qc}>
          <Reservation />
        </QueryClientProvider>,
      );

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const dateGroup = screen.getByRole('group', { name: 'Date' });
      expect(
        within(dateGroup).getByRole('button', { name: dayPickerAriaLabel(yesterday) }),
      ).toBeDisabled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('greys out times outside working hours', async () => {
    const qc3 = new QueryClient();
    render(
      <QueryClientProvider client={qc3}>
        <Reservation />
      </QueryClientProvider>,
    );
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText(/example@youremail.com/i), {
      target: { value: 'jane@example.com' },
    });
    const serviceSelect = await screen.findByLabelText(/service/i);
    const opt = await screen.findByRole('option', { name: /so afric(al|a)l facial/i });
    fireEvent.change(serviceSelect, {
      target: { value: (opt as HTMLOptionElement).value || 'so-africal-facial' },
    });

    // Pick a date so the time grid renders
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateGroup = screen.getByRole('group', { name: 'Date' });
    fireEvent.click(within(dateGroup).getByRole('button', { name: dayPickerAriaLabel(tomorrow) }));

    // Midnight is always outside working hours
    const midnight = await screen.findByRole('button', { name: '12:00 AM' });
    expect(midnight).toBeDisabled();

    // Sanity: a within-hours option exists
    const { openHour, closeHour } = OPENING_HOURS;
    expect(openHour).toBeLessThan(closeHour);
  });

  it('does not prefill date/time; user must choose explicitly', () => {
    const qc4 = new QueryClient();
    render(
      <QueryClientProvider client={qc4}>
        <Reservation />
      </QueryClientProvider>,
    );
    expect(screen.queryByRole('button', { name: '10:00 AM' })).toBeNull();
  });
});
