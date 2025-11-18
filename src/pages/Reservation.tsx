import { setBaseTitle } from '@app/seo';
import { useAvailabilityQuery } from '@hooks/availability.api';
import { useServicesQuery, useLocationsQuery } from '@hooks/catalog.api';
import { useCreateReservation } from '@hooks/reservations.api';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import DateTimeField from '@shared/ui/forms/DateTimeField';
import FormField from '@shared/ui/forms/FormField';
import InputField from '@shared/ui/forms/InputField';
import PhoneInput from '@shared/ui/forms/PhoneInput';
import SelectField from '@shared/ui/forms/SelectField';
import React, { useMemo, useState } from 'react';
import { OPENING_HOURS, SPA_TIMEZONE } from '../constants/hours';
import type { ReservationRequest } from '../types/reservation';
import { formatUSPhone } from '../utils/phone';
import { getSlugFromHref } from '../utils/slug';
import { parseLocalDateTimeString, zonedTimeToUtc } from '../utils/tz';
import { isValidEmail, isValidName, isValidPhone, normalizePhoneDigits } from '../utils/validation';

type ReservationForm = {
  name: string;
  phone: string;
  email: string;
  serviceSlug: string;
  dateTime: string; // from datetime-local
};

type ReservationErrorKey = keyof ReservationForm | 'consent';

const defaultServiceSlug = '';

const initialForm: ReservationForm = {
  name: '',
  phone: '',
  email: '',
  serviceSlug: defaultServiceSlug,
  dateTime: '',
};

