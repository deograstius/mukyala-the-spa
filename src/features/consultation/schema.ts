/**
 * Mukyala consultation form (Form 1 / `intake`) — canonical schema.
 *
 * Source of truth: `/Users/deokalule/Documents/Business/Spa-Mukyala/Client-Forms/mukyala-client-forms-MASTER.md`,
 * Sections 3.1, 4 (required vs optional), 5 (conditional reveals), 6 (validation rules), 7 (steps).
 *
 * Scope discipline (operator non-negotiable, see STATE.md HANDOFF for chunk
 * `spa-consultation-form-v1`): this file mirrors EXACTLY what the master MD describes
 * for Form 1 / `intake`. No invented fields. No 18+ gate. No photo upload. Other
 * forms (reaction, treatment_summary, model_release, informed_consent, ingredient_index)
 * are out of scope and MUST NOT appear here.
 */

// =====================================================================
// Field-name constants (snake_case + dot notation, per MD Section 3.1).
// The wire payload is a flat dotted map (see flattenDraftForSubmit below).
// =====================================================================

export const CONSULTATION_FORM_ID = 'intake' as const;

/**
 * Operator-confirmed SLA copy for v1 (chunk `spa-consultation-form-v1`):
 * "We'll respond within 2 business days." Hardcoded for v1; the MD §19.6
 * `consultation.sla_business_days` runtime config can be wired later.
 */
export const CONSULTATION_SLA_BUSINESS_DAYS = 2;

// ---- Step 1: Personal ------------------------------------------------
// Note (chunk `consultation-copy-and-clinic-gate-2026-04-26`):
// `personal.has_referring_clinic` is a UI-only Yes/No gate that controls
// visibility of the three optional clinic_* fields. It is INTENTIONALLY
// not listed in PERSONAL_FIELDS so the wire payload (MD §3.1) is
// unchanged. The clinic_* fields remain optional (MD §4); the gate only
// controls reveal/clear in the UI. If product ever needs the backend to
// distinguish "user said no clinic" vs "user left it blank", add
// 'personal.has_referring_clinic' to PERSONAL_FIELDS and extend the
// flattenDraftForSubmit personal.* loop to handle the boolean | null type.
export const PERSONAL_FIELDS = [
  'personal.client_name',
  'personal.home_address',
  'personal.phone',
  'personal.email',
  'personal.dob_day',
  'personal.dob_month',
  'personal.dob_year',
  'personal.clinic_name',
  'personal.clinic_address',
  'personal.clinic_phone',
] as const;
export type PersonalFieldName = (typeof PERSONAL_FIELDS)[number];

// ---- Step 2: Lifestyle -----------------------------------------------
export const LIFESTYLE_FIELDS = [
  'lifestyle.occupation',
  'lifestyle.stress_level',
  'lifestyle.exercise',
  'lifestyle.exercise_frequency',
  'lifestyle.dietary_restrictions',
  'lifestyle.water_glasses_per_day',
  'lifestyle.alcohol',
  'lifestyle.alcohol_units_per_week',
  'lifestyle.smoke',
  'lifestyle.smoke_per_day',
  'lifestyle.caffeine',
  'lifestyle.caffeine_per_day',
  'lifestyle.recent_sun_exposure',
] as const;
export type LifestyleFieldName = (typeof LIFESTYLE_FIELDS)[number];

// ---- Step 3: Skin Concerns + Skin Care -------------------------------
export const SKIN_CONCERN_OPTIONS = [
  'acne_or_scarring',
  'hyperpigmentation',
  'redness_rosacea',
  'improve_texture',
  'sensitivity',
  'dry_dehydrated',
  'congestion_blackheads',
  'oily_combination',
  'fine_lines_wrinkles',
] as const;
export type SkinConcernOption = (typeof SKIN_CONCERN_OPTIONS)[number];

