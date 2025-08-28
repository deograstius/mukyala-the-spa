import logoSrc from '/images/mukyala_logo.png';
import Container from '@shared/ui/Container';
import { site } from '../data/site';

function Footer() {
  return (
    <footer className="footer-wrapper">
      <Container>
        <div className="card footer-card">
          <div className="inner-container _1140px">
            {/* Footer simplified: logo and copyright */}

            <div className="footer-middle">
              <div className="footer-logo---newsletter">
                <div>
                  <a href="/" className="logo-link w-inline-block">
                    <img src={logoSrc} alt={site.logo.altText} />
                  </a>
                  <div className="mg-top-16px">
                    <p className="paragraph-medium">© {site.name} – All rights reserved.</p>
                  </div>
                </div>

                {/* Newsletter signup intentionally omitted */}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
