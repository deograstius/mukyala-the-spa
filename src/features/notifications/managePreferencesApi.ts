import { API_BASE_URL } from '@app/config';
import { ApiError, apiGet, apiPost } from '@utils/api';

export type DoubleOptInStatus = 'pending' | 'confirmed' | 'not_subscribed';

export type NotificationPreferences = {
  marketingEmail: boolean;
  marketingSms: boolean;
  transactionalReservationUpdates: true;
};

export type ManageNotificationsCompliance = {
  supportsEmailLinkFlow: boolean;
  supportsCancelCodeFlow: boolean;
  transactionalReservationUpdatesEnabled: true;
  marketingPaused: boolean;
  appliedWithinOneBusinessDay: boolean;
  appliedAtIso: string;
  doubleOptIn: {
    email: DoubleOptInStatus;
    sms: DoubleOptInStatus;
  };
  consentTextVersion: {
    email: string;
    sms: string;
  };
};

export type ManageNotificationsSession = {
  token: string;
  subjectHint: string;
  source: 'email_link' | 'cancel_code';
  preferences: NotificationPreferences;
  compliance?: ManageNotificationsCompliance;
};

export type ManageNotificationsViewState =
  | 'idle'
  | 'email-link-requested'
  | 'cancel-code-submitted'
  | 'session-ready'
  | 'error';

export const MANAGE_NOTIFICATIONS_CONSENT_VERSION = 'manage_notifications_v2';
export const MANAGE_NOTIFICATIONS_CONSENT_TEXT =
  'I agree to receive Mukyala marketing messages. Consent is not a condition of purchase.';
export const MANAGE_NOTIFICATIONS_EMAIL_CONSENT_VERSION = `${MANAGE_NOTIFICATIONS_CONSENT_VERSION}:email`;
export const MANAGE_NOTIFICATIONS_SMS_CONSENT_VERSION = `${MANAGE_NOTIFICATIONS_CONSENT_VERSION}:sms`;

type SessionApiResponse = {
  token?: string;
  subjectHint?: string;
  source?: 'email_link' | 'cancel_code';
  preferences?: {
    marketingEmail?: boolean;
    marketingSms?: boolean;
    transactionalReservationUpdates?: boolean;
    marketing?: {
      email?: boolean;
      sms?: boolean;
    };
  };
  compliance?: {
    supportsEmailLinkFlow?: boolean;
    supportsCancelCodeFlow?: boolean;
    transactionalReservationUpdatesEnabled?: boolean;
    marketingPaused?: boolean;
    appliedWithinOneBusinessDay?: boolean;
    appliedAtIso?: string;
    doubleOptIn?: {
      email?: DoubleOptInStatus;
      sms?: DoubleOptInStatus;
    };
    consentTextVersion?: {
      email?: string;
      sms?: string;
    };
  };
};

type UpdateConsentInput = {
  source?: 'manage_notifications' | 'web_form' | 'inbound_keyword';
  displayedVersion?: string;
  displayedText?: string;
  channelTextVersion?: {
    email?: string;
    sms?: string;
  };
};

function buildUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL ?? ''}${p}`;
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function getErrorDetails(body: unknown): { message: string; code?: string; details?: unknown } {
  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    const message =
      typeof obj.message === 'string'
        ? obj.message
        : typeof obj.error === 'string'
          ? obj.error
          : 'Request failed';
    const code =
      typeof obj.code === 'string'
        ? obj.code
        : typeof obj.error === 'string'
          ? obj.error
          : undefined;
    const details = Object.prototype.hasOwnProperty.call(obj, 'details') ? obj.details : undefined;
    return { message, code, details };
  }
  return { message: 'Request failed' };
}

function normalizeCompliance(
  input: SessionApiResponse['compliance'],
): ManageNotificationsCompliance {
  const appliedAtIso =
    typeof input?.appliedAtIso === 'string' && input.appliedAtIso.trim()
      ? input.appliedAtIso
      : new Date().toISOString();

  return {
    supportsEmailLinkFlow: input?.supportsEmailLinkFlow !== false,
    supportsCancelCodeFlow: input?.supportsCancelCodeFlow !== false,
    transactionalReservationUpdatesEnabled: true,
    marketingPaused: Boolean(input?.marketingPaused),
    appliedWithinOneBusinessDay: input?.appliedWithinOneBusinessDay !== false,
    appliedAtIso,
    doubleOptIn: {
      email: input?.doubleOptIn?.email ?? 'not_subscribed',
      sms: input?.doubleOptIn?.sms ?? 'not_subscribed',
    },
    consentTextVersion: {
      email: input?.consentTextVersion?.email || MANAGE_NOTIFICATIONS_EMAIL_CONSENT_VERSION,
      sms: input?.consentTextVersion?.sms || MANAGE_NOTIFICATIONS_SMS_CONSENT_VERSION,
    },
  };
}

function normalizeSession(input: unknown): ManageNotificationsSession {
  if (!input || typeof input !== 'object') {
    throw new ApiError(500, 'Invalid notification preferences response', 'invalid_response');
  }
  const data = input as SessionApiResponse;
  const token = typeof data.token === 'string' ? data.token : '';
  if (!token) {
    throw new ApiError(500, 'Missing session token', 'invalid_response');
  }
  const subjectHint =
    typeof data.subjectHint === 'string' ? data.subjectHint : 'your contact details';
  const source = data.source === 'cancel_code' ? 'cancel_code' : 'email_link';
  const nestedMarketing = data.preferences?.marketing;
  const marketingEmail =
    typeof data.preferences?.marketingEmail === 'boolean'
      ? data.preferences.marketingEmail
      : typeof nestedMarketing?.email === 'boolean'
        ? nestedMarketing.email
        : true;
  const marketingSms =
    typeof data.preferences?.marketingSms === 'boolean'
      ? data.preferences.marketingSms
      : typeof nestedMarketing?.sms === 'boolean'
        ? nestedMarketing.sms
        : true;

  return {
    token,
    subjectHint,
    source,
    preferences: {
      marketingEmail,
      marketingSms,
      transactionalReservationUpdates: true,
    },
    compliance: normalizeCompliance(data.compliance),
  };
}

function resolveConsentInput(input: UpdateConsentInput | undefined): Required<UpdateConsentInput> {
  const displayedVersion = input?.displayedVersion?.trim() || MANAGE_NOTIFICATIONS_CONSENT_VERSION;
  return {
    source: input?.source || 'manage_notifications',
    displayedVersion,
    displayedText: input?.displayedText?.trim() || MANAGE_NOTIFICATIONS_CONSENT_TEXT,
    channelTextVersion: {
      email:
        input?.channelTextVersion?.email?.trim() ||
        (displayedVersion === MANAGE_NOTIFICATIONS_CONSENT_VERSION
          ? MANAGE_NOTIFICATIONS_EMAIL_CONSENT_VERSION
          : `${displayedVersion}:email`),
      sms:
        input?.channelTextVersion?.sms?.trim() ||
        (displayedVersion === MANAGE_NOTIFICATIONS_CONSENT_VERSION
          ? MANAGE_NOTIFICATIONS_SMS_CONSENT_VERSION
          : `${displayedVersion}:sms`),
    },
  };
}

export async function requestEmailLink(email: string): Promise<void> {
  await apiPost('/v1/notification-preferences/email-link', {
    email: email.trim(),
  });
}

export async function createCancelCodeSession(input: {
  reservationId: string;
  code: string;
}): Promise<ManageNotificationsSession> {
  const payload = await apiPost<SessionApiResponse>(
    '/v1/notification-preferences/cancel-code/session',
    {
      reservationId: input.reservationId.trim(),
      code: input.code.trim(),
    },
  );
  return normalizeSession(payload);
}

export async function getNotificationPreferencesSession(
  token: string,
): Promise<ManageNotificationsSession> {
  const payload = await apiGet<SessionApiResponse>(
    `/v1/notification-preferences/session?token=${encodeURIComponent(token)}`,
  );
  return normalizeSession(payload);
}

export async function updateNotificationPreferencesSession(input: {
  token: string;
  marketingEmail: boolean;
  marketingSms: boolean;
  consent?: UpdateConsentInput;
}): Promise<ManageNotificationsSession> {
  const consent = input.consent ? resolveConsentInput(input.consent) : undefined;
  const res = await fetch(buildUrl('/v1/notification-preferences/session'), {
    method: 'PATCH',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      token: input.token,
      marketing: {
        email: input.marketingEmail,
        sms: input.marketingSms,
      },
      ...(consent ? { consent } : {}),
    }),
  });
  const body = await parseJson(res);
  if (!res.ok) {
    const err = getErrorDetails(body);
    throw new ApiError(res.status, err.message, err.code, err.details);
  }
  return normalizeSession(body);
}

export async function confirmMarketingEmailDoubleOptIn(
  token: string,
): Promise<ManageNotificationsSession> {
  const payload = await apiPost<SessionApiResponse>(
    '/v1/notification-preferences/marketing-email/confirm',
    { token: token.trim() },
  );
  return normalizeSession(payload);
}

export async function unsubscribeNotificationPreferences(
  token: string,
): Promise<ManageNotificationsSession> {
  const payload = await apiPost<SessionApiResponse>('/v1/notification-preferences/unsubscribe', {
    token,
  });
  return normalizeSession(payload);
}
