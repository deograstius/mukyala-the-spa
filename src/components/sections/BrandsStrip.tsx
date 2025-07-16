import { useState } from 'react';

interface BrandTestimonial {
  logo: string;
  quote: string;
}

const testimonials: Record<string, BrandTestimonial> = {
  Lookbook: {
    logo: '/images/lookbook-logo-icon-hair-x-webflow-template.svg',
    quote:
      '"Hair X creates magic with hair. They are undoubtedly the best salon in the USA, providing exceptional quality and service."',
  },
  Stylelish: {
    logo: '/images/stylelish-logo-icon-hair-x-webflow-template.svg',
    quote:
      '"The talented stylists at Hair X work wonders! They have earned their reputation as the best beauty salon in the USA."',
  },
  'Trendy Threads': {
    logo: '/images/trendy-threads-logo-icon-hair-x-webflow-template.svg',
    quote:
      '"Hair\'s exceptional skills and attention to detail have made them the best beauty salon in the entire USA!"',
  },
  Glamorous: {
    logo: '/images/glamorous-logo-icon-hair-x-webflow-template.svg',
    quote:
      '"Hair X knows how to exceed expectations. Their talented team consistently delivers stunning hair transformations. Couldn\'t imagine going anywhere else!"',
  },
};

const brandNames = Object.keys(testimonials);

function BrandsStrip() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeName = brandNames[activeIndex];
  const activeTestimonial = testimonials[activeName];

  return (
    <section className="section">
      <div className="w-layout-blockcontainer container-default w-container">
        <div className="card tab-card-wrapper">
          <div className="inner-container _1012px width-100">
            <div
              className="tabs-wrapper tab-flex-menu-bottom"
              role="region"
              aria-label="Brand testimonials"
            >
              <div className="tabs-menu-bottom" role="tablist">
                {brandNames.map((name, idx) => {
                  const { logo } = testimonials[name];
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={name}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`tab-image-item w-inline-block w-tab-link${
                        isActive ? ' w--current' : ''
                      } button-reset`}
                      onClick={() => setActiveIndex(idx)}
                    >
                      <img src={logo} alt={name} loading="eager" className="brand-logo" />
                    </button>
                  );
                })}
              </div>

              <div className="w-tab-content" role="tabpanel">
                <div className="inner-container _800px center">
                  <div className="text-center">
                    <p className="display-8 text-neutral-800">{activeTestimonial.quote}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BrandsStrip;
