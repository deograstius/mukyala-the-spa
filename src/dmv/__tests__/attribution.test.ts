import { beforeEach, describe, expect, it } from 'vitest';
import { captureFirstTouch, getAttribution } from '../attribution';

function setUrl(query: string) {
  window.history.replaceState({}, '', `/tickets${query}`);
}

describe('dmv attribution capture', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setUrl('');
  });

  it('captures utm params and click ids from the landing URL', () => {
    setUrl('?utm_source=meta&utm_medium=cpc&utm_campaign=evt-dmv&gclid=Cj0KCQjw.abc-123');
    captureFirstTouch();
    setUrl('');
    expect(getAttribution()).toMatchObject({
      source: 'meta',
      medium: 'cpc',
      campaign: 'evt-dmv',
      gclid: 'Cj0KCQjw.abc-123',
    });
  });

  it('first touch wins: a later visit with different params never overwrites', () => {
    setUrl('?utm_source=meta&utm_campaign=first');
    captureFirstTouch();
    setUrl('?utm_source=google&utm_campaign=second');
    captureFirstTouch();
    expect(getAttribution()).toMatchObject({ source: 'meta', campaign: 'first' });
  });

  it('an empty visit does not claim the first-touch slot', () => {
    captureFirstTouch();
    setUrl('?utm_source=meta');
    captureFirstTouch();
    expect(getAttribution()).toMatchObject({ source: 'meta' });
  });

  it('returns undefined when nothing was ever captured', () => {
    captureFirstTouch();
    expect(getAttribution()).toBeUndefined();
  });

  it('drops PII-like utm tokens: emails and phone-like digit runs', () => {
    setUrl('?utm_source=someone@example.com&utm_campaign=3015550100&utm_medium=cpc');
    captureFirstTouch();
    const attr = getAttribution();
    expect(attr?.source).toBeUndefined();
    expect(attr?.campaign).toBeUndefined();
    expect(attr?.medium).toBe('cpc');
  });

  it('accepts digit-heavy click ids but rejects bad charsets', () => {
    setUrl('?gclid=1234567890123456&fbclid=bad%20token%20with%20spaces');
    captureFirstTouch();
    const attr = getAttribution();
    expect(attr?.gclid).toBe('1234567890123456');
    expect(attr?.fbclid).toBeUndefined();
  });

  it('caps oversized tokens instead of storing them raw', () => {
    setUrl(`?utm_term=${'x'.repeat(300)}&gclid=${'y'.repeat(300)}`);
    captureFirstTouch();
    const attr = getAttribution();
    expect(attr?.term).toHaveLength(120);
    expect(attr?.gclid).toBeUndefined();
  });

  it('falls back to the current URL when storage never captured (direct land)', () => {
    setUrl('?utm_source=friend-link');
    expect(getAttribution()).toMatchObject({ source: 'friend-link' });
  });
});
