function Hero() {
  return (
    <section>
      <div className="w-layout-blockcontainer container-default w-container">
        <div className="full-image-content hero-v1">
          <div className="w-layout-grid grid-2-columns hero-v1-grid">
            <div className="inner-container _842px">
              <h1 className="display-11 text-neutral-100">
                Experience beauty and wellness like never before
              </h1>
            </div>
            <a href="/reservation" className="button-primary large white w-inline-block">
              <div className="text-block">Make a reservation</div>
            </a>
          </div>

          <div className="image-wrapper full-section-image">
            <img
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
      </div>
    </section>
  );
}

export default Hero;
