import type { ManageNotificationsSession } from '@features/notifications/managePreferencesApi';
import * as managePreferencesApi from '@features/notifications/managePreferencesApi';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ApiError } from '@utils/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ManageNotifications from '../ManageNotifications';

vi.mock('@features/notifications/managePreferencesApi', async () => {
  const actual = await vi.importActual<
    typeof import('@features/notifications/managePreferencesApi')
  >('@features/notifications/managePreferencesApi');
  return {
    ...actual,
    requestEmailLink: vi.fn(),
    createCancelCodeSession: vi.fn(),
    getNotificationPreferencesSession: vi.fn(),
    updateNotificationPreferencesSession: vi.fn(),
    unsubscribeNotificationPreferences: vi.fn(),
  };
});

const sessionFixture: ManageNotificationsSession = {
  token: 'session-token-1234567890',
  source: 'email_link',
  subjectHint: 'ja***@ex***.com • ***1234',
  preferences: {
    marketingEmail: true,
    marketingSms: true,
    transactionalReservationUpdates: true,
  },
  compliance: {
    supportsEmailLinkFlow: true,
    supportsCancelCodeFlow: true,
    transactionalReservationUpdatesEnabled: true,
    marketingPaused: false,
    appliedWithinOneBusinessDay: true,
    appliedAtIso: '2026-03-01T10:00:00.000Z',
    doubleOptIn: {
      email: 'pending',
      sms: 'confirmed',
    },
    consentTextVersion: {
      email: 'manage_notifications_v2:email',
      sms: 'manage_notifications_v2:sms',
    },
  },
};

function renderAt(path: string): void {
  window.history.replaceState({}, '', path);
  render(<ManageNotifications />);
}

