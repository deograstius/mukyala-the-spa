/**
 * draftStore — tester pass (chunk: spa-consultation-form-v1).
 *
 * Coverage:
 *  - 30-day TTL pruning on load
 *  - debounced save (createDebouncedSaver)
 *  - getOrCreateClientSessionId persistence + crypto.randomUUID
 *  - load/save/clear roundtrip
 *  - malformed JSON purge
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildDraftStorageKey,
  clearDraft,
  createDebouncedSaver,
  DRAFT_TTL_MS,
  formatRelativeAgo,
  getOrCreateClientSessionId,
  loadDraft,
  saveDraft,
  type StoredDraftEnvelope,
} from '../draftStore';
import { createEmptyDraft } from '../schema';

const SESSION = 'sess-1234';

beforeEach(() => {
  window.localStorage.clear();
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function makeEnvelope(overrides: Partial<StoredDraftEnvelope> = {}): StoredDraftEnvelope {
  return {
    client_session_id: SESSION,
    draft: createEmptyDraft(),
    saved_at: new Date().toISOString(),
    schema_version: 1,
    ...overrides,
  };
}

describe('draftStore — load/save/clear', () => {
  it('round-trips a saved envelope through localStorage', () => {
    const env = makeEnvelope();
    saveDraft(env);
    const loaded = loadDraft(SESSION);
    expect(loaded).not.toBeNull();
    expect(loaded!.client_session_id).toBe(SESSION);
    expect(loaded!.schema_version).toBe(1);
  });

  it('returns null when no draft exists', () => {
    expect(loadDraft('does-not-exist')).toBeNull();
  });

  it('clearDraft removes the stored entry', () => {
    saveDraft(makeEnvelope());
    expect(loadDraft(SESSION)).not.toBeNull();
    clearDraft(SESSION);
    expect(loadDraft(SESSION)).toBeNull();
  });

  it('purges malformed JSON on load', () => {
    window.localStorage.setItem(buildDraftStorageKey(SESSION), 'not-json{');
    expect(loadDraft(SESSION)).toBeNull();
    expect(window.localStorage.getItem(buildDraftStorageKey(SESSION))).toBeNull();
  });

  it('purges entries that are not valid envelopes (bad shape)', () => {
    window.localStorage.setItem(buildDraftStorageKey(SESSION), JSON.stringify({ wrong: 'shape' }));
    expect(loadDraft(SESSION)).toBeNull();
    expect(window.localStorage.getItem(buildDraftStorageKey(SESSION))).toBeNull();
  });
});

describe('draftStore — 30-day TTL', () => {
  it('returns the envelope when saved_at is inside the 30-day TTL window', () => {
    const env = makeEnvelope({
      saved_at: new Date(Date.now() - DRAFT_TTL_MS + 60_000).toISOString(), // ~30d minus 1m
    });
    saveDraft(env);
    expect(loadDraft(SESSION)).not.toBeNull();
  });

  it('purges (returns null) when saved_at is older than 30 days', () => {
    const env = makeEnvelope({
      saved_at: new Date(Date.now() - DRAFT_TTL_MS - 60_000).toISOString(), // ~30d + 1m
    });
    saveDraft(env);
    expect(loadDraft(SESSION)).toBeNull();
    expect(window.localStorage.getItem(buildDraftStorageKey(SESSION))).toBeNull();
  });

  it('purges when saved_at is unparseable', () => {
    const env = makeEnvelope({ saved_at: 'not-a-date' });
    saveDraft(env);
    expect(loadDraft(SESSION)).toBeNull();
  });
});

describe('draftStore — getOrCreateClientSessionId', () => {
  it('returns the SAME id across multiple reads (persisted in localStorage)', () => {
    const a = getOrCreateClientSessionId();
    const b = getOrCreateClientSessionId();
    const c = getOrCreateClientSessionId();
    expect(a).toBeTruthy();
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it('uses crypto.randomUUID when available (RFC-4122 v4 shape)', () => {
    const spy = vi.spyOn(crypto, 'randomUUID');
    window.localStorage.clear();
    const id = getOrCreateClientSessionId();
    expect(spy).toHaveBeenCalled();
    // RFC-4122 v4 pattern.
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('falls back to a non-uuid composite when crypto.randomUUID is unavailable', () => {
    const orig = (crypto as { randomUUID?: unknown }).randomUUID;
    Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: undefined });
    try {
      window.localStorage.clear();
      const id = getOrCreateClientSessionId();
      expect(id.length).toBeGreaterThan(8);
    } finally {
      Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: orig });
    }
  });
});

describe('draftStore — createDebouncedSaver', () => {
  it('debounces multiple schedule() calls into a single trailing-edge save', () => {
    vi.useFakeTimers();
    const saver = vi.fn();
    const d = createDebouncedSaver(saver, 100);
    d.schedule(makeEnvelope({ saved_at: '2026-01-01T00:00:00.000Z' }));
    d.schedule(makeEnvelope({ saved_at: '2026-01-01T00:00:00.001Z' }));
    d.schedule(makeEnvelope({ saved_at: '2026-01-01T00:00:00.002Z' }));
    expect(saver).not.toHaveBeenCalled();
    vi.advanceTimersByTime(120);
    expect(saver).toHaveBeenCalledTimes(1);
    expect(saver.mock.calls[0][0].saved_at).toBe('2026-01-01T00:00:00.002Z');
  });

  it('flush() forces immediate save and clears the timer', () => {
    vi.useFakeTimers();
    const saver = vi.fn();
    const d = createDebouncedSaver(saver, 500);
    d.schedule(makeEnvelope());
    d.flush();
    expect(saver).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    // No double-fire.
    expect(saver).toHaveBeenCalledTimes(1);
  });

  it('cancel() drops the pending save', () => {
    vi.useFakeTimers();
    const saver = vi.fn();
    const d = createDebouncedSaver(saver, 200);
    d.schedule(makeEnvelope());
    d.cancel();
    vi.advanceTimersByTime(500);
    expect(saver).not.toHaveBeenCalled();
  });
});

describe('draftStore — formatRelativeAgo', () => {
  it('returns a sensible relative time string', () => {
    const now = new Date('2026-04-25T12:00:00.000Z');
    const oneMinAgo = new Date(now.getTime() - 60_000).toISOString();
    const result = formatRelativeAgo(oneMinAgo, now);
    // The format is locale-driven; we only assert it isn't an empty fallback.
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns "just now" when the timestamp is unparseable', () => {
    expect(formatRelativeAgo('not-a-date')).toBe('just now');
  });
});
