/**
 * Static header copied from the Webflow export (home-v1).
 * We preserve the original class names so that the existing global CSS
 * continues to style the header without additional work.
 */

function Header() {
  return (
    <header className="header-wrapper w-nav" role="banner">
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
            <nav className="nav-menu-wrapper w-nav-menu" aria-label="Mobile nav">
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

                {/* Dropdown trigger placeholder */}
                <li className="link-nav-item">
                  <div className="dropdown-wrapper dropdown-default w-dropdown">
                    <button
                      type="button"
                      className="dropdown-toogle w-dropdown-toggle"
                      aria-haspopup="menu"
                      aria-expanded="false"
                    >
                      Pages <span className="icon-font-rounded dropdown-arrow"></span>
                    </button>
                  </div>
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
            <button type="button" className="hamburger-menu w-nav-button" aria-label="Open menu">
              <span className="hamburger-menu-flex" aria-hidden="true">
                <span className="hamburger-menu-line top" />
                <span className="hamburger-menu-line bottom" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
