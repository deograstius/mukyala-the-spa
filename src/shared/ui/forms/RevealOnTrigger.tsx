/**
 * RevealOnTrigger — animates a child in/out when `show` flips.
 *
 * Used to wrap every conditional-reveal field (medications list, alcohol
 * units, diabetes type, …) so they slide+fade in below their parent
 * question per operator decision in STATE.md (animate in below the
 * parent; do NOT render disabled placeholders).
 *
 * Animation:
 *   - 200ms slide-down + fade-in on enter
 *   - 200ms slide-up + fade-out on exit
 *   - Respects `prefers-reduced-motion: reduce` — falls back to instant
 *     show/hide.
 *
 * Implementation: CSS-first via `.consultation-reveal[data-shown]`
 * transitions in `global.css`. The component delays unmount until the
 * exit transition completes so the user sees the slide-up. When the user
 * prefers reduced motion, mount/unmount happens synchronously.
 *
 * Behavior on hide:
 *   - Children unmount AFTER the exit animation completes. React form
 *     state for the hidden field is cleared centrally by the wizard via
 *     `applyRevealClears` (see `consultation/schema.ts`); this component
 *     does NOT manage value clearing itself.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';

const EXIT_MS = 200;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface RevealOnTriggerProps {
  show: boolean;
  /** Optional className passed through to the wrapper. */
  className?: string;
  /** Children rendered inside the animated wrapper. */
  children: ReactNode;
  /**
   * When true, children stay mounted and only visibility is toggled. Default
   * false — children unmount on hide so form values fully clear.
   */
  keepMounted?: boolean;
  /** Test hook. */
  'data-testid'?: string;
}

export default function RevealOnTrigger({
  show,
  className,
  children,
  keepMounted = false,
  'data-testid': testId,
}: RevealOnTriggerProps) {
  const [mounted, setMounted] = useState(show);
  const [shown, setShown] = useState(show);
  const exitTimer = useRef<number | null>(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();

    if (show) {
      // Cancel any pending exit unmount.
      if (exitTimer.current !== null) {
        window.clearTimeout(exitTimer.current);
        exitTimer.current = null;
      }
      setMounted(true);
      if (reduced) {
        setShown(true);
      } else {
        // Defer the data-shown flip to the next animation frame so the
        // CSS transition has a starting state to animate from.
        const handle = window.requestAnimationFrame(() => setShown(true));
        return () => window.cancelAnimationFrame(handle);
      }
      return;
    }

    // show === false
    setShown(false);
    if (reduced || keepMounted) {
      if (!keepMounted) setMounted(false);
      return;
    }
    if (mounted) {
      exitTimer.current = window.setTimeout(() => {
        setMounted(false);
        exitTimer.current = null;
      }, EXIT_MS);
    }
  }, [show, mounted, keepMounted]);

  useEffect(
    () => () => {
      if (exitTimer.current !== null) {
        window.clearTimeout(exitTimer.current);
      }
    },
    [],
  );

  if (!keepMounted && !mounted) return null;

  const hidden = !show && keepMounted;

  return (
    <div
      className={className ? `consultation-reveal ${className}` : 'consultation-reveal'}
      data-shown={shown ? 'true' : 'false'}
      data-testid={testId}
      hidden={hidden || undefined}
      aria-hidden={hidden || undefined}
    >
      {children}
    </div>
  );
}
