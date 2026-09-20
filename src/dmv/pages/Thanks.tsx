import Button from '@shared/ui/Button';
import ChipSegment from '@shared/ui/forms/ChipSegment';
import { useEffect, useRef, useState } from 'react';
import PillLink from '../PillLink';
import { getEventOrder, submitSurvey, type EventOrderDetail, type SurveyAnswers } from '../api';
import { loadThanksSnapshot } from '../thanksCache';

/**
 * Stripe success_url target. Payment-pending until the webhook confirms and
 * tickets appear (board 03 state D — never show success before it is real);
 * then the "Got it" state with codes + the four-question survey (spec §6).
 */

function maskEmail(email: string | null | undefined): string {
  if (!email) return 'your email';
  const [local = '', domain = ''] = email.split('@');
  if (!local || !domain) return 'your email';
  return `${local[0] ?? ''}•••@${domain}`;
}

const POLL_INTERVAL_MS = 3000;
const POLL_BUDGET_MS = 3 * 60 * 1000;

export default function Thanks() {
  const orderId = new URLSearchParams(window.location.search).get('orderId') ?? '';
  const snapshot = orderId ? loadThanksSnapshot(orderId) : undefined;
  const token = snapshot?.token;
  const [order, setOrder] = useState<EventOrderDetail | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!orderId || !token) return undefined;
    let alive = true;
    const startedAt = Date.now();
    let timer: number | undefined;
    const poll = async () => {
      try {
        const detail = await getEventOrder(orderId, token);
        if (!alive) return;
        setOrder(detail);
        const settled =
          (detail.status === 'confirmed' && (detail.tickets?.length ?? 0) > 0) ||
          detail.status === 'canceled' ||
          detail.status === 'declined_sold_out';
        if (settled) return;
      } catch {
        // transient — keep polling within budget
      }
      if (!alive) return;
      if (Date.now() - startedAt > POLL_BUDGET_MS) {
        setTimedOut(true);
        return;
      }
      timer = window.setTimeout(poll, POLL_INTERVAL_MS);
    };
    void poll();
    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [orderId, token]);

  if (!orderId || !token) {
    return (
      <div className="dmv-status-page">
        <h1>Check your email.</h1>
        <p className="dmv-status-meta">
          If your payment went through, your tickets — one QR code per attendee — are in your inbox.
          That email is all you need at the door.
        </p>
        <div className="dmv-status-actions">
          <PillLink href="/" variant="primary-filled">
            Back to the event
          </PillLink>
        </div>
      </div>
    );
  }

  const confirmed = order?.status === 'confirmed' && (order.tickets?.length ?? 0) > 0;

  if (order?.status === 'declined_sold_out') {
    return (
      <div className="dmv-status-page">
        <h1>Those seats just sold out.</h1>
        <p className="dmv-status-meta">
          Someone beat you to the last tickets while your payment was authorizing — your card was
          never charged.
        </p>
        <div className="dmv-status-actions">
          <PillLink href="/tickets" variant="primary-filled">
            See what’s still available
          </PillLink>
          <PillLink href="/" variant="primary">
            Back to the event
          </PillLink>
        </div>
      </div>
    );
  }

  if (order?.status === 'canceled') {
    return (
      <div className="dmv-status-page">
        <h1>Your checkout wasn’t completed.</h1>
        <p className="dmv-status-meta">No tickets have been issued and no payment was taken.</p>
        <div className="dmv-status-actions">
          <PillLink href="/tickets" variant="primary-filled">
            Return to tickets
          </PillLink>
        </div>
      </div>
    );
  }

  if (!confirmed) {
    return (
      <div className="dmv-status-page">
        <div className="dmv-status-image">
          <img
            src="/images/dmv/dmv-pending-neon.jpg"
            alt="A warm lounge with a neon sign reading Good Skin Brighter People"
          />
        </div>
        <div className="dmv-pending" role="status">
          <div className="dmv-pending-spinner" aria-hidden="true" />
          <h1 style={{ fontSize: 28 }}>We’re confirming your payment.</h1>
          <p className="dmv-status-meta">
            {timedOut
              ? 'This is taking longer than usual — your tickets will land by email the moment payment confirms. You can safely close this page.'
              : 'Your tickets will appear here once payment is confirmed. Please don’t close this page.'}
          </p>
        </div>
      </div>
    );
  }

  const firstName = (order.tickets?.[0]?.attendeeName ?? 'friend').split(/\s+/)[0];
  const sessionLabel = order.tickets?.[0]?.sessionLabel ?? '';

  return (
    <div className="dmv-status-page">
      <h1>
        Got it, {firstName}.
        <br />
        Your tickets are on their way.
      </h1>
      <p className="dmv-status-meta">
        {order.tickets!.length} ticket{order.tickets!.length === 1 ? '' : 's'}
        {sessionLabel ? ` · ${sessionLabel}` : ''} · sent to {maskEmail(order.email)}
      </p>
      <ul className="dmv-ticket-list">
        {order.tickets!.map((t) => (
          <li key={t.code}>
            <span className="dmv-ticket-name">
              {t.attendeeName}
              <span className="dmv-ticket-tier">{t.tierLabel ?? t.tier}</span>
            </span>
            <span className="dmv-ticket-code">{t.code}</span>
          </li>
        ))}
      </ul>
      {order.surveySubmitted ? null : (
        <Survey orderId={orderId} token={token} ticketCount={order.tickets!.length} />
      )}
    </div>
  );
}

