import { site } from '@data/site';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { FiLogOut, FiSettings, FiUser } from 'react-icons/fi';
import logoSrc from '/images/mukyala_logo.png';
import { mainWebsiteUrl } from './config';

/**
 * Admin shell top bar (spec decisions #4/#5): logo, the 3-item menu
 * (Main Website · Scan · Products — in-app routes highlight when active, the
 * external link never does), and the top-right account icon opening a
 * two-item menu: Settings · Sign out.
 *
 * Layout is intentionally its own flex row (not the customer header's
 * grid/hamburger classes) so all three short items stay visible on the
 * phones staff actually scan with.
 */
export default function TopBar({
  onOpenSettings,
  onSignOut,
}: {
  onOpenSettings: () => void;
  onSignOut: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    textAlign: 'left',
    width: '100%',
  };

  return (
    <header className="header-wrapper" role="banner">
      <div className="container-default w-container">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px 16px',
            minHeight: 64,
          }}
        >
          <div className="logo-wrapper _94px" style={{ flexShrink: 0 }}>
            <img src={logoSrc} alt={site.logo.altText} />
          </div>
          <nav aria-label="Admin navigation" style={{ flex: 1, minWidth: 220 }}>
            <ul
              role="list"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px 20px',
                listStyle: 'none',
                margin: 0,
                padding: 0,
                justifyContent: 'center',
              }}
            >
              <li>
                <a
                  href={mainWebsiteUrl()}
                  className="header-nav-link"
                  data-cta-id="admin-nav-main-website"
                >
                  Main Website
                </a>
              </li>
              <li>
                <Link
                  to="/scan"
                  className="header-nav-link"
                  activeProps={{ 'aria-current': 'page' }}
                  data-cta-id="admin-nav-scan"
                >
                  Scan
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="header-nav-link"
                  activeProps={{ 'aria-current': 'page' }}
                  data-cta-id="admin-nav-products"
                >
                  Products
                </Link>
              </li>
            </ul>
          </nav>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              className="header-nav-link button-reset"
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              data-cta-id="admin-account-menu"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <FiUser aria-hidden="true" size={24} />
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
                  aria-label="Account"
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
    </header>
  );
}
