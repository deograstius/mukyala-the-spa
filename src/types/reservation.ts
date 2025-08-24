export interface ReservationRequest {
  name: string;
  phone: string; // original, as entered
  phoneNormalized: string; // digits-only normalization
  email?: string;
  serviceSlug: string;
  dateTime: string; // local datetime string from input
  at: string; // ISO timestamp when captured
}
