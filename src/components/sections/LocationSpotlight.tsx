function LocationSpotlight() {
  return (
    <section className="section">
      <div className="w-layout-blockcontainer container-default w-container">
        <div className="inner-container _580px center">
          <div className="text-center">
            <h2 className="display-9">Our location</h2>
          </div>
        </div>

        <div className="mg-top-40px">
          <div className="w-layout-grid grid-2-columns location-image-right">
            {/* Content card */}
            <div className="card location-card-content-side">
              <h2 className="display-9">Mukyala Day Spa – Carlsbad Village</h2>

              <div className="mg-top-40px">
                <div className="grid-1-column gap-row-20px">
                  {/* Address */}
                  <div className="flex-horizontal bullet-point-left">
                    <div className="decoration-dot bullet-point mg-right-14px" />
                    <div className="inner-container _298px">
                      <a
                        href="https://www.google.com/maps/place/2951+State+St,+Carlsbad,+CA+92008"
                        target="_blank"
                        rel="noreferrer noopener"
                        className="location-info-link w-inline-block"
                      >
                        <div className="paragraph-large">
                          2951 State Street, Carlsbad, CA 92008, United States
                        </div>
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex-horizontal bullet-point-left">
                    <div className="decoration-dot bullet-point mg-right-14px" />
                    <a href="tel:+17608701087" className="location-info-link w-inline-block">
                      <div className="paragraph-large">(760) 870 1087</div>
                    </a>
                  </div>

                  {/* Email */}
                  <div className="flex-horizontal bullet-point-left">
                    <div className="decoration-dot bullet-point mg-right-14px" />
                    <a href="mailto:info@mukyala.com" className="location-info-link w-inline-block">
                      <div className="paragraph-large">info@mukyala.com</div>
                    </a>
                  </div>

                  {/* Hours */}
                  <div className="flex-horizontal bullet-point-left">
                    <div className="decoration-dot bullet-point mg-right-14px" />
                    <div className="flex gap-column-28px---row-4px children-wrap">
                      <div className="paragraph-large">Mon to Fri: 10 am to 6 pm</div>
                      <div className="paragraph-large">Sat and Sun: 10 am to 6 pm</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="image-wrapper border-radius-20px">
              <img
                src="/images/carlsbad-location-exterior.jpg"
                srcSet="/images/carlsbad-location-exterior-p-500.jpg 500w, /images/carlsbad-location-exterior-p-800.jpg 800w, /images/carlsbad-location-exterior.jpg 1480w"
                sizes="(max-width: 479px) 92vw, (max-width: 991px) 100vw, (max-width: 1439px) 57vw, 58vw"
                alt="Carlsbad spa location exterior"
                className="_w-h-100 fit-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LocationSpotlight;
