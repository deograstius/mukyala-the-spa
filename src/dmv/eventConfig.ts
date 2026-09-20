/**
 * DMV event constants (NOTES/dmv-event-spec.md). The event NAME is the
 * placeholder-in-one-file decision (#8): swap it here and everywhere follows.
 * Prices are DISPLAY fallbacks only — the server reprices by SKU at order
 * time, and the tickets page overwrites these from the catalog when it loads.
 */

export const EVENT_NAME = 'The Skincare Gathering';
export const EVENT_TAGLINE = 'A day of real skincare teaching, wrapped in a party.';
export const EVENT_VENUE_NAME = 'Kahler Hall';
export const EVENT_VENUE_CITY = 'Columbia, Maryland';
export const EVENT_DATE_LINE = 'October 2026 · ticket holders hear the exact date first';
export const POLICY_LINE =
  'All sales final. Tickets are non-refundable and non-transferable; each ticket is issued in the attendee’s name and checked at the door.';

export type SessionId = 'S1' | 'S2';
export type TierId = 'GA' | 'VIP';

export type TicketSku = {
  sku: string;
  session: SessionId;
  tier: TierId;
  tierLabel: string;
  fallbackPriceCents: number;
};

export type EventSession = {
  id: SessionId;
  label: string;
  timeLabel: string;
  blurb: string;
  skus: Record<TierId, TicketSku>;
};

export const SESSIONS: EventSession[] = [
  {
    id: 'S1',
    label: 'Session 1',
    timeLabel: 'Early afternoon',
    blurb: 'Two hours of teaching and mingling.',
    skus: {
      GA: {
        sku: 'EVT-S1-GA',
        session: 'S1',
        tier: 'GA',
        tierLabel: 'General admission',
        fallbackPriceCents: 35000,
      },
      VIP: {
        sku: 'EVT-S1-VIP',
        session: 'S1',
        tier: 'VIP',
        tierLabel: 'VIP',
        fallbackPriceCents: 40000,
      },
    },
  },
  {
    id: 'S2',
    label: 'Session 2',
    timeLabel: 'Evening',
    blurb: 'Same program, later crowd.',
    skus: {
      GA: {
        sku: 'EVT-S2-GA',
        session: 'S2',
        tier: 'GA',
        tierLabel: 'General admission',
        fallbackPriceCents: 35000,
      },
      VIP: {
        sku: 'EVT-S2-VIP',
        session: 'S2',
        tier: 'VIP',
        tierLabel: 'VIP',
        fallbackPriceCents: 40000,
      },
    },
  },
];

/** Per-order ticket cap (server enforces MAX_ITEM_QTY=10 per line). */
export const MAX_TICKETS_PER_TIER = 10;

export const WHAT_YOU_GET = [
  { title: 'Skincare with Aryea', image: '/images/dmv/dmv-card-aryea.jpg' },
  { title: 'The esthetician panel', image: '/images/dmv/dmv-card-panel.jpg' },
  { title: 'A live facial demo', image: '/images/dmv/dmv-card-demo.jpg' },
  { title: 'Games & conversation', image: '/images/dmv/dmv-card-games.jpg' },
  { title: 'DJ, bar & mingling', image: '/images/dmv/dmv-card-dj.jpg' },
  { title: 'The partner goodie bag', image: '/images/dmv/dmv-card-bag.jpg' },
] as const;
