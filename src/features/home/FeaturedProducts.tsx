import MediaCard from '@shared/cards/MediaCard';
import ButtonLink from '@shared/ui/ButtonLink';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { useRef, useState } from 'react';
import { featuredProductSlugs } from '../../data/featured';
import { shopProducts } from '../../data/products';

const products = featuredProductSlugs
  .map((slug) => shopProducts.find((p) => p.slug === slug))
  .filter((p): p is (typeof shopProducts)[number] => Boolean(p));
const fallbackProducts = products.length > 0 ? products : shopProducts;

function FeaturedProducts() {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const slideTo = (index: number) => {
    const total = products.length;
    const newIndex = (index + total) % total;
    setCurrent(newIndex);

    const track = trackRef.current;
    if (track) {
      // Calculate the width of a single slide based on the first child so the
      // slider works no matter how wide the visible mask is (previous version
      // used `track.clientWidth`, which equals the **total** width of all
      // slides when `display:flex`, causing the carousel to jump too far).
      const firstSlide = track.firstElementChild as HTMLElement | null;
      let slideWidth = 0;
      if (firstSlide) {
        const style = window.getComputedStyle(firstSlide);
        const marginRight = parseFloat(style.marginRight) || 0;
        slideWidth = firstSlide.clientWidth + marginRight;
      }

      track.scrollTo({
        left: slideWidth * newIndex,
        behavior: 'smooth',
      });
    }
  };

  const handlePrev = () => slideTo(current - 1);
  const handleNext = () => slideTo(current + 1);

  return (
    <Section className="overflow-hidden pd-top-100px">
      <Container>
        <h2 className="display-9 text-center">Featured products</h2>

        <div className="mg-top-40px">
          <div
            className="slider-wrapper buttons-center---mbl w-slider"
            aria-roledescription="carousel"
          >
            <div
              ref={trackRef}
              className="slider-mask w-slider-mask"
              style={{ display: 'flex', overflowX: 'hidden' }}
            >
              {fallbackProducts.map((product, idx) => (
                <div
                  key={product.title}
                  className="mg-right-30px w-slide"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${idx + 1} of ${fallbackProducts.length}`}
                  style={{ flex: '0 0 100%' }}
                >
                  <MediaCard
                    title={product.title}
                    priceCents={product.priceCents}
                    image={product.image}
                    imageSrcSet={product.imageSrcSet}
                    href={product.href}
                    wrapperClassName="image-wrapper border-radius-16px z-index-1 aspect-square"
                    imageClassName="card-image _w-h-100"
                    overlayClassName="bg-image-overlay z-index-1"
                    contentClassName="content-inside-image-bottom"
                    titleClassName="card-white-title display-7 text-neutral-100"
                  />
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
              <ButtonLink href="/shop" size="large">
                <div className="text-block">Browse our shop</div>
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default FeaturedProducts;
