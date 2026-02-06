import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';

function AboutBlurb() {
  return (
    <Section className="section-pad-y-xl">
      <Container>
        <div className="w-layout-grid grid-2-columns _1fr---0-9fr">
          <h2 className="display-9">
            We are more than a beauty salon, we are a place where you can enjoy and relax
          </h2>

          <div className="inner-container _518px _100-tablet">
            <p className="paragraph-large">
              At Mukyala we blend timeless elegance with inclusive care, delivering rejuvenating
              treatments that honour both tradition and technology. Our therapists know every guest
              by name, crafting personalised rituals that leave you glowing long after you walk out
              our doors.
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
