import HeroSection from '@shared/sections/HeroSection';
import Container from '@shared/ui/Container';
import ResponsiveImage from '@shared/ui/ResponsiveImage';
import Reveal, { RevealStagger } from '@shared/ui/Reveal';
import Section from '@shared/ui/Section';
import { useEffect } from 'react';
import { setBaseTitle } from '../app/seo';
import ValueItem from '../components/ValueItem';

function About() {
  useEffect(() => {
    setBaseTitle('About');
  }, []);

  return (
    <>
      {/* Hero — interim image (operator decision 2026-09-14): the treatment
          room with the Mukyala neon sign, until purpose-shot About imagery
          lands. The prior storefront photo led with the shared building's
          "Village Aesthetics Group" signage (another company's brand). */}
      <HeroSection
        variant="image-only"
        sectionClassName="hero v8"
        containerClassName="z-index-1"
        bgImage={{
          src: '/images/carlsbad-location-exterior.jpg',
          srcSet:
            '/images/carlsbad-location-exterior-p-500.jpg 500w, /images/carlsbad-location-exterior-p-800.jpg 800w, /images/carlsbad-location-exterior.jpg 1480w',
          sizes: '(max-width: 479px) 92vw, 100vw',
          alt: 'Mukyala treatment room with illuminated sign - About Mukyala The Spa',
        }}
      />

      {/* Intro text under hero */}
      <Section className="about-story-section">
        <Container>
          <div>
            <div className="inner-container _440px">
              <h2 className="display-9">Our story</h2>
            </div>
            <div className="mg-top-20px">
              <div className="inner-container _660px">
                <p className="paragraph-large">
                  I’m Aryea Kalule, founder of Mukyala The Spa, and I did not take the straight path
                  into esthetics.
                </p>
              </div>
            </div>
            <div className="mg-top-20px">
              <div className="w-layout-grid grid-2-columns about-hero-paragaph-grid">
                <div>
                  <p className="paragraph-large mg-top-16px">
                    I graduated as an esthetician in 2023, later than planned, after getting married
                    and pushing through a season where everything felt behind schedule. School often
                    felt like it cared more about tuition than training, but I finished anyway. I
                    earned the skill, and I earned the right to keep going.
                  </p>
                  <p className="paragraph-large mg-top-16px">
                    In 2024, I moved across the country and found myself in a strange in-between. I
                    was not fully practicing yet, but I was close enough to the industry to see how
                    the top actually moves. I started traveling, attending expos, and asking the
                    questions no one hands you answers to. I learned about professional treatments I
                    did not even know existed, like oxygen facials, and I kept asking what is best,
                    what is real, and what I can bring back to people like me.
                  </p>
                </div>
                <div>
                  <p className="paragraph-large mg-top-16px">
                    Access to high-level skincare education is not evenly distributed. In too many
                    spaces, melanated skin is an afterthought, even though we have every skin
                    texture and every skin concern. I’ve seen how lack of education and lack of
                    precision can hurt our communities, including unsafe use of harsh lightening
                    agents that can leave uneven patches and long-term damage.
                  </p>
                  <p className="paragraph-large mg-top-16px">
                    Mukyala was built to change that. We blend luxury with truth: science-based
                    skincare, balanced formulas, professional techniques, and clear education,
                    without kitchen experiments or chasing trends. You’ll be welcomed like an old
                    friend and treated like our only guest. The goal is not to cover you up, it’s to
                    help you get to healthy skin you feel proud of.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Values section */}
      <Section className="about-values-section">
        <Container>
          <div className="w-layout-grid grid-2-columns values-grid-2-col">
            <div className="inner-container _660px _100-tablet">
              <Reveal>
                <div className="image-wrapper border-radius-20px">
                  <ResponsiveImage
                    src="/images/custom-about-values.jpg"
                    srcSet="/images/custom-about-values-p-500.jpg 500w, /images/custom-about-values-p-800.jpg 800w, /images/custom-about-values.jpg 1024w"
                    sizes="(max-width: 479px) 92vw, (max-width: 991px) 100vw, (max-width: 1439px) 55vw, 660px"
                    alt="Aryea, licensed esthetician, standing in the spa hallway in her white coat"
                    className="image cover-image"
                  />
                </div>
              </Reveal>
            </div>
            <div className="inner-container _450px _100-tablet">
              <Reveal>
                <h2 className="display-9">The values we strive for</h2>
              </Reveal>
              <div className="mg-top-48px">
                <div className="w-layout-grid grid-1-column gap-row-72px gap-row-24px-tablet">
                  <RevealStagger>
                    <ValueItem
                      iconSrc="/images/value-service-bell.png"
                      iconAlt="Service bell"
                      title="Old School Customer Service"
                      iconWidth={64}
                      iconHeight={64}
                    >
                      <p className="paragraph-large">
                        We learn your name, your skin, and what you are working toward. First visit
                        or fiftieth, you get the same attention.
                      </p>
                    </ValueItem>

                    <ValueItem
                      iconSrc="/images/value-sparkle.png"
                      iconAlt="Sparkle"
                      title="Luxury, Done Properly"
                      iconWidth={64}
                      iconHeight={64}
                    >
                      <p className="paragraph-large">
                        Warm towels, a quiet room, products that earn their place. Every detail is
                        there because it helps your skin, not because it looks the part.
                      </p>
                    </ValueItem>

                    <ValueItem
                      iconSrc="/images/value-every-skin.png"
                      iconAlt="Three faces in profile"
                      title="Skin Care for Every Skin"
                      iconWidth={64}
                      iconHeight={64}
                    >
                      <p className="paragraph-large">
                        Melanated skin, sensitive skin, skin that has been burned by bad advice.
                        Luxury skin care should be for everyone, so that is what we built.
                      </p>
                    </ValueItem>
                  </RevealStagger>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

export default About;
