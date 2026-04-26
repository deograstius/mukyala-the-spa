/**
 * Unit tests for scrollAndFocusFirstError
 * (chunk: `consultation-validation-focus-scroll-2026-04-26`).
 *
 * Filename retains the `*.todo.test.ts` convention used at the architect stage
 * for HANDOFF traceability through the architect → implementer → tester chain.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  focusAndScrollIntoView,
  pickFirstInvalidPath,
  resolveFieldElement,
  scrollAndFocusFirstError,
} from './scrollAndFocusFirstError';

/**
 * Build a detached HTMLElement from a markup string. Using a detached root
 * keeps tests fully isolated; resolveFieldElement accepts any HTMLElement
 * (or Document) as its query root.
 */
function makeRoot(html: string): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = html;
  document.body.appendChild(root);
  return root;
}

describe('pickFirstInvalidPath', () => {
  it('returns null when no path in orderedPaths has a non-empty error entry', () => {
    expect(pickFirstInvalidPath(['a', 'b', 'c'], { a: undefined, b: '', c: undefined })).toBeNull();
  });

  it('returns the first path whose errors[path] is a non-empty string, in orderedPaths order', () => {
    // orderedPaths order is canonical — the second path is the first with a
    // truthy error, so it should win even though a later path also has one.
    const errors = { a: undefined, b: 'Required', c: 'Bad format' };
    expect(pickFirstInvalidPath(['a', 'b', 'c'], errors)).toBe('b');
  });

  it('ignores empty-string error entries (treats "" as no error)', () => {
    const errors = { a: '', b: '', c: 'Required' };
    expect(pickFirstInvalidPath(['a', 'b', 'c'], errors)).toBe('c');
  });

  it('returns null for an empty orderedPaths array', () => {
    expect(pickFirstInvalidPath([], { a: 'Required' })).toBeNull();
  });
});

describe('resolveFieldElement', () => {
  let root: HTMLElement;

  afterEach(() => {
    root?.remove();
  });

  it('finds an InputField mounted via FormField by id="<path>" (e.g. personal.client_name)', () => {
    root = makeRoot(
      `<form>
         <input id="personal.client_name" name="personal.client_name" />
         <input id="personal.email" name="personal.email" />
       </form>`,
    );
    const el = resolveFieldElement('personal.client_name', root);
    expect(el).not.toBeNull();
    expect(el?.tagName).toBe('INPUT');
    expect(el?.getAttribute('id')).toBe('personal.client_name');
  });

  it('finds a YesNoField first radio by id="<sanitized-path>-yes" (e.g. health.diabetes-yes)', () => {
    // The util sanitizes any non [a-zA-Z0-9_-] character to "-", so dotted
    // paths like "health.diabetes" map to the radio id "health-diabetes-yes".
    root = makeRoot(
      `<fieldset>
         <input type="radio" id="health-diabetes-yes" name="health.diabetes" value="yes" />
         <input type="radio" id="health-diabetes-no" name="health.diabetes" value="no" />
       </fieldset>`,
    );
    const el = resolveFieldElement('health.diabetes', root);
    expect(el).not.toBeNull();
    expect(el?.getAttribute('id')).toBe('health-diabetes-yes');
  });

  it('returns null when no matching element exists in the root', () => {
    root = makeRoot(`<form><input id="someone-elses-field" /></form>`);
    expect(resolveFieldElement('personal.client_name', root)).toBeNull();
  });
});