describe('ManageNotifications page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/notifications/manage');
  });

  it('hydrates an email-link token session and preserves transactional updates as immutable', async () => {
    vi.mocked(managePreferencesApi.getNotificationPreferencesSession).mockResolvedValue(
      sessionFixture,
    );

    renderAt('/notifications/manage?token=email-link-token&reservationId=ignore-me&code=123456');

    await waitFor(() =>
      expect(managePreferencesApi.getNotificationPreferencesSession).toHaveBeenCalledWith(
        'email-link-token',
      ),
    );
    expect(await screen.findByText(/your secure link is confirmed/i)).toBeInTheDocument();
    expect(screen.getByText(/active session for/i)).toHaveTextContent(/email link/i);
    expect(window.location.search).toBe(`?token=${encodeURIComponent(sessionFixture.token)}`);

    const transactional = screen.getByLabelText(/essential reservation updates/i);
    expect(transactional).toBeChecked();
    expect(transactional).toBeDisabled();
    expect(screen.getByRole('button', { name: /save preferences/i })).toBeDisabled();
  });

  it('submits the email-link flow and surfaces API errors', async () => {
    vi.mocked(managePreferencesApi.requestEmailLink).mockResolvedValue(undefined);
    renderAt('/notifications/manage');

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'guest@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send confirmation link/i }));

    await waitFor(() =>
      expect(managePreferencesApi.requestEmailLink).toHaveBeenCalledWith('guest@example.com'),
    );
    expect(await screen.findByText(/we sent a secure link/i)).toBeInTheDocument();

    vi.mocked(managePreferencesApi.requestEmailLink).mockRejectedValueOnce(
      new ApiError(503, 'Service unavailable'),
    );
    fireEvent.click(screen.getByRole('button', { name: /send confirmation link/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable');
  });

  it('submits reservation-id + cancel-code flow and sanitizes the code to six digits', async () => {
    const cancelSession: ManageNotificationsSession = {
      ...sessionFixture,
      token: 'cancel-session-token-1234567890',
      source: 'cancel_code',
      subjectHint: 'reservation #123',
    };
    vi.mocked(managePreferencesApi.createCancelCodeSession).mockResolvedValue(cancelSession);

    renderAt('/notifications/manage');

    fireEvent.change(screen.getByLabelText(/reservation id/i), {
      target: { value: '2f7d0ac2-bf8d-490f-a4c8-5c3cb6fae56b' },
    });
    fireEvent.change(screen.getByLabelText(/6-digit code/i), {
      target: { value: '12a34b5678' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

    await waitFor(() =>
      expect(managePreferencesApi.createCancelCodeSession).toHaveBeenCalledWith({
        reservationId: '2f7d0ac2-bf8d-490f-a4c8-5c3cb6fae56b',
        code: '123456',
      }),
    );
    expect(await screen.findByText(/your code was verified/i)).toBeInTheDocument();
    expect(screen.getByText(/active session for/i)).toHaveTextContent(/cancel code/i);
    expect(window.location.search).toBe(`?token=${encodeURIComponent(cancelSession.token)}`);
  });

  it('saves preference changes through session token and keeps transactional preference enabled', async () => {
    vi.mocked(managePreferencesApi.getNotificationPreferencesSession).mockResolvedValue(
      sessionFixture,
    );
    vi.mocked(managePreferencesApi.updateNotificationPreferencesSession).mockResolvedValue({
      ...sessionFixture,
      preferences: {
        marketingEmail: false,
        marketingSms: true,
        transactionalReservationUpdates: true,
      },
    });

    renderAt('/notifications/manage?token=session-link-token');
    await screen.findByText(/your secure link is confirmed/i);
    expect(
      screen.getAllByText(managePreferencesApi.MANAGE_NOTIFICATIONS_CONSENT_TEXT),
    ).toHaveLength(2);
    expect(screen.getByText('manage_notifications_v2:email')).toBeInTheDocument();
    expect(screen.getByText('manage_notifications_v2:sms')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/marketing email/i));
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    await waitFor(() =>
      expect(managePreferencesApi.updateNotificationPreferencesSession).toHaveBeenCalledWith({
        token: sessionFixture.token,
        marketingEmail: false,
        marketingSms: true,
        consent: {
          source: 'manage_notifications',
          displayedVersion: managePreferencesApi.MANAGE_NOTIFICATIONS_CONSENT_VERSION,
          displayedText: managePreferencesApi.MANAGE_NOTIFICATIONS_CONSENT_TEXT,
          channelTextVersion: {
            email: 'manage_notifications_v2:email',
            sms: 'manage_notifications_v2:sms',
          },
        },
      }),
    );

    const transactional = screen.getByLabelText(/essential reservation updates/i);
    expect(transactional).toBeChecked();
    expect(transactional).toBeDisabled();
    expect(await screen.findByText(/preferences saved/i)).toBeInTheDocument();
  });

  it('surfaces pending DOI status after saving when SMS opt-in is still awaiting confirmation', async () => {
    vi.mocked(managePreferencesApi.getNotificationPreferencesSession).mockResolvedValue({
      ...sessionFixture,
      preferences: {
        marketingEmail: false,
        marketingSms: false,
        transactionalReservationUpdates: true,
      },
      compliance: {
        ...sessionFixture.compliance!,
        doubleOptIn: {
          email: 'not_subscribed',
          sms: 'not_subscribed',
        },
      },
    });
    vi.mocked(managePreferencesApi.updateNotificationPreferencesSession).mockResolvedValue({
      ...sessionFixture,
      preferences: {
        marketingEmail: false,
        marketingSms: false,
        transactionalReservationUpdates: true,
      },
      compliance: {
        ...sessionFixture.compliance!,
        doubleOptIn: {
          email: 'not_subscribed',
          sms: 'pending',
        },
      },
    });

    renderAt('/notifications/manage?token=session-link-token');
    await screen.findByText(/your secure link is confirmed/i);

    fireEvent.click(screen.getByLabelText(/marketing sms/i));
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    expect(
      await screen.findByText(
        /preferences saved\. reply yes to your sms confirmation text to activate marketing updates\./i,
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/pending confirmation/i).length).toBeGreaterThan(0);
  });

  it('renders consent copy and version text next to each marketing opt-in control', async () => {
    vi.mocked(managePreferencesApi.getNotificationPreferencesSession).mockResolvedValue(
      sessionFixture,
    );

    renderAt('/notifications/manage?token=session-link-token');
    await screen.findByText(/your secure link is confirmed/i);

    const emailBlock = screen.getByLabelText(/marketing email/i).closest('div');
    expect(emailBlock).not.toBeNull();
    expect(
      within(emailBlock as HTMLElement).getByText(
        managePreferencesApi.MANAGE_NOTIFICATIONS_CONSENT_TEXT,
      ),
    ).toBeInTheDocument();
    expect(
      within(emailBlock as HTMLElement).getByText('manage_notifications_v2:email'),
    ).toBeInTheDocument();

    const smsBlock = screen.getByLabelText(/marketing sms/i).closest('div');
    expect(smsBlock).not.toBeNull();
    expect(
      within(smsBlock as HTMLElement).getByText(
        managePreferencesApi.MANAGE_NOTIFICATIONS_CONSENT_TEXT,
      ),
    ).toBeInTheDocument();
    expect(
      within(smsBlock as HTMLElement).getByText('manage_notifications_v2:sms'),
    ).toBeInTheDocument();
  });

  it('keeps consent copy visible and submits matching consent evidence when enabling marketing', async () => {
    vi.mocked(managePreferencesApi.getNotificationPreferencesSession).mockResolvedValue({
      ...sessionFixture,
      preferences: {
        marketingEmail: false,
        marketingSms: false,
        transactionalReservationUpdates: true,
      },
      compliance: {
        ...sessionFixture.compliance!,
        consentTextVersion: {
          email: 'manage_notifications_v3:email',
          sms: 'manage_notifications_v3:sms',
        },
      },
    });
    vi.mocked(managePreferencesApi.updateNotificationPreferencesSession).mockResolvedValue({
      ...sessionFixture,
      preferences: {
        marketingEmail: true,
        marketingSms: false,
        transactionalReservationUpdates: true,
      },
      compliance: {
        ...sessionFixture.compliance!,
        consentTextVersion: {
          email: 'manage_notifications_v3:email',
          sms: 'manage_notifications_v3:sms',
        },
      },
    });

    renderAt('/notifications/manage?token=session-link-token');
    await screen.findByText(/your secure link is confirmed/i);
    expect(
      screen.getAllByText(managePreferencesApi.MANAGE_NOTIFICATIONS_CONSENT_TEXT),
    ).toHaveLength(2);

    fireEvent.click(screen.getByLabelText(/marketing email/i));
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    await waitFor(() =>
      expect(managePreferencesApi.updateNotificationPreferencesSession).toHaveBeenCalledWith({
        token: sessionFixture.token,
        marketingEmail: true,
        marketingSms: false,
        consent: {
          source: 'manage_notifications',
          displayedVersion: managePreferencesApi.MANAGE_NOTIFICATIONS_CONSENT_VERSION,
          displayedText: managePreferencesApi.MANAGE_NOTIFICATIONS_CONSENT_TEXT,
          channelTextVersion: {
            email: 'manage_notifications_v3:email',
            sms: 'manage_notifications_v3:sms',
          },
        },
      }),
    );
  });

  it('uses default consent versions in UI and payload when session consent versions are missing', async () => {
    vi.mocked(managePreferencesApi.getNotificationPreferencesSession).mockResolvedValue({
      ...sessionFixture,
      preferences: {
        marketingEmail: false,
        marketingSms: false,
        transactionalReservationUpdates: true,
      },
      compliance: undefined,
    });
    vi.mocked(managePreferencesApi.updateNotificationPreferencesSession).mockResolvedValue({
      ...sessionFixture,
      preferences: {
        marketingEmail: true,
        marketingSms: false,
        transactionalReservationUpdates: true,
      },
      compliance: undefined,
    });

    renderAt('/notifications/manage?token=session-link-token');
    await screen.findByText(/your secure link is confirmed/i);
    expect(
      screen.getByText(managePreferencesApi.MANAGE_NOTIFICATIONS_EMAIL_CONSENT_VERSION),
    ).toBeInTheDocument();
    expect(
      screen.getByText(managePreferencesApi.MANAGE_NOTIFICATIONS_SMS_CONSENT_VERSION),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/marketing email/i));
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    await waitFor(() =>
      expect(managePreferencesApi.updateNotificationPreferencesSession).toHaveBeenCalledWith({
        token: sessionFixture.token,
        marketingEmail: true,
        marketingSms: false,
        consent: {
          source: 'manage_notifications',
          displayedVersion: managePreferencesApi.MANAGE_NOTIFICATIONS_CONSENT_VERSION,
          displayedText: managePreferencesApi.MANAGE_NOTIFICATIONS_CONSENT_TEXT,
          channelTextVersion: {
            email: managePreferencesApi.MANAGE_NOTIFICATIONS_EMAIL_CONSENT_VERSION,
            sms: managePreferencesApi.MANAGE_NOTIFICATIONS_SMS_CONSENT_VERSION,
          },
        },
      }),
    );
  });

  it('executes one-click unsubscribe from secure query context', async () => {
    vi.mocked(managePreferencesApi.unsubscribeNotificationPreferences).mockResolvedValue({
      ...sessionFixture,
      token: 'unsubscribe-session-token-1234567890',
      preferences: {
        marketingEmail: false,
        marketingSms: false,
        transactionalReservationUpdates: true,
      },
    });

    renderAt('/notifications/manage?token=unsubscribe-token&unsubscribe=1');

    await waitFor(() =>
      expect(managePreferencesApi.unsubscribeNotificationPreferences).toHaveBeenCalledWith(
        'unsubscribe-token',
      ),
    );
    expect(managePreferencesApi.getNotificationPreferencesSession).not.toHaveBeenCalled();
    expect(await screen.findByText(/you are unsubscribed from marketing/i)).toBeInTheDocument();
  });

  it('shows token hydration errors for invalid or expired links', async () => {
    vi.mocked(managePreferencesApi.getNotificationPreferencesSession).mockRejectedValue(
      new ApiError(401, 'Invalid or expired token'),
    );

    renderAt('/notifications/manage?token=expired-token');

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid or expired token');
  });
});
