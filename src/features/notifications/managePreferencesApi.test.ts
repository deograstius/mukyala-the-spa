import { ApiError, apiGet, apiPost } from '@utils/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MANAGE_NOTIFICATIONS_CONSENT_TEXT,
  MANAGE_NOTIFICATIONS_CONSENT_VERSION,
  MANAGE_NOTIFICATIONS_EMAIL_CONSENT_VERSION,
  MANAGE_NOTIFICATIONS_SMS_CONSENT_VERSION,
  createCancelCodeSession,
  getNotificationPreferencesSession,
  requestEmailLink,
  unsubscribeNotificationPreferences,
  updateNotificationPreferencesSession,
} from './managePreferencesApi';

vi.mock('@utils/api', async () => {
  const actual = await vi.importActual<typeof import('@utils/api')>('@utils/api');
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPost: vi.fn(),
  };
});

describe('managePreferencesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('trims email before requesting a manage-preferences link', async () => {
    vi.mocked(apiPost).mockResolvedValue(undefined);

    await requestEmailLink('  guest@example.com  ');

    expect(apiPost).toHaveBeenCalledWith('/v1/notification-preferences/email-link', {
      email: 'guest@example.com',
    });
  });

  it('normalizes cancel-code session responses, including nested marketing payloads', async () => {
    vi.mocked(apiPost).mockResolvedValue({
      token: 'cancel-session-token',
      subjectHint: 'j***@e***.com',
      source: 'cancel_code',
      preferences: {
        marketing: {
          email: false,
          sms: true,
        },
        transactionalReservationUpdates: false,
      },
    });

    const session = await createCancelCodeSession({
      reservationId: ' res-1 ',
      code: ' 123456 ',
    });

    expect(apiPost).toHaveBeenCalledWith('/v1/notification-preferences/cancel-code/session', {
      reservationId: 'res-1',
      code: '123456',
    });
    expect(session).toMatchObject({
      token: 'cancel-session-token',
      source: 'cancel_code',
      preferences: {
        marketingEmail: false,
        marketingSms: true,
        transactionalReservationUpdates: true,
      },
    });
  });

  it('rejects malformed session payloads that do not include a token', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      subjectHint: 'j***@e***.com',
      preferences: {
        marketingEmail: true,
      },
    });

    await expect(getNotificationPreferencesSession('missing-token')).rejects.toMatchObject({
      status: 500,
      code: 'invalid_response',
      message: 'Missing session token',
    });
  });

  it('PATCHes session preferences and enforces transactional updates in the normalized response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          token: 'session-token',
          source: 'email_link',
          subjectHint: 'j***@e***.com',
          preferences: {
            marketingEmail: false,
            marketingSms: false,
            transactionalReservationUpdates: false,
          },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const session = await updateNotificationPreferencesSession({
      token: 'session-token',
      marketingEmail: false,
      marketingSms: false,
    });

    expect(fetchMock).toHaveBeenCalledWith('/v1/notification-preferences/session', {
      method: 'PATCH',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        token: 'session-token',
        marketing: {
          email: false,
          sms: false,
        },
      }),
    });
    expect(session.preferences).toEqual({
      marketingEmail: false,
      marketingSms: false,
      transactionalReservationUpdates: true,
    });
  });

  it('includes consent evidence that matches rendered consent copy/version values', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          token: 'session-token',
          source: 'email_link',
          subjectHint: 'j***@e***.com',
          preferences: {
            marketingEmail: true,
            marketingSms: false,
            transactionalReservationUpdates: true,
          },
          compliance: {
            consentTextVersion: {
              email: 'manage_notifications_v3:email',
              sms: 'manage_notifications_v3:sms',
            },
          },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await updateNotificationPreferencesSession({
      token: 'session-token',
      marketingEmail: true,
      marketingSms: false,
      consent: {
        source: 'manage_notifications',
        displayedVersion: ` ${MANAGE_NOTIFICATIONS_CONSENT_VERSION} `,
        displayedText: ` ${MANAGE_NOTIFICATIONS_CONSENT_TEXT} `,
        channelTextVersion: {
          email: ' manage_notifications_v3:email ',
          sms: ' manage_notifications_v3:sms ',
        },
      },
    });

    expect(fetchMock).toHaveBeenCalledWith('/v1/notification-preferences/session', {
      method: 'PATCH',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        token: 'session-token',
        marketing: {
          email: true,
          sms: false,
        },
        consent: {
          source: 'manage_notifications',
          displayedVersion: MANAGE_NOTIFICATIONS_CONSENT_VERSION,
          displayedText: MANAGE_NOTIFICATIONS_CONSENT_TEXT,
          channelTextVersion: {
            email: 'manage_notifications_v3:email',
            sms: 'manage_notifications_v3:sms',
          },
        },
      }),
    });
  });

  it('falls back to default consent source/text/version fields for empty consent values', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          token: 'session-token',
          source: 'email_link',
          subjectHint: 'j***@e***.com',
          preferences: {
            marketingEmail: false,
            marketingSms: true,
            transactionalReservationUpdates: true,
          },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await updateNotificationPreferencesSession({
      token: 'session-token',
      marketingEmail: false,
      marketingSms: true,
      consent: {
        source: undefined,
        displayedVersion: '   ',
        displayedText: '   ',
        channelTextVersion: {
          email: ' ',
          sms: '',
        },
      },
    });

    expect(fetchMock).toHaveBeenCalledWith('/v1/notification-preferences/session', {
      method: 'PATCH',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        token: 'session-token',
        marketing: {
          email: false,
          sms: true,
        },
        consent: {
          source: 'manage_notifications',
          displayedVersion: MANAGE_NOTIFICATIONS_CONSENT_VERSION,
          displayedText: MANAGE_NOTIFICATIONS_CONSENT_TEXT,
          channelTextVersion: {
            email: MANAGE_NOTIFICATIONS_EMAIL_CONSENT_VERSION,
            sms: MANAGE_NOTIFICATIONS_SMS_CONSENT_VERSION,
          },
        },
      }),
    });
  });

  it('derives channel consent versions from displayedVersion when channel versions are missing', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          token: 'session-token',
          source: 'email_link',
          subjectHint: 'j***@e***.com',
          preferences: {
            marketingEmail: true,
            marketingSms: true,
            transactionalReservationUpdates: true,
          },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await updateNotificationPreferencesSession({
      token: 'session-token',
      marketingEmail: true,
      marketingSms: true,
      consent: {
        source: 'web_form',
        displayedVersion: 'manage_notifications_v9',
        displayedText: MANAGE_NOTIFICATIONS_CONSENT_TEXT,
      },
    });

    expect(fetchMock).toHaveBeenCalledWith('/v1/notification-preferences/session', {
      method: 'PATCH',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        token: 'session-token',
        marketing: {
          email: true,
          sms: true,
        },
        consent: {
          source: 'web_form',
          displayedVersion: 'manage_notifications_v9',
          displayedText: MANAGE_NOTIFICATIONS_CONSENT_TEXT,
          channelTextVersion: {
            email: 'manage_notifications_v9:email',
            sms: 'manage_notifications_v9:sms',
          },
        },
      }),
    });
  });

  it('throws ApiError details for failed preference updates', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          message: 'Invalid request',
          code: 'invalid_request',
          details: { field: 'marketing.email' },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const expectedError: Partial<ApiError> = {
      status: 400,
      code: 'invalid_request',
      message: 'Invalid request',
      details: { field: 'marketing.email' },
    };

    await expect(
      updateNotificationPreferencesSession({
        token: 'session-token',
        marketingEmail: false,
        marketingSms: true,
      }),
    ).rejects.toMatchObject(expectedError);
  });

  it('posts unsubscribe requests and defaults missing marketing payload to subscribed=true', async () => {
    vi.mocked(apiPost).mockResolvedValue({
      token: 'session-after-unsubscribe',
      subjectHint: 'j***@e***.com',
      source: 'email_link',
    });

    const session = await unsubscribeNotificationPreferences('unsubscribe-token');

    expect(apiPost).toHaveBeenCalledWith('/v1/notification-preferences/unsubscribe', {
      token: 'unsubscribe-token',
    });
    expect(session.preferences).toEqual({
      marketingEmail: true,
      marketingSms: true,
      transactionalReservationUpdates: true,
    });
  });
});
