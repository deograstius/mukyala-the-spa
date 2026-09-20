import { apiGet, apiPost } from '@utils/api';
import { getRetailToken } from '../retail/retailApi';

/**
 * Client for the staff event-door API (core-api /v1/retail/event/*, which
 * proxies to the orders service). Same bearer token as the retail
 * back-office — one staff login covers the shift.
 */

function authHeaders(): Record<string, string> {
  const token = getRetailToken();
  return token ? { authorization: `Bearer ${token}` } : {};
}

export type DoorSession = 'S1' | 'S2' | 'all';

export type DoorCounts = {
  total: { sold: number; checkedIn: number };
  bySession: Record<'S1' | 'S2', { sold: number; checkedIn: number }>;
};

export type DoorTicket = {
  code: string;
  attendeeName: string;
  session: 'S1' | 'S2';
  tier: 'GA' | 'VIP';
  tierLabel: string;
  status: 'issued' | 'checked_in';
  checkedInAt: string | null;
};

export type DoorList = { counts: DoorCounts; tickets: DoorTicket[] };

export async function fetchDoorList(session: DoorSession, q?: string): Promise<DoorList> {
  const params = new URLSearchParams({ session });
  if (q?.trim()) params.set('q', q.trim());
  return apiGet<DoorList>(`/v1/retail/event/tickets?${params.toString()}`, {
    headers: authHeaders(),
  });
}

export type CheckinVerdict = {
  result: 'checked_in' | 'already_scanned';
  code: string;
  attendeeName: string;
  session: 'S1' | 'S2';
  tier: 'GA' | 'VIP';
  sessionLabel: string;
  tierLabel: string;
  checkedInAt: string;
};

export async function checkinTicket(code: string): Promise<CheckinVerdict> {
  return apiPost<CheckinVerdict>('/v1/retail/event/checkin', { code }, { headers: authHeaders() });
}

export async function sendFollowup(
  subject: string,
  message: string,
): Promise<{ sent: number; failed: number; buyers: number }> {
  return apiPost<{ sent: number; failed: number; buyers: number }>(
    '/v1/retail/event/followup',
    { subject, message },
    { headers: authHeaders() },
  );
}
