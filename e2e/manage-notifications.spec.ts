import { expect, test, type Route } from '@playwright/test';

type SessionResponse = {
  token: string;
  subjectHint: string;
  source: 'email_link' | 'cancel_code';
  preferences: {
    marketingEmail?: boolean;
    marketingSms?: boolean;
    transactionalReservationUpdates?: boolean;
    marketing?: {
      email?: boolean;
      sms?: boolean;
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

function buildSession(overrides: Partial<SessionResponse> = {}): SessionResponse {
  return {
    token: overrides.token ?? 'manage-session-token',
    subjectHint: overrides.subjectHint ?? 'ja***@ex***.com • ***1234',
    source: overrides.source ?? 'email_link',
    preferences: overrides.preferences ?? {
      marketingEmail: true,
      marketingSms: true,
      transactionalReservationUpdates: true,
    },
  };
}

test('direct visit renders manage notifications page with secure actions disabled before verification', async ({
  page,
}) => {
  await page.goto('/notifications/manage');

  await expect(
    page.getByRole('heading', { level: 1, name: /update how we contact you/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: /option 1 · email link/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: /option 2 · cancel code/i }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /save preferences/i })).toBeDisabled();
  await expect(page.getByRole('button', { name: /unsubscribe marketing/i })).toBeDisabled();
});

test('email-link token entry hydrates session and saves updated marketing preferences', async ({
  page,
}) => {
  await page.route('**/v1/notification-preferences/session?*', async (route) => {
    await json(route, buildSession({ token: 'email-session-token' }));
  });

  await page.route('**/v1/notification-preferences/session', async (route) => {
    await json(
      route,
      buildSession({
        token: 'saved-session-token',
        preferences: {
          marketingEmail: false,
          marketingSms: true,
          transactionalReservationUpdates: true,
        },
      }),
    );
  });

  await page.goto('/notifications/manage?token=signed-email-link-token');

  await expect(page.getByText(/your secure link is confirmed/i)).toBeVisible();
  await expect(page.getByText(/active session for/i)).toContainText(/email link/i);
  await expect(page.getByLabel(/essential reservation updates/i)).toBeDisabled();
  await expect(page.getByLabel(/essential reservation updates/i)).toBeChecked();
  await expect(page.getByLabel(/marketing email/i)).toBeChecked();
  await page.getByLabel(/marketing email/i).uncheck();

  const patchRequest = page.waitForRequest(
    (request) =>
      request.method() === 'PATCH' &&
      request.url().includes('/v1/notification-preferences/session'),
  );
  await page.getByRole('button', { name: /save preferences/i }).click();

  await expect(page.getByText(/your preferences are saved/i)).toBeVisible();
  const request = await patchRequest;
  expect(request.postDataJSON()).toEqual({
    token: 'email-session-token',
    marketing: {
      email: false,
      sms: true,
    },
    consent: {
      source: 'manage_notifications',
      displayedVersion: 'manage_notifications_v2',
      displayedText:
        'I agree to receive Mukyala marketing messages. Consent is not a condition of purchase.',
      channelTextVersion: {
        email: 'manage_notifications_v2:email',
        sms: 'manage_notifications_v2:sms',
      },
    },
  });
  await expect(page).toHaveURL(/\/notifications\/manage\?token=saved-session-token$/);
});

test('reservation id + cancel code flow verifies session and hydrates preferences', async ({
  page,
}) => {
  await page.route('**/v1/notification-preferences/cancel-code/session', async (route) => {
    await json(
      route,
      buildSession({
        token: 'cancel-session-token',
        source: 'cancel_code',
        subjectHint: 'reservation #R-1234',
        preferences: {
          marketing: {
            email: true,
            sms: false,
          },
          transactionalReservationUpdates: true,
        },
      }),
    );
  });

  await page.goto('/notifications/manage');

  await page.getByLabel(/reservation id/i).fill('2f7d0ac2-bf8d-490f-a4c8-5c3cb6fae56b');
  await page.getByLabel(/6-digit code/i).fill('123456');
  await expect(page.getByRole('button', { name: /^continue$/i })).toBeEnabled();
  const [request] = await Promise.all([
    page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        request.url().includes('/v1/notification-preferences/cancel-code/session'),
    ),
    page.getByRole('button', { name: /^continue$/i }).click(),
  ]);

  await expect(page.getByText(/your code was verified/i)).toBeVisible();
  await expect(page.getByText(/active session for/i)).toContainText(/cancel code/i);
  await expect(page.getByLabel(/marketing sms/i)).not.toBeChecked();

  expect(request.postDataJSON()).toEqual({
    reservationId: '2f7d0ac2-bf8d-490f-a4c8-5c3cb6fae56b',
    code: '123456',
  });
  await expect(page).toHaveURL(/\/notifications\/manage\?token=cancel-session-token$/);
});

test('one-click unsubscribe link updates marketing preferences during token hydration', async ({
  page,
}) => {
  let sessionEndpointCalled = false;

  await page.route('**/v1/notification-preferences/session?*', async (route) => {
    sessionEndpointCalled = true;
    await json(route, { message: 'should not be called' }, 500);
  });
  await page.route('**/v1/notification-preferences/unsubscribe', async (route) => {
    await json(
      route,
      buildSession({
        token: 'unsubscribe-session-token',
        preferences: {
          marketingEmail: false,
          marketingSms: false,
          transactionalReservationUpdates: true,
        },
      }),
    );
  });

  const unsubscribeRequest = page.waitForRequest(
    (request) =>
      request.method() === 'POST' &&
      request.url().includes('/v1/notification-preferences/unsubscribe'),
  );
  await page.goto('/notifications/manage?token=one-click-token&unsubscribe=1');

  await expect(page.getByText(/you are unsubscribed from marketing/i)).toBeVisible();
  await expect(page.getByLabel(/marketing email/i)).not.toBeChecked();
  await expect(page.getByLabel(/marketing sms/i)).not.toBeChecked();
  expect(sessionEndpointCalled).toBe(false);

  const request = await unsubscribeRequest;
  expect(request.postDataJSON()).toEqual({ token: 'one-click-token' });
  await expect(page).toHaveURL(/\/notifications\/manage\?token=unsubscribe-session-token$/);
});

test('shows a clear error when an email-link token is invalid or expired', async ({ page }) => {
  await page.route('**/v1/notification-preferences/session?*', async (route) => {
    await json(route, { message: 'Invalid or expired token', code: 'invalid_token' }, 401);
  });

  await page.goto('/notifications/manage?token=expired-token');

  await expect(page.getByRole('alert')).toContainText(/invalid or expired token/i);
});