export const SKINCARE_PRODUCT_OPTIONS = [
  'cleanser',
  'serum',
  'exfoliator',
  'moisturizer',
  'toner',
  'spf',
  'mask',
] as const;
export type SkincareProductOption = (typeof SKINCARE_PRODUCT_OPTIONS)[number];

// ---- Step 4: Health (every boolean is REQUIRED per MD §4) ------------
export const HEALTH_BOOLEAN_FIELDS = [
  'health.under_physician_care',
  'health.being_treated',
  'health.using_steroids',
  'health.taking_medications',
  'health.allergies',
  'health.medication_allergies',
  'health.cosmetic_allergies',
  'health.hormonal_imbalance',
  'health.burns_grafted_skin',
  'health.diabetes',
  'health.epilepsy',
  'health.kidney_disease',
  'health.shingles',
  'health.eczema',
  'health.psoriasis',
  'health.dermatitis',
  'health.thyroid',
  'health.cold_sores',
  'health.keloid_scarring',
  'health.hypertrophic_scarring',
  'health.asthma',
  'health.heart_condition',
  'health.thrombosis',
  'health.high_blood_pressure',
  'health.metal_implants',
  'health.tattoos_in_treatment_area',
  'health.skin_cancer_history',
  'health.cancer_radiation_history',
  'health.current_radiation',
  'health.haemophilia',
] as const;
export type HealthBooleanFieldName = (typeof HEALTH_BOOLEAN_FIELDS)[number];

export const DIABETES_TYPE_OPTIONS = ['type_1', 'type_2'] as const;
export type DiabetesType = (typeof DIABETES_TYPE_OPTIONS)[number];

// ---- Step 5: Females-only --------------------------------------------
export const FEMALES_ONLY_FIELDS = [
  'females_only.applicable',
  'females_only.pregnant',
  'females_only.breastfeeding',
  'females_only.contraceptives',
] as const;
export type FemalesOnlyFieldName = (typeof FEMALES_ONLY_FIELDS)[number];

// =====================================================================
// Submission payload type (matches MD §3.1 + §11 wire format).
// Booleans use null for "unanswered required" so the form can show errors
// on Step 4. Implementer may switch to undefined if preferred — keep one.
// =====================================================================

