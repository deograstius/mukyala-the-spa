import { setBaseTitle } from '@app/seo';
import { primaryLocation } from '@data/contact';
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

/*
 * Task-focused redesign (NOTES/spa-pages.md P1-P4, operator mandate):
 * one primary path (email -> secure link), cancel-code entry as a secondary
 * reveal, and the preferences panel rendered ONLY after verification. All
 * compliance flows are unchanged: email-link sessions, cancel-code sessions,
 * double-opt-in state per channel, one-click unsubscribe (?unsubscribe=1),
 * always-on transactional updates, and consent versions on the save payload
 * (versions are API metadata now — never shown on screen).
 */

const INITIAL_PREFERENCES: NotificationPreferences = {
  marketingEmail: true,
  marketingSms: true,
  transactionalReservationUpdates: true,
};

// Pre-session placeholder — appliedAtIso stays EMPTY so no fabricated
// "applied at <now>" line can ever render before a server session exists.
const INITIAL_COMPLIANCE: NonNullable<ManageNotificationsSession['compliance']> = {
  supportsEmailLinkFlow: true,
  supportsCancelCodeFlow: true,
  transactionalReservationUpdatesEnabled: true,
  marketingPaused: false,
  appliedWithinOneBusinessDay: true,
  appliedAtIso: '',
  doubleOptIn: {
    email: 'not_subscribed',
    sms: 'not_subscribed',
  },
  consentTextVersion: {
    email: MANAGE_NOTIFICATIONS_EMAIL_CONSENT_VERSION,
    sms: MANAGE_NOTIFICATIONS_SMS_CONSENT_VERSION,
  },
};

function describeOptInStatus(
  channel: 'email' | 'text',
  value: NonNullable<ManageNotificationsSession['compliance']>['doubleOptIn']['email'],
): string {
  if (value === 'confirmed') return `Your ${channel} subscription is confirmed.`;
  if (value === 'pending')
    return channel === 'email'
      ? 'Waiting for you to confirm — check your inbox for our confirmation email.'
      : 'Waiting for you to confirm — reply YES to our confirmation text.';
  return `You’re not subscribed to marketing by ${channel} yet.`;
}

