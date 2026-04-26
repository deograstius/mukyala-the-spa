/**
 * Mukyala consultation form — localStorage draft persistence.
 *
 * MD §8 contract:
 *  - storage key: `mukyala.forms.draft.intake.<client_session_id>`
 *  - auto-save trigger: debounced 500ms on every field change + on every step transition
 *  - resume prompt: "Resume your saved draft from <relative-time>?" on form mount
 *  - TTL: 30 days; expired drafts are purged on load
 *  - crash safety: never block UI on save failure (try/catch around localStorage)
 *  - privacy: localStorage only (no third-party sync) — MD §12
 */

import type { ConsultationDraft } from './schema';

const DRAFT_STORAGE_KEY_PREFIX = 'mukyala.forms.draft.intake.';
const CLIENT_SESSION_ID_STORAGE_KEY = 'mukyala.forms.client_session_id';
export const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days, MD §8
export const DRAFT_AUTOSAVE_DEBOUNCE_MS = 500; // MD §8

/**
 * Wraps a saved draft with its metadata so the resume prompt can show a
 * relative-time and the loader can apply TTL purging.
 */
export type StoredDraftEnvelope = {
  client_session_id: string;
  draft: ConsultationDraft;
  saved_at: string; // ISO 8601
  schema_version: 1;
};

export function buildDraftStorageKey(clientSessionId: string): string {
  return `${DRAFT_STORAGE_KEY_PREFIX}${clientSessionId}`;
}

function safeGetLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function isEnvelope(value: unknown): value is StoredDraftEnvelope {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.client_session_id === 'string' &&
    typeof v.saved_at === 'string' &&
    v.schema_version === 1 &&
    !!v.draft &&
    typeof v.draft === 'object'
  );
}

/**
 * Pull the most-recent saved draft for `clientSessionId`. Returns null if:
 *   - no draft saved
 *   - draft is older than DRAFT_TTL_MS (purges it as a side effect)
 *   - draft is malformed (purges it as a side effect)
 *
 * Crash-safe: any thrown localStorage error returns null.
 */
export function loadDraft(clientSessionId: string): StoredDraftEnvelope | null {
  const storage = safeGetLocalStorage();
  if (!storage) return null;
  const key = buildDraftStorageKey(clientSessionId);
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return null;
  }
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Malformed JSON — purge.
    try {
      storage.removeItem(key);
    } catch {
      /* ignore */
    }
    return null;
  }
  if (!isEnvelope(parsed)) {
    try {
      storage.removeItem(key);
    } catch {
      /* ignore */
    }
    return null;
  }
  const savedAtMs = Date.parse(parsed.saved_at);
  if (!Number.isFinite(savedAtMs) || Date.now() - savedAtMs > DRAFT_TTL_MS) {
    try {
      storage.removeItem(key);
    } catch {
      /* ignore */
    }
    return null;
  }
  return parsed;
}

/**
 * Persist a draft. Crash-safe — silently swallows quota / disabled errors.
 */
export function saveDraft(envelope: StoredDraftEnvelope): void {
  const storage = safeGetLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(buildDraftStorageKey(envelope.client_session_id), JSON.stringify(envelope));
  } catch {
    // Quota exceeded / private mode / disabled — non-fatal per MD §8.
  }
}

/**
 * Remove the saved draft after successful submit (or when the user picks
 * "Start fresh" in the resume prompt).
 */
export function clearDraft(clientSessionId: string): void {
  const storage = safeGetLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(buildDraftStorageKey(clientSessionId));
  } catch {
    /* ignore */
  }
}

/**
 * Returns or creates the persistent client_session_id used for both the
 * draft key and the X-Client-Session-Id submission header (MD §11).
 *
 * MD §8: "uuid v4 created on first form load and persisted in localStorage".
 *
 * Browser support: `crypto.randomUUID()` is available in all modern browsers
 * targeted by the SPA's Vite/ES2022 build (see tsconfig.app.json + vite.config).
 * We fall back to a `Date.now()` + `Math.random()` composite if it is missing
 * (matches the existing `getOrCreateStorageId` pattern in src/app/telemetry.ts).
 * The id only needs to be unique-per-visitor for the draft slot + submission
 * header — it is not a security token.
 */
export function getOrCreateClientSessionId(): string {
  const storage = safeGetLocalStorage();
  if (storage) {
    try {
      const existing = storage.getItem(CLIENT_SESSION_ID_STORAGE_KEY);
      if (existing && existing.trim().length >= 8) return existing;
    } catch {
      /* fall through to generate */
    }
  }
  const id = generateClientSessionId();
  if (storage) {
    try {
      storage.setItem(CLIENT_SESSION_ID_STORAGE_KEY, id);
    } catch {
      /* non-fatal — caller still gets a valid id for this session */
    }
  }
  return id;
}

function generateClientSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback (rare): timestamp + two random hex chunks. Not RFC-4122 strict
  // but unique enough for a per-visitor draft slot.
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Tiny debounce helper for the auto-save effect. Returns a function that
 * delays its trailing-edge call by `delayMs` and a `flush()` to force
 * immediate execution at step transitions (MD §8).
 */
export function createDebouncedSaver(
  saver: (envelope: StoredDraftEnvelope) => void,
  delayMs: number = DRAFT_AUTOSAVE_DEBOUNCE_MS,
): {
  schedule: (envelope: StoredDraftEnvelope) => void;
  flush: () => void;
  cancel: () => void;
} {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: StoredDraftEnvelope | null = null;

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return {
    schedule(envelope: StoredDraftEnvelope) {
      pending = envelope;
      clearTimer();
      timer = setTimeout(() => {
        timer = null;
        if (pending) {
          const toSave = pending;
          pending = null;
          saver(toSave);
        }
      }, delayMs);
    },
    flush() {
      clearTimer();
      if (pending) {
        const toSave = pending;
        pending = null;
        saver(toSave);
      }
    },
    cancel() {
      clearTimer();
      pending = null;
    },
  };
}

/**
 * Format a "relative time ago" string for the resume-prompt copy
 * ("Resume your saved draft from <2 minutes ago>?"). Uses
 * `Intl.RelativeTimeFormat` with sensible bucket thresholds.
 */
export function formatRelativeAgo(isoTimestamp: string, now: Date = new Date()): string {
  const then = Date.parse(isoTimestamp);
  if (!Number.isFinite(then)) return 'just now';
  const diffSeconds = Math.round((then - now.getTime()) / 1000);
  let rtf: Intl.RelativeTimeFormat;
  try {
    rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  } catch {
    return 'recently';
  }
  const absSec = Math.abs(diffSeconds);
  if (absSec < 45) return rtf.format(diffSeconds, 'second');
  if (absSec < 60 * 45) return rtf.format(Math.round(diffSeconds / 60), 'minute');
  if (absSec < 60 * 60 * 22) return rtf.format(Math.round(diffSeconds / 3600), 'hour');
  return rtf.format(Math.round(diffSeconds / 86400), 'day');
}
