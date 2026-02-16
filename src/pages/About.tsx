import HeroSection from '@shared/sections/HeroSection';
import Container from '@shared/ui/Container';
import ResponsiveImage from '@shared/ui/ResponsiveImage';
import Reveal, { RevealStagger } from '@shared/ui/Reveal';
import Section from '@shared/ui/Section';
import ValueItem from '../components/ValueItem';

function About() {
  return (
    <>
      {/* Hero */}
      <HeroSection
        variant="image-only"
        sectionClassName="hero v8 hero-pad-bottom-xl"
        containerClassName="z-index-1"
        bgImage={{
          src: '/images/about-hero.jpg',
          srcSet:
            '/images/about-hero-p-500.jpg 500w, /images/about-hero-p-800.jpg 800w, /images/about-hero-p-1080.jpg 1080w, /images/about-hero.jpg 1536w',
          sizes: '(max-width: 479px) 92vw, 100vw',
          alt: 'Mukyala storefront exterior - About Mukyala Day Spa',
        }}
      />

      {/* Intro text under hero */}
      <Section className="about-story-section">
        <Container>
          <div className="mg-top-80px">
            <div className="inner-container _440px">
              <h2 className="display-9">Our Story</h2>
            </div>
            <div className="mg-top-20px">
              <div className="w-layout-grid grid-2-columns about-hero-paragaph-grid">
                <div>
                  <p className="paragraph-large">
                    I’m Aryea Kalule, founder of Mukyala Day Spa, and I did not take the straight
                    path into aesthetics.
                  </p>
                  <p className="paragraph-large mg-top-16px">
                    I graduated as an esthetician in 2023, later than planned, after getting married
                    and pushing through a season where everything felt behind schedule. School did
                    not always feel like it cared more about training than tuition, but I finished
                    anyway. I earned the skill, and I earned the right to keep going.
                  </p>
                </div>
                <div>
                  <p className="paragraph-large">
                    In 2024, I moved across the country and found myself in a strange in-between. I
                    was not fully practicing yet, but I was close enough to the industry to see how
                    the top actually moves. I started traveling, attending expos, and asking the
                    questions no one hands you answers to. I learned about professional treatments I
                    did not even know existed, like oxygen facials, and I kept asking what is best,
                    what is real, and what I can bring back to people like me.
                  </p>
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
      <Section>
        <Container>
          <div className="w-layout-grid grid-2-columns values-grid-2-col">
            <div className="inner-container _660px _100-tablet">
              <Reveal>
                <div className="image-wrapper border-radius-20px">
                  <ResponsiveImage
                    src="/images/custom-about-values.jpg"
                    srcSet="/images/custom-about-values-p-500.jpg 500w, /images/custom-about-values-p-800.jpg 800w, /images/custom-about-values.jpg 1024w"
                    sizes="(max-width: 479px) 92vw, (max-width: 991px) 100vw, (max-width: 1439px) 55vw, 660px"
                    alt="Portrait in a Mukyala treatment room"
                    className="image cover-image"
                  />
                </div>
              </Reveal>
            </div>
            <div className="inner-container _450px _100-tablet">
              <Reveal>
                <h2 className="display-9">The Work Values We Thrive For</h2>
              </Reveal>
              <div className="mg-top-48px">
                <div className="w-layout-grid grid-1-column gap-row-72px gap-row-24px-tablet">
                  <RevealStagger>
                    <ValueItem
                      iconSrc="/images/old-school-customer-service-icon-trimmed.png"
                      iconAlt="Customer service icon (preview PNG)"
                      title="Old School Customer Service"
                      iconWidth={66}
                      iconHeight={66}
                    >
                      <p className="paragraph-large">
                        We know our guests, including their names, preferences, and stories. Whether
                        you’re a longtime regular or here for the first time, you’ll be welcomed
                        with genuine warmth and attention.
                      </p>
                    </ValueItem>

                    <ValueItem
                      iconSrc="/images/pocket-watch-icon.png"
                      iconAlt="Pocket watch icon"
                      title="Luxury and Timeless Experiences"
                      iconWidth={50}
                      iconHeight={66}
                    >
                      <p className="paragraph-large">
                        Every visit is more than a service; it’s a moment of escape. From warm
                        essential oil towels to our serene, timeless decor, we ensure every detail
                        enhances your sense of wellbeing.
                      </p>
                    </ValueItem>

                    <ValueItem
                      iconSrc="/images/smartphone-icon.png"
                      iconAlt="Smartphone icon"
                      title="Technology That Enhances, Not Hurries"
                      iconWidth={44}
                      iconHeight={66}
                    >
                      <p className="paragraph-large">
                        Our app helps you choose treatments and products with AI-backed
                        recommendations, gentle reminders, and encouraging messages that are always
                        focused on care, not pressure.
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
