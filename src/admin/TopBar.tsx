import { site } from '@data/site';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { FiLogOut, FiSettings } from 'react-icons/fi';
import logoSrc from '/images/mukyala_logo.png';
import MobileNav from '../components/MobileNav';
import { mainWebsiteUrl } from './config';

/**
 * Admin shell top bar (spec decisions #4/#5/#18b/#18c): the 3-item menu
 * (Main Website · Scan · Products — in-app routes highlight when active, the
 * external link never does) and the top-right GEAR opening the two-item menu
 * Settings · Sign out.
 *
 * Responsive choreography mirrors the customer header exactly (#18b): below
 * 992px the items collapse into the left hamburger opening the same MobileNav
 * slide-over the main site uses; logo centers; gear stays right. The
 * hamburger/nav classes and breakpoints all come from global.css.
 */
export default function TopBar({
  onOpenSettings,
  onSignOut,
}: {
  onOpenSettings: () => void;
  onSignOut: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    textAlign: 'left',
    width: '100%',
  };

  const navItems = (onNavigate?: () => void) => (
    <>
      <li className="link-nav-item">
        <a href={mainWebsiteUrl()} className="header-nav-link" data-cta-id="admin-nav-main-website">
          Main Website
        </a>
      </li>
      <li className="link-nav-item">
        <Link
          to="/scan"
          className="header-nav-link"
          activeProps={{ 'aria-current': 'page' }}
          onClick={onNavigate}
          data-cta-id="admin-nav-scan"
        >
          Scan
        </Link>
      </li>
      <li className="link-nav-item">
        <Link
          to="/products"
          className="header-nav-link"
          activeProps={{ 'aria-current': 'page' }}
          onClick={onNavigate}
          data-cta-id="admin-nav-products"
        >
          Products
        </Link>
      </li>
    </>
  );

  return (
    <header className="header-wrapper w-nav" role="banner" data-collapse="medium">
      <div className="container-default w-container">
        <div className="header-container-wrapper">
          <nav className="nav-menu-left-side hidden-on-tablet" aria-label="Admin navigation">
            <ul role="list" className="list-nav-menu hidden-on-tablet">
              {navItems()}
            </ul>
          </nav>

          <div className="nav-menu-center">
            <div className="logo-wrapper _94px">
              <img src={logoSrc} alt={site.logo.altText} />
            </div>
          </div>

          {/* Mobile hamburger — same classes/ordering as the customer header. */}
          <button
            type="button"
            className={`hamburger-menu w-nav-button${mobileOpen ? ' is-open' : ''}`}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className="hamburger-menu-flex" aria-hidden="true">
              <span className="hamburger-menu-line top" />
              <span className="hamburger-menu-line bottom" />
            </span>
          </button>

          <div className="nav-menu-right-side">
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                className="header-nav-link button-reset"
                aria-label="Settings menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
                data-cta-id="admin-settings-menu"
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <FiSettings aria-hidden="true" size={24} />
              </button>
              {menuOpen ? (
                <>
                  {/* Transparent backdrop: any outside tap closes the menu. */}
                  <div
                    onClick={() => setMenuOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    aria-hidden="true"
                  />
                  <div
                    role="menu"
                    aria-label="Settings"
                    className="card"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      zIndex: 41,
                      minWidth: 180,
                      padding: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      background: '#fff',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                    }}
                  >
                    <button
                      role="menuitem"
                      type="button"
                      className="button-reset header-nav-link"
                      style={menuItemStyle}
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenSettings();
                      }}
                      data-cta-id="admin-menu-settings"
                    >
                      <FiSettings aria-hidden="true" /> Settings
                    </button>
                    <button
                      role="menuitem"
                      type="button"
                      className="button-reset header-nav-link"
                      style={menuItemStyle}
                      onClick={() => {
                        setMenuOpen(false);
                        onSignOut();
                      }}
                      data-cta-id="admin-menu-sign-out"
                    >
                      <FiLogOut aria-hidden="true" /> Sign out
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <ul
          role="list"
          className="list-nav-menu"
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {navItems(() => setMobileOpen(false))}
        </ul>
      </MobileNav>
    </header>
  );
}
