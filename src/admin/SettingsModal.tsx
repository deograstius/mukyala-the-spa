import { changeRetailPassword, isSessionExpiredError } from '@features/retail/retailApi';
import Button from '@shared/ui/Button';
import { useState } from 'react';
import { useAdminAuth } from './auth';
import { inputStyle, labelStyle } from './styles';

/**
 * Settings surface (top-right menu → Settings). A modal, not a nav route —
 * spec decision #3 keeps the app at two routes. Holds change-password; the
 * natural home for whatever the admin surface grows next.
 */
export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { onAuthExpired } = useAdminAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-settings-title"
        className="card checkout-block"
        style={{ padding: '1.25rem', width: '100%', maxWidth: 420, background: '#fff' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="admin-settings-title" className="display-7" style={{ marginTop: 0 }}>
          Settings
        </h2>
        {done ? (
          <>
            <p role="status" className="paragraph-small mg-top-12px" style={{ fontWeight: 600 }}>
              Password changed ✓
            </p>
            <div className="mg-top-16px">
              <Button onClick={onClose} data-cta-id="admin-settings-close-done">
                Close
              </Button>
            </div>
          </>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              if (next.length < 8) {
                setError('The new password must be at least 8 characters.');
                return;
              }
              if (next !== confirm) {
                setError('The new passwords do not match.');
                return;
              }
              setBusy(true);
              try {
                await changeRetailPassword(current, next);
                setDone(true);
              } catch (err) {
                if (isSessionExpiredError(err)) {
                  onAuthExpired();
                  return;
                }
                setError(
                  err instanceof Error && err.message
                    ? err.message
                    : 'Could not change the password.',
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <p className="paragraph-small mg-top-8px" style={{ margin: 0 }}>
              Change password
            </p>
            <div className="mg-top-12px">
              <label htmlFor="admin-current-password" style={labelStyle}>
                Current password
              </label>
              <input
                id="admin-current-password"
                style={inputStyle}
                type="password"
                value={current}
                autoComplete="current-password"
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>
            <div className="mg-top-12px">
              <label htmlFor="admin-new-password" style={labelStyle}>
                New password
              </label>
              <input
                id="admin-new-password"
                style={inputStyle}
                type="password"
                value={next}
                autoComplete="new-password"
                onChange={(e) => setNext(e.target.value)}
              />
            </div>
            <div className="mg-top-12px">
              <label htmlFor="admin-confirm-password" style={labelStyle}>
                Confirm new password
              </label>
              <input
                id="admin-confirm-password"
                style={inputStyle}
                type="password"
                value={confirm}
                autoComplete="new-password"
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {error ? (
              <p role="alert" className="paragraph-small mg-top-12px" style={{ color: '#b91c1c' }}>
                {error}
              </p>
            ) : null}
            <div className="mg-top-16px" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button
                type="submit"
                disabled={busy || !current || !next || !confirm}
                data-cta-id="admin-change-password"
              >
                {busy ? 'Changing…' : 'Change password'}
              </Button>
              <Button
                type="button"
                variant="link"
                onClick={onClose}
                data-cta-id="admin-settings-close"
              >
                Close
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
