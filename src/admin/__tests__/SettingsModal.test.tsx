import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { server, http, HttpResponse } from '../../test/msw.server';
import SettingsModal from '../SettingsModal';
import { AdminAuthContext } from '../auth';

function renderModal({
  onClose = vi.fn(),
  onAuthExpired = vi.fn(),
}: { onClose?: () => void; onAuthExpired?: () => void } = {}) {
  render(
    <AdminAuthContext.Provider value={{ onAuthExpired }}>
      <SettingsModal onClose={onClose} />
    </AdminAuthContext.Provider>,
  );
  return { onClose, onAuthExpired };
}

async function fill(current: string, next: string, confirm: string) {
  await userEvent.type(screen.getByLabelText('Current password'), current);
  await userEvent.type(screen.getByLabelText('New password'), next);
  await userEvent.type(screen.getByLabelText('Confirm new password'), confirm);
}

describe('Settings — change password', () => {
  it('validates length and match before calling the API', async () => {
    renderModal();
    await fill('old-pass', 'short', 'short');
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('at least 8 characters');

    await userEvent.type(screen.getByLabelText('New password'), '-but-long-now');
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('do not match');
  });

  it('shows the API message for a wrong current password and stays signed in', async () => {
    server.use(
      http.post('/v1/retail/change-password', () =>
        HttpResponse.json(
          { error: 'invalid_credentials', message: 'Current password is wrong.' },
          { status: 401 },
        ),
      ),
    );
    const { onAuthExpired } = renderModal();
    await fill('not-it', 'brand new password', 'brand new password');
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Current password is wrong.');
    // Wrong current password is NOT a session expiry — the shell must not log out.
    expect(onAuthExpired).not.toHaveBeenCalled();
  });

  it('logs out when the session token itself has expired', async () => {
    server.use(
      http.post('/v1/retail/change-password', () =>
        HttpResponse.json(
          { error: 'unauthorized', message: 'Invalid or expired token' },
          { status: 401 },
        ),
      ),
    );
    const { onAuthExpired } = renderModal();
    await fill('old-pass', 'brand new password', 'brand new password');
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }));

    await vi.waitFor(() => expect(onAuthExpired).toHaveBeenCalled());
  });

  it('confirms success', async () => {
    let body: unknown = null;
    server.use(
      http.post('/v1/retail/change-password', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );
    renderModal();
    await fill('old-pass', 'brand new password', 'brand new password');
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Password changed');
    expect(body).toEqual({ currentPassword: 'old-pass', newPassword: 'brand new password' });
  });
});
