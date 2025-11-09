import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import { OPENING_HOURS } from '../../constants/hours';
import Reservation from '../../pages/Reservation';

describe('Reservation page', () => {
  it('renders the simplified form and submits successfully', async () => {
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
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } });
    // Wait for services to load and select first option
    const serviceSelect = await screen.findByLabelText(/service/i);
    // Wait for option to be present
    const opt = await screen.findByRole('option', { name: /baobab glow facial/i });
    const selectEl = serviceSelect as HTMLSelectElement;
    fireEvent.change(selectEl, {
      target: { value: (opt as HTMLOptionElement).value || 'baobab-glow-facial' },
    });
    // Set a future date/time
    fireEvent.change(screen.getByLabelText(/date and time/i), {
      target: { value: '2030-01-01T10:00' },
    });

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
    expect(data?.serviceSlug).toBe('baobab-glow-facial');
    expect(data?.dateTime).toBe('2030-01-01T10:00');
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

    // Expect required messages or validation prompts
    expect(await screen.findAllByText(/required|enter a valid phone number/i)).toBeTruthy();
  });

  it('rejects out-of-hours PT time', async () => {
    const qc3 = new QueryClient();
    render(
      <QueryClientProvider client={qc3}>
        <Reservation />
      </QueryClientProvider>,
    );
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '1234567890' } });
    const serviceSelect = await screen.findByLabelText(/service/i);
    const opt = await screen.findByRole('option', { name: /baobab glow facial/i });
    fireEvent.change(serviceSelect, {
      target: { value: (opt as HTMLOptionElement).value || 'baobab-glow-facial' },
    });
    // Set PT time 22:00 which is outside 9–19
    fireEvent.change(screen.getByLabelText(/date and time/i), {
      target: { value: '2031-01-01T22:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: /make a reservation/i }));
    const { openHour, closeHour } = OPENING_HOURS;
    const re = new RegExp(`select a time between ${openHour}:00 and ${closeHour}:00`, 'i');
    expect(await screen.findByText(re)).toBeInTheDocument();
  });

  it('does not prefill date/time; user must choose explicitly', () => {
    const qc4 = new QueryClient();
    render(
      <QueryClientProvider client={qc4}>
        <Reservation />
      </QueryClientProvider>,
    );
    const dt = screen.getByLabelText(/date and time/i) as HTMLInputElement;
    expect(dt.value).toBe('');
  });
});
