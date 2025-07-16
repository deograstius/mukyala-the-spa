import { useRef, useState } from 'react';

interface Product {
  title: string;
  price: string;
  image: string;
  imageSrcSet?: string;
  href: string;
}

// NOTE: These are placeholder products just so the slider renders something.
// Real product data can later be fetched from an API or a CMS.
const products: Product[] = [
  {
    title: 'Revitalizing Hair Mask',
    price: '$29.00',
    image: '/images/beauty-salon-drying-hair-and-brush-hair-x-webflow-template.jpg',
    imageSrcSet:
      '/images/beauty-salon-drying-hair-and-brush-hair-x-webflow-template-p-500.jpg 500w, /images/beauty-salon-drying-hair-and-brush-hair-x-webflow-template-p-800.jpg 800w, /images/beauty-salon-drying-hair-and-brush-hair-x-webflow-template.jpg 1202w',
    href: '/shop/revitalizing-hair-mask',
  },
  {
    title: 'Hydrating Shampoo',
    price: '$22.00',
    image: '/images/brown-makeup-brush-hair-x-webflow-template.jpg',
    imageSrcSet:
      '/images/brown-makeup-brush-hair-x-webflow-template-p-500.jpg 500w, /images/brown-makeup-brush-hair-x-webflow-template-p-800.jpg 800w, /images/brown-makeup-brush-hair-x-webflow-template.jpg 1202w',
    href: '/shop/hydrating-shampoo',
  },
  {
    title: 'Glow Facial Serum',
    price: '$35.00',
    image: '/images/brush-hair-beauty-salon-hair-x-webflow-template.jpg',
    imageSrcSet:
      '/images/brush-hair-beauty-salon-hair-x-webflow-template-p-500.jpg 500w, /images/brush-hair-beauty-salon-hair-x-webflow-template-p-800.jpg 800w, /images/brush-hair-beauty-salon-hair-x-webflow-template.jpg 1202w',
    href: '/shop/glow-facial-serum',
  },
  {
    title: 'Nourishing Conditioner',
    price: '$24.00',
    image: '/images/beauty-and-wellness-hero-hair-x-webflow-template-p-1080.jpg',
    imageSrcSet:
      '/images/beauty-and-wellness-hero-hair-x-webflow-template-p-500.jpg 500w, /images/beauty-and-wellness-hero-hair-x-webflow-template-p-800.jpg 800w, /images/beauty-and-wellness-hero-hair-x-webflow-template-p-1080.jpg 1080w',
    href: '/shop/nourishing-conditioner',
  },
];

function FeaturedProducts() {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const slideTo = (index: number) => {
    const total = products.length;
    const newIndex = (index + total) % total;
    setCurrent(newIndex);

    const track = trackRef.current;
    if (track) {
      const slideWidth = track.clientWidth;
      track.scrollTo({
        left: slideWidth * newIndex,
        behavior: 'smooth',
      });
    }
  };

  const handlePrev = () => slideTo(current - 1);
  const handleNext = () => slideTo(current + 1);

  return (
    <section className="section overflow-hidden">
      <div className="w-layout-blockcontainer container-default w-container">
        <h2 className="display-9 text-center">Featured products</h2>

        <div className="mg-top-40px">
          <div
            className="slider-wrapper buttons-center---mbl w-slider"
            aria-roledescription="carousel"
          >
            <div
              ref={trackRef}
              className="slider-mask width-520px w-slider-mask"
              style={{ display: 'flex', overflowX: 'hidden' }}
            >
              {products.map((product, idx) => (
                <div
                  key={product.title}
                  className="mg-right-30px w-slide"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${idx + 1} of ${products.length}`}
                  style={{ flex: '0 0 100%' }}
                >
                  <a
                    href={product.href}
                    className="text-decoration-none display-block w-inline-block"
                  >
                    <div className="image-wrapper border-radius-16px z-index-1">
                      <div className="bg-image-overlay z-index-1" />
                      <img
                        src={product.image}
                        srcSet={product.imageSrcSet}
                        alt={product.title}
                        className="card-image _w-h-100"
                        loading="lazy"
                      />
                    </div>
                    <div className="content-inside-image-bottom">
                      <div className="flex-horizontal space-between gap-16px---flex-wrap">
                        <h3 className="card-white-title display-7 text-neutral-100">
                          {product.title}
                        </h3>
                        <div className="display-7 text-neutral-100">{product.price}</div>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>

            {/* SLIDER CONTROLS */}
            <button
              type="button"
              onClick={handlePrev}
              className="secondary-button-icon large featured-products-white-button-left w-slider-arrow-left"
              aria-label="Previous slide"
            >
              <span className="icon-font-rounded" aria-hidden="true">
                
              </span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="secondary-button-icon large featured-products-white-button-right w-slider-arrow-right"
              aria-label="Next slide"
            >
              <span className="icon-font-rounded" aria-hidden="true">
                
              </span>
            </button>
          </div>

          {/* CTA under the slider */}
          <div className="mg-top-46px">
            <div className="buttons-row justify-center">
              <a href="/shop" className="button-primary large w-inline-block">
                <div className="text-block">Browse our shop</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturedProducts;
