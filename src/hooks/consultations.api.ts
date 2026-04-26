/**
 * Consultation form (Form 1 / `intake`) API hook.
 *
 * Mirrors the pattern in `useCreateReservation` (./reservations.api.ts).
 * Endpoint: POST /v1/consultations on `mukyala-core-api`.
 *
 * MD §11 submission contract:
 *   - Content-Type: application/json
 *   - Idempotency-Key header: uuid v4 per submit attempt, stable across retries
 *   - X-Client-Session-Id header: same uuid v4 used for the localStorage draft
 *   - Body: { form_id: 'intake', submitted_at, client_session_id, payload,
 *            signatures, attachments }
 *
 * v1 stance:
 *   - No retry/backoff at the hook layer (react-query surfaces failures;
 *     the MD §11 5xx retry policy is a separate concern).
 *   - No outbox / offline-replay (MD §16) — captured in pm_recommendations.
 */

import type {
  ConsultationSubmitRequest,
  ConsultationSubmitResponse,
} from '@features/consultation/schema';
import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@utils/api';

export type CreateConsultationVariables = {
  body: ConsultationSubmitRequest;
  idempotencyKey: string;
  clientSessionId: string;
};

export type CreateConsultationResult = ConsultationSubmitResponse;

export function useCreateConsultation() {
  return useMutation({
    mutationFn: async (vars: CreateConsultationVariables): Promise<CreateConsultationResult> => {
      const headers: Record<string, string> = {
        'Idempotency-Key': vars.idempotencyKey,
        'X-Client-Session-Id': vars.clientSessionId,
      };
      return apiPost<CreateConsultationResult>('/v1/consultations', vars.body, { headers });
    },
  });
}
