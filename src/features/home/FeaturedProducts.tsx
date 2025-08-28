import MediaCard from '@shared/cards/MediaCard';
import ButtonLink from '@shared/ui/ButtonLink';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { useRef, useState } from 'react';

interface Product {
  title: string;
  price: string;
  image: string;
  imageSrcSet?: string;
  href: string;
}

// Real retail products – updated July 2025
const products: Product[] = [
  {
    title: 'Baobab & Peptide Glow Drops · 30 ml',
    price: '$32.00',
    image: '/images/baobab-peptide-glow-drops.jpg',
    imageSrcSet:
      '/images/baobab-peptide-glow-drops-p-500.jpg 500w, /images/baobab-peptide-glow-drops-p-800.jpg 800w, /images/baobab-peptide-glow-drops.jpg 1024w',
    href: '/shop/baobab-peptide-glow-drops',
  },
  {
    title: 'Kalahari Hydration Jelly Pod Duo',
    price: '$14.00',
    image: '/images/kalahari-hydration-jelly-pod-duo.jpg',
    imageSrcSet:
      '/images/kalahari-hydration-jelly-pod-duo-p-500.jpg 500w, /images/kalahari-hydration-jelly-pod-duo-p-800.jpg 800w, /images/kalahari-hydration-jelly-pod-duo.jpg 1024w',
    href: '/shop/kalahari-hydration-jelly-pod-duo',
  },
  {
    title: 'Rooibos Radiance Antioxidant Mist · 50 ml',
    price: '$19.00',
    image: '/images/rooibos-radiance-antioxidant-mist.jpg',
    imageSrcSet:
      '/images/rooibos-radiance-antioxidant-mist-p-500.jpg 500w, /images/rooibos-radiance-antioxidant-mist-p-800.jpg 800w, /images/rooibos-radiance-antioxidant-mist.jpg 1024w',
    href: '/shop/rooibos-radiance-antioxidant-mist',
  },
  {
    title: 'Shea Gold Overnight Renewal Balm · 20 g',
    price: '$38.00',
    image: '/images/shea-gold-overnight-renewal-balm.jpg',
    imageSrcSet:
      '/images/shea-gold-overnight-renewal-balm-p-500.jpg 500w, /images/shea-gold-overnight-renewal-balm-p-800.jpg 800w, /images/shea-gold-overnight-renewal-balm.jpg 1024w',
    href: '/shop/shea-gold-overnight-renewal-balm',
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
    <Section className="overflow-hidden">
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
              {products.map((product, idx) => (
                <div
                  key={product.title}
                  className="mg-right-30px w-slide"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${idx + 1} of ${products.length}`}
                  style={{ flex: '0 0 100%' }}
                >
                  <MediaCard
                    title={product.title}
                    price={product.price}
                    image={product.image}
                    imageSrcSet={product.imageSrcSet}
                    href={product.href}
                    wrapperClassName="image-wrapper border-radius-16px z-index-1"
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
