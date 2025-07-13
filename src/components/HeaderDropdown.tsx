import { useState, useRef, useEffect } from 'react';

/**
 * Accessible dropdown / popover used in the desktop header.
 * It is intentionally unstyled beyond minimal positioning – we keep the
 * original Webflow class names so existing CSS still applies.  The dropdown
 * will close when:
 *   • user clicks outside
 *   • user presses Escape
 */

interface HeaderDropdownProps {
  label: string;
  items: { href: string; label: string }[];
}

function HeaderDropdown({ label, items }: HeaderDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (open && wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on ESC
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keyup', handleKey);
    return () => document.removeEventListener('keyup', handleKey);
  }, [open]);

  return (
    <div ref={wrapperRef} className="dropdown-wrapper dropdown-default w-dropdown" data-open={open}>
      <button
        type="button"
        className="dropdown-toogle w-dropdown-toggle"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {label} <span className="icon-font-rounded dropdown-arrow"></span>
      </button>
      {open && (
        <nav
          className="dropdown-list w-dropdown-list"
          style={{
            position: 'absolute',
            marginTop: '0.5rem',
            background: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '1rem',
            borderRadius: 4,
          }}
          aria-label="submenu"
        >
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {items.map((item) => (
              <li key={item.href} style={{ marginBottom: '0.5rem' }}>
                <a href={item.href} className="header-nav-link" onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

export default HeaderDropdown;