function formatAppliedAt(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
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

  useEffect(() => {
    setBaseTitle('Manage Notifications');
  }, []);

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

  // Cancel-code entry is a secondary reveal; open it automatically when the
  // visitor arrived with cancel-code parameters in the link.
  const [showCancelCode, setShowCancelCode] = useState(() =>
    Boolean(queryContext.reservationId || queryContext.code),
  );

  const hasSession = sessionToken.length > 0;
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

  const appliedAtDisplay = formatAppliedAt(sessionCompliance.appliedAtIso);

  return (
    <Section className="section-pad-top-md section-pad-bottom-xl">
      <Container>
        <div className="inner-container _800px center">
          <header className="text-center">
            <p className="paragraph-small text-uppercase mg-bottom-16px">Manage notifications</p>
            <h1 className="display-9">Update how we contact you</h1>
            <p className="paragraph-large mg-top-12px">
              Choose which marketing messages you get from Mukyala, or pause them entirely.
              Essential updates about your reservations always come through.
            </p>
          </header>

          <div className="mg-top-40px">
            {/* Feedback surfaces sit right under the header so the current
                state is always the first thing a visitor reads. */}
            {(isLoadingSession || isSavingPreferences || isUnsubscribing) && (
              <div className="card pd-24px mg-bottom-24px" role="status">
                <p className="paragraph-small" style={{ margin: 0 }}>
                  {isLoadingSession
                    ? 'Checking your secure link…'
                    : 'Saving your notification settings…'}
                </p>
              </div>
            )}
            {errorMessage && (
              <div className="card pd-24px mg-bottom-24px" role="alert">
                <p className="paragraph-medium text-error" style={{ margin: 0 }}>
                  {errorMessage}
                </p>
              </div>
            )}
            {viewState !== 'idle' && message && (
              <div className="card pd-24px mg-bottom-24px" role="status">
                <p className="paragraph-medium" style={{ margin: 0 }}>
                  {message}
                </p>
              </div>
            )}

            {!hasSession ? (
              <>
                {/* Primary path: email -> secure link */}
                <div className="card pd-24px">
                  <h2 className="display-6">Get your secure link</h2>
                  <p className="paragraph-medium mg-top-12px">
                    Enter the email address you used with Mukyala and we’ll send you a secure link
                    to manage your preferences. The link works for 48 hours and can be used once.
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
                      className="button-primary filled w-button"
                      disabled={isSubmittingEmail || isLoadingSession}
                    >
                      Send confirmation link
                    </button>
                  </form>
                </div>

                {/* Secondary path: reservation cancel code (collapsed) */}
                <div className="mg-top-24px">
                  {!showCancelCode ? (
                    <button
                      type="button"
                      className="button-reset text-link paragraph-medium"
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      onClick={() => setShowCancelCode(true)}
                      data-cta-id="manage-notifications-show-cancel-code"
                    >
                      Have a reservation cancel code? Use it instead
                    </button>
                  ) : (
                    <div className="card pd-24px">
                      <h2 className="display-6">Use your reservation cancel code</h2>
                      <p className="paragraph-medium mg-top-12px">
                        Your confirmation email includes a reservation ID and a 6-digit cancel code.
                        Enter both to manage the preferences for that reservation.
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
                          placeholder="From your confirmation email"
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
                          onChange={(event) =>
                            setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                          }
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
                  )}
                </div>
              </>
            ) : (
              /* Preferences render ONLY after verification — no ghost panel
                 (and no invented timestamps) for unverified visitors. */
              <div className="card pd-24px">
                <h2 className="display-6">Your preferences</h2>
                <p className="paragraph-small mg-top-12px">
                  Active session for <strong>{subjectHint}</strong> (
                  {sessionSource === 'email_link' ? 'Email link' : 'Cancel code'}).
                </p>
                {appliedAtDisplay ? (
                  <p className="paragraph-small mg-top-8px">
                    Last updated: <strong>{appliedAtDisplay}</strong>.
                    {sessionCompliance.appliedWithinOneBusinessDay
                      ? ' Changes take effect right away.'
                      : ' We process updates within one business day at the latest.'}
                  </p>
                ) : null}
                <div className="mg-top-20px">
                  <label className="paragraph-small" htmlFor="pref-marketing-email">
                    <input
                      id="pref-marketing-email"
                      type="checkbox"
                      checked={preferences.marketingEmail}
                      disabled={isSavingPreferences || isUnsubscribing}
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
                    {describeOptInStatus('email', sessionCompliance.doubleOptIn.email)}
                  </p>
                </div>
                <div className="mg-top-12px">
                  <label className="paragraph-small" htmlFor="pref-marketing-sms">
                    <input
                      id="pref-marketing-sms"
                      type="checkbox"
                      checked={preferences.marketingSms}
                      disabled={isSavingPreferences || isUnsubscribing}
                      onChange={(event) =>
                        setPreferences((current) => ({
                          ...current,
                          marketingSms: event.target.checked,
                        }))
                      }
                      style={{ marginRight: 8 }}
                    />
                    Marketing texts (SMS)
                  </label>
                  <p className="paragraph-small mg-top-8px mg-bottom-0">
                    {describeOptInStatus('text', sessionCompliance.doubleOptIn.sms)}
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
                <p className="paragraph-small mg-top-16px mg-bottom-0">
                  {MANAGE_NOTIFICATIONS_CONSENT_TEXT}
                </p>
                <div className="mg-top-20px">
                  <button
                    type="button"
                    className="button-primary filled w-button"
                    disabled={!isDirty || isSavingPreferences || isUnsubscribing}
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
            )}

            {/* Quiet help footer — no card headline competing with the h1 */}
            <p className="paragraph-small mg-top-40px text-center">
              Need a hand? Email info@mukyala.com or call {primaryLocation.phone.display}. We honor
              unsubscribe requests within one business day at the latest.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default ManageNotifications;