export type ConsultationDraft = {
  // Step 1
  personal: {
    client_name: string;
    home_address: string;
    phone: string; // E.164 on the wire (MD §6); UI may display formatted
    email: string;
    dob_day: string; // numeric strings (MD §3.1); combined ISO date validated separately
    dob_month: string;
    dob_year: string;
    // UI-only gate (chunk `consultation-copy-and-clinic-gate-2026-04-26`).
    // null = unanswered, true = user has a referring clinic (reveals
    // clinic_* inputs below), false = no clinic. Not part of the wire
    // payload by default — see PERSONAL_FIELDS comment.
    has_referring_clinic: boolean | null;
    clinic_name: string; // optional per MD §4
    clinic_address: string; // optional
    clinic_phone: string; // optional
  };
  // Step 2
  lifestyle: {
    occupation: string;
    stress_level: string;
    exercise: boolean | null;
    exercise_frequency: string; // conditional reveal: lifestyle.exercise === true
    dietary_restrictions: string;
    water_glasses_per_day: string;
    alcohol: boolean | null;
    alcohol_units_per_week: string; // conditional reveal: lifestyle.alcohol === true
    smoke: boolean | null;
    smoke_per_day: string; // conditional reveal: lifestyle.smoke === true
    caffeine: boolean | null;
    caffeine_per_day: string; // conditional reveal: lifestyle.caffeine === true
    recent_sun_exposure: string;
  };
  // Step 3
  skin_concerns: {
    selected: SkinConcernOption[];
    goals: string;
    actives_in_use: string;
    prior_treatments: string;
  };
  skincare: {
    products_used: SkincareProductOption[];
    other_products: string;
  };
  // Step 4
  health: {
    under_physician_care: boolean | null;
    being_treated: boolean | null;
    using_steroids: boolean | null;
    taking_medications: boolean | null;
    medications_list: string; // conditional: health.taking_medications === true
    hydroquinone: string;
    retin_a: string;
    accutane: string;
    blood_thinners: string;
    allergies: boolean | null;
    medication_allergies: boolean | null;
    medication_allergy_type: string; // conditional: health.medication_allergies === true
    cosmetic_allergies: boolean | null;
    other_allergies_notes: string; // conditional: health.cosmetic_allergies === true
    hormonal_imbalance: boolean | null;
    burns_grafted_skin: boolean | null;
    diabetes: boolean | null;
    diabetes_type: DiabetesType | ''; // conditional: health.diabetes === true
    epilepsy: boolean | null;
    kidney_disease: boolean | null;
    shingles: boolean | null;
    eczema: boolean | null;
    psoriasis: boolean | null;
    dermatitis: boolean | null;
    thyroid: boolean | null;
    cold_sores: boolean | null;
    keloid_scarring: boolean | null;
    hypertrophic_scarring: boolean | null;
    asthma: boolean | null;
    heart_condition: boolean | null;
    thrombosis: boolean | null;
    high_blood_pressure: boolean | null;
    metal_implants: boolean | null;
    tattoos_in_treatment_area: boolean | null;
    skin_cancer_history: boolean | null;
    cancer_radiation_history: boolean | null;
    current_radiation: boolean | null;
    haemophilia: boolean | null;
  };
  // Step 5 (entire step gated by females_only.applicable === true per MD §5)
  females_only: {
    applicable: boolean | null;
    pregnant: boolean | null;
    breastfeeding: boolean | null;
    contraceptives: boolean | null;
  };
  // Step 6
  signature: {
    // Operator decision for v1 (see STATE.md HANDOFF): typed full name +
    // attestation checkbox (NO canvas, NO third-party e-sign).
    print_name: string;
    attested: boolean; // checkbox — required true on submit
    date: string; // ISO YYYY-MM-DD; defaults to today on Step 6 mount
    // signature.skincare_professional is staff-countersign and not collected
    // at submit per MD §4 ("optional at submit").
  };
};

// =====================================================================
// Initial blank draft. Implementer uses this to seed React state and the
// localStorage draft store. Booleans default to null so radios render
// unselected; the validation layer is what enforces required-ness.
// =====================================================================

export function createEmptyDraft(): ConsultationDraft {
  return {
    personal: {
      client_name: '',
      home_address: '',
      phone: '',
      email: '',
      dob_day: '',
      dob_month: '',
      dob_year: '',
      has_referring_clinic: null,
      clinic_name: '',
      clinic_address: '',
      clinic_phone: '',
    },
    lifestyle: {
      occupation: '',
      stress_level: '',
      exercise: null,
      exercise_frequency: '',
      dietary_restrictions: '',
      water_glasses_per_day: '',
      alcohol: null,
      alcohol_units_per_week: '',
      smoke: null,
      smoke_per_day: '',
      caffeine: null,
      caffeine_per_day: '',
      recent_sun_exposure: '',
    },
    skin_concerns: {
      selected: [],
      goals: '',
      actives_in_use: '',
      prior_treatments: '',
    },
    skincare: {
      products_used: [],
      other_products: '',
    },
    health: {
      under_physician_care: null,
      being_treated: null,
      using_steroids: null,
      taking_medications: null,
      medications_list: '',
      hydroquinone: '',
      retin_a: '',
      accutane: '',
      blood_thinners: '',
      allergies: null,
      medication_allergies: null,
      medication_allergy_type: '',
      cosmetic_allergies: null,
      other_allergies_notes: '',
      hormonal_imbalance: null,
      burns_grafted_skin: null,
      diabetes: null,
      diabetes_type: '',
      epilepsy: null,
      kidney_disease: null,
      shingles: null,
      eczema: null,
      psoriasis: null,
      dermatitis: null,
      thyroid: null,
      cold_sores: null,
      keloid_scarring: null,
      hypertrophic_scarring: null,
      asthma: null,
      heart_condition: null,
      thrombosis: null,
      high_blood_pressure: null,
      metal_implants: null,
      tattoos_in_treatment_area: null,
      skin_cancer_history: null,
      cancer_radiation_history: null,
      current_radiation: null,
      haemophilia: null,
    },
    females_only: {
      applicable: null,
      pregnant: null,
      breastfeeding: null,
      contraceptives: null,
    },
    signature: {
      print_name: '',
      attested: false,
      date: '',
    },
  };
}

