const brands = [
  {
    name: 'Glamorous',
    logo: '/images/glamorous-logo-icon-hair-x-webflow-template.svg',
  },
  {
    name: 'Lookbook',
    logo: '/images/lookbook-logo-icon-hair-x-webflow-template.svg',
  },
  {
    name: 'Stylelish',
    logo: '/images/stylelish-logo-icon-hair-x-webflow-template.svg',
  },
  {
    name: 'Trendy Threads',
    logo: '/images/trendy-threads-logo-icon-hair-x-webflow-template.svg',
  },
];

function BrandsStrip() {
  return (
    <section className="section pd-0px">
      <div className="w-layout-blockcontainer container-default w-container">
        <div className="w-layout-grid grid-2-columns gap-row-32px align-center">
          {/* Quote */}
          <blockquote className="display-10">
            “The only limit to your beauty is your imagination.”
          </blockquote>

          {/* Brand logos */}
          <div className="flex-horizontal gap-40px wrap center">
            {brands.map((brand) => (
              <img
                key={brand.name}
                src={brand.logo}
                alt={brand.name}
                style={{ maxWidth: 120 }}
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default BrandsStrip;
