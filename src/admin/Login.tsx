import Button from '@shared/ui/Button';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { useState } from 'react';
import { retailLogin } from './retail/retailApi';
import { inputStyle, labelStyle } from './styles';

// Remembered locally AFTER a successful sign-in — no staff usernames ship in
// the public bundle.
const LAST_USERNAME_KEY = 'retail:lastUsername:v1';

function readLastUsername(): string {
  try {
    return window.localStorage.getItem(LAST_USERNAME_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveLastUsername(username: string): void {
  try {
    window.localStorage.setItem(LAST_USERNAME_KEY, username);
  } catch {
    // ignore — just retype next visit
  }
}

export default function Login({ onLoggedIn }: { onLoggedIn: (token: string) => void }) {
  const [username, setUsername] = useState(readLastUsername);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Section>
      <Container>
        <div className="inner-container _580px center">
          <div className="text-center">
            <h1 className="display-9">Mukyala Admin</h1>
            <p className="paragraph-small mg-top-8px">Staff back-office</p>
          </div>
          <form
            className="card checkout-block mg-top-32px"
            style={{ padding: '1.25rem' }}
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setBusy(true);
              try {
                const token = await retailLogin(username.trim(), password);
                saveLastUsername(username.trim());
                onLoggedIn(token);
              } catch (err) {
                setError(
                  err instanceof Error && err.message
                    ? err.message
                    : 'Could not sign in. Please try again.',
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <div>
              <label htmlFor="admin-username" style={labelStyle}>
                Username
              </label>
              <input
                id="admin-username"
                style={inputStyle}
                value={username}
                autoComplete="username"
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="mg-top-16px">
              <label htmlFor="admin-password" style={labelStyle}>
                Password
              </label>
              <input
                id="admin-password"
                style={inputStyle}
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? (
              <p role="alert" className="paragraph-small mg-top-12px" style={{ color: '#b91c1c' }}>
                {error}
              </p>
            ) : null}
            <div className="mg-top-16px">
              <Button type="submit" disabled={busy || !password} data-cta-id="admin-login">
                {busy ? 'Signing in…' : 'Sign in'}
              </Button>
            </div>
          </form>
        </div>
      </Container>
    </Section>
  );
}
