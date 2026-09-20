import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { server, http, HttpResponse } from '../../test/msw.server';
import Thanks from '../pages/Thanks';

const confirmedOrder = {
  id: 'order-1',
  email: 'amina@example.com',
  status: 'confirmed',
  subtotalCents: 75000,
  items: [],
  surveySubmitted: false,
  tickets: [
    {
      code: 'MKY-4F7Q2',
      attendeeName: 'Amina Kalisa',
      session: 'S1',
      tier: 'GA',
      sessionLabel: 'Session 1 · Early afternoon',
      tierLabel: 'General admission',
    },
    {
      code: 'MKY-9XT1M',
      attendeeName: 'Sam T.',
      session: 'S1',
      tier: 'VIP',
      sessionLabel: 'Session 1 · Early afternoon',
      tierLabel: 'VIP',
    },
  ],
};

function seedSnapshot() {
  window.sessionStorage.setItem(
    'dmv-thanks:v1:order-1',
    JSON.stringify({
      orderId: 'order-1',
      token: 'tok-1',
      email: 'amina@example.com',
      storedAt: Date.now(),
    }),
  );
}

describe('dmv Thanks page', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/thanks?orderId=order-1');
    window.sessionStorage.clear();
  });

  it('shows the payment-pending state until tickets exist, then the Got-it state', async () => {
    seedSnapshot();
    let call = 0;
    server.use(
      http.get('/orders/v1/orders/order-1', () => {
        call += 1;
        if (call === 1) {
          return HttpResponse.json({ ...confirmedOrder, status: 'checkout_started', tickets: [] });
        }
        return HttpResponse.json(confirmedOrder);
      }),
    );
    render(<Thanks />);
    expect(await screen.findByText(/confirming your payment/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Got it, Amina/)).toBeInTheDocument(), {
      timeout: 10000,
    });
    expect(screen.getByText('MKY-4F7Q2')).toBeInTheDocument();
    expect(screen.getByText('MKY-9XT1M')).toBeInTheDocument();
    expect(screen.getByText(/sent to a•••@example.com/)).toBeInTheDocument();
  }, 15000);

  it('submits the survey and thanks the buyer', async () => {
    seedSnapshot();
    let surveyBody: any = null;
    server.use(
      http.get('/orders/v1/orders/order-1', () => HttpResponse.json(confirmedOrder)),
      http.post('/orders/v1/orders/order-1/survey', async ({ request }) => {
        surveyBody = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    render(<Thanks />);
    await screen.findByText(/Got it, Amina/);
    await userEvent.click(screen.getByRole('radio', { name: /First time/ }));
    await userEvent.type(screen.getByPlaceholderText(/dark spots/), 'dark spots on my cheeks');
    await userEvent.click(screen.getByRole('radio', { name: /With people/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Send answers' }));
    await waitFor(() => expect(screen.getByText('Thank you.')).toBeInTheDocument());
    expect(surveyBody).toMatchObject({
      facialExperience: 'first_time',
      skinConcern: 'dark spots on my cheeks',
      groupType: 'with_people',
    });
  });

  it('without a stored token it falls back to check-your-email', async () => {
    render(<Thanks />);
    expect(await screen.findByText('Check your email.')).toBeInTheDocument();
  });

  it('declined_sold_out shows the never-charged loser path', async () => {
    seedSnapshot();
    server.use(
      http.get('/orders/v1/orders/order-1', () =>
        HttpResponse.json({ ...confirmedOrder, status: 'declined_sold_out', tickets: [] }),
      ),
    );
    render(<Thanks />);
    expect(await screen.findByText(/Those seats just sold out/)).toBeInTheDocument();
    expect(screen.getByText(/never charged/)).toBeInTheDocument();
  });
});
