export interface ReservationRequest {
  name: string;
  phone: string; // original, as entered
  phoneNormalized: string; // digits-only normalization
  email?: string;
  serviceSlug: string;
  date: string; // YYYY-MM-DD (calendar day)
  startAt: string; // UTC ISO slot timestamp
  timezone: string; // IANA timezone used for slot selection
  at: string; // ISO timestamp when captured
}