export default function Reservation() {
  setBaseTitle('Reservation');
  const [form, setForm] = useState<ReservationForm>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<ReservationErrorKey, string>>({
    name: '',
    phone: '',
    email: '',
    serviceSlug: '',
    dateTime: '',
    consent: '',
  });
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const { data: services, isLoading: servicesLoading } = useServicesQuery();
  const { data: locations } = useLocationsQuery();
  const createReservation = useCreateReservation();
  const selectedDate = form.dateTime ? form.dateTime.slice(0, 10) : undefined;
  const availability = useAvailabilityQuery({
    locationId: locations?.[0]?.id,
    serviceSlug: form.serviceSlug || undefined,
    date: selectedDate,
  });

  function formatLocalInputValue(d: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
      d.getMinutes(),
    )}`;
  }

  const minDateTime = useMemo(() => formatLocalInputValue(new Date()), []);

  // No default date/time suggestion; user must choose explicitly

  const isValid = useMemo(() => {
    const hasName = isValidName(form.name);
    const hasPhone = !form.phone || isValidPhone(form.phone);
    const hasService = !!form.serviceSlug.trim();
    const hasDateTime = !!form.dateTime.trim();
    const emailOk = isValidEmail(form.email);
    return hasName && hasPhone && hasService && hasDateTime && emailOk && consentAccepted;
  }, [form, consentAccepted]);

  function handleChange<K extends keyof ReservationForm>(key: K, value: string) {
    if (key === 'phone') {
      // Allow only digits; cap to US-style 11 digits (with leading 1)
      const digits = value.replace(/\D/g, '').slice(0, 11);
      const formatted = formatUSPhone(digits);
      setForm((f) => ({ ...f, phone: formatted }));
    } else {
      setForm((f) => ({ ...f, [key]: value }));
    }
    if (value.trim()) setErrors((e) => ({ ...e, [key]: '' }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: typeof errors = {
      name: '',
      phone: '',
      email: '',
      serviceSlug: '',
      dateTime: '',
      consent: '',
    };
    (Object.keys(form) as (keyof ReservationForm)[]).forEach((k) => {
      const v = (form[k] ?? '') as string;
      if (!v || !v.trim()) {
        nextErrors[k] = 'Required';
      }
    });
    // Specific field validations
    if (form.name && !isValidName(form.name))
      nextErrors.name = 'Please enter your full name (2–80 chars)';
    if (form.phone && !isValidPhone(form.phone)) nextErrors.phone = 'Enter a valid phone number';
    if (form.email && !isValidEmail(form.email)) nextErrors.email = 'Invalid email';
    // Additional checks: treat the selected value as Pacific Time and verify
    const parts = form.dateTime ? parseLocalDateTimeString(form.dateTime) : null;
    if (parts) {
      const selectedUtc = zonedTimeToUtc(parts, SPA_TIMEZONE);
      const nowUtc = new Date();
      if (isNaN(selectedUtc.getTime()) || selectedUtc.getTime() <= nowUtc.getTime()) {
        nextErrors.dateTime = 'Please select a future date and time';
      }
      const hh = parts.hour;
      if (hh < OPENING_HOURS.openHour || hh >= OPENING_HOURS.closeHour) {
        nextErrors.dateTime = `Select a time between ${OPENING_HOURS.openHour}:00 and ${OPENING_HOURS.closeHour}:00 (Pacific Time)`;
      }
    }
    if (!consentAccepted) {
      nextErrors.consent = 'Please confirm we may contact you about this request.';
    }
    // If required/email checks failed, stop early
    if (!isValid) {
      setErrors(nextErrors);
      return;
    }
    // After additional checks, block submit if any error present
    const hasAnyError = Object.values(nextErrors).some(Boolean);
    setErrors(nextErrors);
    if (hasAnyError) return;
    // Compute UTC startAt from local PT date/time
    const dtParts = parseLocalDateTimeString(form.dateTime)!;
    const selectedUtc = zonedTimeToUtc(dtParts, SPA_TIMEZONE).toISOString();

    // Optional availability check: if we have locations and loaded availability, block if not in slots
    const locationId = locations?.[0]?.id;
    if (!locationId) {
      setErrors((e) => ({ ...e, dateTime: 'Please try again later (no locations available)' }));
      return;
    }

    // Persist latest attempt
    try {
      const payload: ReservationRequest = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        phoneNormalized: normalizePhoneDigits(form.phone),
        email: form.email.trim(),
        serviceSlug: form.serviceSlug,
        dateTime: form.dateTime,
        at: new Date().toISOString(),
      };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('reservation:v1:last', JSON.stringify(payload));
      }
    } catch (err) {
      // ignore localStorage errors (quota/disabled/private mode)
      void err;
    }

    // If availability is loaded, ensure selectedUtc is an offered slot
    if (availability.data && !availability.data.slots.includes(selectedUtc)) {
      setErrors((e) => ({ ...e, dateTime: 'Selected time is no longer available' }));
      return;
    }

    createReservation.mutate(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone ? `+1${normalizePhoneDigits(form.phone)}` : undefined,
        serviceSlug: form.serviceSlug,
        locationId,
        startAt: selectedUtc,
        timezone: SPA_TIMEZONE,
      },
      {
        onSuccess: () => setSubmitted(true),
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to create reservation';
          setErrors((e) => ({ ...e, dateTime: msg }));
        },
      },
    );
  }

  if (submitted) {
    return (
      <main className="section hero v7">
        <Container>
          <div className="inner-container _580px center">
            <div className="card thank-you-message reservation" role="status" aria-live="polite">
              <div className="mg-top-24px">
                <div className="text-neutral-800">
                  <h1 className="display-5 semi-bold">Thank you! We’ll get back to you soon</h1>
                </div>
              </div>
              <div className="mg-top-8px">
                <p className="paragraph-medium">
                  We’ve received your request and will follow up to confirm your appointment.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <Section className="hero v7">
      <Container className="reservation-container">
        <div className="card rservation-form-card reservation-form">
          <form onSubmit={handleSubmit} aria-label="Reservation form">
            <h1 className="display-9">Book an appointment</h1>
            <div className="mg-top-26px">
              <div className="reservation-grid">
                <FormField id="name" label="Name" error={errors.name}>
                  <InputField
                    name="name"
                    placeholder="Enter your name"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                </FormField>

                <FormField id="email" label="Email" error={errors.email}>
                  <InputField
                    name="email"
                    type="email"
                    placeholder="example@youremail.com"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </FormField>

                <FormField id="phone" label="Phone (optional)" error={errors.phone}>
                  <PhoneInput
                    name="phone"
                    placeholder="(123) 456 - 7890"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </FormField>
                {form.phone.trim() && (
                  <div
                    className="field-span-2"
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <input id="smsConsent" name="smsConsent" type="checkbox" />
                    <label htmlFor="smsConsent">
                      I consent to receive SMS updates about my appointment.
                    </label>
                  </div>
                )}

                <FormField id="serviceSlug" label="Service" error={errors.serviceSlug}>
                  <SelectField
                    name="serviceSlug"
                    value={form.serviceSlug}
                    onChange={(e) => handleChange('serviceSlug', e.target.value)}
                  >
                    <option value="">Select service</option>
                    {servicesLoading && (
                      <option value="" disabled>
                        Loading…
                      </option>
                    )}
                    {!servicesLoading &&
                      (services || []).map((s) => {
                        const slug = getSlugFromHref(s.href);
                        return (
                          <option key={slug} value={slug}>
                            {s.title}
                          </option>
                        );
                      })}
                  </SelectField>
                </FormField>

                <FormField
                  id="dateTime"
                  label="Date and time"
                  error={errors.dateTime}
                  helpText="All times are Pacific Time."
                  helpId="dt-help"
                >
                  <DateTimeField
                    name="dateTime"
                    min={minDateTime}
                    value={form.dateTime}
                    onChange={(e) => handleChange('dateTime', e.target.value)}
                  />
                </FormField>
                <div
                  className="field-span-2"
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  <label className="paragraph-small" style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={consentAccepted}
                      onChange={(e) => {
                        setConsentAccepted(e.target.checked);
                        if (e.target.checked) {
                          setErrors((prev) => ({ ...prev, consent: '' }));
                        }
                      }}
                    />
                    <span>
                      I consent to Mukyala storing my details to coordinate this reservation and to
                      receive transactional emails/SMS about it.
                    </span>
                  </label>
                  {errors.consent && (
                    <span className="paragraph-small" role="alert" style={{ color: '#b91c1c' }}>
                      {errors.consent}
                    </span>
                  )}
                  <label className="paragraph-small" style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={marketingOptIn}
                      onChange={(e) => setMarketingOptIn(e.target.checked)}
                    />
                    <span>
                      Yes, email me Mukyala offers. You’ll receive a double opt-in email before any
                      marketing content is sent.
                    </span>
                  </label>
                  <p className="paragraph-small" style={{ margin: 0 }}>
                    By submitting you agree to our{' '}
                    <a className="link" href="/terms">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a className="link" href="/privacy">
                      Privacy Policy
                    </a>
                    .
                  </p>
                </div>
                <div className="field-span-2">
                  <button type="submit" className="button-primary w-button">
                    Make a Reservation
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </Container>
    </Section>
  );
}
