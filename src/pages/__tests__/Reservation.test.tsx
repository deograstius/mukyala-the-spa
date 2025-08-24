import { render, screen, fireEvent } from '@testing-library/react';
import Reservation from '../../pages/Reservation';

describe('Reservation page', () => {
  it('renders the simplified form and submits successfully', async () => {
    render(<Reservation />);

    // Heading
    expect(screen.getByRole('heading', { level: 1, name: /book an appointment/i })).toBeTruthy();

    // Fill the form
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } });
    // Select first service option by changing the select value to a known slug
    const serviceSelect = screen.getByLabelText(/service/i) as HTMLSelectElement;
    // Fallback: pick the first non-empty option in the select
    const firstOption = Array.from(serviceSelect.options).find((o) => o.value);
    if (!firstOption) throw new Error('No service options available');
    fireEvent.change(serviceSelect, { target: { value: firstOption.value } });
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
    expect(data?.serviceSlug).toBe(firstOption?.value);
    expect(data?.dateTime).toBe('2030-01-01T10:00');
  });

  it('shows validation errors for missing required fields', async () => {
    render(<Reservation />);
    // Submit without filling required date/time or phone
    // Name filled only
    const name = screen.getByLabelText(/name/i);
    fireEvent.change(name, { target: { value: 'A' } }); // too short, also triggers name validation
    fireEvent.click(screen.getByRole('button', { name: /make a reservation/i }));

    // Expect required messages or validation prompts
    expect(await screen.findAllByText(/required|enter a valid phone number/i)).toBeTruthy();
  });

  it('rejects out-of-hours PT time', async () => {
    render(<Reservation />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '1234567890' } });
    const serviceSelect = screen.getByLabelText(/service/i) as HTMLSelectElement;
    const firstOption = Array.from(serviceSelect.options).find((o) => o.value);
    if (!firstOption) throw new Error('No service options available');
    fireEvent.change(serviceSelect, { target: { value: firstOption.value } });
    // Set PT time 22:00 which is outside 9–19
    fireEvent.change(screen.getByLabelText(/date and time/i), {
      target: { value: '2031-01-01T22:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: /make a reservation/i }));
    expect(await screen.findByText(/select a time between 9:00 and 19:00/i)).toBeInTheDocument();
  });

  // Note: additional time-based tests can be added with explicit mocks if needed.
});
