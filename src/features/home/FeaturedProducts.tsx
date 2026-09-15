import type { Product } from '@app-types/product';
import MediaCard from '@shared/cards/MediaCard';
import ButtonLink from '@shared/ui/ButtonLink';
import Container from '@shared/ui/Container';
import Reveal from '@shared/ui/Reveal';
import Section from '@shared/ui/Section';
import { useEffect, useRef, useState } from 'react';
import { featuredProductSlugs } from '../../data/featured';
import { shopProducts } from '../../data/products';

const defaultProducts = featuredProductSlugs
  .map((slug) => shopProducts.find((p) => p.slug === slug))
  .filter((p): p is (typeof shopProducts)[number] => Boolean(p));
const fallbackProducts = defaultProducts.length > 0 ? defaultProducts : shopProducts;

type FeaturedProductsProps = {
  products?: Product[];
  isLoading?: boolean;
};

function FeaturedProducts({ products, isLoading }: FeaturedProductsProps) {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const items = products && products.length > 0 ? products : fallbackProducts;

  // Number of reachable scroll positions. Several slides are visible per
  // view, so this is LESS than items.length — one dot per item left the
  // trailing dots unreachable (max scroll lands slides before the last).
  // Starts at items.length (jsdom / pre-layout fallback) and is corrected
  // from real geometry after mount and on resize.
  const [positions, setPositions] = useState(items.length);

  // Width of one slide (first child + its right margin) — the mask is
  // display:flex, so track.clientWidth would be the total of all slides.
  const slideWidth = () => {
    const track = trackRef.current;
    const firstSlide = track?.firstElementChild as HTMLElement | null;
    if (!track || !firstSlide) return 0;
    const style = window.getComputedStyle(firstSlide);
    const marginRight = parseFloat(style.marginRight) || 0;
    return firstSlide.clientWidth + marginRight;
  };

  useEffect(() => {
    const compute = () => {
      const track = trackRef.current;
      const width = slideWidth();
      if (!track || width === 0) return;
      const scrollable = track.scrollWidth - track.clientWidth;
      setPositions(Math.max(1, Math.min(items.length, Math.round(scrollable / width) + 1)));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [items.length]);

  const slideTo = (index: number) => {
    const total = positions || 1;
    const newIndex = (index + total) % total;
    setCurrent(newIndex);
    trackRef.current?.scrollTo({ left: slideWidth() * newIndex, behavior: 'smooth' });
  };

  // The mask scrolls natively (touch swipe / trackpad); keep the current
  // index in sync so the arrows and dots reflect the swiped position.
  const handleScroll = () => {
    const track = trackRef.current;
    const width = slideWidth();
    if (!track || width === 0) return;
    const index = Math.round(track.scrollLeft / width);
    const clamped = Math.max(0, Math.min(positions - 1, index));
    if (clamped !== current) setCurrent(clamped);
  };

  const handlePrev = () => slideTo(current - 1);
  const handleNext = () => slideTo(current + 1);

  return (
    <Section className="overflow-hidden section-pad-top-xl">
      <Container>
        <Reveal>
          <div className="title-left---content-right">
            <h2 className="display-9">Featured products</h2>
          </div>
        </Reveal>

        <div className="mg-top-40px">
          <div
            className="slider-wrapper buttons-center---mbl w-slider"
            role="region"
            aria-label="carousel"
            aria-roledescription="carousel"
            aria-busy={isLoading && !products?.length ? 'true' : undefined}
          >
            <div
              ref={trackRef}
              id="featured-products-mask"
              className="slider-mask w-slider-mask native-scroll"
              onScroll={handleScroll}
            >
              {items.map((product, idx) => {
                const href = product.href ?? (product.slug ? `/shop/${product.slug}` : '#');
                return (
                  <div
                    key={product.slug || product.title}
                    className="mg-right-30px w-slide"
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${idx + 1} of ${items.length}`}
                  >
                    <MediaCard
                      title={product.title}
                      priceCents={product.priceCents}
                      image={product.image}
                      imageSrcSet={product.imageSrcSet}
                      href={href}
                      ctaId={product.slug ? `product-card-${product.slug}` : undefined}
                      wrapperClassName="image-wrapper border-radius-16px aspect-square"
                      imageClassName="card-image _w-h-100 fit-cover"
                      priceClassName="display-7 text-neutral-800"
                      overlayChildren={
                        <div
                          className="button-icon-inside-link-wrapper bottom-left"
                          aria-hidden="true"
                        >
                          <div className="secondary-button-icon large no-hover">
                            <div className="accordion-icon-wrapper inside-button">
                              <div className="accordion-icon-line" />
                              <div className="accordion-icon-line vertical" />
                            </div>
                          </div>
                        </div>
                      }
                      contentClassName="mg-top-32px"
                    />
                  </div>
                );
              })}
            </div>

            {/* SLIDER CONTROLS */}
            <button
              type="button"
              onClick={handlePrev}
              className="secondary-button-icon large slider-button-left---top-right w-slider-arrow-left"
              aria-label="Previous slide"
              aria-controls="featured-products-mask"
              disabled={items.length < 2}
            >
              <span className="icon-font-rounded" aria-hidden="true">
                
              </span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="secondary-button-icon large slider-button-right---top-right w-slider-arrow-right"
              aria-label="Next slide"
              aria-controls="featured-products-mask"
              disabled={items.length < 2}
            >
              <span className="icon-font-rounded" aria-hidden="true">
                
              </span>
            </button>
          </div>

          {/* Position dots — one per reachable scroll position */}
          {positions > 1 ? (
            <div className="slider-dots" role="tablist" aria-label="Slide position">
              {Array.from({ length: positions }, (_, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-label={`Go to slide ${idx + 1}`}
                  aria-current={idx === current ? 'true' : undefined}
                  onClick={() => slideTo(idx)}
                />
              ))}
            </div>
          ) : null}

          {/* CTA under the slider */}
          <div className="mg-top-48px">
            <Reveal>
              <div className="buttons-row justify-center">
                <ButtonLink href="/shop" size="large" data-cta-id="featured-products-browse-shop">
                  <div className="text-block">Browse our shop</div>
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default FeaturedProducts;
