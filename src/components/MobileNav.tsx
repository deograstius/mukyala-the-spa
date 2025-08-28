import SlideOver from '@shared/a11y/SlideOver';
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
    <SlideOver
      open={open}
      onClose={onClose}
      ariaLabel="Mobile navigation"
      side="left"
      width="80%"
      panelAs="nav"
      panelClassName="mobile-nav-panel"
      panelStyle={{
        maxWidth: 320,
        height: '100%',
        padding: '6rem 1.5rem 2rem',
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        transform: 'translateX(0)',
      }}
    >
      {children}
    </SlideOver>
  );
}

export default MobileNav;
