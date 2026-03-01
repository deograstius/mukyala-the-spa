import type {
  ManageNotificationsSession,
  ManageNotificationsViewState,
  NotificationPreferences,
} from '@features/notifications/managePreferencesApi';
import {
  MANAGE_NOTIFICATIONS_CONSENT_TEXT,
  MANAGE_NOTIFICATIONS_EMAIL_CONSENT_VERSION,
  MANAGE_NOTIFICATIONS_CONSENT_VERSION,
  MANAGE_NOTIFICATIONS_SMS_CONSENT_VERSION,
  confirmMarketingEmailDoubleOptIn,
  createCancelCodeSession,
  getNotificationPreferencesSession,
  requestEmailLink,
  unsubscribeNotificationPreferences,
  updateNotificationPreferencesSession,
} from '@features/notifications/managePreferencesApi';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { ApiError } from '@utils/api';
import { useEffect, useMemo, useState } from 'react';

const INITIAL_PREFERENCES: NotificationPreferences = {
  marketingEmail: true,
  marketingSms: true,
  transactionalReservationUpdates: true,
};

const INITIAL_COMPLIANCE: NonNullable<ManageNotificationsSession['compliance']> = {
  supportsEmailLinkFlow: true,
  supportsCancelCodeFlow: true,
  transactionalReservationUpdatesEnabled: true,
  marketingPaused: false,
  appliedWithinOneBusinessDay: true,
  appliedAtIso: new Date().toISOString(),
  doubleOptIn: {
    email: 'not_subscribed',
    sms: 'not_subscribed',
  },
  consentTextVersion: {
    email: MANAGE_NOTIFICATIONS_EMAIL_CONSENT_VERSION,
    sms: MANAGE_NOTIFICATIONS_SMS_CONSENT_VERSION,
  },
};

function formatDoubleOptInStatus(
  value: NonNullable<ManageNotificationsSession['compliance']>['doubleOptIn']['email'],
): string {
  if (value === 'pending') return 'Pending confirmation';
  if (value === 'confirmed') return 'Confirmed';
  return 'Not subscribed';
}

function formatAppliedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'just now';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function updateSearchToken(token: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set('token', token);
  url.searchParams.delete('confirmEmailToken');
  url.searchParams.delete('reservationId');
  url.searchParams.delete('code');
  url.searchParams.delete('unsubscribe');
  const query = url.searchParams.toString();
  window.history.replaceState({}, '', `${url.pathname}${query ? `?${query}` : ''}`);
}

