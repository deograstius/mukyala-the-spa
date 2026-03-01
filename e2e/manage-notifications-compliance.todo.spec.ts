import { expect, test, type Route } from '@playwright/test';

type SessionResponse = {
  token: string;
  subjectHint: string;
  source: 'email_link' | 'cancel_code';
  preferences: {
    marketing?: {
      email?: boolean;
      sms?: boolean;
    };
    marketingEmail?: boolean;
    marketingSms?: boolean;
    transactionalReservationUpdates?: boolean;
  };
  compliance?: {
    supportsEmailLinkFlow?: boolean;
    supportsCancelCodeFlow?: boolean;
    transactionalReservationUpdatesEnabled?: boolean;
    marketingPaused?: boolean;
    appliedWithinOneBusinessDay?: boolean;
    appliedAtIso?: string;
    doubleOptIn?: {
      email?: 'pending' | 'confirmed' | 'not_subscribed';
      sms?: 'pending' | 'confirmed' | 'not_subscribed';
    };
  };
};

async function json(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function session(overrides: Partial<SessionResponse> = {}): SessionResponse {
  return {
    token: overrides.token ?? 'compliance-session-token',
    subjectHint: overrides.subjectHint ?? 'ja***@ex***.com • ***1234',
    source: overrides.source ?? 'email_link',
    preferences: overrides.preferences ?? {
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
        email: 'confirmed',
        sms: 'pending',
      },
      ...overrides.compliance,
    },
  };
}