// =====================================================================
// Step routing (MD §7).
// 6 deep-linkable steps. Step 5 is "skipped seamlessly" when
// females_only.applicable === false (still rendered in the progress bar
// as "Skipped" per MD §7).
// =====================================================================

export const CONSULTATION_STEP_IDS = [
  'step-1',
  'step-2',
  'step-3',
  'step-4',
  'step-5',
  'step-6',
] as const;
export type ConsultationStepId = (typeof CONSULTATION_STEP_IDS)[number];

export const CONSULTATION_STEP_TITLES: Record<ConsultationStepId, string> = {
  'step-1': 'Personal Information',
  'step-2': 'Lifestyle',
  'step-3': 'Skin Concerns + Skin Care',
  'step-4': 'Health',
  'step-5': 'Females-only',
  'step-6': 'Review & Sign',
};

// =====================================================================
// Conditional-reveal predicate registry (MD §5).
// Each predicate takes the whole draft so cross-section predicates can be
// added later; v1 predicates each look at exactly one boolean.
// =====================================================================

export type RevealPredicate = (draft: ConsultationDraft) => boolean;

export type ConditionalRevealKey =
  | 'personal.referring_clinic_group'
  | 'lifestyle.exercise_frequency'
  | 'lifestyle.alcohol_units_per_week'
  | 'lifestyle.smoke_per_day'
  | 'lifestyle.caffeine_per_day'
  | 'health.medications_list'
  | 'health.medication_allergy_type'
  | 'health.other_allergies_notes'
  | 'health.diabetes_type'
  | 'females_only.step';

export const CONDITIONAL_REVEALS: Record<ConditionalRevealKey, RevealPredicate> = {
  // Step 1 personal reveals — chunk `consultation-copy-and-clinic-gate-2026-04-26`.
  // The three optional clinic_* fields are hidden by default and only
  // shown when the user answers "yes" to "Were you referred by a clinic?".
  // Even when revealed, they remain OPTIONAL (no required validation).
  'personal.referring_clinic_group': (d) => d.personal.has_referring_clinic === true,
  // Step 2 lifestyle reveals.
  'lifestyle.exercise_frequency': (d) => d.lifestyle.exercise === true,
  'lifestyle.alcohol_units_per_week': (d) => d.lifestyle.alcohol === true,
  'lifestyle.smoke_per_day': (d) => d.lifestyle.smoke === true,
  'lifestyle.caffeine_per_day': (d) => d.lifestyle.caffeine === true,
  // Step 4 health reveals.
  'health.medications_list': (d) => d.health.taking_medications === true,
  'health.medication_allergy_type': (d) => d.health.medication_allergies === true,
  // MD §5: cosmetic_allergies === true reveals other_allergies_notes
  // ("request elaboration"). The base "anything else not listed above"
  // text is otherwise a free elaboration field.
  'health.other_allergies_notes': (d) => d.health.cosmetic_allergies === true,
  'health.diabetes_type': (d) => d.health.diabetes === true,
  // Step 5 entire-step gate.
  'females_only.step': (d) => d.females_only.applicable === true,
};

/**
 * True when the conditional field identified by `key` should be visible
 * given the current draft (MD §5).
 */
export function isRevealed(key: ConditionalRevealKey, draft: ConsultationDraft): boolean {
  return CONDITIONAL_REVEALS[key](draft);
}

