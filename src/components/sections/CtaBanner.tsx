function CtaBanner() {
  return (
    <section className="section">
      <div className="w-layout-blockcontainer container-default w-container">
        <div className="card cta-v1">
          <div className="w-layout-grid grid-2-columns gap-row-32px">
            {/* Text & buttons */}
            <div className="inner-container _640px">
              <h2 className="display-8 mg-bottom-32px">
                Ready for a revolutionary change of look?
                <br />
                We are here to make you shine like never before.
              </h2>
              <div className="buttons-row left wrap">
                <a href="/reservation" className="button-primary large w-inline-block">
                  <div className="text-block">Make a reservation</div>
                </a>
                <a href="/services" className="link center-mbp w-inline-block">
                  <div>Browse services</div>
                  <div className="item-icon-right medium">
                    <div className="icon-font-rounded"></div>
                  </div>
                </a>
              </div>
            </div>

            {/* Decorative image */}
            <div className="image-wrapper">
              <img
                src="/images/brush-hair-beauty-salon-hair-x-webflow-template.jpg"
                srcSet="/images/brush-hair-beauty-salon-hair-x-webflow-template-p-500.jpg 500w,
                  /images/brush-hair-beauty-salon-hair-x-webflow-template-p-800.jpg 800w,
                  /images/brush-hair-beauty-salon-hair-x-webflow-template.jpg 1202w"
                sizes="(max-width: 991px) 100vw, 50vw"
                alt="Brush hair beauty salon"
                className="_w-h-100 fit-cover"
                loading="lazy"
              />
              <div className="bg-image-overlay overlay-15" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CtaBanner;
