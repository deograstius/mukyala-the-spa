import { Link } from '@tanstack/react-router';

function NotFound() {
  return (
    <div className="utility-page-wrap">
      <div className="w-layout-blockcontainer container-default width-100 w-container">
        <div className="utility-page-content _404-not-found-content">
          {/* Card */}
          <div className="card _404-not-found-card">
            <div className="inner-container _670px text-center">
              <div className="display-12 text-neutral-800">404</div>
              <div className="mg-bottom-16px">
                <h1 className="display-12">Page not found.</h1>
              </div>
              <div className="mg-bottom-32px">
                <p className="paragraph-large">
                  Molestie accumsan arcu auctor cras auctor quam turpis ipsum tempus sed velit diam
                  iaculis aliquet eget fringilla nulla ut placerat sed placerat.
                </p>
              </div>
              <div className="buttons-row justify-center">
                <Link to="/" className="button-primary large w-inline-block">
                  <div className="text-block">Go back home</div>
                </Link>
              </div>
            </div>
          </div>

          {/* Decorative floating images (4) */}

          <div className="image-wrapper floating-image-v1 top-left" aria-hidden="true">
            <img
              src="/images/brown-makeup-brush-hair-x-webflow-template.jpg"
              srcSet="/images/brown-makeup-brush-hair-x-webflow-template-p-500.jpg 500w, /images/brown-makeup-brush-hair-x-webflow-template-p-800.jpg 800w, /images/brown-makeup-brush-hair-x-webflow-template-p-1080.jpg 1080w, /images/brown-makeup-brush-hair-x-webflow-template.jpg 1880w"
              sizes="(max-width: 479px) 52vw, 42vw"
              alt="Brown Makeup Brush Decorative"
              className="_w-h-100 fit-cover"
              loading="eager"
            />
          </div>

          <div className="image-wrapper floating-image-v2 top-right" aria-hidden="true">
            <img
              src="/images/close-up-of-cosmetic-hair-x-webflow-template.jpg"
              srcSet="/images/close-up-of-cosmetic-hair-x-webflow-template-p-500.jpg 500w, /images/close-up-of-cosmetic-hair-x-webflow-template-p-800.jpg 800w, /images/close-up-of-cosmetic-hair-x-webflow-template.jpg 1216w"
              sizes="(max-width: 479px) 28vw, (max-width: 767px) 32vw, 27vw"
              alt="Close Up Of Cosmetic Decorative"
              className="_w-h-100 fit-cover"
              loading="eager"
            />
          </div>

          <div className="image-wrapper floating-image-v2 bottom-left" aria-hidden="true">
            <img
              src="/images/makeup-natural-brush-hair-x-webflow-template.jpg"
              srcSet="/images/makeup-natural-brush-hair-x-webflow-template-p-500.jpg 500w, /images/makeup-natural-brush-hair-x-webflow-template-p-800.jpg 800w, /images/makeup-natural-brush-hair-x-webflow-template.jpg 1216w"
              sizes="(max-width: 479px) 28vw, (max-width: 767px) 32vw, 27vw"
              alt="Makeup Natural Brush Decorative"
              className="_w-h-100 fit-cover"
              loading="eager"
            />
          </div>

          <div className="image-wrapper floating-image-v1 bottom-right" aria-hidden="true">
            <img
              src="/images/makeup-hair-x-webflow-template.jpg"
              srcSet="/images/makeup-hair-x-webflow-template-p-500.jpg 500w, /images/makeup-hair-x-webflow-template-p-800.jpg 800w, /images/makeup-hair-x-webflow-template-p-1080.jpg 1080w, /images/makeup-hair-x-webflow-template.jpg 1880w"
              sizes="(max-width: 479px) 52vw, 42vw"
              alt="Makeup Decorative"
              className="_w-h-100 fit-cover"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
