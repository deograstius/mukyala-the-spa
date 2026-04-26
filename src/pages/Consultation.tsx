/**
 * /consultation — multi-step wizard shell for Form 1 / `intake`.
 *
 * Source of truth: MD §7 (wizard structure) + §8 (draft persistence) + §16
 *   (states) + §18 (positioning copy) + §19 (post-submit flow).
 *
 * Routing:
 *   - /consultation                 → renders Step 1 (router pins step-1 by default)
 *   - /consultation/step-1 ... step-6  → router params; default step-1
 *   - /consultation/success         → renders SuccessPanel after a 200
 *
 * Submit flow:
 *   - Submit button is rendered ONLY on Step 6 (per MD §7).
 *   - Step 6 re-validates the entire form (MD §7) before POSTing.
 *   - On success: 200 → swap shell content for SuccessPanel + clear draft.
 *   - On failure: keep draft, show inline error, re-enable submit.
 *
 * IMPORTANT scope discipline (operator):
 *   - NO 18+ gate. NO photo upload. NO marketing-opt-in checkbox.
 */

import { setBaseTitle } from '@app/seo';
import { emitTelemetry } from '@app/telemetry';
import Step1Personal from '@features/consultation/Step1Personal';
import Step2Lifestyle from '@features/consultation/Step2Lifestyle';
import Step3SkinConcerns from '@features/consultation/Step3SkinConcerns';
import Step4Health from '@features/consultation/Step4Health';
import Step5FemalesOnly from '@features/consultation/Step5FemalesOnly';
import Step6ReviewSign from '@features/consultation/Step6ReviewSign';
import SuccessPanel from '@features/consultation/SuccessPanel';
import {
  clearDraft,
  createDebouncedSaver,
  formatRelativeAgo,
  getOrCreateClientSessionId,
  loadDraft,
  saveDraft,
  type StoredDraftEnvelope,
} from '@features/consultation/draftStore';
import {
  CONSULTATION_FORM_ID,
  CONSULTATION_SLA_BUSINESS_DAYS,
  CONSULTATION_STEP_IDS,
  CONSULTATION_STEP_TITLES,
  applyRevealClears,
  createEmptyDraft,
  earliestIncompleteStep,
  flattenDraftForSubmit,
  isRevealed,
  isStepComplete,
  stepRequiredFields,
  type ConsultationDraft,
  type ConsultationStepId,
  type ConsultationSubmitRequest,
} from '@features/consultation/schema';
import { useCreateConsultation } from '@hooks/consultations.api';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { useNavigate } from '@tanstack/react-router';
import { isValidEmail, isValidName, isValidPhone } from '@utils/validation';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface ConsultationPageProps {
  /**
   * Active step id derived from the URL. Wired from the router's path
   * param via the consultation child route below (see router.tsx).
   */
  currentStep: ConsultationStepId;
}

type FieldErrors = Record<string, string>;

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function firstNameOf(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
}

function validateStepFields(stepId: ConsultationStepId, draft: ConsultationDraft): FieldErrors {
  const errors: FieldErrors = {};
  for (const path of stepRequiredFields(stepId, draft)) {
    const v = readPath(path, draft);
    if (v === null || v === undefined) {
      errors[path] = 'Required';
      continue;
    }
    if (typeof v === 'string' && !v.trim()) {
      errors[path] = 'Required';
      continue;
    }
    if (typeof v === 'boolean' && path === 'signature.attested' && v !== true) {
      errors[path] = 'You must check the attestation to continue.';
    }
  }
  // Field-specific format validation on Step 1.
  if (stepId === 'step-1') {
    if (draft.personal.client_name && !isValidName(draft.personal.client_name)) {
      errors['personal.client_name'] = 'Please enter your full name (2–80 chars).';
    }
    if (draft.personal.email && !isValidEmail(draft.personal.email)) {
      errors['personal.email'] = 'Invalid email.';
    }
    if (draft.personal.phone && !isValidPhone(draft.personal.phone)) {
      errors['personal.phone'] = 'Enter a valid phone number.';
    }
    // DOB sanity: each field digits-only with sensible ranges.
    const day = parseInt(draft.personal.dob_day, 10);
    const month = parseInt(draft.personal.dob_month, 10);
    const year = parseInt(draft.personal.dob_year, 10);
    if (draft.personal.dob_day && (!Number.isFinite(day) || day < 1 || day > 31)) {
      errors['personal.dob_day'] = 'Day must be 1–31.';
    }
    if (draft.personal.dob_month && (!Number.isFinite(month) || month < 1 || month > 12)) {
      errors['personal.dob_month'] = 'Month must be 1–12.';
    }
    if (
      draft.personal.dob_year &&
      (!Number.isFinite(year) || year < 1900 || year > new Date().getFullYear())
    ) {
      errors['personal.dob_year'] = 'Enter a 4-digit year.';
    }
  }
  return errors;
}

