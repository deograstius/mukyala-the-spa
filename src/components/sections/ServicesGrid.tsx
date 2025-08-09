interface Service {
  title: string;
  image: string;
  imageSrcSet?: string;
  href: string;
}

// NOTE: Image assets for the four facial treatments below must be copied into
// `public/images/` following the naming convention used here.  Add responsive
// resized versions (500 w / 800 w / 1200 w) as done for other sections so that
// the `srcSet` values resolve correctly at runtime.

const services: Service[] = [
  {
    title: 'Baobab Glow Facial',
    image: '/images/baobab-glow-facial.jpg',
    imageSrcSet:
      '/images/baobab-glow-facial-p-500.jpg 500w, /images/baobab-glow-facial-p-800.jpg 800w, /images/baobab-glow-facial.jpg 1024w',
    href: '/services/baobab-glow-facial',
  },
  {
    title: 'Kalahari Melon Hydration Facial',
    image: '/images/kalahari-melon-hydration-facial.jpg',
    imageSrcSet:
      '/images/kalahari-melon-hydration-facial-p-500.jpg 500w, /images/kalahari-melon-hydration-facial-p-800.jpg 800w, /images/kalahari-melon-hydration-facial.jpg 1024w',
    href: '/services/kalahari-melon-hydration-facial',
  },
  {
    title: 'Rooibos Radiance Facial',
    image: '/images/rooibos-radiance-facial.jpg',
    imageSrcSet:
      '/images/rooibos-radiance-facial-p-500.jpg 500w, /images/rooibos-radiance-facial-p-800.jpg 800w, /images/rooibos-radiance-facial.jpg 1024w',
    href: '/services/rooibos-radiance-facial',
  },
  {
    title: 'Shea Gold Collagen Lift',
    image: '/images/shea-gold-collagen-lift.jpg',
    imageSrcSet:
      '/images/shea-gold-collagen-lift-p-500.jpg 500w, /images/shea-gold-collagen-lift-p-800.jpg 800w, /images/shea-gold-collagen-lift.jpg 1024w',
    href: '/services/shea-gold-collagen-lift',
  },
];

function ServicesGrid() {
  return (
    <section className="section pd-top-0px">
      <div className="w-layout-blockcontainer container-default w-container">
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