test.describe('manage notifications compliance', () => {
  test('keeps marketing SMS pending (not subscribed) after opt-in until reply confirmation', async ({
    page,
  }) => {
    await page.route('**/v1/notification-preferences/session?*', async (route) => {
      await json(
        route,
        session({
          token: 'sms-pending-token',
          source: 'email_link',
          preferences: {
            marketingEmail: false,
            marketingSms: false,
            transactionalReservationUpdates: true,
          },
          compliance: {
            doubleOptIn: {
              email: 'not_subscribed',
              sms: 'not_subscribed',
            },
          },
        }),
      );
    });

    await page.route('**/v1/notification-preferences/session', async (route) => {
      const payload = route.request().postDataJSON() as {
        marketing?: { email?: boolean; sms?: boolean };
      };
      expect(payload.marketing?.sms).toBe(true);
      await json(
        route,
        session({
          token: 'sms-pending-token',
          source: 'email_link',
          preferences: {
            marketingEmail: false,
            marketingSms: false,
            transactionalReservationUpdates: true,
          },
          compliance: {
            doubleOptIn: {
              email: 'not_subscribed',
              sms: 'pending',
            },
          },
        }),
      );
    });

    await page.goto('/notifications/manage?token=sms-pending-token');
    await expect(page.getByLabel(/marketing sms/i)).not.toBeChecked();
    await expect(page.getByText(/double opt-in:\s*not subscribed/i)).toHaveCount(2);

    await page.getByLabel(/marketing sms/i).check();
    await page.getByRole('button', { name: /save preferences/i }).click();

    await expect(page.getByLabel(/marketing sms/i)).not.toBeChecked();
    await expect(page.getByText(/double opt-in:\s*pending confirmation/i)).toBeVisible();
    await expect(
      page.getByText(
        /preferences saved\. reply yes to your sms confirmation text to activate marketing updates\./i,
      ),
    ).toBeVisible();
  });

  test('supports both secure-entry flows while keeping transactional updates enabled', async ({
    page,
  }) => {
    await page.route('**/v1/notification-preferences/session?*', async (route) => {
      await json(
        route,
        session({
          token: 'email-flow-token',
          source: 'email_link',
          preferences: {
            marketingEmail: true,
            marketingSms: true,
            transactionalReservationUpdates: true,
          },
          compliance: {
            marketingPaused: false,
            doubleOptIn: {
              email: 'confirmed',
              sms: 'pending',
            },
          },
        }),
      );
    });

    await page.route('**/v1/notification-preferences/session', async (route) => {
      await json(
        route,
        session({
          token: 'updated-email-flow-token',
          source: 'email_link',
          preferences: {
            marketing: {
              email: false,
              sms: false,
            },
            transactionalReservationUpdates: true,
          },
          compliance: {
            marketingPaused: true,
            doubleOptIn: {
              email: 'pending',
              sms: 'confirmed',
            },
          },
        }),
      );
    });

    await page.goto('/notifications/manage?token=email-flow-token');
    await expect(page.getByText(/your secure link is confirmed/i)).toBeVisible();
    await expect(page.getByText(/active session for/i)).toContainText(/email link/i);
    await expect(page.getByLabel(/essential reservation updates/i)).toBeChecked();
    await expect(page.getByLabel(/essential reservation updates/i)).toBeDisabled();
    await expect(page.getByText(/double opt-in:\s*confirmed/i)).toBeVisible();
    await expect(page.getByText(/double opt-in:\s*pending confirmation/i)).toBeVisible();

    await page.getByLabel(/marketing email/i).uncheck();
    await page.getByLabel(/marketing sms/i).uncheck();
    await page.getByRole('button', { name: /save preferences/i }).click();

    await expect(
      page.getByText(/please confirm your marketing email subscription using the link we sent/i),
    ).toBeVisible();
    await expect(page.getByLabel(/essential reservation updates/i)).toBeChecked();
    await expect(page.getByLabel(/essential reservation updates/i)).toBeDisabled();
    await expect(page.getByText(/double opt-in:\s*pending confirmation/i)).toBeVisible();

    await page.unroute('**/v1/notification-preferences/session?*');
    await page.unroute('**/v1/notification-preferences/session');
    await page.route('**/v1/notification-preferences/cancel-code/session', async (route) => {
      await json(
        route,
        session({
          token: 'cancel-flow-token',
          source: 'cancel_code',
          subjectHint: 'reservation #R-2391',
          preferences: {
            marketing: {
              email: false,
              sms: false,
            },
            transactionalReservationUpdates: true,
          },
          compliance: {
            marketingPaused: true,
            doubleOptIn: {
              email: 'pending',
              sms: 'confirmed',
            },
          },
        }),
      );
    });

    await page.goto('/notifications/manage');
    await page.getByLabel(/reservation id/i).fill('2f7d0ac2-bf8d-490f-a4c8-5c3cb6fae56b');
    await page.getByLabel(/6-digit code/i).fill('123456');
    await page.getByRole('button', { name: /^continue$/i }).click();

    await expect(page.getByText(/your code was verified/i)).toBeVisible();
    await expect(page.getByText(/active session for/i)).toContainText(/cancel code/i);
    await expect(page.getByLabel(/marketing email/i)).not.toBeChecked();
    await expect(page.getByLabel(/marketing sms/i)).not.toBeChecked();
    await expect(page.getByLabel(/essential reservation updates/i)).toBeChecked();
    await expect(page.getByLabel(/essential reservation updates/i)).toBeDisabled();
    await expect(page.getByText(/double opt-in:\s*pending confirmation/i)).toBeVisible();
    await expect(page.getByText(/double opt-in:\s*confirmed/i)).toBeVisible();
  });

  test('handles email DOI confirm-link success and invalid-link failure', async ({ page }) => {
    await page.route('**/v1/notification-preferences/marketing-email/confirm', async (route) => {
      const request = route.request();
      const payload = request.postDataJSON() as { token?: string };
      if (payload.token === 'invalid-confirm-link') {
        await json(route, { message: 'Invalid or expired token', code: 'invalid_token' }, 401);
        return;
      }

      await json(
        route,
        session({
          token: 'doi-confirmed-token',
          source: 'email_link',
          compliance: {
            marketingPaused: false,
            doubleOptIn: {
              email: 'confirmed',
              sms: 'pending',
            },
          },
        }),
      );
    });

    await page.goto('/notifications/manage?confirmEmailToken=valid-confirm-link');
    await expect(
      page.getByText(
        /your marketing email subscription is confirmed\. you can review or pause preferences below\./i,
      ),
    ).toBeVisible();
    await expect(page.getByText(/double opt-in:\s*confirmed/i)).toBeVisible();
    await expect(page).toHaveURL(/\/notifications\/manage\?token=doi-confirmed-token$/);

    await page.goto('/notifications/manage?confirmEmailToken=invalid-confirm-link');
    await expect(page.getByRole('alert')).toContainText(/invalid or expired token/i);
  });

  test('one-click unsubscribe applies immediate suppression for marketing channels', async ({
    page,
  }) => {
    await page.route('**/v1/notification-preferences/unsubscribe', async (route) => {
      await json(
        route,
        session({
          token: 'suppressed-session-token',
          source: 'email_link',
          preferences: {
            marketing: {
              email: false,
              sms: false,
            },
            transactionalReservationUpdates: true,
          },
          compliance: {
            marketingPaused: true,
            appliedWithinOneBusinessDay: true,
            doubleOptIn: {
              email: 'not_subscribed',
              sms: 'not_subscribed',
            },
          },
        }),
      );
    });

    await page.goto('/notifications/manage?token=one-click-token&unsubscribe=1');

    await expect(page.getByText(/you are unsubscribed from marketing/i)).toBeVisible();
    await expect(page.getByLabel(/marketing email/i)).not.toBeChecked();
    await expect(page.getByLabel(/marketing sms/i)).not.toBeChecked();
    await expect(page.getByLabel(/essential reservation updates/i)).toBeChecked();
    await expect(page.getByLabel(/essential reservation updates/i)).toBeDisabled();
    await expect(page.getByText(/double opt-in:\s*not subscribed/i)).toHaveCount(2);
    await expect(page.getByText(/changes are active immediately\./i)).toBeVisible();
  });
});
