import React, { useEffect, useMemo, useRef } from 'react';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  /** Optional selector to identify the panel container inside children for focus trap */
  panelSelector?: string; // defaults to '[data-dialog-panel]'
  /** Whether to lock body scroll while open (default: true) */
  lockScroll?: boolean;
  /** Keep the dialog mounted during close to allow exit animations */
  stayMountedOnClose?: boolean;
}

function getFocusableWithin(root: HTMLElement): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>(
    'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'),
  );
}

export default function Dialog({
  open,
  onClose,
  children,
  ariaLabel,
  ariaLabelledBy,
  panelSelector = '[data-dialog-panel]',
  lockScroll = true,
  stayMountedOnClose = false,
}: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const labelledProps = useMemo(() => {
    if (ariaLabelledBy) return { 'aria-labelledby': ariaLabelledBy };
    if (ariaLabel) return { 'aria-label': ariaLabel };
    return {} as Record<string, string>;
  }, [ariaLabel, ariaLabelledBy]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) window.addEventListener('keyup', onKey);
    return () => window.removeEventListener('keyup', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    openerRef.current = (document.activeElement as HTMLElement) || null;
    // Focus first focusable
    const scope = overlayRef.current;
    const first = scope ? getFocusableWithin(scope)[0] : undefined;
    first?.focus();
    return () => {
      // restore focus
      openerRef.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open || !lockScroll) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open, lockScroll]);

  // Focus trap
  useEffect(() => {
    if (!open || !overlayRef.current) return;
    const overlay = overlayRef.current;
    const panel = overlay.querySelector<HTMLElement>(panelSelector) || overlay;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusables = getFocusableWithin(panel);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !panel.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    overlay.addEventListener('keydown', onKeyDown);
    return () => overlay.removeEventListener('keydown', onKeyDown);
  }, [open, panelSelector]);

  if (!open && !stayMountedOnClose) return null;

  const overlayAnimClass = open ? 'anim-fade-in' : stayMountedOnClose ? 'anim-fade-out' : '';

  return (
    <div
      ref={overlayRef}
      role={open ? 'dialog' : 'presentation'}
      aria-modal={open ? 'true' : undefined}
      aria-hidden={open ? undefined : true}
      className={overlayAnimClass}
      {...labelledProps}
      onClick={(e) => {
        if (open && e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 1100,
        willChange: 'opacity',
      }}
    >
      {children}
    </div>
  );
}
