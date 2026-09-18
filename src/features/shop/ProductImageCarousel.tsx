import type { ProductImage } from '@app-types/product';
import ImageCardMedia from '@shared/cards/ImageCardMedia';
import { useRef, useState } from 'react';

/**
 * Detail-page image carousel (#33) — the home Featured-products idiom
 * (native scroll-snap swipe, arrows, dots) reduced to one full-width slide
 * per view. Rendered only for 2+ images; a single image never gets chrome.
 */
export default function ProductImageCarousel({
  images,
  title,
}: {
  images: ProductImage[];
  title: string;
}) {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // One slide fills the mask, so the mask's own width is the slide width.
  const slideTo = (index: number) => {
    const total = images.length;
    const newIndex = (index + total) % total;
    setCurrent(newIndex);
    const track = trackRef.current;
    track?.scrollTo({ left: track.clientWidth * newIndex, behavior: 'smooth' });
  };

  // The mask scrolls natively (touch swipe); keep the index in sync so the
  // arrows and dots reflect the swiped position.
  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    const clamped = Math.max(0, Math.min(images.length - 1, index));
    if (clamped !== current) setCurrent(clamped);
  };

  return (
    <div>
      <div
        className="slider-wrapper w-slider"
        role="region"
        aria-label={`${title} photos`}
        aria-roledescription="carousel"
      >
        <div
          ref={trackRef}
          id="product-image-mask"
          className="slider-mask w-slider-mask native-scroll"
          onScroll={handleScroll}
        >
          {images.map((img, idx) => (
            <div
              key={img.src}
              className="w-slide"
              style={{ width: '100%', flexShrink: 0 }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${idx + 1} of ${images.length}`}
            >
              <ImageCardMedia
                src={img.src}
                srcSet={img.srcSet ?? undefined}
                sizes={img.sizes ?? undefined}
                alt={`${title} — photo ${idx + 1} of ${images.length}`}
                wrapperClassName="image-wrapper border-radius-16px"
                imageClassName="card-image _w-h-100"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => slideTo(current - 1)}
          className="secondary-button-icon large slider-button-left---top-right w-slider-arrow-left"
          aria-label="Previous photo"
          aria-controls="product-image-mask"
        >
          <span className="icon-font-rounded" aria-hidden="true">
            
          </span>
        </button>
        <button
          type="button"
          onClick={() => slideTo(current + 1)}
          className="secondary-button-icon large slider-button-right---top-right w-slider-arrow-right"
          aria-label="Next photo"
          aria-controls="product-image-mask"
        >
          <span className="icon-font-rounded" aria-hidden="true">
            
          </span>
        </button>
      </div>

      <div className="slider-dots" role="tablist" aria-label="Photo position">
        {images.map((img, idx) => (
          <button
            key={img.src}
            type="button"
            role="tab"
            aria-label={`Go to photo ${idx + 1}`}
            aria-current={idx === current ? 'true' : undefined}
            onClick={() => slideTo(idx)}
          />
        ))}
      </div>
    </div>
  );
}