/**
 * Reset dependent fields whose predicate just flipped to false (MD §5:
 * "dependent field's value MUST be cleared and its validation cleared").
 *
 * Pure function: takes the previous and next draft, returns a draft where
 * any newly-hidden conditional field has been zeroed in `next`.
 */
export function applyRevealClears(
  prev: ConsultationDraft,
  next: ConsultationDraft,
): ConsultationDraft {
  let out = next;
  // Step 1 — referring-clinic group reveal (chunk
  // `consultation-copy-and-clinic-gate-2026-04-26`).
  // When the gate flips false, clear the three optional clinic_* strings
  // so a stale value never reaches the wire payload.
  if (
    isRevealed('personal.referring_clinic_group', prev) &&
    !isRevealed('personal.referring_clinic_group', out)
  ) {
    out = {
      ...out,
      personal: {
        ...out.personal,
        clinic_name: '',
        clinic_address: '',
        clinic_phone: '',
      },
    };
  }
  // Step 2 — lifestyle reveals.
  if (
    isRevealed('lifestyle.exercise_frequency', prev) &&
    !isRevealed('lifestyle.exercise_frequency', out)
  ) {
    out = { ...out, lifestyle: { ...out.lifestyle, exercise_frequency: '' } };
  }
  if (
    isRevealed('lifestyle.alcohol_units_per_week', prev) &&
    !isRevealed('lifestyle.alcohol_units_per_week', out)
  ) {
    out = { ...out, lifestyle: { ...out.lifestyle, alcohol_units_per_week: '' } };
  }
  if (isRevealed('lifestyle.smoke_per_day', prev) && !isRevealed('lifestyle.smoke_per_day', out)) {
    out = { ...out, lifestyle: { ...out.lifestyle, smoke_per_day: '' } };
  }
  if (
    isRevealed('lifestyle.caffeine_per_day', prev) &&
    !isRevealed('lifestyle.caffeine_per_day', out)
  ) {
    out = { ...out, lifestyle: { ...out.lifestyle, caffeine_per_day: '' } };
  }
  // Step 4 — health reveals.
  if (isRevealed('health.medications_list', prev) && !isRevealed('health.medications_list', out)) {
    out = { ...out, health: { ...out.health, medications_list: '' } };
  }
  if (
    isRevealed('health.medication_allergy_type', prev) &&
    !isRevealed('health.medication_allergy_type', out)
  ) {
    out = { ...out, health: { ...out.health, medication_allergy_type: '' } };
  }
  if (
    isRevealed('health.other_allergies_notes', prev) &&
    !isRevealed('health.other_allergies_notes', out)
  ) {
    out = { ...out, health: { ...out.health, other_allergies_notes: '' } };
  }
  if (isRevealed('health.diabetes_type', prev) && !isRevealed('health.diabetes_type', out)) {
    out = { ...out, health: { ...out.health, diabetes_type: '' } };
  }
  // Step 5 — entire females_only step gate. When the gate flips false,
  // clear the three boolean answers (the `applicable` toggle itself stays
  // so the user can re-open it without re-asking the question).
  if (isRevealed('females_only.step', prev) && !isRevealed('females_only.step', out)) {
    out = {
      ...out,
      females_only: {
        ...out.females_only,
        pregnant: null,
        breastfeeding: null,
        contraceptives: null,
      },
    };
  }
  return out;
}

// =====================================================================
// Required-fields registry per step (MD §4).
// Arrays of dotted field paths that MUST be non-empty / non-null at the
// moment the user clicks "Next" (or "Send My Consultation Request" on
// Step 6). Conditional fields are required only while their predicate is
// true — handled in stepRequiredFields() below.
// =====================================================================

