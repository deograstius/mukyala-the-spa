import Button from '@shared/ui/Button';
import { ApiError } from '@utils/api';
import type { BarcodeFormat } from 'barcode-detector/ponyfill';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAdminAuth } from '../auth';
import {
  checkinTicket,
  fetchDoorList,
  type CheckinVerdict,
  type DoorList,
  type DoorSession,
} from '../event/eventApi';
import BarcodeScanner from '../retail/BarcodeScanner';

/**
 * Event door (board 04, spec decision #15): scan a ticket QR → one giant
 * verdict. Green = checked in, issue a wristband; red = already scanned, with
 * the FIRST scan's time so the bouncer can say something true. The attendee
 * list is the fallback ladder (search + manual check-in for unscanned
 * guests). A verdict is only ever rendered from the server's answer — never
 * before it confirms.
 */

const LIST_POLL_MS = 15000;

// Module-level so the scanner's camera effect (which keys on `formats`)
// never sees a fresh array identity across re-renders.
const QR_ONLY: readonly BarcodeFormat[] = ['qr_code'];

// A camera decode can't be a typo: an unknown scanned code is someone
// presenting a ticket we never issued — the verdict says turn them away.
// Only hand-typed codes get the gentler "retype it" treatment.
type Verdict =
  | { kind: 'ok'; data: CheckinVerdict }
  | { kind: 'fake'; code: string }
  | { kind: 'not_found'; code: string }
  | { kind: 'error'; message: string };

const TICKET_CODE_RE = /^MKY-[A-HJ-KM-NP-Z2-9]{5}$/;

function timeLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function DoorPage() {
  const { onAuthExpired } = useAdminAuth();
  const [session, setSession] = useState<DoorSession>('S1');
  const [view, setView] = useState<'scanner' | 'list'>('scanner');
  const [doorList, setDoorList] = useState<DoorList | null>(null);
  const [query, setQuery] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const listRef = useRef<{ session: DoorSession; q: string }>({ session: 'S1', q: '' });
  listRef.current = { session, q: query };
  // Ref-based in-flight guard keeps handleCode's identity stable — the
  // scanner's camera effect keys on onDetected and must not restart on every
  // 15s poll re-render.
  const busyRef = useRef(false);

  const refreshList = useCallback(async () => {
    try {
      const { session: s, q } = listRef.current;
      const data = await fetchDoorList(s, q);
      setDoorList(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) onAuthExpired();
      // Other failures keep the last-known counts on screen.
    }
  }, [onAuthExpired]);

  useEffect(() => {
    void refreshList();
    const timer = window.setInterval(() => void refreshList(), LIST_POLL_MS);
    return () => window.clearInterval(timer);
  }, [refreshList, session, query]);

  const handleCode = useCallback(
    async (raw: string, source?: 'camera' | 'manual') => {
      const code = raw.trim().toUpperCase();
      if (!code || busyRef.current) return;
      // A scanned QR that isn't even shaped like our codes needs no server
      // round-trip — it was never one of our tickets.
      if (source === 'camera' && !TICKET_CODE_RE.test(code)) {
        setVerdict({ kind: 'fake', code });
        return;
      }
      busyRef.current = true;
      setBusyCode(code);
      try {
        const { session: working } = listRef.current;
        const data = await checkinTicket(code, working === 'all' ? undefined : working);
        setVerdict({ kind: 'ok', data });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          onAuthExpired();
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          setVerdict(source === 'camera' ? { kind: 'fake', code } : { kind: 'not_found', code });
        } else if (err instanceof ApiError && err.code === 'order_not_confirmed') {
          setVerdict({ kind: 'error', message: 'Invalid ticket: the order was never confirmed.' });
        } else {
          setVerdict({ kind: 'error', message: 'Connection lost. Scan again.' });
        }
      } finally {
        busyRef.current = false;
        setBusyCode(null);
        void refreshList();
      }
    },
    [onAuthExpired, refreshList],
  );

  const counts =
    session === 'all' || !doorList ? doorList?.counts.total : doorList.counts.bySession[session];

  return (
    <div className="container-default w-container" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <h1 className="display-7" style={{ margin: 0 }}>
          Door
        </h1>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span className="paragraph-small">Session</span>
          <select
            aria-label="Session filter"
            value={session}
            onChange={(e) => setSession(e.target.value as DoorSession)}
            style={{ minHeight: 40, borderRadius: 10, padding: '6px 10px', fontSize: 15 }}
          >
            <option value="S1">Session 1 · Early afternoon</option>
            <option value="S2">Session 2 · Evening</option>
            <option value="all">Both sessions</option>
          </select>
        </label>
        <p className="paragraph-small" style={{ margin: 0 }} aria-live="polite">
          {counts ? (
            <>
              <strong style={{ fontSize: 20 }}>{counts.checkedIn} in</strong> / {counts.sold} sold
            </>
          ) : (
            'Loading counts…'
          )}
        </p>
      </div>

      <div style={{ maxWidth: 560, marginTop: 20 }}>
        {verdict ? (
          <VerdictCard verdict={verdict} onNext={() => setVerdict(null)} />
        ) : view === 'scanner' ? (
          <>
            <BarcodeScanner
              onDetected={handleCode}
              formats={QR_ONLY}
              title="Point the camera at a ticket"
              manualPlaceholder="…or type the ticket code (MKY-…)"
              manualInputMode="text"
            />
            <div className="mg-top-12px">
              <Button variant="white" onClick={() => setView('list')} data-cta-id="door-list">
                Attendee list
              </Button>
            </div>
          </>
        ) : (
          <AttendeeList
            doorList={doorList}
            query={query}
            onQuery={setQuery}
            busyCode={busyCode}
            onCheckin={(code) => void handleCode(code)}
            onBack={() => setView('scanner')}
          />
        )}
      </div>
    </div>
  );
}

