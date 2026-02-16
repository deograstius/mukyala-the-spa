import { setBaseTitle } from '@app/seo';
import { useAvailabilityQuery } from '@hooks/availability.api';
import { useServicesQuery, useLocationsQuery } from '@hooks/catalog.api';
import { useCreateReservation } from '@hooks/reservations.api';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import FormField from '@shared/ui/forms/FormField';
import InputField from '@shared/ui/forms/InputField';
import PhoneInput from '@shared/ui/forms/PhoneInput';
import SelectField from '@shared/ui/forms/SelectField';
import React, { useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { OPENING_HOURS, SPA_TIMEZONE } from '../constants/hours';
import type { ReservationRequest } from '../types/reservation';
import { formatUSPhone } from '../utils/phone';
import { getSlugFromHref } from '../utils/slug';
import { zonedTimeToUtc } from '../utils/tz';
import { isValidEmail, isValidName, isValidPhone, normalizePhoneDigits } from '../utils/validation';

type ReservationForm = {
  name: string;
  phone: string;
  email: string;
  serviceSlug: string;
  date: string; // YYYY-MM-DD
  startAt: string; // UTC ISO timestamp
};

type ReservationErrorKey = keyof ReservationForm;

const defaultServiceSlug = '';

const initialForm: ReservationForm = {
  name: '',
  phone: '',
  email: '',
  serviceSlug: defaultServiceSlug,
  date: '',
  startAt: '',
};

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatHourLabel(hour: number): string {
  const h12 = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h12}:00 ${ampm}`;
}

type FieldsetFieldProps = {
  legend: string;
  className?: string;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
};

function FieldsetField({ legend, className, error, helpText, children }: FieldsetFieldProps) {
  const baseId = legend.toLowerCase().replace(/\s+/g, '-');
  const helpId = helpText ? `${baseId}-help` : undefined;
  const errorId = error ? `${baseId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <fieldset className={className} aria-describedby={describedBy}>
      <legend className="mg-bottom-8px">{legend}</legend>
      {children}
      {helpId && helpText ? (
        <div id={helpId} className="paragraph-small">
          {helpText}
        </div>
      ) : null}
      {error ? (
        <span id={errorId} className="form-error" role="alert">
          {error}
        </span>
      ) : null}
    </fieldset>
  );
}

