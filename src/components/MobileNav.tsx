import Dialog from '@shared/a11y/Dialog';
import React from 'react';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function MobileNav({ open, onClose, children }: MobileNavProps) {
  // reserved for future needs if we need a ref; not used currently

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      ariaLabel="Mobile navigation"
      panelSelector="[data-dialog-panel]"
    >
      <nav
        aria-label="Mobile navigation"
        data-dialog-panel
        className="mobile-nav-panel"
        style={{
          width: '80%',
          maxWidth: 320,
          height: '100%',
          backgroundColor: '#fff',
          padding: '6rem 1.5rem 2rem',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          transform: 'translateX(0)',
          animation: 'slideInLeft 250ms ease-out',
        }}
      >
        {children}
      </nav>
      <style>{`
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      `}</style>
    </Dialog>
  );
}

export default MobileNav;
