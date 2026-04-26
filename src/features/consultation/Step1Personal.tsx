/**
 * Step 1 of the consultation wizard — Personal Information.
 *
 * Source: MD §3.1 (`personal.*`) + §4 (required fields) + §7.
 * Required: client_name, home_address, phone, email, dob_day, dob_month, dob_year.
 * Optional: clinic_name, clinic_address, clinic_phone (DermaQuest artifacts).
 *
 * Reuses the existing form primitives (FormField + InputField + PhoneInput).
 * Hardcoded English copy mirrors Reservation.tsx (i18n string-table extraction
 * is a separate cross-cutting backlog item — see pm_recommendations).
 */

import DatePickerField, { type DateTriple } from '@shared/ui/forms/DatePickerField';
import FormField from '@shared/ui/forms/FormField';
import InputField from '@shared/ui/forms/InputField';
import PhoneInput from '@shared/ui/forms/PhoneInput';
import { formatUSPhone } from '@utils/phone';
import type { ConsultationDraft } from './schema';

export interface Step1PersonalProps {
  draft: ConsultationDraft;
  onChange: (next: ConsultationDraft) => void;
  errors: Partial<Record<string, string>>;
  onBlurField?: (path: string) => void;
}

export default function Step1Personal({
  draft,
  onChange,
  errors,
  onBlurField,
}: Step1PersonalProps) {
  const p = draft.personal;

  function set<K extends keyof ConsultationDraft['personal']>(
    key: K,
    value: ConsultationDraft['personal'][K],
  ) {
    onChange({ ...draft, personal: { ...p, [key]: value } });
  }

  // DOB triple -> draft sync: kept colocated so step 1 owns nothing about wire format.
  function setDob(next: DateTriple) {
    onChange({
      ...draft,
      personal: {
        ...p,
        dob_day: next.day,
        dob_month: next.month,
        dob_year: next.year,
      },
    });
  }

  function blur(path: string) {
    onBlurField?.(path);
  }

  return (
    <div className="consultation-step consultation-step-1">
      <h2 className="display-7 semi-bold">Personal information</h2>
      <FormField
        id="personal.client_name"
        label="Full name"
        required
        error={errors['personal.client_name']}
      >
        <InputField
          name="personal.client_name"
          autoComplete="name"
          placeholder="Jane Doe"
          value={p.client_name}
          onChange={(e) => set('client_name', e.target.value)}
          onBlur={() => blur('personal.client_name')}
        />
      </FormField>

      <FormField id="personal.email" label="Email" required error={errors['personal.email']}>
        <InputField
          name="personal.email"
          type="email"
          autoComplete="email"
          placeholder="example@youremail.com"
          value={p.email}
          onChange={(e) => set('email', e.target.value)}
          onBlur={() => blur('personal.email')}
        />
      </FormField>

      <FormField id="personal.phone" label="Phone" required error={errors['personal.phone']}>
        <PhoneInput
          name="personal.phone"
          autoComplete="tel"
          placeholder="(123) 456 - 7890"
          value={p.phone}
          onChange={(e) =>
            set('phone', formatUSPhone(e.target.value.replace(/\D/g, '').slice(0, 11)))
          }
          onBlur={() => blur('personal.phone')}
        />
      </FormField>

      <FormField
        id="personal.home_address"
        label="Home address"
        required
        error={errors['personal.home_address']}
      >
        <InputField
          name="personal.home_address"
          autoComplete="street-address"
          placeholder="123 Main St, City, State, ZIP"
          value={p.home_address}
          onChange={(e) => set('home_address', e.target.value)}
          onBlur={() => blur('personal.home_address')}
        />
      </FormField>

      {/* Date of birth — single calendar via DatePickerField. The picker
          mounts react-day-picker in mode="single" with captionLayout="dropdown"
          and round-trips through dateTripleToDate / dateToDateTriple so
          the wire format (`personal.dob_day` / `dob_month` / `dob_year`) is
          unchanged. */}
      <fieldset className="consultation-dob-group">
        <legend className="consultation-sub-label">
          Date of birth
          <span className="required-asterisk" aria-hidden="true">
            *
          </span>
          <span className="visually-hidden"> (required)</span>
        </legend>
        <DatePickerField
          name="personal.dob"
          ariaLabel="Date of birth"
          required
          value={{ day: p.dob_day, month: p.dob_month, year: p.dob_year }}
          onChange={setDob}
          defaultVisibleMonthYearsBack={30}
        />
      </fieldset>

      {/* Optional clinic fields (preserved from DermaQuest source per MD §3.1).
          Operator may opt to drop these later — see pm_recommendations. */}
      <fieldset className="consultation-clinic-group">
        <legend className="consultation-sub-label">Referring clinic (optional)</legend>
        <p className="paragraph-small" style={{ margin: 0 }}>
          Skip if none.
        </p>
        <FormField
          id="personal.clinic_name"
          label="Clinic name"
          error={errors['personal.clinic_name']}
        >
          <InputField
            name="personal.clinic_name"
            value={p.clinic_name}
            onChange={(e) => set('clinic_name', e.target.value)}
          />
        </FormField>
        <FormField
          id="personal.clinic_address"
          label="Clinic address"
          error={errors['personal.clinic_address']}
        >
          <InputField
            name="personal.clinic_address"
            value={p.clinic_address}
            onChange={(e) => set('clinic_address', e.target.value)}
          />
        </FormField>
        <FormField
          id="personal.clinic_phone"
          label="Clinic phone"
          error={errors['personal.clinic_phone']}
        >
          <PhoneInput
            name="personal.clinic_phone"
            value={p.clinic_phone}
            onChange={(e) =>
              set('clinic_phone', formatUSPhone(e.target.value.replace(/\D/g, '').slice(0, 11)))
            }
          />
        </FormField>
      </fieldset>
    </div>
  );
}
