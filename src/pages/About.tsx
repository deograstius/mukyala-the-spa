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
        sectionClassName="hero v8"
        containerClassName="z-index-1"
        bgImage={{
          src: '/images/about-hero.jpg',
          srcSet:
            '/images/about-hero-p-500.jpg 500w, /images/about-hero-p-800.jpg 800w, /images/about-hero-p-1080.jpg 1080w, /images/about-hero.jpg 1536w',
          sizes: '(max-width: 479px) 92vw, 100vw',
          alt: 'Mukyala storefront exterior — About Mukyala Day Spa',
        }}
        after={<div className="half-bg-bottom card-bg" />}
      />

      {/* Intro text under hero */}
      <Section>
        <Container>
          <div className="mg-top-80px">
            <div className="inner-container _440px">
              <h2 className="display-9">Our Story</h2>
            </div>
            <div className="mg-top-20px">
              <div className="w-layout-grid grid-2-columns about-hero-paragaph-grid">
                <div>
                  <p className="paragraph-large">
                    I’m Aryea Kalule, the founder of Mukyala Day Spa. Though I didn’t grow up
                    surrounded by luxury, I’ve always had a deep appreciation for it. Over the
                    years, I worked hard to build a space where elegance and care meet — a place
                    where everyone feels welcome.
                  </p>
                </div>
                <div>
                  <p className="paragraph-large">
                    I believe self care is one of the most beautiful luxuries we can give ourselves,
                    and it should be accessible to everyone. Mukyala Day Spa was born from this
                    belief: a space where timeless beauty, personal attention, and luxury are woven
                    into every detail. Welcoming you like an old friend, treating you like our only
                    guest.
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
                        Our app helps you choose treatments and products with AI backed
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