function ManageNotifications() {
  const [viewState, setViewState] = useState<ManageNotificationsViewState>('idle');
  const [message, setMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [email, setEmail] = useState('');
  const [reservationId, setReservationId] = useState('');
  const [code, setCode] = useState('');
  const [sessionToken, setSessionToken] = useState<string>('');
  const [sessionSource, setSessionSource] = useState<'email_link' | 'cancel_code'>('email_link');
  const [subjectHint, setSubjectHint] = useState<string>('your contact details');
  const [preferences, setPreferences] = useState<NotificationPreferences>(INITIAL_PREFERENCES);
  const [savedPreferences, setSavedPreferences] =
    useState<NotificationPreferences>(INITIAL_PREFERENCES);
  const [sessionCompliance, setSessionCompliance] =
    useState<NonNullable<ManageNotificationsSession['compliance']>>(INITIAL_COMPLIANCE);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);

  const queryContext = useMemo(() => {
    const search = new URLSearchParams(window.location.search);
    return {
      token: search.get('token')?.trim() || '',
      confirmEmailToken: search.get('confirmEmailToken')?.trim() || '',
      reservationId: search.get('reservationId')?.trim() || '',
      code: search.get('code')?.trim() || '',
      unsubscribeRequested: search.get('unsubscribe') === '1',
    };
  }, []);

  const hasSession = sessionToken.length > 0;
  const hasQueryContext = Boolean(
    queryContext.token ||
      queryContext.confirmEmailToken ||
      (queryContext.reservationId && queryContext.code),
  );
  const isDirty =
    hasSession &&
    (preferences.marketingEmail !== savedPreferences.marketingEmail ||
      preferences.marketingSms !== savedPreferences.marketingSms);

  function applySession(session: ManageNotificationsSession) {
    setSessionToken(session.token);
    setSessionSource(session.source);
    setSubjectHint(session.subjectHint);
    setPreferences(session.preferences);
    setSavedPreferences(session.preferences);
    setSessionCompliance(session.compliance ?? INITIAL_COMPLIANCE);
    updateSearchToken(session.token);
  }

  function setSuccessMessage(nextState: ManageNotificationsViewState, value: string) {
    setViewState(nextState);
    setErrorMessage('');
    setMessage(value);
  }

  useEffect(() => {
    const confirmToken = queryContext.confirmEmailToken;
    if (confirmToken) {
      setIsLoadingSession(true);
      confirmMarketingEmailDoubleOptIn(confirmToken)
        .then((session) => {
          applySession(session);
          setSuccessMessage(
            'session-ready',
            'Your marketing email subscription is confirmed. You can review or pause preferences below.',
          );
        })
        .catch((error: unknown) => {
          setViewState('error');
          setMessage('');
          setErrorMessage(
            getErrorMessage(
              error,
              'That confirmation link is invalid or expired. Request a new secure link to continue.',
            ),
          );
        })
        .finally(() => {
          setIsLoadingSession(false);
        });
      return;
    }

    const token = queryContext.token;
    if (token) {
      setIsLoadingSession(true);
      const request = queryContext.unsubscribeRequested
        ? unsubscribeNotificationPreferences(token)
        : getNotificationPreferencesSession(token);
      request
        .then((session) => {
          applySession(session);
          setSuccessMessage(
            'session-ready',
            queryContext.unsubscribeRequested
              ? 'You are unsubscribed from marketing. Essential reservation updates will continue.'
              : 'Your secure link is confirmed. Review and save your marketing preferences below.',
          );
        })
        .catch((error: unknown) => {
          setViewState('error');
          setMessage('');
          setErrorMessage(
            getErrorMessage(
              error,
              'We could not validate that link. Request a new email link or use your reservation ID and cancel code.',
            ),
          );
        })
        .finally(() => {
          setIsLoadingSession(false);
        });
      return;
    }

    if (queryContext.reservationId && queryContext.code) {
      setReservationId(queryContext.reservationId);
      setCode(queryContext.code);
      setIsLoadingSession(true);
      createCancelCodeSession({
        reservationId: queryContext.reservationId,
        code: queryContext.code,
      })
        .then((session) => {
          applySession(session);
          setSuccessMessage(
            'session-ready',
            'Your reservation code was verified. You can now update your marketing preferences.',
          );
        })
        .catch((error: unknown) => {
          setViewState('error');
          setMessage('');
          setErrorMessage(
            getErrorMessage(
              error,
              'We could not verify that reservation ID and code. Double-check both values and try again.',
            ),
          );
        })
        .finally(() => {
          setIsLoadingSession(false);
        });
    }
  }, [
    queryContext.code,
    queryContext.confirmEmailToken,
    queryContext.reservationId,
    queryContext.token,
    queryContext.unsubscribeRequested,
  ]);

  return (
    <Section className="section-pad-top-md section-pad-bottom-xl">
      <Container>
        <div className="inner-container _800px center">
          <header className="text-center">
            <p className="paragraph-small text-uppercase mg-bottom-16px">Manage notifications</p>
            <h1 className="display-7">Update how we contact you</h1>
            <p className="paragraph-large mg-top-12px">
              Use this page to confirm marketing opt-in, pause promotional emails, or stop all but
              essential reservation updates. Secure verification keeps these settings private to
              you.
            </p>
          </header>

          <div className="mg-top-40px">
            {hasQueryContext && (
              <div className="card pd-24px">
                <h2 className="display-9">Secure session detected</h2>
                <p className="paragraph-medium mg-top-12px">
                  We detected secure parameters in your link. Continue below to finish loading your
                  notification preferences.
                </p>
                <p className="paragraph-small mg-top-12px mg-bottom-0">
                  {queryContext.confirmEmailToken
                    ? 'Marketing email confirmation link found.'
                    : queryContext.token
                      ? 'Signed email-link session found.'
                      : 'Reservation cancel-code session parameters found.'}
                </p>
              </div>
            )}

            <div className="card pd-24px">
              <h2 className="display-9">Option 1 · Email link</h2>
              <p className="paragraph-medium mg-top-12px">
                Enter the email address you used with Mukyala. We’ll send a secure confirmation link
                (48-hour TTL, single-use) so you can review preferences.
              </p>
              <p className="paragraph-small mg-top-8px">
                Marketing email status:{' '}
                <strong>{formatDoubleOptInStatus(sessionCompliance.doubleOptIn.email)}</strong>.
                Email marketing stays inactive until confirmation is completed.
              </p>
              <form
                className="mg-top-20px"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setIsSubmittingEmail(true);
                  setErrorMessage('');
                  try {
                    await requestEmailLink(email);
                    setSuccessMessage(
                      'email-link-requested',
                      'If we found a matching contact, we sent a secure link. Please check your inbox to continue.',
                    );
                  } catch (error: unknown) {
                    setViewState('error');
                    setMessage('');
                    setErrorMessage(
                      getErrorMessage(
                        error,
                        'We could not submit your request right now. Please try again in a moment.',
                      ),
                    );
                  } finally {
                    setIsSubmittingEmail(false);
                  }
                }}
              >
                <label className="paragraph-small" htmlFor="manage-email">
                  Email address
                </label>
                <input
                  id="manage-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-input input-line medium"
                  placeholder="you@example.com"
                  style={{ marginTop: 8, marginBottom: 16 }}
                />
                <button
                  type="submit"
                  className="button-primary w-button"
                  disabled={isSubmittingEmail || isLoadingSession}
                >
                  Send confirmation link
                </button>
              </form>
            </div>

            <div className="card mg-top-32px pd-24px">
              <h2 className="display-9">Option 2 · Cancel code</h2>
              <p className="paragraph-medium mg-top-12px">
                Have a reservation ID and six-digit cancel code? Enter both to load that reservation
                notification preferences.
              </p>
              <p className="paragraph-small mg-top-8px">
                This flow supports the same marketing pause/confirm controls as the secure
                email-link flow.
              </p>
              <form
                className="mg-top-20px"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setIsLoadingSession(true);
                  setErrorMessage('');
                  try {
                    const session = await createCancelCodeSession({
                      reservationId,
                      code,
                    });
                    applySession(session);
                    setSuccessMessage(
                      'cancel-code-submitted',
                      'Your code was verified. Your marketing preferences are ready to review below.',
                    );
                    setViewState('session-ready');
                  } catch (error: unknown) {
                    setViewState('error');
                    setMessage('');
                    setErrorMessage(
                      getErrorMessage(
                        error,
                        'We could not verify that reservation ID and code. Please check both and try again.',
                      ),
                    );
                  } finally {
                    setIsLoadingSession(false);
                  }
                }}
              >
                <label className="paragraph-small" htmlFor="manage-reservation-id">
                  Reservation ID
                </label>
                <input
                  id="manage-reservation-id"
                  type="text"
                  required
                  value={reservationId}
                  onChange={(event) => setReservationId(event.target.value)}
                  className="w-input input-line medium"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  style={{ marginTop: 8, marginBottom: 16 }}
                />
                <label className="paragraph-small" htmlFor="manage-code">
                  6-digit code
                </label>
                <input
                  id="manage-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-input input-line medium"
                  placeholder="123456"
                  style={{ marginTop: 8, marginBottom: 16, width: 160 }}
                />
                <button
                  type="submit"
                  className="button-secondary w-button"
                  disabled={isLoadingSession || isSubmittingEmail}
                >
                  Continue
                </button>
              </form>
            </div>

            <div className="card mg-top-32px pd-24px">
              <h2 className="display-9">Preferences preview</h2>
              <p className="paragraph-medium mg-top-12px">
                This section shows your current contact preferences after secure verification.
                Transactional reservation updates stay on so we can send essential booking updates.
              </p>
              {hasSession && (
                <p className="paragraph-small mg-top-12px">
                  Active session for <strong>{subjectHint}</strong> (
                  {sessionSource === 'email_link' ? 'Email link' : 'Cancel code'}).
                </p>
              )}
              {hasSession && (
                <p className="paragraph-small mg-top-8px">
                  Last applied: <strong>{formatAppliedAt(sessionCompliance.appliedAtIso)}</strong>.
                  {sessionCompliance.appliedWithinOneBusinessDay
                    ? ' Changes are active immediately.'
                    : ' We process updates within one business day at the latest.'}
                </p>
              )}
              <div className="mg-top-20px">
                <label className="paragraph-small" htmlFor="pref-marketing-email">
                  <input
                    id="pref-marketing-email"
                    type="checkbox"
                    checked={preferences.marketingEmail}
                    disabled={!hasSession || isSavingPreferences || isUnsubscribing}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        marketingEmail: event.target.checked,
                      }))
                    }
                    style={{ marginRight: 8 }}
                  />
                  Marketing email
                </label>
                <p className="paragraph-small mg-top-8px mg-bottom-0">
                  Double opt-in:{' '}
                  <strong>{formatDoubleOptInStatus(sessionCompliance.doubleOptIn.email)}</strong>
                </p>
                <p className="paragraph-small mg-top-8px mg-bottom-0">
                  {MANAGE_NOTIFICATIONS_CONSENT_TEXT}
                </p>
                <p className="paragraph-small mg-top-8px mg-bottom-0">
                  Consent version: <strong>{sessionCompliance.consentTextVersion.email}</strong>
                </p>
              </div>
              <div className="mg-top-12px">
                <label className="paragraph-small" htmlFor="pref-marketing-sms">
                  <input
                    id="pref-marketing-sms"
                    type="checkbox"
                    checked={preferences.marketingSms}
                    disabled={!hasSession || isSavingPreferences || isUnsubscribing}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        marketingSms: event.target.checked,
                      }))
                    }
                    style={{ marginRight: 8 }}
                  />
                  Marketing SMS
                </label>
                <p className="paragraph-small mg-top-8px mg-bottom-0">
                  Double opt-in:{' '}
                  <strong>{formatDoubleOptInStatus(sessionCompliance.doubleOptIn.sms)}</strong>
                </p>
                <p className="paragraph-small mg-top-8px mg-bottom-0">
                  {MANAGE_NOTIFICATIONS_CONSENT_TEXT}
                </p>
                <p className="paragraph-small mg-top-8px mg-bottom-0">
                  Consent version: <strong>{sessionCompliance.consentTextVersion.sms}</strong>
                </p>
              </div>
              <div className="mg-top-12px">
                <label className="paragraph-small" htmlFor="pref-transactional">
                  <input
                    id="pref-transactional"
                    type="checkbox"
                    checked={preferences.transactionalReservationUpdates}
                    disabled
                    style={{ marginRight: 8 }}
                    readOnly
                  />
                  Essential reservation updates (always on)
                </label>
              </div>
              <div className="mg-top-20px">
                <button
                  type="button"
                  className="button-primary w-button"
                  disabled={!hasSession || !isDirty || isSavingPreferences || isUnsubscribing}
                  onClick={async () => {
                    if (!sessionToken) return;
                    setIsSavingPreferences(true);
                    setErrorMessage('');
                    try {
                      const session = await updateNotificationPreferencesSession({
                        token: sessionToken,
                        marketingEmail: preferences.marketingEmail,
                        marketingSms: preferences.marketingSms,
                        consent: {
                          source: 'manage_notifications',
                          displayedVersion: MANAGE_NOTIFICATIONS_CONSENT_VERSION,
                          displayedText: MANAGE_NOTIFICATIONS_CONSENT_TEXT,
                          channelTextVersion: {
                            email:
                              sessionCompliance.consentTextVersion.email ||
                              MANAGE_NOTIFICATIONS_EMAIL_CONSENT_VERSION,
                            sms:
                              sessionCompliance.consentTextVersion.sms ||
                              MANAGE_NOTIFICATIONS_SMS_CONSENT_VERSION,
                          },
                        },
                      });
                      applySession(session);
                      const pendingEmail =
                        (session.compliance?.doubleOptIn.email ?? 'not_subscribed') === 'pending';
                      const pendingSms =
                        (session.compliance?.doubleOptIn.sms ?? 'not_subscribed') === 'pending';
                      setSuccessMessage(
                        'session-ready',
                        pendingEmail && pendingSms
                          ? 'Preferences saved. Confirm your marketing email with the link we sent, and reply YES to your SMS confirmation text to activate marketing updates.'
                          : pendingEmail
                            ? 'Preferences saved. Please confirm your marketing email subscription using the link we sent.'
                            : pendingSms
                              ? 'Preferences saved. Reply YES to your SMS confirmation text to activate marketing updates.'
                              : 'Your preferences are saved. Marketing updates follow these settings right away.',
                      );
                    } catch (error: unknown) {
                      setViewState('error');
                      setMessage('');
                      setErrorMessage(
                        getErrorMessage(
                          error,
                          'We could not save your preferences. Please try again.',
                        ),
                      );
                    } finally {
                      setIsSavingPreferences(false);
                    }
                  }}
                >
                  Save preferences
                </button>
                <button
                  type="button"
                  className="button-secondary w-button mg-left-12px"
                  disabled={
                    !hasSession ||
                    isSavingPreferences ||
                    isUnsubscribing ||
                    (!preferences.marketingEmail && !preferences.marketingSms)
                  }
                  onClick={async () => {
                    if (!sessionToken) return;
                    setIsUnsubscribing(true);
                    setErrorMessage('');
                    try {
                      const session = await unsubscribeNotificationPreferences(sessionToken);
                      applySession(session);
                      setSuccessMessage(
                        'session-ready',
                        'You are unsubscribed from marketing. Essential reservation updates will still be sent.',
                      );
                    } catch (error: unknown) {
                      setViewState('error');
                      setMessage('');
                      setErrorMessage(
                        getErrorMessage(
                          error,
                          'We could not complete your unsubscribe request. Please try again.',
                        ),
                      );
                    } finally {
                      setIsUnsubscribing(false);
                    }
                  }}
                >
                  Unsubscribe marketing
                </button>
              </div>
            </div>

            <div className="card mg-top-32px pd-24px">
              <h2 className="display-9">Need help now?</h2>
              <p className="paragraph-medium mg-top-12px">
                Email info@mukyala.com or call (443) 681-0463. We’ll honor unsubscribe requests
                within one business day at the latest.
              </p>
              <p className="paragraph-small mg-top-8px mg-bottom-0">
                {sessionCompliance.appliedWithinOneBusinessDay
                  ? `Latest preferences were applied at ${formatAppliedAt(sessionCompliance.appliedAtIso)}.`
                  : 'Your latest request is processing and will be applied within one business day.'}
              </p>
            </div>

            {errorMessage && (
              <div
                className="card mg-top-24px pd-24px"
                role="alert"
                style={{ background: '#fef2f2', borderColor: '#fecaca' }}
              >
                <p className="paragraph-medium" style={{ margin: 0, color: '#991b1b' }}>
                  {errorMessage}
                </p>
              </div>
            )}

            {viewState !== 'idle' && message && (
              <div
                className="card mg-top-24px pd-24px"
                role="status"
                style={{ background: '#f3f4f6' }}
              >
                <p className="paragraph-medium" style={{ margin: 0 }}>
                  {message}
                </p>
              </div>
            )}

            {(isLoadingSession || isSavingPreferences || isUnsubscribing) && (
              <div
                className="card mg-top-24px pd-24px"
                role="status"
                style={{ background: '#f8fafc' }}
              >
                <p className="paragraph-small" style={{ margin: 0 }}>
                  Updating your secure notification settings...
                </p>
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default ManageNotifications;
