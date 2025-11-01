import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiPost } from '@utils/api';

export type CreateReservationInput = {
  name: string;
  email: string;
  phone?: string; // E.164 if provided
  serviceSlug: string;
  locationId: string;
  startAt: string; // ISO UTC
  timezone: string; // IANA
};

export function useCreateReservation() {
  return useMutation({
    mutationFn: async (payload: CreateReservationInput) => {
      return apiPost('/v1/reservations', payload);
    },
  });
}

export type Reservation = {
  id: string;
  locationId: string;
  serviceSlug: string;
  guestName: string;
  guestEmail: string;
  guestPhoneE164: string | null;
  startAt: string; // ISO
  timezone: string; // IANA
  status: 'pending' | 'confirmed' | 'canceled';
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function useReservationQuery(id?: string, token?: string) {
  const enabled = Boolean(id && token);
  return useQuery({
    queryKey: ['reservation', id, token],
    enabled,
    queryFn: async (): Promise<Reservation> => {
      const q = new URLSearchParams({ token: token as string }).toString();
      return apiGet(`/v1/reservations/${id}?${q}`);
    },
    staleTime: 30 * 1000,
  });
}

export function useConfirmReservation() {
  return useMutation({
    mutationFn: async (args: { id: string; token?: string; code?: string }) => {
      const { id, token, code } = args;
      return apiPost(`/v1/reservations/${encodeURIComponent(id)}/confirm`, { token, code });
    },
  });
}

export function useCancelReservation() {
  return useMutation({
    mutationFn: async (args: { id: string; token?: string; code?: string; reason?: string }) => {
      const { id, token, code, reason } = args;
      return apiPost(`/v1/reservations/${encodeURIComponent(id)}/cancel`, { token, code, reason });
    },
  });
}
