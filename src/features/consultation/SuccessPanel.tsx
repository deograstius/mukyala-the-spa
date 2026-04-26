/**
 * Consultation success confirmation panel.
 *
 * Source: MD §16 (success state) + §18.4 (expectation setter) + §19.1
 *         (immediate auto-response copy).
 *
 * Operator-confirmed copy for v1:
 *   - SLA: "We'll respond within 2 business days." (chunk pin)
 *   - Show submission_id as a reference number.
 *   - Show the 3-step "What happens next" list (MD §18.4).
 *
 * No marketing opt-in. No upsell. No price quote — that comes later in
 * the staff-authored prognosis email (MD §19.4).
 */

import { emitTelemetry } from '@app/telemetry';
import { useEffect } from 'react';
import { CONSULTATION_SLA_BUSINESS_DAYS } from './schema';

export interface SuccessPanelProps {
  firstName: string;
  submissionId: string;
  receivedAt?: string;
}

export default function SuccessPanel({ firstName, submissionId, receivedAt }: SuccessPanelProps) {
  useEffect(() => {
    // MD §17 forbids tracking field VALUES — only metadata. submission_id
    // is the server-issued reference and is safe to emit.
    emitTelemetry({
      event: 'consultation_submit_succeeded',
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      method: 'POST',
      props: { submission_id: submissionId },
    });
  }, [submissionId]);

  const greeting = firstName
    ? `Got it, ${firstName} — we've received your consultation request.`
    : `Got it — we've received your consultation request.`;

  return (
    <div className="card thank-you-message consultation-success" role="status" aria-live="polite">
      <h1 className="display-5 semi-bold">{greeting}</h1>
      <p className="paragraph-medium">
        We&apos;ll respond within {CONSULTATION_SLA_BUSINESS_DAYS} business days. Look for an email
        from Mukyala.
      </p>
      <p className="paragraph-medium">
        Reference:{' '}
        <code className="consultation-reference-pill" data-testid="consultation-submission-id">
          {submissionId}
        </code>
        {receivedAt ? (
          <span className="paragraph-small">
            {' '}
            · received {new Date(receivedAt).toLocaleString()}
          </span>
        ) : null}
      </p>
      <div className="consultation-expectation" aria-label="What happens next">
        <p className="paragraph-medium semi-bold">What happens next:</p>
        <ol className="consultation-expectation-list">
          <li>We review your information (1–{CONSULTATION_SLA_BUSINESS_DAYS} business days).</li>
          <li>You receive a personalized skin assessment by email.</li>
          <li>If you like the recommendations, you can book — or not. Your call.</li>
        </ol>
      </div>
    </div>
  );
}
