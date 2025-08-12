import { useEffect, useRef } from 'react';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function MobileNav({ open, onClose, children }: MobileNavProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (open) {
      window.addEventListener('keyup', handleKey);
    }
    return () => window.removeEventListener('keyup', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      const { overflow } = document.body.style;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = overflow;
      };
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (open && overlayRef.current) {
      const firstLink = overlayRef.current.querySelector<HTMLElement>('a, button');
      firstLink?.focus();
    }
  }, [open]);

  // Simple focus trap to keep tabbing inside the panel
  useEffect(() => {
    if (!open || !overlayRef.current) return;
    const overlay = overlayRef.current;
    const panel = overlay.querySelector<HTMLElement>('[aria-label="Mobile navigation"]') || overlay;

    function getFocusable(): HTMLElement[] {
      const nodes = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      return Array.from(nodes).filter(
        (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'),
      );
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusables = getFocusable();
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
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      className="mobile-nav-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-start',
      }}
    >
      <nav
        aria-label="Mobile navigation"
        className="mobile-nav-panel"
        style={{
          width: '80%',
          maxWidth: 320,
          height: '100%',
          backgroundColor: '#fff',
          padding: '6rem 1.5rem 2rem' /* extra top padding for better visual balance */,
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          transform: 'translateX(0)',
          animation: 'slideInLeft 250ms ease-out',
        }}
      >
        {children}
      </nav>
      <style>{`
          @keyframes slideInLeft {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }
        `}</style>
    </div>
  );
}

export default MobileNav;