function Survey({
  orderId,
  token,
  ticketCount,
}: {
  orderId: string;
  token: string;
  ticketCount: number;
}) {
  const [facial, setFacial] = useState('');
  const [concern, setConcern] = useState('');
  const [group, setGroup] = useState('');
  const [heard, setHeard] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'skipped' | 'error'>('idle');
  const liveRef = useRef<HTMLParagraphElement | null>(null);

  if (state === 'done') {
    return (
      <div className="dmv-survey">
        <h2>Thank you.</h2>
        <p className="dmv-survey-sub" ref={liveRef}>
          See you at the door — bring your QR.
        </p>
      </div>
    );
  }
  if (state === 'skipped') return null;

  const send = async () => {
    const answers: SurveyAnswers = {
      ...(facial ? { facialExperience: facial as SurveyAnswers['facialExperience'] } : {}),
      ...(concern.trim() ? { skinConcern: concern.trim() } : {}),
      ...(group ? { groupType: group as SurveyAnswers['groupType'] } : {}),
      ...(heard ? { heardFrom: heard as SurveyAnswers['heardFrom'] } : {}),
    };
    if (Object.keys(answers).length === 0) {
      setState('skipped');
      return;
    }
    setState('sending');
    try {
      await submitSurvey(orderId, token, answers);
      setState('done');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="dmv-survey">
      <h2>While you’re here.</h2>
      <p className="dmv-survey-sub">
        Four quick questions. All optional{ticketCount > 1 ? ' — answer for yourself' : ''}.
      </p>
      <ChipSegment
        legend="Ever had a professional facial?"
        name="survey.facial"
        value={facial}
        options={[
          { label: 'First time', value: 'first_time' },
          { label: 'A few', value: 'a_few' },
          { label: 'I’m seasoned', value: 'seasoned' },
        ]}
        onChange={setFacial}
      />
      <div>
        <p className="dmv-field-label">Your #1 skin concern</p>
        <textarea
          value={concern}
          maxLength={300}
          placeholder="e.g. dark spots, texture, breakouts…"
          onChange={(e) => setConcern(e.target.value)}
        />
      </div>
      <ChipSegment
        legend="Coming solo or with people?"
        name="survey.group"
        value={group}
        options={[
          { label: 'Solo', value: 'solo' },
          { label: 'With people', value: 'with_people' },
        ]}
        onChange={setGroup}
      />
      <ChipSegment
        legend="How did you hear about this?"
        name="survey.heard"
        value={heard}
        options={[
          { label: 'Instagram', value: 'instagram' },
          { label: 'A friend', value: 'friend' },
          { label: 'Search', value: 'search' },
          { label: 'Other', value: 'other' },
        ]}
        onChange={setHeard}
      />
      {state === 'error' ? (
        <p className="dmv-error-text" role="alert">
          That didn’t save — try once more?
        </p>
      ) : null}
      <div className="dmv-survey-actions">
        <Button variant="primary-filled" onClick={send} disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Send answers'}
        </Button>
        <button
          type="button"
          className="button-reset text-link"
          onClick={() => setState('skipped')}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
