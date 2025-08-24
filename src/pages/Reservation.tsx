import { setBaseTitle } from '@app/seo';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import React, { useMemo, useState } from 'react';

type ReservationForm = {
  name: string;
  email: string;
  phone: string;
  service: string;
  dayMonth: string;
  schedule: string;
  message: string;
};

const initialForm: ReservationForm = {
  name: '',
  email: '',
  phone: '',
  service: '',
  dayMonth: '',
  schedule: '',
  message: '',
};

export default function Reservation() {
  setBaseTitle('Reservation');
  const [form, setForm] = useState<ReservationForm>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<keyof ReservationForm, string>>({
    name: '',
    email: '',
    phone: '',
    service: '',
    dayMonth: '',
    schedule: '',
    message: '',
  });

  const isValid = useMemo(() => {
    return (
      form.name.trim() &&
      form.email.trim() &&
      form.phone.trim() &&
      form.service.trim() &&
      form.dayMonth.trim() &&
      form.schedule.trim() &&
      form.message.trim()
    );
  }, [form]);

  function handleChange<K extends keyof ReservationForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (value.trim()) setErrors((e) => ({ ...e, [key]: '' }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: typeof errors = { ...errors };
    (Object.keys(form) as (keyof ReservationForm)[]).forEach((k) => {
      if (!form[k].trim()) nextErrors[k] = 'Required';
    });
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
      {/* Full-bleed container for reservation page */}
      <Container className="reservation-container">
        <div className="card rservation-form-card reservation-form">
          <form onSubmit={handleSubmit} aria-label="Reservation form">
            <h1 className="display-9">Book an appointment</h1>
            <div className="mg-top-26px">
              {/* Responsive grid: 1 column on mobile, 2 on desktop */}
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
                    placeholder="example@youremail.com"
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
                  <label htmlFor="service" className="visually-hidden">
                    Service
                  </label>
                  <input
                    id="service"
                    name="service"
                    className="input-line medium w-input"
                    placeholder="Select service"
                    value={form.service}
                    onChange={(e) => handleChange('service', e.target.value)}
                    aria-invalid={!!errors.service}
                  />
                  {errors.service && (
                    <span className="form-error" role="alert">
                      {errors.service}
                    </span>
                  )}
                </div>
                <div>
                  <label htmlFor="dayMonth" className="visually-hidden">
                    Day and month
                  </label>
                  <input
                    id="dayMonth"
                    name="dayMonth"
                    className="input-line medium w-input"
                    placeholder="Day and month"
                    value={form.dayMonth}
                    onChange={(e) => handleChange('dayMonth', e.target.value)}
                    aria-invalid={!!errors.dayMonth}
                  />
                  {errors.dayMonth && (
                    <span className="form-error" role="alert">
                      {errors.dayMonth}
                    </span>
                  )}
                </div>
                <div>
                  <label htmlFor="schedule" className="visually-hidden">
                    Schedule
                  </label>
                  <input
                    id="schedule"
                    name="schedule"
                    className="input-line medium w-input"
                    placeholder="Select schedule"
                    value={form.schedule}
                    onChange={(e) => handleChange('schedule', e.target.value)}
                    aria-invalid={!!errors.schedule}
                  />
                  {errors.schedule && (
                    <span className="form-error" role="alert">
                      {errors.schedule}
                    </span>
                  )}
                </div>
                <div className="field-span-2">
                  <label htmlFor="message" className="visually-hidden">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    className="text-area-line medium w-input"
                    placeholder="Do you have any note for us?"
                    value={form.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    aria-invalid={!!errors.message}
                  />
                  {errors.message && (
                    <span className="form-error" role="alert">
                      {errors.message}
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
