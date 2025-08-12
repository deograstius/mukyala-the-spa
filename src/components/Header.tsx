import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import logoSrc from '/images/mukyala_logo.png';
import { FiShoppingBag } from 'react-icons/fi';
import { navLinks } from '../constants/navLinks';
import { useCart } from '../contexts/CartContext';
import MobileNav from './MobileNav';

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalCount } = useCart();

  // `navLinks` imported from constants; `Services` and dropdown remain separate

  return (
    <header className="header-wrapper w-nav" role="banner" data-collapse="medium">
      <div className="container-default w-container">
        <div className="header-container-wrapper">
          <nav className="nav-menu-left-side hidden-on-tablet" aria-label="Main navigation">
            <ul role="list" className="list-nav-menu hidden-on-tablet">
              {navLinks.map((l) => (
                <li key={l.path} className="link-nav-item">
                  <Link to={l.path} className="header-nav-link">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="nav-menu-center">
            <div className="logo-wrapper _94px">
              <Link to="/" className="logo-link w-inline-block">
                <img src={logoSrc} alt="Mukyala Day Spa Logo" />
              </Link>
            </div>
          </div>

          {/* Mobile hamburger button */}
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
            <nav className="nav-menu-wrapper w-nav-menu" aria-label="Main navigation">
              <ul role="list" className="list-nav-menu">
                {navLinks.map((l) => (
                  <li key={l.path} className="link-nav-item show-on-tablet">
                    <Link to={l.path} className="header-nav-link">
                      {l.label}
                    </Link>
                  </li>
                ))}
                <li className="link-nav-item">
                  <Link to="/services" className="header-nav-link">
                    Services
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="w-commerce-commercecartwrapper cart-button-wrapper left hidden-on-mobile">
              <a
                href="/checkout"
                aria-label="Open cart"
                role="button"
                className="w-commerce-commercecartopenlink header-nav-link cart-link w-inline-block"
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <FiShoppingBag aria-hidden="true" size={24} />
                <span className="visually-hidden">Cart</span>
                <span aria-hidden="true">(</span>
                <span className="w-commerce-commercecartopenlinkcount cart-quantity">
                  {totalCount}
                </span>
                <span aria-hidden="true">)</span>
              </a>
            </div>

            {/* Hamburger removed from here */}
          </div>
        </div>
      </div>
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <ul
          role="list"
          className="list-nav-menu"
          style={{ listStyle: 'none', margin: 0, padding: 0 }}
        >
          {navLinks.map((link) => (
            <li key={link.path} style={{ marginBottom: '1.25rem' }}>
              <Link to={link.path} className="header-nav-link" onClick={() => setMobileOpen(false)}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </MobileNav>
    </header>
  );
}

export default Header;