export const REQUIRED_FIELDS_BY_STEP: Record<ConsultationStepId, ReadonlyArray<string>> = {
  'step-1': [
    'personal.client_name',
    'personal.home_address',
    'personal.phone',
    'personal.email',
    'personal.dob_day',
    'personal.dob_month',
    'personal.dob_year',
  ],
  'step-2': [], // all lifestyle fields are optional except conditional reveals
  'step-3': [], // all skin_concerns + skincare fields are optional per MD §4
  'step-4': HEALTH_BOOLEAN_FIELDS as unknown as ReadonlyArray<string>,
  'step-5': [], // when applicable === true, MD §4 lists no boolean as REQUIRED.
  // Default v1: pregnant/breastfeeding/contraceptives are all optional once
  // the step is shown. Operator confirm flagged in pm_recommendations.
  'step-6': [
    'signature.print_name',
    'signature.attested', // must be true
    'signature.date',
  ],
};

/**
 * Returns the dotted field paths that are required for `stepId` GIVEN
 * the current draft. This adds dynamic, conditional-reveal-aware
 * required-ness on top of the static REQUIRED_FIELDS_BY_STEP map.
 */
export function stepRequiredFields(
  stepId: ConsultationStepId,
  draft: ConsultationDraft,
): ReadonlyArray<string> {
  const base = REQUIRED_FIELDS_BY_STEP[stepId];
  if (stepId === 'step-2') {
    const extra: string[] = [];
    if (isRevealed('lifestyle.exercise_frequency', draft))
      extra.push('lifestyle.exercise_frequency');
    if (isRevealed('lifestyle.alcohol_units_per_week', draft))
      extra.push('lifestyle.alcohol_units_per_week');
    if (isRevealed('lifestyle.smoke_per_day', draft)) extra.push('lifestyle.smoke_per_day');
    if (isRevealed('lifestyle.caffeine_per_day', draft)) extra.push('lifestyle.caffeine_per_day');
    return [...base, ...extra];
  }
  if (stepId === 'step-4') {
    const extra: string[] = [];
    if (isRevealed('health.medications_list', draft)) extra.push('health.medications_list');
    if (isRevealed('health.medication_allergy_type', draft))
      extra.push('health.medication_allergy_type');
    if (isRevealed('health.other_allergies_notes', draft))
      extra.push('health.other_allergies_notes');
    if (isRevealed('health.diabetes_type', draft)) extra.push('health.diabetes_type');
    return [...base, ...extra];
  }
  return base;
}

/**
 * True when every required field for this step (including any active
 * conditional reveals) is satisfied in the draft.
 */
export function isStepComplete(stepId: ConsultationStepId, draft: ConsultationDraft): boolean {
  // Step 5 is "complete" when applicable is false (it is skipped) OR when
  // the user hits Next on it (we have no required fields, so it is
  // trivially complete the moment it is reached).
  if (stepId === 'step-5' && !isRevealed('females_only.step', draft)) {
    return true;
  }
  const required = stepRequiredFields(stepId, draft);
  return required.every((path) => isFieldSatisfied(path, draft));
}

function isFieldSatisfied(path: string, draft: ConsultationDraft): boolean {
  const value = readDraftValue(path, draft);
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'boolean') {
    // signature.attested specifically requires `true`.
    if (path === 'signature.attested') return value === true;
    return true;
  }
  if (Array.isArray(value)) return true; // arrays are optional in v1
  if (typeof value === 'number') return Number.isFinite(value);
  return false;
}

