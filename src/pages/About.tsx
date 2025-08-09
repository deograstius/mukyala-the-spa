function About() {
  return (
    <>
      {/* Hero */}
      <section className="section hero v8">
        <div className="w-layout-blockcontainer container-default z-index-1 w-container">
          <div className="full-image-content hero-v8">
            {/* Image-only hero for About page */}
            <div className="image-wrapper full-section-image">
              <img
                src="/images/custom-hero.jpg"
                srcSet="/images/custom-hero-p-500.jpg 500w, /images/custom-hero-p-800.jpg 800w, /images/custom-hero-p-1080.jpg 1080w, /images/custom-hero.jpg 1536w"
                sizes="(max-width: 479px) 92vw, 100vw"
                alt="Mukyala Day Spa"
                className="_w-h-100 fit-cover"
              />
            </div>
          </div>

          {/* Intro text under hero */}
          <div className="mg-top-80px">
            <div className="inner-container _440px">
              <h2 className="display-9">Our Story: From Liberia to Luxury</h2>
            </div>
            <div className="mg-top-20px">
              <div className="w-layout-grid grid-2-columns about-hero-paragaph-grid">
                <div>
                  <p className="paragraph-large">
                    I’m Aryea Kalule, the founder of Mukyala Day Spa. I was born in Liberia in the
                    90s and moved to the United States when I was around 9 years old. Though I
                    didn’t grow up surrounded by luxury, I’ve always had a deep appreciation for it.
                    Over the years, I worked hard to build a life where I could share that love of
                    elegance and care with others.
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
        </div>
        <div className="half-bg-bottom card-bg" />
      </section>

      {/* Values section */}
      <section className="section">
        <div className="w-layout-blockcontainer container-default w-container">
          <div className="w-layout-grid grid-2-columns values-grid-2-col">
            <div className="inner-container _660px _100-tablet">
              <div className="image-wrapper border-radius-20px">
                <img
                  src="/images/custom-about-values.jpg"
                  srcSet="/images/custom-about-values-p-500.jpg 500w, /images/custom-about-values-p-800.jpg 800w, /images/custom-about-values.jpg 1024w"
                  sizes="(max-width: 479px) 92vw, (max-width: 991px) 100vw, (max-width: 1439px) 55vw, 660px"
                  alt="Values we thrive for"
                  className="image cover-image"
                />
              </div>
            </div>
            <div className="inner-container _450px _100-tablet">
              <h2 className="display-9">The Work Values We Thrive For</h2>
              <div className="mg-top-48px">
                <div className="w-layout-grid grid-1-column gap-row-72px gap-row-24px-tablet">
                  <div className="our-values-icon-left-container">
                    <img
                      src="/images/old-school-customer-service-icon.svg"
                      alt="Customer service icon"
                      width={22}
                      height={22}
                      className="our-values-icon-left-margin"
                    />
                    <div>
                      <h3 className="display-7">Old School Customer Service</h3>
                      <div className="mg-top-8px">
                        <p className="paragraph-large">
                          We know our guests, including their names, preferences, and stories.
                          Whether you’re a longtime regular or here for the first time, you’ll be
                          welcomed with genuine warmth and attention.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="our-values-icon-left-container">
                    <img
                      src="/images/crueltry-free-icon-hair-x-webflow-template.svg"
                      alt="Cruelty free icon"
                      className="our-values-icon-left-margin"
                    />
                    <div>
                      <h3 className="display-7">Luxury and Timeless Experiences</h3>
                      <div className="mg-top-8px">
                        <p className="paragraph-large">
                          Every visit is more than a service; it’s a moment of escape. From warm
                          essential oil towels to our serene, timeless decor, we ensure every detail
                          enhances your sense of wellbeing.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="our-values-icon-left-container">
                    <img
                      src="/images/passion-icon-hair-x-webflow-template.svg"
                      alt="Passion icon"
                      className="our-values-icon-left-margin"
                    />
                    <div>
                      <h3 className="display-7">Technology That Enhances, Not Hurries</h3>
                      <div className="mg-top-8px">
                        <p className="paragraph-large">
                          Our app helps you choose treatments and products with AI backed
                          recommendations, gentle reminders, and encouraging messages that are
                          always focused on care, not pressure.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default About;
