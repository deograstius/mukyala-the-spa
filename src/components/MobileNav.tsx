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
