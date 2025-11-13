import MediaCard from '@shared/cards/MediaCard';
import ButtonLink from '@shared/ui/ButtonLink';
import Container from '@shared/ui/Container';
import Reveal from '@shared/ui/Reveal';
import Section from '@shared/ui/Section';
import type { Product } from '@types/product';
import { useRef, useState } from 'react';
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

  const slideTo = (index: number) => {
    const total = items.length || 1;
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
              className="slider-mask w-slider-mask"
              style={{ display: 'flex', overflowX: 'hidden' }}
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
                      wrapperClassName="image-wrapper border-radius-16px aspect-square"
                      imageClassName="card-image _w-h-100 fit-cover"
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

          {/* CTA under the slider */}
          <div className="mg-top-46px">
            <Reveal>
              <div className="buttons-row justify-center">
                <ButtonLink href="/shop" size="large">
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