function VerdictCard({ verdict, onNext }: { verdict: Verdict; onNext: () => void }) {
  let surface: { bg: string; fg: string; icon: string; heading: string };
  let detail: React.ReactNode = null;

  if (verdict.kind === 'ok') {
    const data = verdict.data;
    if (data.result === 'checked_in') {
      surface = { bg: '#e3f5ec', fg: '#0f5132', icon: '✓', heading: 'Checked in' };
      detail = (
        <>
          <p style={{ fontSize: 22, fontWeight: 600, margin: '8px 0 2px' }}>{data.attendeeName}</p>
          <p style={{ margin: 0 }}>
            {data.tierLabel} · {data.sessionLabel}
          </p>
          <p style={{ margin: '8px 0 0', fontFamily: 'ui-monospace, Menlo, monospace' }}>
            {data.code} · {timeLabel(data.checkedInAt)}
          </p>
          <p style={{ margin: '16px 0 0', fontWeight: 600 }}>
            Confirm the name. Issue a wristband.
          </p>
        </>
      );
    } else if (data.result === 'wrong_session') {
      surface = { bg: '#fce8e8', fg: '#7f1d1d', icon: '✗', heading: 'Wrong session' };
      detail = (
        <>
          <p style={{ fontSize: 22, fontWeight: 600, margin: '8px 0 2px' }}>{data.attendeeName}</p>
          <p style={{ margin: 0 }}>
            {data.tierLabel} · valid for <strong>{data.sessionLabel}</strong>
          </p>
          <p style={{ margin: '16px 0 0', fontWeight: 600 }}>
            Not checked in. Their session is {data.sessionLabel}.
          </p>
        </>
      );
    } else {
      surface = { bg: '#fce8e8', fg: '#7f1d1d', icon: '✗', heading: 'Already scanned' };
      detail = (
        <>
          <p style={{ fontSize: 22, fontWeight: 600, margin: '8px 0 2px' }}>{data.attendeeName}</p>
          <p style={{ margin: 0 }}>
            {data.tierLabel} · {data.sessionLabel}
          </p>
          <p style={{ margin: '8px 0 0' }}>
            First checked in at <strong>{timeLabel(data.checkedInAt)}</strong>
          </p>
          <p style={{ margin: '16px 0 0', fontWeight: 600 }}>Check the wristband for re-entry.</p>
        </>
      );
    }
  } else if (verdict.kind === 'fake') {
    surface = { bg: '#fce8e8', fg: '#7f1d1d', icon: '✗', heading: 'Not one of our tickets' };
    detail = (
      <>
        <p style={{ margin: '8px 0 0' }}>
          <span style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>{verdict.code}</span> is
          not a ticket we issued.
        </p>
        <p style={{ margin: '16px 0 0', fontWeight: 600 }}>Turn them away.</p>
      </>
    );
  } else if (verdict.kind === 'not_found') {
    surface = { bg: '#fce8e8', fg: '#7f1d1d', icon: '!', heading: 'No ticket with that code' };
    detail = (
      <p style={{ margin: '8px 0 0' }}>
        <span style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>{verdict.code}</span>. Retype
        it carefully. If it still fails, it isn&rsquo;t ours. Turn them away.
      </p>
    );
  } else {
    surface = { bg: '#fce8e8', fg: '#7f1d1d', icon: '!', heading: 'Something went wrong' };
    detail = <p style={{ margin: '8px 0 0' }}>{verdict.message}</p>;
  }

  return (
    <div
      role="status"
      className="card"
      style={{
        background: surface.bg,
        color: surface.fg,
        padding: '2rem 1.5rem',
        textAlign: 'center',
        borderRadius: 16,
      }}
    >
      <div aria-hidden="true" style={{ fontSize: 44, lineHeight: 1 }}>
        {surface.icon}
      </div>
      <h2 className="display-7" style={{ margin: '8px 0 0', color: 'inherit' }}>
        {surface.heading}
      </h2>
      {detail}
      <div className="mg-top-24px" style={{ marginTop: 24 }}>
        <Button variant="primary-filled" onClick={onNext} data-cta-id="door-scan-next">
          Scan next
        </Button>
      </div>
    </div>
  );
}