describe('scrollAndFocusFirstError (integration)', () => {
  let root: HTMLElement;
  let scrollIntoViewSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // jsdom does not implement Element.prototype.scrollIntoView; install a
    // spy so the util's `typeof element.scrollIntoView === 'function'` guard
    // routes through the real call path. We attach to the prototype because
    // the util resolves elements via querySelector and then calls
    // scrollIntoView on the returned reference.
    scrollIntoViewSpy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoViewSpy,
    });
  });

  afterEach(() => {
    root?.remove();
    // Remove the spy so other tests (and future runs) start from a clean
    // jsdom slate. `delete` on a configurable prop is fine here.
    delete (HTMLElement.prototype as unknown as { scrollIntoView?: unknown }).scrollIntoView;
    vi.restoreAllMocks();
  });

  it('no-ops and returns focusedPath=null when errors map has no entry matching orderedPaths', () => {
    root = makeRoot(`<form><input id="personal.client_name" /></form>`);
    const result = scrollAndFocusFirstError({
      errors: { 'personal.client_name': '' },
      orderedPaths: ['personal.client_name'],
      root,
    });
    expect(result.focusedPath).toBeNull();
    expect(result.focusedElement).toBeNull();
    // No DOM side-effects when there is nothing to focus.
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(root.querySelector('#personal\\.client_name'));
  });

  it('focuses the resolved element and returns its path when one matches (single-error case)', () => {
    root = makeRoot(`<form><input id="personal.email" name="personal.email" /></form>`);
    const result = scrollAndFocusFirstError({
      errors: { 'personal.email': 'Enter a valid email' },
      orderedPaths: ['personal.email'],
      root,
    });
    const target = root.querySelector<HTMLInputElement>('#personal\\.email');
    expect(target).not.toBeNull();
    expect(result.focusedPath).toBe('personal.email');
    expect(result.focusedElement).toBe(target);
    // jsdom: assert document.activeElement.
    expect(document.activeElement).toBe(target);
    expect(scrollIntoViewSpy).toHaveBeenCalledTimes(1);
  });

  it('picks the FIRST invalid field in orderedPaths order (multi-error case)', () => {
    // Two separate errors live in the map. The util must focus the field that
    // comes first in `orderedPaths`, regardless of object-key order.
    root = makeRoot(
      `<form>
         <input id="personal.client_name" name="personal.client_name" />
         <input id="personal.email" name="personal.email" />
       </form>`,
    );
    const result = scrollAndFocusFirstError({
      errors: {
        'personal.email': 'Enter a valid email',
        'personal.client_name': 'Required',
      },
      orderedPaths: ['personal.client_name', 'personal.email'],
      root,
    });
    const firstTarget = root.querySelector<HTMLInputElement>('#personal\\.client_name');
    expect(result.focusedPath).toBe('personal.client_name');
    expect(result.focusedElement).toBe(firstTarget);
    expect(document.activeElement).toBe(firstTarget);
  });

  it('aria-invalid="true" wired by FormField is observable on the focused element', () => {
    // FormField sets aria-invalid / aria-describedby; the util does not toggle
    // them itself. This test confirms the wired markup we *expect* in
    // production survives the focus call (i.e. the util doesn't strip it).
    root = makeRoot(
      `<form>
         <input
           id="personal.email"
           name="personal.email"
           aria-invalid="true"
           aria-describedby="personal.email-error" />
         <span id="personal.email-error">Enter a valid email</span>
       </form>`,
    );
    scrollAndFocusFirstError({
      errors: { 'personal.email': 'Enter a valid email' },
      orderedPaths: ['personal.email'],
      root,
    });
    const target = root.querySelector<HTMLInputElement>('#personal\\.email');
    expect(target?.getAttribute('aria-invalid')).toBe('true');
    expect(target?.getAttribute('aria-describedby')).toBe('personal.email-error');
    // And the described-by id resolves to the actual error text node.
    const describedBy = target?.getAttribute('aria-describedby') ?? '';
    expect(root.querySelector(`#${CSS.escape(describedBy)}`)?.textContent).toBe(
      'Enter a valid email',
    );
  });

  it('respects sticky-header offset via scrollOffsetPx (calls window.scrollBy with negative top)', () => {
    root = makeRoot(`<form><input id="personal.email" name="personal.email" /></form>`);
    const scrollBySpy = vi.fn();
    Object.defineProperty(window, 'scrollBy', {
      configurable: true,
      writable: true,
      value: scrollBySpy,
    });
    try {
      scrollAndFocusFirstError({
        errors: { 'personal.email': 'Required' },
        orderedPaths: ['personal.email'],
        root,
        scrollOffsetPx: 64,
      });
      expect(scrollBySpy).toHaveBeenCalledTimes(1);
      const arg = scrollBySpy.mock.calls[0]?.[0];
      // window.scrollBy is invoked with an options object first; fall back to
      // positional form via the secondary catch path only if options threw.
      expect(arg).toMatchObject({ top: -64 });
    } finally {
      delete (window as unknown as { scrollBy?: unknown }).scrollBy;
    }
  });

  it('does not call window.scrollBy when no sticky offset applies (no banner, no override)', () => {
    root = makeRoot(`<form><input id="personal.email" name="personal.email" /></form>`);
    const scrollBySpy = vi.fn();
    Object.defineProperty(window, 'scrollBy', {
      configurable: true,
      writable: true,
      value: scrollBySpy,
    });
    try {
      scrollAndFocusFirstError({
        errors: { 'personal.email': 'Required' },
        orderedPaths: ['personal.email'],
        root,
      });
      // No `.consultation-validation-banner` is mounted, so the computed
      // offset is 0 and scrollBy must not be invoked.
      expect(scrollBySpy).not.toHaveBeenCalled();
    } finally {
      delete (window as unknown as { scrollBy?: unknown }).scrollBy;
    }
  });

  it('returns the path with focusedElement=null when DOM lookup fails (graceful no-op)', () => {
    // The errors map references a path that does not exist in the DOM.
    // The util should not throw; it should return the path it picked plus a
    // null element.
    root = makeRoot(`<form><input id="someone-elses-field" /></form>`);
    const result = scrollAndFocusFirstError({
      errors: { 'personal.client_name': 'Required' },
      orderedPaths: ['personal.client_name'],
      root,
    });
    expect(result.focusedPath).toBe('personal.client_name');
    expect(result.focusedElement).toBeNull();
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  });
});

