import { RouterProvider } from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server, http, HttpResponse } from '../../test/msw.server';
import { createAdminRouter } from '../AdminApp';

// The real scanner needs a camera + the zxing WASM decoder; the door flow is
// what these tests cover, so the scanner is a stub that "detects" on click.
vi.mock('../retail/BarcodeScanner', () => ({
  default: ({ onDetected }: { onDetected: (code: string) => void }) => (
    <div>
      <button onClick={() => onDetected('MKY-4F7Q2')}>mock-scan</button>
    </div>
  ),
}));

const TOKEN_KEY = 'retail:token:v1';

const doorList = {
  counts: {
    total: { sold: 4, checkedIn: 2 },
    bySession: {
      S1: { sold: 3, checkedIn: 2 },
      S2: { sold: 1, checkedIn: 0 },
    },
  },
  tickets: [
    {
      code: 'MKY-4F7Q2',
      attendeeName: 'Amina K.',
      session: 'S1',
      tier: 'GA',
      tierLabel: 'General admission',
      status: 'issued',
      checkedInAt: null,
    },
    {
      code: 'MKY-9XT1M',
      attendeeName: 'Jordan M.',
      session: 'S1',
      tier: 'GA',
      tierLabel: 'General admission',
      status: 'checked_in',
      checkedInAt: '2026-10-17T22:12:00.000Z',
    },
  ],
};

function listHandler() {
  return http.get('/v1/retail/event/tickets', () => HttpResponse.json(doorList));
}

function renderDoor() {
  return render(<RouterProvider router={createAdminRouter(['/door'])} />);
}

describe('DoorPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(TOKEN_KEY, 'staff-token');
  });

  it('shows the selected session live counts', async () => {
    server.use(listHandler());
    renderDoor();
    await waitFor(() => expect(screen.getByText('2 in')).toBeInTheDocument());
    expect(screen.getByText(/\/ 3 sold/)).toBeInTheDocument();
  });

  it('checked-in verdict: green state with name, tier, and the wristband step', async () => {
    server.use(
      listHandler(),
      http.post('/v1/retail/event/checkin', async ({ request }) => {
        const body = (await request.json()) as { code: string };
        expect(body.code).toBe('MKY-4F7Q2');
        return HttpResponse.json({
          result: 'checked_in',
          code: 'MKY-4F7Q2',
          attendeeName: 'Amina K.',
          session: 'S1',
          tier: 'GA',
          sessionLabel: 'Session 1 · Early afternoon',
          tierLabel: 'General admission',
          checkedInAt: '2026-10-17T22:42:00.000Z',
        });
      }),
    );
    renderDoor();
    await userEvent.click(await screen.findByText('mock-scan'));
    await waitFor(() => expect(screen.getByText('Checked in')).toBeInTheDocument());
    expect(screen.getByText('Amina K.')).toBeInTheDocument();
    expect(screen.getByText(/Issue a wristband/)).toBeInTheDocument();
    // Back to the scanner for the next guest.
    await userEvent.click(screen.getByText('Scan next'));
    expect(await screen.findByText('mock-scan')).toBeInTheDocument();
  });

  it('already-scanned verdict: red state with the FIRST scan time and wristband check', async () => {
    server.use(
      listHandler(),
      http.post('/v1/retail/event/checkin', () =>
        HttpResponse.json({
          result: 'already_scanned',
          code: 'MKY-4F7Q2',
          attendeeName: 'Jordan M.',
          session: 'S1',
          tier: 'GA',
          sessionLabel: 'Session 1 · Early afternoon',
          tierLabel: 'General admission',
          checkedInAt: '2026-10-17T22:12:00.000Z',
        }),
      ),
    );
    renderDoor();
    await userEvent.click(await screen.findByText('mock-scan'));
    await waitFor(() => expect(screen.getByText('Already scanned')).toBeInTheDocument());
    expect(screen.getByText(/First checked in at/)).toBeInTheDocument();
    expect(screen.getByText(/Check the wristband for re-entry/)).toBeInTheDocument();
  });

  it('unknown code: ticket-not-found state', async () => {
    server.use(
      listHandler(),
      http.post('/v1/retail/event/checkin', () =>
        HttpResponse.json({ error: 'not_found' }, { status: 404 }),
      ),
    );
    renderDoor();
    await userEvent.click(await screen.findByText('mock-scan'));
    await waitFor(() => expect(screen.getByText('Ticket not found')).toBeInTheDocument());
  });

  it('attendee list: search view with manual check-in for unscanned guests', async () => {
    server.use(listHandler());
    renderDoor();
    await userEvent.click(await screen.findByText('Attendee list'));
    expect(await screen.findByText('Amina K.')).toBeInTheDocument();
    expect(screen.getByText('Jordan M.')).toBeInTheDocument();
    // Checked-in guests show state, unscanned guests get the button.
    expect(screen.getByText(/● Checked in/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check in' })).toBeInTheDocument();
  });
});