function readDraftValue(
  path: string,
  draft: ConsultationDraft,
): string | number | boolean | string[] | null | undefined {
  const [section, field] = path.split('.') as [keyof ConsultationDraft, string];
  const sectionObj = draft[section] as unknown as Record<string, unknown>;
  if (!sectionObj || typeof sectionObj !== 'object') return undefined;
  const v = sectionObj[field];
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

// =====================================================================
// Submission payload shape sent to POST /v1/consultations.
// MD §11 prescribes a flat dotted-key payload; we follow that on the wire
// even though the in-memory draft is nested above. flattenDraftForSubmit
// walks the nested ConsultationDraft and produces the dotted payload.
// =====================================================================

export type ConsultationSubmitRequest = {
  form_id: typeof CONSULTATION_FORM_ID;
  submitted_at: string; // ISO 8601
  client_session_id: string; // uuid v4 — also used as draft key suffix
  payload: Record<string, string | number | boolean | string[] | null>;
  signatures: Array<{
    field: 'signature.client';
    method: 'typed';
    typed_name: string;
    attested: true;
    signed_at: string; // ISO 8601
    user_agent?: string;
  }>;
  attachments: []; // intake has no attachments per MD §11 example + operator scope
};

export type ConsultationSubmitResponse = {
  submission_id: string;
  received_at: string; // ISO 8601
};

/**
 * Walk the nested draft and produce the flat dotted-key payload MD §11
 * specifies. Boolean nulls are kept as null on the wire so the backend
 * can distinguish "unanswered" from false (defense in depth even though
 * required-ness is enforced client-side too).
 */
export function flattenDraftForSubmit(
  draft: ConsultationDraft,
): Record<string, string | number | boolean | string[] | null> {
  const out: Record<string, string | number | boolean | string[] | null> = {};
  // personal.*
  for (const key of PERSONAL_FIELDS) {
    const field = key.split('.')[1] as keyof ConsultationDraft['personal'];
    out[key] = draft.personal[field];
  }
  // lifestyle.*
  for (const key of LIFESTYLE_FIELDS) {
    const field = key.split('.')[1] as keyof ConsultationDraft['lifestyle'];
    out[key] = draft.lifestyle[field] as string | boolean | null;
  }
  // skin_concerns.*
  out['skin_concerns.selected'] = [...draft.skin_concerns.selected];
  out['skin_concerns.goals'] = draft.skin_concerns.goals;
  out['skin_concerns.actives_in_use'] = draft.skin_concerns.actives_in_use;
  out['skin_concerns.prior_treatments'] = draft.skin_concerns.prior_treatments;
  // skincare.*
  out['skincare.products_used'] = [...draft.skincare.products_used];
  out['skincare.other_products'] = draft.skincare.other_products;
  // health.*
  for (const key of HEALTH_BOOLEAN_FIELDS) {
    const field = key.split('.')[1] as keyof ConsultationDraft['health'];
    out[key] = draft.health[field] as boolean | null;
  }
  out['health.medications_list'] = draft.health.medications_list;
  out['health.hydroquinone'] = draft.health.hydroquinone;
  out['health.retin_a'] = draft.health.retin_a;
  out['health.accutane'] = draft.health.accutane;
  out['health.blood_thinners'] = draft.health.blood_thinners;
  out['health.medication_allergy_type'] = draft.health.medication_allergy_type;
  out['health.other_allergies_notes'] = draft.health.other_allergies_notes;
  out['health.diabetes_type'] =
    draft.health.diabetes_type === '' ? null : draft.health.diabetes_type;
  // females_only.*
  for (const key of FEMALES_ONLY_FIELDS) {
    const field = key.split('.')[1] as keyof ConsultationDraft['females_only'];
    out[key] = draft.females_only[field] as boolean | null;
  }
  // signature.* (the typed-name + attest variant — operator decision for v1)
  out['signature.print_name'] = draft.signature.print_name;
  out['signature.attested'] = draft.signature.attested;
  out['signature.date'] = draft.signature.date;
  return out;
}

// =====================================================================
// Step navigation helper (MD §7: "jumping to a future step with unmet
// prerequisites redirects to earliest incomplete step").
// =====================================================================

/**
 * Returns the earliest step whose required fields are not yet satisfied,
 * skipping `step-5` when females_only.applicable !== true. Returns
 * `step-6` if every preceding step is complete.
 */
export function earliestIncompleteStep(draft: ConsultationDraft): ConsultationStepId {
  for (const stepId of CONSULTATION_STEP_IDS) {
    if (stepId === 'step-6') return 'step-6';
    if (stepId === 'step-5' && !isRevealed('females_only.step', draft)) continue;
    if (!isStepComplete(stepId, draft)) return stepId;
  }
  return 'step-6';
}
