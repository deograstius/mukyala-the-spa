import { useEffect, useRef } from 'react';

/**
 * Slide-in mobile navigation panel.
 *
 * The component is purposely very small – it renders its children inside a
 * fixed panel that slides in from the right while an overlay darkens the rest
 * of the screen.  Animation is implemented with a tiny bit of inline CSS so
 * we don’t need to pull additional dependencies (Framer-Motion will be added
 * later anyway).
 *
 * Props
 * -----
 * open   – whether the nav is visible or not.
 * onClose() – callback fired when the user clicks outside / presses esc.
 *
 * Usage (inside Header):
 *   const [open, setOpen] = useState(false);
 *   <MobileNav open={open} onClose={() => setOpen(false)}>
 *     ...links...
 *   </MobileNav>
 */

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function MobileNav({ open, onClose, children }: MobileNavProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close when user presses ESC
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

  // Prevent background scroll when menu is open
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

  // Accessibility: focus trap very lightweight – move initial focus inside
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
      // Using the exact Webflow overlay class keeps default styling (semi-transparent bg)
      className="mobile-nav-overlay"
      onClick={(e) => {
        // close when clicking outside the panel
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
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
          padding: '2rem 1.5rem',
          boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
          transform: 'translateX(0)',
          animation: 'slideIn 250ms ease-out',
        }}
      >
        {children}
      </nav>

      {/* tiny keyframes for the panel */}
      <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
    </div>
  );
}

export default MobileNav;
