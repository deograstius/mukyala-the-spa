import ButtonLink from '../../components/ui/ButtonLink';
import Container from '../../components/ui/Container';
import ResponsiveImage from '../../components/ui/ResponsiveImage';

function Hero() {
  return (
    <section>
      <Container>
        <div className="full-image-content hero-v1">
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

          <div className="image-wrapper full-section-image">
            <ResponsiveImage
              src="/images/beauty-and-wellness-hero-hair-x-webflow-template.jpg"
              srcSet="/images/beauty-and-wellness-hero-hair-x-webflow-template-p-500.jpg 500w,
                /images/beauty-and-wellness-hero-hair-x-webflow-template-p-800.jpg 800w,
                /images/beauty-and-wellness-hero-hair-x-webflow-template-p-1080.jpg 1080w,
                /images/beauty-and-wellness-hero-hair-x-webflow-template-p-1600.jpg 1600w,
                /images/beauty-and-wellness-hero-hair-x-webflow-template.jpg 2580w"
              sizes="(max-width: 479px) 92vw, 100vw"
              alt="Beauty And Wellness Hero"
              className="_w-h-100 fit-cover"
            />
          </div>
          <div className="bg-image-overlay" />
        </div>
      </Container>
    </section>
  );
}

export default Hero;