function AttendeeList({
  doorList,
  query,
  onQuery,
  busyCode,
  onCheckin,
  onBack,
}: {
  doorList: DoorList | null;
  query: string;
  onQuery: (q: string) => void;
  busyCode: string | null;
  onCheckin: (code: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="card checkout-block" style={{ padding: '1.25rem' }}>
      <h2 className="display-7" style={{ marginTop: 0 }}>
        Attendee list
      </h2>
      <input
        aria-label="Search name or ticket code"
        placeholder="Search name or ticket code"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 8,
          border: '1px solid #d5cec4',
          fontSize: 16,
          marginTop: 8,
        }}
      />
      <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0 }}>
        {(doorList?.tickets ?? []).map((t) => (
          <li
            key={t.code}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              padding: '10px 0',
              borderBottom: '1px solid #eaeaeb',
            }}
          >
            <span>
              <strong>{t.attendeeName}</strong>
              <span className="paragraph-small" style={{ display: 'block', color: '#414147' }}>
                {t.code} · {t.tier} · {t.session}
              </span>
            </span>
            {t.status === 'checked_in' ? (
              <span className="paragraph-small" style={{ color: '#0f5132', flex: 'none' }}>
                ● Checked in{t.checkedInAt ? ` · ${timeLabel(t.checkedInAt)}` : ''}
              </span>
            ) : (
              <Button
                variant="white"
                disabled={busyCode === t.code}
                onClick={() => onCheckin(t.code)}
                data-cta-id="door-list-checkin"
              >
                Check in
              </Button>
            )}
          </li>
        ))}
      </ul>
      {doorList && doorList.tickets.length === 0 ? (
        <p className="paragraph-small mg-top-12px">No tickets match.</p>
      ) : null}
      <div className="mg-top-12px" style={{ marginTop: 16 }}>
        <Button variant="link" onClick={onBack} data-cta-id="door-back-to-scanner">
          Back to scanner
        </Button>
      </div>
    </div>
  );
}
