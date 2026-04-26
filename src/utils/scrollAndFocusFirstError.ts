/**
 * scrollAndFocusFirstError — focus + scroll-into-view the first invalid form
 * field after a Next/Submit click that failed validation.
 *
 * Architectural note (chunk: consultation-validation-focus-scroll-2026-04-26):
 * This utility is consumed by `src/pages/Consultation.tsx` (`handleNext` and
 * `handleSubmit`) but is intentionally generic so other forms can reuse it
 * later (Reservation, ManageNotifications). Out of scope for this chunk: do
 * NOT wire any other forms here.
 *
 * Why DOM ids and not a ref map?
 *   FormField (`src/shared/ui/forms/FormField.tsx`) already renders an `id`
 *   on the underlying input that matches the dotted field path used in the
 *   `errors` record (e.g. `personal.client_name`). YesNoField uses
 *   `${baseId}-yes` / `${baseId}-no` for its radios. So a DOM lookup keyed by
 *   the error path is the smallest viable reach. A ref map is only needed if
 *   the implementer discovers a control whose mounted id does not match the
 *   path — see resolveFieldElement fallback chain.
 *
 * Behaviour contract:
 *   1. Pick the first invalid path in `orderedPaths` that also appears in
 *      `errors`. If none, no-op.
 *   2. Resolve a DOM target for that path (see resolveFieldElement below).
 *   3. Smooth-scroll the target into view, accounting for any sticky header
 *      offset (computed from the visible validation banner if present, else 0).
 *   4. Move focus to the target. For radio groups (YesNoField), focus the
 *      first radio (`${baseId}-yes`); for checkbox groups, focus the first
 *      checkbox; for text inputs, focus the input itself.
 *   5. `aria-invalid="true"` is already handled by FormField when an error
 *      string is passed — this util does NOT toggle aria. It only moves
 *      focus/viewport.
 *
 * Non-goals:
 *   - No new error UI — reuse the existing `<span class="form-error">`.
 *   - No schema changes.
 *   - No new deps (no scroll-polyfill, no smooth-scroll-into-view-if-needed).
 */

export type FieldErrors = Readonly<Record<string, string | undefined>>;

export interface ScrollAndFocusOptions {
  /**
   * The error map keyed by dotted field path (matches the ids rendered by
   * FormField / YesNoField). Pass the full errors record from the caller —
   * this util will pick the first one that matches `orderedPaths`.
   */
  errors: FieldErrors;
  /**
   * Field paths in display order. The util walks this list and picks the
   * first path that has an entry in `errors`. Callers should use the
   * step's `stepRequiredFields(stepId, draft)` plus any extra format-level
   * paths (e.g. `personal.email` invalid format on Step 1).
   */
  orderedPaths: ReadonlyArray<string>;
  /**
   * Optional DOM root to query. Defaults to `document` when omitted.
   * Tests pass a container.
   */
  root?: Document | HTMLElement;
  /**
   * Optional override; when provided, used as the scroll-y offset. When
   * omitted the util computes from any visible validation banner.
   */
  scrollOffsetPx?: number;
}

export interface ScrollAndFocusResult {
  /** The path that was focused, or null when no error matched. */
  focusedPath: string | null;
  /** The DOM element focused, or null when nothing was found. */
  focusedElement: HTMLElement | null;
}

/**
 * Pick the first path in `orderedPaths` that has a non-empty error entry.
 * Pure helper — no DOM access. Exported for unit tests.
 */
export function pickFirstInvalidPath(
  orderedPaths: ReadonlyArray<string>,
  errors: FieldErrors,
): string | null {
  for (const path of orderedPaths) {
    const entry = errors[path];
    if (typeof entry === 'string' && entry.length > 0) {
      return path;
    }
  }
  return null;
}

/**
 * Sanitize a dotted field path the same way YesNoField/CheckboxGroup do
 * when constructing their DOM ids.
 */
function sanitizePathForId(path: string): string {
  return path.replace(/[^a-zA-Z0-9_-]/g, '-');
}

/**
 * Resolve the DOM element to focus for `path`.
 *
 * Resolution order:
 *   1. `[id="<path>"]`                  — InputField/SelectField/PhoneInput via FormField
 *   2. `[id="<sanitized-path>-yes"]`    — YesNoField first radio
 *   3. `[id^="<sanitized-path>-"]`      — CheckboxGroup first checkbox
 *   4. `[name="<path>"]`                — fallback by name attribute
 *   5. `[data-name="<path>"]`           — DatePickerField wrapper
 *   6. `[data-field="<path>"]`          — last-resort opt-in attribute
 *
 * Returns null when nothing matches — caller no-ops gracefully.
 */
