import { setBaseTitle } from '@app/seo';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import React, { useMemo, useState } from 'react';
import { OPENING_HOURS, SPA_TIMEZONE } from '../constants/hours';
import { services } from '../data/services';
import { getSlugFromHref } from '../hooks/products';

type ReservationForm = {
  name: string;
  phone: string;
  email?: string;
  serviceSlug: string;
  dateTime: string; // from datetime-local
};

const initialForm: ReservationForm = {
  name: '',
  phone: '',
  email: '',
  serviceSlug: '',
  dateTime: '',
};

export default function Reservation() {
  setBaseTitle('Reservation');
  const [form, setForm] = useState<ReservationForm>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<keyof ReservationForm, string>>({
    name: '',
    phone: '',
    email: '',
    serviceSlug: '',
    dateTime: '',
  });

  function formatLocalInputValue(d: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
      d.getMinutes(),
    )}`;
  }

  const minDateTime = useMemo(() => formatLocalInputValue(new Date()), []);

  const isValid = useMemo(() => {
    const hasName = !!form.name.trim();
    const hasPhone = !!form.phone.trim();
    const hasService = !!form.serviceSlug.trim();
    const hasDateTime = !!form.dateTime.trim();
    const emailOk = !form.email || /.+@.+\..+/.test(form.email);
    // Opening hours (basic client-side check using selected local time)
    let withinHours = true;
    if (form.dateTime) {
      const hh = Number(form.dateTime.slice(11, 13));
      withinHours = hh >= OPENING_HOURS.openHour && hh < OPENING_HOURS.closeHour;
    }
    return hasName && hasPhone && hasService && hasDateTime && emailOk && withinHours;
  }, [form]);

  function handleChange<K extends keyof ReservationForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (value.trim()) setErrors((e) => ({ ...e, [key]: '' }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: typeof errors = { ...errors };
    (Object.keys(form) as (keyof ReservationForm)[]).forEach((k) => {
      const v = (form[k] ?? '') as string;
      if (k === 'email') {
        if (v && !/.+@.+\..+/.test(v)) nextErrors[k] = 'Invalid email';
      } else if (!v || !v.trim()) {
        nextErrors[k] = 'Required';
      }
    });
    // Additional checks: future datetime and opening hours
    if (form.dateTime) {
      const selected = new Date(form.dateTime);
      const now = new Date();
      if (isNaN(selected.getTime()) || selected < now) {
        nextErrors.dateTime = 'Please select a future date and time';
      } else {
        const hh = Number(form.dateTime.slice(11, 13));
        if (hh < OPENING_HOURS.openHour || hh >= OPENING_HOURS.closeHour) {
          nextErrors.dateTime = `Select a time between ${OPENING_HOURS.openHour}:00 and ${OPENING_HOURS.closeHour}:00 (${SPA_TIMEZONE.split('/')[1].replace('_', ' ')})`;
        }
      }
    }
    setErrors(nextErrors);
    if (!isValid) return;
    try {
      const payload = { ...form, at: new Date().toISOString() };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('reservation:v1:last', JSON.stringify(payload));
      }
    } catch {
      // ignore persistence errors
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="section hero v7">
        <Container>
          <div className="inner-container _580px center">
            <div className="card thank-you-message reservation">
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
                <div>
                  <label htmlFor="name" className="visually-hidden">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    className="input-line medium w-input"
                    placeholder="Enter your name"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && (
                    <span className="form-error" role="alert">
                      {errors.name}
                    </span>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="visually-hidden">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="input-line medium w-input"
                    placeholder="example@youremail.com (optional)"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <span className="form-error" role="alert">
                      {errors.email}
                    </span>
                  )}
                </div>
                <div>
                  <label htmlFor="phone" className="visually-hidden">
                    Phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    className="input-line medium w-input"
                    placeholder="(123) 456 - 7890"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    aria-invalid={!!errors.phone}
                  />
                  {errors.phone && (
                    <span className="form-error" role="alert">
                      {errors.phone}
                    </span>
                  )}
                </div>
                <div>
                  <label htmlFor="serviceSlug" className="visually-hidden">
                    Service
                  </label>
                  <select
                    id="serviceSlug"
                    name="serviceSlug"
                    className="input-line medium w-input"
                    value={form.serviceSlug}
                    onChange={(e) => handleChange('serviceSlug', e.target.value)}
                    aria-invalid={!!errors.serviceSlug}
                  >
                    <option value="">Select service</option>
                    {services.map((s) => {
                      const slug = getSlugFromHref(s.href);
                      return (
                        <option key={slug} value={slug}>
                          {s.title}
                        </option>
                      );
                    })}
                  </select>
                  {errors.serviceSlug && (
                    <span className="form-error" role="alert">
                      {errors.serviceSlug}
                    </span>
                  )}
                </div>
                <div>
                  <label htmlFor="dateTime" className="visually-hidden">
                    Date and time
                  </label>
                  <input
                    id="dateTime"
                    name="dateTime"
                    type="datetime-local"
                    className="input-line medium w-input"
                    min={minDateTime}
                    value={form.dateTime}
                    onChange={(e) => handleChange('dateTime', e.target.value)}
                    aria-invalid={!!errors.dateTime}
                  />
                  {errors.dateTime && (
                    <span className="form-error" role="alert">
                      {errors.dateTime}
                    </span>
                  )}
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
