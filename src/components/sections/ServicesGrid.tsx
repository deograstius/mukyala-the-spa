/**
 * "Our set of beauty services" grid section.
 *
 * The original Webflow template generated dynamic CMS items. For now we
 * hard-code a few representative services so that the section renders and
 * looks correct while we design the real data API.
 */

interface Service {
  title: string;
  image: string;
  imageSrcSet?: string;
  href: string;
}

const services: Service[] = [
  {
    title: 'Hair Styling',
    image: '/images/brush-hair-beauty-salon-hair-x-webflow-template.jpg',
    imageSrcSet:
      '/images/brush-hair-beauty-salon-hair-x-webflow-template-p-500.jpg 500w, /images/brush-hair-beauty-salon-hair-x-webflow-template-p-800.jpg 800w, /images/brush-hair-beauty-salon-hair-x-webflow-template.jpg 1202w',
    href: '/services/hair-styling',
  },
  {
    title: 'Coloring',
    image: '/images/beauty-salon-drying-hair-and-brush-hair-x-webflow-template.jpg',
    imageSrcSet:
      '/images/beauty-salon-drying-hair-and-brush-hair-x-webflow-template-p-500.jpg 500w, /images/beauty-salon-drying-hair-and-brush-hair-x-webflow-template-p-800.jpg 800w, /images/beauty-salon-drying-hair-and-brush-hair-x-webflow-template.jpg 1202w',
    href: '/services/coloring',
  },
  {
    title: 'Make-up',
    image: '/images/brown-makeup-brush-hair-x-webflow-template.jpg',
    imageSrcSet:
      '/images/brown-makeup-brush-hair-x-webflow-template-p-500.jpg 500w, /images/brown-makeup-brush-hair-x-webflow-template-p-800.jpg 800w, /images/brown-makeup-brush-hair-x-webflow-template.jpg 1202w',
    href: '/services/make-up',
  },
];

function ServicesGrid() {
  return (
    <section className="section pd-top-0px">
      <div className="w-layout-blockcontainer container-default w-container">
        {/* Title + buttons row */}
        <div className="title-left---content-right">
          <h2 className="display-9">Our set of beauty services</h2>
          <div className="buttons-row left">
            <a href="/reservation" className="button-primary large w-inline-block">
              <div className="text-block">Make a Reservation</div>
            </a>
            <a href="/services" className="link link-center w-inline-block">
              <div>Browse services</div>
              <div className="item-icon-right medium">
                <div className="icon-font-rounded"></div>
              </div>
            </a>
          </div>
        </div>

        {/* Services grid */}
        <div className="mg-top-32px">
          <div className="grid-2-columns gap-row-30px">
            {services.map((service) => (
              <a
                key={service.title}
                href={service.href}
                className="beauty-services-link-item w-inline-block"
              >
                <div className="bg-image-overlay overlay-15" />
                <div className="image-wrapper">
                  <img
                    src={service.image}
                    srcSet={service.imageSrcSet}
                    alt={service.title}
                    className="card-image _w-h-100"
                    loading="lazy"
                  />
                </div>
                <div className="content-card-services">
                  <div className="flex-horizontal space-between gap-16px---flex-wrap">
                    <h3 className="card-title display-7 text-neutral-100">{service.title}</h3>
                    <div className="secondary-button-icon white-button-inside-link">
                      <div className="icon-font-rounded diagonal-button-icon"></div>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ServicesGrid;
