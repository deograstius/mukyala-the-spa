import Button from '@shared/ui/Button';
import Price from '@shared/ui/Price';
import ChipSegment from '@shared/ui/forms/ChipSegment';
import Stepper from '@shared/ui/forms/Stepper';
import { ApiError } from '@utils/api';
import { useEffect, useMemo, useState } from 'react';
import { createCheckout, createEventOrder, loadAvailability, loadTicketPrices } from '../api';
import {
  EVENT_DATE_LINE,
  EVENT_NAME,
  EVENT_VENUE_CITY,
  EVENT_VENUE_NAME,
  MAX_TICKETS_PER_TIER,
  SESSIONS,
  type SessionId,
} from '../eventConfig';
import { saveThanksSnapshot } from '../thanksCache';

function sessionFromQuery(): SessionId {
  const raw = new URLSearchParams(window.location.search).get('session');
  return raw === 'S2' ? 'S2' : 'S1';
}

function resizeNames(names: string[], n: number): string[] {
  if (names.length === n) return names;
  if (names.length > n) return names.slice(0, n);
  return [...names, ...Array.from({ length: n - names.length }, () => '')];
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function Tickets() {
  const [sessionId, setSessionId] = useState<SessionId>(() => sessionFromQuery());
  const [gaQty, setGaQty] = useState('1');
  const [vipQty, setVipQty] = useState('0');
  const [gaNames, setGaNames] = useState<string[]>(['']);
  const [vipNames, setVipNames] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [ack, setAck] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [availability, setAvailability] = useState<Record<string, number | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const session = SESSIONS.find((s) => s.id === sessionId) ?? SESSIONS[0];
  const ga = session.skus.GA;
  const vip = session.skus.VIP;
  const gaCount = Number(gaQty) || 0;
  const vipCount = Number(vipQty) || 0;

  useEffect(() => {
    let alive = true;
    loadTicketPrices()
      .then((p) => alive && setPrices(p))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all(
      [ga.sku, vip.sku].map(async (sku) => [sku, await loadAvailability(sku)] as const),
    ).then((entries) => {
      if (alive) setAvailability((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    });
    return () => {
      alive = false;
    };
  }, [ga.sku, vip.sku]);

  useEffect(() => {
    setGaNames((prev) => resizeNames(prev, gaCount));
  }, [gaCount]);
  useEffect(() => {
    setVipNames((prev) => resizeNames(prev, vipCount));
  }, [vipCount]);

  const gaPrice = prices[ga.sku] ?? ga.fallbackPriceCents;
  const vipPrice = prices[vip.sku] ?? vip.fallbackPriceCents;
  const totalCents = gaCount * gaPrice + vipCount * vipPrice;
  const totalTickets = gaCount + vipCount;

  const gaMax = Math.min(MAX_TICKETS_PER_TIER, availability[ga.sku] ?? MAX_TICKETS_PER_TIER);
  const vipMax = Math.min(MAX_TICKETS_PER_TIER, availability[vip.sku] ?? MAX_TICKETS_PER_TIER);
  const vipSoldOut = (availability[vip.sku] ?? 1) <= 0;
  const gaSoldOut = (availability[ga.sku] ?? 1) <= 0;

  const validation = useMemo(() => {
    if (totalTickets < 1) return 'Pick at least one ticket.';
    const names = [...gaNames.slice(0, gaCount), ...vipNames.slice(0, vipCount)];
    if (names.some((n) => n.trim().length < 2)) return 'Add a name for every ticket.';
    if (!EMAIL_RE.test(email.trim())) return 'Enter the email your tickets should go to.';
    if (!ack) return 'Please confirm the all-sales-final policy.';
    return null;
  }, [totalTickets, gaNames, vipNames, gaCount, vipCount, email, ack]);

  const handleSubmit = async () => {
    setError(null);
    if (validation) {
      setError(validation);
      return;
    }
    setSubmitting(true);
    try {
      const items = [
        ...(gaCount > 0 ? [{ sku: ga.sku, qty: gaCount }] : []),
        ...(vipCount > 0 ? [{ sku: vip.sku, qty: vipCount }] : []),
      ];
      const attendees = [
        ...gaNames.slice(0, gaCount).map((name) => ({ sku: ga.sku, name: name.trim() })),
        ...vipNames.slice(0, vipCount).map((name) => ({ sku: vip.sku, name: name.trim() })),
      ];
      const order = await createEventOrder({
        email: email.trim(),
        items,
        attendees,
        marketingOptIn: optIn,
      });
      if (order.confirmationToken) {
        saveThanksSnapshot({
          orderId: order.id,
          token: order.confirmationToken,
          email: email.trim(),
        });
      }
      const checkout = await createCheckout(order.id);
      window.location.assign(checkout.checkoutUrl);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'hold_failed') {
        setError('That tier just sold out — adjust your tickets and try again.');
        Promise.all(
          [ga.sku, vip.sku].map(async (sku) => [sku, await loadAvailability(sku)] as const),
        ).then((entries) =>
          setAvailability((prev) => ({ ...prev, ...Object.fromEntries(entries) })),
        );
      } else if (err instanceof ApiError && err.code === 'invalid_attendees') {
        setError('Add a name for every ticket.');
      } else {
        setError('Something went wrong starting your checkout — please try again.');
      }
      setSubmitting(false);
    }
  };

  const nameField = (
    tierLabel: string,
    names: string[],
    setNames: (fn: (prev: string[]) => string[]) => void,
    offset: number,
  ) =>
    names.map((value, i) => (
      <div className="dmv-name-field" key={`${tierLabel}-${i}`}>
        <label className="dmv-field-label" htmlFor={`attendee-${tierLabel}-${i}`}>
          Ticket {offset + i + 1} · {i === 0 && offset === 0 ? 'your name' : tierLabel}
        </label>
        <input
          id={`attendee-${tierLabel}-${i}`}
          type="text"
          autoComplete={offset + i === 0 ? 'name' : 'off'}
          value={value}
          maxLength={80}
          onChange={(e) => {
            const next = e.target.value;
            setNames((prev) => prev.map((v, j) => (j === i ? next : v)));
          }}
        />
      </div>
    ));

  return (
    <div className="dmv-tickets-layout">
      <div className="dmv-tickets-summary">
        <a className="text-link dmv-back-link" href="/">
          ← Back to the event
        </a>
        <h1>{EVENT_NAME}</h1>
        <p className="dmv-tickets-summary-meta">
          {EVENT_VENUE_NAME}, {EVENT_VENUE_CITY}
          <br />
          {EVENT_DATE_LINE}
        </p>
        <div className="dmv-tickets-summary-image">
          <img
            src="/images/dmv/dmv-tickets-room.jpg"
            alt="Rows of chairs facing a small stage, set before the event"
          />
        </div>
      </div>

      <div className="dmv-ticket-form">
        <h2>Get tickets</h2>

        <div>
          <ChipSegment
            legend="Session"
            name="session"
            value={sessionId}
            options={SESSIONS.map((s) => ({
              label: `${s.label} · ${s.timeLabel}`,
              value: s.id,
            }))}
            onChange={(v) => setSessionId(v as SessionId)}
          />
        </div>

        <div>
          <div className="dmv-tier-picker-row">
            <span className="dmv-tier-picker-label">
              General admission · <Price cents={gaPrice} />
              {gaSoldOut ? (
                <span className="dmv-tier-picker-sub">Sold out for this session</span>
              ) : (
                <span className="dmv-tier-picker-sub">Admission to your selected session</span>
              )}
            </span>
            <Stepper
              name="ga-qty"
              ariaLabel="General admission tickets"
              min={0}
              max={gaSoldOut ? 0 : gaMax}
              value={gaQty}
              onChange={setGaQty}
            />
          </div>
          <div className="dmv-tier-picker-row">
            <span className="dmv-tier-picker-label">
              VIP · <Price cents={vipPrice} />
              {vipSoldOut ? (
                <span className="dmv-tier-picker-sub">Sold out for this session</span>
              ) : (
                <span className="dmv-tier-picker-sub">VIP details to be announced</span>
              )}
            </span>
            <Stepper
              name="vip-qty"
              ariaLabel="VIP tickets"
              min={0}
              max={vipSoldOut ? 0 : vipMax}
              value={vipQty}
              onChange={setVipQty}
            />
          </div>
        </div>

        {totalTickets > 0 ? (
          <div>
            <p className="dmv-field-label">Who’s coming?</p>
            <p className="dmv-field-help" style={{ margin: '0 0 12px' }}>
              Every ticket carries a name — it’s checked at the door.
            </p>
            {nameField('General admission', gaNames, setGaNames, 0)}
            {nameField('VIP', vipNames, setVipNames, gaCount)}
          </div>
        ) : null}

        <div className="dmv-email-field">
          <label className="dmv-field-label" htmlFor="buyer-email">
            Email for your tickets
          </label>
          <input
            id="buyer-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="dmv-field-help">Your QR codes and the date announcement land here.</p>
        </div>

        <div>
          <label className="dmv-check-row">
            <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
            <span>Keep me posted on Mukyala beyond the event</span>
          </label>
          <label className="dmv-check-row" style={{ marginTop: 10 }}>
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
            <span>I understand all sales are final. Tickets are named and non-transferable.</span>
          </label>
        </div>

        <div className="dmv-order-summary">
          {gaCount > 0 ? (
            <div className="dmv-order-summary-row">
              <span>{gaCount} × General admission</span>
              <Price cents={gaCount * gaPrice} />
            </div>
          ) : null}
          {vipCount > 0 ? (
            <div className="dmv-order-summary-row">
              <span>{vipCount} × VIP</span>
              <Price cents={vipCount * vipPrice} />
            </div>
          ) : null}
          <div className="dmv-order-summary-row dmv-order-summary-total">
            <span>Total</span>
            <Price cents={totalCents} />
          </div>
        </div>

        {error ? (
          <p className="dmv-error-text" role="alert">
            {error}
          </p>
        ) : null}

        <div>
          <Button
            variant="primary-filled"
            size="large"
            className="dmv-submit-button"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'One moment…' : 'Continue to payment'}
          </Button>
          <p className="dmv-submit-note">
            Your seats are held for a few minutes once you continue.
          </p>
        </div>
      </div>
    </div>
  );
}
