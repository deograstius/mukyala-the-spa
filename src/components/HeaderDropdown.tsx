import { useState, useRef, useEffect } from 'react';

interface HeaderDropdownProps {
  label: string;
  items: { href: string; label: string }[];
}

function HeaderDropdown({ label, items }: HeaderDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (open && wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

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
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <span style={{ marginRight: 4 }}>{label}</span>
        <span className="icon-font-rounded dropdown-arrow"></span>
      </button>
      {open && (
        <nav className="dropdown-list dropdown-v1 w-dropdown-list" aria-label="submenu">
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
