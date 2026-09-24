import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { Link } from '@tanstack/react-router';

function AboutBlurb() {
  return (
    <Section className="section-pad-y-xl">
      <Container>
        <div className="w-layout-grid grid-2-columns _1fr---0-9fr">
          <h2 className="display-9">Luxury skin care for all.</h2>

          <div className="inner-container _518px _100-tablet">
            <p className="paragraph-large">
              Luxury should not depend on who you are or what your skin looks like. At Mukyala, a
              licensed esthetician looks at your skin, builds the facial around it, and sends you
              home with steps you can keep. Every skin is welcome here.
            </p>
          </div>

          <div className="mg-top-24px mg-top-8px-tablet">
            <div className="buttons-row left">
              <Link to="/about" preload="intent" className="button-primary large w-inline-block">
                <div className="text-block">About us</div>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default AboutBlurb;
