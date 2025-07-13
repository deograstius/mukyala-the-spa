/**
 * Static header copied from the Webflow export (home-v1).
 * We preserve the original class names so that the existing global CSS
 * continues to style the header without additional work.
 */

import { useState } from 'react';
import HeaderDropdown from './HeaderDropdown';
import MobileNav from './MobileNav';

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/shop', label: 'Shop' },
  ];

  return (
    <header className="header-wrapper w-nav" role="banner" data-collapse="medium">
      <div className="container-default w-container">
        <div className="header-container-wrapper">
          {/* Left desktop nav */}
          <nav className="nav-menu-left-side hidden-on-tablet" aria-label="Main navigation">
            <ul role="list" className="list-nav-menu hidden-on-tablet">
              <li className="link-nav-item">
                <a href="/" className="header-nav-link">
                  Home
                </a>
              </li>
              <li className="link-nav-item">
                <a href="/about" className="header-nav-link">
                  About
                </a>
              </li>
              <li className="link-nav-item">
                <a href="/shop" className="header-nav-link">
                  Shop
                </a>
              </li>
            </ul>
          </nav>

          {/* Center logo */}
          <div className="nav-menu-center">
            <div className="logo-wrapper _94px">
              <a href="/" className="logo-link w-inline-block">
                <img
                  src="/images/logo-web-hair-x-webflow-template.svg"
                  alt="Mukyala Day Spa Logo"
                />
              </a>
            </div>
          </div>

          {/* Right side nav & actions */}
          <div className="nav-menu-right-side">
            <nav className="nav-menu-wrapper" aria-label="Mobile nav">
              <ul role="list" className="list-nav-menu">
                <li className="link-nav-item show-on-tablet">
                  <a href="/" className="header-nav-link">
                    Home
                  </a>
                </li>
                <li className="link-nav-item show-on-tablet">
                  <a href="/about" className="header-nav-link">
                    About
                  </a>
                </li>
                <li className="link-nav-item show-on-tablet">
                  <a href="/shop" className="header-nav-link">
                    Shop
                  </a>
                </li>

                {/* Pages dropdown */}
                <li className="link-nav-item">
                  <HeaderDropdown
                    label="Pages"
                    items={[
                      { href: '/blog', label: 'Blog' },
                      { href: '/contact', label: 'Contact' },
                      { href: '/pricing', label: 'Pricing' },
                    ]}
                  />
                </li>
              </ul>
            </nav>

            {/* Cart button placeholder */}
            <div className="buttons-row gap-20px mg-left-24px hidden-on-mobile">
              <a
                href="/checkout"
                aria-label="Cart"
                className="secondary-button-icon diagonal-button-icon w-inline-block"
              >
                <span className="icon-font-rounded diagonal-button-icon"></span>
              </a>
            </div>

            {/* Hamburger menu (tablet & mobile) */}
            <button
              type="button"
              className="hamburger-menu w-nav-button"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <span className="hamburger-menu-flex" aria-hidden="true">
                <span className="hamburger-menu-line top" />
                <span className="hamburger-menu-line bottom" />
              </span>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile slide-in panel */}
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <ul
          role="list"
          className="list-nav-menu"
          style={{ listStyle: 'none', margin: 0, padding: 0 }}
        >
          {navLinks.map((link) => (
            <li key={link.href} style={{ marginBottom: '1.25rem' }}>
              <a href={link.href} className="header-nav-link" onClick={() => setMobileOpen(false)}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </MobileNav>
    </header>
  );
}

export default Header;
