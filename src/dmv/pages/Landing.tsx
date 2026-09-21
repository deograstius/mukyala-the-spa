import Price from '@shared/ui/Price';
import Reveal, { RevealStagger } from '@shared/ui/Reveal';
import { useEffect, useState } from 'react';
import PillLink from '../PillLink';
import { loadAvailability, loadTicketPrices } from '../api';
import {
  EVENT_DATE_LINE,
  EVENT_NAME,
  EVENT_TAGLINE,
  EVENT_VENUE_CITY,
  EVENT_VENUE_NAME,
  POLICY_LINE,
  SESSIONS,
  WHAT_YOU_GET,
} from '../eventConfig';

type Availability = Record<string, number | null>;

export default function Landing() {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [availability, setAvailability] = useState<Availability>({});

  useEffect(() => {
    let alive = true;
    loadTicketPrices()
      .then((p) => alive && setPrices(p))
      .catch(() => undefined);
    const skus = SESSIONS.flatMap((s) => [s.skus.GA.sku, s.skus.VIP.sku]);
    Promise.all(skus.map(async (sku) => [sku, await loadAvailability(sku)] as const)).then(
      (entries) => {
        if (alive) setAvailability(Object.fromEntries(entries));
      },
    );
    return () => {
      alive = false;
    };
  }, []);

  const priceFor = (sku: string, fallback: number) => prices[sku] ?? fallback;

  return (
    <>
      <section className="dmv-hero" aria-label={EVENT_NAME}>
        <Reveal>
          <div className="dmv-hero-frame">
            <img
              src="/images/dmv/dmv-hero.jpg"
              alt="A speaker presenting skincare to a seated audience in a warmly lit event hall"
              loading="eager"
            />
            <div className="dmv-hero-scrim" />
            <div className="dmv-hero-content">
              <p className="dmv-hero-eyebrow">
                {EVENT_VENUE_NAME} · {EVENT_VENUE_CITY}
              </p>
              <h1 className="dmv-hero-title">{EVENT_NAME}</h1>
              <p className="dmv-hero-sub">{EVENT_TAGLINE}</p>
              <p className="dmv-hero-date">{EVENT_DATE_LINE}</p>
              <div className="dmv-hero-actions">
                <PillLink href="/tickets" variant="white-filled" size="large">
                  Get tickets
                </PillLink>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="dmv-section" id="what-you-get">
        <Reveal>
          <h2 className="dmv-section-title">What you get</h2>
          <p className="dmv-section-lede">
            Learn the basics, ask the experts, and make an afternoon or evening of it.
          </p>
        </Reveal>
        <div className="dmv-cards-grid">
          <RevealStagger>
            {WHAT_YOU_GET.map((card) => (
              <div className="dmv-photo-card" key={card.title}>
                <img src={card.image} alt={card.title} loading="lazy" />
                <div className="dmv-photo-card-caption">{card.title}</div>
              </div>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="dmv-section" id="sessions">
        <Reveal>
          <h2 className="dmv-section-title">Choose your session</h2>
          <p className="dmv-section-lede">
            Same program twice — pick the crowd you want to be part of.
          </p>
        </Reveal>
        <div className="dmv-sessions-grid">
          <RevealStagger>
            {SESSIONS.map((session) => (
              <div className="dmv-session-card" key={session.id}>
                <h3>
                  {session.label} · {session.timeLabel}
                </h3>
                <p className="dmv-session-time">{session.blurb}</p>
                {([session.skus.GA, session.skus.VIP] as const).map((skuDef) => {
                  const remaining = availability[skuDef.sku];
                  const soldOut = remaining !== null && remaining !== undefined && remaining <= 0;
                  return (
                    <div className="dmv-tier-row" key={skuDef.sku}>
                      <span>
                        {skuDef.tierLabel} ·{' '}
                        <Price cents={priceFor(skuDef.sku, skuDef.fallbackPriceCents)} />
                        {skuDef.tier === 'VIP' ? (
                          <span className="dmv-tier-note">Details to be announced.</span>
                        ) : null}
                      </span>
                      {soldOut ? (
                        <span className="dmv-remaining sold-out">Sold out</span>
                      ) : typeof remaining === 'number' ? (
                        <span className="dmv-remaining">{remaining} remaining</span>
                      ) : null}
                    </div>
                  );
                })}
                <div className="dmv-session-cta">
                  <PillLink href={`/tickets?session=${session.id}`} variant="primary-filled">
                    Choose this session
                  </PillLink>
                </div>
              </div>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="dmv-section" id="venue">
        <Reveal>
          <h2 className="dmv-section-title">The venue</h2>
        </Reveal>
        <Reveal>
          <div className="dmv-venue-grid">
            <div className="dmv-venue-card">
              <h3 style={{ margin: 0, fontSize: 20 }}>{EVENT_VENUE_NAME}</h3>
              <p style={{ margin: 0, color: 'var(--core--colors--neutral--700)' }}>
                {EVENT_VENUE_CITY}
              </p>
              <p style={{ margin: '12px 0 0', color: 'var(--core--colors--neutral--700)' }}>
                {EVENT_DATE_LINE}
              </p>
            </div>
            <div className="dmv-venue-image">
              <img
                src="/images/dmv/dmv-venue.jpg"
                alt="Candlelit tables with white flowers set for the event"
                loading="lazy"
              />
            </div>
          </div>
        </Reveal>
      </section>

      {/* The funnel ends with the action — readers who scrolled past the
          session cards to the venue aren't left without a way in. */}
      <section className="dmv-section dmv-closing-cta">
        <Reveal>
          <PillLink href="/tickets" variant="primary-filled" size="large">
            Get tickets
          </PillLink>
        </Reveal>
      </section>

      <section className="dmv-section">
        <Reveal>
          <p className="dmv-policy">{POLICY_LINE}</p>
        </Reveal>
      </section>
    </>
  );
}