function readPath(
  path: string,
  draft: ConsultationDraft,
): string | number | boolean | string[] | null | undefined {
  const [section, field] = path.split('.') as [keyof ConsultationDraft, string];
  const sec = draft[section] as unknown as Record<string, unknown>;
  if (!sec || typeof sec !== 'object') return undefined;
  const v = sec[field];
  if (
    v === null ||
    v === undefined ||
    typeof v === 'string' ||
    typeof v === 'number' ||
    typeof v === 'boolean' ||
    Array.isArray(v)
  ) {
    return v as string | number | boolean | string[] | null | undefined;
  }
  return undefined;
}

export default function Consultation({ currentStep }: ConsultationPageProps) {
  setBaseTitle('Free Consultation');
  const navigate = useNavigate();

  const clientSessionId = useMemo(() => getOrCreateClientSessionId(), []);
  const [draft, setDraft] = useState<ConsultationDraft>(() => createEmptyDraft());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitState, setSubmitState] = useState<{
    submissionId: string | null;
    receivedAt: string | null;
    error: string | null;
  }>({ submissionId: null, receivedAt: null, error: null });
  const [pendingDraftEnvelope, setPendingDraftEnvelope] = useState<StoredDraftEnvelope | null>(
    null,
  );
  const [resumeDecision, setResumeDecision] = useState<'pending' | 'resumed' | 'fresh'>('pending');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [showValidationBanner, setShowValidationBanner] = useState(false);

  const createConsultation = useCreateConsultation();
  const isSubmitting = createConsultation.isPending;

  const debouncedSaverRef = useRef(createDebouncedSaver((env) => saveDraft(env)));

  // On mount: try to resume an existing draft (MD §8).
  useEffect(() => {
    const env = loadDraft(clientSessionId);
    if (env) {
      setPendingDraftEnvelope(env);
    } else {
      setResumeDecision('fresh');
    }
    emitTelemetry({
      event: 'consultation_form_view',
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      method: 'GET',
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Default signature.date to today on Step 6 mount when empty.
  useEffect(() => {
    if (currentStep === 'step-6' && !draft.signature.date) {
      setDraft((prev) => ({ ...prev, signature: { ...prev.signature, date: todayIsoDate() } }));
    }
  }, [currentStep, draft.signature.date]);

  // Telemetry: emit on step change.
  const lastStepRef = useRef<ConsultationStepId | null>(null);
  useEffect(() => {
    if (lastStepRef.current === currentStep) return;
    const from = lastStepRef.current;
    lastStepRef.current = currentStep;
    emitTelemetry({
      event: 'consultation_step_viewed',
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      method: 'GET',
      props: { step: currentStep, from: from || undefined },
    });
  }, [currentStep]);

  // Auto-save effect (MD §8: debounced 500ms on every field change).
  useEffect(() => {
    if (resumeDecision === 'pending') return;
    const savedAt = new Date().toISOString();
    const env: StoredDraftEnvelope = {
      client_session_id: clientSessionId,
      draft,
      saved_at: savedAt,
      schema_version: 1,
    };
    debouncedSaverRef.current.schedule(env);
    setLastSavedAt(savedAt);
  }, [draft, clientSessionId, resumeDecision]);

  // On unmount: flush pending save.
  useEffect(() => {
    const saver = debouncedSaverRef.current;
    return () => saver.flush();
  }, []);

  // Deep-link guard: redirect to earliest incomplete step when the user
  // jumps to a future step with unmet prerequisites (MD §7).
  useEffect(() => {
    if (resumeDecision === 'pending') return;
    if (currentStep === 'step-1') return;
    // step-5 is unreachable when females_only.applicable !== true.
    if (currentStep === 'step-5' && !isRevealed('females_only.step', draft)) {
      void navigate({ to: '/consultation/$step', params: { step: 'step-4' }, replace: true });
      return;
    }
    const earliest = earliestIncompleteStep(draft);
    const order = CONSULTATION_STEP_IDS;
    if (order.indexOf(currentStep) > order.indexOf(earliest)) {
      void navigate({ to: '/consultation/$step', params: { step: earliest }, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, resumeDecision]);

  function handleDraftChange(next: ConsultationDraft) {
    setDraft((prev) => applyRevealClears(prev, next));
    // Clear field errors that are now satisfied.
    setErrors((prev) => {
      const cleared: FieldErrors = { ...prev };
      for (const key of Object.keys(cleared)) {
        const v = readPath(key, next);
        if (typeof v === 'string' && v.trim()) delete cleared[key];
        else if (typeof v === 'boolean' && v === true && key === 'signature.attested')
          delete cleared[key];
        else if (typeof v === 'boolean' && key !== 'signature.attested') delete cleared[key];
      }
      return cleared;
    });
  }

  function handleResumeYes() {
    if (!pendingDraftEnvelope) return;
    setDraft(pendingDraftEnvelope.draft);
    setResumeDecision('resumed');
    setPendingDraftEnvelope(null);
  }

  function handleResumeNo() {
    clearDraft(clientSessionId);
    setPendingDraftEnvelope(null);
    setResumeDecision('fresh');
  }

  function goToStep(step: ConsultationStepId) {
    debouncedSaverRef.current.flush();
    void navigate({ to: '/consultation/$step', params: { step } });
  }

  function handleNext() {
    const stepErrors = validateStepFields(currentStep, draft);
    if (Object.keys(stepErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...stepErrors }));
      return;
    }
    setErrors({});
    setShowValidationBanner(false);
    const order = CONSULTATION_STEP_IDS;
    const idx = order.indexOf(currentStep);
    let nextIdx = idx + 1;
    // Skip step-5 seamlessly when applicable !== true.
    while (order[nextIdx] === 'step-5' && !isRevealed('females_only.step', draft)) {
      nextIdx += 1;
    }
    if (nextIdx >= order.length) return;
    const next = order[nextIdx];
    emitTelemetry({
      event: 'consultation_step_advance',
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      method: 'GET',
      props: { from: currentStep, to: next },
    });
    goToStep(next);
    void idx;
  }

  function handleBack() {
    const order = CONSULTATION_STEP_IDS;
    let prevIdx = order.indexOf(currentStep) - 1;
    while (order[prevIdx] === 'step-5' && !isRevealed('females_only.step', draft)) {
      prevIdx -= 1;
    }
    if (prevIdx < 0) return;
    goToStep(order[prevIdx]);
  }

  function handleSubmit() {
    // Re-validate the WHOLE form (MD §7).
    const allErrors: FieldErrors = {};
    for (const stepId of CONSULTATION_STEP_IDS) {
      if (stepId === 'step-5' && !isRevealed('females_only.step', draft)) continue;
      Object.assign(allErrors, validateStepFields(stepId, draft));
    }
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      // Jump to earliest step with an error.
      for (const stepId of CONSULTATION_STEP_IDS) {
        if (stepId === 'step-5' && !isRevealed('females_only.step', draft)) continue;
        if (!isStepComplete(stepId, draft)) {
          goToStep(stepId);
          break;
        }
      }
      setShowValidationBanner(true);
      setSubmitState((s) => ({ ...s, error: 'Please fix the errors before submitting.' }));
      return;
    }
    setShowValidationBanner(false);
    setErrors({});
    setSubmitState((s) => ({ ...s, error: null }));
    emitTelemetry({
      event: 'consultation_submit_clicked',
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      method: 'POST',
    });

    const submittedAt = new Date().toISOString();
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
    const body: ConsultationSubmitRequest = {
      form_id: CONSULTATION_FORM_ID,
      submitted_at: submittedAt,
      client_session_id: clientSessionId,
      payload: flattenDraftForSubmit(draft),
      signatures: [
        {
          field: 'signature.client',
          method: 'typed',
          typed_name: draft.signature.print_name.trim(),
          attested: true,
          signed_at: submittedAt,
          user_agent: userAgent,
        },
      ],
      attachments: [],
    };
    const idempotencyKey = generateUuid();

    createConsultation.mutate(
      { body, idempotencyKey, clientSessionId },
      {
        onSuccess: (result) => {
          clearDraft(clientSessionId);
          debouncedSaverRef.current.cancel();
          setSubmitState({
            submissionId: result.submission_id,
            receivedAt: result.received_at,
            error: null,
          });
        },
        onError: (err: unknown) => {
          const msg =
            err instanceof Error ? err.message : 'Could not send your request. Please try again.';
          setSubmitState((s) => ({ ...s, error: msg }));
          emitTelemetry({
            event: 'consultation_submit_failed',
            route: typeof window !== 'undefined' ? window.location.pathname : undefined,
            path: typeof window !== 'undefined' ? window.location.pathname : undefined,
            method: 'POST',
            props: { reason: msg.slice(0, 80) },
          });
        },
      },
    );
  }

  // ---- Render ---------------------------------------------------------

  if (submitState.submissionId) {
    return (
      <Section className="hero v7 hero-pad-bottom-xl" aria-label="Consultation submitted">
        <Container>
          <div className="inner-container _580px center">
            <SuccessPanel
              firstName={firstNameOf(draft.personal.client_name)}
              submissionId={submitState.submissionId}
              receivedAt={submitState.receivedAt || undefined}
            />
          </div>
        </Container>
      </Section>
    );
  }

  // Resume prompt blocks the wizard until the user picks (MD §8).
  if (resumeDecision === 'pending' && pendingDraftEnvelope) {
    return (
      <Section className="hero v7 hero-pad-bottom-xl" aria-label="Resume saved consultation">
        <Container>
          <div className="inner-container _580px center">
            <div
              className="card consultation-resume-card"
              role="dialog"
              aria-labelledby="consultation-resume-heading"
            >
              <h1 id="consultation-resume-heading" className="display-9">
                Pick up where you left off?
              </h1>
              <p className="paragraph-medium">
                We found a draft you started {formatRelativeAgo(pendingDraftEnvelope.saved_at)}.
                Continue, or start fresh.
              </p>
              <div className="consultation-resume-actions">
                <button
                  type="button"
                  className="button-primary w-button"
                  onClick={handleResumeYes}
                  data-cta-id="consultation-resume-yes"
                >
                  Continue
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={handleResumeNo}
                  data-cta-id="consultation-resume-no"
                >
                  Start fresh
                </button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  const stepIndex = CONSULTATION_STEP_IDS.indexOf(currentStep);
  const isStep1 = currentStep === 'step-1';

  return (
    <Section className="hero v7 hero-pad-bottom-xl" aria-label="Consultation form">
      <Container className="consultation-container">
        <header className="consultation-positioning">
          <h1 className="display-9">Your Free Mukyala Skin Consultation</h1>
          {isStep1 ? (
            <>
              <p className="paragraph-medium">
                Tell us about your skin. Within {CONSULTATION_SLA_BUSINESS_DAYS} business days, one
                of our licensed aestheticians will send you a personalized skin assessment and
                recommended treatment plan. No cost. No obligation to book.
              </p>
              <ul className="consultation-trust-row" aria-label="Why Mukyala">
                <li className="consultation-trust-item">
                  <span className="consultation-trust-icon" aria-hidden="true">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.19 7.54L5.37 9.72L10.81 4.28"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div className="consultation-trust-text">
                    <span className="consultation-trust-title">Licensed aestheticians</span>
                    <span className="consultation-trust-sub">
                      Reviewed by board-licensed practitioners on staff.
                    </span>
                  </div>
                </li>
                <li className="consultation-trust-item">
                  <span className="consultation-trust-icon" aria-hidden="true">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.19 7.54L5.37 9.72L10.81 4.28"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div className="consultation-trust-text">
                    <span className="consultation-trust-title">100% private</span>
                    <span className="consultation-trust-sub">
                      Your information stays with Mukyala. Never sold, never shared.
                    </span>
                  </div>
                </li>
                <li className="consultation-trust-item">
                  <span className="consultation-trust-icon" aria-hidden="true">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.19 7.54L5.37 9.72L10.81 4.28"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div className="consultation-trust-text">
                    <span className="consultation-trust-title">Free — no card required</span>
                    <span className="consultation-trust-sub">
                      Consultation is free with no obligation to book.
                    </span>
                  </div>
                </li>
              </ul>
            </>
          ) : null}
        </header>

        <ProgressIndicator currentStep={currentStep} draft={draft} />

        {showValidationBanner ? (
          <div
            className="consultation-validation-banner paragraph-medium"
            role="alert"
            aria-live="polite"
          >
            Please fix the highlighted field before continuing.
          </div>
        ) : null}

        <div className="card consultation-form-card consultation-form">
          {currentStep === 'step-1' ? (
            <Step1Personal draft={draft} onChange={handleDraftChange} errors={errors} />
          ) : null}
          {currentStep === 'step-2' ? (
            <Step2Lifestyle draft={draft} onChange={handleDraftChange} errors={errors} />
          ) : null}
          {currentStep === 'step-3' ? (
            <Step3SkinConcerns draft={draft} onChange={handleDraftChange} errors={errors} />
          ) : null}
          {currentStep === 'step-4' ? (
            <Step4Health draft={draft} onChange={handleDraftChange} errors={errors} />
          ) : null}
          {currentStep === 'step-5' ? (
            <Step5FemalesOnly draft={draft} onChange={handleDraftChange} errors={errors} />
          ) : null}
          {currentStep === 'step-6' ? (
            <Step6ReviewSign
              draft={draft}
              onChange={handleDraftChange}
              errors={errors}
              onSubmit={handleSubmit}
              onEditStep={goToStep}
              isSubmitting={isSubmitting}
              submitError={submitState.error}
            />
          ) : null}
        </div>

        <div className="consultation-nav">
          <button
            type="button"
            className="button-secondary"
            onClick={handleBack}
            disabled={stepIndex === 0}
            data-cta-id="consultation-back"
          >
            Back
          </button>
          {lastSavedAt ? (
            <p
              className="paragraph-small consultation-nav-status"
              aria-live="polite"
              data-testid="consultation-autosave-indicator"
            >
              Saved {formatRelativeAgo(lastSavedAt)}
            </p>
          ) : null}
          {currentStep !== 'step-6' ? (
            <button
              type="button"
              className="button-primary w-button"
              onClick={handleNext}
              data-cta-id="consultation-next"
            >
              Next
            </button>
          ) : (
            <span aria-hidden="true" />
          )}
        </div>
      </Container>
    </Section>
  );
}

interface ProgressIndicatorProps {
  currentStep: ConsultationStepId;
  draft: ConsultationDraft;
}

function ProgressIndicator({ currentStep, draft }: ProgressIndicatorProps) {
  const femalesApplicable = isRevealed('females_only.step', draft);
  const visibleSteps = CONSULTATION_STEP_IDS.filter(
    (stepId) => stepId !== 'step-5' || femalesApplicable,
  );
  const total = visibleSteps.length;
  const currentIndex = Math.max(0, visibleSteps.indexOf(currentStep));
  const position = currentIndex + 1;
  const fillPercent = Math.round((position / total) * 100);
  const currentLabel = CONSULTATION_STEP_TITLES[currentStep];
  return (
    <nav className="consultation-progress" aria-label="Consultation progress" aria-current="step">
      <p className="consultation-progress-counter paragraph-small">
        Step {position} of {total}
      </p>
      <p className="consultation-progress-label display-7 semi-bold">{currentLabel}</p>
      <div
        className="consultation-progress-bar"
        role="progressbar"
        aria-valuenow={position}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuetext={`Step ${position} of ${total}: ${currentLabel}`}
      >
        <div className="consultation-progress-bar-fill" style={{ width: `${fillPercent}%` }} />
      </div>
    </nav>
  );
}