export default function Reservation() {
  setBaseTitle('Reservation');
  const [form, setForm] = useState<ReservationForm>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<ReservationErrorKey, string>>({
    name: '',
    phone: '',
    email: '',
    serviceSlug: '',
    date: '',
    startAt: '',
  });
  const { data: services, isLoading: servicesLoading } = useServicesQuery();
  const { data: locations } = useLocationsQuery();
  const createReservation = useCreateReservation();
  const selectedDate = form.date ? form.date : undefined;
  const availability = useAvailabilityQuery({
    locationId: locations?.[0]?.id,
    serviceSlug: form.serviceSlug || undefined,
    date: selectedDate,
  });

  const selectedDateObj = useMemo(
    () => (form.date ? new Date(`${form.date}T12:00:00`) : undefined),
    [form.date],
  );

  const isValid = useMemo(() => {
    const hasName = isValidName(form.name);
    const hasPhone = !form.phone || isValidPhone(form.phone);
    const hasService = !!form.serviceSlug.trim();
    const hasDate = !!form.date.trim();
    const hasStartAt = !!form.startAt.trim();
    const emailOk = isValidEmail(form.email);
    return hasName && hasPhone && hasService && hasDate && hasStartAt && emailOk;
  }, [form]);

  function handleChange<K extends keyof ReservationForm>(key: K, value: string) {
    if (key === 'phone') {
      // Allow only digits; cap to US-style 11 digits (with leading 1)
      const digits = value.replace(/\D/g, '').slice(0, 11);
      const formatted = formatUSPhone(digits);
      setForm((f) => ({ ...f, phone: formatted }));
    } else {
      setForm((f) => {
        if (key === 'serviceSlug' || key === 'date') return { ...f, [key]: value, startAt: '' };
        return { ...f, [key]: value };
      });
    }
    if (value.trim()) setErrors((e) => ({ ...e, [key]: '' }));
  }

  const availabilitySlotsSet = useMemo(
    () => new Set(availability.data?.slots ?? []),
    [availability.data?.slots],
  );

  const timeSlots = useMemo(() => {
    if (!form.date) return [];
    const [y, m, d] = form.date.split('-').map((n) => parseInt(n, 10));
    return Array.from({ length: 24 }, (_, hour) => {
      const withinWorkingHours = hour >= OPENING_HOURS.openHour && hour < OPENING_HOURS.closeHour;
      const utc = zonedTimeToUtc(
        { year: y, month: m, day: d, hour, minute: 0 },
        SPA_TIMEZONE,
      ).toISOString();
      const available = withinWorkingHours && availabilitySlotsSet.has(utc);
      return {
        hour,
        label: formatHourLabel(hour),
        utc,
        withinWorkingHours,
        disabled:
          !withinWorkingHours ||
          !form.serviceSlug ||
          availability.isLoading ||
          availability.isError ||
          !available,
      };
    });
  }, [
    form.date,
    form.serviceSlug,
    availability.isLoading,
    availability.isError,
    availabilitySlotsSet,
  ]);

  function handleSelectDate(d: Date | undefined) {
    if (!d) {
      handleChange('date', '');
      return;
    }
    handleChange('date', formatYmd(d));
  }

  function handleSelectTimeSlot(utc: string) {
    setForm((f) => ({ ...f, startAt: utc }));
    setErrors((e) => ({ ...e, startAt: '' }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: typeof errors = {
      name: '',
      phone: '',
      email: '',
      serviceSlug: '',
      date: '',
      startAt: '',
    };
    (Object.keys(form) as (keyof ReservationForm)[]).forEach((k) => {
      if (k === 'phone') return; // optional
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
    // If required/email checks failed, stop early
    if (!isValid) {
      setErrors(nextErrors);
      return;
    }
    // If availability is loaded, ensure selected startAt is still available
    if (availability.data && !availabilitySlotsSet.has(form.startAt)) {
      nextErrors.startAt = 'Selected time is no longer available';
    }
    // After additional checks, block submit if any error present
    const hasAnyError = Object.values(nextErrors).some(Boolean);
    setErrors(nextErrors);
    if (hasAnyError) return;

    const locationId = locations?.[0]?.id;
    if (!locationId) {
      setErrors((e) => ({ ...e, startAt: 'Please try again later (no locations available)' }));
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
        date: form.date,
        startAt: form.startAt,
        timezone: SPA_TIMEZONE,
        at: new Date().toISOString(),
      };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('reservation:v1:last', JSON.stringify(payload));
      }
    } catch (err) {
      // ignore localStorage errors (quota/disabled/private mode)
      void err;
    }

    createReservation.mutate(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone ? `+1${normalizePhoneDigits(form.phone)}` : undefined,
        serviceSlug: form.serviceSlug,
        locationId,
        startAt: form.startAt,
        timezone: SPA_TIMEZONE,
      },
      {
        onSuccess: () => setSubmitted(true),
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to create reservation';
          setErrors((e) => ({ ...e, startAt: msg }));
        },
      },
    );
  }

  if (submitted) {
    return (
      <main className="section hero v7 hero-pad-bottom-xl">
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
    <Section className="hero v7 hero-pad-bottom-xl">
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

                <FieldsetField
                  legend="Date"
                  className="field-span-2"
                  error={errors.date}
                  helpText="Pick a day to see available times."
                >
                  <div className="reservation-daypicker">
                    <DayPicker
                      mode="single"
                      selected={selectedDateObj}
                      onSelect={handleSelectDate}
                    />
                  </div>
                </FieldsetField>

                <FieldsetField
                  legend="Time"
                  className="field-span-2"
                  error={errors.startAt}
                  helpText="All times are Pacific Time."
                >
                  <div className="reservation-timepicker">
                    {!form.serviceSlug ? (
                      <p className="paragraph-small" style={{ margin: 0 }}>
                        Select a service to load availability.
                      </p>
                    ) : !form.date ? (
                      <p className="paragraph-small" style={{ margin: 0 }}>
                        Select a date to load availability.
                      </p>
                    ) : availability.isLoading ? (
                      <p className="paragraph-small" style={{ margin: 0 }}>
                        Loading times…
                      </p>
                    ) : (
                      <div
                        className="reservation-time-slots"
                        role="group"
                        aria-label="Available times"
                      >
                        {timeSlots.map((s) => {
                          const selected = form.startAt === s.utc;
                          return (
                            <button
                              key={s.hour}
                              type="button"
                              className="reservation-time-slot"
                              disabled={s.disabled}
                              aria-pressed={selected}
                              data-selected={selected ? 'true' : undefined}
                              onClick={() => handleSelectTimeSlot(s.utc)}
                              title={
                                s.withinWorkingHours
                                  ? s.disabled
                                    ? 'Unavailable'
                                    : 'Available'
                                  : 'Closed'
                              }
                            >
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </FieldsetField>
                <div className="field-span-2">
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
