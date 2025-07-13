/**
 * Static footer converted from the Webflow template.
 * Only the key CTA, newsletter form, logo and copyright block are included to
 * keep the first iteration lightweight. The multi-column “Pages / Utility
 * Pages” mega menu and decorative right-side image are omitted for now.
 */

function Footer() {
  return (
    <footer className="footer-wrapper">
      <div className="w-layout-blockcontainer container-default w-container">
        {/* CTA banner inside the footer */}
        <div className="card footer-card">
          <div className="inner-container _1140px">
            <div className="cta-footer-card">
              <div className="w-layout-grid grid-2-columns cta-footer-card-image-right">
                {/* Text + buttons */}
                <div>
                  <h2 className="display-8 mg-bottom-32px">
                    Ready for a revolutionary change of look?
                    <br />
                    We are here to make you shine like never before.
                  </h2>
                  <div className="buttons-row left wrap">
                    <a href="/reservation" className="button-primary large w-inline-block">
                      <div className="text-block">Make a reservation</div>
                    </a>
                    <a href="/services" className="link center-mbp w-inline-block">
                      <div>Browse services</div>
                      <div className="item-icon-right medium">
                        <div className="icon-font-rounded"></div>
                      </div>
                    </a>
                  </div>
                </div>
                {/* Placeholder for the decorative image – will be added later */}
              </div>
            </div>

            {/* Middle area – logo + newsletter */}
            <div className="footer-middle mg-top-64px">
              <div className="footer-logo---newsletter">
                <div>
                  <a href="/" className="logo-link w-inline-block">
                    <img
                      src="/images/logo-web-hair-x-webflow-template.svg"
                      alt="Mukyala Day Spa Logo"
                    />
                  </a>
                  <div className="mg-top-16px">
                    <p className="paragraph-medium">© Mukyala Day Spa – All rights reserved.</p>
                  </div>
                </div>

                {/* Newsletter – no backend yet, so we use a dummy handler */}
                <div className="mg-top-40px">
                  <form
                    className="newsletter-form"
                    onSubmit={(e) => {
                      e.preventDefault();

                      alert('Thanks for subscribing!');
                    }}
                  >
                    <label htmlFor="email-footer" className="mg-bottom-16px">
                      Subscribe to our newsletter!
                    </label>
                    <div className="input-wrapper">
                      <input
                        id="email-footer"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        required
                        className="input-line medium w-input"
                      />
                      <button
                        type="submit"
                        className="button-primary small inside-line-input medium w-button"
                      >
                        Subscribe
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
