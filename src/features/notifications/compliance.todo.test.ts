import { apiGet, apiPost } from '@utils/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMarketingCapturePolicy } from './complianceScaffold';
import { createCancelCodeSession, getNotificationPreferencesSession } from './managePreferencesApi';

vi.mock('@utils/api', async () => {
  const actual = await vi.importActual<typeof import('@utils/api')>('@utils/api');
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPost: vi.fn(),
  };
});

describe('notification compliance scaffolding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gates marketing email capture behind explicit consent and DOI messaging', () => {
    const reservationPolicy = getMarketingCapturePolicy('reservation_waitlist', 'email');
    const checkoutPolicy = getMarketingCapturePolicy('checkout_waitlist', 'email');
    const unsupportedSmsPolicy = getMarketingCapturePolicy('reservation_waitlist', 'sms');

    expect(reservationPolicy).toMatchObject({
      requiresExplicitConsentCopy: true,
      requiresDoubleOptIn: true,
      liveCaptureEnabled: false,
    });
    expect(reservationPolicy?.fallbackMessageWhenDisabled).toMatch(/not live/i);

    expect(checkoutPolicy).toMatchObject({
      requiresExplicitConsentCopy: true,
      requiresDoubleOptIn: true,
      liveCaptureEnabled: false,
    });
    expect(checkoutPolicy?.fallbackMessageWhenDisabled).toMatch(
      /manage notifications|do not collect/i,
    );
    expect(unsupportedSmsPolicy).toBeUndefined();
  });

  it('supports marketing pause while transactional reservation updates remain on', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      token: 'email-link-token',
      source: 'email_link',
      subjectHint: 'j***@e***.com',
      preferences: {
        marketingEmail: false,
        marketingSms: false,
        transactionalReservationUpdates: false,
      },
      compliance: {
        marketingPaused: true,
        appliedWithinOneBusinessDay: true,
        doubleOptIn: {
          email: 'pending',
          sms: 'not_subscribed',
        },
      },
    });
    vi.mocked(apiPost).mockResolvedValue({
      token: 'cancel-code-token',
      source: 'cancel_code',
      subjectHint: 'j***@e***.com',
      preferences: {
        marketing: {
          email: false,
          sms: false,
        },
        transactionalReservationUpdates: false,
      },
      compliance: {
        marketingPaused: true,
        appliedWithinOneBusinessDay: true,
        doubleOptIn: {
          email: 'pending',
          sms: 'confirmed',
        },
      },
    });

    const emailLinkSession = await getNotificationPreferencesSession('email-link-token');
    expect(emailLinkSession.source).toBe('email_link');
    expect(emailLinkSession.preferences).toEqual({
      marketingEmail: false,
      marketingSms: false,
      transactionalReservationUpdates: true,
    });
    expect(emailLinkSession.compliance).toMatchObject({
      marketingPaused: true,
      transactionalReservationUpdatesEnabled: true,
      doubleOptIn: {
        email: 'pending',
        sms: 'not_subscribed',
      },
    });

    const cancelCodeSession = await createCancelCodeSession({
      reservationId: 'res-1',
      code: '123456',
    });
    expect(cancelCodeSession.source).toBe('cancel_code');
    expect(cancelCodeSession.preferences).toEqual({
      marketingEmail: false,
      marketingSms: false,
      transactionalReservationUpdates: true,
    });
    expect(cancelCodeSession.compliance).toMatchObject({
      marketingPaused: true,
      transactionalReservationUpdatesEnabled: true,
      doubleOptIn: {
        email: 'pending',
        sms: 'confirmed',
      },
    });
  });
});