export function resolveFieldElement(
  path: string,
  root: Document | HTMLElement = typeof document !== 'undefined'
    ? document
    : (undefined as unknown as Document),
): HTMLElement | null {
  if (!root) return null;
  const sanitized = sanitizePathForId(path);
  const escapedPath = cssEscape(path);
  const escapedSanitized = cssEscape(sanitized);

  // 1. Direct id match (FormField-provided controls).
  const byId = root.querySelector(`[id="${escapedPath}"]`);
  if (byId instanceof HTMLElement) return byId;

  // 2. YesNoField first radio.
  const byYes = root.querySelector(`[id="${escapedSanitized}-yes"]`);
  if (byYes instanceof HTMLElement) return byYes;

  // 3. CheckboxGroup first checkbox (id starts with "<sanitized>-").
  const byCheckbox = root.querySelector(`[id^="${escapedSanitized}-"]`);
  if (byCheckbox instanceof HTMLElement) return byCheckbox;

  // 4. Fallback by name attribute.
  const byName = root.querySelector(`[name="${escapedPath}"]`);
  if (byName instanceof HTMLElement) return byName;

  // 5. DatePickerField wrapper exposes data-name; the dotted DOB sub-paths
  //    (e.g. personal.dob_day) cannot resolve directly, so try the prefix
  //    before the trailing "_day" / "_month" / "_year".
  const dobPrefixMatch = path.match(/^(.*)_(?:day|month|year)$/);
  if (dobPrefixMatch) {
    const prefix = dobPrefixMatch[1];
    const escapedPrefix = cssEscape(prefix);
    const byDataName = root.querySelector(`[data-name="${escapedPrefix}"]`);
    if (byDataName instanceof HTMLElement) return byDataName;
  }
  const byDataNameDirect = root.querySelector(`[data-name="${escapedPath}"]`);
  if (byDataNameDirect instanceof HTMLElement) return byDataNameDirect;

  // 6. Last-resort opt-in attribute.
  const byDataField = root.querySelector(`[data-field="${escapedPath}"]`);
  if (byDataField instanceof HTMLElement) return byDataField;

  return null;
}

/**
 * Tiny CSS.escape shim — works in jsdom too.
 */
function cssEscape(value: string): string {
  if (typeof globalThis !== 'undefined') {
    const css = (globalThis as { CSS?: { escape?: (s: string) => string } }).CSS;
    if (css && typeof css.escape === 'function') {
      return css.escape(value);
    }
  }
  // Minimal fallback: escape double-quotes and backslashes for use inside
  // attribute selectors quoted with double quotes. The dotted paths we use
  // never contain those, but this keeps the helper safe.
  return value.replace(/["\\]/g, '\\$&');
}

/**
 * Returns true when the user has requested reduced motion via the OS / UA.
 * Defensive against jsdom (no matchMedia by default in older versions).
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Compute the sticky-offset to subtract from scroll position so the
 * focused field is not occluded by the visible validation banner. The
 * site has no fixed top nav on /consultation, so the banner is the only
 * candidate today.
 */
function computeStickyOffsetPx(root: Document | HTMLElement): number {
  if (!root) return 0;
  const banner = root.querySelector('.consultation-validation-banner');
  if (!(banner instanceof HTMLElement)) return 0;
  if (typeof banner.getBoundingClientRect !== 'function') return 0;
  try {
    const rect = banner.getBoundingClientRect();
    // Only treat the banner as occluding when it is rendered near the top
    // of the viewport. A negative top means it has already scrolled away.
    if (rect.top < 0) return 0;
    return Math.ceil(rect.height);
  } catch {
    return 0;
  }
}

/**
 * Scroll a single element into view + give it focus. Smooth scroll on
 * non-reduced-motion clients; instant otherwise.
 */
export function focusAndScrollIntoView(
  element: HTMLElement,
  options?: { offsetPx?: number; behavior?: ScrollBehavior },
): void {
  const reduce = prefersReducedMotion();
  const behavior: ScrollBehavior = options?.behavior ?? (reduce ? 'auto' : 'smooth');
  const offsetPx = options?.offsetPx ?? 0;

  // jsdom guard: scrollIntoView is not implemented by default.
  if (typeof element.scrollIntoView === 'function') {
    try {
      element.scrollIntoView({ behavior, block: 'center' });
    } catch {
      // Older Safari / jsdom may reject the options object — fall back.
      try {
        element.scrollIntoView();
      } catch {
        /* swallow */
      }
    }
  }

  // Apply the sticky-header offset after scrollIntoView lands the element
  // in viewport. window.scrollBy is also a no-op in jsdom but harmless.
  if (offsetPx > 0 && typeof window !== 'undefined' && typeof window.scrollBy === 'function') {
    try {
      window.scrollBy({ top: -offsetPx, behavior });
    } catch {
      try {
        window.scrollBy(0, -offsetPx);
      } catch {
        /* swallow */
      }
    }
  }

  // Focus without re-triggering scroll (we already positioned the page).
  if (typeof element.focus === 'function') {
    try {
      element.focus({ preventScroll: true });
    } catch {
      // Older browsers do not accept the options bag.
      try {
        element.focus();
      } catch {
        /* swallow */
      }
    }
  }
}

/**
 * Top-level entry point used by Consultation.tsx. Picks the first invalid
 * path, resolves the DOM target, scrolls + focuses it.
 *
 * Returns the path/element it acted on so callers can fire telemetry
 * (`consultation_validation_focus_first_error` — see pm_recommendations).
 */
export function scrollAndFocusFirstError(options: ScrollAndFocusOptions): ScrollAndFocusResult {
  const path = pickFirstInvalidPath(options.orderedPaths, options.errors);
  if (!path) return { focusedPath: null, focusedElement: null };

  const root: Document | HTMLElement =
    options.root ??
    (typeof document !== 'undefined' ? document : (undefined as unknown as Document));
  if (!root) return { focusedPath: path, focusedElement: null };

  const el = resolveFieldElement(path, root);
  if (!el) return { focusedPath: path, focusedElement: null };

  const offsetPx =
    typeof options.scrollOffsetPx === 'number'
      ? options.scrollOffsetPx
      : computeStickyOffsetPx(root);
  focusAndScrollIntoView(el, { offsetPx });
  return { focusedPath: path, focusedElement: el };
}
