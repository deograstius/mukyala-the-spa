import HeroSection from '@shared/sections/HeroSection';
import ButtonLink from '@shared/ui/ButtonLink';

function Hero() {
  return (
    <HeroSection
      variant="background"
      overlayClassName="bg-image-overlay"
      bgImage={{
        src: '/images/beauty-and-wellness-hero-hair-x-webflow-template.jpg',
        srcSet:
          '/images/beauty-and-wellness-hero-hair-x-webflow-template-p-500.jpg 500w, /images/beauty-and-wellness-hero-hair-x-webflow-template-p-800.jpg 800w, /images/beauty-and-wellness-hero-hair-x-webflow-template-p-1080.jpg 1080w, /images/beauty-and-wellness-hero-hair-x-webflow-template-p-1600.jpg 1600w, /images/beauty-and-wellness-hero-hair-x-webflow-template.jpg 2580w',
        sizes: '(max-width: 479px) 92vw, 100vw',
        alt: 'Beauty And Wellness Hero',
      }}
    >
      <div className="w-layout-grid grid-2-columns hero-v1-grid">
        <div className="inner-container _842px">
          <h1 className="display-11 text-neutral-100">
            Experience beauty and wellness like never before
          </h1>
        </div>
        <ButtonLink href="/reservation" size="large" variant="white">
          <div className="text-block">Make a reservation</div>
        </ButtonLink>
      </div>
    </HeroSection>
  );
}

export default Hero;