describe('focusAndScrollIntoView', () => {
  let root: HTMLElement;
  let scrollIntoViewSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollIntoViewSpy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoViewSpy,
    });
  });

  afterEach(() => {
    root?.remove();
    delete (HTMLElement.prototype as unknown as { scrollIntoView?: unknown }).scrollIntoView;
    vi.restoreAllMocks();
  });

  it('uses behavior="auto" when matchMedia(prefers-reduced-motion: reduce) matches', () => {
    root = makeRoot(`<form><input id="personal.email" /></form>`);
    const target = root.querySelector<HTMLInputElement>('#personal\\.email')!;
    const matchMediaSpy = vi.fn().mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
      onchange: null,
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: matchMediaSpy,
    });
    try {
      focusAndScrollIntoView(target);
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: 'auto', block: 'center' });
    } finally {
      delete (window as unknown as { matchMedia?: unknown }).matchMedia;
    }
  });

  it('uses behavior="smooth" when reduced-motion is not requested', () => {
    root = makeRoot(`<form><input id="personal.email" /></form>`);
    const target = root.querySelector<HTMLInputElement>('#personal\\.email')!;
    const matchMediaSpy = vi.fn().mockReturnValue({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
      onchange: null,
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: matchMediaSpy,
    });
    try {
      focusAndScrollIntoView(target);
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    } finally {
      delete (window as unknown as { matchMedia?: unknown }).matchMedia;
    }
  });

  it('focuses the element with preventScroll:true so scrollIntoView keeps control of the viewport', () => {
    root = makeRoot(`<form><input id="personal.email" /></form>`);
    const target = root.querySelector<HTMLInputElement>('#personal\\.email')!;
    const focusSpy = vi.spyOn(target, 'focus');
    focusAndScrollIntoView(target);
    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });
});
