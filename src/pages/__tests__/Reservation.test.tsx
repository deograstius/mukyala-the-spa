import { render, screen, fireEvent } from '@testing-library/react';
import Reservation from '../../pages/Reservation';

describe('Reservation page', () => {
  it('renders the form and submits successfully', async () => {
    render(<Reservation />);

    // Heading
    expect(screen.getByRole('heading', { level: 1, name: /book an appointment/i })).toBeTruthy();

    // Fill the form
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText(/service/i), {
      target: { value: 'Baobab Glow Facial' },
    });
    fireEvent.change(screen.getByLabelText(/day and month/i), { target: { value: 'Oct 10' } });
    fireEvent.change(screen.getByLabelText(/schedule/i), { target: { value: '10:00 AM' } });
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Looking forward!' } });

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
  });
});
