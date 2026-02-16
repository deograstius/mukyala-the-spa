import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';

function AboutBlurb() {
  return (
    <Section className="section-pad-y-xl">
      <Container>
        <div className="w-layout-grid grid-2-columns _1fr---0-9fr">
          <h2 className="display-9">
            We are more than a day spa. We are a place to slow down and reset.
          </h2>

          <div className="inner-container _518px _100-tablet">
            <p className="paragraph-large">
              At Mukyala we blend timeless care with modern technique. Our licensed estheticians
              learn your preferences and tailor each visit with intention. You will be welcomed like
              an old friend and cared for like our only guest.
            </p>
          </div>

          <div className="mg-top-24px mg-top-8px-tablet">
            <div className="buttons-row left">
              <a href="/about" className="button-primary large w-inline-block">
                <div className="text-block">About us</div>
              </a>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default AboutBlurb;
