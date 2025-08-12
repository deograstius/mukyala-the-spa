import logoSrc from '/images/mukyala_logo.png';
import Container from './ui/Container';

function Footer() {
  return (
    <footer className="footer-wrapper">
      <Container>
        <div className="card footer-card">
          <div className="inner-container _1140px">
            {/* CTA footer card removed as per design update */}

            <div className="footer-middle">
              <div className="footer-logo---newsletter">
                <div>
                  <a href="/" className="logo-link w-inline-block">
                    <img src={logoSrc} alt="Mukyala Day Spa Logo" />
                  </a>
                  <div className="mg-top-16px">
                    <p className="paragraph-medium">© Mukyala Day Spa – All rights reserved.</p>
                  </div>
                </div>

                {/* Newsletter signup removed per design update */}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
